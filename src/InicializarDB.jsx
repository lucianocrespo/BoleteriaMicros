import React, { useState } from 'react';
import { db, auth } from './firebase-config';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const InicializarDB = () => {
    const [status, setStatus] = useState('Esperando para iniciar...');

    // Datos de ciudades
    const LISTA_CIUDADES = [
        "Trenque Lauquen",
        "Juan Jose Paso",
        "Francisco Madero",
        "Pehuajo",
        "Carlos Casares",
        "9 De Julio",
        "Junin",
        "Bragado",
        "Buenos Aires"
    ];

    // Datos de horarios y rutas (Con estructura de fechas, para poder asignar los asientos ocupados a un dia en especifico y no en todos)
    const fechaEjemplo = "2026-12-25"; 

    const MAPA_HORARIOS = {
        "Trenque Lauquen-Juan Jose Paso": [
            { horario: "08:00", precio: "5000", asientosOcupados: { [fechaEjemplo]: "1, 5, 9, 15" } }
        ],
        "Trenque Lauquen-Francisco Madero": [
            { horario: "08:00", precio: "6500", asientosOcupados: { [fechaEjemplo]: "1, 5, 15, 22" } }
        ],
        "Trenque Lauquen-Pehuajo": [
            { horario: "08:00", precio: "8000", asientosOcupados: { [fechaEjemplo]: "1, 5, 15, 22" } }
        ],
        "Trenque Lauquen-Carlos Casares": [
            { horario: "08:00", precio: "10000", asientosOcupados: { [fechaEjemplo]: "1, 5, 15, 22" } }
        ],
        "Trenque Lauquen-9 De Julio": [
             { horario: "08:00", precio: "12000", asientosOcupados: { [fechaEjemplo]: "1, 5, 15, 22" } }
        ],
        "Trenque Lauquen-Junin": [
             { horario: "08:00", precio: "15000", asientosOcupados: { [fechaEjemplo]: "1, 4, 5, 15, 22" } }
        ],
        "Trenque Lauquen-Bragado": [
             { horario: "08:00", precio: "17000", asientosOcupados: { [fechaEjemplo]: "1, 4, 15, 22" } }
        ],
        "Trenque Lauquen-Buenos Aires": [
            { horario: "08:00", precio: "20000", asientosOcupados: { [fechaEjemplo]: "1, 4, 7, 11, 22" } }
        ],
        "Juan Jose Paso-Francisco Madero": [
            { horario: "08:30", precio: "4000", asientosOcupados: { [fechaEjemplo]: "6, 8, 13, 14" } }
        ],
        "Juan Jose Paso-Pehuajo": [
            { horario: "08:30", precio: "5500", asientosOcupados: { [fechaEjemplo]: "6, 8, 13" } }
        ],
        "Juan Jose Paso-Carlos Casares": [
            { horario: "08:30", precio: "7000", asientosOcupados: { [fechaEjemplo]: "6, 8, 13, 20" } }
        ],
        "Juan Jose Paso-9 De Julio": [
            { horario: "08:30", precio: "9000", asientosOcupados: { [fechaEjemplo]: "6, 8, 13, 20, 24" } }
        ],
        "Juan Jose Paso-Junin": [
            { horario: "08:30", precio: "12000", asientosOcupados: { [fechaEjemplo]: "8, 13, 14, 20, 26" } }
        ],
        "Juan Jose Paso-Bragado": [
            { horario: "08:30", precio: "14000", asientosOcupados: { [fechaEjemplo]: "8, 13, 14, 26" } }
        ],
        "Juan Jose Paso-Buenos Aires": [
            { horario: "08:30", precio: "17000", asientosOcupados: { [fechaEjemplo]: "8, 13, 14, 26, 27" } }
        ],
        "Francisco Madero-Pehuajo": [
            { horario: "08:50", precio: "4000", asientosOcupados: { [fechaEjemplo]: "8, 13, 14, 17, 26" } }
        ],
        "Francisco Madero-Carlos Casares": [
            { horario: "08:50", precio: "7000", asientosOcupados: { [fechaEjemplo]: "8, 13, 14, 18, 22" } }
        ],
        "Francisco Madero-9 De Julio": [
            { horario: "08:50", precio: "8500", asientosOcupados: { [fechaEjemplo]: "8, 13, 14, 18, 22, 23" } }
        ],
        "Francisco Madero-Junin": [
            { horario: "08:50", precio: "12000", asientosOcupados: { [fechaEjemplo]: "8, 13, 14, 18, 22" } }
        ],
        "Francisco Madero-Bragado": [
            { horario: "08:50", precio: "15000", asientosOcupados: { [fechaEjemplo]: "8, 13, 14, 19, 22" } }
        ],
        "Francisco Madero-Buenos Aires": [
            { horario: "08:50", precio: "17000", asientosOcupados: { [fechaEjemplo]: "8, 13, 14, 19, 22, 24" } }
        ],
        "Pehuajo-Carlos Casares": [
            { horario: "09:10", precio: "6000", asientosOcupados: { [fechaEjemplo]: "8, 13, 14, 21, 22" } }
        ],
        "Pehuajo-9 De Julio": [
            { horario: "09:10", precio: "8000", asientosOcupados: { [fechaEjemplo]: "8, 13, 16, 21" } }
        ],
        "Pehuajo-Junin": [
            { horario: "09:10", precio: "11000", asientosOcupados: { [fechaEjemplo]: "8, 13, 16, 21, 23" } }
        ],
        "Pehuajo-Bragado": [
            { horario: "09:10", precio: "13000", asientosOcupados: { [fechaEjemplo]: "8, 12, 16, 21, 23" } }
        ],
        "Pehuajo-Buenos Aires": [
            { horario: "09:10", precio: "16000", asientosOcupados: { [fechaEjemplo]: "8, 12, 16, 21, 23, 25" } }
        ],
        "Carlos Casares-9 De Julio": [
            { horario: "09:50", precio: "7000", asientosOcupados: { [fechaEjemplo]: "8, 12, 16, 21" } }
        ],
        "Carlos Casares-Junin": [
            { horario: "09:50", precio: "10000", asientosOcupados: { [fechaEjemplo]: "8, 12, 16, 21, 25" } }
        ],
        "Carlos Casares-Bragado": [
            { horario: "09:50", precio: "13000", asientosOcupados: { [fechaEjemplo]: "8, 16, 21, 25" } }
        ],
        "Carlos Casares-Buenos Aires": [
            { horario: "09:50", precio: "15000", asientosOcupados: { [fechaEjemplo]: "8, 16, 21, 25, 26" } }
        ],
        "9 De Julio-Junin": [
            { horario: "10:30", precio: "8000", asientosOcupados: { [fechaEjemplo]: "8, 16, 19, 21, 22" } }
        ],
        "9 De Julio-Bragado": [
            { horario: "10:30", precio: "10500", asientosOcupados: { [fechaEjemplo]: "8, 16, 21, 22" } }
        ],
        "9 De Julio-Buenos Aires": [
            { horario: "10:30", precio: "14000", asientosOcupados: { [fechaEjemplo]: "8, 16, 21, 24, 25" } }
        ],
        "Junin-Bragado": [
            { horario: "11:00", precio: "8000", asientosOcupados: { [fechaEjemplo]: "3, 8, 16, 21, 23" } }
        ],
        "Junin-Buenos Aires": [
            { horario: "11:00", precio: "12000", asientosOcupados: { [fechaEjemplo]: "3, 8, 13, 21, 23, 26" } }
        ],
        "Bragado-Buenos Aires": [
            { horario: "11:30", precio: "9000", asientosOcupados: { [fechaEjemplo]: "8, 10, 13, 21, 23, 26, 28" } }
        ]
    };

    const ejecutarScript = async () => {
        if (!window.confirm("¿Esta seguro? Esto creará/sobrescribirá datos en su base de datos Firebase.")) return;
        
        setStatus('Iniciando carga masiva...');

        try {
            // Crear documento de Ciudades (Coleccion 'config')
            setStatus('1/5 Creando colección de Ciudades...');
            await setDoc(doc(db, "config", "ciudades"), {
                lista: LISTA_CIUDADES
            });

            // Crear documento de Horarios (Coleccion 'config')
            setStatus('2/5 Creando colección de Horarios...');
            await setDoc(doc(db, "config", "horariosData"), {
                horarios: MAPA_HORARIOS
            });

            // Creacion del usuario administrador real en Firebase Auth
            setStatus('3/5 Creando cuenta de Administrador Maestro...');
            const adminEmail = "admin@boleteria.com";
            const adminPass = "admin123";
            let adminUid = "";

            try {
                // Intentamos crear la cuenta real en Authentication
                const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPass);
                adminUid = userCredential.user.uid;
            } catch (authError) {
                // Si la cuenta ya existe (porque se ejecuto el script antes), la rescatamos en lugar de fallar
                if (authError.code === 'auth/email-already-in-use') {
                    console.log("El usuario admin ya existe en Auth, actualizando sus permisos en BD...");
                    // No tenemos el UID directo sin iniciar sesion, pero para simplificar, usaremos un ID manual en Firestore si ya existia.
                    adminUid = "usuario_admin_fijo"; 
                } else {
                    throw authError; // Si es otro error (ej: sin internet), cortamos todo
                }
            }

            // Guardar Perfil Admin en Firestore
            setStatus('4/5 Asignando permisos de Administrador...');
            await setDoc(doc(db, "Usuarios", adminUid), {
                uid: adminUid,
                nombre: "Administrador Sistema",
                email: adminEmail,
                esAdmin: true, 
                fechaRegistro: new Date().toISOString()
            });

            // Crear un Boleto de ejemplo
            setStatus('5/5 Creando boleto de prueba...');
            await addDoc(collection(db, "boletos"), {
                uidUsuario: adminUid, 
                origen: "Trenque Lauquen",
                destino: "Buenos Aires",
                dia: fechaEjemplo, 
                horario: "08:00",
                asiento: 22,
                nombrePasajero: "Pasajero Ejemplo",
                fechaCompra: new Date().toISOString()
            });

            setStatus('¡CARGA EXITOSA! Sistema listo para producción.');
            alert(`Base de datos inicializada.\n\nYa puedes iniciar sesión con:\nEmail: ${adminEmail}\nClave: ${adminPass}`);

        } catch (error) {
            console.error(error);
            setStatus(`ERROR CRÍTICO: ${error.message}`);
        }
    };

    return (
        <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{color: '#333'}}>Script de Despliegue de Base de Datos</h1>
            <div style={{textAlign: 'left', background: '#e9ecef', color: '#333', padding: '20px', borderRadius: '8px', marginBottom: '30px', border: '1px solid #ced4da'}}>
                <p>Este script inicializará la estructura completa requerida por la aplicación:</p>
                <ul>
                    <li><strong>config/ciudades:</strong> Lista de destinos disponibles.</li>
                    <li><strong>config/horariosData:</strong> Rutas, precios y horarios.</li>
                    <li><strong>Cuenta de Administrador:</strong> Crea la cuenta real <code>admin@boleteria.com</code> (Clave: <code>admin123456</code>).</li>
                </ul>
            </div>
            
            <button 
                onClick={ejecutarScript}
                style={{
                    padding: '15px 30px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
            >
                EJECUTAR SCRIPT DE INICIALIZACIÓN
            </button>

            <div style={{ 
                marginTop: '30px', 
                fontWeight: 'bold', 
                fontSize: '1.2em',
                padding: '15px',
                borderRadius: '5px',
                backgroundColor: status.includes('ERROR') ? '#f8d7da' : (status.includes('ÉXITO') ? '#d4edda' : 'transparent'),
                color: status.includes('ERROR') ? '#721c24' : (status.includes('ÉXITO') ? '#155724' : '#007bff') 
            }}>
                {status}
            </div>
        </div>
    );
};

export default InicializarDB;