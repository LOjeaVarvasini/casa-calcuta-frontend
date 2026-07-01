import React from 'react';

function Sidebar({ onNavegar, pantallaActiva }) {
  // Función constructora para el efecto pastilla invertida (Activo: Fondo Blanco / Texto Azul)
  const obtenerEstiloItem = (nombre) => {
    const esActivo = pantallaActiva === nombre;
    
    return {
      display: 'flex', 
      alignItems: 'center', 
      gap: 'var(--space-sm)', 
      padding: '0.75rem var(--space-sm)',
      borderRadius: 'var(--radius-md)', 
      textDecoration: 'none', 
      fontWeight: esActivo ? 700 : 500, 
      fontSize: 'var(--text-sm)',
      cursor: 'pointer',
      // 🔄 JUEGO DE CONTRASTES INVERTIDO
      color: esActivo ? '#10344e' : '#e2e8f0',            /* Texto Azul si está activo, Gris claro si no */
      backgroundColor: esActivo ? '#ffffff' : 'transparent', /* Fondo Blanco si está activo, Transparente si no */
      transition: 'all 0.2s ease'
    };
  };

  return (
    <aside className="app-sidebar">
      {/* Header de la marca */}
      <div className="sidebar-header">
        <div className="brand-badge" style={{ backgroundColor: '#ffffff', color: 'var(--color-primary)' }}>CC</div>
        <span className="sidebar-brand">Casa Calcuta</span>
      </div>

      {/* Cuerpo de navegación */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <ul className="sidebar-nav" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
          <li onClick={() => onNavegar('dashboard')}>
            <span style={obtenerEstiloItem('dashboard')}><span>📊</span> Panel Principal</span>
          </li>
          <li onClick={() => onNavegar('familias')}>
            <span style={obtenerEstiloItem('familias')}><span>👥</span> Gestión de Familias</span>
          </li>
          <li onClick={() => onNavegar('asistencia')}>
            <span style={obtenerEstiloItem('asistencia')}><span>📋</span> Registrar Asistencia</span>
          </li>
          <li onClick={() => onNavegar('comisiones')}>
            <span style={obtenerEstiloItem('comisiones')}><span>🧾</span> Comisiones</span>
          </li>
          <li onClick={() => onNavegar('listas')}>
            <span style={obtenerEstiloItem('listas')}><span>⏳</span> Listas de Espera</span>
          </li>
          <li onClick={() => onNavegar('donaciones')}>
            <span style={obtenerEstiloItem('donaciones')}><span>📦</span> Donaciones</span>
          </li>
          <li onClick={() => onNavegar('usuarios')}>
            <span style={obtenerEstiloItem('usuarios')}><span>⚙️</span> Administración</span>
          </li>
        </ul>

        {/* Botón de salida técnica */}
        <div onClick={() => onNavegar('login')} style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 'var(--space-sm)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', padding: 'var(--space-sm)', color: '#feb2b2', cursor: 'pointer', fontWeight: 600 }}>
            <span>🚪</span> Cerrar Sesión
          </span>
        </div>
      </nav>
    </aside>
  );
}

export default Sidebar;
