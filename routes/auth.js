const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
require('dotenv').config();

const router = express.Router();

// Middleware de autenticación
const authenticateToken = async (req, res, next) => {
  try {
    // Obtener el token del header de autorización
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
    }
    
    // Verificar el token
jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Token inválido o expirado.' });
      }
      
      req.user = user;
      next();
    });
  } catch (error) {
    console.error('Error en autenticación:', error);
    res.status(500).json({ error: 'Error en el servidor durante la autenticación.' });
  }
};

// Ruta para registro de usuarios
router.post('/registro', async (req, res) => {
  try {
    const { email, password, nombre } = req.body;
    
    // Validar datos
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos.' });
    }
    
    // Verificar si el usuario ya existe
    const existingUsers = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    
    if (existingUsers.rows.length > 0) {
      return res.status(400).json({ error: 'El email ya está registrado.' });
    }
    
    // Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Insertar el nuevo usuario
    const result = await pool.query(
      'INSERT INTO usuarios (email, password, nombre) VALUES ($1, $2, $3) RETURNING id',
      [email, hashedPassword, nombre || email.split('@')[0]] // Si no hay nombre, usa la parte del email antes de @
    );
    
    const newUserId = result.rows[0].id;

    // Generar token JWT
    const token = jwt.sign({ id: newUserId, email, nombre }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    res.status(200).json({
      mensaje: 'Usuario registrado exitosamente',
      token,
      usuario: {
        id: newUserId,
        email,
        nombre
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error en el servidor durante el registro.' });
  }
});

// Ruta para login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validar datos
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos.' });
    }
    
    // Buscar el usuario
    const { rows } = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    
    if (rows.length === 0) {
      return res.status(400).json({ error: 'Email o contraseña incorrectos.' });
    }
    
    const user = rows[0];
    
    // Verificar la contraseña
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(400).json({ error: 'Email o contraseña incorrectos.' });
    }
    
    // Generar token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, nombre: user.nombre },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    res.json({
      mensaje: 'Inicio de sesión exitoso',
      token,
      usuario: {
        id: user.id,
        email: user.email,
        nombre: user.nombre
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error en el servidor durante el login.' });
  }
});

// Ruta para obtener datos del usuario autenticado
router.get('/usuario', authenticateToken, async (req, res) => {
  try {
    // Obtener el usuario de la base de datos (sin incluir la contraseña)
    const { rows } = await pool.query(
      'SELECT id, email, nombre, created_at FROM usuarios WHERE id = $1',
      [req.user.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    
    res.json({
      usuario: rows[0]
    });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ error: 'Error en el servidor al obtener datos del usuario.' });
  }
});

module.exports = router;