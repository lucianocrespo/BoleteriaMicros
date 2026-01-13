import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from './firebase-config';
// Importamos herramientas avanzadas de Firestore:
// - arrayUnion/arrayRemove: Para agregar/quitar elementos de arrays (como ciudades) sin leer todo el documento.
// - collection: Para referencias a colecciones completas (necesario para listar usuarios).
import { doc, getDoc, getDocs, updateDoc, deleteDoc, arrayUnion, arrayRemove, collection } from 'firebase/firestore';
// Importamos estilos
import './PanelAdmin.css';

const PanelAdmin = () => {
    const navigate = useNavigate();

    // Control de UI: Qué pestaña está activa y estado de carga global
    const [activeTab, setActiveTab] = useState('ciudades'); 
    const [loading, setLoading] = useState(false);

    // Estados para gestion de ciudades
    const [ciudades, setCiudades] = useState([]);
    const [nuevaCiudad, setNuevaCiudad] = useState('');

    // Estados para gestion de rutas y horarios
    const [rutas, setRutas] = useState({});
    const [nuevaRutaOrigen, setNuevaRutaOrigen] = useState('');
    const [nuevaRutaDestino, setNuevaRutaDestino] = useState('');
    
    // Estado temporal para manejar la edicion de un horario especifico sin abrir otra pagina
    const [editingSchedule, setEditingSchedule] = useState(null);

    // Estados para gestion de usuarios
    const [usuarios, setUsuarios] = useState([]);
    const [editingUserId, setEditingUserId] = useState(null); // ID del usuario en edicion
    const [editFormData, setEditFormData] = useState({}); // Datos del formulario de edicion

    // Carga inicial de todos los datos necesarios al montar el componente
    useEffect(() => {
        cargarDatosGenerales();
        cargarUsuarios();
    }, []);


    /* Carga la configuracion global (Ciudades y Rutas) desde la coleccion 'config'.
       Usamos 'getDoc' porque sabemos los IDs especificos de los documentos ('ciudades', 'horariosData').
     */
    const cargarDatosGenerales = async () => {
        setLoading(true);
        try {
            const docCiudades = await getDoc(doc(db, "config", "ciudades"));
            if (docCiudades.exists()) setCiudades(docCiudades.data().lista || []);

            const docHorarios = await getDoc(doc(db, "config", "horariosData"));
            if (docHorarios.exists()) setRutas(docHorarios.data().horarios || {});
        } catch (error) {
            console.error("Error cargando configuración:", error);
        } finally {
            setLoading(false);
        }
    };

    /* Carga la lista de usuarios.
       Usamos 'getDocs' + 'collection' para traer todos los documentos de la coleccion 'Usuarios'.
     */
    const cargarUsuarios = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "Usuarios"));
            const usersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUsuarios(usersList);
        } catch (error) { console.error(error); }
    };

    // Logica de horarios

    // Prepara el estado para editar un horario especifico dentro de una ruta
    const iniciarEdicionHorario = (rutaKey, index, horarioData) => {
        setEditingSchedule({
            rutaKey, // La clave del mapa (ej: "Trenque Lauquen-Buenos Aires")
            index, // La posición en el array de horarios
            data: { ...horarioData } // Copia de los datos para no mutar estado directamente
        });
    };

    const cancelarEdicionHorario = () => {
        setEditingSchedule(null);
    };

    /* Guarda los cambios de un horario.
       Hay un pequeño problema: Firestore no permite actualizar un indice especifico de un array directamente.
       Solucion: Leemos el array, lo modificamos localmente y reescribimos el array completo para esa clave.
     */
    const guardarEdicionHorario = async () => {
        if (!editingSchedule) return;
        const { rutaKey, index, data } = editingSchedule;

        try {
            // Copia profunda del array de horarios de esa ruta
            const nuevosHorariosRuta = [...rutas[rutaKey]];
            // Actualizamos el objeto en el índice específico
            nuevosHorariosRuta[index] = { 
                ...nuevosHorariosRuta[index], // Mantenemos datos que no se editan (como asientosOcupados)
                horario: data.horario,
                precio: data.precio
            };

            // Actualizamos en Firestore usando notacion de punto para claves dinamicas
            const docRef = doc(db, "config", "horariosData");
            await updateDoc(docRef, {
                [`horarios.${rutaKey}`]: nuevosHorariosRuta
            });

            // Actualizamos el estado local para reflejar cambios sin recargar
            setRutas({ ...rutas, [rutaKey]: nuevosHorariosRuta });
            setEditingSchedule(null);
            alert("Horario actualizado correctamente.");

        } catch (error) {
            console.error("Error actualizando horario:", error);
            alert("Error al guardar cambios.");
        }
    };

    const eliminarHorario = async (rutaKey, index) => {
        if (!window.confirm("¿Seguro que quieres eliminar este horario?")) return;

        try {
            const nuevosHorariosRuta = [...rutas[rutaKey]];
            nuevosHorariosRuta.splice(index, 1); // Eliminamos del array local

            const docRef = doc(db, "config", "horariosData");
            await updateDoc(docRef, {
                [`horarios.${rutaKey}`]: nuevosHorariosRuta
            });

            setRutas({ ...rutas, [rutaKey]: nuevosHorariosRuta });

        } catch (error) {
            console.error("Error eliminando horario:", error);
        }
    };

    const agregarRuta = async () => {
        if (!nuevaRutaOrigen || !nuevaRutaDestino) return;

        // Creamos la clave compuesta que usa el sistema
        const nombreRuta = `${nuevaRutaOrigen}-${nuevaRutaDestino}`;
        try {
            const docRef = doc(db, "config", "horariosData");
            const horariosExistentes = rutas[nombreRuta] || [];
            // Agregamos un horario base al array
            const nuevoArray = [...horariosExistentes, { horario: "08:00", precio: "5000", asientosOcupados: "null" }];

            await updateDoc(docRef, {
                [`horarios.${nombreRuta}`]: nuevoArray
            });
            alert(`Ruta/Horario agregado en ${nombreRuta}.`);
            cargarDatosGenerales();
        } catch (error) { console.error(error); }
    };

    // Logica de usuarios
    
    const handleEliminarUsuario = async (id) => {
        // Elimina permanentemente el documento de la coleccion 'Usuarios'
        if (!window.confirm("¿Seguro que quieres eliminar este usuario?")) return;
        try {
            await deleteDoc(doc(db, "Usuarios", id));
            setUsuarios(usuarios.filter(u => u.id !== id)); // Actualiza UI
            alert("Usuario eliminado correctamente.");
        } catch (error) { console.error(error); }
    };

    const iniciarEdicionUsuario = (usuario) => {
        setEditingUserId(usuario.id);
        setEditFormData({
            nombre: usuario.nombre || '',
            usuario: usuario.usuario || '',
            esAdmin: usuario.esAdmin || false
        });
    };

    const guardarUsuarioEdit = async (id) => {
        try {
            const userRef = doc(db, "Usuarios", id);
            // updateDoc solo modifica los campos enviados, no sobrescribe todo el documento
            await updateDoc(userRef, {
                nombre: editFormData.nombre,
                usuario: editFormData.usuario,
                esAdmin: editFormData.esAdmin
            });
            setUsuarios(usuarios.map(u => (u.id === id ? { ...u, ...editFormData } : u)));
            setEditingUserId(null);
            alert("Usuario actualizado.");
        } catch(e) { console.error(e); }
    };

    // Logica de ciudades

    // Usamos arrayUnion para agregar sin duplicados y arrayRemove para borrar
    const agregarCiudad = async () => {
        if(!nuevaCiudad) return;
        try {
            await updateDoc(doc(db, "config", "ciudades"), { lista: arrayUnion(nuevaCiudad) });
            setNuevaCiudad(''); cargarDatosGenerales();
        } catch(e) { console.error(e); }
    };
    const eliminarCiudad = async (c) => {
        if(!window.confirm("¿Eliminar?")) return;
        try {
            await updateDoc(doc(db, "config", "ciudades"), { lista: arrayRemove(c) });
            cargarDatosGenerales();
        } catch(e) { console.error(e); }
    };

    const cerrarSesion = () => { auth.signOut(); navigate('/'); };

    return (
        <div className="admin-container">
            <header className="admin-header">
                <h1>Panel de Administrador</h1>
                <button onClick={cerrarSesion} className="btn-logout">Cerrar Sesión</button>
            </header>

            <div className="admin-tabs">
                <button className={activeTab === 'ciudades' ? 'active' : ''} onClick={() => setActiveTab('ciudades')}>Ciudades</button>
                <button className={activeTab === 'horarios' ? 'active' : ''} onClick={() => setActiveTab('horarios')}>Horarios y Rutas</button>
                <button className={activeTab === 'usuarios' ? 'active' : ''} onClick={() => setActiveTab('usuarios')}>Usuarios</button>
            </div>

            <div className="admin-content">
                {loading && <p>Cargando datos...</p>}

                {/* --- PESTAÑA CIUDADES --- */}
                {!loading && activeTab === 'ciudades' && (
                    <div className="tab-section">
                        <h3>Gestionar Ciudades</h3>
                        <div className="add-form">
                            <input type="text" value={nuevaCiudad} onChange={(e) => setNuevaCiudad(e.target.value)} placeholder="Nueva ciudad..." />
                            <button onClick={agregarCiudad} className="btn-add">Agregar</button>
                        </div>
                        <ul className="admin-list">
                            {ciudades.map((c, index) => (
                                <li key={index}>{c} <button onClick={() => eliminarCiudad(c)} className="btn-delete">Eliminar</button></li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* --- PESTAÑA HORARIOS --- */}
                {!loading && activeTab === 'horarios' && (
                    <div className="tab-section">
                        <h3>Gestionar Rutas</h3>
                        <div className="add-form">
                            <input type="text" value={nuevaRutaOrigen} onChange={(e) => setNuevaRutaOrigen(e.target.value)} placeholder="Origen" />
                            <input type="text" value={nuevaRutaDestino} onChange={(e) => setNuevaRutaDestino(e.target.value)} placeholder="Destino" />
                            <button onClick={agregarRuta} className="btn-add">Crear Ruta / Agregar Horario</button>
                        </div>
                        <div className="rutas-list">
                            {Object.keys(rutas).map(rutaKey => (
                                <details key={rutaKey} className="ruta-item" open>
                                    <summary><strong>{rutaKey}</strong> ({rutas[rutaKey].length} viajes)</summary>
                                    <div className="ruta-detalles">
                                        {rutas[rutaKey].map((h, i) => (
                                            <div key={i} className="horario-mini-card">
                                                {editingSchedule && editingSchedule.rutaKey === rutaKey && editingSchedule.index === i ? (
                                                    <div className="edit-inline-form">
                                                        <label>Hora:</label>
                                                        <input 
                                                            type="text" 
                                                            value={editingSchedule.data.horario} 
                                                            onChange={(e) => setEditingSchedule({...editingSchedule, data: {...editingSchedule.data, horario: e.target.value}})}
                                                        />
                                                        <label>Precio:</label>
                                                        <input 
                                                            type="text" 
                                                            value={editingSchedule.data.precio} 
                                                            onChange={(e) => setEditingSchedule({...editingSchedule, data: {...editingSchedule.data, precio: e.target.value}})}
                                                        />
                                                        <div className="edit-buttons">
                                                            <button onClick={guardarEdicionHorario} className="btn-save-mini">💾</button>
                                                            <button onClick={cancelarEdicionHorario} className="btn-cancel-mini">✖</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <span className="info-pill">⏰ {h.horario}</span>
                                                        <span className="info-pill price">💲 {h.precio || 'N/A'}</span>
                                                        <div className="card-actions">
                                                            <button onClick={() => iniciarEdicionHorario(rutaKey, i, h)} className="btn-edit-mini">✏️</button>
                                                            <button onClick={() => eliminarHorario(rutaKey, i)} className="btn-delete-mini">🗑️</button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </details>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- PESTAÑA USUARIOS --- */}
                {!loading && activeTab === 'usuarios' && (
                    <div className="tab-section">
                        <h3>Gestión de Usuarios</h3>
                        <div className="table-responsive">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Email</th>
                                        <th>Nombre</th>
                                        <th>Usuario</th>
                                        <th>Admin</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {usuarios.map(user => (
                                        <tr key={user.id}>
                                            <td>{user.email}</td>
                                            {editingUserId === user.id ? (
                                                <>
                                                    <td><input value={editFormData.nombre || ''} onChange={(e) => setEditFormData({...editFormData, nombre: e.target.value})} /></td>
                                                    <td><input value={editFormData.usuario || ''} onChange={(e) => setEditFormData({...editFormData, usuario: e.target.value})} /></td>
                                                    <td><input type="checkbox" checked={editFormData.esAdmin || false} onChange={(e) => setEditFormData({...editFormData, esAdmin: e.target.checked})} /></td>
                                                    <td className="actions-cell">
                                                        <button onClick={() => guardarUsuarioEdit(user.id)} className="btn-save">Guardar</button>
                                                        <button onClick={() => {setEditingUserId(null); setEditFormData({});}} className="btn-cancel">Cancelar</button>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td>{user.nombre}</td>
                                                    <td>{user.usuario}</td>
                                                    <td>{user.esAdmin ? '✅' : '❌'}</td>
                                                    <td className="actions-cell">
                                                        <button onClick={() => iniciarEdicionUsuario(user)} className="btn-edit">Editar</button>
                                                        <button onClick={() => handleEliminarUsuario(user.id)} className="btn-delete">Eliminar</button>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PanelAdmin;