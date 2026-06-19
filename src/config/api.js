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
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
    ...options,
  })

  const data = await parseJsonResponse(response)

  if (!response.ok) {
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
