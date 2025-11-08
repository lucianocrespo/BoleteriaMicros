import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from './firebase-config'; // Importar la instancia de la base de datos
import { doc, getDoc } from 'firebase/firestore'; // Importar doc y getDoc para documentos únicos
import './Horarios.css'; 

// ELIMINAMOS el objeto 'horarios' hardcodeado. 
// Ahora los datos se cargan desde el estado 'horariosData' después del fetch.

const Horarios = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { origen, destino, dia } = location.state || {};

    // Estado para guardar el objeto completo de horarios traído de Firebase
    const [horariosData, setHorariosData] = useState({});
    // Estado para controlar la carga de la base de datos
    const [loading, setLoading] = useState(true);

    // 💡 EFECTO: Se ejecuta una sola vez al montar el componente para traer todos los horarios
    useEffect(() => {
        const getHorariosData = async () => {
            setLoading(true);
            
            // 1. Referencia al documento 'horariosData' dentro de la colección 'config'
            const docRef = doc(db, "config", "horariosData");
            
            try {
                const docSnap = await getDoc(docRef);
                
                if (docSnap.exists()) {
                    // 2. Guardamos el mapa 'horarios' completo en el estado
                    // docSnap.data().horarios contendrá: { 'TL-JJ': ['08:00'], ... }
                    setHorariosData(docSnap.data().horarios);
                } else {
                    console.log("No se encontró el documento 'horariosData' en la colección 'config'.");
                    setHorariosData({});
                }
            } catch (error) {
                console.error("Error al obtener el objeto de horarios:", error);
                setHorariosData({});
            } finally {
                setLoading(false);
            }
        };

        getHorariosData();
    }, []); // Array vacío: solo se ejecuta al inicio

    const handleSeleccionar = (horario) => {
        // Mantiene la lógica original de navegación
        navigate('/asientos', { state: { origen, destino, dia, horario } });
    };

    // 💡 LÓGICA DE BÚSQUEDA: Utiliza el estado 'horariosData'
    const clave = `${origen}-${destino}`;
    const horariosDisponibles = horariosData[clave] || [];

    return (
        <div className="horarios-container">
            <div className="horarios-card">
                <h2>Horarios disponibles</h2>
                
                <div className="resumen-viaje">
                    {/* El layout de tu resumen de viaje se ajusta un poco para mejor lectura */}
                    <p>
                        Origen: <strong>{origen}</strong><br />
                        Destino: <strong>{destino}</strong><br />
                        Día: <strong>{dia}</strong>
                    </p>
                </div>

                {/* Muestra un mensaje de carga mientras se obtienen los datos */}
                {loading && <p className="loading-message">Cargando horarios desde la base de datos...</p>}

                {/* Renderizado condicional */}
                {!loading && (
                    <div className="tabla-horarios"> 
                        {horariosDisponibles.length > 0 ? (
                            <ul>
                                {horariosDisponibles.map((h) => (
                                    <li key={h}>
                                        {h} 
                                        <button 
                                            className="btn-seleccionar" 
                                            onClick={() => handleSeleccionar(h)}
                                        >
                                            Seleccionar
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="no-data-message">
                                No se encontraron horarios disponibles para la ruta {origen} a {destino}.
                            </p>
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
        </div>
    );
};

export default Horarios;