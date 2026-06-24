import { useState } from 'react';

function Asistencia({ onNavegar }) {
  // Estados para simular la interactividad de la maqueta
  const [familia1Estado, setFamilia1Estado] = useState('retirado');
  const [familia2Estado, setFamilia2Estado] = useState('falta');

  // Estados de modales
  const [modalGuardadoAbierto, setModalGuardadoAbierto] = useState(false);
  const [modalAusentismoAbierto, setModalAusentismoAbierto] = useState(false);

  const handleFamilia2Change = (estado) => {
    setFamilia2Estado(estado);
    if (estado === 'falta') {
      setModalAusentismoAbierto(true);
    }
  };

  return (
    <div className="attendance-view" style={{ width: '100%' }}>
      
      {/* PANEL DE METADATOS DE LA JORNADA */}
      <section className="info-profile-box" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
          <div>
            <span style={{ display: 'block', fontSize: 'var(--text-sm)', color: '#718096', fontWeight: 600 }}>Fecha de Entrega</span>
            <strong style={{ fontSize: 'var(--text-md)', color: 'var(--color-text)' }}>02 / 06 / 2026</strong>
          </div>
          <div style={{ borderLeft: '1px solid var(--color-border)', paddingLeft: 'var(--space-md)' }}>
            <span style={{ display: 'block', fontSize: 'var(--text-sm)', color: '#718096', fontWeight: 600 }}>Porciones Totales</span>
            <strong style={{ fontSize: 'var(--text-md)', color: 'var(--color-primary)' }}>142 Raciones</strong>
          </div>
        </div>
        <button className="btn-primary" onClick={() => setModalGuardadoAbierto(true)}>
          💾 Guardar Planilla
        </button>
      </section>

      {/* PLANILLA DE CONTROL OPERATIVO */}
      <section className="table-responsive-container" style={{ marginTop: 'var(--space-md)' }}>
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
                <strong style={{ color: 'var(--color-text)', fontSize: 'var(--text-sm)' }}>Gómez Peralta</strong>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#718096' }}>Ref: Juan Carlos Gómez</p>
              </td>
              <td data-label="Raciones">
                <span className="badge badge-primary" style={{ textTransform: 'none' }}>5 Porciones</span>
              </td>
              <td data-label="Historial">
                <div style={{ display: 'flex', gap: '4px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-success)', display: 'inline-block' }} title="Retiró"></span>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-success)', display: 'inline-block' }} title="Retiró"></span>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-success)', display: 'inline-block' }} title="Retiró"></span>
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
                      onChange={() => setFamilia1Estado('retirado')}
                    />
                    <label htmlFor="f1-retirado">Retirado</label>
                  </div>
                  <div className="switch-toggle-item">
                    <input
                      type="radio"
                      id="f1-falta"
                      name="familia-1"
                      checked={familia1Estado === 'falta'}
                      onChange={() => setFamilia1Estado('falta')}
                    />
                    <label htmlFor="f1-falta">No Retiró</label>
                  </div>
                </div>
              </td>
            </tr>

            {/* Fila Familia 2 (Alerta Crítica) */}
            <tr>
              <td data-label="Familia">
                <strong style={{ color: 'var(--color-text)', fontSize: 'var(--text-sm)' }}>Rodríguez</strong>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#718096' }}>Ref: María Elena Rodríguez</p>
              </td>
              <td data-label="Raciones">
                <span className="badge badge-primary" style={{ textTransform: 'none' }}>3 Porciones</span>
              </td>
              <td data-label="Historial">
                <div style={{ display: 'flex', gap: '4px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-success)', display: 'inline-block' }} title="Retiró"></span>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-danger)', display: 'inline-block' }} title="No retiró"></span>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-danger)', display: 'inline-block' }} title="No retiró"></span>
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
                      onChange={() => setFamilia2Estado('retirado')}
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
                    <label htmlFor="f2-falta" style={{ color: familia2Estado === 'falta' ? 'var(--color-danger)' : '#718096' }}>
                      No Retiró
                    </label>
                  </div>
                </div>
              </td>
            </tr>

          </tbody>
        </table>
      </section>

      {/* MODAL: CONFIGURACIÓN DE GUARDADO EXITOSO */}
      {modalGuardadoAbierto && (
        <div className="modal-overlay" onClick={() => setModalGuardadoAbierto(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✅ Planilla Guardada</h3>
            </div>
            <div className="modal-body">
              <p>La planilla de asistencia del día <strong>02/06/2026</strong> ha sido registrada exitosamente en el servidor cloud.</p>
              <p style={{ marginTop: '0.5rem', color: '#718096' }}>
                Se confirmaron las raciones correspondientes a las familias del padrón.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" style={{ minHeight: '40px' }} onClick={() => setModalGuardadoAbierto(false)}>Aceptar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ALERTA DE AUSENTISMO CRÍTICO */}
      {modalAusentismoAbierto && (
        <div className="modal-overlay" onClick={() => setModalAusentismoAbierto(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header alert-danger">
              <h3>⚠️ Ausentismo Crítico Detectado</h3>
            </div>
            <div className="modal-body">
              <p>La familia <strong>Rodríguez</strong> acumuló faltas consecutivas en las últimas entregas.</p>
              <p style={{ marginTop: '0.75rem', fontSize: 'var(--text-sm)', color: '#718096' }}>
                Se recomienda contactar al referente <strong>María Elena Rodríguez</strong> o derivar el caso a la comisión de Listas de Espera para auditoría.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-table-action action-danger" style={{ minHeight: '40px' }} onClick={() => setModalAusentismoAbierto(false)}>
                Cerrar
              </button>
              <button className="btn-primary" style={{ minHeight: '40px' }} onClick={() => setModalAusentismoAbierto(false)}>
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Asistencia;