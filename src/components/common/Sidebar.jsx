import React from 'react';

function Sidebar() {
  return (
    <aside className="app-sidebar" style={{
      width: '260px',
      backgroundColor: 'var(--color-card)',
      borderRight: '1px solid var(--color-border)',
      height: '100vh',
      position: 'sticky',
      top: 0,
      display: 'flex',
      flexDirection: 'column',
      padding: 'var(--space-md)'
    }}>
      {/* Header del Merendero */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)' }}>
        <div style={{
          backgroundColor: 'var(--color-primary)',
          color: '#ffffff',
          fontWeight: 800,
          width: '40px',
          height: '40px',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>CC</div>
        <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>Casa Calcuta</span>
      </div>

      {/* Menú de Navegación */}
      <nav style={{ flex: 1 }}>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
          <li>
            <a href="#dashboard" style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', padding: 'var(--space-sm)',
              borderRadius: 'var(--radius-sm)', color: 'var(--color-text)', textDecoration: 'none', fontWeight: 600
            }}><span>📊</span> Panel Principal</a>
          </li>
          <li>
            <a href="#familias" style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', padding: 'var(--space-sm)',
              borderRadius: 'var(--radius-sm)', color: 'var(--color-text)', textDecoration: 'none', fontWeight: 600
            }}><span>👥</span> Gestión de Familias</a>
          </li>
          <li>
            <a href="#asistencia" style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', padding: 'var(--space-sm)',
              borderRadius: 'var(--radius-sm)', color: 'var(--color-text)', textDecoration: 'none', fontWeight: 600
            }}><span>📋</span> Registrar Asistencia</a>
          </li>
          <li>
            <a href="#agenda" style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', padding: 'var(--space-sm)',
              borderRadius: 'var(--radius-sm)', color: 'var(--color-text)', textDecoration: 'none', fontWeight: 600
            }}><span>📅</span> Agenda Alerts</a>
          </li>
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;