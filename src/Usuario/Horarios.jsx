import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; // Importamos hooks de navegación:
// Importamos la instancia de la base de datos y las funciones de Firestore necesarias
import { db } from '../firebase-config'; 
import { doc, getDoc } from 'firebase/firestore'; 
// Importamos estilos e imagenes
import './Horarios.css';
import viaje from '../assets/Imagenes/viaje.png';

// Muestra la lista de viajes disponibles basándose en el origen y destino seleccionados
const Horarios = () => {
    // Recuperación de datos del estado de navegación
    const location = useLocation();
    const navigate = useNavigate();
    // Extraemos origen, destino y dia. Si no vienen (acceso directo), evitamos errores con || {}
    const { origen, destino, dia } = location.state || {};
    // Estados locales
    const [horariosData, setHorariosData] = useState({}); // Almacena TODOS los horarios traidos de la BD
    const [loading, setLoading] = useState(true); // Controla la visualizacion del mensaje "Cargando..."

    // Efecto de Carga de Datos: Se ejecuta una sola vez al montar el componente para traer la informacion de Firestore
    useEffect(() => {
        const getHorariosData = async () => {
            setLoading(true);
            // Referencia al documento único que contiene todos los horarios
            const docRef = doc(db, "config", "horariosData");
            
            try {
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    // Guardamos el mapa completo de horarios en el estado
                    setHorariosData(docSnap.data().horarios);
                } else {
                    console.log("No se encontró el documento 'horariosData'.");
                    setHorariosData({});
                }
            } catch (error) {
                console.error("Error al obtener el objeto de horarios:", error);
                setHorariosData({});
            } finally {
                setLoading(false); // Finaliza la carga independientemente del resultado
            }
        };

        getHorariosData();
    }, []); 

    // Manejador de Seleccion: se ejecuta cuando el usuario elige un horario especifico
    const handleSeleccionar = (viaje) => {
        // 'viaje' es el objeto individual del array: { horario: "08:00", asientosOcupados: "...", precio: "5000" }

        // Navegamos a la pantalla de Asientos pasando todos los datos necesarios para la reserva
        navigate('/asientos', { 
            state: { 
                origen, 
                destino, 
                dia, 
                horario: viaje.horario, 
                ocupados: viaje.asientosOcupados || "null", // Si 'asientosOcupados' no existe o es null, pasamos "null" string para evitar errores
                precio: viaje.precio 
            } 
        });
    };

    // Construimos la clave dinamica (ej: "Trenque Lauquen-Buenos Aires") para buscar en el objeto descargado
    const clave = `${origen}-${destino}`;
    
    // Obtenemos el array de viajes especifico para esa ruta. Si no existe, devuelve array vacio
    const horariosDisponibles = horariosData[clave] || [];

    return (
        <div className="horarios-container">
            <div className="horarios-card">
                <h2>Horarios disponibles</h2>
                
                {/* Resumen de la búsqueda realizada */}
                <div className="resumen-viaje">
                    <p>
                        Origen: <strong>{origen}</strong><br />
                        Destino: <strong>{destino}</strong><br />
                        Día: <strong>{dia}</strong>
                    </p>
                </div>

                {/* Renderizado Condicional: Carga vs Lista de Resultados */}
                {loading && <p className="loading-message">Cargando horarios...</p>}

                {!loading && (
                    <div className="tabla-horarios"> 
                        {horariosDisponibles.length > 0 ? (
                            <ul>
                                {/* Iteramos sobre los viajes encontrados */}
                                {horariosDisponibles.map((viaje, index) => (
                                    // Usamos una key única combinando horario e índice
                                    <li key={index}>

                                        {/* Información del viaje (Hora y Precio) */}
                                        <div className="viaje-info">
                                            <span className="viaje-hora">{viaje.horario}</span>
                                            <span className="viaje-precio">
                                                {viaje.precio ? `$${viaje.precio}` : 'Consultar'} {/* Mostramos el precio o 'Consultar' si no está definido */}
                                            </span>
                                        </div>
                                        
                                        {/* Boton de accion */}
                                        <button 
                                            className="btn-seleccionar" 
                                            onClick={() => handleSeleccionar(viaje)} 
                                        >
                                            Seleccionar
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            // Mensaje si no hay rutas para la combinacion Origen-Destino
                            <p className="no-data-message">
                                No se encontraron horarios para la ruta {origen} a {destino}.
                            </p>
                        )}
                    </div>
                )}
                
                <button 
                    type="button" 
                    className="btn-volver" 
                    onClick={() => navigate(-1)} // Navega hacia atras en el historial
                >
                    Volver
                </button>
            </div>
            {/* Imagen decorativa de fondo */}
            <div className="imagen">
                <img src={viaje} alt="Viaje" />
            </div>
        </div>
    );
};

export default Horarios;