import React from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase-config'; // Importamos auth para cerrar sesion
import { signOut } from 'firebase/auth'; // Importamos signOut independientemente
// Importamos estilos e imagen
import './MenuViaje.css';
import provbagoogleearth from '../assets/Imagenes/provbagoogleearth.png';

const MenuViaje = () => {
  const navigate = useNavigate();

  // Funcion para cerrar sesion
  const handleCerrarSesion = async () => {
    try {
        await signOut(auth);
        // Redirige al Login (pantalla de inicio)
        navigate('/');
    } catch (error) {
        console.error("Error al cerrar sesión", error);
    }
  };
  
  return (
    <div className="menu-viaje-container">
      
      <header className="menu-viaje-header">
        <div className="header-actions">
            {/* Boton de cerrar sesion */}
            <button 
                onClick={handleCerrarSesion} 
                className="btn-logout-menu"
            >
                Cerrar Sesión
            </button>
        </div>
      </header>
      
      <main className="menu-viaje-main">
        
        <div className="texto-bienvenida-card">
          <h1>¡Bienvenido a tu lugar de viajes!</h1>
          <p>Reserva tu boleto de forma rápida y segura</p>
        </div>

        <div className="acciones-menu">
            <button
              className="btn-viajar"
              onClick={() => navigate('/viajar')}
            >
              Viajar
            </button>

            <button
              className="btn-boletos"
              onClick={() => navigate('/MisBoletos')}
            >
              Mis Boletos
            </button>
        </div>
      </main>
      {/* Imagen decorativa de fondo*/}
      <div className="imagen">
         <img src={provbagoogleearth} alt="Imagen de Viaje" />
      </div>
    </div>
  );
};

export default MenuViaje;