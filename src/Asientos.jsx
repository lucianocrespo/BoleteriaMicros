import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Asientos.css'; 

const DISTRIBUCION_ASIENTOS = [
    { id: 1, estado: 'ocupado', gridCol: 1, gridRow: 1 },
    { id: 2, estado: 'disponible', gridCol: 2, gridRow: 1 },
    { id: 3, estado: 'disponible', gridCol: 4, gridRow: 1 },
    { id: 4, estado: 'disponible', gridCol: 5, gridRow: 1 },

    { id: 5, estado: 'disponible', gridCol: 1, gridRow: 2 },
    { id: 6, estado: 'disponible', gridCol: 2, gridRow: 2 },
    { id: 7, estado: 'ocupado', gridCol: 4, gridRow: 2 },
    { id: 8, estado: 'disponible', gridCol: 5, gridRow: 2 },
    
    { id: 9, estado: 'disponible', gridCol: 1, gridRow: 3 },
    { id: 10, estado: 'disponible', gridCol: 2, gridRow: 3 },
    { id: 11, estado: 'disponible', gridCol: 4, gridRow: 3 },
    { id: 12, estado: 'disponible', gridCol: 5, gridRow: 3 },

    { id: 13, estado: 'disponible', gridCol: 1, gridRow: 4 },
    { id: 14, estado: 'disponible', gridCol: 2, gridRow: 4 },
    { id: 15, estado: 'disponible', gridCol: 4, gridRow: 4 },
    { id: 16, estado: 'ocupado', gridCol: 5, gridRow: 4 },

    { id: 17, estado: 'disponible', gridCol: 1, gridRow: 5 },
    { id: 18, estado: 'disponible', gridCol: 2, gridRow: 5 },
    { id: 19, estado: 'disponible', gridCol: 4, gridRow: 5 },
    { id: 20, estado: 'disponible', gridCol: 5, gridRow: 5 },

    { id: 21, estado: 'disponible', gridCol: 1, gridRow: 6 },
    { id: 22, estado: 'disponible', gridCol: 2, gridRow: 6 },
    { id: 23, estado: 'disponible', gridCol: 4, gridRow: 6 },
    { id: 24, estado: 'disponible', gridCol: 5, gridRow: 6 },

    { id: 25, estado: 'disponible', gridCol: 1, gridRow: 7 },
    { id: 26, estado: 'disponible', gridCol: 2, gridRow: 7 },
    { id: 27, estado: 'disponible', gridCol: 4, gridRow: 7 },
    { id: 28, estado: 'disponible', gridCol: 5, gridRow: 7 },

    { id: 29, estado: 'disponible', gridCol: 1, gridRow: 8 },
    { id: 30, estado: 'disponible', gridCol: 2, gridRow: 8 },
    { id: 31, estado: 'disponible', gridCol: 4, gridRow: 8 },
    { id: 32, estado: 'disponible', gridCol: 5, gridRow: 8 },
];

function Asientos() {
    const location = useLocation();
    const navigate = useNavigate();
    const viaje = location.state?.viajeSeleccionado || {};
    const { origen, destino, dia, horaSalida } = viaje; 
    
    const [asientoSeleccionado, setAsientoSeleccionado] = useState(null);
    
    const handleSeleccionarAsiento = (asientoId, estado) => {
        if (estado === 'ocupado') return; 
        setAsientoSeleccionado(asientoId === asientoSeleccionado ? null : asientoId);
    };

    const handleContinuar = () => {
        navigate('/pago', { 
            state: { 
                viajeSeleccionado: viaje,
                asiento: asientoSeleccionado 
            } 
        });
    };

    const getAsientoClase = (asientoId, estado) => {
        if (estado === 'ocupado') return 'asiento-ocupado';
        if (asientoId === asientoSeleccionado) return 'asiento-seleccionado';
        return 'asiento-disponible';
    };

    return (
        <div className="asientos-container">
            <div className="asientos-card">
                <h2>Selección de Asiento</h2>
                
                <p className="resumen-viaje-asientos">
                    {/*{origen} → {destino} | Día: {dia} | Hora: {horaSalida}*/}
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
                        <span className="leyenda-color" style={{backgroundColor: 'var(--color-acento-principal)'}}></span>
                        Seleccionado
                    </div>
                </div>

                <div className="layout-bus">
                    {DISTRIBUCION_ASIENTOS.map(asiento => (
                        <button
                            key={asiento.id}
                            className={`asiento-btn ${getAsientoClase(asiento.id, asiento.estado)}`}
                            onClick={() => handleSeleccionarAsiento(asiento.id, asiento.estado)}
                            disabled={asiento.estado === 'ocupado'}
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