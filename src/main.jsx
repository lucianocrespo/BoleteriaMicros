import React from 'react';
// ReactDOM es la libreria que permite a React "hablar" con el navegador (DOM)
import ReactDOM from 'react-dom/client';
// StrictMode es una herramienta de desarrollo que ayuda a detectar problemas potenciales
import { StrictMode } from 'react'
// Importamos los estilos globales
import './index.css'
// Importamos el componente principal que contiene las rutas
import App from './App.jsx';
// Importamos el componente que habilita el enrutamiento (navegacion)
import { BrowserRouter } from 'react-router-dom';

// CREACION DE LA RAIZ (ROOT)
const root = ReactDOM.createRoot(document.getElementById('root'));

// RENDERIZADO DE LA APP
root.render(
  // StrictMode: En desarrollo, ejecuta efectos dos veces para asegurar calidad
  <React.StrictMode>
    <BrowserRouter>
    <App />
    </BrowserRouter>
  </React.StrictMode>
);