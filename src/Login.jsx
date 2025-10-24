import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = ({ onBack }) => {
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const navigate = useNavigate();

  const handleRegistrarse = (e) => {
    e.preventDefault();{
      navigate('/Registro');
  }};

  const handleEntrar = (e) => {
    e.preventDefault();
    if (!usuario || !contrasena) {
      alert('Por favor, complete todos los campos');
      return;
    }
    if (usuario === 'user' && contrasena === 'pass') {
      navigate('/MenuViaje');
    } else {
      alert('Nombre de usuario o contraseña incorrectos');
    }
  };

  return (
  <div className="login-container">
    <div className="login-form-card">
      <h2>Iniciar Sesión</h2>
      <form className="login-form" onSubmit={handleEntrar}>
        <label>
          Usuario:
          <input type="text" value={usuario} onChange={e => setUsuario(e.target.value)} placeholder=" Ingrese su usuario" />
        </label>
        <label>
          Contraseña:
          <input type="password" value={contrasena} onChange={e => setContrasena(e.target.value)} placeholder=" Ingrese su contraseña" />
        </label>

        <div className="login-actions">
        <button type="submit" className="btn-entrar" >Entrar</button>
        <button type="button" className="link-registrar" onClick={handleRegistrarse} >Registrarse</button>
        {/*<button onClick={() => navigate(-1)}>Volver</button>*/}
        </div>
      </form>
    </div>
  </div>
  );
};

export default Login;