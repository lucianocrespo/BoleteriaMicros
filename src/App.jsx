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

function MainPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '16px 0', background: '#84c172ff' }}>
        <div style={{ display: 'flex', gap: 8, marginRight: 0, marginLeft: 10000 }}>
          <button onClick={() => navigate('/login')}>Iniciar sesion</button>
          <button onClick={() => navigate('/registro')}>Registrarse</button>
        </div>
      </header>
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#509351ff' }}>
        <button
          style={{ fontSize: 32, padding: '32px 64px', borderRadius: 16, background: '#007bff', color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
          onClick={() => navigate('/viajar')}
        >
          Viajar
        </button>
      </main>
    </div>
  );
}

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