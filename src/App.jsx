import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';
import Viajar from './Viajar';
import Horarios from './Horarios';
import Asientos from './Asientos';
import Pago from './Pago';
import Login from './Login';
import Registro from './Registro';
import MenuViaje from './MenuViaje';


function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/viajar" element={<Viajar />} />
      <Route path="/horarios" element={<Horarios />} />
      <Route path="/asientos" element={<Asientos />} />
      <Route path="/pago" element={<Pago />} /> 
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/MenuViaje" element={<MenuViaje />} />
    </Routes>
  );
}

export default App;