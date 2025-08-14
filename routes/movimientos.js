const express = require('express');
const jwt = require('jsonwebtoken'); // Agregar esta línea
const { pool } = require('../db');
const router = express.Router();

// Middleware de autenticación - Reutilizando el existente
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

// GET /movimientos - Obtener todos los movimientos del usuario
router.get('/', authenticateToken, async (req, res) => {
  try {
    const usuario_id = req.user.id; // Obtenemos el ID del usuario del token
    
    const { rows } = await pool.query(
      'SELECT * FROM movimientos WHERE usuario_id = $1 ORDER BY fecha DESC',
      [usuario_id]
    );
    
    res.json({ movimientos: rows });
  } catch (error) {
    console.error('Error al obtener movimientos:', error);
    res.status(500).json({ error: 'Error en el servidor al obtener los movimientos.' });
  }
});

// POST /movimientos - Crear un nuevo movimiento
router.post('/', authenticateToken, async (req, res) => {
  try {
    const usuario_id = req.user.id; // Obtenemos el ID del usuario del token
    const { tipo, monto, descripcion } = req.body;
    
    // Validación de datos
    if (!tipo || !monto) {
      return res.status(400).json({ error: 'Tipo y monto son requeridos.' });
    }
    
    if (tipo !== 'ingreso' && tipo !== 'egreso') {
      return res.status(400).json({ error: 'El tipo debe ser "ingreso" o "egreso".' });
    }
    
    if (isNaN(monto) || monto <= 0) {
      return res.status(400).json({ error: 'El monto debe ser un número positivo.' });
    }
    
    // Insertar el movimiento
    const { rows } = await pool.query(
      'INSERT INTO movimientos (usuario_id, tipo, monto, descripcion) VALUES ($1, $2, $3, $4) RETURNING *',
      [usuario_id, tipo, monto, descripcion || null]
    );
    
    res.status(201).json({
      mensaje: 'Movimiento registrado exitosamente',
      movimiento: rows[0]
    });
  } catch (error) {
    console.error('Error al crear movimiento:', error);
    res.status(500).json({ error: 'Error en el servidor al registrar el movimiento.' });
  }
});

// GET /resumen - Obtener resumen financiero del usuario
router.get('/resumen', authenticateToken, async (req, res) => {
  try {
    const usuario_id = req.user.id; // Obtenemos el ID del usuario del token
    
    // Obtener suma de ingresos
    const { rows: ingresos } = await pool.query(
      'SELECT COALESCE(SUM(monto), 0) as total FROM movimientos WHERE usuario_id = $1 AND tipo = $2',
      [usuario_id, 'ingreso']
    );
    
    // Obtener suma de egresos
    const { rows: egresos } = await pool.query(
      'SELECT COALESCE(SUM(monto), 0) as total FROM movimientos WHERE usuario_id = $1 AND tipo = $2',
      [usuario_id, 'egreso']
    );
    
    const totalIngresos = parseFloat(ingresos[0].total);
    const totalEgresos = parseFloat(egresos[0].total);
    const balance = totalIngresos - totalEgresos;
    
    res.json({
      resumen: {
        ingresos: totalIngresos,
        egresos: totalEgresos,
        balance
      }
    });
  } catch (error) {
    console.error('Error al obtener resumen:', error);
    res.status(500).json({ error: 'Error en el servidor al obtener el resumen financiero.' });
  }
});

// PUT /movimientos/:id - Actualizar un movimiento existente
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const usuario_id = req.user.id;
    const movimiento_id = req.params.id;
    const { tipo, monto, descripcion } = req.body;
    
    // Validación de datos
    if (!tipo || !monto) {
      return res.status(400).json({ error: 'Tipo y monto son requeridos.' });
    }
    
    if (tipo !== 'ingreso' && tipo !== 'egreso') {
      return res.status(400).json({ error: 'El tipo debe ser "ingreso" o "egreso".' });
    }
    
    if (isNaN(monto) || monto <= 0) {
      return res.status(400).json({ error: 'El monto debe ser un número positivo.' });
    }
    
    // Verificar que el movimiento pertenezca al usuario
    const { rows: movimientoExistente } = await pool.query(
      'SELECT * FROM movimientos WHERE id = $1 AND usuario_id = $2',
      [movimiento_id, usuario_id]
    );
    
    if (movimientoExistente.length === 0) {
      return res.status(404).json({ error: 'Movimiento no encontrado o no autorizado.' });
    }
    
    // Actualizar el movimiento
    await pool.query(
      'UPDATE movimientos SET tipo = $1, monto = $2, descripcion = $3 WHERE id = $4 AND usuario_id = $5',
      [tipo, monto, descripcion || null, movimiento_id, usuario_id]
    );
    
    res.json({
      mensaje: 'Movimiento actualizado exitosamente',
      movimiento: {
        id: movimiento_id,
        usuario_id,
        tipo,
        monto,
        descripcion
      }
    });
  } catch (error) {
    console.error('Error al actualizar movimiento:', error);
    res.status(500).json({ error: 'Error en el servidor al actualizar el movimiento.' });
  }
});

// DELETE /movimientos/:id - Eliminar un movimiento
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const usuario_id = req.user.id;
    const movimiento_id = req.params.id;
    
    // Verificar que el movimiento pertenezca al usuario
    const { rows: movimientoExistente } = await pool.query(
      'SELECT * FROM movimientos WHERE id = $1 AND usuario_id = $2',
      [movimiento_id, usuario_id]
    );
    
    if (movimientoExistente.length === 0) {
      return res.status(404).json({ error: 'Movimiento no encontrado o no autorizado.' });
    }
    
    // Eliminar el movimiento
    await pool.query(
      'DELETE FROM movimientos WHERE id = $1 AND usuario_id = $2',
      [movimiento_id, usuario_id]
    );
    
    res.json({
      mensaje: 'Movimiento eliminado exitosamente',
      id: movimiento_id
    });
  } catch (error) {
    console.error('Error al eliminar movimiento:', error);
    res.status(500).json({ error: 'Error en el servidor al eliminar el movimiento.' });
  }
});

module.exports = router;