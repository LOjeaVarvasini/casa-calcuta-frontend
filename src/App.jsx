import { useEffect, useState } from 'react'
import Login from './pages/Login/index.jsx'
import Dashboard from './pages/Dashboard/index.jsx'
import Familias from './pages/Familias/index.jsx'
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
    setPantallaActual('dashboard') 
  }

  const handleLogout = async () => {
    try {
      if (session?.accessToken) {
        await logoutRequest(session.accessToken)
      }
    } catch {
      // Limpieza local preventiva si falla el servidor
    } finally {
      localStorage.removeItem('access_token')
      setSession(null)
    }
  }

  const handleNavegar = (pantalla) => {
    if (pantalla === 'login') {
      handleLogout()
    } else {
      setPantallaActual(pantalla)
    }
  }

  if (booting) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg)' }}>
        <p style={{ fontWeight: 600, color: 'var(--color-primary)', fontFamily: 'sans-serif' }}>Validando sesión...</p>
      </div>
    )
  }

  if (!session) {
    return <Login onLoginSuccess={handleLogin} />
  }

  return (
    <div className="app-container">
      
      {/* Componente de Navegación Lateral (Su clase interna .app-sidebar la oculta en móvil) */}
      <Sidebar onNavegar={handleNavegar} pantallaActiva={pantallaActual} />

      {/* Contenedor del Área de Contenido General */}
      <div className="app-content-area">
        
        {/* Cabecera de la Aplicación */}
        <header className="app-header">
          <div className="header-title">
            <h1>
              {pantallaActual === 'dashboard' && 'Panel Principal'}
              {pantallaActual === 'familias' && 'Padrón Único de Familias'}
            </h1>
          </div>
          <div style={{ fontSize: '0.875rem', color: '#718096', fontWeight: 500 }}>
            {session.user?.name || session.user?.nombre || session.user?.email || 'Coordinador'}
          </div>
        </header>

        {/* Visor Dinámico de Pantallas con Scroll Controlado */}
        <main className="main-content">
          {pantallaActual === 'dashboard' && <Dashboard onNavegar={handleNavegar} />}
          {pantallaActual === 'familias' && <Familias onNavegar={handleNavegar} />}
        </main>

      </div>

      {/* Componente de Navegación Inferior (Su clase interna .mobile-nav lo oculta en escritorio) */}
      <BottomNav onNavegar={handleNavegar} pantallaActiva={pantallaActual} />

    </div>
  )
}

export default App