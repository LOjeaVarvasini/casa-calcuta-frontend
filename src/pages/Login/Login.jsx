import { useState } from 'react'
import { loginRequest, meRequest } from '../../config/api.js'
import './Login.css'

const initialForm = {
  email: 'admin@example.com',
  password: 'password',
}

function Login({ onLogin }) {
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const loginResponse = await loginRequest({
        email: form.email,
        password: form.password,
      })

      const accessToken = loginResponse.access_token || loginResponse.token

      if (!accessToken) {
        throw new Error('La API no devolvió access_token')
      }

      localStorage.setItem('access_token', accessToken)

      let user = loginResponse.user || null

      try {
        const meResponse = await meRequest(accessToken)
        user = meResponse.user || meResponse.data || meResponse
      } catch {
        // Si /auth/me falla, mantenemos la sesión con el token.
      }

      onLogin({ accessToken, user })
    } catch (loginError) {
      setError(loginError.message || 'No se pudo iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-wrapper">
      <section className="login-side-panel">
        <div className="panel-content">
          <span className="panel-tag">Proyecto comunitario</span>
          <h2>Casa Calcuta</h2>
          <p>Gestión interna, asistencia y seguimiento de familias desde una interfaz clara y mobile-first.</p>
        </div>
        <div className="panel-decoration" aria-hidden="true">
          <div className="circle-1" />
          <div className="circle-2" />
        </div>
      </section>

      <section className="login-form-panel">
        <div className="form-box">
          <header className="form-header">
            <div className="brand-badge">CC</div>
            <h1>Ingresar al sistema</h1>
            <p>Usá tus credenciales para autenticarte con la API del backend.</p>
          </header>

          <form className="custom-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Usuario o correo</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="admin@example.com"
                autoComplete="username"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            {error ? <div className="login-error">{error}</div> : null}

            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Validando...' : 'Iniciar sesión'}
            </button>

          </form>

          <footer className="form-footer">
            <p>Casa Calcuta · Frontend React</p>
          </footer>
        </div>
      </section>
    </main>
  )
}

export default Login
