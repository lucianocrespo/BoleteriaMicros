import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PanelAdmin from '../Administrador/PanelAdmin';
// Importamos funciones reales para espiarlas
import { updateDoc, deleteDoc, arrayUnion, arrayRemove, getDoc, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

// Mocks de Configuracion
jest.mock('../firebase-config', () => ({
    auth: { currentUser: { uid: 'admin-123' } },
    db: {}
}));

// Mock de Firestore y Auth
jest.mock('firebase/auth', () => ({
    signOut: jest.fn(), // Mock de la funcion independiente
    getAuth: jest.fn()
}));

jest.mock('firebase/firestore', () => ({
    doc: jest.fn(),
    collection: jest.fn(),
    getDoc: jest.fn(() => Promise.resolve({ exists: () => false })), 
    getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
    updateDoc: jest.fn(),
    deleteDoc: jest.fn(),
    arrayUnion: jest.fn(val => val), 
    arrayRemove: jest.fn(val => val)
}));

window.confirm = jest.fn(() => true);

describe('PanelAdmin - Pruebas de Backend (Gestión de Datos)', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Debe agregar una nueva Ciudad (updateDoc + arrayUnion)', async () => {
        render(<BrowserRouter><PanelAdmin /></BrowserRouter>);

        const inputCiudad = await screen.findByPlaceholderText('Nueva ciudad...');
        fireEvent.change(inputCiudad, { target: { value: 'Mar del Plata' } });

        const btnAgregar = screen.getByText('Agregar');
        fireEvent.click(btnAgregar);

        await waitFor(() => {
            expect(updateDoc).toHaveBeenCalled();
            expect(arrayUnion).toHaveBeenCalledWith('Mar del Plata');
        });
    });

    test('Debe eliminar un Usuario (deleteDoc)', async () => {
        const { getDocs } = require('firebase/firestore');
        getDocs.mockResolvedValue({
            docs: [{ id: 'user-borrar', data: () => ({ email: 'borrar@test.com', nombre: 'Borrar' }) }]
        });

        render(<BrowserRouter><PanelAdmin /></BrowserRouter>);
        await waitFor(() => expect(screen.queryByText('Cargando datos...')).not.toBeInTheDocument());

        const tabUsuarios = screen.getByText('Usuarios');
        fireEvent.click(tabUsuarios);

        const usuarioEmail = await screen.findByText('borrar@test.com');
        expect(usuarioEmail).toBeInTheDocument();
        
        const btnEliminar = screen.getByText('Eliminar');
        fireEvent.click(btnEliminar);

        await waitFor(() => {
            expect(deleteDoc).toHaveBeenCalled();
        });
    });

    test('Debe cerrar sesión correctamente (signOut)', async () => {
        render(<BrowserRouter><PanelAdmin /></BrowserRouter>);

        // Esperamos a que el boton aparezca
        const btnLogout = await screen.findByText('Cerrar Sesión');
        fireEvent.click(btnLogout);

        await waitFor(() => {
            // Verificamos que se haya llamado a la funcion independiente signOut
            expect(signOut).toHaveBeenCalled();
        });
    });
});