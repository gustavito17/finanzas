import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css'; // Importamos el nuevo archivo CSS

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Estado para mostrar/ocultar contraseña
  const [showPassword, setShowPassword] = useState(false);
  
  // Estados para recuperación de contraseña
  const [showRecoveryInfo, setShowRecoveryInfo] = useState(false);
  
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Redirigir si ya está autenticado
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const result = await login(email, password);
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Error al iniciar sesión. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const toggleRecoveryInfo = () => {
    setShowRecoveryInfo(!showRecoveryInfo);
  };

  // Función para alternar la visibilidad de la contraseña
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {!showRecoveryInfo ? (
          <>
            <h1 className="login-title">Iniciar Sesión</h1>
            
            {error && <div className="login-alert">{error}</div>}
            
            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  className="login-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="password">Contraseña</label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    className="login-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="button" 
                    className="toggle-password-btn"
                    onClick={togglePasswordVisibility}
                  >
                    <i className={showPassword ? "bi bi-eye-slash" : "bi bi-eye"}></i>
                  </button>
                </div>
              </div>
              
              <button 
                type="submit" 
                className="login-button" 
                disabled={loading}
              >
                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </button>
            </form>
            
            <p className="login-register-link">
              ¿No tienes una cuenta? <Link to="/registro">Regístrate aquí</Link>
            </p>
            
            <p className="login-register-link">
              <a href="#" onClick={(e) => {
                e.preventDefault();
                toggleRecoveryInfo();
              }}>
                ¿Olvidaste tu contraseña?
              </a>
            </p>
          </>
        ) : (
          <>
            <h1 className="login-title">¿Olvidaste tu contraseña?</h1>
            
            <div className="recovery-info">
              <p className="recovery-description">
                Para recuperar tu contraseña, por favor contacta directamente a nuestro equipo de soporte:
              </p>
              
              <div className="support-contact">
                <p><strong><i className="bi bi-envelope"></i> Email de soporte:</strong></p>
                <a href="mailto:tecnologygaas@gmail.com" className="support-email-link">
                  tecnologygaas@gmail.com
                </a>
              </div>
              
              <p className="recovery-note">
                Incluye tu nombre de usuario y correo electrónico registrado en tu mensaje para que podamos ayudarte más rápido.
              </p>
            </div>
            
            <p className="login-register-link">
              <a href="#" onClick={(e) => {
                e.preventDefault();
                toggleRecoveryInfo();
              }}>
                Volver a Iniciar Sesión
              </a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default Login;