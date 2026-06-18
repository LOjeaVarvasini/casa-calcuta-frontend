import React from 'react';

function App() {
  return (
    <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Cabecera Temporal de Verificación del UI Kit */}
      <header style={{ 
        padding: '24px', 
        textAlign: 'center', 
        background: 'var(--color-card)', 
        borderBottom: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)' 
      }}>
        <h1 style={{ color: 'var(--color-primary)', fontSize: '1.5rem', fontWeight: 800 }}>
          Casa Calcuta — Frontend Core
        </h1>
        <p style={{ color: '#718096', fontSize: '0.875rem', marginTop: '4px' }}>
          Entorno de desarrollo inicializado con Vite y React JS
        </p>
      </header>

      {/* Espacio de trabajo para los futuros módulos */}
      <main style={{ flex: 1, padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ 
          background: 'var(--color-card)', 
          padding: '24px', 
          borderRadius: 'var(--radius-md)', 
          border: '1px solid var(--color-border)',
          maxWidth: '400px',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '2rem' }}>📦</span>
          <h3 style={{ marginTop: '12px', fontWeight: 700 }}>Esqueleto Listo</h3>
          <p style={{ color: '#4a5568', fontSize: '0.875rem', marginTop: '8px', lineHeight: 1.5 }}>
            Los tokens cromáticos y el motor responsive se acoplaron con éxito. Próximo paso: Modularizar los componentes comunes de navegación.
          </p>
        </div>
      </main>

    </div>
  );
}

export default App;