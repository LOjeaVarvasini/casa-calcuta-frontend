import { useCallback, useEffect, useState } from 'react'
import Login from './pages/Login/index.jsx'
import Dashboard from './pages/Dashboard/index.jsx'
import Familias from './pages/Familias/index.jsx'
import Asistencia from './pages/Asistencia/index.jsx'
import Comisiones from './pages/Comisiones/index.jsx'
import Donaciones from './pages/Donaciones/index.jsx'
// ⏳ Importamos la nueva vista modular de Listas
import Listas from './pages/Listas/index.jsx'
// 🛡️ Importamos la nueva vista de Administración
import Administracion from './pages/Administracion/index.jsx'
import Sidebar from './components/common/Sidebar.jsx'
import BottomNav from './components/common/BottomNav.jsx'
import { SESSION_EXPIRED_EVENT, logoutRequest, meRequest } from './config/api.js'

function App() {
  const [session, setSession] = useState(null)
  const [booting, setBooting] = useState(true)
  const [pantallaActual, setPantallaActual] = useState('dashboard')
  const [parametrosNavegacion, setParametrosNavegacion] = useState(null)

  const clearSession = useCallback(() => {
    localStorage.removeItem('access_token')
    setSession(null)
  }, [])

  useEffect(() => {
    const handleSessionExpired = () => {
      clearSession()
    }

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired)

    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired)
    }
  }, [clearSession])

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
        clearSession()
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
      clearSession()
    }
  }

  const handleNavegar = (pantalla, parametros = null) => {
    if (pantalla === 'login') {
      handleLogout()
    } else {
      setPantallaActual(pantalla)
      setParametrosNavegacion(parametros)
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

  // 🛡️ CAPA GLOBAL DE PERMISOS DERIVADA DEL BACKEND
  const rolUsuario = session.user?.rol?.nombre;
  
  // 1. Verificación para sección de Administración (Solo Administrador)
  const esAdministrador = rolUsuario === 'Administrador';

  // 2. Verificación para Listas de Espera (Todos MENOS Encargado, Voluntarios y Ayudante)
  const permisosDelUsuario = session.user?.rol?.permisos || [];
  const tienePermisoListas = permisosDelUsuario.some(p => p.nombre === "Gestionar listas");
  const puedeVerListas = esAdministrador || tienePermisoListas;

  return (
    <div className="app-container">
      
      {/* Componente de Navegación Lateral */}
      <Sidebar onNavegar={handleNavegar} pantallaActiva={pantallaActual} usuario={session.user} />

      {/* Contenedor del Área de Contenido General */}
      <div className="app-content-area">
        
        {/* Cabecera de la Aplicación */}
        <header className="app-header">
          <div className="header-title">
            <h1>
              {pantallaActual === 'dashboard' && 'Panel Principal'}
              {pantallaActual === 'familias' && 'Padrón Único de Familias'}
              {pantallaActual === 'asistencia' && 'Registro de Asistencia y Entrega'}
              {pantallaActual === 'comisiones' && (parametrosNavegacion?.familiaId ? 'Gestión de Comisiones de Trabajo' : 'Catálogo de Comisiones')}
              {pantallaActual === 'listas' && 'Listas de Espera'}
              {pantallaActual === 'donaciones' && 'Gestión de Donaciones'}
              {pantallaActual === 'usuarios' && 'Administración de Usuarios'}
            </h1>
          </div>
          <div style={{ fontSize: '0.875rem', color: '#718096', fontWeight: 500 }}>
            {session.user?.name || session.user?.nombre || session.user?.email || 'Coordinador'}
          </div>
        </header>

        {/* Visor Dinámico de Pantallas con Scroll Controlado */}
        <main className="main-content">
          {pantallaActual === 'dashboard' && <Dashboard onNavegar={handleNavegar} />}
          {pantallaActual === 'familias' && <Familias onNavegar={handleNavegar} usuario={session.user} />}
          {pantallaActual === 'asistencia' && <Asistencia onNavigate={handleNavegar} parametros={parametrosNavegacion} usuario={session.user} />}
          {pantallaActual === 'comisiones' && <Comisiones onNavegar={handleNavegar} parametros={parametrosNavegacion} />}
          {pantallaActual === 'donaciones' && <Donaciones onNavegar={handleNavegar} />}
          
          {/* 🛡️ RENDERIZADO PROTEGIDO: Listas de Espera */}
          {pantallaActual === 'listas' && (
            puedeVerListas ? (
              <Listas onNavegar={handleNavegar} parametros={parametrosNavegacion} />
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#e53e3e' }}>
                <h2>Acceso Restringido</h2>
                <p>Tu rol ({rolUsuario}) no tiene permisos para acceder a las Listas de Espera.</p>
              </div>
            )
          )}
          
          {/* 🛡️ RENDERIZADO PROTEGIDO: Administración */}
          {pantallaActual === 'usuarios' && (
            esAdministrador ? (
              <Administracion onNavegar={handleNavegar} />
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#e53e3e' }}>
                <h2>Acceso Denegado</h2>
                <p>Esta sección es exclusiva para el Administrador del Sistema.</p>
              </div>
            )
          )}
        </main>

      </div>

      {/* Componente de Navegación Inferior */}
      <BottomNav onNavegar={handleNavegar} pantallaActiva={pantallaActual} usuario={session.user} />

    </div>
  )
}

export default App