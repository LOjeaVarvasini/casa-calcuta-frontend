import React from 'react';
import './login.css'; // Se importa aquí para que sea la última capa de la cascada

function Login({ onLoginSuccess }) {
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const username = formData.get('username');
    const password = formData.get('password');

    // Simulación del salto de pantalla estético
    if (username === 'admin' && password === '1234') {
      onLoginSuccess();
    } else {
      alert('Credenciales de prueba: usuario "admin" y contraseña "1234"');
    }
  };

  return (
    <main className="login-wrapper">
      
      <section className="login-side-panel">
        <div className="panel-content">
          <span className="panel-tag">Proyecto Comunitario</span>
          <h2>Casa Calcuta</h2>
          <p>Transformando la incertidumbre en control operativo para acompañar mejor a cada familia.</p>
        </div>
        <div className="panel-decoration" aria-hidden="true">
          <div className="circle-1"></div>
          <div className="circle-2"></div>
        </div>
      </section>

      <section className="login-form-panel">
        <div className="form-box">
          
          <header className="form-header">
            <div className="brand-badge">CC</div>
            <h1>¡Hola! Te damos la bienvenida</h1>
            <p>Ingresá tus credenciales para acceder al panel de gestión.</p>
          </header>

          <form className="custom-form" onSubmit={handleSubmit}>
  
            <div className="form-group">
              <label htmlFor="username">Usuario o Correo</label>
              <input 
                type="text" 
                id="username" 
                name="username" 
                placeholder="usuario.apellido" 
                required
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <input 
                type="password" 
                id="password" 
                name="password" 
                placeholder="••••••••" 
                required
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="btn-primary">
              Iniciar Sesión
            </button>
            
          </form>

          <footer className="form-footer">
            <p>Gestión de Proyectos 2026 &bull; UNNOBA</p>
          </footer>

        </div>
      </section>

    </main>
  );
}

export default Login;