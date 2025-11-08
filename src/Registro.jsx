import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from './firebase-config'; 
import { createUserWithEmailAndPassword } from 'firebase/auth'; // Función para crear la credencial
import { doc, setDoc } from 'firebase/firestore'; // Funciones para Firestore
import './Registro.css';

const Registro = () => {
    const [nombre, setNombre] = useState('');
    const [mail, setMail] = useState(''); // Corregido: setMail en lugar de seteMail
    const [usuario, setUsuario] = useState('');
    const [contrasena, setContrasena] = useState('');
    const [error, setError] = useState(''); // Estado para manejar errores
    const [loading, setLoading] = useState(false); // Estado para la carga
    const navigate = useNavigate();

    const handleRegistrarse = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!nombre || !mail || !usuario || !contrasena) {
            setError('Por favor, complete todos los campos.');
            return;
        }

        setLoading(true);

        try {
            // PASO 1: Crear el usuario en Firebase Authentication (Email y Contraseña)
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                mail, // Firebase Auth siempre usa el email como identificador
                contrasena
            );

            const user = userCredential.user;
            
            // PASO 2: Guardar los datos adicionales en Firestore (Colección "Usuarios")
            // Usamos el user.uid como ID del documento para referenciarlo
            await setDoc(doc(db, "Usuarios", user.uid), {
                uid: user.uid,
                nombre: nombre,
                email: mail,
                usuario: usuario, // Nombre de usuario que el cliente desea
                fechaRegistro: new Date()
            });

            console.log("Registro exitoso. UID:", user.uid);
            alert('Registro exitoso! Ya puedes iniciar sesión.');
            
            // Si el registro fue exitoso, navegamos al menú o a la pantalla de login
            navigate('/MenuViaje'); 
            // Si deseas que inicie sesión primero: navigate('/login');

        } catch (firebaseError) {
            console.error("Error de registro de Firebase:", firebaseError.code, firebaseError.message);
            
            let errorMessage = 'Error desconocido al registrar. Intente más tarde.';
            
            if (firebaseError.code === 'auth/weak-password') {
                errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
            } else if (firebaseError.code === 'auth/email-already-in-use') {
                errorMessage = 'Este correo electrónico ya está registrado.';
            } else if (firebaseError.code === 'auth/invalid-email') {
                errorMessage = 'El formato del correo electrónico es inválido.';
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
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
        </div>
    );
};

export default Registro;