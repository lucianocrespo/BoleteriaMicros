import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from './firebase-config'; 
import { signInWithEmailAndPassword } from 'firebase/auth'; 
import './Login.css';

const Login = ({ onBack }) => {
    const [email, setEmail] = useState('');
    const [contrasena, setContrasena] = useState('');
    const [error, setError] = useState(''); // Estado para manejar errores de login
    const [loading, setLoading] = useState(false); // Estado para evitar doble click
    const navigate = useNavigate();

    const handleRegistrarse = (e) => {
        e.preventDefault();
        navigate('/Registro');
    };

    const handleEntrar = async (e) => {
        e.preventDefault();
        setError(''); // Limpiamos errores anteriores

        if (!email || !contrasena) {
            setError('⚠️ Por favor, complete todos los campos.');
            return;
        }

        setLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, contrasena);
            // Si tiene éxito, navega al menú
            navigate('/MenuViaje');

        } catch (firebaseError) {
            // Manejo de errores específicos de Firebase
            let errorMessage = 'Error al iniciar sesión. Credenciales incorrectas.';
            
            if (firebaseError.code === 'auth/user-not-found' || firebaseError.code === 'auth/wrong-password') {
                errorMessage = 'Usuario o contraseña incorrectos.';
            } else if (firebaseError.code === 'auth/invalid-email') {
                errorMessage = 'Formato de correo electrónico no válido.';
            }
            
            setError(errorMessage);
            console.error("Firebase Login Error:", firebaseError.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-form-card">
                <h2>Iniciar Sesión</h2>
 
                {error && <p className="error-message">{error}</p>}
                
                <form className="login-form" onSubmit={handleEntrar}>
                    <label>
                        Usuario (Email):
                        {/* El campo se llama 'Usuario' pero usamos 'email' en el código para Firebase Auth */}
                        <input 
                            type="email"
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                            placeholder=" Ingrese su email" 
                        />
                    </label>
                    <label>
                        Contraseña:
                        <input 
                            type="password" 
                            value={contrasena} 
                            onChange={e => setContrasena(e.target.value)} 
                            placeholder=" Ingrese su contraseña" 
                        />
                    </label>

                    <div className="login-actions">
                        <button 
                            type="submit" 
                            className="btn-entrar" 
                            disabled={loading} // Deshabilita el botón mientras carga
                        >
                            {loading ? 'Verificando...' : 'Entrar'}
                        </button>
                        <button 
                            type="button" 
                            className="link-registrar" 
                            onClick={handleRegistrarse} 
                        >
                            Registrarse
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;