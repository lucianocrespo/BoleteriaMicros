import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import MisBoletos from '../Usuario/MisBoletos';

// Mock de Navegacion
const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockedNavigate,
}));

// Mock de Firebase Config
jest.mock('../firebase-config', () => ({
    auth: { currentUser: { uid: 'user-frontend-test' } },
    db: {}
}));

// Mock de Firestore (Simulamos 2 boletos)
const mockBoletosData = [
    {
        id: 'boleto-1',
        data: () => ({
            origen: 'Trenque Lauquen',
            destino: 'Buenos Aires',
            dia: '2025-12-25',
            horario: '08:00',
            asiento: 15,
            nombrePasajero: 'Frontend Tester'
        })
    },
    {
        id: 'boleto-2',
        data: () => ({
            origen: 'Pehuajo',
            destino: 'La Plata',
            dia: '2025-01-01',
            horario: '10:00',
            asiento: 4,
            nombrePasajero: 'Frontend Tester'
        })
    }
];

jest.mock('firebase/firestore', () => ({
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    getDocs: jest.fn(() => Promise.resolve({
        docs: mockBoletosData
    })),
    doc: jest.fn(),
    deleteDoc: jest.fn(),
    getDoc: jest.fn(),
    updateDoc: jest.fn()
}));

describe('Mis Boletos - Pruebas de Frontend (Interfaz)', () => {

    test('Debe renderizar la lista de boletos correctamente', async () => {
        render(<BrowserRouter><MisBoletos /></BrowserRouter>);

        // Esperamos a que cargue
        await waitFor(() => {
            expect(screen.queryByText(/Procesando/i)).not.toBeInTheDocument();
        });

        // Verificamos el titulo
        expect(screen.getByText('Mis Boletos')).toBeInTheDocument();

        // Usamos getAllByText y verificamos que haya encontrado 2 elementos.
        const etiquetasAsiento = screen.getAllByText(/Asiento:/i);
        expect(etiquetasAsiento).toHaveLength(2);

        // Verificamos datos especificos del primer boleto
        expect(screen.getByText(/Trenque Lauquen ➝ Buenos Aires/i)).toBeInTheDocument();
        expect(screen.getByText('#15')).toBeInTheDocument();

        // Verificamos datos especificos del segundo boleto
        expect(screen.getByText(/Pehuajo ➝ La Plata/i)).toBeInTheDocument();
        expect(screen.getByText('#4')).toBeInTheDocument();
    });

    test('El botón "Volver al Menú" debe navegar correctamente', async () => {
        render(<BrowserRouter><MisBoletos /></BrowserRouter>);

        await waitFor(() => screen.getByText('Mis Boletos'));

        const btnVolver = screen.getByText(/Volver al Menú/i);
        fireEvent.click(btnVolver);

        expect(mockedNavigate).toHaveBeenCalledWith('/MenuViaje');
    });
});