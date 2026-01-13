import React, { useState, useEffect, useRef } from 'react';
// Importamos hooks de React Router para navegacion y recibir datos entre pantallas
import { useLocation, useNavigate } from 'react-router-dom';
// Importamos la conexion a Firebase y el servicio de autenticacion
import { db, auth } from '../firebase-config'; 
// Importamos las funciones necesarias para interactuar con la base de datos Firestore
import { doc, getDoc, updateDoc, addDoc, collection } from 'firebase/firestore'; 
import './Pago.css';
import viaje from '../assets/Imagenes/viaje.png';

function Pago() {
    const location = useLocation();
    const navigate = useNavigate();
    // Recuperamos los datos del viaje que el usuario selecciono en la pantalla anterior
    const { origen, destino, dia, horario, asiento } = location.state || {}; // Usamos '|| {}' para evitar errores si alguien entra a esta pagina directamente sin datos

    // Estados para los campos del formulario
    const [nombre, setNombre] = useState('');
    const [numeroTarjeta, setNumeroTarjeta] = useState('');
    const [fechaExpiracion, setFechaExpiracion] = useState('');
    const [codigoSeguridad, setCodigoSeguridad] = useState('');

    // Estados para la interfaz (Mensajes y Carga)
    const [mensaje, setMensaje] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Estado del temporizador
    const [segundosRestantes, setSegundosRestantes] = useState(300); // 300 segundos = 5 minutos
    const pagoExitosoRef = useRef(false); // Referencia para saber si el pago fue exitoso

    // Efecto de Cuenta Regresiva: se ejecuta al cargar la pantalla
    useEffect(() => {
        if (!asiento) return; // Si no hay asiento seleccionado, no iniciamos el reloj

        const intervalo = setInterval(() => {
            setSegundosRestantes((prev) => {
                // Si el tiempo llega a 0 (o menos), detenemos el reloj y ejecutamos la accion de tiempo agotado
                if (prev <= 1) {
                    clearInterval(intervalo);
                    handleTimeout();
                    return 0;
                }
                return prev - 1; // Restamos un segundo
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
            console.log("Liberando asiento...");

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
                    console.log("Asiento liberado en BD.");
                }
            }
        } catch (error) {
            console.error("Error al liberar asiento:", error);
        }
    };

    // Accion cuando se acaba el tiempo
    const handleTimeout = async () => {
        if (pagoExitosoRef.current) return; // Si ya pagó, no hacemos nada
        setMensaje("⏳ Tiempo agotado. El asiento ha sido liberado.");
        setLoading(true); // Bloqueamos la pantalla
        await liberarAsiento(); // Liberamos el asiento en la BD
        setTimeout(() => navigate(-1), 3000); // Redirigimos al inicio despues de 3 segundos para que el usuario lea el mensaje
    };

    // Accion del boton "Cancelar Reserva" o "Volver"
    const handleVolver = async () => {
        // Si ya pago, "volver" regresa a la pantalla anterior sin borrar nada
        if (pagoExitosoRef.current) {
            navigate(-1);
            return;
        }
        
        // Si no pago, le advertimos que perdera su reserva
        if (window.confirm("Si vuelve atrás, perderá su reserva temporal. ¿Está seguro?")) {
            setLoading(true);
            await liberarAsiento(); // Borramos la reserva
            navigate(-1); // Volvemos atrás
        }
    };

    // Accion del formulario al hacer clic en "Pagar"
    const handleSubmit = async (e) => {
        e.preventDefault(); // Previene la recarga de la página
        setLoading(true);
        setMensaje('');

        // Simulamos un tiempo de espera de 2 segundos (como si procesara una tarjeta real)
        setTimeout(async () => {
            try {
                // Obtenemos el usuario que inicio sesion
                const user = auth.currentUser;
                
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
                    
                    console.log("Boleto guardado exitosamente en colección 'boletos'");
                } else {
                    console.warn("ATENCIÓN: Usuario no logueado. El boleto no se guardará en el historial.");
                }

                // Confirmacion de pago exitoso
                pagoExitosoRef.current = true; // Confirmamos pago para que el timer no libere el asiento
                setMensaje('¡Pago realizado con éxito! Tu boleto ha sido generado.');
                
                // Redirigimos al usuario al menu principal
                setTimeout(() => {
                    navigate('/MenuViaje'); 
                }, 2000);

            } catch (error) {
                console.error("Error al generar el boleto:", error);
                setMensaje("Pago procesado, pero hubo un error generando el comprobante.");
            }
        }, 2000);
    };

    // Validacion de seguridad: Si no hay datos de asiento, muestra error
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
                        <small style={{color: '#666'}}>Tienes 5 minutos para completar el pago.</small>
                    </p>
                </div>
                
                {/* Mensajes de exito o error */}
                {mensaje && <div className={`mensaje-pago ${mensaje.includes('éxito') ? 'success' : 'error'}`}>{mensaje}</div>}
                
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