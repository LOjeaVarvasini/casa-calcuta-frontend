import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getFamiliasRequest,
  createFamiliaRequest,
  getIntegrantesRequest,
  asignarReferenteRequest,
  createIntegranteRequest,
  getFichaFamiliaRequest,
  deleteFamiliaRequest,
  updateFamiliaRequest,
  updateIntegranteRequest,
  evaluatePrioridadFamiliaRequest,
  ESTADO_LISTA_OPTIONS,
  PRIORIDAD_SOCIAL_OPTIONS,
  SITUACION_ALIMENTARIA_OPTIONS,
  FRECUENCIA_ASISTENCIA_OPTIONS,
  PARTICIPACION_MERENDERO_OPTIONS,
  getApiErrorInfo,
} from '../../config/api.js';
import './familias.css';

function normalizarTextoClave(valor) {
  return (valor || '').toString().toLowerCase().trim().replace(/[\s-]+/g, '_');
}

function normalizarEstadoLista(valor) {
  return (valor || '').toString().toUpperCase().trim();
}

function formatearFechaInput(valor) {
  if (!valor) return '';
  const texto = valor.toString().trim();
  if (!texto) return '';
  return texto.includes('T') ? texto.split('T')[0] : texto.slice(0, 10);
}

function formatearFechaLegible(valor) {
  if (!valor) return '[N/D]';

  const texto = valor.toString().trim();
  if (!texto) return '[N/D]';

  const fechaBase = texto.includes('T') ? texto.split('T')[0] : texto.slice(0, 10);
  const partes = fechaBase.split('-');
  if (partes.length !== 3) return texto;

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function asBoolean(valor) {
  return valor === true || valor === 1 || valor === '1' || String(valor).toLowerCase().trim() === 'true';
}

function formatearApiError(error, fallback) {
  return getApiErrorInfo(error, fallback).message;
}

function getEtiquetaPorValor(options, valor, fallback = 'Sin dato') {
  const encontrado = options.find((option) => option.value === valor);
  return encontrado?.label || fallback;
}

function mapearFamiliaBaseAForm(familia = {}) {
  return {
    direccion: familia.direccion || '',
    telefono: familia.telefono || '',
    estado_lista: normalizarEstadoLista(familia.estado_lista) || 'PRINCIPAL',
    fecha_ingreso: formatearFechaInput(familia.fecha_ingreso || familia.created_at),
    activa: asBoolean(familia.activa),
  };
}

function mapearEvaluacionAFamiliaForm(familia = {}) {
  return {
    situacion_alimentaria: familia.situacion_alimentaria || '',
    frecuencia_asistencia: familia.frecuencia_asistencia || '',
    participacion_merendero: familia.participacion_merendero || '',
  };
}

function esParticipacionMerenderoBloqueada(valor) {
  return normalizarTextoClave(valor) === 'activa';
}

function extraerFamiliaDeRespuesta(respuesta) {
  return respuesta?.data?.family || respuesta?.data?.familia || respuesta?.family || respuesta?.familia || respuesta?.data || respuesta;
}

function extraerIdFamiliaDeRespuesta(respuesta) {
  const familia = extraerFamiliaDeRespuesta(respuesta);
  return familia?.id_familia ?? familia?.id ?? respuesta?.id_familia ?? respuesta?.id ?? null;
}

function esFamiliaEvaluada(familia) {
  if (!familia) return false;
  if (familia.evaluada !== undefined && familia.evaluada !== null) return asBoolean(familia.evaluada);
  return Boolean(
    familia.fecha_ultima_evaluacion ||
    familia.evaluado_por ||
    familia.situacion_alimentaria ||
    familia.frecuencia_asistencia ||
    familia.participacion_merendero ||
    familia.participacion_activa_validada
  );
}

function getPrioridadBadgeClass(prioridad) {
  const normalizada = normalizarTextoClave(prioridad)
  const mapa = {
    muy_baja: 'badge-success',
    baja: 'badge-success',
    media: 'badge-primary',
    alta: 'badge-warning',
    muy_alta: 'badge-danger',
  }

  return mapa[normalizada] || 'badge-primary'
}

function getEstadoBadgeClass(estado) {
  const normalizado = normalizarEstadoLista(estado)
  const mapa = {
    PRINCIPAL: 'badge-success',
    ESPERA: 'badge-primary',
    INACTIVA: 'badge-danger',
  }

  return mapa[normalizado] || 'badge-primary'
}

function getEstadoLabel(estado) {
  return getEtiquetaPorValor(ESTADO_LISTA_OPTIONS, normalizarEstadoLista(estado), estado || 'Sin dato')
}

function getPrioridadLabelExacta(prioridad) {
  return getEtiquetaPorValor(PRIORIDAD_SOCIAL_OPTIONS, normalizarTextoClave(prioridad), prioridad || 'Sin dato')
}

function getSituacionLabel(valor) {
  return getEtiquetaPorValor(SITUACION_ALIMENTARIA_OPTIONS, normalizarTextoClave(valor), valor || 'Sin dato')
}

function getFrecuenciaLabel(valor) {
  return getEtiquetaPorValor(FRECUENCIA_ASISTENCIA_OPTIONS, normalizarTextoClave(valor), valor || 'Sin dato')
}

function getParticipacionMerenderoLabel(valor) {
  return getEtiquetaPorValor(PARTICIPACION_MERENDERO_OPTIONS, normalizarTextoClave(valor), valor || 'Sin dato')
}

function normalizarListaIntegrantes(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.integrantes)) return payload.integrantes;
  if (Array.isArray(payload?.members)) return payload.members;
  return [];
}

function calcularCategoriaEtaria(fechaNacimiento) {
  if (!fechaNacimiento) return 'MENOR';

  const fecha = new Date(fechaNacimiento);
  if (Number.isNaN(fecha.getTime())) return 'MENOR';

  const hoy = new Date();
  let edad = hoy.getFullYear() - fecha.getFullYear();
  const mes = hoy.getMonth() - fecha.getMonth();

  if (mes < 0 || (mes === 0 && hoy.getDate() < fecha.getDate())) {
    edad -= 1;
  }

  return edad >= 18 ? 'ADULTO' : 'MENOR';
}

