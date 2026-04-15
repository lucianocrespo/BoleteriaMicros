import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Importamos funciones de Firebase
import { db, auth } from '../firebase-config';
import { collection, query, where, getDocs, deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
// Importamos estilos e imagen
import './MisBoletos.css';
import provbagoogleearth from '../assets/Imagenes/provbagoogleearth.png'; 

const MisBoletos = () => {
    // Estados para almacenar la lista de boletos y el estado de carga
    const [boletos, setBoletos] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Se guarda que boleto se quiere imprimir
    const [boletoImpresion, setBoletoImpresion] = useState(null); 
    const navigate = useNavigate();

    // determinamos si el viaje es pasado (Fecha Viaje < Fecha Actual)
    // (Para deshabilitar la cancelacion en viajes antiguos).
    const verificarSiYaPaso = (fechaStr, horaStr) => {
        if (!fechaStr || !horaStr) return false;
        const fechaViaje = new Date(`${fechaStr}T${horaStr}`);
        const ahora = new Date();
        return fechaViaje < ahora;
    };

    // Funcion para obtener los boletos, se ejecuta al montar el componente para traer los boletos del usuario actual
    useEffect(() => {
        const fetchBoletos = async () => {
            setLoading(true);
            try {
                const user = auth.currentUser; 
                if (!user) {
                    console.log("No hay usuario logueado");
                    setLoading(false);
                    return;
                }

                // Creamos la consulta a la coleccion "boletos"
                const q = query(collection(db, "boletos"), where("uidUsuario", "==", user.uid)); 
                const querySnapshot = await getDocs(q);
                
                // Transformamos los documentos de Firestore a un array de objetos
                const boletosData = querySnapshot.docs.map(doc => ({
                    id: doc.id, 
                    ...doc.data()
                }));
                
                // Ordenamiento por fecha (mas reciente primero)
                boletosData.sort((a, b) => new Date(b.fechaCompra) - new Date(a.fechaCompra));

                setBoletos(boletosData);

            } catch (error) {
                console.error("Error al obtener boletos:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBoletos();
    }, []);

    // Logica para activar la impresion en React
    const handleImprimir = (boleto) => {
        setBoletoImpresion(boleto);
        
        // Le damos 100ms a React para que dibuje el componente oculto antes de llamar a la impresora
        setTimeout(() => {
            window.print();
            setBoletoImpresion(null); // Borramos el estado para que la web vuelva a la normalidad
        }, 100);
    };

    // Funcion de cancelacion del boleto (se borra el boleto y se libera el asiento ocupado)
    const handleCancelar = async (boleto) => {
        // Confirmacion de seguridad
        if (!window.confirm(`¿Está seguro de que quiere cancelar su viaje a ${boleto.destino}?`)) {
            return;
        }

        try {
            setLoading(true);

            // Eliminamos el documento de la coleccion "boletos"
            await deleteDoc(doc(db, "boletos", boleto.id));

            // Liberamos el asiento en la coleccion "config/horariosData"

            // Construimos la clave de la ruta (ej: "Trenque Lauquen-Buenos Aires")
            const claveRuta = `${boleto.origen}-${boleto.destino}`;
            const configRef = doc(db, "config", "horariosData");
            const configSnap = await getDoc(configRef);

            if (configSnap.exists()) {
                const horariosMap = configSnap.data().horarios;
                const viajesParaRuta = horariosMap[claveRuta];
                
                if (viajesParaRuta) {
                    // Buscamos el viaje especifico por su horario
                    const viajeIndex = viajesParaRuta.findIndex(v => v.horario === boleto.horario);
                    
                    if (viajeIndex !== -1) {
                        const viaje = viajesParaRuta[viajeIndex];

                        // Manejo de asientosOcupados como un objeto por fecha
                        if (typeof viaje.asientosOcupados === 'string') viaje.asientosOcupados = {};
                        if (!viaje.asientosOcupados) viaje.asientosOcupados = {};

                        // Obtenemos los ocupados de este dia en particular
                        let ocupadosArray = viaje.asientosOcupados[boleto.dia] 
                            ? viaje.asientosOcupados[boleto.dia].split(',').map(s => parseInt(s.trim()))
                            : [];
                        
                            // Filtramos el array para excluir el asiento que estamos cancelando
                        ocupadosArray = ocupadosArray.filter(a => a !== boleto.asiento);
                        
                        // Si quedan asientos, guardamos el nuevo string actualizado en esa fecha.
                        // Si no quedan asientos ocupados para ese día, borramos la propiedad para no ensuciar la BD.
                        if (ocupadosArray.length > 0) {
                            viaje.asientosOcupados[boleto.dia] = ocupadosArray.join(', ');
                        } else {
                            delete viaje.asientosOcupados[boleto.dia];
                        }
                        
                        horariosMap[claveRuta][viajeIndex] = viaje;

                        // Actualizamos la base de datos
                        await updateDoc(configRef, { horarios: horariosMap });
                    }
                }
            }

            // Actualizamos la interfaz visualmente (sacamos el boleto cancelado de la lista local para no tener que recargar la pagina)
            setBoletos(prevBoletos => prevBoletos.filter(b => b.id !== boleto.id));
            alert("Boleto cancelado exitosamente.");

        } catch (error) {
            console.error("Error al cancelar el boleto:", error);
            alert("Hubo un error al cancelar. Intente nuevamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mis-boletos-container">
            
            {/* Interfaz normal de la pantalla */}
            <h2>Mis Boletos</h2>
            
            <div className="mis-boletos-content">
                {loading ? (
                    <p className="loading-text">Procesando...</p>
                ) : boletos.length > 0 ? (
                    boletos.map(boleto => {
                        const esViajePasado = verificarSiYaPaso(boleto.dia, boleto.horario);

                        return (
                            <div key={boleto.id} className={`boleto-card ${esViajePasado ? 'pasado' : ''}`}>
                                <h3 className="boleto-ruta">{boleto.origen} ➝ {boleto.destino}</h3>
                                
                                <div className="boleto-info">
                                    <p><strong>Fecha:</strong> {boleto.dia}</p>
                                    <p><strong>Hora:</strong> {boleto.horario}</p>
                                </div>
                                
                                <div className="boleto-info">
                                    <p><strong>Asiento:</strong> #{boleto.asiento}</p>
                                    <p><strong>Pasajero:</strong> {boleto.nombrePasajero || 'Tú'}</p>
                                </div>

                                <p className="boleto-codigo">ID: {boleto.id}</p>

                                {/* Renderizado condicional: Si ya paso, mostramos etiqueta, si no, boton cancelar */}
                                {esViajePasado ? (
                                    <div className="etiqueta-finalizado">✅ Viaje Finalizado</div>
                                ) : (
                                    <div className="boleto-acciones">
                                        <button 
                                            className="btn-imprimir"
                                            onClick={() => handleImprimir(boleto)}
                                        >
                                            🖨️ Imprimir
                                        </button>
                                        <button 
                                            className="btn-cancelar"
                                            onClick={() => handleCancelar(boleto)}
                                        >
                                            Cancelar Boleto
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="empty-message">
                        <p>No tienes boletos comprados.</p>
                        <span>(Aquí aparecerán tus reservas confirmadas)</span>
                    </div>
                )}
                <button 
                    className="btn-volver-menu" 
                    onClick={() => navigate('/MenuViaje')}
                >
                    Volver al Menú
                </button>
            </div>
            
            {/* Imagen decorativa de fondo */}
            <div className="imagen">
                <img src={provbagoogleearth} alt="Imagen de Viaje" />
            </div>

            {/* Area de impresion */}
            {boletoImpresion && (
                <div className="print-only">
                    <div className="ticket-impresion">
                        <div className="ticket-impresion-header">
                            <h2>🎟️ Boleto de Viaje</h2>
                            <p className="ticket-impresion-id">ID: {boletoImpresion.id}</p>
                        </div>
                        <div className="ticket-impresion-info-row">
                            <span><strong>Pasajero:</strong></span>
                            <span>{boletoImpresion.nombrePasajero || 'Tú'}</span>
                        </div>
                        <div className="ticket-impresion-info-row">
                            <span><strong>Ruta:</strong></span>
                            <span>{boletoImpresion.origen} ➝ {boletoImpresion.destino}</span>
                        </div>
                        <div className="ticket-impresion-info-row">
                            <span><strong>Fecha:</strong></span>
                            <span>{boletoImpresion.dia}</span>
                        </div>
                        <div className="ticket-impresion-info-row">
                            <span><strong>Hora:</strong></span>
                            <span>{boletoImpresion.horario}</span>
                        </div>
                        <div className="ticket-impresion-info-row">
                            <span><strong>Asiento:</strong></span>
                            <span>#{boletoImpresion.asiento}</span>
                        </div>
                        <div className="ticket-impresion-footer">
                            Este boleto es válido únicamente para la fecha y hora indicadas.
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default MisBoletos;