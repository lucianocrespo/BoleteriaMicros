import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = ({ onBack }) => {
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const navigate = useNavigate();

  const handleEntrar = (e) => {
    e.preventDefault();
    if (!usuario || !contrasena) {
      alert('Por favor, complete todos los campos');
      return;
    }
    if (usuario === 'user' && contrasena === 'pass') {
      navigate('/');
    } else {
      alert('Nombre de usuario o contraseña incorrectos');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 60 }}>
      <h2>Iniciar Sesión</h2>
      <form style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 300 }} onSubmit={handleEntrar}>
        <label>
          Usuario:
          <input type="text" value={usuario} onChange={e => setUsuario(e.target.value)} placeholder=" Ingrese su usuario" />
        </label>
        <label>
          Contraseña:
          <input type="password" value={contrasena} onChange={e => setContrasena(e.target.value)} placeholder=" Ingrese su contraseña" />
        </label>
        <button type="submit" style={{ marginTop: 16 }}>Entrar</button>
        <button onClick={() => navigate(-1)}>Volver</button>
      </form>
    </div>
  );
};

export default Login;