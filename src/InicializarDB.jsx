import React, { useState } from 'react';
import { db } from './firebase-config';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';

const InicializarDB = () => {
    const [status, setStatus] = useState('Esperando para iniciar...');

    // DATOS DE CONFIGURACION (Ciudades)

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

    // DATOS DE HORARIOS Y RUTAS

    const MAPA_HORARIOS = {
        "Trenque Lauquen-Juan Jose Paso": [
            { horario: "08:00", precio: "5000", asientosOcupados: "1, 5, 9, 15" }
        ],
        "Trenque Lauquen-Francisco Madero": [
            { horario: "08:00", precio: "6500", asientosOcupados: "1, 5, 15, 22" }
        ],
        "Trenque Lauquen-Pehuajo": [
            { horario: "08:00", precio: "8000", asientosOcupados: "1, 5, 15, 22" }
        ],
        "Trenque Lauquen-Carlos Casares": [
            { horario: "08:00", precio: "10000", asientosOcupados: "1, 5, 15, 22" }
        ],
        "Trenque Lauquen-9 De Julio": [
             { horario: "08:00", precio: "12000", asientosOcupados: "1, 5, 15, 22" }
        ],
        "Trenque Lauquen-Junin": [
             { horario: "08:00", precio: "15000", asientosOcupados: "1, 4, 5, 15, 22" }
        ],
        "Trenque Lauquen-Bragado": [
             { horario: "08:00", precio: "17000", asientosOcupados: "1, 4, 15, 22" }
        ],
        "Trenque Lauquen-Buenos Aires": [
            { horario: "08:00", precio: "20000", asientosOcupados: "1, 4, 7, 11, 22" }
        ],
        "Juan Jose Paso-Francisco Madero": [
            { horario: "08:30", precio: "4000", asientosOcupados: "6, 8, 13, 14" }
        ],
        "Juan Jose Paso-Pehuajo": [
            { horario: "08:30", precio: "5500", asientosOcupados: "6, 8, 13" }
        ],
        "Juan Jose Paso-Carlos Casares": [
            { horario: "08:30", precio: "7000", asientosOcupados: "6, 8, 13, 20" }
        ],
        "Juan Jose Paso-9 De Julio": [
            { horario: "08:30", precio: "9000", asientosOcupados: "6, 8, 13, 20, 24" }
        ],
        "Juan Jose Paso-Junin": [
            { horario: "08:30", precio: "12000", asientosOcupados: "8, 13, 14, 20, 26" }
        ],
        "Juan Jose Paso-Bragado": [
            { horario: "08:30", precio: "14000", asientosOcupados: "8, 13, 14, 26" }
        ],
        "Juan Jose Paso-Buenos Aires": [
            { horario: "08:30", precio: "17000", asientosOcupados: "8, 13, 14, 26, 27" }
        ],
        "Francisco Madero-Pehuajo": [
            { horario: "08:50", precio: "4000", asientosOcupados: "8, 13, 14, 17, 26" }
        ],
        "Francisco Madero-Carlos Casares": [
            { horario: "08:50", precio: "7000", asientosOcupados: "8, 13, 14, 18, 22" }
        ],
        "Francisco Madero-9 De Julio": [
            { horario: "08:50", precio: "8500", asientosOcupados: "8, 13, 14, 18, 22, 23" }
        ],
        "Francisco Madero-Junin": [
            { horario: "08:50", precio: "12000", asientosOcupados: "8, 13, 14, 18, 22" }
        ],
        "Francisco Madero-Bragado": [
            { horario: "08:50", precio: "15000", asientosOcupados: "8, 13, 14, 19, 22" }
        ],
        "Francisco Madero-Buenos Aires": [
            { horario: "08:50", precio: "17000", asientosOcupados: "8, 13, 14, 19, 22, 24" }
        ],
        "Pehuajo-Carlos Casares": [
            { horario: "09:10", precio: "6000", asientosOcupados: "8, 13, 14, 21, 22" }
        ],
        "Pehuajo-9 De Julio": [
            { horario: "09:10", precio: "8000", asientosOcupados: "8, 13, 16, 21" }
        ],
        "Pehuajo-Junin": [
            { horario: "09:10", precio: "11000", asientosOcupados: "8, 13, 16, 21, 23" }
        ],
        "Pehuajo-Bragado": [
            { horario: "09:10", precio: "13000", asientosOcupados: "8, 12, 16, 21, 23" }
        ],
        "Pehuajo-Buenos Aires": [
            { horario: "09:10", precio: "16000", asientosOcupados: "8, 12, 16, 21, 23, 25" }
        ],
        "Carlos Casares-9 De Julio": [
            { horario: "09:50", precio: "7000", asientosOcupados: "8, 12, 16, 21" }
        ],
        "Carlos Casares-Junin": [
            { horario: "09:50", precio: "10000", asientosOcupados: "8, 12, 16, 21, 25" }
        ],
        "Carlos Casares-Bragado": [
            { horario: "09:50", precio: "13000", asientosOcupados: "8, 16, 21, 25" }
        ],
        "Carlos Casares-Buenos Aires": [
            { horario: "09:50", precio: "15000", asientosOcupados: "8, 16, 21, 25, 26" }
        ],
        "9 De Julio-Junin": [
            { horario: "10:30", precio: "8000", asientosOcupados: "8, 16, 19, 21, 22" }
        ],
        "9 De Julio-Bragado": [
            { horario: "10:30", precio: "10500", asientosOcupados: "8, 16, 21, 22" }
        ],
        "9 De Julio-Buenos Aires": [
            { horario: "10:30", precio: "14000", asientosOcupados: "8, 16, 21, 24, 25" }
        ],
        "Junin-Bragado": [
            { horario: "11:00", precio: "8000", asientosOcupados: "3, 8, 16, 21, 23" }
        ],
        "Junin-Buenos Aires": [
            { horario: "11:00", precio: "12000", asientosOcupados: "3, 8, 13 21, 23, 26" }
        ],
        "Bragado-Buenos Aires": [
            { horario: "11:30", precio: "9000", asientosOcupados: "8, 10, 13 21, 23, 26, 28" }
        ],

    };


    // DATOS DE USUARIO DE EJEMPLO (Admin)
 
    /*  IMPORTANTE: el ID del documento suele ser el UID de autenticacion y aca usamos un ID generico.
        ES NECESARIO CREAR UN USUARIO REAL EN EL SISTEMA y luego, para el caso de ser admin,
        editar el campo 'esAdmin' en la consola de Firebase
    */
    const USUARIO_EJEMPLO = {
        uid: "usuario_admin",
        nombre: "Administrador Sistema",
        email: "admin@boleteria.com",
        usuario: "admin",
        esAdmin: true, // Esto habilita el acceso al Panel Admin
        fechaRegistro: new Date().toISOString()
    };

    // DATOS DE BOLETO DE EJEMPLO

    const BOLETO_EJEMPLO = {
        uidUsuario: "usuario_admin", // Coincide con el usuario de arriba
        origen: "Trenque Lauquen",
        destino: "Buenos Aires",
        dia: "2024-12-25",
        horario: "08:00",
        asiento: 1,
        nombrePasajero: "Pasajero Ejemplo",
        fechaCompra: new Date().toISOString()
    };

    const ejecutarScript = async () => {
        if (!window.confirm("¿Esta seguro? Esto creará/sobrescribirá datos en su base de datos Firebase.")) return;
        
        setStatus('Iniciando carga masiva...');

        try {
            // A. Crear documento de Ciudades (Coleccion 'config')
            setStatus('1/4 Creando colección de Ciudades...');
            await setDoc(doc(db, "config", "ciudades"), {
                lista: LISTA_CIUDADES
            });

            // Crear documento de Horarios (Coleccion 'config')
            setStatus('2/4 Creando colección de Horarios...');
            await setDoc(doc(db, "config", "horariosData"), {
                horarios: MAPA_HORARIOS
            });

            // Crear un Usuario de ejemplo (Coleccion 'Usuarios')
            setStatus('3/4 Creando colección de Usuarios...');
            // Usamos setDoc con un ID especifico para ubicarlo facil
            await setDoc(doc(db, "Usuarios", USUARIO_EJEMPLO.uid), USUARIO_EJEMPLO);

            // Crear un Boleto de ejemplo (Coleccion 'boletos')
            setStatus('4/4 Creando colección de Boletos...');
            // Usamos addDoc para que genere un ID automatico
            await addDoc(collection(db, "boletos"), BOLETO_EJEMPLO);

            setStatus('¡CARGA EXITOSA! La base de datos ha sido poblada con todas las colecciones.');
            alert("Base de datos inicializada correctamente con:\n- Ciudades\n- Horarios\n- Usuario Admin (De prueba)\n- Boleto (De prueba)");

        } catch (error) {
            console.error(error);
            setStatus(`ERROR CRÍTICO: ${error.message}`);
        }
    };

    return (
        <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{color: '#333'}}>Script de Despliegue de Base de Datos</h1>
            <div style={{textAlign: 'left', background: '#000000', padding: '20px', borderRadius: '8px', marginBottom: '30px'}}>
                <p>Este script inicializará la estructura completa de Firestore requerida por la aplicación:</p>
                <ul>
                    <li><strong>config/ciudades:</strong> Lista de destinos disponibles.</li>
                    <li><strong>config/horariosData:</strong> Rutas, precios y horarios.</li>
                    <li><strong>Usuarios:</strong> Crea un usuario admin de ejemplo.</li>
                    <li><strong>boletos:</strong> Crea una colección de boletos con un ejemplo.</li>
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