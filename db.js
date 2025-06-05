const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de la conexión a la base de datos
let pool;

if (process.env.MYSQL_URL) {
  // Usar la URL de conexión directamente
  pool = mysql.createPool(process.env.MYSQL_URL);
} else {
  // Usar configuración individual
  pool = mysql.createPool({
    host: process.env.MYSQLHOST || process.env.DB_HOST,
    port: process.env.MYSQLPORT || process.env.DB_PORT,
    user: process.env.MYSQLUSER || process.env.DB_USER,
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
    database: process.env.MYSQLDATABASE || process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
}

// Función para probar la conexión
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Conexión a la base de datos establecida correctamente');
    connection.release();
    return true;
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error.message);
    return false;
  }
}

// Exportar el pool de conexiones y la función de prueba
module.exports = {
  pool,
  testConnection
};