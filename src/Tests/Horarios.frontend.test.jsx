import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Horarios from '../Usuario/Horarios';

// Mock de navegacion y ubicacion
// Simulamos que el usuario llego buscando un viaje de "Pehuajo" a "Trenque Lauquen"
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useLocation: () => ({
        state: { origen: 'Pehuajo', destino: 'Trenque Lauquen', dia: '2024-12-25' }
    }),
    useNavigate: () => jest.fn(),
}));

// Mock de Firebase
// Simulamos que la base de datos devuelve un horario especifico para que se muestre en pantalla
jest.mock('../firebase-config', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
    doc: jest.fn(),
    getDoc: jest.fn(() => Promise.resolve({
        exists: () => true,
        data: () => ({
            horarios: {
                'Pehuajo-Trenque Lauquen': [
                    { horario: '10:00', precio: '5500', asientosOcupados: 'null' },
                    { horario: '18:00', precio: '6000', asientosOcupados: '1,2' }
                ]
            }
        })
    }))
}));

describe('Horarios - Pruebas de Frontend (Interfaz Visual)', () => {

    test('Debe mostrar el título y el resumen del viaje correctamente', async () => {
        render(
            <BrowserRouter>
                <Horarios />
            </BrowserRouter>
        );

        // Esperamos a que cargue la data
        await waitFor(() => expect(screen.queryByText(/Cargando/i)).not.toBeInTheDocument());

        // Verificamos elementos estaticos
        expect(screen.getByText('Horarios disponibles')).toBeInTheDocument();
        
        // Verificamos que se muestre la informacion que trajimos de la pantalla anterior
        expect(screen.getByText(/Pehuajo/i)).toBeInTheDocument();
        expect(screen.getByText(/Trenque Lauquen/i)).toBeInTheDocument();
        expect(screen.getByText('2024-12-25')).toBeInTheDocument();
    });

    test('Debe renderizar la lista de horarios y precios', async () => {
        render(
            <BrowserRouter>
                <Horarios />
            </BrowserRouter>
        );

        // Esperamos que aparezcan los horarios del Mock
        await waitFor(() => {
            // Verificamos hora y precio del primer viaje
            expect(screen.getByText('10:00')).toBeInTheDocument();
            expect(screen.getByText('$5500')).toBeInTheDocument();

            // Verificamos hora y precio del segundo viaje
            expect(screen.getByText('18:00')).toBeInTheDocument();
            expect(screen.getByText('$6000')).toBeInTheDocument();
        });

        // Verificamos que existan los botones de seleccion
        const botones = screen.getAllByText('Seleccionar');
        expect(botones).toHaveLength(2);
    });

    test('Debe mostrar mensaje si no hay horarios disponibles', async () => {
        // Sobrescribimos el mock para este test especifico: devolvemos una ruta vacia
        const { getDoc } = require('firebase/firestore');
        getDoc.mockResolvedValueOnce({
            exists: () => true,
            data: () => ({ horarios: {} }) // Sin datos para esta ruta
        });

        render(
            <BrowserRouter>
                <Horarios />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/No se encontraron horarios/i)).toBeInTheDocument();
        });
    });
});