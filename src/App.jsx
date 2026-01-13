import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom'; // Importamos los componentes necesarios de 'react-router-dom' para manejar la navegación entre páginas
import './App.css'; 
// Importamos cada pantalla de nuestra aplicación para poder usarla en las rutas
import Viajar from './Viajar';
import Horarios from './Horarios';
import Asientos from './Asientos';
import Pago from './Pago';
import Login from './Login';
import Registro from './Registro';
import MenuViaje from './MenuViaje';
import MisBoletos from './MisBoletos';
import PanelAdmin from './PanelAdmin';

function App() {
  return (
    <Routes>
      {/* Autenticacion y acceso */}
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />

      {/* Menu principal de usuario */}
      <Route path="/MenuViaje" element={<MenuViaje />} />

      {/* Proceso de compra */}
      <Route path="/viajar" element={<Viajar />} />
      <Route path="/horarios" element={<Horarios />} />
      <Route path="/asientos" element={<Asientos />} />
      <Route path="/pago" element={<Pago />} /> 
      
      {/* Pantalla con boletos adquiridos */}
      <Route path="/MisBoletos" element={<MisBoletos />} />

      {/* Panel de administracion */}
      <Route path="/PanelAdmin" element={<PanelAdmin />} />
      
    </Routes>
  );
}

export default App;