import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function Pago() {
  const location = useLocation();
  const navigate = useNavigate();
  const { origen, destino, dia, horario, asiento } = location.state || {};

  const [nombre, setNombre] = useState('');
  const [numeroTarjeta, setNumeroTarjeta] = useState('');
  const [fechaExpiracion, setFechaExpiracion] = useState('');
  const [codigoSeguridad, setCodigoSeguridad] = useState('');
  const [mensaje, setMensaje] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aca se puede agregar la lógica para procesar el pago
    setMensaje('Pago realizado'); // Establece el mensaje de éxito
    setTimeout(() => {
      navigate('/'); // Redirige a la página principal después de 2 segundos
    }, 2000);
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
      <h2>Formulario de Pago</h2>
      <p>
        Origen: {origen}<br />
        Destino: {destino}<br />
        Día: {dia}<br />
        Horario: {horario}<br />
        Asiento: {asiento}
      </p>
      {mensaje && <div style={{ color: 'green', marginBottom: '20px' }}>{mensaje}</div>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Nombre en la tarjeta:
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Número de tarjeta:
            <input
              type="text"
              value={numeroTarjeta}
              onChange={(e) => setNumeroTarjeta(e.target.value)}
              required
              placeholder="1234 5678 9012 3456"
            />
          </label>
        </div>
        <div>
          <label>
            Fecha de expiración:
            <input
              type="month"
              value={fechaExpiracion}
              onChange={(e) => setFechaExpiracion(e.target.value)}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Código de seguridad:
            <input
              type="text"
              value={codigoSeguridad}
              onChange={(e) => setCodigoSeguridad(e.target.value)}
              required
              placeholder="123"
            />
          </label>
        </div>
        <button type="submit">Realizar Pago</button>
      </form>
    </div>
  );
}

export default Pago;