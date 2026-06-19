import React, { useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function App() {
  // Estado que maneja la pantalla en el visor central ('login', 'dashboard', 'familias', 'listas')
  const [pantallaActual, setPantallaActual] = useState('login');
  
  // Estado para controlar la apertura del popup 'Más' en celulares
  const [menuMasAbierto, setMenuMasAbierto] = useState(false);

  // Ruteador 1: Puerta de acceso estricta
  if (pantallaActual === 'login') {
    return <Login onLoginSuccess={() => setPantallaActual('dashboard')} />;
  }

  // Ruteador 2: Entorno operativo unificado bajo tu base.css
  return (
    <div className="app-container">
      
      {/* BARRA LATERAL DESKTOP (SIDEBAR) */}
      <aside className="app-sidebar">
        <div className="sidebar-header">
          <div className="brand-badge">CC</div>
          <span className="sidebar-brand">Casa Calcuta</span>
        </div>
        <nav>
          <ul className="sidebar-nav">
            <li className={`nav-item ${pantallaActual === 'dashboard' ? 'active' : ''}`}>
              <a href="#dashboard" onClick={(e) => { e.preventDefault(); setPantallaActual('dashboard'); }}>
                <span>📊</span> Panel Principal
              </a>
            </li>
            <li className={`nav-item ${pantallaActual === 'familias' ? 'active' : ''}`}>
              <a href="#familias" onClick={(e) => { e.preventDefault(); setPantallaActual('familias'); }}>
                <span>👥</span> Gestión de Familias
              </a>
            </li>
            <li className="nav-item"><a href="#asistencia"><span>📋</span> Registrar Asistencia</a></li>
            <li className="nav-item"><a href="#listas"><span>⏳</span> Listas de Espera</a></li>
            <li className="nav-item"><a href="#donaciones"><span>📦</span> Donaciones</a></li>
            <li className="nav-item"><a href="#usuarios"><span>⚙️</span> Administración</a></li>
          </ul>
        </nav>
      </aside>

      {/* ÁREA DE CONTENIDO VARIABLE */}
      <div className="app-content-area">
        
        <header className="app-header">
          <div className="header-title">
            <h1>
              {pantallaActual === 'dashboard' && 'Panel Principal'}
              {pantallaActual === 'familias' && 'Padrón Único de Familias'}
              {pantallaActual === 'listas' && 'Listas de Espera'}
            </h1>
          </div>
          <div className="user-profile">
            <div className="user-info">
              <p className="user-name">Regina Álvarez</p>
              <p className="user-role">Coordinador</p>
            </div>
            <div className="brand-badge" style={{ width: '40px', height: '40px', borderRadius: '50%' }}>RA</div>
          </div>
        </header>

        <main className="main-content">
          {/* Inyección secuencial de componentes */}
          {pantallaActual === 'dashboard' && (
            <Dashboard onNavegar={(destino) => setPantallaActual(destino)} />
          )}

          {pantallaActual === 'familias' && (
            <Familias onVerFicha={() => setPantallaActual('integrantes')} />
          )}

          {pantallaActual === 'listas' && (
            <div className="info-profile-box" style={{ display: 'block' }}>
              <h2>Módulo: Listas de Espera</h2>
              <p style={{ color: '#718096', marginTop: '10px' }}>Pantalla en desarrollo para el próximo incremento.</p>
              <button className="btn-table-action" onClick={() => setPantallaActual('dashboard')} style={{ marginTop: '20px' }}>
                ⬅️ Volver al Panel
              </button>
            </div>
          )}

          {pantallaActual === 'integrantes' && (
            <div className="info-profile-box" style={{ display: 'block' }}>
              <h2>Ficha de Integrantes de la Familia</h2>
              <p style={{ color: '#718096', marginTop: '10px' }}>Pantalla puente para simular el flujo interno.</p>
              <button className="btn-table-action" onClick={() => setPantallaActual('familias')} style={{ marginTop: '20px' }}>
                ⬅️ Volver al Padrón
              </button>
            </div>
          )}
        </main>
      </div>

      {/* BARRA DE NAVEGACIÓN INFERIOR MOBILE */}
      <nav className="mobile-nav">
        <button 
          className={`mobile-nav-item ${pantallaActual === 'dashboard' ? 'active' : ''}`}
          onClick={() => { setPantallaActual('dashboard'); setMenuMasAbierto(false); }}
        >
          <span className="mobile-nav-icon">📊</span>Panel
        </button>
        
        <button 
          className={`mobile-nav-item ${pantallaActual === 'familias' ? 'active' : ''}`}
          onClick={() => { setPantallaActual('familias'); setMenuMasAbierto(false); }}
        >
          <span className="mobile-nav-icon">👥</span>Familias
        </button>
        
        <button className="mobile-nav-item" onClick={() => setMenuMasAbierto(false)}>
          <span className="mobile-nav-icon">📋</span>Asistencia
        </button>
        
        {/* DROPDOWN POP-UP MÓVIL INTERACTIVO */}
        <div className="mobile-nav-dropdown-container">
          <button 
            className={`mobile-nav-item btn-dropdown-trigger ${menuMasAbierto ? 'open' : ''}`} 
            onClick={() => setMenuMasAbierto(!menuMasAbierto)}
          >
            <span className="mobile-nav-icon">➕</span>Más
          </button>
          <div className="mobile-nav-popup">
            <a href="#listas" onClick={(e) => { e.preventDefault(); setPantallaActual('listas'); setMenuMasAbierto(false); }}>
              <span>⏳</span> Listas de Espera
            </a>
            <a href="#donaciones" onClick={(e) => { e.preventDefault(); setMenuMasAbierto(false); }}>
              <span>📦</span> Donaciones
            </a>
            <a href="#login" onClick={(e) => { e.preventDefault(); setPantallaActual('login'); setMenuMasAbierto(false); }}>
              <span>⚙️</span> Salir del Sistema
            </a>
          </div>
        </div>
      </nav>

    </div>
  );
}

export default App;