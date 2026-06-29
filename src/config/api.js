const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

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

  // Modificamos para aceptar respuestas en el rango 200-299 o redirecciones controladas
  if (!response.ok && response.status !== 0) {
    throw new Error(data.message || data.error || 'No se pudo completar la solicitud')
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

  return apiRequest('/api/familias', {
    method: 'POST',
    redirect: 'manual', // Evita desvíos locos de CORS
    headers: {
      'Authorization': `Bearer ${token}`, // 👑 Inyectamos la credencial real
      'Accept': 'application/json',       // Forzamos JSON
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload),
  });
}

/**
 * Actualiza los datos principales de una familia.
 * @param {number|string} familiaId
 * @param {Object} payload
 */
export async function updateFamiliaRequest(familiaId, payload) {
  const token = localStorage.getItem('access_token');

  return apiRequest(`/api/familias/${parseInt(familiaId, 10)}`, {
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
  const token = localStorage.getItem('access_token');
  const id = parseInt(familiaId, 10);

  // Sanitización estricta del payload antes de golpear Laravel
  const bodyPayload = {
    estado_lista: (payload.estado_lista || '').toUpperCase().trim(),
    estadoLista: (payload.estado_lista || '').toUpperCase().trim(), // Doble juego seguro anti-FormRequest
    registrado_por: payload.registrado_por ? parseInt(payload.registrado_por, 10) : 1,
  };

  return apiRequest(`/api/familias/${id}`, {
    method: 'PUT',
    redirect: 'manual', // 🛡️ Evita bloqueos falsos de CORS por desvíos 302 internos de Laravel
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bodyPayload),
  });
}


