// src/pages/Familias/Familias.jsx
import { useState } from 'react';
import './familias.css';

function Familias({ onVerFicha }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalBody, setModalBody] = useState('');

  const openPlaceholderModal = (title, body) => {
    setModalTitle(title);
    setModalBody(body);
    setModalVisible(true);
  };

  const closeModal = () => setModalVisible(false);

  return (
    <>
      {/* Barra de herramientas */}
      <section className="page-toolbar">
        <div className="search-filter-group">
          <div className="form-group" style={{ flex: 2 }}>
            <input type="search" placeholder="Buscar por apellido de referente o DNI..." />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <select>
              <option value="">Todas las prioridades</option>
              <option value="muy-alta">Muy Alta</option>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </div>
        </div>
        <button 
          className="btn-primary" 
          onClick={() => openPlaceholderModal('Nueva Familia', 'Formulario de alta de [Nueva Familia] con campos para [Referente], [DNI], [Integrantes] y [Documentación Requerida].')}
        >
          ➕ Nueva Familia
        </button>
      </section>

      {/* Grilla de Familias con PLACEHOLDERS LITERALES */}
      <section className="families-grid">
        {/* Tarjeta 1 */}
        <div className="family-card">
          <header className="card-family-header">
            <div>
              <h2 className="family-name">[Apellido Familia 1]</h2>
              <p className="referent-info">Ref: [Nombre Referente] • DNI [Número Documento]</p>
            </div>
            <span className="badge badge-danger">Muy Alta</span>
          </header>
          <div className="card-family-body">
            <div className="metric-mini">👥 <span>[Cantidad] Integrantes</span></div>
            <div className="metric-mini">🧒 <span>[Cantidad] Menores</span></div>
            <div className="metric-mini">🛡️ <span className="doc-ok">Docs: OK</span></div>
          </div>
          <footer className="card-family-footer">
            <div className="table-actions-cell">
              <button 
                className="btn-table-action" 
                onClick={() => onVerFicha()}
              >
                Ver ficha
              </button>
              <button 
                className="btn-table-action action-secondary" 
                style={{ backgroundColor: 'rgba(0,0,0,0.04)', borderColor: 'rgba(0,0,0,0.08)', color: '#4a5568' }} 
                onClick={() => openPlaceholderModal('Comisión de la Familia', 'Seguimiento de la comisión asignada a la familia [Apellido Familia 1]. Se mostrarán las visitas programadas y el estado de cada trámite.')}
              >
                Comisión
              </button>
            </div>
          </footer>
        </div>

        {/* Tarjeta 2 */}
        <div className="family-card">
          <header className="card-family-header">
            <div>
              <h2 className="family-name">[Apellido Familia 2]</h2>
              <p className="referent-info">Ref: [Nombre Referente] • DNI [Número Documento]</p>
            </div>
            <span className="badge badge-warning">Alta</span>
          </header>
          <div className="card-family-body">
            <div className="metric-mini">👥 <span>[Cantidad] Integrantes</span></div>
            <div className="metric-mini">🧒 <span>[Cantidad] Menor</span></div>
            <div className="metric-mini">🛡️ <span className="doc-pending">Docs: Pendiente</span></div>
          </div>
          <footer className="card-family-footer">
            <div className="table-actions-cell">
              <button 
                className="btn-table-action" 
                onClick={() => onVerFicha()}
              >
                Ver ficha
              </button>
              <button 
                className="btn-table-action action-secondary" 
                style={{ backgroundColor: 'rgba(0,0,0,0.04)', borderColor: 'rgba(0,0,0,0.08)', color: '#4a5568' }} 
                onClick={() => openPlaceholderModal('Comisión de la Familia', 'Seguimiento de la comisión asignada a la familia [Apellido Familia 2]. Se mostrarán las visitas programadas y el estado de cada trámite.')}
              >
                Comisión
              </button>
            </div>
          </footer>
        </div>
      </section>

      {/* Modal Placeholder Genérico */}
      {modalVisible && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modalTitle}</h3>
            </div>
            <div className="modal-body">
              <p>{modalBody}</p>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={closeModal}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Familias;