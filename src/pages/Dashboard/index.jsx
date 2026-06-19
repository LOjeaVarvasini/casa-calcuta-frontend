import React from 'react';
import './dashboard.css';

function Dashboard({ onNavegar }) {
  return (
    <div className="dashboard-view">
      
      {/* SECCIÓN DE ALERTAS ULTRA-RESPONSIVE */}
      <section className="dashboard-alerts-section">

        <div className="alert-card alert-danger">
          <div className="alert-icon">⚠️</div>
          <div className="alert-body">
            <div className="text-desktop">
              <h3>Ausentismo Crítico Detectado</h3>
              <p>La familia <strong>[Apellido de Familia]</strong> acumuló [Cantidad] faltas consecutivas en las entregas.</p>
            </div>
            <div className="text-mobile">
              <span className="alert-text-mini">Ausentismo Crítico</span>
            </div>
          </div>
          <a href="#listas" className="alert-action" onClick={(e) => { e.preventDefault(); onNavegar('listas'); }}>
            Gestionar
          </a>
        </div>

        <div className="alert-card alert-warning">
          <div className="alert-icon">🎂</div>
          <div className="alert-body">
            <div className="text-desktop">
              <h3>Próximos Cumpleaños ([Cantidad] días)</h3>
              <p><strong>[Nombre del Integrante]</strong> cumple [Edad] años el próximo [Día de la semana].</p>
            </div>
            <div className="text-mobile">
              <span className="alert-text-mini">Cumpleaños Cercano</span>
            </div>
          </div>
          <a href="#familias" className="alert-action" onClick={(e) => { e.preventDefault(); onNavegar('familias'); }}>
            Ver Agenda
          </a>
        </div>

      </section>

      {/* GRILLA DE INDICADORES / MÉTRICAS */}
      <section className="dashboard-grid">
        
        <div className="metric-card">
          <span className="card-icon">🍲</span>
          <div className="metric-data">
            <span className="metric-value">[Cant.]</span>
            <span className="metric-label">Porciones a Preparar</span>
          </div>
        </div>

        <div className="metric-card">
          <span className="card-icon">👨‍👩‍👧‍👦</span>
          <div className="metric-data">
            <span className="metric-value">[Cant.]</span>
            <span className="metric-label">Familias Activas</span>
          </div>
        </div>

          <div className="metric-card">
            <span className="card-icon">⏳</span>
            <div className="metric-data">
              <span className="metric-value">[Cant.]</span>
              <span className="metric-label">Familias en Espera</span>
            </div>
          </div>

      </section>

    </div>
  );
}

export default Dashboard;