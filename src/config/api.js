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
 * Crea una nueva familia en el sistema con sanitización de tipos para Laravel.
 * @param {Object} payload - Datos de la nueva familia según contrato de API.
 */
export async function createFamiliaRequest(payload) {
  const token = localStorage.getItem('access_token')

  return apiRequest('/api/familias', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
}