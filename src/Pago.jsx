import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from './firebase-config'; 
import { doc, getDoc, updateDoc } from 'firebase/firestore'; 
import './Pago.css';

function Pago() {
    const location = useLocation();
    const navigate = useNavigate();
    // Recuperamos los datos pasados desde la pantalla anterior
    const { origen, destino, dia, horario, asiento } = location.state || {};

    const [nombre, setNombre] = useState('');
    const [numeroTarjeta, setNumeroTarjeta] = useState('');
    const [fechaExpiracion, setFechaExpiracion] = useState('');
    const [codigoSeguridad, setCodigoSeguridad] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Estado del temporizador (5 minutos = 300 segundos)
    const [segundosRestantes, setSegundosRestantes] = useState(300);
    const pagoExitosoRef = useRef(false); // Para controlar si ya pagó

    // Cuenta regresiva
    useEffect(() => {
        if (!asiento) return; // Si no hay asiento (acceso directo), no iniciar timer

        const intervalo = setInterval(() => {
            setSegundosRestantes((prev) => {
                if (prev <= 1) {
                    clearInterval(intervalo);
                    handleTimeout(); // Se acabo el tiempo
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(intervalo);
    }, [asiento]);

    // Formato de tiempo MM:SS
    const formatoTiempo = (segundos) => {
        const m = Math.floor(segundos / 60);
        const s = segundos % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    // Funcion para liberar el asiento
    const liberarAsiento = async () => {
        if (!origen || !destino || !horario || !asiento) return;

        try {
            console.log("Liberando asiento...");
            const claveRuta = `${origen}-${destino}`;
            const docRef = doc(db, "config", "horariosData");
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const horariosMap = docSnap.data().horarios;
                const viajesParaRuta = horariosMap[claveRuta];
                const viajeIndex = viajesParaRuta.findIndex(v => v.horario === horario);
                
                if (viajeIndex !== -1) {
                    const viaje = viajesParaRuta[viajeIndex];
                    // Convertimos string a array, filtramos el asiento y volvemos a string
                    let ocupadosArray = viaje.asientosOcupados 
                        ? viaje.asientosOcupados.split(',').map(s => parseInt(s.trim()))
                        : [];
                    
                    // sacamos el asiento actual
                    ocupadosArray = ocupadosArray.filter(a => a !== asiento);
                    
                    // Guardamos de nuevo ("null" si el array queda vacio)
                    viaje.asientosOcupados = ocupadosArray.length > 0 ? ocupadosArray.join(', ') : "null";
                    horariosMap[claveRuta][viajeIndex] = viaje;

                    await updateDoc(docRef, { horarios: horariosMap });
                    console.log("Asiento liberado en BD.");
                }
            }
        } catch (error) {
            console.error("Error al liberar asiento:", error);
        }
    };

    // Tiempo agotado
    const handleTimeout = async () => {
        if (pagoExitosoRef.current) return; // Si ya pago, no hacer nada
        setMensaje("⏳ Tiempo agotado. El asiento ha sido liberado.");
        setLoading(true);
        await liberarAsiento();
        setTimeout(() => navigate('/'), 3000); // Volver al inicio
    };

    // Boton volver (Cancelar reserva)
    const handleVolver = async () => {
        if (pagoExitosoRef.current) {
            navigate(-1);
            return;
        }
        
        if (window.confirm("Si vuelve atrás, perderá su reserva temporal. ¿Está seguro?")) {
            setLoading(true);
            await liberarAsiento();
            navigate(-1);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMensaje('');

        // Simulacion de pago exitoso (El asiento ya esta reservado desde la pantalla anterior)
        setTimeout(() => {
            pagoExitosoRef.current = true; // Marcamos exito para que el timer no libere
            setMensaje('¡Pago realizado con éxito! Tu asiento está confirmado.');
            
            setTimeout(() => {
                navigate('/MenuViaje'); 
            }, 2000); 
        }, 2000);
    };

    // Si alguien entra directo a /pago sin datos
    if (!asiento) {
        return (
            <div className="pago-container">
                <div className="pago-card">
                    <h2>Error de Navegación</h2>
                    <p>No has seleccionado un viaje.</p>
                    <button className="btn-volver" onClick={() => navigate('/')}>Ir al Inicio</button>
                </div>
            </div>
        );
    }

    return (
        <div className="pago-container">
            <div className="pago-card">
                
                {/* Header con timer */}
                <div className="pago-header">
                    <h2>Formulario de Pago</h2>
                    <div className={`timer-box ${segundosRestantes < 60 ? 'timer-danger' : ''}`}>
                        ⏱️ {formatoTiempo(segundosRestantes)}
                    </div>
                </div>
                
                <div className="resumen-viaje">
                    <h4>Reserva Temporal</h4>
                    <p>
                        Origen: <strong>{origen}</strong><br />
                        Destino: <strong>{destino}</strong><br />
                        Asiento Reservado: <strong>#{asiento}</strong><br />
                        <small style={{color: '#666'}}>Tienes 5 minutos para completar el pago.</small>
                    </p>
                </div>
                
                {mensaje && <div className={`mensaje-pago ${mensaje.includes('éxito') ? 'success' : 'error'}`}>{mensaje}</div>}
                
                {!mensaje.includes('agotado') && (
                    <form className="pago-form" onSubmit={handleSubmit}>
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
                                Vencimiento:
                                <input
                                    type="month"
                                    value={fechaExpiracion}
                                    onChange={(e) => setFechaExpiracion(e.target.value)}
                                    required
                                />
                            </label>
                            <label>
                                CVV:
                                <input
                                    type="text"
                                    value={codigoSeguridad}
                                    onChange={(e) => setCodigoSeguridad(e.target.value)}
                                    required
                                    placeholder="123"
                                    maxLength="4"
                                />
                            </label>
                        </div>
                        
                        <div className="pago-actions">
                            <button type="submit" className="btn-pagar" disabled={loading}>
                                {loading ? 'Procesando...' : 'Pagar y Confirmar'}
                            </button>
                            <button type="button" className="btn-volver" onClick={handleVolver} disabled={loading}>
                                Cancelar Reserva
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

export default Pago;