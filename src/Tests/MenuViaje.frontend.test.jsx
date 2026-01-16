import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import MenuViaje from '../Usuario/MenuViaje';

// Mockeamos la navegacion y las dependencias de Firebase
const mockedNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedNavigate,
}));

jest.mock('../firebase-config', () => ({ auth: {} }));
jest.mock('firebase/auth', () => ({ signOut: jest.fn() }));

describe('MenuViaje - Pruebas de Frontend (Interfaz y Navegación)', () => {

  beforeEach(() => {
    mockedNavigate.mockClear();
    render(
      <BrowserRouter>
        <MenuViaje />
      </BrowserRouter>
    );
  });

  test('Debe renderizar el mensaje de bienvenida y los botones principales', () => {
    // Verificamos textos clave
    expect(screen.getByText(/¡Bienvenido a tu lugar de viajes!/i)).toBeInTheDocument();
    
    // Verificamos que existan los botones de accion
    expect(screen.getByRole('button', { name: /^Viajar$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Mis Boletos/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cerrar Sesión/i })).toBeInTheDocument();
  });

  test('El botón "Viajar" debe navegar a la pantalla de búsqueda', () => {
    const btnViajar = screen.getByRole('button', { name: /^Viajar$/i });
    fireEvent.click(btnViajar);

    // Verificamos la redireccion
    expect(mockedNavigate).toHaveBeenCalledWith('/viajar');
  });

  test('El botón "Mis Boletos" debe navegar al historial', () => {
    const btnBoletos = screen.getByRole('button', { name: /Mis Boletos/i });
    fireEvent.click(btnBoletos);

    // Verificamos la redireccion
    expect(mockedNavigate).toHaveBeenCalledWith('/MisBoletos');
  });
});