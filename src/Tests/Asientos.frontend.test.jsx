import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Asientos from '../Usuario/Asientos';

// Mock de Navegacion y Estado
const mockedNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockedNavigate,
    // Simulamos que venimos de Horarios con los asientos 1 y 5 ya ocupados
    useLocation: () => ({
        state: { 
            origen: 'Pehuajo', 
            destino: 'Buenos Aires', 
            dia: '2024-12-25', 
            horario: '08:00', 
            ocupados: "1, 5" // String de ocupados
        }
    }),
}));

// Mock de Firebase (Para que no rompa al intentar importar)
jest.mock('../firebase-config', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
    doc: jest.fn(),
    getDoc: jest.fn(),
    updateDoc: jest.fn()
}));

describe('Asientos - Pruebas de Frontend (Interfaz Visual)', () => {

    test('Debe renderizar los asientos correctamente según su estado', () => {
        render(
            <BrowserRouter>
                <Asientos />
            </BrowserRouter>
        );

        // Verificamos que se muestre la informacion del viaje
        expect(screen.getByText(/Pehuajo/i)).toBeInTheDocument();
        expect(screen.getByText(/08:00/i)).toBeInTheDocument();

        // ASIENTOS OCUPADOS (1 y 5 segun el mock)
        // Buscamos el boton con texto "1"
        const asiento1 = screen.getByText('1');
        // Debe estar deshabilitado y tener la clase de ocupado
        expect(asiento1).toBeDisabled();
        expect(asiento1).toHaveClass('asiento-ocupado');

        const asiento5 = screen.getByText('5');
        expect(asiento5).toBeDisabled();

        // ASIENTOS LIBRES (Cualquiera que no sea 1 o 5, ej: 2)
        const asiento2 = screen.getByText('2');
        expect(asiento2).not.toBeDisabled();
        expect(asiento2).toHaveClass('asiento-disponible');
    });

    test('Debe permitir seleccionar un asiento y habilitar el botón de continuar', () => {
        render(
            <BrowserRouter>
                <Asientos />
            </BrowserRouter>
        );

        const btnContinuar = screen.getByText(/Confirmar Asiento/i);
        
        // Al inicio, sin seleccion, el boton debe estar deshabilitado
        expect(btnContinuar).toBeDisabled();

        // Seleccionamos el asiento 10
        const asiento10 = screen.getByText('10');
        fireEvent.click(asiento10);

        // Ahora el asiento debe tener clase de seleccionado
        expect(asiento10).toHaveClass('asiento-seleccionado');
        
        // Y el boton debe estar habilitado
        expect(btnContinuar).toBeEnabled();
    });
});