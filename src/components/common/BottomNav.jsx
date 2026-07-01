import React from 'react';

function BottomNav({ onNavegar, pantallaActiva, usuario }) {
  // 🛡️ Extracción analítica de los permisos del objeto de sesión
  const rolUsuario = (usuario?.rol?.nombre || '').toString().toLowerCase().trim();
  const esAdministrador = rolUsuario === 'administrador';
  const esCoordinador = rolUsuario === 'coordinador';
  const esEncargado = rolUsuario === 'encargado';
  const esVoluntario = rolUsuario === 'voluntarios' || rolUsuario === 'voluntario';
  const esAyudante = rolUsuario === 'ayudante' || rolUsuario === 'ayudantes';
  const permisosDelUsuario = usuario?.rol?.permisos || [];
  const puedeVerListas = esAdministrador || permisosDelUsuario.some(p => p.nombre === "Gestionar listas");
  const puedeVerComisiones = (esAdministrador || esCoordinador || permisosDelUsuario.some(p => {
    const nombreNormalizado = (p.nombre || '').toString().toLowerCase().trim();
    return nombreNormalizado === 'ver comisiones' || nombreNormalizado === 'ver_comisiones';
  })) && !esEncargado && !esVoluntario && !esAyudante;

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

      {puedeVerComisiones && (
        <div onClick={() => onNavegar('comisiones')} style={obtenerEstiloItem('comisiones')}>
          <span style={{ fontSize: '1.25rem' }}>🧾</span> Comisiones
        </div>
      )}

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
          
          {/* 🛡️ OPTION CONDICIONAL: Listas de Espera */}
          {puedeVerListas && <option value="listas">⏳ Espera</option>}
          
          <option value="donaciones">📦 Donaciones</option>
          
          {/* 🛡️ OPTION CONDICIONAL: Administración */}
          {esAdministrador && <option value="usuarios">⚙️ Admin</option>}
        </select>
      </div>

      <div onClick={() => onNavegar('login')} style={obtenerEstiloItem('login')}>
        <span style={{ fontSize: '1.25rem' }}>🚪</span> Salir
      </div>
    </nav>
  );
}

export default BottomNav;
