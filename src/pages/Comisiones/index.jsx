import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  createComisionRequest,
  createParticipacionComisionRequest,
  deleteComisionRequest,
  getComisionParticipacionesActivasRequest,
  getComisionesRequest,
  getFamiliasPrincipalesRequest,
  getIntegrantesRequest,
  getUsuariosRequest,
  updateComisionFamiliaRequest,
  updateComisionRequest,
} from '../../config/api.js';
import './comisiones.css';

const emptyComisionForm = {
  nombre: '',
  descripcion: '',
  encargado: '',
  activa: true,
};

const emptyParticipanteForm = {
  familia_id: '',
  integrante_id: '',
};

function Comisiones({ onNavegar, parametros }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  const esModoFamilia = Boolean(parametros?.familiaId);

  // Datos reales del backend
  const [familias, setFamilias] = useState([]);
  const [comisiones, setComisiones] = useState([]);
  const [usuariosEncargados, setUsuariosEncargados] = useState([]);
  const [familiasDisponibles, setFamiliasDisponibles] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingComision, setEditingComision] = useState(null);
  const [formData, setFormData] = useState(emptyComisionForm);
  const [savingComision, setSavingComision] = useState(false);
  const [deletingComisionId, setDeletingComisionId] = useState(null);
  const [participacionesActivas, setParticipacionesActivas] = useState([]);
  const [loadingParticipaciones, setLoadingParticipaciones] = useState(false);
  const [participacionesError, setParticipacionesError] = useState(null);
  const [isParticipanteFormOpen, setIsParticipanteFormOpen] = useState(false);
  const [participanteForm, setParticipanteForm] = useState(emptyParticipanteForm);
  const [savingParticipacion, setSavingParticipacion] = useState(false);
  const [participacionActionId, setParticipacionActionId] = useState(null);
  const [integrantesFamiliaSeleccionada, setIntegrantesFamiliaSeleccionada] = useState([]);
  const [loadingIntegrantesFamilia, setLoadingIntegrantesFamilia] = useState(false);
  const [integrantesFamiliaError, setIntegrantesFamiliaError] = useState(null);

  const formatearEncargado = (encargado) => {
    if (!encargado) return 'Sin encargado';
    const nombreCompleto = `${encargado.nombre || ''} ${encargado.apellido || ''}`.trim();
    return nombreCompleto || encargado.email || 'Sin encargado';
  };

  const formatearUsuarioOpcion = (usuario) => {
    const nombreCompleto = `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim();
    const base = nombreCompleto || usuario.email || `Usuario #${usuario.id_usuario}`;
    const rolNombre = usuario.rol?.nombre ? ` - ${usuario.rol.nombre}` : '';
    return `${base}${rolNombre}`;
  };

  const formatearFamiliaOpcion = (familia) => {
    const ref = familia.referente || {};
    const nombreReferente = `${ref.nombre || ''} ${ref.apellido || ''}`.trim();
    return nombreReferente ? `Familia #${familia.id_familia} - ${nombreReferente}` : `Familia #${familia.id_familia}`;
  };

  const formatearParticipantes = (valor) => {
    if (valor === null || valor === undefined || valor === '') return '0';
    const numero = Number.parseInt(valor, 10);
    return Number.isNaN(numero) ? String(valor) : String(numero);
  };

  const formatearFechaLegible = (fechaISO) => {
    if (!fechaISO) return 'No informada';
    const fecha = new Date(fechaISO);
    if (Number.isNaN(fecha.getTime())) return 'No informada';
    return fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatearNombreIntegrante = (integrante) => {
    const nombreCompleto = `${integrante.nombre || ''} ${integrante.apellido || ''}`.trim();
    return nombreCompleto || `Participante #${integrante.id_integrante}`;
  };

  const getCategoriaBadgeClass = (categoria) => {
    const normalized = (categoria || '').toString().toUpperCase().trim();
    if (normalized === 'ADULTO') return 'badge badge-success';
    if (normalized === 'NIÑO' || normalized === 'NINO' || normalized === 'INFANTE') return 'badge badge-warning';
    return 'badge badge-primary';
  };

  const formatTipoParticipante = (integrante) => (integrante.referente ? 'Referente' : 'Participante');

  const formatearCategoria = (categoria) => {
    const normalized = (categoria || '').toString().toUpperCase().trim();
    if (!normalized) return '[N/D]';
    return normalized[0] + normalized.slice(1).toLowerCase();
  };

  const cargarParticipacionesActivas = useCallback(async (comisionId) => {
    setLoadingParticipaciones(true);
    setParticipacionesError(null);

    try {
      const respuesta = await getComisionParticipacionesActivasRequest(comisionId);
      const data = Array.isArray(respuesta) ? respuesta : (respuesta?.data || []);
      setParticipacionesActivas(data);
    } catch (err) {
      setParticipacionesActivas([]);
      setParticipacionesError(err.message || 'No se pudieron cargar las participaciones activas.');
    } finally {
      setLoadingParticipaciones(false);
    }
  }, []);

  const openParticipanteForm = () => {
    setParticipanteForm(emptyParticipanteForm);
    setIntegrantesFamiliaSeleccionada([]);
    setIntegrantesFamiliaError(null);
    setLoadingIntegrantesFamilia(false);
    setIsParticipanteFormOpen(true);
  };

  const closeParticipanteForm = () => {
    setIsParticipanteFormOpen(false);
    setParticipanteForm(emptyParticipanteForm);
    setIntegrantesFamiliaSeleccionada([]);
    setIntegrantesFamiliaError(null);
    setLoadingIntegrantesFamilia(false);
  };

  const handleParticipanteFormChange = (event) => {
    const { name, value } = event.target;
    setParticipanteForm((prev) => {
      if (name === 'familia_id') {
        return {
          ...prev,
          familia_id: value,
          integrante_id: '',
        };
      }

      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const guardarParticipacion = async ({ integranteId, estado, observaciones }) => {
    if (!editingComision?.id_comision) return;

    setSavingParticipacion(true);
    setParticipacionesError(null);

    try {
      await createParticipacionComisionRequest({
        fecha_inicio: new Date().toISOString().slice(0, 10),
        estado,
        observaciones: observaciones || (estado === 'activo' ? 'Alta desde frontend' : 'Baja desde frontend'),
        integrante_id: Number.parseInt(integranteId, 10),
        comision_id: editingComision.id_comision,
      });

      await cargarParticipacionesActivas(editingComision.id_comision);
      closeParticipanteForm();
    } catch (err) {
      setParticipacionesError(err.message || 'No se pudo guardar la participación.');
    } finally {
      setSavingParticipacion(false);
    }
  };

  const handleGuardarParticipante = async () => {
    if (!participanteForm.familia_id) {
      setParticipacionesError('Debés seleccionar una familia.');
      return;
    }

    if (!participanteForm.integrante_id) {
      setParticipacionesError('Debés indicar un participante.');
      return;
    }

    await guardarParticipacion({
      integranteId: participanteForm.integrante_id,
      estado: 'activo',
      observaciones: 'Alta desde frontend',
    });
  };

  const handleEliminarParticipante = async (integranteId) => {
    const confirmacion = window.confirm('¿Eliminar este participante de la comisión?');
    if (!confirmacion || !editingComision?.id_comision) return;

    setParticipacionActionId(integranteId);
    try {
      await guardarParticipacion({
        integranteId,
        estado: 'inactivo',
        observaciones: 'Baja desde frontend',
      });
    } finally {
      setParticipacionActionId(null);
    }
  };

  // Cargar el padrón de familias activas principales
  const cargarFamilias = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (esModoFamilia) {
        const respuesta = await getFamiliasPrincipalesRequest('per_page=100');
        const data = respuesta.data || [];

        // Filtramos solo las familias de la lista PRINCIPAL y activas
        let filtradas = data.filter(
          (f) => (f.estado_lista || '').toUpperCase() === 'PRINCIPAL' && f.activa === true
        );

        // Si venimos filtrados por ID desde otra pantalla
        if (parametros?.familiaId) {
          filtradas = filtradas.filter((f) => f.id_familia === parseInt(parametros.familiaId, 10));
        }

        setFamilias(filtradas);
        setComisiones([]);
        setUsuariosEncargados([]);
        setFamiliasDisponibles([]);
      } else {
        const [respuestaComisiones, respuestaUsuarios, respuestaFamilias] = await Promise.all([
          getComisionesRequest('per_page=15'),
          getUsuariosRequest('per_page=15'),
          getFamiliasPrincipalesRequest('per_page=100'),
        ]);

        setComisiones(respuestaComisiones.data || []);
        const familiasFiltradas = (respuestaFamilias.data || []).filter(
          (f) => (f.estado_lista || '').toUpperCase() === 'PRINCIPAL' && f.activa === true
        );
        setFamiliasDisponibles(familiasFiltradas);
        const usuarios = respuestaUsuarios.data || [];
        setUsuariosEncargados(
          usuarios.filter((usuario) => Number(usuario?.rol?.id_rol) === 3 && (usuario.activo === true || usuario.activo === 1 || usuario.activo === '1'))
        );
        setFamilias([]);
      }
    } catch (err) {
      setError(err.message || (esModoFamilia ? 'No se pudieron sincronizar las comisiones.' : 'No se pudieron cargar las comisiones.'));
      setFamilias([]);
      setComisiones([]);
      setUsuariosEncargados([]);
      setFamiliasDisponibles([]);
    } finally {
      setLoading(false);
    }
  }, [esModoFamilia, parametros]);

  useEffect(() => {
    cargarFamilias();
  }, [cargarFamilias]);

  // Buscador reactivo en caliente
  const registrosFiltrados = useMemo(() => {
    const query = busqueda.toLowerCase().trim();
    if (esModoFamilia) {
      if (!query) return familias;

      return familias.filter((f) => {
        const apellido = (f.referente?.apellido || '').toLowerCase();
        const nombre = (f.referente?.nombre || '').toLowerCase();
        return apellido.includes(query) || nombre.includes(query);
      });
    }

    if (!query) return comisiones;

    return comisiones.filter((comision) => {
      const nombre = (comision.nombre || '').toLowerCase();
      const descripcion = (comision.descripcion || '').toLowerCase();
      const encargado = formatearEncargado(comision.encargado).toLowerCase();
      const email = (comision.encargado?.email || '').toLowerCase();
      return nombre.includes(query) || descripcion.includes(query) || encargado.includes(query) || email.includes(query);
    });
  }, [familias, comisiones, busqueda, esModoFamilia]);

  const resumenComisiones = useMemo(() => {
    const total = comisiones.length;
    const activas = comisiones.filter((comision) => comision.activa === true).length;
    return { total, activas, inactivas: total - activas };
  }, [comisiones]);

  const usuariosEncargadosFormulario = useMemo(() => {
    const lista = [...usuariosEncargados];
    const encargadoActual = editingComision?.encargado;

    if (encargadoActual?.id_usuario && !lista.some((usuario) => usuario.id_usuario === encargadoActual.id_usuario)) {
      lista.unshift(encargadoActual);
    }

    return lista;
  }, [usuariosEncargados, editingComision]);

  const cargarIntegrantesFamiliaSeleccionada = useCallback(async (familiaId) => {
    if (!familiaId) {
      setIntegrantesFamiliaSeleccionada([]);
      setIntegrantesFamiliaError(null);
      return;
    }

    setLoadingIntegrantesFamilia(true);
    setIntegrantesFamiliaError(null);

    try {
      const data = await getIntegrantesRequest(familiaId);
      const integrantes = Array.isArray(data) ? data : (data?.data || []);
      setIntegrantesFamiliaSeleccionada(integrantes);
    } catch (err) {
      setIntegrantesFamiliaSeleccionada([]);
      setIntegrantesFamiliaError(err.message || 'No se pudieron cargar los integrantes de la familia.');
    } finally {
      setLoadingIntegrantesFamilia(false);
    }
  }, []);

  useEffect(() => {
    if (!isParticipanteFormOpen) return;
    cargarIntegrantesFamiliaSeleccionada(participanteForm.familia_id);
  }, [isParticipanteFormOpen, participanteForm.familia_id, cargarIntegrantesFamiliaSeleccionada]);

  // Manejar el cambio automático de comisión en el select
  const handleComisionChange = async (familiaId, nuevaComision) => {
    try {
      // Impactamos directo en Laravel Cloud
      await updateComisionFamiliaRequest(familiaId, nuevaComision);

      // Actualizamos el estado local de inmediato para mantener consistencia visual
      setFamilias((prev) =>
        prev.map((f) =>
          f.id_familia === familiaId ? { ...f, prioridad_social: nuevaComision } : f
        )
      );
    } catch (err) {
      alert(err.message || 'No se pudo guardar el cambio de comisión.');
    }
  };

  const handleOpenHistory = (familia) => {
    setSelectedFamily(familia);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedFamily(null);
  };

  const handleOpenCreateModal = () => {
    setEditingComision(null);
    setFormData(emptyComisionForm);
    setParticipacionesActivas([]);
    setParticipacionesError(null);
    setLoadingParticipaciones(false);
    setParticipanteForm(emptyParticipanteForm);
    setIntegrantesFamiliaSeleccionada([]);
    setIntegrantesFamiliaError(null);
    setLoadingIntegrantesFamilia(false);
    setIsParticipanteFormOpen(false);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = async (comision) => {
    setEditingComision(comision);
    setFormData({
      nombre: comision.nombre || '',
      descripcion: comision.descripcion || '',
      encargado: comision.encargado?.id_usuario ?? '',
      activa: Boolean(comision.activa),
    });
    setParticipacionesActivas([]);
    setParticipacionesError(null);
    setIsFormModalOpen(true);
    setParticipanteForm(emptyParticipanteForm);
    setIntegrantesFamiliaSeleccionada([]);
    setIntegrantesFamiliaError(null);
    setLoadingIntegrantesFamilia(false);
    setIsParticipanteFormOpen(false);

    await cargarParticipacionesActivas(comision.id_comision);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setEditingComision(null);
    setFormData(emptyComisionForm);
    setParticipacionesActivas([]);
    setParticipacionesError(null);
    setLoadingParticipaciones(false);
    setParticipanteForm(emptyParticipanteForm);
    setIntegrantesFamiliaSeleccionada([]);
    setIntegrantesFamiliaError(null);
    setLoadingIntegrantesFamilia(false);
    setIsParticipanteFormOpen(false);
  };

  const handleFormChange = (event) => {
    const { name, type, checked, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleGuardarComision = async (event) => {
    event.preventDefault();
    setSavingComision(true);
    setError(null);

    try {
      if (editingComision) {
        await updateComisionRequest(editingComision.id_comision, formData);
      } else {
        await createComisionRequest(formData);
      }

      handleCloseFormModal();
      await cargarFamilias();
    } catch (err) {
      setError(err.message || 'No se pudo guardar la comisión.');
    } finally {
      setSavingComision(false);
    }
  };

  const handleEliminarComision = async (comision) => {
    const confirmacion = window.confirm(`¿Eliminar la comisión "${comision.nombre || `#${comision.id_comision}`}"?`);
    if (!confirmacion) return;

    setDeletingComisionId(comision.id_comision);
    setError(null);

    try {
      await deleteComisionRequest(comision.id_comision);
      await cargarFamilias();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar la comisión.');
    } finally {
      setDeletingComisionId(null);
    }
  };

  const renderCatalogoComisiones = () => (
    <section className="comisiones-grid">
      {registrosFiltrados.length === 0 && (
        <div className="comisiones-empty-state">
          No se encontraron comisiones que coincidan con la búsqueda.
        </div>
      )}

      {registrosFiltrados.map((comision) => {
        const encargado = comision.encargado || {};

        return (
          <article className="comision-card" key={comision.id_comision}>
            <header className="card-comision-header">
              <div>
                <h2 className="comision-name">
                  {comision.nombre || `Comisión #${comision.id_comision}`}
                </h2>
                <p className="comision-ref-info">
                  Encargado: {formatearEncargado(encargado)}
                  <br />
                  {encargado.email || 'Sin email'}
                </p>
              </div>

              <span className={`badge ${comision.activa ? 'badge-success' : 'badge-danger'}`}>
                {comision.activa ? 'Activa' : 'Inactiva'}
              </span>
            </header>

            <div className="card-comision-body">
              <div className="metric-mini">👥 <span>{formatearParticipantes(comision.participantes)} participantes</span></div>
              <div className="metric-mini">🧾 <span>ID {comision.id_comision}</span></div>
              <div className="comision-description-box">
                <span>Descripción</span>
                <strong>{comision.descripcion || 'Sin descripción'}</strong>
              </div>
            </div>

            <footer className="card-comision-footer">
              <div className="table-actions-cell">
                <button
                  type="button"
                  className="btn-table-action"
                  style={{ minHeight: '34px', padding: '0 0.75rem', fontSize: '0.72rem' }}
                  onClick={() => handleOpenEditModal(comision)}
                >
                  ✏️ Editar
                </button>
                <button
                  type="button"
                  className="btn-table-action"
                  style={{ backgroundColor: 'rgb(229, 62, 62)', color: '#ffffff', borderColor: 'rgb(229, 62, 62)', minHeight: '34px', padding: '0 0.75rem', fontSize: '0.72rem' }}
                  disabled={deletingComisionId === comision.id_comision}
                  onClick={() => handleEliminarComision(comision)}
                >
                  {deletingComisionId === comision.id_comision ? '⏳ Borrando...' : '🗑️ Eliminar'}
                </button>
              </div>
            </footer>
          </article>
        );
      })}
    </section>
  );

  const renderModoFamilia = () => (
    <section className="table-responsive-container">
      <table className="custom-table custom-table-responsive">
        <thead>
          <tr>
            <th>Familia Beneficiaria</th>
            <th>Integrantes Mayores</th>
            <th>Comisión Actual</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {registrosFiltrados.length === 0 && (
            <tr>
              <td colSpan="4" className="comisiones-empty-state">
                No se encontraron registros que coincidan con la búsqueda.
              </td>
            </tr>
          )}

          {registrosFiltrados.map((f) => {
            const ref = f.referente || {};

            // Calculamos dinámicamente si hay datos de integrantes mayores, o dejamos 1 por defecto (el referente)
            const mayoresCount = f.puntaje_menores ? parseInt(f.puntaje_menores, 10) : 1;

            // Mapeamos el string de la comisión (usando prioridad_social o la prop que use Ignacio como placeholder provisional)
            // ⚠️ NOTA TÉCNICA: este mapeo pierde información. 'baja' -> cocina, 'media' -> ropero,
            // y CUALQUIER otro valor (incluyendo 'limpieza' real) cae en 'ninguna'. Revisar con backend
            // si 'comision_actual' debería ser un campo propio en vez de reusar 'prioridad_social'.
            const comisionActual = f.prioridad_social === 'baja' ? 'cocina' : f.prioridad_social === 'media' ? 'ropero' : 'ninguna';

            return (
              <tr key={f.id_familia}>
                <td data-label="Familia">
                  <strong>{ref.apellido || `Familia #${f.id_familia}`}</strong>
                  <p className="comisiones-ref-text">
                    Ref: {ref.nombre || '[Sin Nombre]'} {ref.apellido || ''}
                  </p>
                </td>
                <td data-label="Mayores">
                  {mayoresCount} Adulto{mayoresCount !== 1 ? 's' : ''}
                </td>
                <td data-label="Comisión">
                  <select
                    className="form-control select-comision"
                    value={comisionActual}
                    onChange={(e) => handleComisionChange(f.id_familia, e.target.value)}
                  >
                    <option value="cocina">🍳 Cocina y Porciones</option>
                    <option value="ropero">👕 Ropero Comunitario</option>
                    <option value="limpieza">🧹 Limpieza e Higiene</option>
                    <option value="ninguna">❌ Sin Asignar</option>
                  </select>
                </td>
                <td data-label="Acciones">
                  <div className="table-actions-cell">
                    <button
                      className="btn-table-action"
                      onClick={() => handleOpenHistory({ ...f, comisionActual, apellidoFamilia: ref.apellido, referente: `${ref.nombre} ${ref.apellido}` })}
                    >
                      Ver Historial
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );

  return (
    <div className="comisiones-module">

      {error && <div className="login-error comisiones-error-banner">{error}</div>}

      {/* CAJA INFORMATIVA */}
      <div className="info-profile-box comisiones-info-box">
        {esModoFamilia ? (
          <p className="comisiones-info-text">
            💡 Las comisiones distribuyen las tareas obligatorias del merendero entre las familias beneficiarias de la Lista Principal. Los cambios en el selector se impactan automáticamente en el servidor cloud.
          </p>
        ) : (
          <>
            <p className="comisiones-info-text">
              💡 Este catálogo muestra las comisiones disponibles registradas en el sistema, con su encargado, descripción y estado.
            </p>
            <div className="comisiones-summary">
              <span className="badge badge-primary">Total: {resumenComisiones.total}</span>
              <span className="badge badge-success">Activas: {resumenComisiones.activas}</span>
              <span className="badge badge-danger">Inactivas: {resumenComisiones.inactivas}</span>
            </div>
          </>
        )}
      </div>

      {/* BARRA DE BÚSQUEDA */}
      <section className="page-toolbar comisiones-toolbar">
        <input
          type="text"
          placeholder={esModoFamilia ? '🔍 Buscar familia por apellido o referente...' : '🔍 Buscar comisión, encargado o descripción...'}
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="form-control comisiones-search-input"
        />
        <div className="comisiones-toolbar-actions">
          {!esModoFamilia && (
            <button
              type="button"
              className="btn-primary"
              style={{ minHeight: '40px', padding: '0 1.5rem', whiteSpace: 'nowrap' }}
              onClick={handleOpenCreateModal}
            >
              ➕ Nueva comisión
            </button>
          )}
        </div>
      </section>

      {loading && (
        <div className="comisiones-loading-state">
          {esModoFamilia ? 'Sincronizando asignación de comisiones...' : 'Cargando comisiones disponibles...'}
        </div>
      )}

      {/* TABLA RESPONSIVE */}
      {!loading && !error && (esModoFamilia ? renderModoFamilia() : renderCatalogoComisiones())}

      {/* MODAL: ALTA / EDICIÓN DE COMISIONES */}
      {!esModoFamilia && isFormModalOpen && (
        <div className="modal-overlay" onClick={handleCloseFormModal}>
          <div className="modal-box comisiones-form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingComision ? `🧾 Editar Comisión #${editingComision.id_comision}` : '🧾 Nueva Comisión'}</h3>
            </div>
            <form className="modal-body comisiones-form-body" onSubmit={handleGuardarComision}>
              <p className="comisiones-edit-form-note">
                La comisión se administra desde esta ficha. Acá actualizás los datos generales y sus participantes.
              </p>
              <div className="comisiones-form-grid">
                <label className="comisiones-form-field">
                  <span>Nombre</span>
                  <input
                    className="form-control"
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleFormChange}
                    required
                    autoComplete="off"
                  />
                </label>

                <label className="comisiones-form-field">
                  <span>Encargado</span>
                  <select
                    className="form-control"
                    name="encargado"
                    value={formData.encargado}
                    onChange={handleFormChange}
                  >
                    <option value="">Sin encargado</option>
                    {usuariosEncargadosFormulario.map((usuario) => (
                      <option key={usuario.id_usuario} value={usuario.id_usuario}>
                        {formatearUsuarioOpcion(usuario)}
                        {editingComision?.encargado?.id_usuario === usuario.id_usuario ? ' (actual)' : ''}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="comisiones-form-field comisiones-form-field-full">
                  <span>Descripción</span>
                  <input
                    className="form-control"
                    type="text"
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleFormChange}
                    placeholder="Descripción de la comisión"
                  />
                </label>

                <label className="comisiones-form-switch">
                  <input
                    type="checkbox"
                    name="activa"
                    checked={formData.activa}
                    onChange={handleFormChange}
                  />
                  <span>Comisión activa</span>
                </label>
              </div>

              {editingComision && (
                <section className="comisiones-participaciones-section">
                  <div className="section-heading">
                    <div>
                      <h4>👥 Participantes de la comisión</h4>
                      <p>Editá cada miembro desde esta ficha.</p>
                    </div>
                    <button
                      type="button"
                      className="btn-table-action comisiones-add-participante-btn"
                      onClick={openParticipanteForm}
                    >
                      ➕ Añadir participante
                    </button>
                  </div>

                  {participacionesError && (
                    <div className="login-error comisiones-participaciones-error">
                      {participacionesError}
                    </div>
                  )}

                      {isParticipanteFormOpen && (
                    <div className="comisiones-participante-form">
                      <div className="comisiones-participante-form-grid">
                        <label className="comisiones-form-field">
                          <span>Familia</span>
                          <select
                            className="form-control"
                            name="familia_id"
                            value={participanteForm.familia_id}
                            onChange={handleParticipanteFormChange}
                            required
                          >
                            <option value="">Seleccionar familia...</option>
                            {familiasDisponibles.map((familia) => (
                              <option key={familia.id_familia} value={familia.id_familia}>
                                {formatearFamiliaOpcion(familia)}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="comisiones-form-field">
                          <span>Participante de familia</span>
                          <select
                            className="form-control"
                            name="integrante_id"
                            value={participanteForm.integrante_id}
                            onChange={handleParticipanteFormChange}
                            disabled={!participanteForm.familia_id || loadingIntegrantesFamilia}
                            required
                          >
                            <option value="">
                              {loadingIntegrantesFamilia ? 'Cargando...' : 'Seleccionar participante...'}
                            </option>
                            {integrantesFamiliaSeleccionada.map((integrante) => (
                              <option key={integrante.id_integrante} value={integrante.id_integrante}>
                                {formatearNombreIntegrante(integrante)} — DNI {integrante.numero_documento || '[N/D]'}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      {integrantesFamiliaError && (
                        <div className="login-error comisiones-participaciones-error">
                          {integrantesFamiliaError}
                        </div>
                      )}

                      <div className="modal-footer comisiones-form-footer">
                        <button type="button" className="btn-table-action action-secondary" onClick={closeParticipanteForm} style={{ backgroundColor: 'rgba(0,0,0,0.04)', borderColor: 'rgba(0,0,0,0.08)', color: '#4a5568', minHeight: '40px', padding: '0 1rem' }}>
                          Cancelar
                        </button>
                        <button type="button" className="btn-primary" onClick={handleGuardarParticipante} disabled={savingParticipacion} style={{ padding: '0 1rem', minHeight: '40px' }}>
                          {savingParticipacion ? '⏳ Guardando...' : '💾 Guardar participante'}
                        </button>
                      </div>
                    </div>
                  )}

                  {loadingParticipaciones ? (
                    <div className="comisiones-participaciones-loading">
                      👥 Cargando participantes activos...
                    </div>
                  ) : participacionesActivas.length === 0 ? (
                    <div className="comisiones-participaciones-empty-state">
                      No hay participantes cargados para esta comisión.
                    </div>
                  ) : (
                    <div className="comisiones-participaciones-grid">
                      {participacionesActivas.map((participante) => {
                        const nombreCompleto = formatearNombreIntegrante(participante);
                        const categoria = (participante.categoria_etaria || '').toString().toUpperCase().trim();

                        return (
                          <article className="comision-participacion-card" key={participante.id_integrante}>
                            <div className="comision-participacion-card-header">
                              <div>
                                <h5>{nombreCompleto}</h5>
                                <p>
                                  DNI {participante.numero_documento || '[N/D]'}
                                  &nbsp;&bull;&nbsp;
                                  Familia #{participante.familia_id || '[N/D]'}
                                </p>
                              </div>

                              <div className="comision-participacion-badges">
                                <span className={participante.referente ? 'badge badge-success' : 'badge badge-primary'}>
                                  {formatTipoParticipante(participante).toUpperCase()}
                                </span>
                                <span className={getCategoriaBadgeClass(categoria)}>
                                  {categoria || 'SIN CATEGORÍA'}
                                </span>
                              </div>
                            </div>

                            <div className="comision-participacion-meta-grid">
                              <div className="comision-participacion-meta">
                                <span>Fecha nac.</span>
                                <strong>{formatearFechaLegible(participante.fecha_nacimiento)}</strong>
                              </div>

                              <div className="comision-participacion-meta">
                                <span>Documento</span>
                                <strong>{`${participante.tipo_documento || 'DNI'} ${participante.numero_documento || '[N/D]'}`}</strong>
                              </div>

                              <div className="comision-participacion-meta">
                                <span>Categoría</span>
                                <strong>{categoria ? categoria[0] + categoria.slice(1).toLowerCase() : '[N/D]'}</strong>
                              </div>

                              <div className="comision-participacion-meta">
                                <span>Rol</span>
                                <strong>{formatTipoParticipante(participante)}</strong>
                              </div>
                            </div>

                            <div className="comision-participacion-card-actions">
                        <button
                          type="button"
                          className="btn-table-action"
                          style={{ backgroundColor: 'rgb(229, 62, 62)', color: '#ffffff', borderColor: 'rgb(229, 62, 62)', minHeight: '34px', padding: '0 0.75rem', fontSize: '0.72rem' }}
                          disabled={participacionActionId === participante.id_integrante}
                          onClick={() => handleEliminarParticipante(participante.id_integrante)}
                        >
                                {participacionActionId === participante.id_integrante ? '⏳ Eliminando...' : '🗑️ Eliminar participante'}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
                  )}
                </section>
              )}

              <div className="modal-footer comisiones-form-footer">
                <button type="button" className="btn-table-action action-secondary" onClick={handleCloseFormModal} style={{ backgroundColor: 'rgba(0,0,0,0.04)', borderColor: 'rgba(0,0,0,0.08)', color: '#4a5568', minHeight: '40px', padding: '0 1rem' }}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={savingComision} style={{ padding: '0 1rem', minHeight: '40px' }}>
                  {savingComision ? '⏳ Guardando...' : editingComision ? '💾 Guardar cambios' : '💾 Guardar comisión'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: HISTORIAL DE COMISIONES */}
      {esModoFamilia && isModalOpen && selectedFamily && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Historial de Asignaciones</h3>
            </div>
            <div className="modal-body">
              <p><strong>Familia:</strong> {selectedFamily.apellidoFamilia || 'Designada'}</p>
              <p><strong>Referente titular:</strong> {selectedFamily.referente}</p>
              <p>
                <strong>Estado actual:</strong> {
                  selectedFamily.comisionActual === 'cocina' ? '🍳 Cocina y Porciones' :
                  selectedFamily.comisionActual === 'ropero' ? '👕 Ropero Comunitario' :
                  selectedFamily.comisionActual === 'limpieza' ? '🧹 Limpieza e Higiene' : '❌ Sin Asignar'
                }
              </p>
              <hr className="comisiones-modal-divider" />

              {/* Pendiente de endpoint real de historial (no existe aún en api.js) */}
              <p className="comisiones-history-placeholder">
                📋 [Fecha]: [Estado Anterior] → [Estado Nuevo]
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-primary comisiones-modal-close-btn" onClick={handleCloseModal}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Comisiones;
