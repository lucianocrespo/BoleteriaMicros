import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Importamos 'auth' para verificar credenciales y 'db' para leer el rol del usuario desde Firestore
import { auth, db } from './firebase-config'; 
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
// Importamos estilos e imagen
import './Login.css';
import microruta from './assets/Imagenes/microruta.png';

const Login = () => {
    // Estados para el formulario y control de interfaz
    const [email, setEmail] = useState('');
    const [contrasena, setContrasena] = useState('');
    const [error, setError] = useState(''); // Para mostrar mensajes de fallo al usuario
    const [loading, setLoading] = useState(false); // Bloquea el botón mientras se procesa la solicitud
    const navigate = useNavigate();

    const handleRegistrarse = (e) => {
        e.preventDefault();
        navigate('/Registro');
    };

    // Logica para recuperar contraseña
    const handleRecuperarPassword = async () => {
        if (!email) {
            setError('⚠️ Por favor, ingrese su email arriba para recuperar la contraseña.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await sendPasswordResetEmail(auth, email);
            alert('Se ha enviado un correo para restablecer tu contraseña. Revisa tu bandeja de entrada o carpeta de spam.');
        } catch (firebaseError) {
            console.error("Error recuperando contraseña:", firebaseError.message);
            if (firebaseError.code === 'auth/user-not-found') {
                setError('No hay ningún usuario registrado con ese email.');
            } else if (firebaseError.code === 'auth/invalid-email') {
                setError('El formato del correo electrónico es inválido.');
            } else {
                setError('Error al intentar recuperar la contraseña. Intente más tarde.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Maneja el inicio de sesion
    /* Flujo:
        .Valida campos vacios.
        . Autentica con Firebase Auth (Email/Pass).
        . Si es exitoso, busca el documento del usuario en Firestore.
        . Verifica si el campo 'esAdmin' es true para redirigir al panel correspondiente. 
    */
    const handleEntrar = async (e) => {
        e.preventDefault();
        setError(''); // Limpiamos errores anteriores

        // Validacion basica de frontend
        if (!email || !contrasena) {
            setError('⚠️ Por favor, complete todos los campos.');
            return;
        }

        setLoading(true); // Activa estado de carga

        try {
            // Intentamos iniciar sesion (Esto valida si el email/pass son reales)
            const userCredential = await signInWithEmailAndPassword(auth, email, contrasena);
            const user = userCredential.user;

            // Obtenemos los datos adicionales del perfil desde Firestore usando el UID
            const docRef = doc(db, "Usuarios", user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const userData = docSnap.data();
                
                // Logica de Redireccion segun el rol
                if (userData.esAdmin === true) {
                    console.log("Acceso concedido: Administrador");
                    navigate('/PanelAdmin'); // Redirige al panel de admin
                } else {
                    console.log("Acceso concedido: Usuario");
                    navigate('/MenuViaje'); // Redirige a la app normal
                }
            } else {
                // Si no existe el perfil en Firestore (raro, pero posible), ir al menu normal
                console.warn("Perfil no encontrado en base de datos, redirigiendo a inicio.");
                navigate('/MenuViaje');
            }

        } catch (firebaseError) {
            // Manejo de errores especificos para dar feedback util al usuario
            let errorMessage = 'Error al iniciar sesión.';
            
            if (firebaseError.code === 'auth/user-not-found' || firebaseError.code === 'auth/wrong-password') {
                errorMessage = 'Credenciales incorrectas. Verifique usuario y contraseña.';
            } else if (firebaseError.code === 'auth/invalid-email') {
                errorMessage = 'El formato del correo electrónico no es válido.';
            } else if (firebaseError.code === 'auth/too-many-requests') {
                errorMessage = 'Demasiados intentos fallidos. Intente más tarde.';
            }
            
            setError(errorMessage);
            console.error("Error técnico:", firebaseError.code);
        } finally {
            setLoading(false); 
        }
    };

    return (
        <div className="login-container">
            <div className="login-form-card">
                <h2>Iniciar Sesión</h2>

                {/* Renderizado condicional del mensaje de error */}
                {error && <p className="error-message">{error}</p>}
                
                <form className="login-form" onSubmit={handleEntrar}>
                    <label>
                        Usuario (Email):
                        {/* El campo se llama 'Usuario' pero usamos 'email' en el código para Firebase Auth */}
                        <input 
                            type="email"
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                            placeholder="Ingrese su email" 
                        />
                    </label>
                    <label>
                        Contraseña:
                        <input 
                            type="password" 
                            value={contrasena} 
                            onChange={e => setContrasena(e.target.value)} 
                            placeholder="Ingrese su contraseña" 
                        />
                    </label>

                    {/* Contenedor del enlace de olvido de clave alineado a la derecha */}
                    <div className="link-olvide-pass-container">
                        <button 
                            type="button" 
                            className="link-olvide-pass" 
                            onClick={handleRecuperarPassword}
                            disabled={loading}
                        >
                            ¿Olvidaste tu contraseña?
                        </button>
                    </div>

                    <div className="login-actions">
                        <button 
                            type="submit" 
                            className="btn-entrar" 
                            disabled={loading}
                        >
                            {loading ? 'Verificando...' : 'Entrar'}
                        </button>
                        <button 
                            type="button" 
                            className="link-registrar" 
                            onClick={handleRegistrarse} 
                            disabled={loading}
                        >
                            Registrarse
                        </button>
                    </div>
                </form>
            </div>
            
            {/* Imagen de fondo */}
            <div className="imagen">
                <img src={microruta} alt="Fondo Micro" />
            </div>
        </div>
    );
};

export default Login;