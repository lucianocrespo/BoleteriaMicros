import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function Asientos() {
  const location = useLocation();
  const navigate = useNavigate();
  const { origen, destino, dia, horario } = location.state || {};
  
  const [asientoSeleccionado, setAsientoSeleccionado] = useState(null);
  
  const asientos = Array.from({ length: 40 }, (_, index) => index + 1); // Crea un array de asientos del 1 al 40

  const handleSeleccionarAsiento = (asiento) => {
    setAsientoSeleccionado(asiento);
  };

  const handleContinuar = () => {
    navigate('/pago', { state: { origen, destino, dia, horario, asiento: asientoSeleccionado } });
  };

  return (
    <div>
      <h2>Selección de Asiento</h2>
      <p>{origen} → {destino} - {dia} - {horario}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', maxWidth: '300px', margin: '20px auto' }}>
        {asientos.map(asiento => (
          <div
            key={asiento}
            onClick={() => handleSeleccionarAsiento(asiento)}
            style={{
              width: '50px',
              height: '50px',
              margin: '5px',
              backgroundColor: asientoSeleccionado === asiento ? 'green' : 'lightgray',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              borderRadius: '5px',
              color: 'white',
              fontWeight: 'bold'
            }}
          >
            {asiento}
          </div>
        ))}
      </div>
      <button onClick={() => navigate(-1)}>Volver</button>
      <button onClick={handleContinuar} disabled={!asientoSeleccionado} style={{ marginLeft: '10px' }}>
        Continuar a Pago
      </button>
    </div>
  );
}

export default Asientos;