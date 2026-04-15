import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MisBoletos from '../Usuario/MisBoletos';
// Importamos funciones reales para espiarlas
import { deleteDoc, updateDoc, getDoc, getDocs } from 'firebase/firestore';

// Mocks de Configuracion
jest.mock('../firebase-config', () => ({
    auth: { currentUser: { uid: 'user-backend-test' } },
    db: {}
}));

// Mock de Firestore
jest.mock('firebase/firestore', () => ({
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    // Mockeamos doc para que devuelva un valor y no undefined
    doc: jest.fn(() => 'ref-doc-simulada'),
    deleteDoc: jest.fn(),
    updateDoc: jest.fn(),
    getDoc: jest.fn(),
    getDocs: jest.fn()
}));

describe('Mis Boletos - Pruebas de Backend (Integración y Cancelación)', () => {

    beforeEach(() => {
        // Limpiamos historial y comportamiento
        jest.resetAllMocks();
        
        // RE-CONFIGURAMOS LOS MOCKS NECESARIOS
        
        // Restaurar el comportamiento de 'doc'
        const { doc } = require('firebase/firestore');
        doc.mockImplementation(() => 'ref-doc-simulada');
        
        // Restaurar window.confirm para que diga "SÍ" automaticamente
        window.confirm = jest.fn(() => true);
        window.alert = jest.fn(); // Silenciar alertas
    });

    test('Debe eliminar el boleto y liberar el asiento al cancelar', async () => {
        // PREPARACION DE DATOS (Mocks)
        const mockBoleto = {
            id: 'boleto-cancelar-id',
            data: () => ({
                origen: 'A', 
                destino: 'B', 
                dia: '2099-12-31', // Fecha futura para habilitar boton
                horario: '10:00', 
                asiento: 5
            })
        };
        // Simulamos que hay boletos
        getDocs.mockResolvedValue({ docs: [mockBoleto] });

        // Simulamos que existe el viaje en la configuracion de horarios
        getDoc.mockResolvedValue({
            exists: () => true,
            data: () => ({
                horarios: {
                    'A-B': [{ 
                        horario: '10:00', 
                        asientosOcupados: '5, 6' // El 5 esta ocupado
                    }]
                }
            })
        });

        // RENDERIZADO
        render(<BrowserRouter><MisBoletos /></BrowserRouter>);

        // Esperamos a que cargue el boleto
        await waitFor(() => screen.getByText('ID: boleto-cancelar-id'));

        // INTERACCION
        const btnCancelar = screen.getByText(/Cancelar Boleto/i);
        fireEvent.click(btnCancelar);

        await waitFor(() => {
            // Verifica que window.confirm fue llamado
            expect(window.confirm).toHaveBeenCalled();

            // Verifica que se borro el documento del boleto
            // deleteDoc recibe lo que retorna doc() -> 'ref-doc-simulada'
            expect(deleteDoc).toHaveBeenCalledWith('ref-doc-simulada');

            // Verifica que se leyo la configuracion de horarios
            expect(getDoc).toHaveBeenCalled();

            // Verifica que se actualizo el inventario liberando el asiento 5
            expect(updateDoc).toHaveBeenCalledWith(
                'ref-doc-simulada',
                expect.objectContaining({
                    horarios: expect.objectContaining({
                        'A-B': expect.arrayContaining([
                            expect.objectContaining({
                                horario: '10:00',
                                // Verificamos que '5' ya no este en el string, solo '6'
                                asientosOcupados: expect.not.stringContaining('5') 
                            })
                        ])
                    })
                })
            );
        });
    });
});