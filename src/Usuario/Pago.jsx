import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase-config'; 
import { doc, getDoc, updateDoc, addDoc, collection } from 'firebase/firestore'; 
import './Pago.css';
import viaje from '../assets/Imagenes/viaje.png';

// Contador externo: evita que el Modo Estricto de React libere el asiento por error
let pagoMountCount = 0;

function Pago() {
    const location = useLocation();
    const navigate = useNavigate();
    
    // Recuperamos los datos del viaje que el usuario selecciono en la pantalla anterior
    const { origen, destino, dia, horario, asiento, precio } = location.state || {}; 

    // Estados del formulario de tarjeta
    const [nombre, setNombre] = useState('');
    const [numeroTarjeta, setNumeroTarjeta] = useState('');
    const [fechaExpiracion, setFechaExpiracion] = useState('');
    const [codigoSeguridad, setCodigoSeguridad] = useState('');

    const [mensaje, setMensaje] = useState('');
    const [loading, setLoading] = useState(false);
    const [pagoCompletado, setPagoCompletado] = useState(false); 
    const [segundosRestantes, setSegundosRestantes] = useState(300);

    // Referencias para manejar la limpieza de datos sin depender de re-renders
    const reservaInfo = useRef({ origen, destino, dia, horario, asiento });
    const pagoExitosoRef = useRef(false);
    const reservaLiberadaRef = useRef(false); 

    useEffect(() => {
        reservaInfo.current = { origen, destino, dia, horario, asiento };
    }, [origen, destino, dia, horario, asiento]);

    // Funcion para liberar el asiento si el usuario abandona la compra
    const liberarAsientoManual = async () => {
        if (pagoExitosoRef.current || reservaLiberadaRef.current) return;
        
        const info = reservaInfo.current;
        if (!info.origen || !info.destino || !info.dia || !info.horario || !info.asiento) return;

        reservaLiberadaRef.current = true; 

        try {
            console.log("Liberando asiento por abandono...");
            const claveRuta = `${info.origen}-${info.destino}`;
            const docRef = doc(db, "config", "horariosData");
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const horariosMap = docSnap.data().horarios;
                const viajesParaRuta = horariosMap[claveRuta];
                const viajeIndex = viajesParaRuta.findIndex(v => v.horario === info.horario);
                
                if (viajeIndex !== -1) {
                    const viajeData = viajesParaRuta[viajeIndex];
                    
                    if (typeof viajeData.asientosOcupados === 'string') viajeData.asientosOcupados = {};
                    if (!viajeData.asientosOcupados) viajeData.asientosOcupados = {};

                    let ocupadosArray = viajeData.asientosOcupados[info.dia] 
                        ? viajeData.asientosOcupados[info.dia].split(',').map(s => parseInt(s.trim()))
                        : [];
                    
                    ocupadosArray = ocupadosArray.filter(a => a !== info.asiento);
                    
                    if (ocupadosArray.length > 0) {
                        viajeData.asientosOcupados[info.dia] = ocupadosArray.join(', ');
                    } else {
                        delete viajeData.asientosOcupados[info.dia];
                    }
                    
                    horariosMap[claveRuta][viajeIndex] = viajeData;

                    await updateDoc(docRef, { horarios: horariosMap });
                    console.log(`Asiento #${info.asiento} liberado correctamente.`);
                }
            }
        } catch (error) {
            console.error("Error al liberar asiento:", error);
            reservaLiberadaRef.current = false; 
        }
    };

    // Efecto de montaje y desmontaje inteligente (Anti-StrictMode y Browser Back)
    useEffect(() => {
        pagoMountCount++;

        const handleBeforeUnload = (e) => {
            if (!pagoExitosoRef.current && !reservaLiberadaRef.current) {
                liberarAsientoManual();
                e.returnValue = ''; 
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            pagoMountCount--;
            window.removeEventListener('beforeunload', handleBeforeUnload);
            
            setTimeout(() => {
                if (pagoMountCount === 0 && !pagoExitosoRef.current && !reservaLiberadaRef.current) {
                    liberarAsientoManual();
                }
            }, 300);
        };
    }, []); 

    // Temporizador de 5 minutos
    useEffect(() => {
        if (!asiento || pagoCompletado) return; 

        const intervalo = setInterval(() => {
            setSegundosRestantes((prev) => {
                if (prev <= 1) {
                    clearInterval(intervalo);
                    handleTimeout();
                    return 0;
                }
                return prev - 1; 
            });
        }, 1000);

        return () => clearInterval(intervalo); 
    }, [asiento, pagoCompletado]);

    const formatoTiempo = (segundos) => {
        const m = Math.floor(segundos / 60);
        const s = segundos % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handleTimeout = async () => {
        if (pagoExitosoRef.current) return;
        setMensaje("⏳ Tiempo agotado. Tu reserva ha sido liberada.");
        setLoading(true); 
        await liberarAsientoManual(); 
        setTimeout(() => navigate(-1), 3000); 
    };

    const handleVolver = async () => {
        if (pagoExitosoRef.current) {
            navigate(-1);
            return;
        }
        if (window.confirm("¿Seguro que quieres volver? Se perderá tu reserva del asiento.")) {
            setLoading(true);
            await liberarAsientoManual(); 
            navigate(-1); 
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); 
        
        // Validacion manual extra de seguridad (por si falla el HTML5)
        if (numeroTarjeta.length < 16) {
            setMensaje("El número de tarjeta debe tener exactamente 16 dígitos.");
            return;
        }
        if (codigoSeguridad.length < 3) {
            setMensaje("El CVV debe tener exactamente 3 dígitos.");
            return;
        }

        setLoading(true);
        setMensaje('');

        // Simulamos el proceso de pago
        setTimeout(async () => {
            try {
                const user = auth.currentUser; 
                
                if (user) {
                    await addDoc(collection(db, "boletos"), {
                        uidUsuario: user.uid,
                        origen, destino, dia, horario, asiento,
                        nombrePasajero: nombre, 
                        fechaCompra: new Date().toISOString(),
                        precio: precio || '0'
                    });
                } 

                pagoExitosoRef.current = true; 
                setMensaje('¡Pago realizado con éxito! Tu boleto ha sido generado.');
                setPagoCompletado(true);

            } catch (error) {
                console.error("Error al generar el boleto:", error);
                setMensaje("Error al procesar el pago. Inténtalo de nuevo.");
            } finally {
                setLoading(false);
            }
        }, 2000);
    };

    return (
        <div className="pago-container">
            <div className="pago-card">
                <div className="pago-header">
                    <h2>Formulario de Pago</h2>
                    {!pagoCompletado && (
                        <div className={`timer-box ${segundosRestantes < 60 ? 'timer-danger' : ''}`}>
                            ⏱️ {formatoTiempo(segundosRestantes)}
                        </div>
                    )}
                </div>
                
                {mensaje && (
                    <div className={`mensaje-pago ${mensaje.includes('éxito') ? 'success' : 'error'}`}>
                        {mensaje}
                    </div>
                )}
                
                {pagoCompletado ? (
                    <div className="ticket-generado">
                        <div id="area-impresion">
                            <h2>🎟️ Boleto de Viaje</h2>
                            <p><strong>Pasajero:</strong> {nombre}</p>
                            <p><strong>Origen:</strong> {origen}</p>
                            <p><strong>Destino:</strong> {destino}</p>
                            <p><strong>Fecha:</strong> {dia} <span className="ticket-hora"><strong>Hora:</strong> {horario}</span></p>
                            <p><strong>Asiento:</strong> #{asiento}</p>
                            <h3 className="ticket-total">Total Abonado: ${precio || '0'}</h3>
                        </div>
                        
                        <div className="pago-actions grid-2-cols">
                            <button type="button" className="btn-imprimir" onClick={() => window.print()}>
                                🖨️ Imprimir Boleto
                            </button>
                            <button type="button" className="btn-pagar" onClick={() => navigate('/MenuViaje')}>
                                Volver al Menú
                            </button>
                        </div>
                    </div>
                ) : !mensaje.includes('agotado') && (
                    <>
                        <div className="resumen-viaje">
                            <h4>Reserva Temporal</h4>
                            <p>
                                Origen: <strong>{origen}</strong><br /> Destino: <strong>{destino}</strong><br />
                                Fecha: <strong>{dia}</strong> a las <strong>{horario} hs</strong><br />
                                Asiento Reservado: <strong>#{asiento}</strong><br />
                                Total a Abonar: <strong className="total-abonar">${precio || '0'}</strong>
                            </p>
                        </div>
                        <form className="pago-form" onSubmit={handleSubmit}>
                            <label>
                                <span>Nombre en la tarjeta:</span>
                                <input 
                                    type="text" 
                                    value={nombre} 
                                    onChange={(e) => setNombre(e.target.value)} 
                                    required 
                                    placeholder="Nombre del titular" 
                                    minLength="3"
                                    pattern="[A-Za-z\s]+"
                                    title="Solo se permiten letras y espacios."
                                />
                            </label>
                            <label>
                                <span>Número de tarjeta:</span>
                                {/* minLength y pattern estricto para 16 digitos en el numero de la tarjeta */}
                                <input 
                                    type="text" 
                                    value={numeroTarjeta} 
                                    onChange={(e) => setNumeroTarjeta(e.target.value.replace(/\D/g, ''))} 
                                    required 
                                    placeholder="1234123412341234" 
                                    maxLength="16" 
                                    minLength="16"
                                    pattern="\d{16}"
                                    title="Debe ingresar exactamente 16 números."
                                />
                            </label>
                            
                            <div className="grid-2-cols">
                                <label>
                                    <span>Vencimiento:</span>
                                    <input 
                                        type="month" 
                                        value={fechaExpiracion} 
                                        onChange={(e) => setFechaExpiracion(e.target.value)} 
                                        required 
                                    />
                                </label>
                                <label>
                                    <span>CVV:</span>
                                    {/* minLength y pattern estricto para 3 digitos en el CVV */}
                                    <input 
                                        type="text" 
                                        value={codigoSeguridad} 
                                        onChange={(e) => setCodigoSeguridad(e.target.value.replace(/\D/g, ''))} 
                                        required 
                                        placeholder="123" 
                                        maxLength="3" 
                                        minLength="3"
                                        pattern="\d{3}"
                                        title="Debe ingresar exactamente 3 números."
                                    />
                                </label>
                            </div>
                            
                            <div className="pago-actions grid-2-cols">
                                <button type="submit" className="btn-pagar" disabled={loading}>
                                    {loading ? 'Procesando...' : 'Pagar y Confirmar'}
                                </button>
                                <button type="button" className="btn-volver" onClick={handleVolver} disabled={loading}>
                                    Cancelar Reserva
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
            <div className="imagen">
                <img src={viaje} alt="Viaje" />
            </div>
        </div>
    );
}

export default Pago;