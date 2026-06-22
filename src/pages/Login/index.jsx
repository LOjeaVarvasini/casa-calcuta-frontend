import { useState } from 'react'
import { loginRequest, meRequest } from '../../config/api.js'
import './login.css'

const initialForm = {
  email: 'admin@example.com',
  password: 'password',
}

function Login({ onLoginSuccess }) {
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
        // Mantenemos sesión con token local
      }

      onLoginSuccess({ accessToken, user })
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
          <span className="panel-tag">Proyecto Comunitario</span>
          <h2>Casa Calcuta</h2>
          <p>Transformando la incertidumbre en control operativo para acompañar mejor a cada familia.</p>
        </div>
        <div className="panel-decoration" aria-hidden="true">
          <div className="circle-1"></div>
          <div className="circle-2"></div>
        </div>
      </section>

      <section className="login-form-panel">
        <div className="form-box">
          <header className="form-header">
            <div className="brand-badge">CC</div>
            <h1>¡Hola! Te damos la bienvenida</h1>
            <p>Ingresá tus credenciales para acceder al panel de gestión.</p>
          </header>

          <form className="custom-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Usuario o Correo</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                placeholder="usuario.apellido@example.com" 
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <input 
                type="password" 
                id="password" 
                name="password" 
                placeholder="••••••••" 
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
              />
            </div>

            {error ? <div className="login-error">{error}</div> : null}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Validando...' : 'Iniciar Sesión'}
            </button>
          </form>

          <footer className="form-footer">
            <p>Gestión de Proyectos 2026 &bull; UNNOBA</p>
          </footer>
        </div>
      </section>
    </main>
  )
}

export default Login