import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Registro = ({ onBack }) => {
  const [nombre, setNombre] = useState('');
  const [mail, seteMail] = useState('');
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const navigate = useNavigate();

  const handleRegistrarse = (e) => {
    e.preventDefault();
    if (!nombre || !mail || !usuario || !contrasena) {
      alert('Por favor, complete todos los campos');
      return;
    }
    if (nombre && mail && usuario && contrasena) {
      alert('Registro exitoso!');
      navigate('/');
    } else {
      alert('Es necesario completar todos los campos');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 60 }}>
      <h2>Registrarse</h2>
      <form style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 300 }} onSubmit={handleRegistrarse}>
        <label>
          Nombre:
          <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder=" Ingrese su nombre completo" />
        </label>
        <label>
          Mail:
          <input type="email" value={mail} onChange={e => seteMail(e.target.value)} placeholder=" Ingrese su Mail" />
        </label>
        <label>
          Usuario:
          <input type="text" value={usuario} onChange={e => setUsuario(e.target.value)} placeholder=" Ingrese un usuario" />
        </label>
        <label>
          Contraseña:
          <input type="password" value={contrasena} onChange={e => setContrasena(e.target.value)} placeholder=" Ingrese una contraseña" />
        </label>
        <button type="submit" style={{ marginTop: 16 }}>Registrarse</button>
        <button type="button" onClick={() => navigate(-1)}>Volver</button>
      </form>
    </div>
  );
};

export default Registro;