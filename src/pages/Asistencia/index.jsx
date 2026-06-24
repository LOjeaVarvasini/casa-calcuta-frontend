import { useState } from 'react';
import './asistencia.css';

const Asistencia = ({ onNavigate, parametros }) => {
  // Estado para dropdown móvil "Más"
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Estados para los toggles de control de entrega de cada familia
  const [familia1Estado, setFamilia1Estado] = useState('retirado');
  const [familia2Estado, setFamilia2Estado] = useState('falta');

  // Estado para modal de confirmación de guardado
  const [modalGuardadoAbierto, setModalGuardadoAbierto] = useState(false);

  // Estado para modal de alerta de ausentismo crítico
  const [modalAusentismoAbierto, setModalAusentismoAbierto] = useState(false);

  const toggleDropdown = () => {
    setDropdownOpen(prev => !prev);
  };

  const handleFamilia1Change = (estado) => {
    setFamilia1Estado(estado);
  };

  const handleFamilia2Change = (estado) => {
    setFamilia2Estado(estado);
    if (estado === 'falta') {
      setModalAusentismoAbierto(true);
    }
  };

  const handleGuardar = () => {
    setModalGuardadoAbierto(true);
  };

  const cerrarModalGuardado = () => {
    setModalGuardadoAbierto(false);
  };

  const cerrarModalAusentismo = () => {
    setModalAusentismoAbierto(false);
  };

  return (
    <div className="app-container">
      {/* BARRA LATERAL DESKTOP (Heredada de base.css) */}
      <aside className="app-sidebar">
        <div className="sidebar-header">
          <div className="brand-badge">CC</div>
          <span className="sidebar-brand">Casa Calcuta</span>
        </div>
        <nav>
          <ul className="sidebar-nav">
            <li className="nav-item">
              <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}>
                <span>📊</span> Panel Principal
              </a>
            </li>
            <li className="nav-item">
              <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('familias'); }}>
                <span>👥</span> Gestión de Familias
              </a>
            </li>
            <li className="nav-item active">
              <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('asistencia'); }}>
                <span>📋</span> Registrar Asistencia
              </a>
            </li>
            <li className="nav-item">
              <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('listas'); }}>
                <span>⏳</span> Listas de Espera
              </a>
            </li>
            <li className="nav-item">
              <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('donaciones'); }}>
                <span>📦</span> Donaciones
              </a>
            </li>
            <li className="nav-item">
              <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('usuarios'); }}>
                <span>⚙️</span> Administración
              </a>
            </li>
          </ul>
        </nav>
      </aside>

      {/* ÁREA DE TRABAJO PRINCIPAL */}
      <div className="app-content-area">
        <header className="app-header">
          <div className="header-title">
            <h1>Registro de Asistencia y Entrega</h1>
          </div>
          <div className="user-profile">
            <div className="user-info">
              <p className="user-name">[Nombre del Usuario]</p>
              <p className="user-role">[Rol del Usuario]</p>
            </div>
            <div className="brand-badge" style={{ width: 40, height: 40, borderRadius: '50%' }}>[Iniciales]</div>
          </div>
        </header>

        <main className="main-content">
          {/* Mensaje informativo si se recibe parámetro de familia específica */}
          {parametros?.familiaId && (
            <div className="info-profile-box">
              <span style={{ fontSize: 'var(--text-sm)', color: '#718096' }}>
                📋 Filtrando asistencia para: <strong>[Familia ID: {parametros.familiaId}]</strong>
              </span>
            </div>
          )}

          {/* PANEL DE METADATOS DE LA JORNADA */}
          <section className="attendance-summary-bar">
            <div className="summary-item">
              <span className="summary-label">Fecha de Entrega</span>
              <span className="summary-value">[Fecha de Jornada]</span>
            </div>
            <div className="summary-item highlight-item">
              <span className="summary-label">Porciones Totales a Realizar</span>
              <span className="summary-value">[Cantidad Total] Raciones</span>
            </div>
            <button className="btn-primary" onClick={handleGuardar}>💾 Guardar Planilla</button>
          </section>

          {/* PLANILLA DE CONTROL OPERATIVO ANTI-SCROLL */}
          <section className="table-responsive-container">
            <table className="custom-table custom-table-responsive">
              <thead>
                <tr>
                  <th>Familia / Referente</th>
                  <th>Raciones Asignadas</th>
                  <th>Historial Reciente</th>
                  <th style={{ textAlign: 'center' }}>Control de Entrega</th>
                </tr>
              </thead>
              <tbody>
                {/* Fila Familia 1 */}
                <tr>
                  <td data-label="Familia">
                    <strong className="attendance-family-name">[Apellido Familia 1]</strong>
                    <p className="attendance-ref-name">Ref: [Nombre Referente 1]</p>
                  </td>
                  <td data-label="Raciones">
                    <span className="portions-badge">[N] Porciones</span>
                  </td>
                  <td data-label="Historial">
                    <div className="history-dots">
                      <span className="dot dot-ok" title="Retiró"></span>
                      <span className="dot dot-ok" title="Retiró"></span>
                      <span className="dot dot-ok" title="Retiró"></span>
                    </div>
                  </td>
                  <td data-label="Control" style={{ textAlign: 'center' }}>
                    <div className="switch-toggle-group">
                      <div className="switch-toggle-item">
                        <input
                          type="radio"
                          id="f1-retirado"
                          name="familia-1"
                          checked={familia1Estado === 'retirado'}
                          onChange={() => handleFamilia1Change('retirado')}
                        />
                        <label htmlFor="f1-retirado">Retirado</label>
                      </div>
                      <div className="switch-toggle-item">
                        <input
                          type="radio"
                          id="f1-falta"
                          name="familia-1"
                          checked={familia1Estado === 'falta'}
                          onChange={() => handleFamilia1Change('falta')}
                        />
                        <label htmlFor="f1-falta">No Retiró</label>
                      </div>
                    </div>
                  </td>
                </tr>

                {/* Fila Familia 2 (En riesgo de ausentismo crítico) */}
                <tr>
                  <td data-label="Familia">
                    <strong className="attendance-family-name">[Apellido Familia 2]</strong>
                    <p className="attendance-ref-name">Ref: [Nombre Referente 2]</p>
                  </td>
                  <td data-label="Raciones">
                    <span className="portions-badge">[N] Porciones</span>
                  </td>
                  <td data-label="Historial">
                    <div className="history-dots">
                      <span className="dot dot-ok" title="Retiró"></span>
                      <span className="dot dot-danger" title="No retiró"></span>
                      <span className="dot dot-danger" title="No retiró"></span>
                    </div>
                  </td>
                  <td data-label="Control" style={{ textAlign: 'center' }}>
                    <div className="switch-toggle-group">
                      <div className="switch-toggle-item">
                        <input
                          type="radio"
                          id="f2-retirado"
                          name="familia-2"
                          checked={familia2Estado === 'retirado'}
                          onChange={() => handleFamilia2Change('retirado')}
                        />
                        <label htmlFor="f2-retirado">Retirado</label>
                      </div>
                      <div className="switch-toggle-item">
                        <input
                          type="radio"
                          id="f2-falta"
                          name="familia-2"
                          checked={familia2Estado === 'falta'}
                          onChange={() => handleFamilia2Change('falta')}
                        />
                        <label htmlFor="f2-falta" className={familia2Estado === 'falta' ? 'pulse-warning' : ''}>
                          No Retiró
                        </label>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </section>
        </main>
      </div>

      {/* NAVEGACIÓN INFERIOR MOBILE */}
      <nav className="mobile-nav">
        <a
          href="#"
          className="mobile-nav-item"
          onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}
        >
          <span className="mobile-nav-icon">📊</span>Panel
        </a>
        <a
          href="#"
          className="mobile-nav-item"
          onClick={(e) => { e.preventDefault(); onNavigate('familias'); }}
        >
          <span className="mobile-nav-icon">👥</span>Familias
        </a>
        <a
          href="#"
          className="mobile-nav-item active"
          onClick={(e) => { e.preventDefault(); onNavigate('asistencia'); }}
        >
          <span className="mobile-nav-icon">📋</span>Asistencia
        </a>
        <div className="mobile-nav-dropdown-container">
          <button
            className={`mobile-nav-item btn-dropdown-trigger ${dropdownOpen ? 'open' : ''}`}
            onClick={toggleDropdown}
          >
            <span className="mobile-nav-icon">➕</span>Más
          </button>
          <div className="mobile-nav-popup" style={{ display: dropdownOpen ? 'flex' : 'none' }}>
            <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('listas'); }}>
              <span>⏳</span> Listas de Espera
            </a>
            <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('donaciones'); }}>
              <span>📦</span> Donaciones
            </a>
            <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('usuarios'); }}>
              <span>⚙️</span> Administración
            </a>
          </div>
        </div>
      </nav>

      {/* MODAL: CONFIRMACIÓN DE GUARDADO EXITOSO */}
      {modalGuardadoAbierto && (
        <div className="modal-overlay" onClick={cerrarModalGuardado}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✅ Planilla Guardada</h3>
            </div>
            <div className="modal-body">
              <p>La planilla de asistencia del día <strong>[Fecha de Jornada]</strong> ha sido registrada exitosamente.</p>
              <p style={{ marginTop: '0.5rem', color: '#718096' }}>
                <strong>[Cantidad Total]</strong> raciones planificadas para <strong>[Cantidad de Familias]</strong> familias.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={cerrarModalGuardado}>Aceptar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ALERTA DE AUSENTISMO CRÍTICO */}
      {modalAusentismoAbierto && (
        <div className="modal-overlay" onClick={cerrarModalAusentismo}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header alert-danger">
              <h3>⚠️ Ausentismo Crítico Detectado</h3>
            </div>
            <div className="modal-body">
              <p>La familia <strong>[Apellido Familia 2]</strong> ha acumulado <strong>[Cantidad] faltas consecutivas</strong> en las últimas entregas.</p>
              <p style={{ marginTop: '0.75rem', fontSize: 'var(--text-sm)', color: '#718096' }}>
                Se recomienda contactar al referente <strong>[Nombre Referente 2]</strong> para coordinar una visita de seguimiento.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-table-action action-danger" onClick={cerrarModalAusentismo}>
                Cerrar
              </button>
              <button className="btn-primary" onClick={cerrarModalAusentismo}>
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Asistencia;