import React from 'react';

function Sidebar({ onNavegar, pantallaActiva }) {
  const obtenerEstiloItem = (nombre) => ({
    display: 'flex', 
    alignItems: 'center', 
    gap: 'var(--space-sm)', 
    padding: 'var(--space-sm)',
    borderRadius: 'var(--radius-sm)', 
    color: 'var(--color-text)', 
    textDecoration: 'none', 
    fontWeight: 600, 
    cursor: 'pointer',
    backgroundColor: pantallaActiva === nombre ? 'rgba(30, 93, 136, 0.08)' : 'transparent'
  });

  return (
    <aside className="app-sidebar" style={{
      width: '260px', 
      backgroundColor: 'var(--color-card)', 
      borderRight: '1px solid var(--color-border)',
      height: '100vh', 
      position: 'sticky', 
      top: 0, 
      padding: 'var(--space-md)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)' }}>
        <div style={{
          backgroundColor: 'var(--color-primary)', color: '#ffffff', fontWeight: 800,
          width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>CC</div>
        <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>Casa Calcuta</span>
      </div>

      <nav style={{ flex: 1 }}>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', padding: 0 }}>
          <li onClick={() => onNavegar('dashboard')}>
            <span style={obtenerEstiloItem('dashboard')}><span>📊</span> Panel Principal</span>
          </li>
          <li onClick={() => onNavegar('familias')}>
            <span style={obtenerEstiloItem('familias')}><span>👥</span> Gestión de Familias</span>
          </li>
          <li onClick={() => onNavegar('login')} style={{ marginTop: 'auto' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', padding: 'var(--space-sm)', color: 'var(--color-danger)', cursor: 'pointer', fontWeight: 600 }}>
              <span>🚪</span> Cerrar Sesión
            </span>
          </li>
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;