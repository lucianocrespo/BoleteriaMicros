import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Viajar.css';

function Viajar() {
  const [origen, setOrigen] = useState('');
  const [destino, setDestino] = useState('');
  const [dia, setDia] = useState('');
  const navigate = useNavigate();

  const handleBuscar = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    console.log('handleBuscar', { origen, destino, dia });
    navigate('/horarios', { state: { origen, destino, dia } });
  };

  return (
    <div className="viajar-container">
      <div className="viajar-from-card">
      <h2>Buscar Viaje</h2>

      <form className="viajar-form" /*onSubmit={handleBuscar}*/>
        <label>
          Origen:
          <input type="text" value={origen} onChange={e => setOrigen(e.target.value)} placeholder=" Ciudad de origen" 
          list="ciudades-list"/>
          <datalist id="ciudades-list">
            <option value="Trenque Lauquen" />
            <option value="Juan Jose Paso" />
            <option value="Francisco Madero" />
            <option value="Pehuajo" />
            <option value="Carlos Casares" />
            <option value="9 De Julio" />
            <option value="Junin" />
            <option value="Bragado" />
            <option value="Buenos Aires" />
          </datalist>
        </label>
        <label>
          Destino:
          <input type="text" value={destino} onChange={e => setDestino(e.target.value)} placeholder=" Ciudad de destino" 
          list="ciudades-list"/>
        </label>

        <label>
          Día:
          <input type="date" value={dia} onChange={e => setDia(e.target.value)} />
        </label>

        <button type="button" className="btn-principal" onClick={handleBuscar}>Buscar</button>
        <button type="button" className="btn-secundario" onClick={() => navigate(-1)}>Volver</button>
      </form>
      </div>
    </div>
  );
};

export default Viajar;