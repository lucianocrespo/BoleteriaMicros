// Importamos TextEncoder y TextDecoder del modulo 'util' de Node.js
import { TextEncoder, TextDecoder } from 'util';

// Los asignamos al objeto global para que Firebase los encuentre
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Importamos las utilidades de testing
import '@testing-library/jest-dom';