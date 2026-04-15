import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Pago from '../Usuario/Pago';
import { addDoc, updateDoc, getDoc } from 'firebase/firestore';

// 1. Mock de Navegación
const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockedNavigate,
    useLocation: () => ({
        state: { 
            origen: 'Trenque Lauquen', 
            destino: 'Buenos Aires', 
            dia: '2024-12-25', 
            horario: '08:00', 
            asiento: 5 
        }
    }),
}));

// 2. Mock de Firebase
jest.mock('../firebase-config', () => ({
    auth: { currentUser: { uid: 'user-123' } }, 
    db: {}
}));

// 3. Mock de Firestore
jest.mock('firebase/firestore', () => ({
    collection: jest.fn(() => 'ref-coleccion-simulada'),
    doc: jest.fn(() => 'ref-doc-simulada'),
    addDoc: jest.fn(() => Promise.resolve({ id: 'nuevo-boleto-id' })),
    updateDoc: jest.fn(() => Promise.resolve()),
    getDoc: jest.fn()
}));

window.confirm = jest.fn(() => true);

describe('Pago - Pruebas de Backend (Procesamiento y Base de Datos)', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        
        const { collection, doc, addDoc } = require('firebase/firestore');
        collection.mockImplementation(() => 'ref-coleccion-simulada');
        doc.mockImplementation(() => 'ref-doc-simulada');
        addDoc.mockResolvedValue({ id: 'nuevo-boleto-id' });

        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('Debe GUARDAR el boleto en Firestore al completar el pago', async () => {
        render(<BrowserRouter><Pago /></BrowserRouter>);

        // Llenar formulario
        fireEvent.change(screen.getByPlaceholderText(/Nombre del titular/i), { target: { value: 'Test User' } });
        fireEvent.change(screen.getByPlaceholderText(/xxxx xxxx/i), { target: { value: '1111222233334444' } });
        
        // Input fecha por label
        const inputFecha = screen.getByLabelText(/Vencimiento/i);
        fireEvent.change(inputFecha, { target: { value: '2025-12' } });

        fireEvent.change(screen.getByPlaceholderText(/123/i), { target: { value: '999' } });
        
        // Ejecutar pago
        const btnPagar = screen.getByText(/Pagar y Confirmar/i);
        fireEvent.click(btnPagar);

        // 💡 PASO 1: Avanzar primer timer (Procesando Pago - 2000ms)
        await act(async () => {
            jest.advanceTimersByTime(2000);
        });

        // 💡 PASO 2: Avanzar segundo timer (Redirección - otros 2000ms)
        // Le damos un poco más (2500ms) para estar seguros
        await act(async () => {
            jest.advanceTimersByTime(2500); 
        });

        // Verificamos todo
        await waitFor(() => {
            // Verificar guardado en BD
            expect(addDoc).toHaveBeenCalledWith(
                'ref-coleccion-simulada', 
                expect.objectContaining({
                    uidUsuario: 'user-123',
                    asiento: 5
                })
            );

            // Verificar navegación
            expect(mockedNavigate).toHaveBeenCalledWith('/MenuViaje');
        }); 
    });

    test('Debe LIBERAR el asiento (UpdateDoc) si el usuario cancela la reserva', async () => {
        getDoc.mockResolvedValue({
            exists: () => true,
            data: () => ({
                horarios: {
                    'Trenque Lauquen-Buenos Aires': [{ 
                        horario: '08:00', 
                        asientosOcupados: '1, 5, 10' 
                    }]
                }
            })
        });

        render(<BrowserRouter><Pago /></BrowserRouter>);

        const btnCancelar = screen.getByText(/Cancelar Reserva/i);
        
        await act(async () => {
            fireEvent.click(btnCancelar);
        });

        await waitFor(() => {
            expect(getDoc).toHaveBeenCalled();

            expect(updateDoc).toHaveBeenCalledWith(
                'ref-doc-simulada',
                expect.objectContaining({
                    horarios: expect.objectContaining({
                        'Trenque Lauquen-Buenos Aires': expect.arrayContaining([
                            expect.objectContaining({
                                asientosOcupados: expect.not.stringContaining('5') 
                            })
                        ])
                    })
                })
            );

            expect(mockedNavigate).toHaveBeenCalledWith(-1);
        });
    });
});