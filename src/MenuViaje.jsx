import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import './MenuViaje.css';
import provbagoogleearth from './assets/provbagoogleearth.png';


const MenuViaje = () => {
  const navigate = useNavigate();
  return (
    <div className="menu-viaje-container">
      <header className="menu-viaje-header">
     {/*poner elementos de navegacion */}
      </header>
      <main className="menu-viaje-main">
        {/* espacio para texto */}
        <div className="texto-bienvenida-card">
          <h1>¡Bienvenido a tu lugar de viajes!</h1>
          <p>Reserva tu boleto de forma rapida y segura
          </p>
        </div>

        <button
          className="btn-viajar"
          onClick={() => navigate('/viajar')}>Viajar
        </button>
      </main>
      <div className="imagen">
         <img src={provbagoogleearth} alt="Imagen de Viaje" />
      </div>
    </div>

  );
};

export default MenuViaje;