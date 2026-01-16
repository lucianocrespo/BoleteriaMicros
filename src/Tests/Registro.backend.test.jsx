import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Registro from '../Registro';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc } from 'firebase/firestore';

// Mocks de dependencias
jest.mock('../firebase-config', () => ({ auth: {}, db: {} }));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  createUserWithEmailAndPassword: jest.fn()
}));

jest.mock('firebase/firestore', () => ({
  // 'doc' devuelve un string para que setDoc no reciba undefined
  doc: jest.fn(() => 'ref-documento-simulada'), 
  setDoc: jest.fn()
}));

// Mock de navegacion
const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedNavigate,
}));

describe('Registro - Pruebas de Backend (Integración de Datos)', () => {

  // Usamos resetAllMocks para borrar historial Y comportamientos previos
  beforeEach(() => {
    jest.resetAllMocks();
    
    // Restauramos el comportamiento base de doc() porque resetAllMocks lo borra
    const { doc } = require('firebase/firestore');
    doc.mockImplementation(() => 'ref-documento-simulada');
  });

  test('Debe llamar a Firebase Auth y Firestore con los datos correctos', async () => {
    // Configuracion para exito
    createUserWithEmailAndPassword.mockResolvedValue({
      user: { uid: 'uid-backend-123', email: 'backend@test.com' }
    });
    setDoc.mockResolvedValue(); 

    render(<BrowserRouter><Registro /></BrowserRouter>);

    // Llenar formulario
    fireEvent.change(screen.getByPlaceholderText(/nombre completo/i), { target: { value: 'Backend User' } });
    fireEvent.change(screen.getByPlaceholderText(/Ingrese su Mail/i), { target: { value: 'backend@test.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Ingrese un usuario/i), { target: { value: 'backuser' } });
    fireEvent.change(screen.getByPlaceholderText(/contraseña/i), { target: { value: '123456' } });

    // Click en Registrarse
    fireEvent.click(screen.getByRole('button', { name: /^Registrarse$/i }));

    // Validaciones
    await waitFor(() => {
        expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
            expect.anything(), 
            'backend@test.com', 
            '123456'
        );
    });

    await waitFor(() => {
        expect(setDoc).toHaveBeenCalledWith(
            'ref-documento-simulada', // Ahora esperamos el valor del mock de doc
            expect.objectContaining({
                uid: 'uid-backend-123',
                nombre: 'Backend User',
                usuario: 'backuser',
                esAdmin: false
            })
        );
    });
    
    expect(mockedNavigate).toHaveBeenCalledWith('/MenuViaje');
  });

  test('Debe manejar errores de servidor (ej: Email ya en uso)', async () => {
    // Configuracion para error
    const errorFirebase = { code: 'auth/email-already-in-use' };
    createUserWithEmailAndPassword.mockRejectedValue(errorFirebase);

    render(<BrowserRouter><Registro /></BrowserRouter>);

    // Llenar formulario (datos minimos para pasar validacion visual)
    fireEvent.change(screen.getByPlaceholderText(/nombre completo/i), { target: { value: 'A' } });
    fireEvent.change(screen.getByPlaceholderText(/Ingrese su Mail/i), { target: { value: 'duplicado@test.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Ingrese un usuario/i), { target: { value: 'A' } });
    fireEvent.change(screen.getByPlaceholderText(/contraseña/i), { target: { value: '123456' } });

    // Click en Registrarse
    fireEvent.click(screen.getByRole('button', { name: /^Registrarse$/i }));

    // Validar que aparecio el error en pantalla
    await waitFor(() => {
        expect(screen.getByText(/correo electrónico ya está registrado/i)).toBeInTheDocument();
    });
    
    // Validar que setDoc no se llamo
    expect(setDoc).not.toHaveBeenCalled();
  });
});