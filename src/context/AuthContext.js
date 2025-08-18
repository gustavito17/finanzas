import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

// Define base URL for axios
const API_URL = process.env.REACT_APP_API_URL;
console.log('API URL being used:', API_URL);
axios.defaults.baseURL = API_URL;
axios.defaults.timeout = 60000; // Timeout global de 30 segundos

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    axios.defaults.baseURL = API_URL;
    
    
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      checkAuthStatus();
    } else {
      setIsLoading(false);
    }
  }, []);

  // Verificar el estado de autenticación
  const checkAuthStatus = async () => {
    try {
      const response = await axios.get('/api/auth/usuario');
      setUser(response.data.usuario);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error al verificar autenticación:', error);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setIsLoading(false);
    }
  };

  // Función para iniciar sesión - Fix the endpoint URL
  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', {
        email,
        password
      }, {
        timeout: 60000, // Aumentar a 30 segundos
        headers: {
          'Content-Type': 'application/json'
        }
      });
  
      if (response.data.token) {
        setUser(response.data.usuario);
        setIsAuthenticated(true);
        localStorage.setItem('token', response.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        return { success: true };
      }
    } catch (error) {
      console.error('Login error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      // Mejor manejo de errores de timeout
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        return { 
          success: false, 
          message: 'El servidor está tardando en responder. Por favor, intenta de nuevo en unos momentos.'
        };
      }
      
      return { 
        success: false, 
        message: error.response?.data?.error || 'Error en la conexión'
      };
    }
  };

  // Función para registrarse
  const register = async (email, password, nombre) => {
    try {
      const response = await axios.post('/api/auth/registro', {
        email,
        password,
        nombre
      }, {
        timeout: 60000, // Aumentar timeout también aquí
        headers: {
          'Content-Type': 'application/json'
        }
      });
  
      if (response.data.token) {
        setUser(response.data.usuario);
        setIsAuthenticated(true);
        localStorage.setItem('token', response.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        return { success: true };
      }
    } catch (error) {
      console.error('Register error:', error);
      
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        return { 
          success: false, 
          message: 'El servidor está tardando en responder. Por favor, intenta de nuevo en unos momentos.'
        };
      }
      
      return { 
        success: false, 
        message: error.response?.data?.error || 'Error en el registro'
      };
    }
  };

  // Función para solicitar recuperación de contraseña (simplificada)
  const requestPasswordRecovery = async (email) => {
    // Ya no se utiliza, pero se mantiene para compatibilidad
    console.log(`Solicitud de recuperación para: ${email}`);
    return { 
      success: true, 
      message: 'Por favor, contacta directamente a tecnologygaas@gmail.com para recuperar tu contraseña.'
    };
  };

  // Función para cerrar sesión
  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
  };
  
  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    requestPasswordRecovery
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};