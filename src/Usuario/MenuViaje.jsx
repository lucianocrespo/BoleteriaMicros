import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom'; // Importamos useNavigate de react-router-dom, es fundamental para cambiar de pantalla mediante codigo
import { auth } from '../firebase-config'; // Importamos auth para poder cerrar sesion
// Importamos estilos e imagen
import './MenuViaje.css';
import provbagoogleearth from '../assets/Imagenes/provbagoogleearth.png';

// Componente MenuViaje:
 // Es la pantalla principal que ve el usuario autenticado.
 // Ofrece acceso rápido a las funciones principales: Comprar un boleto o ver el historial de compras.

const MenuViaje = () => {
  const navigate = useNavigate(); // Instanciamos el hook de navegacion

  // Funcion para cerrar sesion
  const handleCerrarSesion = () => {
    auth.signOut(); // Cierra la sesion en Firebase
    navigate('/'); // Redirige al Login (pantalla de inicio)
  };

  return (
    // Contenedor principal que define el layout de toda la pantalla
    <div className="menu-viaje-container">

      {/* Encabezado: Contiene controles de usuario como cerrar sesion */}
      <header className="menu-viaje-header">
      <div className="header-actions">
            <button 
                onClick={handleCerrarSesion} 
                className="btn-logout-menu">Cerrar Sesión
            </button>
      </div>
      </header>

      {/* Contenido Principal: Opciones de navegacion */}
      <main className="menu-viaje-main">
        {/* espacio para texto */}

        {/* Tarjeta de bienvenida */}
        <div className="texto-bienvenida-card">
          <h1>¡Bienvenido a tu lugar de viajes!</h1>
          <p>Reserva tu boleto de forma rapida y segura</p>
        </div>

        {/* Contenedor de Botones */}
        <div className="acciones-menu">
        {/* Boton para iniciar el proceso de compra */}
        <button
          className="btn-viajar"
          onClick={() => navigate('/viajar')}>Viajar
        </button>

        {/* Boton para ver los boletos comprados */}
        <button
          className="btn-boletos"
          onClick={() => navigate('/MisBoletos')}>Mis Boletos
        </button>
        
        </div>
      </main>
      {/* Imagen decorativa de fondo */}
      <div className="imagen">
         <img src={provbagoogleearth} alt="Imagen de Viaje" />
      </div>
    </div>

  );
};

export default MenuViaje;