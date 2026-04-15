import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import PanelAdmin from '../Administrador/PanelAdmin';

// Mock de dependencias de Firebase
jest.mock('../firebase-config', () => ({
    auth: {},
    db: {}
}));

// Mockeamos firebase/auth para evitar errores relacionados con la autenticacion
jest.mock('firebase/auth', () => ({
    getAuth: jest.fn(),
    signOut: jest.fn()
}));

// Datos de prueba (Fixtures)
const MOCK_CIUDADES = { lista: ['Trenque Lauquen', 'Pehuajo'] };
const MOCK_HORARIOS = { 
    horarios: {
        'Trenque Lauquen-Pehuajo': [
            { horario: '08:00', precio: '5000', asientosOcupados: 'null' }
        ]
    } 
};
const MOCK_USUARIOS = [
    { id: 'user1', nombre: 'Admin Test', email: 'admin@test.com', esAdmin: true },
    { id: 'user2', nombre: 'User Test', email: 'user@test.com', esAdmin: false }
];

// Mock Inteligente de Firestore
jest.mock('firebase/firestore', () => ({
    doc: jest.fn((_db, _collection, id) => ({ id })), 
    
    collection: jest.fn(),
    
    getDoc: jest.fn((ref) => {
        if (ref.id === 'ciudades') {
            return Promise.resolve({
                exists: () => true,
                data: () => MOCK_CIUDADES
            });
        }
        if (ref.id === 'horariosData') {
            return Promise.resolve({
                exists: () => true,
                data: () => MOCK_HORARIOS
            });
        }
        return Promise.resolve({ exists: () => false });
    }),

    getDocs: jest.fn(() => Promise.resolve({
        docs: MOCK_USUARIOS.map(u => ({ 
            id: u.id, 
            data: () => u 
        }))
    })),

    updateDoc: jest.fn(),
    deleteDoc: jest.fn(),
    arrayUnion: jest.fn(),
    arrayRemove: jest.fn()
}));

describe('PanelAdmin - Pruebas de Frontend (Interfaz y Pestañas)', () => {

    test('Debe renderizar el panel y la pestaña de Ciudades por defecto', async () => {
        render(<BrowserRouter><PanelAdmin /></BrowserRouter>);

        // Verificar titulo
        expect(screen.getByText('Panel de Administrador')).toBeInTheDocument();

        // Esperamos a que el texto "Trenque Lauquen" aparezca.
        await waitFor(() => {
            expect(screen.getByText('Trenque Lauquen')).toBeInTheDocument();
        });
        
        expect(screen.getByText('Pehuajo')).toBeInTheDocument();

        // Verificar formulario de agregar ciudad
        expect(screen.getByPlaceholderText('Nueva ciudad...')).toBeInTheDocument();
    });

    test('Debe cambiar a la pestaña de Horarios y mostrar rutas', async () => {
        render(<BrowserRouter><PanelAdmin /></BrowserRouter>);

        // Esperar carga inicial para evitar conflictos
        await waitFor(() => screen.getByText('Trenque Lauquen'));

        // Click en la pestaña Horarios
        const tabHorarios = screen.getByText('Horarios y Rutas');
        fireEvent.click(tabHorarios);

        // Verificar que se muestre el contenido de horarios
        await waitFor(() => {
            expect(screen.getByText('Gestionar Rutas')).toBeInTheDocument();
        });

        // Verificar que aparezca la ruta del mock
        expect(screen.getByText(/Trenque Lauquen-Pehuajo/i)).toBeInTheDocument();
    });

    test('Debe cambiar a la pestaña de Usuarios y mostrar la tabla', async () => {
        render(<BrowserRouter><PanelAdmin /></BrowserRouter>);

        // Esperar carga inicial
        await waitFor(() => screen.getByText('Trenque Lauquen'));

        // Click en la pestaña Usuarios
        const tabUsuarios = screen.getByText('Usuarios');
        fireEvent.click(tabUsuarios);

        // Verificar que se muestre la tabla
        await waitFor(() => {
            expect(screen.getByText('Gestión de Usuarios')).toBeInTheDocument();
        });

        expect(screen.getByText('admin@test.com')).toBeInTheDocument();
        expect(screen.getByText('user@test.com')).toBeInTheDocument();
    });
});