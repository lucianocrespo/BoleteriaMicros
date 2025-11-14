import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from './firebase-config'; // 💡 Importamos la DB
import { doc, getDoc, updateDoc } from 'firebase/firestore'; // 💡 Importamos funciones de Firestore
import './Pago.css';

function Pago() {
    const location = useLocation();
    const navigate = useNavigate();
    // Los datos del viaje (origen, destino, horario, asiento) se reciben del state
    const { origen, destino, dia, horario, asiento } = location.state || {};

    const [nombre, setNombre] = useState('');
    const [numeroTarjeta, setNumeroTarjeta] = useState('');
    const [fechaExpiracion, setFechaExpiracion] = useState('');
    const [codigoSeguridad, setCodigoSeguridad] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [loading, setLoading] = useState(false);

    // 💡 Convertimos handleSubmit a una función asíncrona
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMensaje('');

        if (!origen || !destino || !horario || !asiento) {
            setMensaje('Error: Faltan datos de la reserva.');
            setLoading(false);
            return;
        }

        // Definimos la ruta de la clave en la base de datos
        const claveRuta = `${origen}-${destino}`;
        
        try {
            // --- INICIO: Lógica de actualización de Firestore ---

            // 1. OBTENER (Read) el documento 'horariosData'
            const docRef = doc(db, "config", "horariosData");
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                throw new Error("No se encontró la configuración de horarios.");
            }

            // Hacemos una copia del objeto 'horarios' completo
            const horariosMap = docSnap.data().horarios;
            
            // 2. MODIFICAR (Modify) los datos en memoria
            
            // Encontrar el array de viajes para la ruta específica
            const viajesParaRuta = horariosMap[claveRuta];
            if (!viajesParaRuta) {
                throw new Error("No se encontró la ruta.");
            }

            // Encontrar el índice del horario específico (ej. "08:00")
            const viajeIndex = viajesParaRuta.findIndex(v => v.horario === horario);
            if (viajeIndex === -1) {
                throw new Error("No se encontró el horario específico.");
            }
            
            // Obtener la cadena actual de asientos ocupados
            const viajeAModificar = viajesParaRuta[viajeIndex];
            const ocupadosActual = viajeAModificar.asientosOcupados;

            // Añadir el nuevo asiento a la cadena
            let nuevosOcupados;
            if (ocupadosActual === "null" || !ocupadosActual) {
                // Si es "null" o vacío, este es el primer asiento
                nuevosOcupados = `${asiento}`;
            } else {
                // Si ya hay asientos, lo agregamos (ej: "1, 7" -> "1, 7, 12")
                nuevosOcupados = `${ocupadosActual}, ${asiento}`;
            }

            // Actualizar el objeto en memoria
            viajeAModificar.asientosOcupados = nuevosOcupados;
            horariosMap[claveRuta][viajeIndex] = viajeAModificar;

            // 3. ESCRIBIR (Write) el objeto 'horarios' completo de vuelta
            await updateDoc(docRef, {
                horarios: horariosMap
            });

            // --- FIN: Lógica de Firestore ---

            // Si llegamos aquí, la reserva fue exitosa
            setMensaje('¡Pago realizado con éxito! Asiento reservado.');
            
            // Redirige a la página principal (como en tu código original)
            setTimeout(() => {
                navigate('/'); // Redirige a la página principal
            }, 2000); // 2 segundos para mostrar el mensaje de éxito

        } catch (error) {
            console.error("Error al procesar la reserva: ", error);
            setMensaje(`Error al procesar la reserva: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="pago-container">
            <div className="pago-card">
                <h2>Formulario de Pago</h2>
                
                <div className="resumen-viaje">
                    <h4>Detalles del Viaje</h4>
                    <p>
                        Origen: <strong>{origen || 'N/A'}</strong><br />
                        Destino: <strong>{destino || 'N/A'}</strong><br />
                        Día: <strong>{dia || 'N/A'}</strong><br />
                        Horario: <strong>{horario || 'N/A'}</strong><br />
                        Asiento: <strong>{asiento || 'N/A'}</strong>
                    </p>
                </div>
                
                {mensaje && <div className={`mensaje-pago ${mensaje.includes('éxito') ? 'success' : 'error'}`}>{mensaje}</div>}
                
                <form className="pago-form" onSubmit={handleSubmit}>
                    {/* Campos del formulario de pago */}
                    <label>
                        Nombre en la tarjeta:
                        <input
                            type="text"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            required
                            placeholder="Nombre del titular"
                        />
                    </label>
                    <label>
                        Número de tarjeta:
                        <input
                            type="text"
                            value={numeroTarjeta}
                            onChange={(e) => setNumeroTarjeta(e.target.value)}
                            required
                            placeholder="xxxx xxxx xxxx xxxx"
                            maxLength="19"
                        />
                    </label>
                    
                    <div className="grid-2-cols">
                        <label>
                            Fecha de expiración:
                            <input
                                type="month"
                                value={fechaExpiracion}
                                onChange={(e) => setFechaExpiracion(e.target.value)}
                                required
                            />
                        </label>
                        <label>
                            Código de seguridad (CVV):
                            <input
                                type="text"
                                value={codigoSeguridad}
                                onChange={(e) => setCodigoSeguridad(e.target.value)}
                                required
                                placeholder="CVV"
                                maxLength="4"
                            />
                        </label>
                    </div>
                    
                    <div className="pago-actions">
                        <button type="submit" className="btn-pagar" disabled={loading}>
                            {loading ? 'Reservando...' : 'Realizar Pago y Reservar'}
                        </button>
                        <button type="button" className="btn-volver" onClick={() => navigate(-1)} disabled={loading}>
                            Volver
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Pago;