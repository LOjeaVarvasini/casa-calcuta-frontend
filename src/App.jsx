import { useEffect, useState } from 'react'
import Login from './pages/Login/index.jsx'
import Dashboard from './pages/Dashboard/index.jsx'
import Sidebar from './components/common/Sidebar.jsx'
import BottomNav from './components/common/BottomNav.jsx'
import { logoutRequest, meRequest } from './config/api.js'

function App() {
  const [session, setSession] = useState(null)
  const [booting, setBooting] = useState(true)
  const [pantallaActual, setPantallaActual] = useState('dashboard')

  // Restaurar la sesión al cargar la app de forma real
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
    setPantallaActual('dashboard') // Al loguearse va directo al panel
  }

  const handleLogout = async () => {
    try {
      if (session?.accessToken) {
        await logoutRequest(session.accessToken)
      }
    } catch {
      // Si el servidor falla, limpiamos igual localmente
    } finally {
      localStorage.removeItem('access_token')
      setSession(null)
    }
  }

  // Manejador del ruteador estético interno
  const handleNavegar = (pantalla) => {
    if (pantalla === 'login') {
      handleLogout()
    } else {
      setPantallaActual(pantalla)
    }
  }

  // Pantalla de carga mientras valida el token
  if (booting) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg)' }}>
        <p style={{ fontWeight: 600, color: 'var(--color-primary)' }}>Validando sesión...</p>
      </div>
    )
  }

  // Guardián de Autenticación: Si no hay sesión, se muestra el Login real
  if (!session) {
    return <Login onLoginSuccess={() => handleLogin} />
  }

  // Si hay sesión, renderiza la APP con tu diseño adaptativo estructural
  return (
    <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'row' }}>
      
      {/* Componente de Navegación Lateral (Escritorio) */}
      <Sidebar onNavegar={handleNavegar} pantallaActiva={pantallaActual} />

      {/* Contenedor de Vistas */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingBottom: '64px' }}>
        
        {/* Cabecera de la Aplicación */}
        <header className="app-header" style={{ padding: '24px', background: 'var(--color-card)', borderBottom: '1px solid var(--color-border)' }}>
          <h1 style={{ color: 'var(--color-primary)', fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
            {pantallaActual === 'dashboard' && 'Panel Principal'}
            {pantallaActual === 'familias' && 'Padrón Único de Familias'}
          </h1>
          <p style={{ color: '#718096', fontSize: '0.875rem', marginTop: '4px', margin: 0 }}>
            Hola, {session.user?.name || session.user?.nombre || 'Coordinador'} · Rol: [Rol]
          </p>
        </header>

        {/* Visor Dinámico de Pantallas */}
        <main style={{ flex: 1, padding: 'var(--space-md)' }}>
          {pantallaActual === 'dashboard' && <Dashboard onNavegar={handleNavegar} />}
          {pantallaActual === 'familias' && (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <h2>[Próximamente: Componente Padrón de Familias]</h2>
            </div>
          )}
        </main>

      </div>

      {/* Componente de Navegación Inferior (Mobile) */}
      <BottomNav onNavegar={handleNavegar} pantallaActiva={pantallaActual} />

    </div>
  )
}

export default App