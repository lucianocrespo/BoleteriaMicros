import React, { useState, useEffect } from 'react';
// Importamos hooks de navegación para recibir datos (useLocation) y cambiar de paqgina (useNavigate)
import { useLocation, useNavigate } from 'react-router-dom'; 
// Importamos la configuración de la base de datos y las funciones necesarias de Firestore
import { db } from '../firebase-config';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
// Importamos estilos e imagenes
import './Asientos.css';
import viaje from '../assets/Imagenes/viaje.png';

// El layout estatico de los asientos (representa la distribucion de los asientos)
const LAYOUT_ASIENTOS = [
    { id: 1, gridCol: 1, gridRow: 1 }, { id: 2, gridCol: 2, gridRow: 1 }, { id: 3, gridCol: 4, gridRow: 1 }, { id: 4, gridCol: 5, gridRow: 1 },
    { id: 5, gridCol: 1, gridRow: 2 }, { id: 6, gridCol: 2, gridRow: 2 }, { id: 7, gridCol: 4, gridRow: 2 }, { id: 8, gridCol: 5, gridRow: 2 },
    { id: 9, gridCol: 1, gridRow: 3 }, { id: 10, gridCol: 2, gridRow: 3 }, { id: 11, gridCol: 4, gridRow: 3 }, { id: 12, gridCol: 5, gridRow: 3 },
    { id: 13, gridCol: 1, gridRow: 4 }, { id: 14, gridCol: 2, gridRow: 4 }, { id: 15, gridCol: 4, gridRow: 4 }, { id: 16, gridCol: 5, gridRow: 4 },
    { id: 17, gridCol: 1, gridRow: 5 }, { id: 18, gridCol: 2, gridRow: 5 }, { id: 19, gridCol: 4, gridRow: 5 }, { id: 20, gridCol: 5, gridRow: 5 },
    { id: 21, gridCol: 1, gridRow: 6 }, { id: 22, gridCol: 2, gridRow: 6 }, { id: 23, gridCol: 4, gridRow: 6 }, { id: 24, gridCol: 5, gridRow: 6 },
    { id: 25, gridCol: 1, gridRow: 7 }, { id: 26, gridCol: 2, gridRow: 7 }, { id: 27, gridCol: 4, gridRow: 7 }, { id: 28, gridCol: 5, gridRow: 7 },
    { id: 29, gridCol: 1, gridRow: 8 }, { id: 30, gridCol: 2, gridRow: 8 }, { id: 31, gridCol: 4, gridRow: 8 }, { id: 32, gridCol: 5, gridRow: 8 },
];

