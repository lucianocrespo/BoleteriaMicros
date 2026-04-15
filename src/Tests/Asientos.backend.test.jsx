import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Asientos from '../Usuario/Asientos';
import { getDoc, updateDoc } from 'firebase/firestore';

// Mock de dependencias
const mockedNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockedNavigate,
    useLocation: () => ({
        state: { 
            origen: 'Pehuajo', 
            destino: 'Buenos Aires', 
            dia: '2024-12-25', 
            horario: '08:00',
            ocupados: "1, 2" // Estado inicial visual
        }
    }),
}));

jest.mock('../firebase-config', () => ({ db: {} }));

// Mock de funciones de Firestore
jest.mock('firebase/firestore', () => ({
    // Hacemos que doc devuelva un string cualquiera en lugar de undefined
    doc: jest.fn(() => 'doc-ref-simulado'), 
    getDoc: jest.fn(),
    updateDoc: jest.fn()
}));

// Mock de alert para que no rompa el test
window.alert = jest.fn();

describe('Asientos - Pruebas de Backend (Lógica de Reserva)', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Debe reservar el asiento en Firestore y navegar a Pago', async () => {
        // CONFIGURACION DEL MOCK DE BASE DE DATOS
        const mockViaje = { 
            horario: '08:00', 
            asientosOcupados: '1, 2' 
        };
        
        getDoc.mockResolvedValue({
            exists: () => true,
            data: () => ({
                horarios: {
                    'Pehuajo-Buenos Aires': [mockViaje]
                }
            })
        });

        render(
            <BrowserRouter>
                <Asientos />
            </BrowserRouter>
        );

        // INTERACCION DEL USUARIO
        const asiento3 = screen.getByText('3');
        fireEvent.click(asiento3);

        const btnContinuar = screen.getByText(/Confirmar Asiento/i);
        fireEvent.click(btnContinuar);

        // VALIDACIONES DE BACKEND
        await waitFor(() => {
            // Verifica que se leyo la configuracion actualizada
            expect(getDoc).toHaveBeenCalled();

            // Verifica que se llamo a updateDoc
            expect(updateDoc).toHaveBeenCalledWith(
                // Ahora esperamos 'doc-ref-simulado' o anything
                expect.anything(), 
                expect.objectContaining({
                    horarios: expect.objectContaining({
                        'Pehuajo-Buenos Aires': expect.arrayContaining([
                            expect.objectContaining({
                                horario: '08:00',
                                // Verificamos que el string contenga el nuevo asiento "3"
                                asientosOcupados: expect.stringContaining('3') 
                            })
                        ])
                    })
                })
            );

            // Verifica la navegacion
            expect(mockedNavigate).toHaveBeenCalledWith('/pago', expect.objectContaining({
                state: expect.objectContaining({
                    asiento: 3
                })
            }));
        });
    });

    test('Debe detectar conflicto (Race Condition) si alguien ocupó el asiento antes', async () => {
        // CONFIGURACION DEL MOCK DE "MALA SUERTE"
        const mockViajeActualizado = { 
            horario: '08:00', 
            asientosOcupados: '1, 2, 3' // El 3 ya está ocupado en la BD
        };
        
        getDoc.mockResolvedValue({
            exists: () => true,
            data: () => ({
                horarios: {
                    'Pehuajo-Buenos Aires': [mockViajeActualizado]
                }
            })
        });

        render(
            <BrowserRouter>
                <Asientos />
            </BrowserRouter>
        );

        // INTENTO DE SELECCION
        const asiento3 = screen.getByText('3');
        fireEvent.click(asiento3);

        const btnContinuar = screen.getByText(/Confirmar Asiento/i);
        fireEvent.click(btnContinuar);

        // VALIDACION DE ERROR
        await waitFor(() => {
            // Verifica alerta
            expect(window.alert).toHaveBeenCalledWith(expect.stringMatching(/ocupado por otra persona/i));
            
            // Verifica que no se actualizo la base de datos
            expect(updateDoc).not.toHaveBeenCalled();
            
            // Verifica que no navego
            expect(mockedNavigate).not.toHaveBeenCalled();
        });
    });
});