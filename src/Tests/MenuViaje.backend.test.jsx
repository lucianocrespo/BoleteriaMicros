import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MenuViaje from '../Usuario/MenuViaje';
// Importamos la funcion real para poder mockearla correctamente
import { signOut } from 'firebase/auth';

// Mock de dependencias
jest.mock('../firebase-config', () => ({ 
    auth: {} // El objeto auth puede estar vacio porque signOut es independiente
}));

jest.mock('firebase/auth', () => ({
  // Mockeamos la funcion independiente signOut
  signOut: jest.fn(),
  getAuth: jest.fn()
}));

const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedNavigate,
}));

describe('MenuViaje - Pruebas de Backend (Gestión de Sesión)', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Debe cerrar la sesión en Firebase y redirigir al Login', async () => {
    // Simulamos que signOut se resuelve exitosamente
    signOut.mockResolvedValue();

    render(
      <BrowserRouter>
        <MenuViaje />
      </BrowserRouter>
    );

    // Simular clic en "Cerrar Sesión"
    const btnLogout = screen.getByText(/Cerrar Sesión/i);
    fireEvent.click(btnLogout);

    // Validaciones
    await waitFor(() => {
        // Verificar que se llamo a la funcion independiente signOut
        expect(signOut).toHaveBeenCalled();
        
        // Verificar que se redirigio a la ruta raiz ('/') que es el Login
        expect(mockedNavigate).toHaveBeenCalledWith('/');
    });
  });
});