import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Viajar from '../Usuario/Viajar';

// Mock de Firebase (para que no intente conectarse a la BD real)
jest.mock('../firebase-config', () => ({
  db: {}
}));

// Mock de Firestore (simulamos la respuesta de la BD)
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(() => Promise.resolve({
    exists: () => true,
    data: () => ({
      lista: ['Trenque Lauquen', 'Buenos Aires'] 
    })
  }))
}));

// Mock de navegacion (para ver si intenta cambiar de pagina)
const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedNavigate,
}));

describe('Componente Viajar (Buscador)', () => {

  test('Debe validar que no se pueda buscar con campos vacíos', () => {
    render(
      <BrowserRouter>
        <Viajar />
      </BrowserRouter>
    );

    // Buscamos el boton y hacemos clic sin llenar nada
    const botonBuscar = screen.getByText('Buscar'); 
    fireEvent.click(botonBuscar);

    // Verifica que aparezca el mensaje de error de campos incompletos
    expect(screen.getByText(/Por favor, complete todos los campos/i)).toBeInTheDocument();
    
    // Verifica que no se haya navegado a otra pagina
    expect(mockedNavigate).not.toHaveBeenCalled();
  });

  test('Debe validar que no se pueda viajar al pasado', () => {
    render(
      <BrowserRouter>
        <Viajar />
      </BrowserRouter>
    );

    // Llenamos Origen y Destino para que eso no de error
    const inputOrigen = screen.getByPlaceholderText(/Ciudad de origen/i);
    const inputDestino = screen.getByPlaceholderText(/Ciudad de destino/i);

    fireEvent.change(inputOrigen, { target: { value: 'Trenque Lauquen' } });
    fireEvent.change(inputDestino, { target: { value: 'Buenos Aires' } });
    
    // Calculamos una fecha pasada (ayer)
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    const fechaAyer = ayer.toISOString().split('T')[0];

    // Buscamos el input de fecha por su etiqueta "Día:"
    const inputFecha = screen.getByLabelText(/Día/i); 
    
    // Escribimos la fecha pasada
    fireEvent.change(inputFecha, { target: { value: fechaAyer } });

    // Intentamos buscar
    const botonBuscar = screen.getByText('Buscar');
    fireEvent.click(botonBuscar);

    // Verificamos que aparezca el error de fecha
    expect(screen.getByText(/Elija una fecha válida/i)).toBeInTheDocument();
  });
});