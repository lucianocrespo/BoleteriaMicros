import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../Login';
// Importamos las funciones reales para mockearlas
import { signInWithEmailAndPassword } from 'firebase/auth';
import { getDoc } from 'firebase/firestore';

// Mock de dependencias de Firebase
jest.mock('../firebase-config', () => ({ auth: {}, db: {} }));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  signInWithEmailAndPassword: jest.fn()
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn()
}));

// Mock de navegacion
const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedNavigate,
}));

describe('Login - Pruebas de Backend (Autenticación y Roles)', () => {

  beforeEach(() => {
    jest.clearAllMocks(); // Limpiamos los mocks antes de cada test
  });

  test('Debe redirigir al /MenuViaje si es un usuario NORMAL', async () => {
    // Configurar Mocks para exito
    // Auth exitoso
    signInWithEmailAndPassword.mockResolvedValue({
      user: { uid: 'user-normal-123' }
    });

    // Firestore devuelve un usuario que no es admin
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ esAdmin: false, nombre: 'Pepe' })
    });

    render(<BrowserRouter><Login /></BrowserRouter>);

    // Simular interaccion
    fireEvent.change(screen.getByPlaceholderText(/Ingrese su email/i), { target: { value: 'user@test.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Ingrese su contraseña/i), { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Entrar/i }));

    // Validaciones
    await waitFor(() => {
        // Verifica que se llamo a Auth
        expect(signInWithEmailAndPassword).toHaveBeenCalled();
        // Verifica que se consultó a la base de datos por el rol
        expect(getDoc).toHaveBeenCalled();
        // Verifica la redireccion correcta
        expect(mockedNavigate).toHaveBeenCalledWith('/MenuViaje');
    });
  });

  test('Debe redirigir al /PanelAdmin si es un ADMINISTRADOR', async () => {
    // Configurar Mocks para admin
    signInWithEmailAndPassword.mockResolvedValue({
      user: { uid: 'admin-123' }
    });

    // Firestore devuelve esAdmin: true
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ esAdmin: true, nombre: 'Admin' })
    });

    render(<BrowserRouter><Login /></BrowserRouter>);

    // Simular interaccion
    fireEvent.change(screen.getByPlaceholderText(/Ingrese su email/i), { target: { value: 'admin@test.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Ingrese su contraseña/i), { target: { value: 'admin123' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Entrar/i }));

    // Validaciones
    await waitFor(() => {
        expect(mockedNavigate).toHaveBeenCalledWith('/PanelAdmin');
    });
  });

  test('Debe manejar errores de autenticación (Credenciales incorrectas)', async () => {
    // Configurar Mock para error
    const errorFirebase = { code: 'auth/wrong-password' };
    signInWithEmailAndPassword.mockRejectedValue(errorFirebase);

    render(<BrowserRouter><Login /></BrowserRouter>);

    fireEvent.change(screen.getByPlaceholderText(/Ingrese su email/i), { target: { value: 'user@test.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Ingrese su contraseña/i), { target: { value: 'malapassword' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Entrar/i }));

    // Validar que aparezca el mensaje de error en pantalla
    await waitFor(() => {
        expect(screen.getByText(/Credenciales incorrectas/i)).toBeInTheDocument();
    });

    // Asegurar que no navego a ningun lado
    expect(mockedNavigate).not.toHaveBeenCalled();
  });
});