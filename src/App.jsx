import React, { useState } from 'react';
import Login from './pages/Login';
import Sidebar from './components/common/Sidebar';
import BottomNav from './components/common/BottomNav';

function App() {
  // Este estado va a manejar qué "habitación" o pantalla se está viendo en el centro
  // Posibles valores: 'login', 'dashboard', 'familias', 'integrantes', 'asistencia', 'agenda'
  const [pantallaActual, setPantallaActual] = useState('login');

  // Función que el menú lateral y el inferior usarán para cambiar de pantalla
  const cambiarPantalla = (nombrePantalla) => {
    setPantallaActual(nombrePantalla);
  };

  // FLUJO 1: Si la pantalla actual es el Login, se muestra sola en toda la pantalla
  if (pantallaActual === 'login') {
    return <Login onLoginSuccess={() => setPantallaActual('familias')} />;
  }

  // FLUJO 2: Si ya pasamos el Login, se arma el cascarón común con el ruteo interno
  return (
    <div className="app-layout" style={{ display: 'flex', minHeight: '100vh' }}>
      
      {/* Le pasamos la función al menú de PC para que sepa qué botones se clickean */}
      <Sidebar onNavegar={cambiarPantalla} pantallaActiva={pantallaActual} />

      {/* Área donde van a ir rotando nuestras pantallas estéticas */}
      <div className="app-content-wrapper" style={{ 
        flex: 1, 
        padding: 'var(--space-lg)', 
        paddingBottom: '100px', 
        backgroundColor: 'var(--color-bg)' 
      }}>
        
        <main style={{ marginTop: 'var(--space-md)' }}>
          {/* Ruteador visual condicional */}
          {pantallaActual === 'familias' && <Familias onVerFicha={() => setPantallaActual('integrantes')} />}
          
          {pantallaActual === 'integrantes' && (
            <div style={{ background: 'white', padding: 'var(--space-lg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <h2>Ficha de Integrantes (Próximamente)</h2>
              <button className="btn-table-action" onClick={() => setPantallaActual('familias')} style={{ marginTop: 'var(--space-md)' }}>
                ⬅️ Volver al Padrón
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Le pasamos la función a la botonera de celular */}
      <BottomNav onNavegar={cambiarPantalla} pantallaActiva={pantallaActual} />

    </div>
  );
}

export default App;