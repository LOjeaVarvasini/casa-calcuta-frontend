import { useState, useEffect, useCallback } from 'react';
import { getFamiliasRequest, createFamiliaRequest } from '../../config/api.js';
import './familias.css';

function Familias({ onNavegar }) {
  // Estados de datos reales
  const [familias, setFamilias] = useState([]);
  const [paginacion, setPaginacion] = useState(null);

  // Estados de UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Estados del modal de Nueva Familia
  const [showNuevoModal, setShowNuevoModal] = useState(false);
  const [formData, setFormData] = useState({
    direccion: '',
    telefono: '',
    puntaje_prioridad: '',
    prioridad_social: '',
    estado_lista: 'PRINCIPAL',
    fecha_ingreso: '',
    activa: true,
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(null);

  // ==========================================================================
  // CARGA INICIAL DE FAMILIAS DESDE LA API
  // ==========================================================================
  const cargarFamilias = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      queryParams.append('per_page', '15');

      if (priorityFilter) {
        const mapaPrioridad = {
          'muy-alta': 'muy_alta',
          'alta': 'alta',
          'media': 'media',
          'baja': 'baja',
          'muy-baja': 'muy_baja',
        };
        const valorReal = mapaPrioridad[priorityFilter] || priorityFilter;
        queryParams.append('prioridad_social', valorReal);
      }

      if (searchTerm) {
        queryParams.append('search', searchTerm);
      }

      const data = await getFamiliasRequest(queryParams.toString());
      setFamilias(data.data || []);
      setPaginacion({
        currentPage: data.current_page,
        lastPage: data.last_page,
        total: data.total,
      });
    } catch (err) {
      setError(err.message || 'Error al cargar las familias.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, priorityFilter]);

  useEffect(() => {
    cargarFamilias();
  }, [cargarFamilias]);

  // ==========================================================================
  // MANEJO DEL FORMULARIO DE NUEVA FAMILIA
  // ==========================================================================
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCrearFamilia = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const token = localStorage.getItem('access_token');
      let usuarioId = 1; // Forzamos un default seguro para testing continuo
      
      if (token) {
        try {
          const payloadBase64 = token.split('.')[1];
          // Reemplazo seguro de caracteres para atob en navegadores
          const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
          const payloadJson = JSON.parse(window.atob(base64));
          
          console.log("🍏 CONTENIDO REAL DEL JWT:", payloadJson); // Ver qué campos trae tu token
          usuarioId = payloadJson.sub || payloadJson.id_usuario || payloadJson.id || payloadJson.user_id || 1;
        } catch (jwtErr) {
          console.error("🚨 Error decodificando JWT:", jwtErr);
        }
      }

      // Sanitización estricta del payload para cumplir el contrato de Laravel:
      const payload = {
        direccion: formData.direccion,
        telefono: formData.telefono,
        puntaje_prioridad: parseInt(formData.puntaje_prioridad, 10) || 0,
        prioridad_social: formData.prioridad_social.toUpperCase(), // 🍏 Forzamos MAYÚSCULAS ("BAJA", "ALTA", etc.)
        estado_lista: formData.estado_lista.toUpperCase(),       // 🍏 Por seguridad, también en mayúsculas
        fecha_ingreso: formData.fecha_ingreso,
        activa: formData.activa ? 1 : 0, 
        registrado_por: parseInt(usuarioId, 10) || 1,              // 🍏 Forzamos entero puro (evita el string "1")
      };

      console.log("📦 PAYLOAD SANEADO FINAL:", payload);

      await createFamiliaRequest(payload);
      setSaveSuccess('Familia creada exitosamente.');

      setTimeout(() => {
        setShowNuevoModal(false);
        setFormData({
          direccion: '',
          telefono: '',
          puntaje_prioridad: '',
          prioridad_social: '',
          estado_lista: 'PRINCIPAL',
          fecha_ingreso: '',
          activa: true,
        });
        setSaveSuccess(null);
        cargarFamilias();
      }, 1500);
    } catch (err) {
      setSaveError(err.message || 'Error al crear la familia.');
    } finally {
      setSaving(false);
    }
  };

  const getBadgeClass = (prioridad) => {
    const mapa = {
      'muy_alta': 'badge-danger',
      'alta': 'badge-warning',
      'media': 'badge-primary',
      'baja': 'badge-success',
      'muy_baja': 'badge-success',
    };
    return mapa[prioridad] || 'badge-primary';
  };

  const getPrioridadLabel = (prioridad) => {
    const mapa = {
      'muy_alta': 'Muy Alta',
      'alta': 'Alta',
      'media': 'Media',
      'baja': 'Baja',
      'muy_baja': 'Muy Baja',
    };
    return mapa[prioridad] || prioridad;
  };

  return (
    <div>
      <section className="page-toolbar">
        <div className="search-filter-group">
          <div className="form-group" style={{ flex: 2 }}>
            <input
              type="search"
              placeholder="Buscar por apellido de referente o DNI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="">Todas las prioridades</option>
              <option value="muy-alta">Muy Alta</option>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </div>
        </div>
        <button
          className="btn-primary"
          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowNuevoModal(true)}
        >
          ➕ Nueva Familia
        </button>
      </section>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Cargando familias...</p>
        </div>
      )}

      {error && (
        <div className="login-error" style={{ marginBottom: 'var(--space-md)' }}>
          {error}
        </div>
      )}

      {!loading && !error && (
        <section className="families-grid">
          {familias.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', color: '#718096' }}>
              <p>No se encontraron familias.</p>
            </div>
          )}

          {familias.map((familia) => (
            <div className="family-card" key={familia.id_familia}>
              <header className="card-family-header">
                <div>
                  <h2 className="family-name">
                    {familia.referente
                      ? `${familia.referente.apellido}${familia.referente.nombre ? ', ' + familia.referente.nombre : ''}`
                      : `Familia #${familia.id_familia}`}
                  </h2>
                  <p className="referent-info">
                    Ref: {familia.referente ? `${familia.referente.nombre} ${familia.referente.apellido}` : '[Sin referente]'}
                    &nbsp;&bull;&nbsp;
                    DNI {familia.referente ? familia.referente.numero_documento : '[N/D]'}
                  </p>
                </div>
                <span className={`badge ${getBadgeClass(familia.prioridad_social)}`}>
                  {getPrioridadLabel(familia.prioridad_social)}
                </span>
              </header>
              <div className="card-family-body">
                <div className="metric-mini">🏠 <span>{familia.direccion || '[Sin dirección]'}</span></div>
                <div className="metric-mini">📞 <span>{familia.telefono || '[Sin teléfono]'}</span></div>
                <div className="metric-mini">
                  📋 <span>Estado: {familia.estado_lista === 'PRINCIPAL' ? 'Activo' : 'En Espera'}</span>
                </div>
              </div>
              <footer className="card-family-footer">
                <div className="table-actions-cell">
                  <button
                    type="button"
                    className="btn-table-action"
                    onClick={() => alert('[Navegación] Ver ficha de familia ID: ' + familia.id_familia)}
                  >
                    Ver ficha
                  </button>
                  <button
                    type="button"
                    className="btn-table-action action-secondary"
                    style={{ backgroundColor: 'rgba(0,0,0,0.04)', borderColor: 'rgba(0,0,0,0.08)', color: '#4a5568' }}
                    onClick={() => alert('[Navegación] Ver comisión de familia ID: ' + familia.id_familia)}
                  >
                    Comisión
                  </button>
                </div>
              </footer>
            </div>
          ))}
        </section>
      )}

      {paginacion && paginacion.lastPage > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
          <span style={{ fontSize: 'var(--text-sm)', color: '#718096' }}>
            Página {paginacion.currentPage} de {paginacion.lastPage} — Total: {paginacion.total} familias
          </span>
        </div>
      )}

      {showNuevoModal && (
        <div className="modal-overlay" onClick={() => setShowNuevoModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>➕ Nueva Familia</h3>
            </div>

            <form onSubmit={handleCrearFamilia} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1, minHeight: 0 }}>
              <div className="modal-body">
                {saveError && (
                  <div className="login-error" style={{ marginBottom: 'var(--space-md)' }}>
                    {saveError}
                  </div>
                )}
                {saveSuccess && (
                  <div className="login-success" style={{ marginBottom: 'var(--space-md)' }}>
                    {saveSuccess}
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="direccion">Dirección</label>
                  <input
                    id="direccion"
                    name="direccion"
                    type="text"
                    value={formData.direccion}
                    onChange={handleInputChange}
                    required
                    placeholder="Ej: Av. Siempreviva 742"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="telefono">Teléfono</label>
                  <input
                    id="telefono"
                    name="telefono"
                    type="text"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    required
                    placeholder="Ej: 555-0101"
                  />
                </div>

                <div className="form-grid-3">
                  <div className="form-group">
                    <label htmlFor="puntaje_prioridad">Puntaje Prioridad</label>
                    <input
                      id="puntaje_prioridad"
                      name="puntaje_prioridad"
                      type="number"
                      min="0"
                      max="20"
                      value={formData.puntaje_prioridad}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="prioridad_social">Prioridad Social</label>
                    <select
                      id="prioridad_social"
                      name="prioridad_social"
                      value={formData.prioridad_social}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Seleccionar...</option>
                      <option value="muy_alta">Muy Alta</option>
                      <option value="alta">Alta</option>
                      <option value="media">Media</option>
                      <option value="baja">Baja</option>
                      <option value="muy_baja">Muy Baja</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="estado_lista">Estado Lista</label>
                    <select
                      id="estado_lista"
                      name="estado_lista"
                      value={formData.estado_lista}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="PRINCIPAL">Principal</option>
                      <option value="ESPERA">Espera</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="fecha_ingreso">Fecha de Ingreso</label>
                  <input
                    id="fecha_ingreso"
                    name="fecha_ingreso"
                    type="date"
                    value={formData.fecha_ingreso}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', cursor: 'pointer' }}>
                    <input
                      name="activa"
                      type="checkbox"
                      checked={formData.activa}
                      onChange={handleInputChange}
                      style={{ width: 'auto', height: 'auto' }}
                    />
                    Familia Activa
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-table-action action-secondary"
                  style={{ backgroundColor: 'rgba(0,0,0,0.04)', borderColor: 'rgba(0,0,0,0.08)', color: '#4a5568', minHeight: '40px', padding: '0 1rem' }}
                  onClick={() => setShowNuevoModal(false)}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={saving}
                  style={{ minHeight: '40px' }}
                >
                  {saving ? 'Guardando...' : 'Guardar Familia'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Familias;