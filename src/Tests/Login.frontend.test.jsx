import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Login from '../Login';

// MOCK (Simulacion) de Firebase y navegacion (evita que el test intente conectarse a la base de datos real)
jest.mock('../firebase-config', () => ({
  auth: {},
  db: {}
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  signInWithEmailAndPassword: jest.fn() // Simulamos la funcion de login
}));

// Mock de useNavigate para ver si redirige bien
const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedNavigate,
}));

describe('Componente Login', () => {
  
  // Antes de cada test, renderizamos el componente
  beforeEach(() => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
  });

  test('Debe renderizar el formulario de inicio de sesión correctamente', () => {
    // Verificamos que el titulo exista
    expect(screen.getByText(/Iniciar Sesión/i)).toBeInTheDocument();
    
    // Verificamos que los inputs existan
    expect(screen.getByPlaceholderText(/Ingrese su email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ingrese su contraseña/i)).toBeInTheDocument();
    
    // Verificamos que el boton de entrar exista
    expect(screen.getByRole('button', { name: /Entrar/i })).toBeInTheDocument();
  });

  test('Debe mostrar error si se intenta entrar con campos vacíos', () => {
    // Simulamos clic en el boton "Entrar" sin llenar nada
    const botonEntrar = screen.getByRole('button', { name: /Entrar/i });
    fireEvent.click(botonEntrar);

    // Esperamos ver el mensaje de error
    expect(screen.getByText(/Por favor, complete todos los campos/i)).toBeInTheDocument();
  });

  test('Debe permitir escribir en los inputs', () => {
    const inputEmail = screen.getByPlaceholderText(/Ingrese su email/i);
    
    // Simulamos que el usuario escribe
    fireEvent.change(inputEmail, { target: { value: 'usuario@test.com' } });
    
    // Verificamos que el valor cambio
    expect(inputEmail.value).toBe('usuario@test.com');
  });
});