function formatearNombreIntegrante(integrante) {
  const apellido = integrante?.apellido || integrante?.last_name || '';
  const nombre = integrante?.nombre || integrante?.name || '';

  if (apellido && nombre) return `${apellido}, ${nombre}`;
  return apellido || nombre || `Integrante #${integrante?.id_integrante ?? integrante?.id ?? ''}`;
}

function esIntegranteReferente(integrante, referenteId) {
  if (!integrante || referenteId === null || referenteId === undefined) return false;

  const integranteId = integrante.id_integrante ?? integrante.id;
  return String(integranteId) === String(referenteId);
}

function getCategoriaBadgeClass(categoria) {
  const normalizada = normalizarTextoClave(categoria);
  if (normalizada === 'adulto') return 'badge-success';
  if (normalizada === 'menor') return 'badge-primary';
  return 'badge-warning';
}

function getCategoriaLabel(categoria) {
  const normalizada = normalizarTextoClave(categoria);
  const mapa = {
    adulto: 'Adulto',
    menor: 'Menor',
  };

  return mapa[normalizada] || (categoria ? categoria.toString().replace(/_/g, ' ') : 'Sin dato');
}

function getEstadoListaBadgeClass(estado) {
  return getEstadoBadgeClass(estado);
}

function getEstadoListaLabel(estado) {
  return getEstadoLabel(estado);
}

