import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 60 }}>
      <h2>Horarios disponibles</h2>
      <p>
        Origen: {origen}<br />
        Destino: {destino}<br />
        Día: {dia}
      </p>
      <ul>
        {horariosDisponibles.map(h => (
          <li key={h}>
            {h} <button onClick={() => handleSeleccionar(h)}>Seleccionar</button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => navigate(-1)} style={{ marginTop: 16 }}>Volver</button>
    </div>
  );
};

export default Horarios;