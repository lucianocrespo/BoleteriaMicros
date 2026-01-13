import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from './firebase-config'; // Importamos la instancia de autenticacion y la base de datos
import { createUserWithEmailAndPassword } from 'firebase/auth'; // Importamos la funcion para crear usuarios en el sistema de autenticacion
import { doc, setDoc } from 'firebase/firestore'; // Funciones para escribir en Firestore
// Importamos estilos e imagen
import './Registro.css';
import microruta from './assets/Imagenes/microruta.png';

const Registro = () => {
    // Estados para los campos del formulario
    const [nombre, setNombre] = useState('');
    const [mail, setMail] = useState('');
    const [usuario, setUsuario] = useState('');
    const [contrasena, setContrasena] = useState('');
    // Estados de control de interfaz
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegistrarse = async (e) => {
        e.preventDefault();
        setError('');
        
        // Validacion simple de campos vacios
        if (!nombre || !mail || !usuario || !contrasena) {
            setError('⚠️ Por favor, complete todos los campos.');
            return;
        }

        setLoading(true); // Bloqueamos el boton para evitar multiples envios

        try {
            // Crear la credencial de acceso (Email/Password) en Firebase Auth
            // (Esto crea el usuario seguro en el sistema, pero NO guarda datos extra como el nombre)
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                mail, // Firebase Auth siempre usa el email como identificador
                contrasena
            );

            const user = userCredential.user;
            
            // PASO 2: Guardar el perfil completo en Firestore (Colección "Usuarios")
            // Usamos el user.uid como ID del documento para referenciarlo

            // Usamos 'setDoc' en lugar de 'addDoc' para definir nosotros mismos el ID del documento.
            // Usamos 'user.uid' (generado anteriormente) como la clave del documento.

            await setDoc(doc(db, "Usuarios", user.uid), {
                uid: user.uid,
                nombre: nombre,
                email: mail,
                usuario: usuario, // Guardamos el nombre de usuario personalizado
                esAdmin: false,   // Por defecto, los nuevos usuarios no son administradores
                fechaRegistro: new Date()
            });

            console.log("Registro exitoso. UID:", user.uid);
            alert('Registro exitoso! Ya puedes iniciar sesión.');
            
            // Si el registro fue exitoso, navegamos al menu de usuario
            navigate('/MenuViaje'); 

        } catch (firebaseError) {
            console.error("Error de registro de Firebase:", firebaseError.code, firebaseError.message);
            
            let errorMessage = 'Error desconocido al registrar. Intente más tarde.';
            
            // Traduccion de errores comunes de Firebase a mensajes amigables para el usuario
            if (firebaseError.code === 'auth/weak-password') {
                errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
            } else if (firebaseError.code === 'auth/email-already-in-use') {
                errorMessage = 'Este correo electrónico ya está registrado.';
            } else if (firebaseError.code === 'auth/invalid-email') {
                errorMessage = 'El formato del correo electrónico es inválido.';
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false); // Desbloqueamos el boton
        }
    };

    return (
        <div className="registro-container">
            <div className="registro-form-card">
                <h2>Registrarse</h2>
                
                {error && <p className="error-message">{error}</p>}
                
                <form className="registro-form" onSubmit={handleRegistrarse}>
                    <label>
                        Nombre:
                        <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder=" Ingrese su nombre completo" />
                    </label>
                    <label>
                        Mail:
                        <input type="email" value={mail} onChange={e => setMail(e.target.value)} placeholder=" Ingrese su Mail" />
                    </label>
                    <label>
                        Usuario:
                        <input type="text" value={usuario} onChange={e => setUsuario(e.target.value)} placeholder=" Ingrese un usuario" />
                    </label>
                    <label>
                        Contraseña:
                        <input type="password" value={contrasena} onChange={e => setContrasena(e.target.value)} placeholder=" Ingrese una contraseña (mínimo 6 caracteres)" />
                    </label>
                    
                    <div className="registro-actions">
                        <button type="submit" className="btn-registrar" disabled={loading}>
                            {loading ? 'Registrando...' : 'Registrarse'}
                        </button>
                        <button type="button" className="btn-volver" onClick={() => navigate(-1)} disabled={loading}>
                            Volver
                        </button>
                    </div>
                </form>
            </div>
            {/* Imagen decorativa de fondo */}
            <div className="imagen">
                <img src={microruta} alt="Imagen de Micro" />
            </div>
        </div>
    );
};

export default Registro;