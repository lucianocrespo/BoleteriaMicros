import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from './firebase-config'; // Importamos DB
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import './Asientos.css'; 

// El layout estatico de los asientos (dónde se dibujan)
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
    const [loading, setLoading] = useState(false);

    // Procesa la cadena de asientos ocupados (ej: "1, 7, 12, 21")
    useEffect(() => {
        // Asegúrate de que 'ocupados' es una cadena antes de usar .split
        if (typeof ocupados === 'string' && ocupados !== "null") {
            // Convierte la cadena en un array de numeros
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

    const handleContinuar = async () => {
        if (!asientoSeleccionado) return;
        setLoading(true);

        const claveRuta = `${origen}-${destino}`;

        try {
            // 1. Obtener datos frescos de la BD (para no sobrescribir cambios recientes)
            const docRef = doc(db, "config", "horariosData");
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) throw new Error("Error de configuración");

            const horariosMap = docSnap.data().horarios;
            const viajesParaRuta = horariosMap[claveRuta];
            
            // Encontrar el indice del viaje correcto
            const viajeIndex = viajesParaRuta.findIndex(v => v.horario === horario);
            
            if (viajeIndex === -1) throw new Error("Horario no encontrado");

            // 2. Modificar string de ocupados
            const viaje = viajesParaRuta[viajeIndex];
            let stringOcupados = viaje.asientosOcupados;

            // Validacion extra: ¿Alguien ocupo el asiento hace 1 milisegundo?
            if (stringOcupados && stringOcupados !== "null") {
                const checkArray = stringOcupados.split(',').map(s => parseInt(s.trim()));
                if (checkArray.includes(asientoSeleccionado)) {
                    alert("¡Lo sentimos! Este asiento acaba de ser ocupado por otra persona.");
                    setLoading(false);
                    // Opcional: Recargar la pagina para ver los nuevos ocupados
                    // navigate(0); 
                    return;
                }
                stringOcupados = `${stringOcupados}, ${asientoSeleccionado}`;
            } else {
                stringOcupados = `${asientoSeleccionado}`;
            }

            // 3. Guardar en Firestore
            viaje.asientosOcupados = stringOcupados;
            horariosMap[claveRuta][viajeIndex] = viaje;

            await updateDoc(docRef, { horarios: horariosMap });

            // 4. Navegar a Pago (Pasamos el asiento para que Pago sepa cuál liberar si falla el tiempo)
            navigate('/pago', { 
                state: { origen, destino, dia, horario, asiento: asientoSeleccionado } 
            });

        } catch (error) {
            console.error("Error al reservar:", error);
            alert("Hubo un error al reservar el asiento.");
            setLoading(false);
        }
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
                    {origen} → {destino} | Día: {dia} | Hora: {horario}
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
                            disabled={asientosOcupados.includes(asiento.id) || loading}
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
                    <button onClick={() => navigate(-1)} className="btn-volver" disabled={loading}>
                        Volver
                    </button>
                    <button 
                        onClick={handleContinuar} 
                        disabled={!asientoSeleccionado || loading} 
                        className="btn-continuar"
                    >
                        {loading ? 'Reservando...' : 'Confirmar Asiento'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Asientos;