import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Horarios from '../Usuario/Horarios';
// Importamos la funcion getDoc para verificar que se llame
import { getDoc } from 'firebase/firestore';

// Mock de dependencias
const mockedNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useLocation: () => ({
        state: { origen: 'A', destino: 'B', dia: 'Hoy' }
    }),
    useNavigate: () => mockedNavigate,
}));

jest.mock('../firebase-config', () => ({ db: {} }));

// Mock de Firestore con datos de prueba
jest.mock('firebase/firestore', () => ({
    doc: jest.fn(),
    getDoc: jest.fn()
}));

describe('Horarios - Pruebas de Backend (Lógica de Datos)', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Debe consultar a Firestore para obtener la configuración de horarios', async () => {
        // Configuramos el mock para devolver datos vacios
        getDoc.mockResolvedValue({ exists: () => true, data: () => ({ horarios: {} }) });

        render(
            <BrowserRouter>
                <Horarios />
            </BrowserRouter>
        );

        await waitFor(() => {
            // Verificamos que se haya intentado leer la base de datos
            expect(getDoc).toHaveBeenCalled();
        });
    });

    test('Al seleccionar un viaje, debe navegar a /asientos con los datos correctos', async () => {
        // Configuracion: Simulamos que la BD devuelve un viaje con asientos ocupados
        const mockViaje = { 
            horario: '15:00', 
            precio: '8000', 
            asientosOcupados: '1, 5, 10' 
        };

        getDoc.mockResolvedValue({
            exists: () => true,
            data: () => ({
                horarios: {
                    'A-B': [mockViaje] // La clave es "Origen-Destino"
                }
            })
        });

        render(
            <BrowserRouter>
                <Horarios />
            </BrowserRouter>
        );

        // Esperamos a que se renderice el boton
        await waitFor(() => screen.getByText('15:00'));

        // Accion: El usuario selecciona el viaje
        const btnSeleccionar = screen.getByText('Seleccionar');
        fireEvent.click(btnSeleccionar);

        // Validacion: ¿Navego a la pantalla correcta con los datos correctos?
        expect(mockedNavigate).toHaveBeenCalledWith('/asientos', {
            state: {
                origen: 'A',
                destino: 'B',
                dia: 'Hoy',
                horario: '15:00',
                precio: '8000',
                ocupados: '1, 5, 10' // Verifica que pase la lista de ocupados
            }
        });
    });
});