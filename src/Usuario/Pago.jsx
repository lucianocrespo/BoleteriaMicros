import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; // Importamos hooks de React Router para navegacion y recibir datos entre pantallas
import { db, auth } from '../firebase-config'; // Importamos la conexion a Firebase y el servicio de autenticacion
import { doc, getDoc, updateDoc, addDoc, collection } from 'firebase/firestore';
// Importamos estilos e imagen
import './Pago.css';
import viaje from '../assets/Imagenes/viaje.png';


function Pago() {
    const location = useLocation();
    const navigate = useNavigate();
    
    // Recuperamos los datos del viaje que el usuario selecciono en la pantalla anterior
    const { origen, destino, dia, horario, asiento } = location.state || {}; // Usamos '|| {}' para evitar errores si alguien entra a esta pagina directamente sin datos

    const [nombre, setNombre] = useState('');
    const [numeroTarjeta, setNumeroTarjeta] = useState('');
    const [fechaExpiracion, setFechaExpiracion] = useState('');
    const [codigoSeguridad, setCodigoSeguridad] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Estado del temporizador
    const [segundosRestantes, setSegundosRestantes] = useState(300); // 300 segundos = 5 minutos
    
    // Impide que el cleanup del timer/temporizador o navegacion libere el asiento si el pago ya fue exitoso
    const pagoExitosoRef = useRef(false);

    // Inicializacion de la cuenta regresiva: se ejecuta al cargar la pantalla
    useEffect(() => {
        if (!asiento) return;

        const intervalo = setInterval(() => {
            setSegundosRestantes((prev) => { // Si el tiempo llega a 0 (o menos), detenemos el reloj y ejecutamos la accion de tiempo agotado
                if (prev <= 1) {
                    clearInterval(intervalo);
                    handleTimeout(); // Trigger de logica de liberacion por tiempo
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(intervalo); //Esta funcion se ejecuta si el usuario sale de la pantalla
    }, [asiento]);

    // Funcion para mostrar el tiempo en formato minutos:segundos
    const formatoTiempo = (segundos) => {
        const m = Math.floor(segundos / 60);
        const s = segundos % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

     /*
        Liberar Asiento (Rollback): Si el usuario se arrepiente, cierra la página o se acaba el tiempo, 
        debemos borrar su reserva temporal de la base de datos para que otro pueda comprar el asiento.
     */
    const liberarAsiento = async () => {
        if (!origen || !destino || !horario || !asiento) return;

        try {
            console.log("Iniciando rollback de asiento...");

             // Buscamos el documento donde estan guardados los horarios
            const claveRuta = `${origen}-${destino}`;
            const docRef = doc(db, "config", "horariosData");
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const horariosMap = docSnap.data().horarios;
                const viajesParaRuta = horariosMap[claveRuta];
                const viajeIndex = viajesParaRuta.findIndex(v => v.horario === horario);
                
                if (viajeIndex !== -1) {
                    const viaje = viajesParaRuta[viajeIndex];
                    
                    // Convertimos el texto de asientos ocupados en una lista (Array) para manipularla
                    let ocupadosArray = viaje.asientosOcupados 
                        ? viaje.asientosOcupados.split(',').map(s => parseInt(s.trim()))
                        : [];
                    
                    // Sacamos el asiento actual de la lista de ocupados
                    ocupadosArray = ocupadosArray.filter(a => a !== asiento);
                    
                    // Guardamos la nueva lista en la base de datos
                    viaje.asientosOcupados = ocupadosArray.length > 0 ? ocupadosArray.join(', ') : "null";
                    horariosMap[claveRuta][viajeIndex] = viaje;

                    await updateDoc(docRef, { horarios: horariosMap });
                    console.log("Rollback completado: Asiento liberado.");
                }
            }
        } catch (error) {
            console.error("Fallo crítico al liberar asiento:", error);
        }
    };

    // Accion cuando se acaba el tiempo
    const handleTimeout = async () => {
        if (pagoExitosoRef.current) return;
        setMensaje("⏳ Tiempo agotado. Liberando reserva...");
        setLoading(true); // Bloqueo de UI durante el rollback
        await liberarAsiento();
        setTimeout(() => navigate('/'), 3000); // Redirigimos al inicio despues de 3 segundos para que el usuario lea el mensaje
    };

    const handleVolver = async () => {
        // Si ya pago, "volver" regresa a la pantalla anterior sin borrar nada
        if (pagoExitosoRef.current) {
            navigate(-1);
            return;
        }
        
        // Si no pago, le advertimos que perdera su reserva
        if (window.confirm("Si vuelves atrás, perderás tu reserva temporal. ¿Confirmar?")) {
            setLoading(true);
            await liberarAsiento(); // Borramos la reserva
            navigate(-1);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); // Previene la recarga de la página
        setLoading(true);
        setMensaje('');

        // Simulamos un tiempo de espera de 2 segundos (como si procesara una tarjeta real)
        setTimeout(async () => {
            try {
                const user = auth.currentUser; // Obtenemos el usuario que inicio sesion
                
                if (user) {
                    // Guardamos el boleto en la coleccion "boletos" en la BD
                    await addDoc(collection(db, "boletos"), {
                        uidUsuario: user.uid, // Esto vincula el boleto con el usuario
                        origen,
                        destino,
                        dia,
                        horario,
                        asiento,
                        nombrePasajero: nombre, // Guardamos el nombre que puso en el formulario
                        fechaCompra: new Date().toISOString()
                    });
                    console.log("Transacción registrada en colección 'boletos'");
                } else {
                    console.warn("Transacción anónima: No se guardó historial.");
                }

                // Confirmacion de pago exitoso
                pagoExitosoRef.current = true; // Confirmamos el pago para que el timer no libere el asiento
                setMensaje('¡Pago aprobado! Generando boleto...');
                
                // Redirigimos al usuario al menu principal
                setTimeout(() => {
                    navigate('/MenuViaje'); 
                }, 2000);

            } catch (error) {
                console.error("Error en transacción:", error);
                setMensaje("Error al generar el comprobante. Contacte soporte.");
            }
        }, 2000);
    };

    // Validacion de seguridad: Si no hay datos de asiento, muestra error
    if (!asiento) {
        return (
            <div className="pago-container">
                <div className="pago-card">
                    <h2>Error de Sesión</h2>
                    <p>Faltan datos del viaje. Inicie el proceso nuevamente.</p>
                    <button className="btn-volver" onClick={() => navigate('/')}>Ir al Inicio</button>
                </div>
            </div>
        );
    }

    return (
        <div className="pago-container">
            <div className="pago-card">

                {/* Encabezado con Cronometro */}
                <div className="pago-header">
                    <h2>Formulario de Pago</h2>
                    {/* El estilo cambia a rojo si queda menos de 1 minuto */}
                    <div className={`timer-box ${segundosRestantes < 60 ? 'timer-danger' : ''}`}>
                        ⏱️ {formatoTiempo(segundosRestantes)}
                    </div>
                </div>
                
                {/* Resumen de lo que se esta pagando */}
                <div className="resumen-viaje">
                    <h4>Reserva Temporal</h4>
                    <p>
                        Origen: <strong>{origen}</strong><br />
                        Destino: <strong>{destino}</strong><br />
                        Asiento Reservado: <strong>#{asiento}</strong><br />
                        <small style={{color: '#666'}}>Tiempo límite para completar la transacción.</small>
                    </p>
                </div>
                
                {/* Mensajes de exito o error */}
                {mensaje && <div className={`mensaje-pago ${mensaje.includes('aprobado') ? 'success' : 'error'}`}>{mensaje}</div>}
                
                {/* Formulario (se oculta si el tiempo se agota) */}
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
            {/* Imagen decorativa de fondo */}
            <div className="imagen">
                <img src={viaje} alt="Viaje" />
            </div>
        </div>
    );
}

export default Pago;