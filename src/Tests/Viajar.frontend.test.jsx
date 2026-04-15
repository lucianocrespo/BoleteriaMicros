import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Viajar from '../Usuario/Viajar';

// Mock de Firebase (Para que no intente conectarse y falle el renderizado)
jest.mock('../firebase-config', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(() => Promise.resolve({
    exists: () => true,
    data: () => ({
      lista: ['Trenque Lauquen', 'Buenos Aires'] // Simulamos que cargan ciudades
    })
  }))
}));

// Mock de Navegacion
const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedNavigate,
}));

describe('Viajar - Pruebas de Frontend (Interfaz y Validaciones)', () => {

  test('Debe renderizar el título y los campos del formulario', async () => {
    render(
      <BrowserRouter>
        <Viajar />
      </BrowserRouter>
    );

    // Esperamos a que el useEffect termine
    await waitFor(() => expect(screen.getByText('Buscar Viaje')).toBeInTheDocument());

    // Verificamos inputs
    expect(screen.getByPlaceholderText(/Ciudad de origen/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ciudad de destino/i)).toBeInTheDocument();
    
    // Verificamos botones
    expect(screen.getByRole('button', { name: /^Buscar$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Volver/i })).toBeInTheDocument();
  });

  test('Debe mostrar mensaje de error si los campos están vacíos', async () => {
    render(<BrowserRouter><Viajar /></BrowserRouter>);
    
    await waitFor(() => screen.getByText('Buscar Viaje'));

    // Clic en buscar sin llenar nada
    fireEvent.click(screen.getByText('Buscar'));

    // Verificamos el mensaje de error en la UI
    expect(screen.getByText(/Por favor, complete todos los campos/i)).toBeInTheDocument();
    // Verificamos que tiene la clase de estilo de error
    expect(screen.getByText(/Por favor, complete todos los campos/i)).toHaveClass('error-message');
  });

  test('Debe mostrar error si se elige una fecha pasada', async () => {
    render(<BrowserRouter><Viajar /></BrowserRouter>);
    
    await waitFor(() => screen.getByText('Buscar Viaje'));

    // Llenamos origen y destino para que no falle esa validacion
    fireEvent.change(screen.getByPlaceholderText(/Ciudad de origen/i), { target: { value: 'A' } });
    fireEvent.change(screen.getByPlaceholderText(/Ciudad de destino/i), { target: { value: 'B' } });

    // Ponemos fecha de ayer
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    const fechaAyer = ayer.toISOString().split('T')[0];

    // Buscamos el input date por su label "Día:"
    const inputFecha = screen.getByLabelText(/Día/i); 
    fireEvent.change(inputFecha, { target: { value: fechaAyer } });

    fireEvent.click(screen.getByText('Buscar'));

    // Verificamos mensaje de error de fecha
    expect(screen.getByText(/Elija una fecha válida/i)).toBeInTheDocument();
  });
});