const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const SESSION_EXPIRED_EVENT = 'auth:session-expired'

export const ESTADO_LISTA_OPTIONS = [
  { value: 'PRINCIPAL', label: 'Principal' },
  { value: 'ESPERA', label: 'Espera' },
  { value: 'INACTIVA', label: 'Inactiva' },
]

export const PRIORIDAD_SOCIAL_OPTIONS = [
  { value: 'muy_baja', label: 'Muy baja' },
  { value: 'baja', label: 'Baja' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta' },
  { value: 'muy_alta', label: 'Muy alta' },
]

export const SITUACION_ALIMENTARIA_OPTIONS = [
  { value: 'sin_urgencia', label: 'Sin urgencia' },
  { value: 'moderada', label: 'Moderada' },
  { value: 'urgente', label: 'Urgente' },
]

export const FRECUENCIA_ASISTENCIA_OPTIONS = [
  { value: 'ocasional', label: 'Ocasional' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'mas_de_una_vez', label: 'Más de una vez' },
]

export const PARTICIPACION_MERENDERO_OPTIONS = [
  { value: 'no_participa', label: 'No participa' },
  { value: 'ocasional', label: 'Ocasional' },
  { value: 'activa', label: 'Activa' },
]

function coerceBoolean(value) {
  if (value === true || value === 1 || value === '1') return true
  if (typeof value === 'string') {
    return value.toLowerCase().trim() === 'true'
  }
  return false
}

function pickString(value) {
  return value === null || value === undefined ? '' : String(value).trim()
}

function pickAllowedValue(value, allowedValues) {
  const normalized = pickString(value)
  return allowedValues.includes(normalized) ? normalized : ''
}

function normalizeMessage(value) {
  return pickString(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function isSessionExpiredMessage(value) {
  const normalized = normalizeMessage(value)
  return normalized.includes('sesion expiro') || normalized.includes('session expired')
}

function emitSessionExpired() {
  if (typeof window === 'undefined') return

  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT))
}

function buildFamiliaBasePayload(payload = {}) {
  const body = {}

  if (Object.prototype.hasOwnProperty.call(payload, 'direccion')) {
    body.direccion = pickString(payload.direccion)
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'telefono')) {
    body.telefono = pickString(payload.telefono)
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'estado_lista')) {
    body.estado_lista = pickAllowedValue(
      pickString(payload.estado_lista).toUpperCase(),
      ESTADO_LISTA_OPTIONS.map((option) => option.value)
    )
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'fecha_ingreso')) {
    body.fecha_ingreso = pickString(payload.fecha_ingreso).slice(0, 10)
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'activa')) {
    body.activa = coerceBoolean(payload.activa) ? 1 : 0
  }

  return body
}

function buildEvaluacionPrioridadPayload(payload = {}) {
  return {
    situacion_alimentaria: pickAllowedValue(payload.situacion_alimentaria, ['sin_urgencia', 'moderada', 'urgente']),
    frecuencia_asistencia: pickAllowedValue(payload.frecuencia_asistencia, ['ocasional', 'semanal', 'mas_de_una_vez']),
    participacion_merendero: pickAllowedValue(payload.participacion_merendero, ['no_participa', 'ocasional', 'activa']),
  }
}

export function getApiErrorInfo(error, fallbackMessage = 'No se pudo completar la solicitud') {
  const status = error?.status ?? error?.response?.status ?? null
  const data = error?.data ?? error?.response?.data ?? null

  if (status === 401) {
    return { status, message: 'Tu sesión expiró. Volvé a iniciar sesión.', data }
  }

  if (status === 403) {
    return { status, message: 'No tenés permisos para realizar esta acción.', data }
  }

  if (status === 422) {
    const validationErrors = data?.errors && typeof data.errors === 'object'
      ? Object.values(data.errors).flat().filter(Boolean)
      : []

    return {
      status,
      message: validationErrors.length
        ? validationErrors.join(' ')
        : data?.message || 'Hay errores de validación. Revisá los campos del formulario.',
      data,
    }
  }

  return {
    status,
    message: error?.message || data?.message || fallbackMessage,
    data,
  }
}

function normalizeBaseUrl(url) {
  return url.replace(/\/+$/, '')
}

