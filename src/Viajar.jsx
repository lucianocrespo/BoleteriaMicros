import React, { useState, useEffect } from 'react'; // Añadimos useEffect
import { useNavigate } from 'react-router-dom';
import { db } from './firebase-config'; // Importamos la DB
import { doc, getDoc } from 'firebase/firestore'; // Importamos funciones de Firestore
import './Viajar.css';
import viaje from './assets/viaje.png';

function Viajar() {
    const [origen, setOrigen] = useState('');
    const [destino, setDestino] = useState('');
    const [dia, setDia] = useState('');
    const [ciudades, setCiudades] = useState([]); // Estado para la lista de ciudades
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const hoy = new Date().toISOString().split('T')[0]; // Fecha actual, para que no se puedan elegir dias anteriores

    // EFECTO: Se ejecuta una vez para cargar la lista de ciudades
    useEffect(() => {
        const getCiudades = async () => {
            // 1. Referencia al documento 'ciudades' en la colección 'config'
            const docRef = doc(db, "config", "ciudades");
            try {
                const docSnap = await getDoc(docRef);

                if (docSnap.exists() && docSnap.data().lista) {
                    // 2. Guardamos el array 'lista' en el estado
                    setCiudades(docSnap.data().lista);
                } else {
                    console.log("No se encontró el documento 'ciudades' o el campo 'lista'");
                }
            } catch (error) {
                console.error("Error al cargar ciudades: ", error);
            }
        };

        getCiudades();
    }, []); // El array vacío [] asegura que se ejecute solo una vez al montar


    const handleBuscar = (e) => {
        // 1. Prevención del evento (Versión Robusta)
        if (e && e.preventDefault) {
            e.preventDefault();
        }

        setError(''); // Limpiamos errores previos

        // 2. Validación de campos completos
        // El .trim() elimina espacios en blanco al inicio y final por si acaso
        if (!origen.trim() || !destino.trim() || !dia) {
            setError('⚠️ Por favor, complete todos los campos.');
            return; // DETIENE la ejecución aquí si falta algo
        }
        // Validación extra: Asegurarse de que no sea una fecha pasada manualmente
        if (dia < hoy) {
            setError('⚠️ Elija una fecha válida.');
            return;
        }

        // 3. Si pasa la validación, procedemos
        setLoading(true);

        setTimeout(() => {
            console.log('Datos válidos. Buscando viaje:', { origen, destino, dia });
            navigate('/horarios', { state: { origen, destino, dia } });
        }, 500); 
    };

    return (
        <div className="viajar-container">
            <div className="viajar-form-card">
                <h2>Buscar Viaje</h2>
                {error && <div className="error-message">{error}</div>}

                <form className="viajar-form">
                    <label>
                        Origen:
                        <input type="text" value={origen} onChange={e => setOrigen(e.target.value)} placeholder=" Ciudad de origen" 
                        list="ciudades-list"/>
                        
                        {/* DATALIST DINÁMICO: Se llena con el estado 'ciudades' */}
                        <datalist id="ciudades-list">
                            {ciudades.map((ciudad) => (
                                <option key={ciudad} value={ciudad} />
                            ))}
                        </datalist>
                    </label>
                    <label>
                        Destino:
                        <input type="text" value={destino} onChange={e => setDestino(e.target.value)} placeholder=" Ciudad de destino" 
                        list="ciudades-list"/>
                    </label>

                    <label>
                        Día:
                        <input type="date" value={dia} min={hoy} onChange={e => setDia(e.target.value)} />
                    </label>

                    <button type="button" className="btn-principal" onClick={handleBuscar}>Buscar</button>
                    <button type="button" className="btn-secundario" onClick={() => navigate(-1)}>Volver</button>
                </form>
            </div>
            <div className="imagen">
                <img src={viaje} alt="Viaje" />
            </div>
        </div>
    );
};

export default Viajar;