function Asientos() {
    // Hooks de navegacion
    const location = useLocation();
    const navigate = useNavigate();
    
    // Recuperamos los datos pasados desde la pantalla anterior (Horarios)
    const { origen, destino, dia, horario, precio } = location.state || {};
    
    // Estados locales del componente
    const [asientoSeleccionado, setAsientoSeleccionado] = useState(null); 
    const [asientosOcupados, setAsientosOcupados] = useState([]); 
    const [loading, setLoading] = useState(false); 

    // Escucha la base de datos en tiempo realpara la actualizacion de asientos ocupados
    useEffect(() => {
        if (!origen || !destino || !horario || !dia) return;

        const claveRuta = `${origen}-${destino}`;
        const docRef = doc(db, "config", "horariosData");

        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const horariosMap = docSnap.data().horarios;
                const viajesParaRuta = horariosMap[claveRuta];
                
                if (viajesParaRuta) {
                    const viajeItem = viajesParaRuta.find(v => v.horario === horario);
                    
                    if (viajeItem && viajeItem.asientosOcupados && viajeItem.asientosOcupados[dia]) {
                        // Convierte la cadena en un array de numeros
                        const ocupadosArray = viajeItem.asientosOcupados[dia].split(',')
                            .map(s => parseInt(s.trim(), 10))
                            .filter(Number.isInteger); 
                        
                        setAsientosOcupados(ocupadosArray);
                        
                        setAsientoSeleccionado(prev => ocupadosArray.includes(prev) ? null : prev);
                    } else {
                        setAsientosOcupados([]); // Si es "null" o no es una cadena, no hay ocupados
                    }
                }
            }
        });

        return () => unsubscribe();
    }, [origen, destino, horario, dia]); 

    // Permite seleccionar o deseleccionar, pero impide tocar los ocupados
    const handleSeleccionarAsiento = (asientoId) => {
        if (asientosOcupados.includes(asientoId)) return; 
        setAsientoSeleccionado(asientoId === asientoSeleccionado ? null : asientoId);
    };

    // Al dar clic en "Continuar", actualizamos la base de datos para marcar el asiento como ocupado ANTES de ir al pago, evitando que dos personas compren el mismo
    const handleContinuar = async () => {
        if (!asientoSeleccionado) return; // Validacion de seguridad
        setLoading(true);

        const claveRuta = `${origen}-${destino}`; // Clave única para encontrar la ruta en el mapa de horarios

        try {
            const docRef = doc(db, "config", "horariosData"); // Referencia al documento global de horarios
            const docSnap = await getDoc(docRef); // Obtenemos la "foto" actual de la base de datos (para no sobrescribir cambios de otros)

            if (!docSnap.exists()) throw new Error("Error de configuración");

            // Obtenemos toda la estructura de datos
            const horariosMap = docSnap.data().horarios;
            const viajesParaRuta = horariosMap[claveRuta];

            // Buscamos el viaje especifico por su horario
            const viajeIndex = viajesParaRuta.findIndex(v => v.horario === horario);
            
            if (viajeIndex === -1) throw new Error("Horario no encontrado");

            // Preparamos la actualizacion del string de ocupados
            const viajeItem = viajesParaRuta[viajeIndex];
            
            if (typeof viajeItem.asientosOcupados === 'string') viajeItem.asientosOcupados = {};
            if (!viajeItem.asientosOcupados) viajeItem.asientosOcupados = {};

            let stringOcupados = viajeItem.asientosOcupados[dia];

            // Verificamos si alguien ocupo el asiento en los milisegundos que tardamos en hacer clic
            if (stringOcupados && stringOcupados !== "null") {
                const checkArray = stringOcupados.split(',').map(s => parseInt(s.trim()));
                if (checkArray.includes(asientoSeleccionado)) {
                    alert("¡Lo sentimos! Este asiento acaba de ser ocupado por otra persona.");
                    setLoading(false);
                    return;
                }
                // Si esta libre, agregamos nuestro asiento al string existente
                stringOcupados = `${stringOcupados}, ${asientoSeleccionado}`;
            } else {
                // Si era el primer asiento ocupado
                stringOcupados = `${asientoSeleccionado}`;
            }

            // Actualizamos el objeto en memoria
            viajeItem.asientosOcupados[dia] = stringOcupados;
            horariosMap[claveRuta][viajeIndex] = viajeItem;

            // Guardamos el cambio en Firestore (DB)
            await updateDoc(docRef, { horarios: horariosMap });

            // Navegamos a la pantalla de Pago
            navigate('/pago', { 
                state: { origen, destino, dia, horario, asiento: asientoSeleccionado, precio } 
            });

        } catch (error) {
            console.error("Error al reservar:", error);
            alert("Hubo un error al reservar el asiento.");
            setLoading(false);
        }
    };

     // Funcion para determinar la clase CSS de un asiento segun su estado (ocupado, seleccionado o disponible)
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
                    {origen || 'Origen'} → {destino || 'Destino'} | Día: {dia || 'Fecha'} | Hora: {horario || 'Hora'}
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

                {/* Renderizado de la cuadricula del microbus */}
                <div className="layout-bus">
                    {LAYOUT_ASIENTOS.map(asiento => (
                        <button
                            key={asiento.id}
                            className={`asiento-btn ${getAsientoClase(asiento.id)}`} // Asignamos clase dinámica
                            onClick={() => handleSeleccionarAsiento(asiento.id)}
                            disabled={asientosOcupados.includes(asiento.id) || loading} // Deshabilitamos si está ocupado o si se está procesando la reserva
                            // Estilo en línea para ubicarlo en el Grid
                            style={{
                                gridColumn: asiento.gridCol,
                                gridRow: asiento.gridRow
                            }}
                        >
                            {asiento.id}
                        </button>
                    ))}
                </div>

                <p className="asiento-elegido">
                    Asiento elegido: <strong>{asientoSeleccionado || 'Ninguno'}</strong>
                </p>

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
            
            {/* Imagen decorativa de fondo */}
            <div className="imagen">
                <img src={viaje} alt="Viaje" />
            </div>
        </div>
    );
}

export default Asientos;