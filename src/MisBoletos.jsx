import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from './firebase-config';
// A diferencia de los imports de las demas pantallas, a esta se le agrega deleteDoc y updateDoc para poder modificar la base de datos
import { collection, query, where, getDocs, deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
// Importacion de estilos e imagen
import './MisBoletos.css';
import provbagoogleearth from './assets/Imagenes/provbagoogleearth.png'; 

const MisBoletos = () => {
    // Estados para almacenar la lista de boletos y el estado de carga
    const [boletos, setBoletos] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Funcion para obtener los boletos, se ejecuta al montar el componente para traer los boletos del usuario actual
    useEffect(() => {
        const fetchBoletos = async () => {
            setLoading(true);
            try {
                const user = auth.currentUser; // Verificamos que haya un usuario autenticado
                if (!user) {
                    console.log("No hay usuario logueado");
                    setLoading(false);
                    return;
                }

                // Creamos la consulta a la coleccion "boletos"
                const q = query(collection(db, "boletos"), where("uidUsuario", "==", user.uid)); // Filtramos por "uidUsuario" para traer solo los boletos del usuario actual
                const querySnapshot = await getDocs(q);
                
                // Transformamos los documentos de Firestore a un array de objetos
                const boletosData = querySnapshot.docs.map(doc => ({
                    id: doc.id, // Guardamos el ID del documento para poder borrarlo luego
                    ...doc.data()
                }));
                
                setBoletos(boletosData);

            } catch (error) {
                console.error("Error al obtener boletos:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBoletos();
    }, []);

    // FUNCION DE CANCELACION DE BOLETO (se borra el boleto y se libera el asiento ocupado)
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

                        // Convertimos el string de ocupados a array para manipularlo
                        let ocupadosArray = viaje.asientosOcupados 
                            ? viaje.asientosOcupados.split(',').map(s => parseInt(s.trim()))
                            : [];
                        
                        // Filtramos el array para excluir el asiento que estamos cancelando
                        ocupadosArray = ocupadosArray.filter(a => a !== boleto.asiento);
                        
                        // Guardamos el nuevo string actualizado
                        viaje.asientosOcupados = ocupadosArray.length > 0 ? ocupadosArray.join(', ') : "null";
                        horariosMap[claveRuta][viajeIndex] = viaje;

                        // Actualizamos la base de datos
                        await updateDoc(configRef, { horarios: horariosMap });
                        console.log("Asiento liberado correctamente.");
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
            <h2>Mis Boletos</h2>
            
            <div className="mis-boletos-content">
                {loading ? (
                    <p className="loading-text">Procesando...</p>
                ) : boletos.length > 0 ? (
                    boletos.map(boleto => (
                        <div key={boleto.id} className="boleto-card">
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

                            {/* Boton para cancelar el boleto */}
                            <button 
                                className="btn-cancelar"
                                onClick={() => handleCancelar(boleto)}
                            >
                                Cancelar Boleto
                            </button>
                        </div>
                    ))
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

        </div>
    );
};

export default MisBoletos;