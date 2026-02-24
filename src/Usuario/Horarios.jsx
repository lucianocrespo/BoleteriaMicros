import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';// Importamos hooks de navegación
// Importamos la instancia de la base de datos y las funciones de Firestore necesarias
import { db } from '../firebase-config'; 
import { doc, getDoc } from 'firebase/firestore'; 
// Importamos estilos e imagenes
import './Horarios.css';
import viaje from '../assets/Imagenes/viaje.png';

// Muestra la lista de viajes disponibles basandose en el origen y destino seleccionados
const Horarios = () => {
    // Recuperacion de datos del estado de navegacion
    const location = useLocation();
    const navigate = useNavigate();
    // Extraemos origen, destino y dia. Si no vienen (acceso directo), evitamos errores con || {}
    const { origen, destino, dia } = location.state || {};
    // Estados locales
    const [horariosData, setHorariosData] = useState({}); // Almacena todos los horarios traidos de la BD
    const [loading, setLoading] = useState(true); // Controla la visualizacion del mensaje "Cargando..."

    // Efecto de Carga de Datos: Se ejecuta una sola vez al montar el componente para traer la informacion de Firestore
    useEffect(() => {
        const getHorariosData = async () => {
            setLoading(true);
            // Referencia al documento unico que contiene todos los horarios
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
    const handleSeleccionar = (viajeItem) => {
        // Navegamos a la pantalla de Asientos pasando todos los datos necesarios para la reserva
        navigate('/asientos', { 
            state: { 
                origen, 
                destino, 
                dia, 
                horario: viajeItem.horario, 
                ocupados: viajeItem.asientosOcupados || "null", 
                precio: viajeItem.precio 
            } 
        });
    };

    // Construimos la clave dinamica (ej: "Trenque Lauquen-Buenos Aires") para buscar en el objeto descargado
    const clave = `${origen}-${destino}`;
    
    // Obtenemos el array de viajes especifico para esa ruta. Si no existe, devuelve array vacio
    const horariosDisponibles = horariosData[clave] || [];

    // Logica de filtrado de hora
    const getHorariosFiltrados = () => {
        const hoy = new Date();
        
        // Formatear la fecha de hoy para compararla con 'dia'
        const year = hoy.getFullYear();
        const month = String(hoy.getMonth() + 1).padStart(2, '0');
        const day = String(hoy.getDate()).padStart(2, '0');
        const fechaHoy = `${year}-${month}-${day}`;

        // Obtener la hora actual en formato HH:mm
        const horas = String(hoy.getHours()).padStart(2, '0');
        const minutos = String(hoy.getMinutes()).padStart(2, '0');
        const horaActualString = `${horas}:${minutos}`;

        return horariosDisponibles.filter((viajeItem) => {
            // Si el viaje es hoy, solo se muestran los horarios que sean mayores a la hora actual
            if (dia === fechaHoy) {
                return viajeItem.horario > horaActualString;
            }
            // Si el viaje es para mañana o despues, se muestran todos los horarios
            return true;
        });
    };

    // Obtenemos la lista final de horarios que si se pueden comprar
    const horariosFiltrados = getHorariosFiltrados();

    return (
        <div className="horarios-container">
            <div className="horarios-card">
                <h2>Horarios disponibles</h2>
                
                {/* Resumen de la busqueda realizada */}
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
                        
                        {/* Validamos si existe la ruta */}
                        {horariosDisponibles.length === 0 ? (
                            <p className="no-data-message">
                                No se encontraron rutas para la combinación {origen} a {destino}.
                            </p>
                            
                        /* Validamos si existen viajes pero se paso la hora */
                        ) : horariosFiltrados.length === 0 ? (
                            <p className="no-data-message">
                                No hay viajes disponibles para ese día.
                            </p>
                            
                        /* Validamos que hay viajes disponibles y los mostramos iterando la lista filtrada */
                        ) : (
                            <ul>
                                {horariosFiltrados.map((viajeItem, index) => (
                                    <li key={index}>
                                        <div className="viaje-info">
                                            <span className="viaje-hora">{viajeItem.horario}</span>
                                            <span className="viaje-precio">
                                                {viajeItem.precio ? `$${viajeItem.precio}` : 'Consultar'}
                                            </span>
                                        </div>
                                        
                                        <button 
                                            className="btn-seleccionar" 
                                            onClick={() => handleSeleccionar(viajeItem)} 
                                        >
                                            Seleccionar
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                        
                    </div>
                )}
                
                <button 
                    type="button" 
                    className="btn-volver" 
                    onClick={() => navigate(-1)} 
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