function Familias({ onNavegar }) {
  // Estados de datos reales (Grilla Principal)
  const [familias, setFamilias] = useState([]);
  const [paginacion, setPaginacion] = useState(null);

  // Estados de UI de la Grilla (Filtros dinámicos conectados a los endpoints de Ignacio)
  // 🍏 NOTA: el filtro de Estado de Lista (PRINCIPAL/ESPERA) fue removido de esta
  // pantalla porque ya existe una vista dedicada (Listas de Espera) para ese caso de uso.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [estadoListaFilter, setEstadoListaFilter] = useState('');
  const [activaFilter, setActivaFilter] = useState('');
  const [evaluadaFilter, setEvaluadaFilter] = useState(''); // 🍏 Filtro 2 y 3: Evaluadas / No Evaluadas
  const [sortByFilter, setSortByFilter] = useState(''); // 🍏 Filtro 5: Ordenar por Puntaje

  // Estados del modal de Nueva Familia (Flujo por etapas)
  const [showNuevoModal, setShowNuevoModal] = useState(false);
  const [formData, setFormData] = useState({
    direccion: '',
    telefono: '',
    estado_lista: 'PRINCIPAL',
    fecha_ingreso: '',
    activa: true,
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(null);

  // Estados del modal de Priorización Social
  const [showEvaluacionModal, setShowEvaluacionModal] = useState(false);
  const [familiaEvaluacionId, setFamiliaEvaluacionId] = useState(null);
  const [evaluacionData, setEvaluacionData] = useState({
    situacion_alimentaria: '',
    frecuencia_asistencia: '',
    participacion_merendero: '',
  });
  const [savingEvaluacion, setSavingEvaluacion] = useState(false);
  const [evaluacionError, setEvaluacionError] = useState(null);

  // Estados compartidos de conectividad (ID activo que se está manipulando)
  const [familiaCreadaId, setFamiliaCreadaId] = useState(null);
  const [showPostCreacion, setShowPostCreacion] = useState(false);

  // Estados del modal "Ver Ficha"
  const [showFichaModal, setShowFichaModal] = useState(false);
  const [fichaData, setFichaData] = useState(null);
  const [loadingFicha, setLoadingFicha] = useState(false);
  const [fichaError, setFichaError] = useState(null);
  const [integrantesFicha, setIntegrantesFicha] = useState([]);
  const [integrantesFichaError, setIntegrantesFichaError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Estados del modal de Edición de Familia
  const [showEditarFamiliaModal, setShowEditarFamiliaModal] = useState(false);
  const [editFamiliaData, setEditFamiliaData] = useState(null);
  const [savingFamiliaEdit, setSavingFamiliaEdit] = useState(false);
  const [editFamiliaError, setEditFamiliaError] = useState(null);

  // Estados del modal de Edición de Integrante
  const [showEditarIntegranteModal, setShowEditarIntegranteModal] = useState(false);
  const [editIntegranteId, setEditIntegranteId] = useState(null);
  const [editIntegranteData, setEditIntegranteData] = useState(null);
  const [savingIntegranteEdit, setSavingIntegranteEdit] = useState(false);
  const [editIntegranteError, setEditIntegranteError] = useState(null);

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
    const fEstadoLista = filtrosManuales.estadoListaFilter !== undefined ? filtrosManuales.estadoListaFilter : estadoListaFilter;
    const fActiva = filtrosManuales.activaFilter !== undefined ? filtrosManuales.activaFilter : activaFilter;
    const fEvaluada = filtrosManuales.evaluadaFilter !== undefined ? filtrosManuales.evaluadaFilter : evaluadaFilter;
    const fSortBy = filtrosManuales.sortByFilter !== undefined ? filtrosManuales.sortByFilter : sortByFilter;

    try {
      const queryParams = new URLSearchParams();
      queryParams.append('per_page', '15');

      // 1. Filtro por Nivel de Prioridad Social
      if (fPrioridad) {
        queryParams.append('prioridad_social', fPrioridad);
      }

      if (fEstadoLista) {
        queryParams.append('estado_lista', fEstadoLista);
      }

      if (fActiva) {
        queryParams.append('activa', fActiva);
      }

      // 2 y 3. Filtro de Evaluadas o No Evaluadas
      if (fEvaluada) {
        queryParams.append('evaluada', fEvaluada);
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
      setError(formatearApiError(err, 'Error al cargar las familias desde el servidor cloud.'));
    } finally {
      setLoading(false);
    }
  }, [searchTerm, priorityFilter, estadoListaFilter, activaFilter, evaluadaFilter, sortByFilter]);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      cargarFamilias();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [cargarFamilias]);

  // ==========================================================================
  // FILTRADO EN CALIENTE (CLIENT-SIDE COMPLEMENTARIO PARA BÚSQUEDA)
  // ==========================================================================
  const familiasFiltradas = familias.filter((familia) => {
    if (priorityFilter && normalizarTextoClave(familia.prioridad_social) !== normalizarTextoClave(priorityFilter)) {
      return false;
    }

    if (estadoListaFilter && normalizarEstadoLista(familia.estado_lista) !== normalizarEstadoLista(estadoListaFilter)) {
      return false;
    }

    if (activaFilter !== '' && asBoolean(familia.activa) !== (activaFilter === 'true')) {
      return false;
    }

    if (evaluadaFilter && String(esFamiliaEvaluada(familia)) !== evaluadaFilter) {
      return false;
    }

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
  const cerrarFichaModal = () => {
    setShowFichaModal(false);
    setFamiliaCreadaId(null);
    setFichaData(null);
    setIntegrantesFicha([]);
    setFichaError(null);
    setIntegrantesFichaError(null);
    setLoadingFicha(false);
    setDeleting(false);
    cerrarModalEvaluacion();
    setShowEditarFamiliaModal(false);
    setEditFamiliaData(null);
    setEditFamiliaError(null);
    setSavingFamiliaEdit(false);
    setShowEditarIntegranteModal(false);
    setEditIntegranteId(null);
    setEditIntegranteData(null);
    setEditIntegranteError(null);
    setSavingIntegranteEdit(false);
    setShowIntegranteModal(false);
    setShowReferenteModal(false);
  };

  const cargarFichaCompleta = useCallback(async (idFamilia) => {
    if (!idFamilia) return;

    setLoadingFicha(true);
    setFichaError(null);
    setIntegrantesFichaError(null);
    setFichaData(null);
    setIntegrantesFicha([]);

    const [fichaResult, integrantesResult] = await Promise.allSettled([
      getFichaFamiliaRequest(idFamilia),
      getIntegrantesRequest(idFamilia),
    ]);

    if (fichaResult.status === 'fulfilled') {
      setFichaData(fichaResult.value);
    } else {
      setFichaError(formatearApiError(fichaResult.reason, 'Error al cargar los detalles de la ficha.'));
    }

    if (integrantesResult.status === 'fulfilled') {
      setIntegrantesFicha(normalizarListaIntegrantes(integrantesResult.value));
    } else {
      setIntegrantesFichaError(formatearApiError(integrantesResult.reason, 'Error al cargar los integrantes de la familia.'));
    }

    setLoadingFicha(false);
  }, []);

  const handleAbrirFicha = async (idFamilia) => {
    setFamiliaCreadaId(idFamilia);
    setShowFichaModal(true);
    setShowEditarFamiliaModal(false);
    setShowEditarIntegranteModal(false);
    setShowIntegranteModal(false);
    setShowReferenteModal(false);
    cerrarModalEvaluacion();
    setEditFamiliaData(null);
    setEditFamiliaError(null);
    setEditIntegranteId(null);
    setEditIntegranteData(null);
    setEditIntegranteError(null);

    await cargarFichaCompleta(idFamilia);
  };

  const refrescarFichaEnCaliente = async () => {
    if (!familiaCreadaId) return;
    await cargarFichaCompleta(familiaCreadaId);
  };

  const cerrarModalEvaluacion = () => {
    setShowEvaluacionModal(false);
    setFamiliaEvaluacionId(null);
    setEvaluacionData({
      situacion_alimentaria: '',
      frecuencia_asistencia: '',
      participacion_merendero: '',
    });
    setEvaluacionError(null);
    setSavingEvaluacion(false);
  };

  const limpiarFormularioFamilia = () => {
    setFormData({
      direccion: '',
      telefono: '',
      estado_lista: 'PRINCIPAL',
      fecha_ingreso: '',
      activa: true,
    });
  };

  // ========================================================================== 
  // ACCIÓN DE ELIMINACIÓN DE LA FAMILIA
  // ========================================================================== 
  const handleEliminarFamilia = async (familiaId = familiaCreadaId) => {
    if (!familiaId) return;

    const seguro = window.confirm('¿Estás seguro de eliminar esta familia? La acción no se puede deshacer.');
    if (!seguro) return;

    setDeleting(true);
    setFichaError(null);

    try {
      await deleteFamiliaRequest(familiaId);

      if (showFichaModal && String(familiaCreadaId) === String(familiaId)) {
        cerrarFichaModal();
      }

      await cargarFamilias();
    } catch (err) {
      const mensaje = formatearApiError(err, 'No se pudo eliminar la familia.');
      if (showFichaModal && String(familiaCreadaId) === String(familiaId)) {
        setFichaError(mensaje);
      } else {
        setError(mensaje);
      }
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
      const payload = {
        direccion: formData.direccion,
        telefono: formData.telefono,
        estado_lista: formData.estado_lista,
        fecha_ingreso: formData.fecha_ingreso,
        activa: formData.activa,
      };

      const data = await createFamiliaRequest(payload);
      const familiaCreada = extraerFamiliaDeRespuesta(data);
      const nuevoId = extraerIdFamiliaDeRespuesta(data);

      setFamiliaCreadaId(nuevoId);
      setSaveSuccess('Familia creada exitosamente.');
      setShowPostCreacion(true);

      if (familiaCreada) {
        setFichaData(familiaCreada);
      }

      await cargarFamilias();
    } catch (err) {
      setSaveError(formatearApiError(err, 'No se pudo crear la familia.'));
    } finally {
      setSaving(false);
    }
  };

  const handleCerrarModalCreacion = () => {
    setShowNuevoModal(false);
    setShowPostCreacion(false);
    setFamiliaCreadaId(null);
    limpiarFormularioFamilia();
    setSaveSuccess(null);
    setSaveError(null);
    setShowIntegranteModal(false);
    setShowReferenteModal(false);
    cerrarModalEvaluacion();

    cargarFamilias();
  };

  const handleAbrirEditarFamilia = (familia = fichaData) => {
    const origen = familia || fichaData;
    const idFamilia = origen?.id_familia ?? origen?.id ?? familiaCreadaId;
    if (!idFamilia) return;

    setFamiliaCreadaId(idFamilia);
    setEditFamiliaError(null);
    setShowEditarIntegranteModal(false);
    setShowIntegranteModal(false);
    setShowReferenteModal(false);
    cerrarModalEvaluacion();

    const cargarDatosActuales = async () => {
      try {
        const respuesta = await getFichaFamiliaRequest(idFamilia);
        const familiaActual = extraerFamiliaDeRespuesta(respuesta) || origen;
        setEditFamiliaData(mapearFamiliaBaseAForm(familiaActual));
      } catch (err) {
        setEditFamiliaData(mapearFamiliaBaseAForm(origen));
        setEditFamiliaError(formatearApiError(err, 'No se pudieron cargar los datos actuales de la familia.'));
      } finally {
        setShowEditarFamiliaModal(true);
      }
    };

    cargarDatosActuales();
  };

  const handleEditarFamiliaInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFamiliaData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCerrarEditarFamilia = () => {
    setShowEditarFamiliaModal(false);
    setEditFamiliaData(null);
    setEditFamiliaError(null);
    setSavingFamiliaEdit(false);
  };

  const handleGuardarFamiliaEdicion = async (e) => {
    e.preventDefault();
    if (!familiaCreadaId || !editFamiliaData) return;

    setSavingFamiliaEdit(true);
    setEditFamiliaError(null);

    try {
      const payload = {
        direccion: editFamiliaData.direccion,
        telefono: editFamiliaData.telefono,
        estado_lista: editFamiliaData.estado_lista,
        fecha_ingreso: editFamiliaData.fecha_ingreso,
        activa: editFamiliaData.activa,
      };

      const respuesta = await updateFamiliaRequest(familiaCreadaId, payload);
      const familiaActualizada = extraerFamiliaDeRespuesta(respuesta);

      setShowEditarFamiliaModal(false);
      setEditFamiliaData(null);

      if (familiaActualizada) {
        setFichaData((prev) => (prev && String(prev.id_familia) === String(familiaCreadaId) ? { ...prev, ...familiaActualizada } : prev));
      }

      await cargarFamilias();
      if (showFichaModal && String(familiaCreadaId) === String(extraerIdFamiliaDeRespuesta(respuesta) || familiaCreadaId)) {
        await cargarFichaCompleta(familiaCreadaId);
      }
    } catch (err) {
      setEditFamiliaError(formatearApiError(err, 'No se pudo guardar la familia.'));
    } finally {
      setSavingFamiliaEdit(false);
    }
  };

  const handleAbrirEvaluacionFamilia = (familia = fichaData) => {
    const origen = familia || fichaData;
    if (!origen) return;

    setFamiliaEvaluacionId(origen.id_familia ?? origen.id ?? familiaCreadaId);
    setEvaluacionData(mapearEvaluacionAFamiliaForm(origen));
    setEvaluacionError(null);
    setShowEvaluacionModal(true);
    setShowEditarFamiliaModal(false);
    setShowEditarIntegranteModal(false);
    setShowIntegranteModal(false);
    setShowReferenteModal(false);
  };

  const handleEvaluacionInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEvaluacionData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCerrarEvaluacionFamilia = () => {
    cerrarModalEvaluacion();
  };

  const handleGuardarEvaluacionFamilia = async (e) => {
    e.preventDefault();
    if (!familiaEvaluacionId) return;

    setSavingEvaluacion(true);
    setEvaluacionError(null);

    try {
      const payload = {
        situacion_alimentaria: evaluacionData.situacion_alimentaria,
        frecuencia_asistencia: evaluacionData.frecuencia_asistencia,
        participacion_merendero: evaluacionData.participacion_merendero,
      };

      const respuesta = await evaluatePrioridadFamiliaRequest(familiaEvaluacionId, payload);
      const familiaActualizada = extraerFamiliaDeRespuesta(respuesta);
      const idActualizado = extraerIdFamiliaDeRespuesta(respuesta) || familiaEvaluacionId;

      setShowEvaluacionModal(false);
      setFamiliaEvaluacionId(null);

      if (familiaActualizada) {
        setFichaData((prev) => (prev && String(prev.id_familia) === String(idActualizado) ? { ...prev, ...familiaActualizada } : prev));
        setFamilias((prev) => prev.map((familia) => (
          String(familia.id_familia) === String(idActualizado)
            ? { ...familia, ...familiaActualizada }
            : familia
        )));
      }

      await cargarFamilias();
      if (showFichaModal && String(familiaCreadaId) === String(idActualizado)) {
        await cargarFichaCompleta(idActualizado);
      }
    } catch (err) {
      setEvaluacionError(formatearApiError(err, 'No se pudo evaluar la prioridad social.'));
    } finally {
      setSavingEvaluacion(false);
    }
  };

  const handleAbrirEditarIntegrante = (integrante) => {
    if (!integrante) return;

    const integranteId = integrante.id_integrante ?? integrante.id;
    const referenteId = fichaData?.referente?.id_integrante ?? fichaData?.referente?.id ?? null;

    setEditIntegranteId(integranteId);
    setEditIntegranteData({
      nombre: integrante.nombre || integrante.name || '',
      apellido: integrante.apellido || '',
      fecha_nacimiento: formatearFechaInput(integrante.fecha_nacimiento),
      tipo_documento: (integrante.tipo_documento || 'DNI').toString().toUpperCase(),
      numero_documento: integrante.numero_documento || '',
      es_referente: esIntegranteReferente(integrante, referenteId),
    });
    setEditIntegranteError(null);
    setShowEditarFamiliaModal(false);
    setShowIntegranteModal(false);
    setShowReferenteModal(false);
    cerrarModalEvaluacion();
    setShowEditarIntegranteModal(true);
  };

  const handleEditarIntegranteInputChange = (e) => {
    const { name, value } = e.target;
    setEditIntegranteData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCerrarEditarIntegrante = () => {
    setShowEditarIntegranteModal(false);
    setEditIntegranteId(null);
    setEditIntegranteData(null);
    setEditIntegranteError(null);
    setSavingIntegranteEdit(false);
  };

  const handleGuardarIntegranteEdicion = async (e) => {
    e.preventDefault();
    if (!editIntegranteId || !editIntegranteData || !familiaCreadaId) return;

    setSavingIntegranteEdit(true);
    setEditIntegranteError(null);

    try {
      const categoriaEtaria = calcularCategoriaEtaria(editIntegranteData.fecha_nacimiento);
      const payload = {
        name: editIntegranteData.nombre,
        nombre: editIntegranteData.nombre,
        apellido: editIntegranteData.apellido,
        fecha_nacimiento: editIntegranteData.fecha_nacimiento,
        tipo_documento: editIntegranteData.tipo_documento.toUpperCase(),
        numero_documento: editIntegranteData.numero_documento,
        referente: editIntegranteData.es_referente ? 1 : 0,
        familia_id: parseInt(familiaCreadaId, 10),
        id_familia: parseInt(familiaCreadaId, 10),
        categoria_etaria: categoriaEtaria,
      };

      await updateIntegranteRequest(editIntegranteId, payload);
      setShowEditarIntegranteModal(false);
      setEditIntegranteId(null);
      setEditIntegranteData(null);
      await cargarFamilias();
      await refrescarFichaEnCaliente();
    } catch (err) {
      setEditIntegranteError(formatearApiError(err, 'No se pudo guardar el integrante.'));
    } finally {
      setSavingIntegranteEdit(false);
    }
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

    const categoriaEtaria = calcularCategoriaEtaria(integranteData.fecha_nacimiento);

    const payload = {
      name: integranteData.nombre,
      nombre: integranteData.nombre,
      apellido: integranteData.apellido,
      fecha_nacimiento: integranteData.fecha_nacimiento,
      tipo_documento: integranteData.tipo_documento.toUpperCase(),
      numero_documento: integranteData.numero_documento,
      referente: 0,
      familia_id: parseInt(familiaCreadaId, 10),
      categoria_etaria: categoriaEtaria, // Sanitización precisa para evitar el 422 de Laravel Cloud
    };

    try {
      await createIntegranteRequest(payload);
      setIntegranteSuccess(`¡${integranteData.nombre} fue añadido correctamente como ${categoriaEtaria.toLowerCase()}!`);

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
      setIntegranteError(formatearApiError(err, 'Error al añadir el integrante.'));
    } finally {
      setSavingIntegrante(false);
    }
  };

  // ==========================================================================
  // FLUJO DEL SUBMODAL DE REFERENTE
  // ========================================================================== 
  const handleAbrirReferente = async () => {
    if (!familiaCreadaId) return;

    setShowReferenteModal(true);
    setLoadingIntegrantes(true);
    setIntegrantesError(null);
    setIntegrantes([]);
    setIntegranteSeleccionado('');
    setReferenteError(null);
    setReferenteSuccess(null);

    try {
      const data = await getIntegrantesRequest(familiaCreadaId);
      const adultos = normalizarListaIntegrantes(data).filter(
        (integrante) => (integrante.categoria_etaria || '').toString().toUpperCase() === 'ADULTO'
      );
      setIntegrantes(adultos);
    } catch (err) {
      setIntegrantesError(formatearApiError(err, 'Error al cargar integrantes.'));
    } finally {
      setLoadingIntegrantes(false);
    }
  };

  const handleAsignarReferente = async () => {
    if (!familiaCreadaId || !integranteSeleccionado) return;

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
          setShowNuevoModal(false);
          setShowPostCreacion(false);
          setFamiliaCreadaId(null);
          setSaveSuccess(null);
          cargarFamilias();
        } else {
          cargarFamilias();
          refrescarFichaEnCaliente();
        }
      }, 1500);
    } catch (err) {
      setReferenteError(formatearApiError(err, 'Error al asignar referente.'));
    } finally {
      setAsignandoReferente(false);
    }
  };

  // Helpers visuales
  const getBadgeClass = (prioridad) => {
    return getPrioridadBadgeClass(prioridad);
  };

  const getPrioridadLabel = (prioridad) => {
    return getPrioridadLabelExacta(prioridad);
  };

  const integrantesFichaVisibles = useMemo(() => {
    const referenteId = fichaData?.referente?.id_integrante ?? fichaData?.referente?.id ?? null;
    const listaBase = normalizarListaIntegrantes(integrantesFicha);
    const listaFallback = listaBase.length > 0 ? listaBase : normalizarListaIntegrantes(fichaData);

    return [...listaFallback].sort((a, b) => {
      const esReferenteA = esIntegranteReferente(a, referenteId);
      const esReferenteB = esIntegranteReferente(b, referenteId);

      if (esReferenteA === esReferenteB) return 0;
      return esReferenteA ? -1 : 1;
    });
  }, [integrantesFicha, fichaData]);

  const merenderoBloqueado = esParticipacionMerenderoBloqueada(evaluacionData.participacion_merendero);

  return (
    <div>
      {/* 🍏 TOOLBAR CON LOS SELECTORES DISPONIBLES DE LA API
          (Se removió el filtro de Estado de Lista: ese filtrado ya vive en la
          pantalla dedicada de Listas de Espera, así que no tiene sentido duplicarlo aquí) */}
      <section className="page-toolbar" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 'var(--space-sm)', alignItems: 'end' }}>
        <div className="search-filter-group" style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 1.6fr) repeat(4, minmax(160px, 1fr))', gap: 'var(--space-xs)', width: '100%' }}>

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
              {PRIORIDAD_SOCIAL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {/* Selector 2: Estado de Lista */}
          <div className="form-group">
            <select
              value={estadoListaFilter}
              onChange={(e) => setEstadoListaFilter(e.target.value)}
            >
              <option value="">Estado (Todos)</option>
              {ESTADO_LISTA_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {/* Selector 3: Activa / Inactiva */}
          <div className="form-group">
            <select
              value={activaFilter}
              onChange={(e) => setActivaFilter(e.target.value)}
            >
              <option value="">Activa (Todas)</option>
              <option value="true">Activas</option>
              <option value="false">Inactivas</option>
            </select>
          </div>

          {/* Selector 4: Estado de Evaluación */}
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
          style={{ minHeight: '40px', padding: '0 1.5rem', whiteSpace: 'nowrap' }}
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
                    {family.referente ? formatearNombreIntegrante(family.referente) : `Familia #${family.id_familia}`}
                  </h2>
                  <p className="referent-info">
                    Ref: {family.referente ? formatearNombreIntegrante(family.referente) : '[Sin referente]'}
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
                  📋 <span>Estado: {getEstadoListaLabel(family.estado_lista)}</span>
                </div>
                <div className="metric-mini">
                  ✅ <span>Activa: {asBoolean(family.activa) ? 'Sí' : 'No'}</span>
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
                    onClick={() => onNavegar('comisiones', { familiaId: family.id_familia, origen: 'familias' })}
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
        <div className="modal-overlay" onClick={() => { if (!deleting) cerrarFichaModal(); }}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '920px' }}>
            <div className="modal-header">
              <h3>📋 Ficha Técnica de Familia {fichaData && `#${fichaData.id_familia}`}</h3>
            </div>

            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {loadingFicha && <p style={{ textAlign: 'center', color: 'var(--color-primary)' }}>Cargando ficha extendida...</p>}
              {fichaError && <div className="login-error">{fichaError}</div>}

              {fichaData && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 'var(--space-sm)', borderBottom: '1px solid #e2e8f0', paddingBottom: 'var(--space-sm)' }}>
                    <div><strong>Dirección:</strong> {fichaData.direccion || '[N/D]'}</div>
                    <div><strong>Teléfono:</strong> {fichaData.telefono || '[N/D]'}</div>
                    <div><strong>Fecha Ingreso:</strong> {formatearFechaLegible(fichaData.fecha_ingreso || fichaData.created_at)}</div>
                    <div>
                      <strong>Estado:</strong> <span className={`badge ${getEstadoListaBadgeClass(fichaData.estado_lista)}`}>{getEstadoListaLabel(fichaData.estado_lista)}</span>
                    </div>
                    <div>
                      <strong>Activa:</strong> {asBoolean(fichaData.activa) ? 'Sí' : 'No'}
                    </div>
                    {fichaData.porciones_comida !== undefined && fichaData.porciones_comida !== null && (
                      <div><strong>Porciones comida:</strong> {fichaData.porciones_comida}</div>
                    )}
                    {fichaData.ausentismo_critico !== undefined && fichaData.ausentismo_critico !== null && (
                      <div><strong>Ausentismo crítico:</strong> {asBoolean(fichaData.ausentismo_critico) ? 'Sí' : 'No'}</div>
                    )}
                  </div>

                  <div style={{ backgroundColor: '#f7fafc', padding: 'var(--space-sm)', borderRadius: '6px' }}>
                    <h4 style={{ margin: '0 0 var(--space-xs) 0', fontSize: '1rem', color: 'var(--color-primary)' }}>👑 Referente Designado</h4>
                    {fichaData.referente ? (
                      <p style={{ margin: 0 }}>
                        {formatearNombreIntegrante(fichaData.referente)} &bull; <strong>{fichaData.referente.tipo_documento}:</strong> {fichaData.referente.numero_documento}
                      </p>
                    ) : (
                      <p style={{ margin: 0, color: '#e53e3e', fontWeight: 500 }}>⚠️ Sin referente asignado en el sistema.</p>
                    )}
                  </div>

                  <section className="family-priority-section">
                    <div className="section-heading">
                      <div>
                        <h4>📊 Priorización social</h4>
                        <p>Estos campos son de solo lectura. La validación activa puede mover la familia a PRINCIPAL.</p>
                      </div>
                      <button
                        type="button"
                        className="btn-table-action"
                        onClick={() => handleAbrirEvaluacionFamilia(fichaData)}
                        disabled={loadingFicha || deleting}
                      >
                        ✍️ Evaluar priorización
                      </button>
                    </div>

                    <div className="priority-read-grid">
                      <div className="priority-read-card">
                        <small>Prioridad social</small>
                        <span className={`badge ${getBadgeClass(fichaData.prioridad_social)}`}>{getPrioridadLabel(fichaData.prioridad_social)}</span>
                      </div>
                      <div className="priority-read-card">
                        <small>Situación alimentaria</small>
                        <strong>{getSituacionLabel(fichaData.situacion_alimentaria)}</strong>
                      </div>
                      <div className="priority-read-card">
                        <small>Frecuencia asistencia</small>
                        <strong>{getFrecuenciaLabel(fichaData.frecuencia_asistencia)}</strong>
                      </div>
                      <div className="priority-read-card">
                        <small>Participación merendero</small>
                        <strong>{getParticipacionMerenderoLabel(fichaData.participacion_merendero)}</strong>
                      </div>
                      <div className="priority-read-card">
                        <small>Validación activa</small>
                        <strong>{asBoolean(fichaData.participacion_activa_validada) ? 'Sí' : 'No'}</strong>
                      </div>
                      <div className="priority-read-card">
                        <small>Evaluado por</small>
                        <strong>{fichaData.evaluado_por ? formatearNombreIntegrante(fichaData.evaluado_por) : 'Pendiente'}</strong>
                      </div>
                      <div className="priority-read-card">
                        <small>Última evaluación</small>
                        <strong>{formatearFechaLegible(fichaData.fecha_ultima_evaluacion)}</strong>
                      </div>
                    </div>
                  </section>

                  <section className="family-integrantes-section">
                    <div className="section-heading">
                      <div>
                        <h4>👥 Integrantes de la familia</h4>
                        <p>Editá cada miembro desde esta ficha.</p>
                      </div>
                      <button
                        type="button"
                        className="btn-table-action"
                        onClick={() => setShowIntegranteModal(true)}
                        disabled={loadingFicha || deleting}
                      >
                        ➕ Añadir integrante
                      </button>
                    </div>

                    {integrantesFichaError && <div className="login-error">{integrantesFichaError}</div>}

                    {!integrantesFichaError && integrantesFichaVisibles.length === 0 && !loadingFicha && (
                      <div className="integrante-empty-state">
                        No hay integrantes cargados para esta familia.
                      </div>
                    )}

                    {integrantesFichaVisibles.length > 0 && (
                      <div className="integrantes-grid">
                        {integrantesFichaVisibles.map((integrante) => {
                          const integranteId = integrante.id_integrante ?? integrante.id;
                          const referenteId = fichaData.referente?.id_integrante ?? fichaData.referente?.id ?? null;
                          const esReferente = esIntegranteReferente(integrante, referenteId);

                          return (
                            <article className="integrante-card" key={integranteId}>
                              <div className="integrante-card-header">
                                <div>
                                  <h5>{formatearNombreIntegrante(integrante)}</h5>
                                  <p>{integrante.tipo_documento || 'DNI'} {integrante.numero_documento || '[N/D]'}</p>
                                </div>
                                <div className="integrante-badges">
                                  {esReferente && <span className="badge badge-success">Referente</span>}
                                  <span className={`badge ${getCategoriaBadgeClass(integrante.categoria_etaria)}`}>
                                    {getCategoriaLabel(integrante.categoria_etaria)}
                                  </span>
                                </div>
                              </div>

                              <div className="integrante-meta-grid">
                                <div className="integrante-meta">
                                  <span>Fecha Nac.</span>
                                  <strong>{formatearFechaLegible(integrante.fecha_nacimiento)}</strong>
                                </div>
                                <div className="integrante-meta">
                                  <span>Documento</span>
                                  <strong>{integrante.tipo_documento || 'DNI'} {integrante.numero_documento || '[N/D]'}</strong>
                                </div>
                                <div className="integrante-meta">
                                  <span>Categoría</span>
                                  <strong>{getCategoriaLabel(integrante.categoria_etaria)}</strong>
                                </div>
                                <div className="integrante-meta">
                                  <span>Rol</span>
                                  <strong>{esReferente ? 'Referente' : 'Integrante'}</strong>
                                </div>
                              </div>

                              <div className="integrante-card-actions">
                                <button
                                  type="button"
                                  className="btn-table-action"
                                  onClick={() => handleAbrirEditarIntegrante(integrante)}
                                  disabled={savingIntegranteEdit || savingFamiliaEdit}
                                >
                                  ✏️ Editar integrante
                                </button>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </section>

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
                style={{ padding: '0 1rem', minHeight: '40px' }}
                onClick={handleAbrirReferente}
                disabled={loadingFicha || deleting}
              >
                👑 Cambiar Referente
              </button>
              <button
                type="button"
                className="btn-table-action"
                style={{ minHeight: '40px', padding: '0 1rem' }}
                onClick={() => handleAbrirEvaluacionFamilia(fichaData)}
                disabled={loadingFicha || deleting}
              >
                ✍️ Evaluar Prioridad
              </button>
              <button
                type="button"
                className="btn-table-action"
                style={{ minHeight: '40px', padding: '0 1rem' }}
                onClick={handleAbrirEditarFamilia}
                disabled={loadingFicha || deleting}
              >
                ✏️ Editar Familia
              </button>
              <button
                type="button"
                className="btn-table-action action-secondary"
                style={{ minHeight: '40px' }}
                onClick={cerrarFichaModal}
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
              <h3>➕ Nueva Familia {familiaCreadaId && `(#${familiaCreadaId})`}</h3>
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

                  <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
                    <div className="form-group">
                      <label htmlFor="estado_lista">Estado Lista</label>
                      <select
                        id="estado_lista"
                        name="estado_lista"
                        value={formData.estado_lista}
                        onChange={handleInputChange}
                        required
                      >
                        {ESTADO_LISTA_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', cursor: 'pointer', marginTop: '1.5rem' }}>
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
                    className="btn-table-action"
                    onClick={() => handleAbrirEvaluacionFamilia(fichaData ? { ...fichaData, id_familia: familiaCreadaId } : { id_familia: familiaCreadaId })}
                    disabled={!familiaCreadaId}
                  >
                    ✍️ Evaluar Prioridad Social
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
                        {formatearNombreIntegrante(integrante)} — DNI {integrante.numero_documento}
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

      {/* ==========================================================================
          MODAL: EDITAR FAMILIA
          ========================================================================== */}
      {showEditarFamiliaModal && editFamiliaData && (
        <div className="modal-overlay" onClick={handleCerrarEditarFamilia}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '720px' }}>
            <div className="modal-header">
              <h3>✏️ Editar Familia {fichaData && `#${fichaData.id_familia}`}</h3>
            </div>

            <form onSubmit={handleGuardarFamiliaEdicion}>
              <div className="modal-body">
                <p className="edit-form-note">Los cambios se guardan sobre la ficha y se reflejan en la grilla principal.</p>
                {editFamiliaError && <div className="login-error" style={{ marginBottom: 'var(--space-md)' }}>{editFamiliaError}</div>}

                <div className="form-group">
                  <label htmlFor="edit-direccion">Dirección</label>
                  <input
                    id="edit-direccion"
                    name="direccion"
                    type="text"
                    value={editFamiliaData.direccion}
                    onChange={handleEditarFamiliaInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-telefono">Teléfono</label>
                  <input
                    id="edit-telefono"
                    name="telefono"
                    type="text"
                    value={editFamiliaData.telefono}
                    onChange={handleEditarFamiliaInputChange}
                    required
                  />
                </div>

                <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
                  <div className="form-group">
                    <label htmlFor="edit-estado_lista">Estado Lista</label>
                    <select
                      id="edit-estado_lista"
                      name="estado_lista"
                      value={editFamiliaData.estado_lista}
                      onChange={handleEditarFamiliaInputChange}
                      required
                    >
                      {ESTADO_LISTA_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="family-edit-switch" htmlFor="edit-activa">
                      <input
                        id="edit-activa"
                        name="activa"
                        type="checkbox"
                        checked={Boolean(editFamiliaData.activa)}
                        onChange={handleEditarFamiliaInputChange}
                      />
                      Familia Activa
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="edit-fecha_ingreso">Fecha de Ingreso</label>
                  <input
                    id="edit-fecha_ingreso"
                    name="fecha_ingreso"
                    type="date"
                    value={editFamiliaData.fecha_ingreso}
                    onChange={handleEditarFamiliaInputChange}
                    required
                  />
                </div>

              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-table-action action-secondary"
                  onClick={handleCerrarEditarFamilia}
                  disabled={savingFamiliaEdit}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={savingFamiliaEdit}>
                  {savingFamiliaEdit ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================================================
          MODAL: EDITAR INTEGRANTE
          ========================================================================== */}
      {showEditarIntegranteModal && editIntegranteData && (
        <div className="modal-overlay" onClick={handleCerrarEditarIntegrante}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3>✏️ Editar Integrante {editIntegranteId ? `#${editIntegranteId}` : ''}</h3>
            </div>

            <form onSubmit={handleGuardarIntegranteEdicion}>
              <div className="modal-body">
                <p className="edit-form-note">El referente se administra desde el botón de referente. Acá solo actualizás los datos personales.</p>
                {editIntegranteError && <div className="login-error" style={{ marginBottom: 'var(--space-md)' }}>{editIntegranteError}</div>}

                <div className="form-group">
                  <label htmlFor="edit-nombre">Nombre</label>
                  <input
                    id="edit-nombre"
                    name="nombre"
                    type="text"
                    value={editIntegranteData.nombre}
                    onChange={handleEditarIntegranteInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-apellido">Apellido</label>
                  <input
                    id="edit-apellido"
                    name="apellido"
                    type="text"
                    value={editIntegranteData.apellido}
                    onChange={handleEditarIntegranteInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-fecha_nacimiento">Fecha de Nacimiento</label>
                  <input
                    id="edit-fecha_nacimiento"
                    name="fecha_nacimiento"
                    type="date"
                    value={editIntegranteData.fecha_nacimiento}
                    onChange={handleEditarIntegranteInputChange}
                    required
                  />
                </div>

                <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-sm)' }}>
                  <div className="form-group">
                    <label htmlFor="edit-tipo_documento">Tipo Doc.</label>
                    <select
                      id="edit-tipo_documento"
                      name="tipo_documento"
                      value={editIntegranteData.tipo_documento}
                      onChange={handleEditarIntegranteInputChange}
                      required
                    >
                      <option value="DNI">DNI</option>
                      <option value="LC">LC</option>
                      <option value="LE">LE</option>
                      <option value="PASAPORTE">Pasaporte</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="edit-numero_documento">Número Documento</label>
                    <input
                      id="edit-numero_documento"
                      name="numero_documento"
                      type="text"
                      value={editIntegranteData.numero_documento}
                      onChange={handleEditarIntegranteInputChange}
                      required
                    />
                  </div>
                </div>

                <div style={{ marginTop: 'var(--space-sm)', fontSize: 'var(--text-sm)', color: '#718096' }}>
                  Rol actual: <strong>{editIntegranteData.es_referente ? 'Referente' : 'Integrante'}</strong>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-table-action action-secondary"
                  onClick={handleCerrarEditarIntegrante}
                  disabled={savingIntegranteEdit}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={savingIntegranteEdit}>
                  {savingIntegranteEdit ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================================================
          MODAL: EVALUAR PRIORIZACIÓN SOCIAL
          ========================================================================== */}
      {showEvaluacionModal && (
        <div className="modal-overlay" onClick={handleCerrarEvaluacionFamilia}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <h3>✍️ Evaluar Prioridad Social {familiaEvaluacionId ? `#${familiaEvaluacionId}` : ''}</h3>
            </div>

            <form onSubmit={handleGuardarEvaluacionFamilia}>
              <div className="modal-body">
                <p className="edit-form-note">Usá esta evaluación para que el backend calcule la prioridad social.</p>
                {evaluacionError && <div className="login-error" style={{ marginBottom: 'var(--space-md)' }}>{evaluacionError}</div>}

                <div className="form-grid-3">
                  <div className="form-group">
                    <label htmlFor="situacion_alimentaria">Situación alimentaria</label>
                    <select
                      id="situacion_alimentaria"
                      name="situacion_alimentaria"
                      value={evaluacionData.situacion_alimentaria}
                      onChange={handleEvaluacionInputChange}
                      required
                    >
                      <option value="">Seleccionar...</option>
                      {SITUACION_ALIMENTARIA_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="frecuencia_asistencia">Frecuencia de asistencia</label>
                    <select
                      id="frecuencia_asistencia"
                      name="frecuencia_asistencia"
                      value={evaluacionData.frecuencia_asistencia}
                      onChange={handleEvaluacionInputChange}
                      required
                    >
                      <option value="">Seleccionar...</option>
                      {FRECUENCIA_ASISTENCIA_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="participacion_merendero">Participación en merendero</label>
                    <select
                      id="participacion_merendero"
                      name="participacion_merendero"
                      value={evaluacionData.participacion_merendero}
                      onChange={handleEvaluacionInputChange}
                      required
                      disabled={merenderoBloqueado}
                    >
                      <option value="">Seleccionar...</option>
                      {merenderoBloqueado && (
                        <option value="activa" disabled>
                          Activa
                        </option>
                      )}
                      {PARTICIPACION_MERENDERO_OPTIONS.filter((option) => option.value !== 'activa').map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-table-action action-secondary"
                  onClick={handleCerrarEvaluacionFamilia}
                  disabled={savingEvaluacion}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={savingEvaluacion}>
                  {savingEvaluacion ? 'Guardando...' : 'Guardar evaluación'}
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
