import { useState } from 'react';
import './asistencia.css';

const Asistencia = ({ onNavigate }) => {
  // Estado para el dropdown "Más" en mobile
  const [dropdownAbierto, setDropdownAbierto] = useState(false);

  // Estados para los toggles de control de entrega (switch pastilla)
  const [toggleFamilia1, setToggleFamilia1] = useState('retirado');
  const [toggleFamilia2, setToggleFamilia2] = useState('falta');

  // Estado para el modal de confirmación al guardar planilla
  const [modalGuardadoAbierto, setModalGuardadoAbierto] = useState(false);

  const handleGuardarPlanilla = () => {
    setModalGuardadoAbierto(true);
  };

  const handleCerrarModal = () => {
    setModalGuardadoAbierto(false);
  };

  return (
    <div className="app-container">
      {/* ========== BARRA LATERAL DESKTOP ========== */}
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

      {/* ========== ÁREA DE TRABAJO PRINCIPAL ========== */}
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
            <div className="brand-badge" style={{ width: '40px', height: '40px', borderRadius: '50%' }}>[Iniciales]</div>
          </div>
        </header>

        <main className="main-content">
          {/* ===== PANEL DE METADATOS DE LA JORNADA ===== */}
          <section className="attendance-summary-bar">
            <div className="summary-item">
              <span className="summary-label">Fecha de Entrega</span>
              <span className="summary-value">[DD] / [MM] / [AAAA]</span>
            </div>
            <div className="summary-item highlight-item">
              <span className="summary-label">Porciones Totales a Realizar</span>
              <span className="summary-value">[Cantidad Total] Raciones</span>
            </div>
            <button className="btn-primary" onClick={handleGuardarPlanilla}>
              💾 Guardar Planilla
            </button>
          </section>

          {/* ===== PLANILLA DE CONTROL OPERATIVO ===== */}
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
                          checked={toggleFamilia1 === 'retirado'}
                          onChange={() => setToggleFamilia1('retirado')}
                        />
                        <label htmlFor="f1-retirado">Retirado</label>
                      </div>
                      <div className="switch-toggle-item">
                        <input
                          type="radio"
                          id="f1-falta"
                          name="familia-1"
                          checked={toggleFamilia1 === 'falta'}
                          onChange={() => setToggleFamilia1('falta')}
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
                          checked={toggleFamilia2 === 'retirado'}
                          onChange={() => setToggleFamilia2('retirado')}
                        />
                        <label htmlFor="f2-retirado">Retirado</label>
                      </div>
                      <div className="switch-toggle-item">
                        <input
                          type="radio"
                          id="f2-falta"
                          name="familia-2"
                          checked={toggleFamilia2 === 'falta'}
                          onChange={() => setToggleFamilia2('falta')}
                        />
                        <label htmlFor="f2-falta" className="pulse-warning">No Retiró</label>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </section>
        </main>
      </div>

      {/* ========== NAVEGACIÓN INFERIOR MOBILE ========== */}
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
            className={`mobile-nav-item btn-dropdown-trigger ${dropdownAbierto ? 'open' : ''}`}
            onClick={() => setDropdownAbierto(!dropdownAbierto)}
          >
            <span className="mobile-nav-icon">➕</span>Más
          </button>
          <div className="mobile-nav-popup" style={{ display: dropdownAbierto ? 'flex' : 'none' }}>
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

      {/* ========== MODAL DE CONFIRMACIÓN DE GUARDADO ========== */}
      {modalGuardadoAbierto && (
        <div className="modal-overlay" onClick={handleCerrarModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✅ Planilla Guardada</h3>
            </div>
            <div className="modal-body">
              <p>
                La planilla de asistencia del día <strong>[DD/MM/AAAA]</strong> ha sido registrada exitosamente.
              </p>
              <p style={{ marginTop: '0.5rem' }}>
                Se contabilizaron <strong>[Cantidad] raciones retiradas</strong> y{' '}
                <strong>[Cantidad] familias ausentes</strong>.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={handleCerrarModal}>
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Asistencia;