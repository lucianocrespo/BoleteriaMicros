import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Horarios.css';

const horarios = {
  'Trenque Lauquen-Juan Jose Paso': ['08:00'],
  'Trenque Lauquen-Francisco Madero': ['08:00'],
  'Trenque Lauquen-Pehuajo': ['08:00'],
  'Trenque Lauquen-Carlos Casares': ['08:00'],
  'Trenque Lauquen-9 De Julio': ['08:00'],
  'Trenque Lauquen-Junin': ['08:00'],
  'Trenque Lauquen-Bragado': ['08:00'],
  'Trenque Lauquen-Buenos Aires': ['08:00'],
  'Juan Jose Paso-Francisco Madero': ['08:30'],
  'Juan Jose Paso-Pehuajo': ['08:30'],
  'Juan Jose Paso-Carlos Casares': ['08:30'],
  'Juan Jose Paso-9 De Julio': ['08:30'],
  'Juan Jose Paso-Junin': ['08:30'],
  'Juan Jose Paso-Bragado': ['08:30'],
  'Juan Jose Paso-Buenos Aires': ['08:30'],
  'Francisco Madero-Pehuajo': ['08:50'],
  'Francisco Madero-Carlos Casares': ['08:50'],
  'Francisco Madero-9 De Julio': ['08:50'],
  'Francisco Madero-Junin': ['08:50'],
  'Francisco Madero-Bragado': ['08:50'],
  'Francisco Madero-Buenos Aires': ['08:50'],
  'Pehuajo-Carlos Casares': ['09:10'],
  'Pehuajo-9 De Julio': ['09:10'],
  'Pehuajo-Junin': ['09:10'],
  'Pehuajo-Bragado': ['09:10'],
  'Pehuajo-Buenos Aires': ['09:10'],
  'Carlos Casares-9 De Julio': ['09:50'], 
  'Carlos Casares-Junin': ['09:50'],
  'Carlos Casares-Bragado': ['09:50'],
  'Carlos Casares-Buenos Aires': ['09:50'],
  '9 De Julio-Junin': ['10:30'],
  '9 De Julio-Bragado': ['10:30'],
  '9 De Julio-Buenos Aires': ['10:30'],
  'Junin-Bragado': ['11:00'],
  'Junin-Buenos Aires': ['11:00'],
  'Bragado-Buenos Aires': ['11:30'],
};

const Horarios = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { origen, destino, dia } = location.state || {};

  const handleSeleccionar = (horario) => {
    navigate('/asientos', { state: { origen, destino, dia, horario } });
  };

  const clave = `${origen}-${destino}`;
  const horariosDisponibles = horarios[clave] || [];

  return (
  <div className="horarios-container">
    <div className="horarios-card">
      <h2>Horarios disponibles</h2>
      <div className="resumen-viaje">
        <p>
          Origen: {origen}<br />
          Destino: {destino}<br />
          Día: {dia}
        </p>
      </div>

      <div className="tabla-horarios">  {/*///////////////////////////////*/}
      <ul>
        {horariosDisponibles.map(h => (
          <li key={h}>
            {h} <button className="btn-seleccionar" onClick={() => handleSeleccionar(h)}>Seleccionar</button>
          </li>
        ))}
      </ul>
      </div>
      <button type="button" className="btn-volver" onClick={() => navigate(-1)} >Volver</button>
    </div>
  </div>
  );
};

export default Horarios;