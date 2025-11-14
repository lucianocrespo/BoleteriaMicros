import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from './firebase-config'; 
import { doc, getDoc } from 'firebase/firestore'; 
import './Horarios.css'; 

const Horarios = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { origen, destino, dia } = location.state || {};

    const [horariosData, setHorariosData] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getHorariosData = async () => {
            setLoading(true);
            const docRef = doc(db, "config", "horariosData");
            
            try {
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setHorariosData(docSnap.data().horarios);
                } else {
                    console.log("No se encontró el documento 'horariosData'.");
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
    }, []); 

    // 💡 CORREGIDO: Ahora pasa los campos correctos
    const handleSeleccionar = (viaje) => {
        // 'viaje' es el objeto { horario: "08:00", asientosOcupados: "1, 7, 12, 21" }

        navigate('/asientos', { 
            state: { 
                origen, 
                destino, 
                dia, 
                horario: viaje.horario, // 💡 Usa 'viaje.horario'
                ocupados: viaje.asientosOcupados || "null" // 💡 Usa 'viaje.asientosOcupados'
            } 
        });
    };

    const clave = `${origen}-${destino}`;
    
    // 'horariosDisponibles' es un array de objetos
    const horariosDisponibles = horariosData[clave] || [];

    return (
        <div className="horarios-container">
            <div className="horarios-card">
                <h2>Horarios disponibles</h2>
                
                <div className="resumen-viaje">
                    <p>
                        Origen: <strong>{origen}</strong><br />
                        Destino: <strong>{destino}</strong><br />
                        Día: <strong>{dia}</strong>
                    </p>
                </div>

                {loading && <p className="loading-message">Cargando horarios...</p>}

                {!loading && (
                    <div className="tabla-horarios"> 
                        {horariosDisponibles.length > 0 ? (
                            <ul>
                                {/* 💡 CORREGIDO: Mapea el array de objetos */}
                                {horariosDisponibles.map((viaje, index) => (
                                    // 'viaje' es el objeto { horario: "...", asientosOcupados: "..." }
                                    <li key={viaje.horario + index}>
                                        {viaje.horario} {/* 💡 Usa 'viaje.horario' */}
                                        <button 
                                            className="btn-seleccionar" 
                                            onClick={() => handleSeleccionar(viaje)} // Pasa el objeto completo
                                        >
                                            Seleccionar
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="no-data-message">
                                No se encontraron horarios para la ruta {origen} a {destino}.
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