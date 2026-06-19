import { createElement, useEffect, useState } from 'react'
import Login from './pages/Login/Login.jsx'
import { logoutRequest, meRequest } from './config/api.js'

function App() {
  const [session, setSession] = useState(null)
  const [booting, setBooting] = useState(true)

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('access_token')

      if (!token) {
        setBooting(false)
        return
      }

      try {
        const response = await meRequest(token)
        setSession({ accessToken: token, user: response.user || response.data || response })
      } catch {
        localStorage.removeItem('access_token')
      } finally {
        setBooting(false)
      }
    }

    restoreSession()
  }, [])

  const handleLogin = ({ accessToken, user }) => {
    setSession({ accessToken, user })
  }

  const handleLogout = async () => {
    try {
      if (session?.accessToken) {
        await logoutRequest(session.accessToken)
      }
    } catch {
      // Si logout falla, limpiamos igual la sesión local.
    } finally {
      localStorage.removeItem('access_token')
      setSession(null)
    }
  }

  if (booting) {
    return (
      <div className="login-wrapper" style={{ placeItems: 'center', justifyContent: 'center' }}>
        <div className="login-success">Cargando sesión...</div>
      </div>
    )
  }

  if (!session) {
    return createElement(Login, { onLogin: handleLogin })
  }

  return (
    <main className="login-wrapper" style={{ padding: 'var(--space-lg)' }}>
      <section className="login-form-panel" style={{ padding: 0 }}>
        <div className="form-box" style={{ maxWidth: '560px' }}>
          <header className="form-header" style={{ textAlign: 'left' }}>
            <div className="brand-badge">CC</div>
            <h1>Sesión iniciada</h1>
            <p>Autenticación confirmada contra la API del backend.</p>
          </header>

          <div className="login-success">
            <strong>Usuario:</strong> {session.user?.name || session.user?.nombre || session.user?.email || 'Autenticado'}
          </div>

          <div className="login-note" style={{ marginTop: 'var(--space-md)', textAlign: 'left' }}>
            <code>access_token</code> guardado en localStorage y validado con <code>/api/auth/me</code>.
          </div>

          <button className="btn-primary" type="button" onClick={handleLogout} style={{ marginTop: 'var(--space-lg)' }}>
            Cerrar sesión
          </button>
        </div>
      </section>
    </main>
  )
}

export default App;