export function buildApiUrl(path) {
  const base = normalizeBaseUrl(RAW_API_URL)
  const cleanedPath = path.startsWith('/') ? path : `/${path}`

  if (base.endsWith('/api') && cleanedPath.startsWith('/api/')) {
    return `${base}${cleanedPath.slice(4)}`
  }

  if (base.endsWith('/api') && cleanedPath === '/api') {
    return base
  }

  return `${base}${cleanedPath}`
}

async function parseJsonResponse(response) {
  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    return response.json()
  }

  const text = await response.text()
  return text ? { message: text } : {}
}

export async function apiRequest(path, options = {}) {
  const response = await fetch(buildApiUrl(path), {
    redirect: 'manual', // 🍏 CRÍTICO: Evita que el navegador siga redirecciones web ocultas y rompa por CORS
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
    ...options,
  })

  // Si la respuesta es de tipo opaca/redirección (código 0 o 3xx) pero el servidor procesó el POST
  if (response.type === 'opaqueredirect' || response.status === 302) {
    return { message: 'Operación procesada en el servidor' }
  }

  const data = await parseJsonResponse(response)

  const message = data?.message || data?.error || response.statusText || ''
  const sessionExpired = response.status === 401 || response.status === 419 || isSessionExpiredMessage(message)

  if (sessionExpired) {
    emitSessionExpired()

    if (response.ok) {
      const error = new Error(message || 'Tu sesión expiró. Volvé a iniciar sesión.')
      error.status = response.status || 401
      error.data = data
      throw error
    }
  }

  // Modificamos para aceptar respuestas en el rango 200-299 o redirecciones controladas
  if (!response.ok && response.status !== 0) {
    const error = new Error(message || 'No se pudo completar la solicitud')
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

export async function loginRequest(credentials) {
  return apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

export async function meRequest(accessToken) {
  return apiRequest('/api/auth/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

export async function logoutRequest(accessToken) {
  return apiRequest('/api/auth/logout', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

export async function getNotificacionesRequest(queryParams = 'per_page=15') {
  const token = localStorage.getItem('access_token')
  const path = queryParams ? `/api/notificaciones?${queryParams}` : '/api/notificaciones'

  return apiRequest(path, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function getCumpleanosProximosRequest(queryParams = 'dias=14') {
  const token = localStorage.getItem('access_token')
  const path = queryParams ? `/api/cumpleanos/proximos?${queryParams}` : '/api/cumpleanos/proximos'

  return apiRequest(path, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function marcarNotificacionVistaRequest(notificacionId) {
  const token = localStorage.getItem('access_token')
  const id = parseInt(notificacionId, 10)

  return apiRequest(`/api/notificaciones/${id}/visto`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
}

// ========================================================================== 
// FUNCIONES DE FAMILIAS
// ==========================================================================

/**
 * Obtiene el listado paginado de familias.
 * @param {string} [queryParams] - Query string opcional (ej: "per_page=15")
 * @returns {Promise<Object>} Respuesta paginada con data[], links, meta, etc.
 */
export async function getFamiliasRequest(queryParams = '') {
  const token = localStorage.getItem('access_token')
  const path = queryParams ? `/api/familias?${queryParams}` : '/api/familias'

  return apiRequest(path, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

/**
 * Crea una nueva familia en el sistema.
 * @param {Object} payload Datos sanitizados de la familia.
 */
export async function createFamiliaRequest(payload) {
  const token = localStorage.getItem('access_token'); // 🍏 Recuperamos el token fresco del localStorage
  const bodyPayload = buildFamiliaBasePayload(payload)

  return apiRequest('/api/familias', {
    method: 'POST',
    redirect: 'manual', // Evita desvíos locos de CORS
    headers: {
      'Authorization': `Bearer ${token}`, // 👑 Inyectamos la credencial real
      'Accept': 'application/json',       // Forzamos JSON
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(bodyPayload),
  });
}

/**
 * Actualiza los datos principales de una familia.
 * @param {number|string} familiaId
 * @param {Object} payload
 */
export async function updateFamiliaRequest(familiaId, payload) {
  const token = localStorage.getItem('access_token');
  const bodyPayload = buildFamiliaBasePayload(payload)

  return apiRequest(`/api/familias/${parseInt(familiaId, 10)}`, {
    method: 'PUT',
    redirect: 'manual',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bodyPayload),
  });
}

/**
 * Evalúa la priorización social de una familia.
 * @param {number|string} familiaId
 * @param {Object} payload
 */
export async function evaluatePrioridadFamiliaRequest(familiaId, payload) {
  const token = localStorage.getItem('access_token')
  const bodyPayload = buildEvaluacionPrioridadPayload(payload)

  return apiRequest(`/api/familias/${parseInt(familiaId, 10)}/evaluar-prioridad`, {
    method: 'POST',
    redirect: 'manual',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bodyPayload),
  })
}

/**
 * Obtiene los integrantes de una familia.
 * @param {number} familiaId
 * @returns {Promise<Array>} Lista de integrantes.
 */
export async function getIntegrantesRequest(familiaId) {
  const token = localStorage.getItem('access_token')
  const id = parseInt(familiaId, 10)

  return apiRequest(`/api/familias/${id}/integrantes`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
}

/**
 * Asigna un integrante existente como referente de la familia.
 * @param {number|string} familiaId
 * @param {number|string} integranteId
 * @returns {Promise<Object>}
 */
export async function asignarReferenteRequest(familiaId, integranteId) {
  const token = localStorage.getItem('access_token');
  const idParseado = parseInt(integranteId, 10);

  return apiRequest(`/api/familias/${parseInt(familiaId, 10)}/referente`, {
    method: 'PUT',
    redirect: 'manual', 
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json', // 🍏 CRÍTICO: Asegura que Laravel entienda el JSON
    },
    body: JSON.stringify({ 
      integrante_id: idParseado, // Opción A
      id_integrante: idParseado  // Opción B (Doble juego seguro anti-error de validación)
    }),
  });
}


/**
 * Crea un nuevo integrante y lo asocia a una familia.
 * @param {Object} payload Datos sanitizados del integrante.
 */
export async function createIntegranteRequest(payload) {
  const token = localStorage.getItem('access_token');

  return apiRequest('/api/integrantes', {
    method: 'POST',
    redirect: 'manual', // 🍏 Blindaje anti-CORS si Laravel mete redirección web post-POST
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

/**
 * Actualiza un integrante existente.
 * @param {number|string} integranteId
 * @param {Object} payload
 */
export async function updateIntegranteRequest(integranteId, payload) {
  const token = localStorage.getItem('access_token');

  return apiRequest(`/api/integrantes/${parseInt(integranteId, 10)}`, {
    method: 'PUT',
    redirect: 'manual',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}


/**
 * Obtiene el detalle extendido de una familia por su ID.
 * @param {number|string} familiaId
 * @returns {Promise<Object>}
 */
export async function getFichaFamiliaRequest(familiaId) {
  const token = localStorage.getItem('access_token');

  return apiRequest(`/api/familias/${parseInt(familiaId, 10)}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });
}


/**
 * Elimina una familia del sistema de forma permanente.
 * @param {number|string} familiaId
 * @returns {Promise<Object>}
 */
export async function deleteFamiliaRequest(familiaId) {
  const token = localStorage.getItem('access_token');

  return apiRequest(`/api/familias/${parseInt(familiaId, 10)}`, {
    method: 'DELETE',
    redirect: 'manual',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });
}


// ==========================================================================
// FUNCIONES DE ASISTENCIA (INTEGRACIÓN BACKEND)
// ==========================================================================

/**
 * Obtiene el listado de familias activas para la planilla operativa.
 * Filtra de forma obligatoria por per_page=100 para capturar el padrón entero.
 * @returns {Promise<Object>} JSON con la propiedad data conteniendo el array de familias.
 */
export async function getFamiliasPrincipalesRequest(queryParams = 'per_page=100') {
  const token = localStorage.getItem('access_token');
  const path = queryParams ? `/api/familias?${queryParams}` : '/api/familias';

  return apiRequest(path, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
}

/**
 * Obtiene el listado paginado de comisiones disponibles.
 * @param {string} [queryParams] Query string opcional (ej: "per_page=15")
 * @returns {Promise<Object>} Respuesta paginada con data[], links, meta, etc.
 */
export async function getComisionesRequest(queryParams = 'per_page=15') {
  const token = localStorage.getItem('access_token');
  const path = queryParams ? `/api/comisiones?${queryParams}` : '/api/comisiones';

  return apiRequest(path, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
}

/**
 * Obtiene el listado paginado de usuarios del sistema.
 * @param {string} [queryParams] Query string opcional (ej: "per_page=100")
 * @returns {Promise<Object>} Respuesta paginada con data[], links, meta, etc.
 */
export async function getUsuariosRequest(queryParams = 'per_page=15') {
  const token = localStorage.getItem('access_token');
  const path = queryParams ? `/api/usuarios?${queryParams}` : '/api/usuarios';

  return apiRequest(path, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
}

function buildComisionPayload(payload = {}) {
  const nombre = pickString(payload.nombre);
  const descripcion = pickString(payload.descripcion);
  const activa = coerceBoolean(payload.activa);
  const encargado = payload.encargado ?? payload.encargadoId ?? payload.encargado_id ?? null;

  const body = {
    nombre,
    descripcion,
    activa,
  };

  body.encargado = encargado === null || encargado === '' ? null : Number.parseInt(encargado, 10);

  return body;
}

export async function createComisionRequest(payload) {
  const token = localStorage.getItem('access_token');

  return apiRequest('/api/comisiones', {
    method: 'POST',
    redirect: 'manual',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildComisionPayload(payload)),
  });
}

export async function updateComisionRequest(comisionId, payload) {
  const token = localStorage.getItem('access_token');
  const id = parseInt(comisionId, 10);

  return apiRequest(`/api/comisiones/${id}`, {
    method: 'PUT',
    redirect: 'manual',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildComisionPayload(payload)),
  });
}

export async function deleteComisionRequest(comisionId) {
  const token = localStorage.getItem('access_token');
  const id = parseInt(comisionId, 10);

  return apiRequest(`/api/comisiones/${id}`, {
    method: 'DELETE',
    redirect: 'manual',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });
}

/**
 * Obtiene las participaciones activas de una comisión.
 * @param {number|string} comisionId
 * @returns {Promise<Array|Object>}
 */
export async function getComisionParticipacionesActivasRequest(comisionId) {
  const token = localStorage.getItem('access_token');
  const id = parseInt(comisionId, 10);

  return apiRequest(`/api/comisiones/${id}/participaciones/activas`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
}

/**
 * Crea o actualiza una participación de comisión usando estado activo/inactivo.
 * @param {Object} payload
 */
export async function createParticipacionComisionRequest(payload) {
  const token = localStorage.getItem('access_token');

  return apiRequest('/api/participaciones-comision', {
    method: 'POST',
    redirect: 'manual',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

/**
 * Obtiene el historial global de registros de asistencia.
 * @param {string} [queryParams] Query string opcional (ej: "per_page=100")
 * @returns {Promise<Object>} Colección paginada de registros de asistencia.
 */
export async function getHistorialAsistenciaRequest(queryParams = 'per_page=100') {
  const token = localStorage.getItem('access_token');
  const path = queryParams ? `/api/registros-asistencia?${queryParams}` : '/api/registros-asistencia';

  return apiRequest(path, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
}

/**
 * Registra una inasistencia/ausencia de una familia en la jornada.
 * Aplica blindaje mutativo anti-CORS de Laravel Cloud y doble payload en IDs.
 * @param {Object} payload Estructura con familia_id, fecha y estado.
 */
export async function createRegistroAsistenciaRequest(payload) {
  const token = localStorage.getItem('access_token');

  return apiRequest('/api/registros-asistencia', {
    method: 'POST',
    redirect: 'manual', // 🛡️ Evita bloqueos falsos de CORS por desvíos 302 internos
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

/**
 * Actualiza un registro de asistencia existente.
 * @param {number|string} registroId
 * @param {Object} payload
 */
export async function updateRegistroAsistenciaRequest(registroId, payload) {
  const token = localStorage.getItem('access_token');

  return apiRequest(`/api/registros-asistencia/${parseInt(registroId, 10)}`, {
    method: 'PUT',
    redirect: 'manual',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

/**
 * Actualiza la comisión de trabajo asignada a una familia.
 * @param {number|string} familiaId - ID de la familia a mutar.
 * @param {string} nuevaComision - El string de la comisión ('cocina', 'ropero', 'limpieza', 'ninguna').
 */
export async function updateComisionFamiliaRequest(familiaId, nuevaComision) {
  const token = localStorage.getItem('access_token');
  const id = parseInt(familiaId, 10);

  return apiRequest(`/api/familias/${id}`, {
    method: 'PUT',
    redirect: 'manual', // 🛡️ Evita bloqueos de CORS falsos por desvíos 302
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      comision_actual: nuevaComision.toLowerCase().trim(),
      // Doble juego de variables por compatibilidad de FormRequest en Laravel
      comisionActual: nuevaComision.toLowerCase().trim()
    }),
  });
}

// ==========================================================================
// FUNCIONES DE DONACIONES (INTEGRACIÓN BACKEND)
// ==========================================================================

/**
 * PETICIÓN 1: Obtiene el listado paginado de donaciones registradas.
 * @param {string} [queryParams] Query string opcional (ej: "per_page=15")
 * @returns {Promise<Object>} Respuesta paginada con data[], links, meta, etc.
 */
export async function getDonacionesRequest(queryParams = 'per_page=15') {
  const token = localStorage.getItem('access_token');
  const path = queryParams ? `/api/donaciones?${queryParams}` : '/api/donaciones';

  return apiRequest(path, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
}

/**
 * PETICIÓN 2: Registra el ingreso de una nueva donación.
 * @param {Object} payload Estructura con origen, descripcion, cantidad, unidad_medida, fecha_recepcion, registrado_por, familia_id.
 */
export async function createDonacionRequest(payload) {
  const token = localStorage.getItem('access_token');

  return apiRequest('/api/donaciones', {
    method: 'POST',
    redirect: 'manual', // 🛡️ Evita bloqueos falsos de CORS por desvíos 302 internos
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

/**
 * PETICIÓN 3: Ajusta/actualiza una donación existente.
 * @param {number|string} donacionId
 * @param {Object} payload Estructura con origen, descripcion, cantidad, unidad_medida, fecha_recepcion, registrado_por, familia_id.
 */
export async function updateDonacionRequest(donacionId, payload) {
  const token = localStorage.getItem('access_token');
  const id = parseInt(donacionId, 10);

  return apiRequest(`/api/donaciones/${id}`, {
    method: 'PUT',
    redirect: 'manual', // 🛡️ Evita bloqueos de CORS falsos por desvíos 302
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

// ==========================================================================
// FUNCIONES DE CONTROL DE LISTAS (INTEGRACIÓN BACKEND)
// ==========================================================================

/**
 * PETICIÓN 1: Obtiene el listado de familias filtrado por su estado en las listas.
 * @param {string} estadoLista - Tipo de lista ('ESPERA', 'PRINCIPAL', 'INACTIVA').
 * @param {string} [queryParams] - Query string complementario opcional.
 * @returns {Promise<Object>} Respuesta paginada con data[], links, meta, etc.
 */
export async function getFamiliasPorListaRequest(estadoLista, queryParams = 'per_page=100') {
  const token = localStorage.getItem('access_token');
  const estadoSanitizado = estadoLista.toUpperCase().trim();
  const path = `/api/familias?estado_lista=${estadoSanitizado}&${queryParams}`;

  return apiRequest(path, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
}

/**
 * PETICIÓN 2: Actualiza el estado de lista o prioridad de una familia (Promover/Degradar).
 * Aplica blindaje mutativo anti-CORS de Laravel Cloud.
 * @param {number|string} familiaId - ID de la familia a modificar.
 * @param {Object} payload - Objeto que contiene el nuevo estado_lista y registrado_por.
 */
export async function updateEstadoListaRequest(familiaId, payload) {
  return updateFamiliaRequest(familiaId, {
    estado_lista: payload.estado_lista,
  })
}

// ==========================================================================
// 🛡️ FUNCIONES DE GESTIÓN DE USUARIOS (ADMINISTRACIÓN) - AISLADAS
// ==========================================================================

export async function getUsuariosAdminRequest(queryParams = 'per_page=15') {
  const token = localStorage.getItem('access_token')
  const path = queryParams ? `/api/usuarios?${queryParams}` : '/api/usuarios'

  return apiRequest(path, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function createUsuarioAdminRequest(payload) {
  const token = localStorage.getItem('access_token')

  return apiRequest('/api/usuarios', {
    method: 'POST',
    redirect: 'manual',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json' // 🍏 Forzado exclusivo aquí
    },
    body: JSON.stringify(payload),
  })
}

export async function updateUsuarioAdminRequest(usuarioId, payload) {
  const token = localStorage.getItem('access_token')

  return apiRequest(`/api/usuarios/${parseInt(usuarioId, 10)}`, {
    method: 'PUT',
    redirect: 'manual',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json' // 🍏 Forzado exclusivo aquí
    },
    body: JSON.stringify(payload),
  })
}

export async function deleteUsuarioAdminRequest(usuarioId) {
  const token = localStorage.getItem('access_token')

  return apiRequest(`/api/usuarios/${parseInt(usuarioId, 10)}`, {
    method: 'DELETE',
    redirect: 'manual',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    },
  })
}
