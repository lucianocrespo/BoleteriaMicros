import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Asientos.css'; 

// El layout estático de los asientos (dónde se dibujan)
const LAYOUT_ASIENTOS = [
    { id: 1, gridCol: 1, gridRow: 1 },
    { id: 2, gridCol: 2, gridRow: 1 },
    { id: 3, gridCol: 4, gridRow: 1 },
    { id: 4, gridCol: 5, gridRow: 1 },
    { id: 5, gridCol: 1, gridRow: 2 },
    { id: 6, gridCol: 2, gridRow: 2 },
    { id: 7, gridCol: 4, gridRow: 2 },
    { id: 8, gridCol: 5, gridRow: 2 },
    { id: 9, gridCol: 1, gridRow: 3 },
    { id: 10, gridCol: 2, gridRow: 3 },
    { id: 11, gridCol: 4, gridRow: 3 },
    { id: 12, gridCol: 5, gridRow: 3 },
    { id: 13, gridCol: 1, gridRow: 4 },
    { id: 14, gridCol: 2, gridRow: 4 },
    { id: 15, gridCol: 4, gridRow: 4 },
    { id: 16, gridCol: 5, gridRow: 4 },
    { id: 17, gridCol: 1, gridRow: 5 },
    { id: 18, gridCol: 2, gridRow: 5 },
    { id: 19, gridCol: 4, gridRow: 5 },
    { id: 20, gridCol: 5, gridRow: 5 },
    { id: 21, gridCol: 1, gridRow: 6 },
    { id: 22, gridCol: 2, gridRow: 6 },
    { id: 23, gridCol: 4, gridRow: 6 },
    { id: 24, gridCol: 5, gridRow: 6 },
    { id: 25, gridCol: 1, gridRow: 7 },
    { id: 26, gridCol: 2, gridRow: 7 },
    { id: 27, gridCol: 4, gridRow: 7 },
    { id: 28, gridCol: 5, gridRow: 7 },
    { id: 29, gridCol: 1, gridRow: 8 },
    { id: 30, gridCol: 2, gridRow: 8 },
    { id: 31, gridCol: 4, gridRow: 8 },
    { id: 32, gridCol: 5, gridRow: 8 },
];

function Asientos() {
    const location = useLocation();
    const navigate = useNavigate();
    
    // Recibe 'horario' y 'ocupados' (enviados desde Horarios.jsx)
    const { origen, destino, dia, horario, ocupados } = location.state || {};
    
    const [asientoSeleccionado, setAsientoSeleccionado] = useState(null);
    const [asientosOcupados, setAsientosOcupados] = useState([]);

    // EFECTO: Procesa la cadena de asientos ocupados (ej: "1, 7, 12, 21")
    useEffect(() => {
        // Asegúrate de que 'ocupados' es una cadena antes de usar .split
        if (typeof ocupados === 'string' && ocupados !== "null") {
            // Convierte la cadena en un array de números
            const ocupadosArray = ocupados.split(',')
                                        .map(s => parseInt(s.trim(), 10))
                                        .filter(Number.isInteger); 
            setAsientosOcupados(ocupadosArray);
        } else {
            setAsientosOcupados([]); // Si es "null" o no es una cadena, no hay ocupados
        }
    }, [ocupados]); // Se ejecuta si la prop 'ocupados' cambia

    const handleSeleccionarAsiento = (asientoId) => {
        if (asientosOcupados.includes(asientoId)) return; 
        setAsientoSeleccionado(asientoId === asientoSeleccionado ? null : asientoId);
    };

    const handleContinuar = () => {
        navigate('/pago', { 
            state: { 
                origen, 
                destino, 
                dia, 
                horario, // Pasa el horario
                asiento: asientoSeleccionado 
            } 
        });
    };

    const getAsientoClase = (asientoId) => {
        if (asientosOcupados.includes(asientoId)) return 'asiento-ocupado';
        if (asientoId === asientoSeleccionado) return 'asiento-seleccionado';
        return 'asiento-disponible';
    };

    return (
        <div className="asientos-container">
            <div className="asientos-card">
                <h2>Selección de Asiento</h2>
                
                <p className="resumen-viaje-asientos">
                    {origen || 'N/A'} → {destino || 'N/A'} | Día: {dia || 'N/A'} | Hora: {horario || 'N/A'}
                </p>

                <div className="leyenda-asientos">
                    <div className="leyenda-item">
                        <span className="leyenda-color" style={{backgroundColor: 'var(--color-asiento-disponible)'}}></span>
                        Disponible
                    </div>
                    <div className="leyenda-item">
                        <span className="leyenda-color" style={{backgroundColor: 'var(--color-asiento-ocupado)'}}></span>
                        Ocupado
                    </div>
                    <div className="leyenda-item">
                        <span className="leyenda-color" style={{backgroundColor: 'var(--color-asiento-seleccionado)'}}></span>
                        Seleccionado
                    </div>
                </div>

                <div className="layout-bus">
                    {LAYOUT_ASIENTOS.map(asiento => (
                        <button
                            key={asiento.id}
                            className={`asiento-btn ${getAsientoClase(asiento.id)}`}
                            onClick={() => handleSeleccionarAsiento(asiento.id)}
                            disabled={asientosOcupados.includes(asiento.id)}
                            style={{
                                gridColumn: asiento.gridCol,
                                gridRow: asiento.gridRow,
                            }}
                        >
                            {asiento.id}
                        </button>
                    ))}
                </div>

                <p style={{marginTop: '15px'}}>Asiento elegido: <strong>{asientoSeleccionado || 'Ninguno'}</strong></p>

                <div className="asientos-actions">
                    <button onClick={() => navigate(-1)} className="btn-volver">
                        Volver
                    </button>
                    <button 
                        onClick={handleContinuar} 
                        disabled={!asientoSeleccionado} 
                        className="btn-continuar"
                    >
                        Continuar a Pago
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Asientos;