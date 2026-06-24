import React from 'react';

function BottomNav({ onNavegar, pantallaActiva }) {
  const obtenerEstiloItem = (nombre) => ({
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    textDecoration: 'none',
    fontSize: '0.75rem', 
    fontWeight: 600, 
    minWidth: '48px', 
    cursor: 'pointer',
    color: pantallaActiva === nombre ? 'var(--color-primary)' : 'var(--color-text)'
  });

  const handleSelectMas = (e) => {
    const vista = e.target.value;
    if (vista) {
      onNavegar(vista);
      e.target.value = ''; 
    }
  };

  return (
    <nav className="mobile-nav">
      <div onClick={() => onNavegar('dashboard')} style={obtenerEstiloItem('dashboard')}>
        <span style={{ fontSize: '1.25rem' }}>📊</span> Panel
      </div>

      <div onClick={() => onNavegar('familias')} style={obtenerEstiloItem('familias')}>
        <span style={{ fontSize: '1.25rem' }}>👥</span> Familias
      </div>

      <div onClick={() => onNavegar('asistencia')} style={obtenerEstiloItem('asistencia')}>
        <span style={{ fontSize: '1.25rem' }}>📋</span> Asistencia
      </div>

      {/* Selector dinámico para pantallas secundarias */}
      <div className="mobile-nav-select-item">
        <span style={{ fontSize: '1.25rem' }}>➕</span>
        <select 
          onChange={handleSelectMas}
          style={{
            border: 'none',
            background: 'transparent',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: ['listas', 'donaciones', 'usuarios'].includes(pantallaActiva) ? 'var(--color-primary)' : 'var(--color-text)',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="">Más</option>
          <option value="listas">⏳ Espera</option>
          <option value="donaciones">📦 Donaciones</option>
          <option value="usuarios">⚙️ Admin</option>
        </select>
      </div>

      <div onClick={() => onNavegar('login')} style={obtenerEstiloItem('login')}>
        <span style={{ fontSize: '1.25rem' }}>🚪</span> Salir
      </div>
    </nav>
  );
}

export default BottomNav;