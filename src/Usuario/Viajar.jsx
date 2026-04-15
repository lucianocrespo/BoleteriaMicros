import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase-config'; // Importamos la DB
import { doc, getDoc } from 'firebase/firestore'; // Importamos funciones de Firestore
import './Viajar.css';
import viaje from '../assets/Imagenes/viaje.png';

function Viajar() {
    // Estados del formulario 
    // En lugar de empezar vacios (''), intentan leer primero de la memoria de la sesion (para no perder lo ingresado al volver atras)
    const [origen, setOrigen] = useState(() => sessionStorage.getItem('viaje_origen') || '');
    const [destino, setDestino] = useState(() => sessionStorage.getItem('viaje_destino') || '');
    const [dia, setDia] = useState(() => sessionStorage.getItem('viaje_dia') || '');
    
    // Estados de datos y UI
    const [ciudades, setCiudades] = useState([]); // Estado para la lista de ciudades
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const hoy = new Date().toISOString().split('T')[0]; // Fecha actual, para que no se puedan elegir dias anteriores

    // Guardamos los datos en la memoria de la sesion cada vez que el usuario escribe algo
    useEffect(() => {
        sessionStorage.setItem('viaje_origen', origen);
        sessionStorage.setItem('viaje_destino', destino);
        sessionStorage.setItem('viaje_dia', dia);
    }, [origen, destino, dia]);

    // Carga inicial de ciudades desde Firestore
    useEffect(() => {
        const getCiudades = async () => {
            // Referencia al documento 'ciudades' en la coleccion 'config'
            const docRef = doc(db, "config", "ciudades");
            try {
                const docSnap = await getDoc(docRef);

                if (docSnap.exists() && docSnap.data().lista) {
                    // Guardamos el array 'lista' en el estado
                    setCiudades(docSnap.data().lista);
                } else {
                    console.log("No se encontró el documento 'ciudades' o el campo 'lista'");
                }
            } catch (error) {
                console.error("Error al cargar ciudades: ", error);
            }
        };

        getCiudades();
    }, []); // El array vacio [] asegura que se ejecute solo una vez al montar

    // Manejo de la busqueda
    const handleBuscar = (e) => {
        if (e && e.preventDefault) {
            e.preventDefault();
        }
        setError(''); // Limpiamos errores previos

        // Validacion de campos requeridos
        // (El .trim() elimina espacios en blanco al inicio y final por las dudas)
        if (!origen.trim() || !destino.trim() || !dia) {
            setError('⚠️ Por favor, complete todos los campos.');
            return; // Detiene la ejecucion aca si falta algo
        }

        // Validacion estricta de ciudades
        // Verificamos que lo que el usuario escribio (o selecciono) exista realmente en el array de ciudades.
        if (!ciudades.includes(origen.trim())) {
            setError(`⚠️ La ciudad de origen "${origen}" no es válida o fue eliminada.`);
            return;
        }

        if (!ciudades.includes(destino.trim())) {
            setError(`⚠️ La ciudad de destino "${destino}" no es válida o fue eliminada.`);
            return;
        }

        // Validacion extra: asegurarse de que no sea una fecha pasada manualmente
        if (dia < hoy) {
            setError('⚠️ Elija una fecha válida.');
            return;
        }
        // Si pasa la validacion, procedemos
        setLoading(true);

        // Simulacion de proceso y navegacion
        setTimeout(() => {
            console.log('Datos válidos. Buscando viaje:', { origen, destino, dia });
            navigate('/horarios', { state: { origen, destino, dia } });
        }, 500); 
    };

    return (
        <div className="viajar-container">
            <div className="viajar-form-card">
                <h2>Buscar Viaje</h2>

                {/* Feedback de error */}
                {error && <div className="error-message">{error}</div>}

                <form className="viajar-form">
                    <label>
                        Origen:
                        <input type="text" value={origen} onChange={e => setOrigen(e.target.value)} placeholder=" Ciudad de origen" 
                        list="ciudades-list"/>
                        
                        {/* Datalist dinamico cargado de BD */}
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
                        <input type="date" value={dia} min={hoy} // Restriccion nativa de fecha
                        onChange={e => setDia(e.target.value)} />
                    </label>
 
                    <button type="button" className="btn-principal" onClick={handleBuscar}>Buscar</button>
                    <button type="button" className="btn-secundario" onClick={() => navigate(-1)}>Volver</button>
                </form>
            </div>
            {/* Imagen decorativa de fondo */}
            <div className="imagen">
                <img src={viaje} alt="Viaje" />
            </div>
        </div>
    );
}

export default Viajar;