import React, { useState, useEffect } from 'react';
import { useNavigate, BrowserRouter } from 'react-router-dom';
// Importamos las funciones necesarias de Firestore y Auth
import { db, auth } from '../firebase-config'; 
import { doc, getDoc, getDocs, updateDoc, deleteDoc, arrayUnion, arrayRemove, collection, deleteField } from 'firebase/firestore';
import { updatePassword, onAuthStateChanged, signOut } from 'firebase/auth';
// Importamos estilos
import './PanelAdmin.css';

const PanelAdmin = () => {
    const navigate = useNavigate();

    // Control de UI: Pestaña activa y estado de carga global
    const [activeTab, setActiveTab] = useState('ciudades');
    const [loading, setLoading] = useState(false);

    // Estado para el ID del administrador logueado
    const [adminUid, setAdminUid] = useState(null);

    // Estado para mostrar/ocultar contraseña
    const [showPassword, setShowPassword] = useState(false);

    // Estados para gestion de ciudades
    const [ciudades, setCiudades] = useState([]);
    const [nuevaCiudad, setNuevaCiudad] = useState('');

    // Estados para rutas y horarios
    const [rutas, setRutas] = useState({});
    const [nuevaRutaOrigen, setNuevaRutaOrigen] = useState('');
    const [nuevaRutaDestino, setNuevaRutaDestino] = useState('');

    // Estado para edición de horarios
    const [editingSchedule, setEditingSchedule] = useState(null);

    // Estados para gestión de usuarios
    const [usuarios, setUsuarios] = useState([]);
    const [editingUserId, setEditingUserId] = useState(null);
    const [editFormData, setEditFormData] = useState({});

    // Estados para boletos activos y Filtros
    const [boletos, setBoletos] = useState([]);
    const [filtroOrigen, setFiltroOrigen] = useState('');
    const [filtroDestino, setFiltroDestino] = useState('');
    const [filtroFecha, setFiltroFecha] = useState('');

    // Carga inicial de datos y escucha de autenticacion
    useEffect(() => {
        cargarDatosGenerales();
        cargarUsuarios();
        cargarBoletos(); // Cargamos los boletos al iniciar

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) setAdminUid(user.uid);
        });

        return () => unsubscribe();
    }, []);

    /* Carga la configuracion global (Ciudades y Rutas) desde la coleccion 'config'.
       Usamos 'getDoc' porque sabemos los IDs especificos de los documentos ('ciudades', 'horariosData').
    */
    const cargarDatosGenerales = async () => {
        setLoading(true);
        try {
            const docCiudades = await getDoc(doc(db, "config", "ciudades"));
            if (docCiudades.exists()) {
                const listaCiudades = docCiudades.data().lista || [];
                
                // Ordenamos las ciudades alfabeticamente antes de guardarlas
                listaCiudades.sort((a, b) => a.localeCompare(b));
                
                setCiudades(listaCiudades);
            }

            const docHorarios = await getDoc(doc(db, "config", "horariosData"));
            if (docHorarios.exists()) setRutas(docHorarios.data().horarios || {});
        } catch (error) {
            console.error("Error al cargar datos:", error);
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
            
            // AQUI ORDENAMOS LA LISTA DE USUARIOS POR EMAIL ALFABETICAMENTE
            usersList.sort((a, b) => (a.email || "").localeCompare(b.email || ""));
            
            setUsuarios(usersList);
        } catch (error) { console.error(error); }
    };

    // Cargar lista de boletos activos

    const cargarBoletos = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "boletos"));
            const boletosList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Ordenamos los boletos por fecha y hora de viaje (los más próximos primero)
            boletosList.sort((a, b) => new Date(`${a.dia}T${a.horario}`) - new Date(`${b.dia}T${b.horario}`));
            setBoletos(boletosList);
        } catch (error) {
            console.error("Error al cargar boletos:", error);
        }
    };

    // Cancelar un boleto desde el panel de admin

    const handleCancelarBoletoAdmin = async (boleto) => {
        // Doble confirmacion de seguridad
        if (!window.confirm(`⚠️ ATENCIÓN: ¿Seguro que desea CANCELAR el pasaje de ${boleto.nombrePasajero || 'este usuario'} a ${boleto.destino}?`)) {
            return;
        }
        try {
            setLoading(true);
            // Borramos el comprobante de la coleccion 'boletos'
            await deleteDoc(doc(db, "boletos", boleto.id));
            // Buscamos el viaje en 'horariosData' para liberar el asiento
            const claveRuta = `${boleto.origen}-${boleto.destino}`;
            const configRef = doc(db, "config", "horariosData");
            const configSnap = await getDoc(configRef);

            if (configSnap.exists()) {
                const horariosMap = configSnap.data().horarios;
                const viajesParaRuta = horariosMap[claveRuta];
                if (viajesParaRuta) {
                    const viajeIndex = viajesParaRuta.findIndex(v => v.horario === boleto.horario);
                    if (viajeIndex !== -1) {
                        const viaje = viajesParaRuta[viajeIndex];
                        if (typeof viaje.asientosOcupados === 'string') viaje.asientosOcupados = {};
                        if (!viaje.asientosOcupados) viaje.asientosOcupados = {};
                        // Traemos el array de ocupados de ese dia especifico
                        let ocupadosArray = viaje.asientosOcupados[boleto.dia]
                            ? viaje.asientosOcupados[boleto.dia].split(',').map(s => parseInt(s.trim()))
                            : [];
                        // Sacamos el asiento de la lista
                        ocupadosArray = ocupadosArray.filter(a => a !== boleto.asiento);
                        // Guardamos o limpiamos el campo
                        if (ocupadosArray.length > 0) {
                            viaje.asientosOcupados[boleto.dia] = ocupadosArray.join(', ');
                        } else {
                            delete viaje.asientosOcupados[boleto.dia];
                        }
                        horariosMap[claveRuta][viajeIndex] = viaje;
                        // Mandamos la info actualizada a la BD
                        await updateDoc(configRef, { horarios: horariosMap });
                    }
                }
            }
            // Lo sacamos de la tabla visualmente
            setBoletos(prevBoletos => prevBoletos.filter(b => b.id !== boleto.id));
            alert("✅ Boleto cancelado exitosamente y asiento liberado.");

        } catch (error) {
            console.error("Error al cancelar el boleto:", error);
            alert("Hubo un error al intentar cancelar el boleto.");
        } finally {
            setLoading(false);
        }
    };


    // Logica de filtrado para boletos activos

    const obtenerBoletosFiltrados = () => {
        const ahora = new Date();
        return boletos.filter(boleto => {

            // Descartar boletos de viajes que ya pasaron
            if (!boleto.dia || !boleto.horario) return false;
            const fechaViaje = new Date(`${boleto.dia}T${boleto.horario}`);
            if (fechaViaje < ahora) return false;

            // Aplicar filtros del administrador
            if (filtroOrigen && boleto.origen !== filtroOrigen) return false;
            if (filtroDestino && boleto.destino !== filtroDestino) return false;
            if (filtroFecha && boleto.dia !== filtroFecha) return false;

            return true;
        });
    };
    const boletosActivosFiltrados = obtenerBoletosFiltrados();

    // Logica de horarios

    // Prepara el estado para editar un horario especifico dentro de una ruta
    const iniciarEdicionHorario = (rutaKey, index, horarioData) => {
        setEditingSchedule({ 
             rutaKey, // La clave del mapa (ej: "Trenque Lauquen-Buenos Aires")
             index, // La posición en el array de horarios
             data: { ...horarioData } // Copia de los datos para no mutar estado directamente
            });
    };
    const cancelarEdicionHorario = () => { // Limpiamos el estado de edicion
        setEditingSchedule(null);
    };
    /* Guarda los cambios de un horario.
       Hay un pequeño problema: Firestore no permite actualizar un indice especifico de un array directamente.
       Solucion: Leemos el array, lo modificamos localmente y reescribimos el array completo para esa clave.
    */
    const guardarEdicionHorario = async () => {
        if (!editingSchedule) return;
        const { rutaKey, index, data } = editingSchedule;

        // Validar formato HH:MM
        const regexHorario = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!regexHorario.test(data.horario)) {
            alert("El formato debe ser HH:MM (ejemplo: 08:30)."); return;
        }

        const precioNum = parseFloat(data.precio);
        if (isNaN(precioNum) || precioNum < 0) {
            alert("El precio debe ser un número positivo."); 
            return;
        }

        try {
            // Copia profunda del array de horarios de esa ruta
            const nuevosHorariosRuta = [...rutas[rutaKey]];
            // Actualizamos el objeto en el índice especifico
            nuevosHorariosRuta[index] = {
                ...nuevosHorariosRuta[index], // Mantenemos datos que no se editan (como asientosOcupados)
                horario: data.horario,
                precio: precioNum.toString()
            };

            // Actualizamos en Firestore usando notacion de punto para claves dinamicas
            const docRef = doc(db, "config", "horariosData");
            await updateDoc(docRef, { 
                [`horarios.${rutaKey}`]: nuevosHorariosRuta 
            });

            // Actualizamos el estado local para reflejar cambios sin recargar
            setRutas({ ...rutas, [rutaKey]: nuevosHorariosRuta });
            setEditingSchedule(null);
            alert("Horario actualizado con éxito.");
        } catch (error) { 
            console.error(error); alert("Ocurrió un error al guardar."); 
        }
    };

    const eliminarHorario = async (rutaKey, index) => {
        if (!window.confirm("¿Seguro que desea eliminar este horario?")) return;
        try {
            const nuevosHorariosRuta = [...rutas[rutaKey]];
            nuevosHorariosRuta.splice(index, 1); // Eliminamos del array local
            const docRef = doc(db, "config", "horariosData");
            await updateDoc(docRef, { [`horarios.${rutaKey}`]: nuevosHorariosRuta });
            setRutas({ ...rutas, [rutaKey]: nuevosHorariosRuta });
        } catch (error) { console.error(error); }
    };

    const agregarRuta = async () => {
        if (!nuevaRutaOrigen || !nuevaRutaDestino) { alert("Seleccione origen y destino."); return; }
        if (nuevaRutaOrigen === nuevaRutaDestino) { alert("Origen y destino no pueden ser iguales."); return; }

        // Creamos la clave compuesta que usa el sistema
        const nombreRuta = `${nuevaRutaOrigen}-${nuevaRutaDestino}`;
        try {
            const docRef = doc(db, "config", "horariosData");
            const horariosExistentes = rutas[nombreRuta] || [];
            // Agregamos un horario base al array
            const nuevoArray = [...horariosExistentes, { horario: "08:00", precio: "5000", asientosOcupados: {} }];
            await updateDoc(docRef, { [`horarios.${nombreRuta}`]: nuevoArray });
            cargarDatosGenerales();
        } catch (error) { console.error(error); }
    };

    // Logica de usuarios
    const handleEliminarUsuario = async (id) => {
        // Elimina permanentemente el documento de la coleccion 'Usuarios'
        if (!window.confirm("¿Seguro que desea eliminar este usuario?")) return;
        try {
            await deleteDoc(doc(db, "Usuarios", id));
            setUsuarios(usuarios.filter(u => u.id !== id)); // Actualiza UI
        } catch (error) { console.error(error); }
    };

    const iniciarEdicionUsuario = (usuario) => {
        setEditingUserId(usuario.id);
        setEditFormData({ 
            nombre: usuario.nombre || '', 
            esAdmin: usuario.esAdmin || false, 
            nuevaContrasena: '' 
        });
        setShowPassword(false);
    };

    const guardarUsuarioEdit = async (id) => {
        try {
            // Cambio de contraseña propia
            if (id === auth.currentUser?.uid && editFormData.nuevaContrasena) {
                if (editFormData.nuevaContrasena.length < 6) { 
                    alert("La contraseña debe tener al menos 6 caracteres."); 
                    return; 
                }
                try {
                    await updatePassword(auth.currentUser, editFormData.nuevaContrasena);
                } catch (error) { 
                    alert("Error de seguridad: " + error.message); 
                    return; 
                }
            }

            const userRef = doc(db, "Usuarios", id);
            // updateDoc solo modifica los campos enviados, no sobrescribe todo el documento
            await updateDoc(userRef, { 
                nombre: editFormData.nombre, 
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
        if(!nuevaCiudad.trim()) return;
        const ciudadNormalizada = nuevaCiudad.trim().toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
        if (ciudades.some(c => c.toLowerCase() === ciudadNormalizada.toLowerCase())) { 
            alert("La ciudad ya existe."); 
            return; 
        }
        try {
            await updateDoc(doc(db, "config", "ciudades"), { lista: arrayUnion(ciudadNormalizada) });
            setNuevaCiudad(''); cargarDatosGenerales();
        } catch(e) { console.error(e); }
    };

    const eliminarCiudad = async (c) => {
        if(!window.confirm(`¿Seguro que desea eliminar la ciudad ${c} y TODAS sus rutas asociadas?`)) return;
        try {
            await updateDoc(doc(db, "config", "ciudades"), { lista: arrayRemove(c) });

            // Borrado en cascada de rutas
            const rutasAEliminar = Object.keys(rutas).filter(rutaKey => {
                const [origen, destino] = rutaKey.split('-');
                return origen === c || destino === c;
            });

            if (rutasAEliminar.length > 0) {
                const docRef = doc(db, "config", "horariosData");
                const updates = {};
                rutasAEliminar.forEach(rutaKey => { 
                    updates[`horarios.${rutaKey}`] = deleteField(); 
                });
                await updateDoc(docRef, updates);
            }
            cargarDatosGenerales();
        } catch(e) { console.error(e); }
    };

    // Cierre de sesion
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
                <button className={activeTab === 'boletos' ? 'active' : ''} onClick={() => setActiveTab('boletos')}>Boletos Activos</button>
            </div>

            <div className="admin-content">
                {loading && <p className="text-center">Cargando datos...</p>}

                {/* Pestaña Ciudades */}
                {!loading && activeTab === 'ciudades' && (
                    <div className="tab-section">
                        <h3>Gestión de Ciudades</h3>
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

                {/* Pestaña Horarios */}
                {!loading && activeTab === 'horarios' && (
                    <div className="tab-section">
                        <h3>Gestión de Rutas</h3>
                        <div className="add-form">
                            <select value={nuevaRutaOrigen} onChange={(e) => setNuevaRutaOrigen(e.target.value)}>
                                <option value="">Origen...</option>
                                {ciudades.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <select value={nuevaRutaDestino} onChange={(e) => setNuevaRutaDestino(e.target.value)}>
                                <option value="">Destino...</option>
                                {ciudades.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <button onClick={agregarRuta} className="btn-add">Crear Ruta</button>
                        </div>
                        <div className="rutas-list">
                            {/* Ordenamos las rutas (Object.keys) alfabeticamente por origen/destino antes del map */}
                            {Object.keys(rutas).sort((a, b) => a.localeCompare(b)).map(rutaKey => (
                                <details key={rutaKey} className="ruta-item" open>
                                    <summary>{rutaKey} ({rutas[rutaKey].length} viajes)</summary>
                                    <div className="ruta-detalles">
                                        {rutas[rutaKey].map((h, i) => (
                                            <div key={i} className="horario-mini-card">
                                                {editingSchedule && editingSchedule.rutaKey === rutaKey && editingSchedule.index === i ? (
                                                    <div className="edit-inline-form">
                                                        <input type="text" value={editingSchedule.data.horario} onChange={(e) => setEditingSchedule({...editingSchedule, data: {...editingSchedule.data, horario: e.target.value}})} />
                                                        <input type="text" value={editingSchedule.data.precio} onChange={(e) => setEditingSchedule({...editingSchedule, data: {...editingSchedule.data, precio: e.target.value}})} />
                                                        <div className="edit-buttons">
                                                            <button onClick={guardarEdicionHorario} className="btn-save-mini">💾</button>
                                                            <button onClick={cancelarEdicionHorario} className="btn-cancel-mini">✖</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div><span className="info-pill">⏰ {h.horario}</span><span className="info-pill price">💲 {h.precio}</span></div>
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

                {/* Pestaña Usuarios */}
                {!loading && activeTab === 'usuarios' && (
                    <div className="tab-section">
                        <h3>Gestión de Usuarios</h3>
                        <div className="table-responsive">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Email</th>
                                        <th>Nombre</th>
                                        <th className="text-center">Admin</th>
                                        <th className="text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {usuarios.map(user => {
                                        const esMiUsuario = adminUid && (adminUid === user.id || adminUid === user.uid);
                                        return (
                                            <tr key={user.id}>
                                                <td>{user.email}</td>
                                                {editingUserId === user.id ? (
                                                    <>
                                                        <td>
                                                            <label className="edit-label">
                                                                <span>Nombre:</span>
                                                                <input type="text" value={editFormData.nombre || ''} onChange={(e) => setEditFormData({...editFormData, nombre: e.target.value})} />
                                                            </label>
                                                        </td>
                                                        <td className="text-center">
                                                            <label className="edit-label-center">
                                                                <span>¿Es Admin?</span>
                                                                <input type="checkbox" checked={editFormData.esAdmin || false} onChange={(e) => setEditFormData({...editFormData, esAdmin: e.target.checked})} />
                                                            </label>
                                                        </td>
                                                        <td className="actions-cell centered-wrap">
                                                            {esMiUsuario && (
                                                                <label className="edit-label-full">
                                                                    <span>Contraseña:</span>
                                                                    <div className="password-wrapper">
                                                                        <input
                                                                            type={showPassword ? "text" : "password"}
                                                                            placeholder="Nueva contraseña..."
                                                                            value={editFormData.nuevaContrasena || ''}
                                                                            onChange={(e) => setEditFormData({...editFormData, nuevaContrasena: e.target.value})}
                                                                            className="edit-password-input"
                                                                        />
                                                                        <button type="button" className="btn-eye" onClick={() => setShowPassword(!showPassword)} title="Mostrar/Ocultar">
                                                                            {showPassword ? (
                                                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                                                                            ) : (
                                                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                                                            )}
                                                                        </button>
                                                                    </div>
                                                                </label>
                                                            )}
                                                            <div className="edit-actions-centered">
                                                                <button onClick={() => guardarUsuarioEdit(user.id)} className="btn-save">Guardar</button>
                                                                <button onClick={() => {setEditingUserId(null); setEditFormData({}); setShowPassword(false);}} className="btn-cancel">Cancelar</button>
                                                            </div>
                                                        </td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td>{user.nombre}</td>
                                                        <td className="text-center">{user.esAdmin ? '✅' : '❌'}</td>
                                                        <td className="actions-cell centered">
                                                            <button onClick={() => iniciarEdicionUsuario(user)} className="btn-edit">Editar</button>
                                                            <button onClick={() => handleEliminarUsuario(user.id)} className="btn-delete">Eliminar</button>
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Pestaña boletos activos */}
                {!loading && activeTab === 'boletos' && (
                    <div className="tab-section">
                        <h3>Pasajes Pagados Activos</h3>

                        {/* Barra de Filtros */}
                        <div className="filtros-bar">
                            <select value={filtroOrigen} onChange={(e) => setFiltroOrigen(e.target.value)}>
                                <option value="">Todos los Orígenes</option>
                                {ciudades.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <select value={filtroDestino} onChange={(e) => setFiltroDestino(e.target.value)}>
                                <option value="">Todos los Destinos</option>
                                {ciudades.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <input
                                type="date"
                                value={filtroFecha}
                                onChange={(e) => setFiltroFecha(e.target.value)}
                                title="Filtrar por fecha"
                            />
                            <button
                                className="btn-limpiar-filtros"
                                onClick={() => { setFiltroOrigen(''); setFiltroDestino(''); setFiltroFecha(''); }} >Limpiar</button>
                        </div>

                        {/* Tabla de Resultados */}
                        <div className="table-responsive">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>ID Boleto</th>
                                        <th>Pasajero</th>
                                        <th>Ruta</th>
                                        <th>Fecha y Hora</th>
                                        <th className="text-center">Asiento</th>
                                        <th className="text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {boletosActivosFiltrados.length > 0 ? (
                                        boletosActivosFiltrados.map(boleto => (
                                            <tr key={boleto.id}>
                                                <td className="td-monospace">{boleto.id}</td>
                                                <td><strong>{boleto.nombrePasajero || 'Sin Nombre'}</strong></td>
                                                <td>{boleto.origen} ➝ {boleto.destino}</td>
                                                <td>{boleto.dia} - {boleto.horario} hs</td>
                                                <td className="text-center-bold">#{boleto.asiento}</td>
                                                <td className="text-center">
                                                    <button
                                                        className="btn-delete-mini"
                                                        onClick={() => handleCancelarBoletoAdmin(boleto)} >Cancelar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="td-empty-message">
                                                No se encontraron pasajes activos con los filtros seleccionados.
                                            </td>
                                        </tr>
                                    )}
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