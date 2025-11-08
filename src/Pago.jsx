import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Pago.css';

function Pago() {
    const location = useLocation();
    const navigate = useNavigate();
    const { origen, destino, dia, horario, asiento } = location.state || {};

    const [nombre, setNombre] = useState('');
    const [numeroTarjeta, setNumeroTarjeta] = useState('');
    const [fechaExpiracion, setFechaExpiracion] = useState('');
    const [codigoSeguridad, setCodigoSeguridad] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        setMensaje('');

        // Lógica simulada de pago
        // (Aca es donde más tarde haríamos el setDoc para guardar la reserva)
        
        setTimeout(() => {
            // El mensaje de éxito se muestra brevemente
            setMensaje('¡Pago realizado con éxito! Redirigiendo...'); 
            setLoading(false);
            
            // Redirige después de que el mensaje de éxito es visible
            setTimeout(() => {
                navigate('/MenuViaje'); 
            }, 1000); 

        }, 2000); // Simula el tiempo de procesamiento de pago
    };

    return (
        <div className="pago-container">
            <div className="pago-card">
                <h2>Formulario de Pago</h2>
                
                <div className="resumen-viaje">
                    <h4>Detalles del Viaje</h4>
                    <p>
                        Origen: <strong>{origen || 'N/A'}</strong><br />
                        Destino: <strong>{destino || 'N/A'}</strong><br />
                        Día: <strong>{dia || 'N/A'}</strong><br />
                        Horario: <strong>{horario || 'N/A'}</strong><br />
                        Asiento: <strong>{asiento || 'N/A'}</strong>
                    </p>
                </div>
                
                {mensaje && <div className={`mensaje-pago ${mensaje.includes('éxito') ? 'success' : 'error'}`}>{mensaje}</div>}
                
                <form className="pago-form" onSubmit={handleSubmit}>
                    <label>
                        Nombre en la tarjeta:
                        <input
                            type="text"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            required
                            placeholder="Nombre del titular"
                        />
                    </label>
                    <label>
                        Número de tarjeta:
                        <input
                            type="text"
                            value={numeroTarjeta}
                            onChange={(e) => setNumeroTarjeta(e.target.value)}
                            required
                            placeholder="xxxx xxxx xxxx xxxx"
                            maxLength="19"
                        />
                    </label>
                    
                    <div className="grid-2-cols">
                        <label>
                            Fecha de expiración:
                            <input
                                type="month"
                                value={fechaExpiracion}
                                onChange={(e) => setFechaExpiracion(e.target.value)}
                                required
                            />
                        </label>
                        <label>
                            Código de seguridad (CVV):
                            <input
                                type="text"
                                value={codigoSeguridad}
                                onChange={(e) => setCodigoSeguridad(e.target.value)}
                                required
                                placeholder="CVV"
                                maxLength="4"
                            />
                        </label>
                    </div>
                    
                    <div className="pago-actions">
                        <button type="submit" className="btn-pagar" disabled={loading}>
                            {loading ? 'Procesando Pago...' : 'Realizar Pago'}
                        </button>
                        <button type="button" className="btn-volver" onClick={() => navigate(-1)} disabled={loading}>
                            Volver
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Pago;