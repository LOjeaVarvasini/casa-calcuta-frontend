import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/variables.css'  // 1. Primero cargamos los colores y espaciados
import './index.css'             // 2. Segundo cargamos tu base.css (con los inputs y botones)
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)