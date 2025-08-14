const { Pool } = require('pg');
require('dotenv').config();

// Configuración de la conexión a la base de datos de PostgreSQL
let pool;

// Usar la URL de conexión de Nile
const connectionString = process.env.DATABASE_URL;

pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false // Necesario para conexiones a servicios en la nube como Heroku o Nile
  }
});

// Función para probar la conexión
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('Conexión a la base de datos de PostgreSQL establecida correctamente');
    client.release();
    return true;
  } catch (error) {
    console.error('Error al conectar a la base de datos de PostgreSQL:', error.message);
    return false;
  }
}

// Exportar el pool de conexiones y la función de prueba
module.exports = {
  pool,
  testConnection
};
