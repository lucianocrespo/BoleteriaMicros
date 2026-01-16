import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Registro from '../Registro';

// Mockeamos las dependencias de backend para que no interfieran.
jest.mock('../firebase-config', () => ({ auth: {}, db: {} }));
jest.mock('firebase/auth', () => ({ getAuth: jest.fn() }));
jest.mock('firebase/firestore', () => ({ doc: jest.fn(), setDoc: jest.fn() }));

describe('Registro - Pruebas de Frontend (Interfaz)', () => {

  test('Debe renderizar todos los campos del formulario correctamente', () => {
    render(<BrowserRouter><Registro /></BrowserRouter>);

    // Verificamos elementos visuales
    expect(screen.getByRole('heading', { name: /Registrarse/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/nombre completo/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ingrese su Mail/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ingrese un usuario/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Registrarse$/i })).toBeInTheDocument();
  });

  test('Debe mostrar alerta visual si se intenta enviar vacío (Validación UI)', () => {
    render(<BrowserRouter><Registro /></BrowserRouter>);

    const btnRegistrar = screen.getByRole('button', { name: /^Registrarse$/i });
    fireEvent.click(btnRegistrar);

    // Verificamos que aparezca el mensaje de error en la UI
    expect(screen.getByText(/Por favor, complete todos los campos/i)).toBeInTheDocument();
    expect(screen.getByText(/Por favor, complete todos los campos/i)).toHaveClass('error-message');
  });

  test('Los inputs deben permitir escribir (Interacción Básica)', () => {
    render(<BrowserRouter><Registro /></BrowserRouter>);

    const inputNombre = screen.getByPlaceholderText(/nombre completo/i);
    fireEvent.change(inputNombre, { target: { value: 'Usuario Test' } });

    expect(inputNombre.value).toBe('Usuario Test');
  });
});