import React, { useState, useEffect, useMemo } from 'react';
import {
  getUsuariosAdminRequest,
  createUsuarioAdminRequest,
  updateUsuarioAdminRequest,
  deleteUsuarioAdminRequest
} from '../../config/api.js';
import './administracion.css';

const ROLES_DISPONIBLES = [
  { id: 1, nombre: 'Administrador', badgeClass: 'role-admin' },
  { id: 2, nombre: 'Coordinador', badgeClass: 'role-coordinador' },
  { id: 3, nombre: 'Encargado', badgeClass: 'role-encargado' },
  { id: 5, nombre: 'Voluntarios', badgeClass: 'role-voluntario' }
];

export default function Administracion() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🔍 ESTADOS DE FILTRADO
  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroRol, setFiltroRol] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  // Modales
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState(null);

  // Formulario
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    contrasena: '',
    contrasena_confirmation: '',
    activo: true,
    rol_id: 3
  });

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const response = await getUsuariosAdminRequest('per_page=100'); // Elevado para permitir filtrado integral en front
      setUsuarios(response.data || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message || 'No se pudo sincronizar la lista de usuarios.');
    } finally {
      setLoading(false);
    }
  };

  // 🍏 ALGORITMO DE FILTRADO REACTIVO EN CALIENTE (useMemo)
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((usr) => {
      // 1. Filtro por Nombre / Apellido / Email (Case Insensitive)
      const query = filtroNombre.toLowerCase().trim();
      const matchTexto = !query || 
        (usr.nombre || '').toLowerCase().includes(query) ||
        (usr.apellido || '').toLowerCase().includes(query) ||
        (usr.email || '').toLowerCase().includes(query);

      // 2. Filtro por Rol asignado
      const matchRol = !filtroRol || usr.rol?.id_rol === parseInt(filtroRol, 10);

      // 3. Filtro por Estado (Activo / Inactivo)
      let matchEstado = true;
      if (filtroEstado === 'activo') matchEstado = usr.activo === true || usr.activo === 1;
      if (filtroEstado === 'inactivo') matchEstado = usr.activo === false || usr.activo === 0;

      return matchTexto && matchRol && matchEstado;
    });
  }, [usuarios, filtroNombre, filtroRol, filtroEstado]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleOpenCreate = () => {
    setIsEditing(false);
    setFormData({
      nombre: '',
      apellido: '',
      email: '',
      contrasena: '',
      contrasena_confirmation: '',
      activo: true,
      rol_id: 3
    });
    setShowFormModal(true);
  };

  const handleOpenEdit = (usuario) => {
    setIsEditing(true);
    setSelectedUsuario(usuario);
    setFormData({
      nombre: usuario.nombre || '',
      apellido: usuario.apellido || '',
      email: usuario.email || '',
      contrasena: '', 
      contrasena_confirmation: '',
      activo: Boolean(usuario.activo),
      rol_id: usuario.rol?.id_rol || 3
    });
    setShowFormModal(true);
  };

  const handleOpenDelete = (usuario) => {
    setSelectedUsuario(usuario);
    setShowDeleteModal(true);
  };

  // 2 y 3. POST / PUT - Submit corregido con sanitización nativa
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (formData.contrasena !== formData.contrasena_confirmation) {
      alert("Las contraseñas no coinciden");
      return;
    }

    const payload = {
      nombre: formData.nombre.trim(),
      apellido: formData.apellido.trim(),
      email: formData.email.trim(),
      rol_id: parseInt(formData.rol_id, 10),
      activo: formData.activo ? 1 : 0 
    };

    if (!isEditing || formData.contrasena.length > 0) {
      payload.contrasena = formData.contrasena;
      payload.contrasena_confirmation = formData.contrasena_confirmation;
    }

    try {
      if (isEditing) {
        await updateUsuarioAdminRequest(selectedUsuario.id_usuario, payload);
        
        // 🍏 Alerta descriptiva para la actualización exitosa
        alert(`Los datos de "${payload.apellido}, ${payload.nombre}" se actualizaron correctamente en el sistema.`);
      } else {
        await createUsuarioAdminRequest(payload);
        
        // 🍏 Alerta descriptiva para la creación exitosa
        alert(`El usuario "${payload.apellido}, ${payload.nombre}" fue registrado con éxito.`);
      }
      
      setShowFormModal(false);
      fetchUsuarios();
    } catch (err) {
      console.error("Error en administración:", err);
      
      if (err.status === 422 || (err.data?.errors)) {
        const erroresLaravel = err.data?.errors || {};
        let mensajesLimpios = [];
        
        Object.keys(erroresLaravel).forEach(campo => {
          const errorTexto = erroresLaravel[campo].join(" ").toLowerCase();
          if (campo === 'email' && errorTexto.includes('taken')) {
            mensajesLimpios.push("• El correo electrónico ya está registrado por otro usuario.");
          } else if (campo === 'contrasena' || campo === 'password') {
            mensajesLimpios.push("• La contraseña no cumple con los requisitos o no coincide con la confirmación.");
          } else {
            mensajesLimpios.push(`• Revisá el campo ${campo}: datos inválidos.`);
          }
        });

        const textoAlerta = mensajesLimpios.length > 0 
          ? mensajesLimpios.join("\n") 
          : `• ${err.data?.message || "Hay campos inválidos en el formulario."}`;

        alert("No se pudo procesar la solicitud:\n\n" + textoAlerta);
        return;
      }

      if (err.status === 403) {
        alert("Acceso denegado:\n\nNo tenés los permisos administrativos requeridos para realizar esta acción.");
        return;
      }

      alert("Problema de conexión:\n\nNo se pudo comunicar con el servidor cloud. Intentá de nuevo en unos minutos.");
    }
  };

  // 4. DELETE - Confirmar baja (Corregido el string template de JavaScript)
  const handleConfirmDelete = async () => {
    try {
      await deleteUsuarioAdminRequest(selectedUsuario.id_usuario);
      
      // 🍏 REPARADO: Con el signo $ lee el objeto de forma correcta en memoria
      alert(`El usuario "${selectedUsuario.apellido}, ${selectedUsuario.nombre}" fue eliminado correctamente del sistema.`);
      
      setShowDeleteModal(false);
      fetchUsuarios(); // Recargamos las tarjetas
    } catch (err) {
      console.error("Error al eliminar:", err);
      
      if (err.status === 403) {
        alert("Acceso denegado:\n\nNo tenés los permisos requeridos para eliminar usuarios.");
      } else {
        alert("No se pudo completar la acción:\n\nHubo un problema con el servidor o el usuario ya no existe. Intentá refrescar la página.");
      }
    }
  };

  const getRoleClass = (idRol) => {
    const r = ROLES_DISPONIBLES.find(item => item.id === idRol);
    return r ? r.badgeClass : 'role-default';
  };

  return (
    <div className="admin-container" style={{ width: '100%' }}>
      
      <div className="info-profile-box" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
        <div>
          <span style={{ fontSize: 'var(--text-sm)', color: '#718096', fontWeight: 600 }}>Módulo de Seguridad</span>
          <strong style={{ display: 'block', fontSize: 'var(--text-md)', color: 'var(--color-primary)' }}>
            Usuarios con acceso al sistema corporativo
          </strong>
        </div>
        <button className="btn-primary" onClick={handleOpenCreate} style={{ minHeight: '40px' }}>
          Nuevo Usuario
        </button>
      </div>

      {/* 🔍 PANEL DE FILTROS MINIMALISTA */}
      <div className="admin-filter-bar">
        <div className="filter-group text-input-group">
          <input 
            type="text" 
            placeholder="Buscar por nombre, apellido o email..." 
            value={filtroNombre} 
            onChange={(e) => setFiltroNombre(e.target.value)}
            className="filter-control-input"
          />
        </div>
        <div className="filter-group select-group">
          <select 
            value={filtroRol} 
            onChange={(e) => setFiltroRol(e.target.value)}
            className="filter-control-select"
          >
            <option value="">Todos los roles</option>
            {ROLES_DISPONIBLES.map(r => (
              <option key={r.id} value={r.id}>{r.nombre}</option>
            ))}
          </select>
        </div>
        <div className="filter-group select-group">
          <select 
            value={filtroEstado} 
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="filter-control-select"
          >
            <option value="">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
        </div>
      </div>

      {error && <div className="login-error" style={{ marginBottom: 'var(--space-md)' }}>{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-primary)', fontWeight: 600 }}>
          Sincronizando cuentas con el servidor...
        </div>
      ) : (
        <div className="cards-grid">
          {usuariosFiltrados.length === 0 ? (
            <div className="empty-state">No se encontraron usuarios con los filtros aplicados.</div>
          ) : (
            usuariosFiltrados.map((usr) => (
              <div key={usr.id_usuario} className={`user-card ${getRoleClass(usr.rol?.id_rol)}`}>
                
                <div className="card-top-label"></div>

                <div className="card-meta-tags">
                  <span className="role-text-badge">{usr.rol?.nombre || 'Sin Rol'}</span>
                  <span className={`status-text-badge ${usr.activo ? 'active' : 'inactive'}`}>
                    {usr.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                <div className="card-main-info">
                  <span className="user-fullname">{usr.apellido}, {usr.nombre}</span>
                  <span className="user-email-separator">&bull;</span>
                  <span className="user-email">{usr.email}</span>
                </div>

                <div className="card-actions">
                  <button className="btn-card-action" onClick={() => handleOpenEdit(usr)}>
                    Editar
                  </button>
                  <button className="btn-card-action delete" onClick={() => handleOpenDelete(usr)}>
                    Eliminar
                  </button>
                </div>

              </div>
            ))
          )}
        </div>
      )}

      {/* MODAL: FORMULARIO */}
      {showFormModal && (
        <div className="modal-overlay" onClick={() => setShowFormModal(false)}>
          <div className="modal-box" style={{ maxWidth: '550px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{isEditing ? 'Actualizar Usuario' : 'Crear Nuevo Usuario'}</h3>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: '4px' }}>Nombre</label>
                    <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} className="form-control" required />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: '4px' }}>Apellido</label>
                    <input type="text" name="apellido" value={formData.apellido} onChange={handleInputChange} className="form-control" required />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: '4px' }}>Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="form-control" required />
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: '4px' }}>{isEditing ? 'Nueva Clave (Opcional)' : 'Contraseña'}</label>
                    <input type="password" name="contrasena" value={formData.contrasena} onChange={handleInputChange} className="form-control" required={!isEditing} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: '4px' }}>Confirmar Clave</label>
                    <input type="password" name="contrasena_confirmation" value={formData.contrasena_confirmation} onChange={handleInputChange} className="form-control" required={!isEditing || formData.contrasena.length > 0} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center', marginTop: 'var(--space-xs)' }}>
                  <div style={{ flex: 2 }}>
                    <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: '4px' }}>Rol de Sistema</label>
                    <select name="rol_id" value={formData.rol_id} onChange={handleInputChange} className="form-control" style={{ padding: '0 var(--space-xs)', height: '40px' }}>
                      {ROLES_DISPONIBLES.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1, paddingTop: '20px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                      <input type="checkbox" name="activo" checked={formData.activo} onChange={handleInputChange} style={{ width: '16px', height: '16px' }} />
                      Activo
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-overlay-footer" style={{ padding: 'var(--space-sm) var(--space-md)', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-xs)', backgroundColor: '#f7fafc' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowFormModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BAJA */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-box" style={{ maxWidth: '450px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ backgroundColor: '#fff5f5' }}>
              <h3 style={{ color: '#c53030' }}>Confirmar Baja</h3>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <p>¿Estás seguro de que deseas eliminar al usuario?</p>
              <div style={{ margin: 'var(--space-sm) 0', padding: 'var(--space-xs)', backgroundColor: '#f7fafc', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
                <strong>{selectedUsuario?.apellido}, {selectedUsuario?.nombre}</strong>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#718096' }}>{selectedUsuario?.email}</p>
              </div>
            </div>
            <div className="modal-overlay-footer" style={{ padding: 'var(--space-sm) var(--space-md)', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-xs)', backgroundColor: '#f7fafc' }}>
              <button className="btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancelar</button>
              <button className="btn-primary" style={{ backgroundColor: '#ef4444' }} onClick={handleConfirmDelete}>Eliminar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}