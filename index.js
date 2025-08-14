const express = require('express');
const cors = require('cors'); // Añadir esta línea
const { testConnection } = require('./db');
const authRoutes = require('./routes/auth');
const movimientosRoutes = require('./routes/movimientos');
require('dotenv').config();

// Crear la aplicación Express
const app = express();

// Configurar CORS - Modificar esta sección
app.use(cors());

// Middleware para parsear JSON
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/movimientos', movimientosRoutes);

// Ruta de prueba
app.options('*', cors()); // Habilitar preflight para todas las rutas

app.get('/test-cors', (req, res) => {
  res.json({ mensaje: 'CORS está configurado correctamente' });
});

// Puerto
const PORT = process.env.PORT || 3000;

// Iniciar el servidor - Modificar esta parte
async function startServer() {
  // Probar la conexión a la base de datos
  const dbConnected = await testConnection();
  
  if (dbConnected) {
    // Escuchar en todas las interfaces
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Servidor corriendo en puerto ${PORT}`);
    });
  } else {
    console.error('No se pudo iniciar el servidor debido a problemas con la base de datos');
  }
}

startServer();