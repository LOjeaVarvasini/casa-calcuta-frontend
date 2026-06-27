import { useState } from 'react';
import './listas.css';

function Listas({ onNavegar, parametros }) {
  // Estado para controlar la pestaña activa de forma estética (espera o principal)
  const [tabActiva, setTabActiva] = useState('espera');

  return (
    <div className="listas-module" style={{ width: '100%' }}>
      
      {/* PESTAÑAS DE CONTEXTO INTERACTIVAS */}
      <div className="list-tabs-container">
        <button 
          className={`tab-btn ${tabActiva === 'espera' ? 'active' : ''}`}
          onClick={() => setTabActiva('espera')}
        >
          Lista de Espera ([Cantidad Espera])
        </button>
        <button 
          className={`tab-btn ${tabActiva === 'principal' ? 'active' : ''}`}
          onClick={() => setTabActiva('principal')}
        >
          Lista Principal ([Cantidad Principal])
        </button>
      </div>

      {/* TABLA ANTIDESBORDAMIENTO RESPONSIVE */}
      <section className="table-responsive-container">
        <table className="custom-table custom-table-responsive">
          <thead>
            <tr>
              <th>Familia</th>
              <th>Porciones</th>
              <th>Prioridad</th>
              <th>Fecha Ingreso</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            
            {tabActiva === 'espera' ? (
              <>
                {/* Fila Simulada 1 en Espera */}
                <tr>
                  <td data-label="Familia">
                    <strong>[Apellido Familia Espera 1]</strong>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#718096' }}>Ref: [Nombre Referente 1]</p>
                  </td>
                  <td data-label="Porciones">
                    <span className="portions-count">[N]</span>
                  </td>
                  <td data-label="Prioridad">
                    <span className="badge badge-danger">[Prioridad Crítica]</span>
                  </td>
                  <td data-label="Fecha Ingreso">[Fecha Ingreso]</td>
                  <td data-label="Acciones" style={{ textAlign: 'center' }}>
                    <button className="btn-table-action">Promover a Principal</button>
                  </td>
                </tr>

                {/* Fila Simulada 2 en Espera */}
                <tr>
                  <td data-label="Familia">
                    <strong>[Apellido Familia Espera 2]</strong>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#718096' }}>Ref: [Nombre Referente 2]</p>
                  </td>
                  <td data-label="Porciones">
                    <span className="portions-count">[N]</span>
                  </td>
                  <td data-label="Prioridad">
                    <span className="badge badge-warning">[Prioridad Alta]</span>
                  </td>
                  <td data-label="Fecha Ingreso">[Fecha Ingreso]</td>
                  <td data-label="Acciones" style={{ textAlign: 'center' }}>
                    <button className="btn-table-action">Promover a Principal</button>
                  </td>
                </tr>
              </>
            ) : (
              <>
                {/* Vista alternativa de la Lista Principal */}
                <tr>
                  <td data-label="Familia">
                    <strong>[Apellido Familia Principal 1]</strong>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#718096' }}>Ref: [Nombre Referente 3]</p>
                  </td>
                  <td data-label="Porciones">
                    <span className="portions-count">[N]</span>
                  </td>
                  <td data-label="Prioridad">
                    <span className="badge badge-success">[Activa]</span>
                  </td>
                  <td data-label="Fecha Ingreso">[Fecha Ingreso]</td>
                  <td data-label="Acciones" style={{ textAlign: 'center' }}>
                    <button className="btn-table-action action-danger">Degradar a Espera</button>
                  </td>
                </tr>
              </>
            )}

          </tbody>
        </table>
      </section>

    </div>
  );
}

export default Listas;