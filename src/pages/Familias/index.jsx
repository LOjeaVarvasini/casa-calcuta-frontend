import { useState, useEffect, useCallback } from 'react';
import {
  getFamiliasRequest,
  createFamiliaRequest,
  getIntegrantesRequest,
  asignarReferenteRequest,
  createIntegranteRequest,
  getFichaFamiliaRequest,
  deleteFamiliaRequest,
} from '../../config/api.js';
import './familias.css';

function Familias({ onNavegar }) {
  // Estados de datos reales (Grilla Principal)
  const [familias, setFamilias] = useState([]);
  const [paginacion, setPaginacion] = useState(null);

  // Estados de UI de la Grilla (Filtros dinámicos conectados a los 5 endpoints de Ignacio)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [evaluadaFilter, setEvaluadaFilter] = useState(''); // 🍏 Filtro 2 y 3: Evaluadas / No Evaluadas
  const [estadoListaFilter, setEstadoListaFilter] = useState(''); // 🍏 Filtro 4: PRINCIPAL / ESPERA
  const [sortByFilter, setSortByFilter] = useState(''); // 🍏 Filtro 5: Ordenar por Puntaje

  // Estados del modal de Nueva Familia (Flujo por etapas)
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

  // Estados compartidos de conectividad (ID activo que se está manipulando)
  const [familiaCreadaId, setFamiliaCreadaId] = useState(null);
  const [showPostCreacion, setShowPostCreacion] = useState(false);

  // Estados del modal "Ver Ficha"
  const [showFichaModal, setShowFichaModal] = useState(false);
  const [fichaData, setFichaData] = useState(null);
  const [loadingFicha, setLoadingFicha] = useState(false);
  const [fichaError, setFichaError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Estados del submodal de Añadir Integrante
  const [showIntegranteModal, setShowIntegranteModal] = useState(false);
  const [integranteData, setIntegranteData] = useState({
    nombre: '',
    apellido: '',
    fecha_nacimiento: '',
    tipo_documento: 'DNI',
    numero_documento: '',
  });
  const [savingIntegrante, setSavingIntegrante] = useState(false);
  const [integranteError, setIntegranteError] = useState(null);
  const [integranteSuccess, setIntegranteSuccess] = useState(null);

  // Estados del submodal de Selección de Referente
  const [showReferenteModal, setShowReferenteModal] = useState(false);
  const [integrantes, setIntegrantes] = useState([]);
  const [loadingIntegrantes, setLoadingIntegrantes] = useState(false);
  const [integrantesError, setIntegrantesError] = useState(null);
  const [integranteSeleccionado, setIntegranteSeleccionado] = useState('');
  const [asignandoReferente, setAsignandoReferente] = useState(false);
  const [referenteError, setReferenteError] = useState(null);
  const [referenteSuccess, setReferenteSuccess] = useState(null);

  // ==========================================================================
  // CARGA INICIAL DE FAMILIAS DESDE LA API CON FILTROS DINÁMICOS MULTIPLES
  // ==========================================================================
  const cargarFamilias = useCallback(async (filtrosManuales = {}) => {
    setLoading(true);
    setError(null);

    // Permitimos resetear pasándolos por parámetro o leyendo los estados reactivos
    const fPrioridad = filtrosManuales.priorityFilter !== undefined ? filtrosManuales.priorityFilter : priorityFilter;
    const fEvaluada = filtrosManuales.evaluadaFilter !== undefined ? filtrosManuales.evaluadaFilter : evaluadaFilter;
    const fEstadoLista = filtrosManuales.estadoListaFilter !== undefined ? filtrosManuales.estadoListaFilter : estadoListaFilter;
    const fSortBy = filtrosManuales.sortByFilter !== undefined ? filtrosManuales.sortByFilter : sortByFilter;

    try {
      const queryParams = new URLSearchParams();
      queryParams.append('per_page', '15');

      // 1. Filtro por Nivel de Prioridad Social
      if (fPrioridad) {
        const mapaPrioridad = {
          'muy-alta': 'muy_alta',
          'alta': 'alta',
          'media': 'media',
          'baja': 'baja',
          'muy-baja': 'muy_baja',
        };
        const valorReal = mapaPrioridad[fPrioridad] || fPrioridad;
        queryParams.append('prioridad_social', valorReal);
      }

      // 2 y 3. Filtro de Evaluadas o No Evaluadas
      if (fEvaluada) {
        queryParams.append('evaluada', fEvaluada);
      }

      // 4. Filtro por Estado de Lista
      if (fEstadoLista) {
        queryParams.append('estado_lista', fEstadoLista);
      }

      // 5. Filtro Ordenado por Puntaje Descendente
      if (fSortBy === 'puntaje_desc') {
        queryParams.append('sort_by', 'puntaje_prioridad');
        queryParams.append('sort_order', 'desc');
      }

      // Término de búsqueda general (Mapeo preventivo front)
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
      setError(err.message || 'Error al cargar las familias desde el servidor cloud.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, priorityFilter, evaluadaFilter, estadoListaFilter, sortByFilter]);

  useEffect(() => {
    cargarFamilias();
  }, [cargarFamilias]);

  // ==========================================================================
  // FILTRADO EN CALIENTE (CLIENT-SIDE COMPLEMENTARIO PARA BÚSQUEDA)
  // ==========================================================================
  const familiasFiltradas = familias.filter((familia) => {
    if (!searchTerm) return true;
    
    const term = searchTerm.toLowerCase().trim();
    const referente = familia.referente;

    if (!referente) {
      return `familia #${familia.id_familia}`.toLowerCase().includes(term);
    }

    const apellido = referente.apellido ? referente.apellido.toLowerCase() : '';
    const nombre = referente.nombre ? referente.nombre.toLowerCase() : '';
    const dni = referente.numero_documento ? referente.numero_documento.toLowerCase() : '';

    return apellido.includes(term) || nombre.includes(term) || dni.includes(term);
  });

  // ==========================================================================
  // FLUJO DE CONTROL DE "VER FICHA"
  // ==========================================================================
  const handleAbrirFicha = async (idFamilia) => {
    setFamiliaCreadaId(idFamilia); 
    setShowFichaModal(true);
    setLoadingFicha(true);
    setFichaError(null);
    setFichaData(null);

    try {
      const data = await getFichaFamiliaRequest(idFamilia);
      setFichaData(data);
    } catch (err) {
      setFichaError(err.message || 'Error al cargar los detalles de la ficha.');
    } finally {
      setLoadingFicha(false);
    }
  };

  const refrescarFichaEnCaliente = async () => {
    if (!familiaCreadaId) return;
    try {
      const data = await getFichaFamiliaRequest(familiaCreadaId);
      setFichaData(data);
    } catch (err) {
      console.error('Error refrescando ficha técnica:', err);
    }
  };

  // ==========================================================================
  // ACCIÓN DE ELIMINACIÓN DE LA FAMILIA
  // ==========================================================================
  const handleEliminarFamilia = async () => {
    if (!familiaCreadaId) return;

    const seguro = window.confirm('🚨 ¿Estás absolutamente seguro de eliminar esta familia? Esta acción borrará el registro de forma permanente en el servidor.');
    if (!seguro) return;

    setDeleting(true);
    setFichaError(null);

    try {
      await deleteFamiliaRequest(familiaCreadaId);
      setShowFichaModal(false);
      setFamiliaCreadaId(null);
      setFichaData(null);
      cargarFamilias();
    } catch (err) {
      setFichaError(err.message || 'Error del servidor al intentar eliminar la familia.');
    } finally {
      setDeleting(false);
    }
  };

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
      let usuarioId = 1;

      if (token) {
        try {
          const payloadBase64 = token.split('.')[1];
          const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
          const payloadJson = JSON.parse(window.atob(base64));
          usuarioId = payloadJson.sub || payloadJson.id_usuario || payloadJson.id || payloadJson.user_id || 1;
        } catch (jwtErr) {
          console.error('Error decodificando JWT:', jwtErr);
        }
      }

      const payload = {
        direccion: formData.direccion,
        telefono: formData.telefono,
        puntaje_prioridad: parseInt(formData.puntaje_prioridad, 10) || 0,
        prioridad_social: formData.prioridad_social.toLowerCase(),
        estado_lista: formData.estado_lista.toUpperCase(),
        fecha_ingreso: formData.fecha_ingreso,
        activa: formData.activa ? 1 : 0,
        registrado_por: parseInt(usuarioId, 10) || 1,
      };

      const data = await createFamiliaRequest(payload);
      setFamiliaCreadaId(data.id_familia);
      setSaveSuccess('Familia creada exitosamente.');
      setShowPostCreacion(true);
    } catch (err) {
      setSaveError(err.message || 'Error al crear la familia.');
    } finally {
      setSaving(false);
    }
  };

  const handleCerrarModalCreacion = () => {
    setShowNuevoModal(false);
    setShowPostCreacion(false);
    setFamiliaCreadaId(null);
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
    
    // Al cerrar post-creación, reseteamos todos los selectores del toolbar
    setSearchTerm('');
    setPriorityFilter('');
    setEvaluadaFilter('');
    setEstadoListaFilter('');
    setSortByFilter('');
    cargarFamilias({ priorityFilter: '', evaluadaFilter: '', estadoListaFilter: '', sortByFilter: '' });
  };

  // ==========================================================================
  // FLUJO DEL SUBMODAL DE AÑADIR INTEGRANTE
  // ==========================================================================
  const handleIntegranteInputChange = (e) => {
    const { name, value } = e.target;
    setIntegranteData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCrearIntegranteSubmit = async (e) => {
    e.preventDefault();
    if (!familiaCreadaId) return;

    setSavingIntegrante(true);
    setIntegranteError(null);
    setIntegranteSuccess(null);

    const payload = {
      name: integranteData.nombre,
      nombre: integranteData.nombre,
      apellido: integranteData.apellido,
      fecha_nacimiento: integranteData.fecha_nacimiento,
      tipo_documento: integranteData.tipo_documento.toUpperCase(),
      numero_documento: integranteData.numero_documento,
      referente: 0,
      familia_id: parseInt(familiaCreadaId, 10),
    };

    try {
      await createIntegranteRequest(payload);
      setIntegranteSuccess(`¡${integranteData.nombre} fue añadido correctamente!`);
      
      setIntegranteData({
        nombre: '',
        apellido: '',
        fecha_nacimiento: '',
        tipo_documento: 'DNI',
        numero_documento: '',
      });

      cargarFamilias(); 
      if (showFichaModal) refrescarFichaEnCaliente();

      setTimeout(() => {
        setIntegranteSuccess(null);
      }, 2000);
    } catch (err) {
      setIntegranteError(err.message || 'Error al añadir el integrante.');
    } finally {
      setSavingIntegrante(false);
    }
  };

  // ==========================================================================
  // FLUJO DEL SUBMODAL DE REFERENTE
  // ==========================================================================
  const handleAbrirReferente = async () => {
    setShowReferenteModal(true);
    setLoadingIntegrantes(true);
    setIntegrantesError(null);
    setIntegrantes([]);
    setIntegranteSeleccionado('');
    setReferenteError(null);
    setReferenteSuccess(null);

    try {
      const data = await getIntegrantesRequest(familiaCreadaId);
      const adultos = (data || []).filter(
        (integrante) => integrante.categoria_etaria === 'ADULTO'
      );
      setIntegrantes(adultos);
    } catch (err) {
      setIntegrantesError(err.message || 'Error al cargar integrantes.');
    } finally {
      setLoadingIntegrantes(false);
    }
  };

  const handleAsignarReferente = async () => {
    if (!integranteSeleccionado) return;

    setAsignandoReferente(true);
    setReferenteError(null);
    setReferenteSuccess(null);

    try {
      await asignarReferenteRequest(familiaCreadaId, integranteSeleccionado);
      setReferenteSuccess('Referente asignado correctamente.');

      setTimeout(() => {
        setShowReferenteModal(false);
        setReferenteSuccess(null);
        
        if (showPostCreacion) {
          setSearchTerm('');
          setPriorityFilter('');
          setEvaluadaFilter('');
          setEstadoListaFilter('');
          setSortByFilter('');
          setShowNuevoModal(false);
          setShowPostCreacion(false);
          setFamiliaCreadaId(null);
          setSaveSuccess(null);
          cargarFamilias({ searchTerm: '', priorityFilter: '', evaluadaFilter: '', estadoListaFilter: '', sortByFilter: '' });
        } else {
          cargarFamilias();
          refrescarFichaEnCaliente();
        }
      }, 1500);
    } catch (err) {
      setReferenteError(err.message || 'Error al asignar referente.');
    } finally {
      setAsignandoReferente(false);
    }
  };

  // Helpers visuales
  const getBadgeClass = (prioridad) => {
    const p = prioridad ? prioridad.toLowerCase().replace('-', '_') : '';
    const mapa = {
      'muy_alta': 'badge-danger',
      'alta': 'badge-warning',
      'media': 'badge-primary',
      'baja': 'badge-success',
      'muy_baja': 'badge-success',
    };
    return mapa[p] || 'badge-primary';
  };

  const getPrioridadLabel = (prioridad) => {
    const p = prioridad ? prioridad.toLowerCase().replace('-', '_') : '';
    const mapa = {
      'muy_alta': 'Muy Alta',
      'alta': 'Alta',
      'media': 'Media',
      'baja': 'Baja',
      'muy_baja': 'Muy Baja',
    };
    return mapa[p] || prioridad;
  };

  return (
    <div>
      {/* 🍏 TOOLBAR EXPANDIDO CON LOS 5 SELECTORES DISPONIBLES DE LA API */}
      <section className="page-toolbar" style={{ flexDirection: 'column', gap: 'var(--space-sm)', alignItems: 'stretch' }}>
        <div className="search-filter-group" style={{ display: 'grid', gridTemplateColumns: '2fr repeat(4, 1fr)', gap: 'var(--space-xs)', width: '100%' }}>
          
          {/* Buscador de Referente */}
          <div className="form-group">
            <input
              type="search"
              placeholder="Buscar referente o DNI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Selector 1: Nivel de Prioridad */}
          <div className="form-group">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="">Prioridades (Todas)</option>
              <option value="muy-alta">Muy Alta</option>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </div>

          {/* Selector 2 y 3: Estado de Evaluación */}
          <div className="form-group">
            <select
              value={evaluadaFilter}
              onChange={(e) => setEvaluadaFilter(e.target.value)}
            >
              <option value="">Evaluación (Todas)</option>
              <option value="true">Evaluadas</option>
              <option value="false">No Evaluadas</option>
            </select>
          </div>

          {/* Selector 4: Estado de Lista */}
          <div className="form-group">
            <select
              value={estadoListaFilter}
              onChange={(e) => setEstadoListaFilter(e.target.value)}
            >
              <option value="">Listas (Todas)</option>
              <option value="PRINCIPAL">Principal</option>
              <option value="ESPERA">Espera</option>
            </select>
          </div>

          {/* Selector 5: Ordenamiento por Puntaje */}
          <div className="form-group">
            <select
              value={sortByFilter}
              onChange={(e) => setSortByFilter(e.target.value)}
            >
              <option value="">Orden estándar</option>
              <option value="puntaje_desc">Mayor Puntaje Priority</option>
            </select>
          </div>
        </div>

        <button
          className="btn-primary"
          style={{ alignSelf: 'flex-end', minHeight: '40px', padding: '0 1.5rem' }}
          onClick={() => setShowNuevoModal(true)}
        >
          ➕ Nueva Familia
        </button>
      </section>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Cargando familias con filtros activos...</p>
        </div>
      )}

      {error && <div className="login-error" style={{ marginBottom: 'var(--space-md)' }}>{error}</div>}

      {!loading && !error && (
        <section className="families-grid">
          {familiasFiltradas.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', color: '#718096' }}>
              <p>No se encontraron familias que cumplan con los filtros seleccionados.</p>
            </div>
          )}

          {familiasFiltradas.map((family) => (
            <div className="family-card" key={family.id_familia}>
              <header className="card-family-header">
                <div>
                  <h2 className="family-name">
                    {family.referente
                      ? `${family.referente.apellido}${family.referente.nombre ? ', ' + family.referente.nombre : ''}`
                      : `Familia #${family.id_familia}`}
                  </h2>
                  <p className="referent-info">
                    Ref: {family.referente ? `${family.referente.nombre} ${family.referente.apellido}` : '[Sin referente]'}
                    &nbsp;&bull;&nbsp;
                    DNI {family.referente ? family.referente.numero_documento : '[N/D]'}
                  </p>
                </div>
                <span className={`badge ${getBadgeClass(family.prioridad_social)}`}>
                  {getPrioridadLabel(family.prioridad_social)}
                </span>
              </header>
              <div className="card-family-body">
                <div className="metric-mini">🏠 <span>{family.direccion || '[Sin dirección]'}</span></div>
                <div className="metric-mini">📞 <span>{family.telefono || '[Sin teléfono]'}</span></div>
                <div className="metric-mini">
                  📋 <span>Estado: {family.estado_lista === 'PRINCIPAL' ? 'Activo' : 'En Espera'}</span>
                </div>
              </div>
              <footer className="card-family-footer">
                <div className="table-actions-cell">
                  <button
                    type="button"
                    className="btn-table-action"
                    onClick={() => handleAbrirFicha(family.id_familia)}
                  >
                    Ver ficha
                  </button>
                  <button
                    type="button"
                    className="btn-table-action action-secondary"
                    style={{ backgroundColor: 'rgba(0,0,0,0.04)', borderColor: 'rgba(0,0,0,0.08)', color: '#4a5568' }}
                    onClick={() => alert('[Navegación] Ver comisión de familia ID: ' + family.id_familia)}
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

      {/* ==========================================================================
          MODAL: VER FICHA EXTENDIDA DE FAMILIA
          ========================================================================== */}
      {showFichaModal && (
        <div className="modal-overlay" onClick={() => { if (!deleting) { setShowFichaModal(false); setFamiliaCreadaId(null); } }}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3>📋 Ficha Técnica de Familia {fichaData && `#${fichaData.id_familia}`}</h3>
            </div>

            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {loadingFicha && <p style={{ textAlign: 'center', color: 'var(--color-primary)' }}>Cargando ficha extendida...</p>}
              {fichaError && <div className="login-error">{fichaError}</div>}

              {fichaData && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)', borderBottom: '1px solid #e2e8f0', paddingBottom: 'var(--space-sm)' }}>
                    <div><strong>Dirección:</strong> {fichaData.direccion || '[N/D]'}</div>
                    <div><strong>Teléfono:</strong> {fichaData.telefono || '[N/D]'}</div>
                    <div><strong>Fecha Ingreso:</strong> {new Date(fichaData.fecha_ingreso).toLocaleDateString('es-AR')}</div>
                    <div>
                      <strong>Estado:</strong> <span className={`badge ${fichaData.estado_lista === 'PRINCIPAL' ? 'badge-success' : 'badge-primary'}`}>{fichaData.estado_lista}</span>
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#f7fafc', padding: 'var(--space-sm)', borderRadius: '6px', marginBottom: 'var(--space-md)' }}>
                    <h4 style={{ margin: '0 0 var(--space-xs) 0', fontSize: '1rem', color: 'var(--color-primary)' }}>👑 Referente Designado</h4>
                    {fichaData.referente ? (
                      <p style={{ margin: 0 }}>
                        {fichaData.referente.apellido}, {fichaData.referente.nombre} &bull; <strong>{fichaData.referente.tipo_documento}:</strong> {fichaData.referente.numero_documento}
                      </p>
                    ) : (
                      <p style={{ margin: 0, color: '#e53e3e', fontWeight: 500 }}>⚠️ Sin referente asignado en el sistema.</p>
                    )}
                  </div>

                  <div style={{ marginBottom: 'var(--space-md)' }}>
                    <h4 style={{ margin: '0 0 var(--space-xs) 0', fontSize: '1rem' }}>📊 Puntajes de Evaluación</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-xs)', textAlign: 'center' }}>
                      <div style={{ background: '#edf2f7', padding: 'var(--space-xs)', borderRadius: '4px' }}>
                        <small style={{ display: 'block', color: '#4a5568' }}>Prioridad</small>
                        <strong style={{ fontSize: '1.2rem', color: 'var(--color-primary)' }}>{fichaData.puntaje_prioridad}</strong>
                      </div>
                      <div style={{ background: '#edf2f7', padding: 'var(--space-xs)', borderRadius: '4px' }}>
                        <small style={{ display: 'block', color: '#4a5568' }}>Menores</small>
                        <strong style={{ fontSize: '1.2rem' }}>{fichaData.puntaje_menores ?? '-'}</strong>
                      </div>
                      <div style={{ background: '#edf2f7', padding: 'var(--space-xs)', borderRadius: '4px' }}>
                        <small style={{ display: 'block', color: '#4a5568' }}>Alimentación</small>
                        <strong style={{ fontSize: '1.2rem' }}>{fichaData.puntaje_alimentacion ?? '-'}</strong>
                      </div>
                      <div style={{ background: '#edf2f7', padding: 'var(--space-xs)', borderRadius: '4px' }}>
                        <small style={{ display: 'block', color: '#4a5568' }}>Asistencia</small>
                        <strong style={{ fontSize: '1.2rem' }}>{fichaData.puntaje_asistencia ?? '-'}</strong>
                      </div>
                      <div style={{ background: '#edf2f7', padding: 'var(--space-xs)', borderRadius: '4px' }}>
                        <small style={{ display: 'block', color: '#4a5568' }}>Participación</small>
                        <strong style={{ fontSize: '1.2rem' }}>{fichaData.puntaje_participacion ?? '-'}</strong>
                      </div>
                      <div style={{ background: '#edf2f7', padding: 'var(--space-xs)', borderRadius: '4px' }}>
                        <small style={{ display: 'block', color: '#4a5568' }}>Prioridad Social</small>
                        <span className={`badge ${getBadgeClass(fichaData.prioridad_social)}`} style={{ display: 'inline-block', marginTop: '4px' }}>
                          {getPrioridadLabel(fichaData.prioridad_social)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: '#718096', borderTop: '1px solid #e2e8f0', paddingTop: 'var(--space-xs)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xs)' }}>
                    <div><strong>Registrado por:</strong> {fichaData.registrado_por?.nombre} {fichaData.registrado_por?.apellido}</div>
                    <div><strong>Evaluado por:</strong> {fichaData.evaluado_por ? `${fichaData.evaluado_por.nombre} ${fichaData.evaluado_por.apellido}` : 'Pendiente'}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ gap: 'var(--space-sm)' }}>
              <button
                type="button"
                className="btn-table-action"
                style={{ backgroundColor: '#e53e3e', color: '#fff', borderColor: '#e53e3e', minHeight: '40px', padding: '0 1rem' }}
                onClick={handleEliminarFamilia}
                disabled={loadingFicha || deleting}
              >
                {deleting ? 'Eliminando...' : '🗑️ Eliminar Familia'}
              </button>

              <button
                type="button"
                className="btn-primary"
                style={{ backgroundColor: '#4a5568', padding: '0 1rem', minHeight: '40px', marginLeft: 'auto' }}
                onClick={() => setShowIntegranteModal(true)}
                disabled={loadingFicha || deleting}
              >
                👥 Añadir Integrante
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ padding: '0 1rem', minHeight: '40px' }}
                onClick={handleAbrirReferente}
                disabled={loadingFicha || deleting}
              >
                👑 Cambiar Referente
              </button>
              <button
                type="button"
                className="btn-table-action action-secondary"
                style={{ minHeight: '40px' }}
                onClick={() => { setShowFichaModal(false); setFamiliaCreadaId(null); }}
                disabled={deleting}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================================
          MODAL: NUEVA FAMILIA
          ========================================================================== */}
      {showNuevoModal && (
        <div className="modal-overlay" onClick={handleCerrarModalCreacion}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>➕ Nueva Familia {familyCreatedId && `(#${familiaCreadaId})`}</h3>
            </div>

            {!showPostCreacion ? (
              <form onSubmit={handleCrearFamilia} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1, minHeight: 0 }}>
                <div className="modal-body">
                  {saveError && <div className="login-error" style={{ marginBottom: 'var(--space-md)' }}>{saveError}</div>}

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
                    onClick={handleCerrarModalCreacion}
                    disabled={saving}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary" disabled={saving} style={{ minHeight: '40px' }}>
                    {saving ? 'Guardando...' : 'Guardar Familia'}
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div className="modal-body">
                  <div className="login-success" style={{ marginBottom: 'var(--space-md)' }}>
                    {saveSuccess}
                  </div>
                  <p style={{ textAlign: 'center', color: 'var(--color-text)', marginBottom: 'var(--space-md)' }}>
                    ¿Qué deseás hacer a continuación con la nueva familia creada?
                  </p>
                </div>
                <div className="modal-footer" style={{ flexDirection: 'column', gap: 'var(--space-sm)' }}>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ backgroundColor: '#4a5568' }}
                    onClick={() => setShowIntegranteModal(true)}
                  >
                    👥 Añadir Integrantes a la Familia
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleAbrirReferente}
                  >
                    👑 Asignar Referente de la Familia
                  </button>
                  <button
                    type="button"
                    className="btn-table-action action-secondary"
                    style={{ backgroundColor: 'rgba(0,0,0,0.04)', borderColor: 'rgba(0,0,0,0.08)', color: '#4a5568', minHeight: '40px', width: '100%' }}
                    onClick={handleCerrarModalCreacion}
                  >
                    Terminar y Cerrar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==========================================================================
          SUBMODAL: AÑADIR INTEGRANTE A LA FAMILIA
          ========================================================================== */}
      {showIntegranteModal && (
        <div className="modal-overlay" onClick={() => setShowIntegranteModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>👥 Añadir Integrante</h3>
            </div>
            <form onSubmit={handleCrearIntegranteSubmit}>
              <div className="modal-body">
                {integranteError && <div className="login-error" style={{ marginBottom: 'var(--space-md)' }}>{integranteError}</div>}
                {integranteSuccess && <div className="login-success" style={{ marginBottom: 'var(--space-md)' }}>{integranteSuccess}</div>}

                <div className="form-group">
                  <label htmlFor="nombre">Nombre</label>
                  <input
                    id="nombre"
                    name="nombre"
                    type="text"
                    value={integranteData.nombre}
                    onChange={handleIntegranteInputChange}
                    required
                    placeholder="Ej: Bart"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="apellido">Apellido</label>
                  <input
                    id="apellido"
                    name="apellido"
                    type="text"
                    value={integranteData.apellido}
                    onChange={handleIntegranteInputChange}
                    required
                    placeholder="Ej: Simpson"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="fecha_nacimiento">Fecha de Nacimiento</label>
                  <input
                    id="fecha_nacimiento"
                    name="fecha_nacimiento"
                    type="date"
                    value={integranteData.fecha_nacimiento}
                    onChange={handleIntegranteInputChange}
                    required
                  />
                </div>

                <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-sm)' }}>
                  <div className="form-group">
                    <label htmlFor="tipo_documento">Tipo Doc.</label>
                    <select
                      id="tipo_documento"
                      name="tipo_documento"
                      value={integranteData.tipo_documento}
                      onChange={handleIntegranteInputChange}
                      required
                    >
                      <option value="DNI">DNI</option>
                      <option value="LC">LC</option>
                      <option value="LE">LE</option>
                      <option value="PASAPORTE">Pasaporte</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="numero_documento">Número Documento</label>
                    <input
                      id="numero_documento"
                      name="numero_documento"
                      type="text"
                      value={integranteData.numero_documento}
                      onChange={handleIntegranteInputChange}
                      required
                      placeholder="Ej: 45123456"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-table-action action-secondary"
                  onClick={() => setShowIntegranteModal(false)}
                  disabled={savingIntegrante}
                >
                  Volver atrás
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={savingIntegrante}
                >
                  {savingIntegrante ? 'Guardando...' : 'Añadir Miembro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================================================
          SUBMODAL: ASIGNACIÓN DE REFERENTE (+18 ADULTO)
          ========================================================================== */}
      {showReferenteModal && (
        <div className="modal-overlay" onClick={() => setShowReferenteModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3>👑 Seleccionar Referente</h3>
            </div>
            <div className="modal-body">
              {referenteError && <div className="login-error" style={{ marginBottom: 'var(--space-md)' }}>{referenteError}</div>}
              {referenteSuccess && <div className="login-success" style={{ marginBottom: 'var(--space-md)' }}>{referenteSuccess}</div>}

              {loadingIntegrantes && (
                <p style={{ textAlign: 'center', color: 'var(--color-primary)' }}>Cargando integrantes de la familia...</p>
              )}

              {integrantesError && <div className="login-error" style={{ marginBottom: 'var(--space-md)' }}>{integrantesError}</div>}

              {!loadingIntegrantes && !integrantesError && integrantes.length === 0 && (
                <div className="login-error" style={{ backgroundColor: '#fffaf0', color: '#dd6b20', borderColor: '#fbd38d' }}>
                  ⚠️ No hay integrantes adultos en esta familia. Primero debés añadir integrantes que tengan la categoría 'ADULTO'.
                </div>
              )}

              {!loadingIntegrantes && integrantes.length > 0 && (
                <div className="form-group">
                  <label htmlFor="integranteSelect">Elegí un integrante adulto disponible:</label>
                  <select
                    id="integranteSelect"
                    value={integranteSeleccionado}
                    onChange={(e) => setIntegranteSeleccionado(e.target.value)}
                    required
                  >
                    <option value="">Seleccionar integrante...</option>
                    {integrantes.map((integrante) => (
                      <option key={integrante.id_integrante} value={integrante.id_integrante}>
                        {integrante.apellido}, {integrante.nombre} — DNI {integrante.numero_documento}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-table-action action-secondary"
                style={{ backgroundColor: 'rgba(0,0,0,0.04)', borderColor: 'rgba(0,0,0,0.08)', color: '#4a5568', minHeight: '40px', padding: '0 1rem' }}
                onClick={() => setShowReferenteModal(false)}
                disabled={asignandoReferente}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleAsignarReferente}
                disabled={asignandoReferente || !integranteSeleccionado}
                style={{ minHeight: '40px' }}
              >
                {asignandoReferente ? 'Asignando...' : 'Asignar Referente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Familias;