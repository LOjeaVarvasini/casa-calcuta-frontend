import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  createComisionRequest,
  createParticipacionComisionRequest,
  deleteComisionRequest,
  getComisionParticipacionesActivasRequest,
  getComisionesRequest,
  getFamiliasPrincipalesRequest,
  getIntegranteParticipacionesComisionRequest,
  getIntegrantesRequest,
  getUsuariosRequest,
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
  const [integrantesFamilia, setIntegrantesFamilia] = useState([]);
  const [comisionesActivasFamilia, setComisionesActivasFamilia] = useState([]);
  const [comisionesActivasPorIntegrante, setComisionesActivasPorIntegrante] = useState({});
  const [comisionesFamiliaPorId, setComisionesFamiliaPorId] = useState({});
  const [comisiones, setComisiones] = useState([]);
  const [usuariosEncargados, setUsuariosEncargados] = useState([]);
  const [familiasDisponibles, setFamiliasDisponibles] = useState([]);
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
  const [cambioComisionIntegranteId, setCambioComisionIntegranteId] = useState(null);
  const [isHistorialModalOpen, setIsHistorialModalOpen] = useState(false);
  const [historialIntegrante, setHistorialIntegrante] = useState(null);
  const [historialParticipaciones, setHistorialParticipaciones] = useState([]);
  const [loadingHistorialParticipaciones, setLoadingHistorialParticipaciones] = useState(false);
  const [historialParticipacionesError, setHistorialParticipacionesError] = useState(null);

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

  const formatearNombreComision = (comision) => {
    if (!comision) return 'Sin comisión';
    return comision.nombre || `Comisión #${comision.id_comision}`;
  };

  const formatearNombreComisionPorId = (comisionId) => {
    const id = Number.parseInt(comisionId, 10);
    if (Number.isNaN(id)) return 'Sin comisión';

    return formatearNombreComision(comisionesFamiliaPorId[id] || { id_comision: id });
  };

  const normalizarListaIntegrantes = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.integrantes)) return payload.integrantes;
    if (Array.isArray(payload?.members)) return payload.members;
    return [];
  };

  const normalizarListaComisiones = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.comisiones)) return payload.comisiones;
    return [];
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

  const cargarDatosModoFamilia = useCallback(async () => {
    if (!parametros?.familiaId) return;

    setLoading(true);
    setError(null);

    try {
      const [respuestaIntegrantes, respuestaComisiones] = await Promise.all([
        getIntegrantesRequest(parametros.familiaId),
        getComisionesRequest('per_page=100'),
      ]);

      const integrantes = normalizarListaIntegrantes(respuestaIntegrantes);
      const comisionesTodas = normalizarListaComisiones(respuestaComisiones);
      const comisionesActivas = comisionesTodas.filter((comision) => comision.activa === true);
      const mapaComisiones = comisionesTodas.reduce((acumulado, comision) => {
        acumulado[comision.id_comision] = comision;
        return acumulado;
      }, {});

      const participacionesPorComision = await Promise.all(
        comisionesTodas.map(async (comision) => {
          const respuestaParticipaciones = await getComisionParticipacionesActivasRequest(comision.id_comision);
          const participaciones = Array.isArray(respuestaParticipaciones)
            ? respuestaParticipaciones
            : (respuestaParticipaciones?.data || []);

          return { comision, participaciones };
        })
      );

      const mapaAsignaciones = participacionesPorComision.reduce((acumulado, { comision, participaciones }) => {
        participaciones.forEach((participante) => {
          const integranteId = Number.parseInt(participante?.id_integrante, 10);
          if (Number.isNaN(integranteId) || acumulado[integranteId]) return;

          acumulado[integranteId] = {
            id_comision: comision.id_comision,
            nombre: formatearNombreComision(comision),
            activa: comision.activa === true,
          };
        });

        return acumulado;
      }, {});

      setIntegrantesFamilia(integrantes);
      setComisionesActivasFamilia(comisionesActivas);
      setComisionesActivasPorIntegrante(mapaAsignaciones);
      setComisionesFamiliaPorId(mapaComisiones);
      setComisiones([]);
      setUsuariosEncargados([]);
      setFamiliasDisponibles([]);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los integrantes y comisiones activas de la familia.');
      setIntegrantesFamilia([]);
      setComisionesActivasFamilia([]);
      setComisionesActivasPorIntegrante({});
      setComisionesFamiliaPorId({});
    } finally {
      setLoading(false);
    }
  }, [parametros?.familiaId]);

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
        await cargarDatosModoFamilia();
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
        setIntegrantesFamilia([]);
        setComisionesActivasFamilia([]);
        setComisionesActivasPorIntegrante({});
        setComisionesFamiliaPorId({});
      }
    } catch (err) {
      setError(err.message || (esModoFamilia ? 'No se pudieron sincronizar los integrantes y comisiones.' : 'No se pudieron cargar las comisiones.'));
      setIntegrantesFamilia([]);
      setComisionesActivasFamilia([]);
      setComisionesActivasPorIntegrante({});
      setComisionesFamiliaPorId({});
      setComisiones([]);
      setUsuariosEncargados([]);
      setFamiliasDisponibles([]);
    } finally {
      setLoading(false);
    }
  }, [cargarDatosModoFamilia, esModoFamilia]);

  useEffect(() => {
    cargarFamilias();
  }, [cargarFamilias]);

  // Buscador reactivo en caliente
  const registrosFiltrados = useMemo(() => {
    const query = busqueda.toLowerCase().trim();
    if (esModoFamilia) {
      if (!query) return integrantesFamilia;

      return integrantesFamilia.filter((integrante) => {
        const nombre = formatearNombreIntegrante(integrante).toLowerCase();
        const apellido = (integrante.apellido || '').toLowerCase();
        const dni = (integrante.numero_documento || '').toLowerCase();
        return nombre.includes(query) || apellido.includes(query) || dni.includes(query);
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
  }, [integrantesFamilia, comisiones, busqueda, esModoFamilia]);

  const handleCambiarComisionIntegrante = async (integrante, nuevaComisionId) => {
    const integranteId = Number.parseInt(integrante.id_integrante, 10);
    const comisionActual = comisionesActivasPorIntegrante[integranteId] || null;
    const tieneNuevaComision = nuevaComisionId !== '' && nuevaComisionId !== null && nuevaComisionId !== undefined;
    const nuevaComisionIdNum = tieneNuevaComision ? Number.parseInt(nuevaComisionId, 10) : null;

    if (Number.isNaN(integranteId)) return;
    if (tieneNuevaComision && Number.isNaN(nuevaComisionIdNum)) return;
    if (comisionActual?.id_comision === nuevaComisionIdNum) return;
    if (!tieneNuevaComision && !comisionActual?.id_comision) return;

    setCambioComisionIntegranteId(integranteId);
    setError(null);

    try {
      const fechaHoy = new Date().toISOString().slice(0, 10);

      if (comisionActual?.id_comision) {
        await createParticipacionComisionRequest({
          fecha_inicio: fechaHoy,
          estado: 'inactivo',
          observaciones: tieneNuevaComision ? 'Cambio de comisión desde el panel de familias' : 'Sin asignar desde el panel de familias',
          integrante_id: integranteId,
          comision_id: comisionActual.id_comision,
        });
      }

      if (tieneNuevaComision && nuevaComisionIdNum) {
        await createParticipacionComisionRequest({
          fecha_inicio: fechaHoy,
          estado: 'activo',
          observaciones: 'Cambio de comisión desde el panel de familias',
          integrante_id: integranteId,
          comision_id: nuevaComisionIdNum,
        });
      }

      await cargarDatosModoFamilia();
    } catch (err) {
      setError(err.message || 'No se pudo actualizar la comisión del integrante.');
    } finally {
      setCambioComisionIntegranteId(null);
    }
  };

  const cargarHistorialIntegrante = useCallback(async (integranteId) => {
    setLoadingHistorialParticipaciones(true);
    setHistorialParticipacionesError(null);

    try {
      const respuesta = await getIntegranteParticipacionesComisionRequest(integranteId);
      const data = Array.isArray(respuesta) ? respuesta : (respuesta?.data || []);
      const ordenado = [...data].sort((a, b) => {
        const fechaA = new Date(a.fecha_inicio || a.created_at || 0).getTime();
        const fechaB = new Date(b.fecha_inicio || b.created_at || 0).getTime();
        return fechaB - fechaA;
      });

      setHistorialParticipaciones(ordenado);
    } catch (err) {
      setHistorialParticipaciones([]);
      setHistorialParticipacionesError(err.message || 'No se pudo cargar el historial de participaciones.');
    } finally {
      setLoadingHistorialParticipaciones(false);
    }
  }, []);

  const handleOpenHistorialIntegrante = (integrante) => {
    setHistorialIntegrante(integrante);
    setIsHistorialModalOpen(true);
    setHistorialParticipaciones([]);
    setHistorialParticipacionesError(null);

    const integranteId = Number.parseInt(integrante?.id_integrante, 10);
    if (!Number.isNaN(integranteId)) {
      cargarHistorialIntegrante(integranteId);
    }
  };

  const handleCloseHistorialIntegrante = () => {
    setIsHistorialModalOpen(false);
    setHistorialIntegrante(null);
    setHistorialParticipaciones([]);
    setHistorialParticipacionesError(null);
    setLoadingHistorialParticipaciones(false);
  };

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
      <table className="custom-table custom-table-responsive comisiones-familia-table">
        <thead>
          <tr>
            <th>Integrante</th>
            <th>DNI</th>
            <th>Comisión Actual</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {registrosFiltrados.length === 0 && (
            <tr>
              <td colSpan="4" className="comisiones-empty-state">
                No se encontraron integrantes que coincidan con la búsqueda.
              </td>
            </tr>
          )}

          {registrosFiltrados.map((integrante) => {
            const integranteId = Number.parseInt(integrante.id_integrante, 10);
            const comisionActual = comisionesActivasPorIntegrante[integranteId] || null;
            const comisionActualEsActiva = Boolean(comisionActual?.activa);
            const nombreComisionActual = comisionActual ? formatearNombreComision(comisionActual) : 'Sin comisión';

            return (
              <tr key={integrante.id_integrante}>
                <td data-label="Integrante">
                  <strong>{formatearNombreIntegrante(integrante)}</strong>
                  <p className="comisiones-ref-text">
                    {integrante.referente ? 'Referente' : 'Participante'}
                    {integrante.categoria_etaria ? ` · ${integrante.categoria_etaria}` : ''}
                  </p>
                </td>
                <td data-label="DNI">
                  {integrante.numero_documento || '[N/D]'}
                </td>
                <td data-label="Comisión Actual">
                  <select
                    className="form-control select-comision"
                    value={comisionActual?.id_comision || ''}
                    onChange={(e) => handleCambiarComisionIntegrante(integrante, e.target.value)}
                    disabled={cambioComisionIntegranteId === integranteId || (comisionesActivasFamilia.length === 0 && !comisionActual?.id_comision)}
                  >
                    <option value="">Sin asignar</option>
                    {comisionActual && !comisionActualEsActiva && (
                      <option value={comisionActual.id_comision} disabled>
                        {nombreComisionActual} (actual, inactiva)
                      </option>
                    )}
                    {comisionesActivasFamilia.map((comision) => (
                      <option key={comision.id_comision} value={comision.id_comision}>
                        {formatearNombreComision(comision)}
                      </option>
                    ))}
                  </select>
                </td>
                <td data-label="Acciones">
                  <div className="table-actions-cell">
                    <button
                      type="button"
                      className="btn-table-action"
                      onClick={() => handleOpenHistorialIntegrante(integrante)}
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
            💡 Esta vista muestra los integrantes de la familia y permite reasignar su comisión actual usando solo las comisiones activas.
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
          placeholder={esModoFamilia ? '🔍 Buscar integrante por nombre o DNI...' : '🔍 Buscar comisión, encargado o descripción...'}
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
          {esModoFamilia ? 'Cargando integrantes y comisiones activas...' : 'Cargando comisiones disponibles...'}
        </div>
      )}

      {/* TABLA RESPONSIVE */}
      {!loading && !error && (esModoFamilia ? renderModoFamilia() : renderCatalogoComisiones())}

      {esModoFamilia && isHistorialModalOpen && historialIntegrante && (
        <div className="modal-overlay" onClick={handleCloseHistorialIntegrante}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Historial de Asignaciones</h3>
            </div>
            <div className="modal-body">
              <p><strong>Integrante:</strong> {formatearNombreIntegrante(historialIntegrante)}</p>
              <p><strong>DNI:</strong> {historialIntegrante.numero_documento || '[N/D]'}</p>
              <p>
                <strong>Comisión actual:</strong> {(() => {
                  const integranteId = Number.parseInt(historialIntegrante.id_integrante, 10);
                  const comision = comisionesActivasPorIntegrante[integranteId] || null;
                  return comision ? formatearNombreComision(comision) : 'Sin asignar';
                })()}
              </p>
              <hr className="comisiones-modal-divider" />

              {historialParticipacionesError && (
                <div className="login-error comisiones-participaciones-error">
                  {historialParticipacionesError}
                </div>
              )}

              <div className="comisiones-historial-table-wrapper">
                {loadingHistorialParticipaciones ? (
                  <div className="comisiones-participaciones-loading">Cargando historial...</div>
                ) : historialParticipaciones.length === 0 ? (
                  <div className="comisiones-participaciones-empty-state">No hay participaciones registradas.</div>
                ) : (
                  <table className="comisiones-historial-table">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Movimiento</th>
                        <th>Comisión</th>
                        <th>Observaciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historialParticipaciones.map((participacion) => (
                        <tr key={participacion.id_participacion_comision}>
                          <td data-label="Fecha">{formatearFechaLegible(participacion.fecha_inicio)}</td>
                          <td data-label="Movimiento">
                            <span className={`badge ${participacion.estado === 'activo' ? 'badge-success' : 'badge-danger'}`}>
                              {participacion.estado === 'activo' ? 'Alta' : 'Baja'}
                            </span>
                          </td>
                          <td data-label="Comisión">{formatearNombreComisionPorId(participacion.comision_id)}</td>
                          <td data-label="Observaciones">{participacion.observaciones || 'Sin observaciones'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary comisiones-modal-close-btn" onClick={handleCloseHistorialIntegrante}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

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

    </div>
  );
}

export default Comisiones;
