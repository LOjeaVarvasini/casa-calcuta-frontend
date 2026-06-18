import React from 'react';

function BottomNav() {
  return (
    <nav className="mobile-nav" style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '64px',
      backgroundColor: 'var(--color-card)',
      borderTop: '1px solid var(--color-border)',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      zIndex: 1000,
      boxShadow: '0 -2px 10px rgba(0,0,0,0.03)'
    }}>
      <a href="#dashboard" style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none',
        color: 'var(--color-text)', fontSize: '0.75rem', fontWeight: 600, minWidth: '48px'
      }}>
        <span style={{ fontSize: '1.25rem' }}>📊</span> Panel
      </a>
      <a href="#familias" style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none',
        color: 'var(--color-text)', fontSize: '0.75rem', fontWeight: 600, minWidth: '48px'
      }}>
        <span style={{ fontSize: '1.25rem' }}>👥</span> Familias
      </a>
      <a href="#asistencia" style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none',
        color: 'var(--color-text)', fontSize: '0.75rem', fontWeight: 600, minWidth: '48px'
      }}>
        <span style={{ fontSize: '1.25rem' }}>📋</span> Asistencia
      </a>
    </nav>
  );
}

export default BottomNav;