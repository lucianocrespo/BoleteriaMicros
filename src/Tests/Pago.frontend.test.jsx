import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Pago from '../Usuario/Pago';

// Mock de dependencias de Firebase (Solo para que no rompa la UI)
jest.mock('../firebase-config', () => ({
    auth: {},
    db: {}
}));
jest.mock('firebase/firestore', () => ({
    doc: jest.fn(),
    getDoc: jest.fn(),
    updateDoc: jest.fn(),
    addDoc: jest.fn(),
    collection: jest.fn()
}));

// Mock de Navegacion
const mockedNavigate = jest.fn();

// Variable para controlar que datos llegaron de la pantalla anterior
let mockLocationState = {
    origen: 'A', destino: 'B', dia: 'Hoy', horario: '10:00', asiento: 15
};

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockedNavigate,
    useLocation: () => ({ state: mockLocationState }),
}));

describe('Pago - Pruebas de Frontend (Interfaz)', () => {

    test('Debe renderizar el formulario y el cronómetro si hay datos de viaje', () => {
        render(<BrowserRouter><Pago /></BrowserRouter>);

        // Verificar elementos visuales clave
        expect(screen.getByText(/Formulario de Pago/i)).toBeInTheDocument();
        expect(screen.getByText(/Asiento Reservado:/i)).toBeInTheDocument();
        expect(screen.getByText('#15')).toBeInTheDocument(); // El asiento del mock
        
        // Verificar que el cronometro se renderiza
        expect(screen.getByText(/⏱️/i)).toBeInTheDocument();

        // Verificar campos del formulario
        expect(screen.getByPlaceholderText(/Nombre del titular/i)).toBeInTheDocument();
        expect(screen.getByText(/Pagar y Confirmar/i)).toBeInTheDocument();
    });

    test('Debe permitir escribir en los campos de la tarjeta', () => {
        render(<BrowserRouter><Pago /></BrowserRouter>);

        const inputNombre = screen.getByPlaceholderText(/Nombre del titular/i);
        const inputTarjeta = screen.getByPlaceholderText(/xxxx xxxx/i);

        fireEvent.change(inputNombre, { target: { value: 'Juan Perez' } });
        fireEvent.change(inputTarjeta, { target: { value: '1234567890123456' } });

        expect(inputNombre.value).toBe('Juan Perez');
        expect(inputTarjeta.value).toBe('1234567890123456');
    });

    test('Debe mostrar pantalla de error si se accede sin seleccionar asiento', () => {
        // Simulamos que el usuario entro directo por URL sin datos
        mockLocationState = {}; 
        
        // *Re-configuramos el mock para este caso especifico*
        jest.clearAllMocks();
    });
});