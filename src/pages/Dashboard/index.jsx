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
              <p>La familia <strong>Gómez-Peralta</strong> acumuló 3 faltas consecutivas en las entregas.</p>
            </div>
            <div className="text-mobile">
              <span className="alert-text-mini">Ausentismo Crítico</span>
            </div>
          </div>
          {/* Al hacer clic, simula el viaje hacia las listas */}
          <a href="#listas" className="alert-action" onClick={(e) => { e.preventDefault(); onNavegar('listas'); }}>
            Gestionar
          </a>
        </div>

        <div className="alert-card alert-warning">
          <div className="alert-icon">🎂</div>
          <div className="alert-body">
            <div className="text-desktop">
              <h3>Próximos Cumpleaños (7 días)</h3>
              <p><strong>Mateo Rodríguez</strong> cumple 6 años el próximo martes.</p>
            </div>
            <div className="text-mobile">
              <span className="alert-text-mini">Cumpleaños Cercano</span>
            </div>
          </div>
          {/* Al hacer clic, simula el viaje hacia el padrón de familias */}
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
            <span className="metric-value">142</span>
            <span className="metric-label">Porciones a Preparar</span>
          </div>
        </div>

        <div className="metric-card">
          <span className="card-icon">👨‍👩‍👧‍👦</span>
          <div className="metric-data">
            <span className="metric-value">38</span>
            <span className="metric-label">Familias Activas</span>
          </div>
        </div>

        <div className="metric-card">
          <span className="card-icon">⏳</span>
          <div className="metric-data">
            <span className="metric-value">12</span>
            <span className="metric-label">Familias en Espera</span>
          </div>
        </div>

      </section>

    </div>
  );
}

export default Dashboard;