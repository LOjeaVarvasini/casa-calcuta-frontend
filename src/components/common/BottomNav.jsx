import React from 'react';

function BottomNav({ onNavegar, pantallaActiva }) {
  const obtenerEstiloItem = (nombre) => ({
    display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none',
    fontSize: '0.75rem', fontWeight: 600, minWidth: '48px', cursor: 'pointer',
    color: pantallaActiva === nombre ? 'var(--color-primary)' : 'var(--color-text)'
  });

  return (
    <nav className="mobile-nav" style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, height: '64px',
      backgroundColor: 'var(--color-card)', borderTop: '1px solid var(--color-border)',
      display: 'flex', justifycontent: 'space-around', alignItems: 'center', zIndex: 1000
    }}>
      <div onClick={() => onNavegar('familias')} style={obtenerEstiloItem('familias')}>
        <span style={{ fontSize: '1.25rem' }}>👥</span> Familias
      </div>
      <div onClick={() => onNavegar('login')} style={obtenerEstiloItem('login')}>
        <span style={{ fontSize: '1.25rem' }}>🚪</span> Salir
      </div>
    </nav>
  );
}

export default BottomNav;