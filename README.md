# Sistema de Finanzas Personales

Este es un sistema full-stack para la gestión de finanzas personales, que permite a los usuarios registrar y controlar sus ingresos y egresos de manera sencilla. El proyecto incluye tanto el backend como el frontend en un solo repositorio.

## ✨ Funcionalidades

-   **Autenticación de Usuarios:** Sistema seguro de registro e inicio de sesión con JWT.
-   **Dashboard Principal:** Visualización rápida del balance general, total de ingresos y total de egresos.
-   **Registro de Movimientos:** Formulario para agregar nuevos ingresos o egresos.
-   **Historial de Transacciones:** Lista detallada de todos los movimientos registrados, con la posibilidad de ver, editar y eliminar cada uno.
-   **Edición y Eliminación:** Modifica o elimina registros existentes directamente desde el historial.

## 🚀 Tecnologías Utilizadas

### Backend

-   **Node.js:** Entorno de ejecución para JavaScript.
-   **Express:** Framework para la creación de la API REST.
-   **MySQL (mysql2):** Base de datos para almacenar la información.
-   **JSON Web Tokens (JWT):** Para manejar la autenticación y las sesiones de usuario.
-   **bcryptjs:** Para el hasheo seguro de contraseñas.
-   **CORS:** Para permitir peticiones desde el frontend.
-   **dotenv:** Para la gestión de variables de entorno.

### Frontend

-   **React:** Biblioteca para construir la interfaz de usuario.
-   **React Router:** Para la navegación y el enrutamiento dentro de la aplicación.
-   **Axios:** Cliente HTTP para realizar peticiones a la API del backend.
-   **Recharts:** Para la creación de gráficos en el dashboard.
-   **Bootstrap:** Para el diseño y los estilos de la aplicación.

## ⚙️ Instalación Local

Sigue estos pasos para configurar y ejecutar el proyecto en tu máquina local.

1.  **Clonar el repositorio:**

    ```bash
    git clone https://github.com/tu-usuario/tu-repositorio.git
    cd tu-repositorio
    ```

2.  **Instalar dependencias:**

    Este comando instalará las dependencias tanto del backend como del frontend.

    ```bash
    npm install
    ```

3.  **Configurar variables de entorno:**

    Crea un archivo `.env` en la raíz del proyecto y añade las variables para el **backend**. Puedes usar la URL completa o las variables por separado.

    ```env
    # Puerto para el servidor backend
    PORT=3001

    # Clave secreta para firmar los JWT
    JWT_SECRET=tu_clave_secreta

    # Opción 1: Usando una URL de conexión a MySQL
    MYSQL_URL="mysql://user:password@host:port/database"

    # Opción 2: Usando variables separadas
    MYSQLHOST=localhost
    MYSQLUSER=root
    MYSQLPASSWORD=tu_contraseña
    MYSQLDATABASE=nombre_de_tu_bd
    MYSQLPORT=3306
    ```

    Crea un archivo `.env.frontend` en la raíz del proyecto para las variables del **frontend**.

    ```env
    # URL donde se ejecuta tu API de backend
    REACT_APP_API_URL=http://localhost:3001
    ```

4.  **Configurar la base de datos:**

    Asegúrate de tener un servidor de MySQL en ejecución y crea una base de datos con el nombre que especificaste en tus variables de entorno. Luego, ejecuta los scripts SQL necesarios para crear las tablas (si los tienes en un archivo `schema.sql`, por ejemplo).

5.  **Ejecutar el proyecto:**

    Puedes ejecutar el backend y el frontend con dos comandos separados en terminales diferentes.

    -   **Para iniciar el servidor backend (con nodemon):**

        ```bash
        npm run dev
        ```

    -   **Para iniciar la aplicación de React:**

        ```bash
        npm run start:react
        ```

    ¡Listo! La aplicación de React debería abrirse en `http://localhost:3000` y conectarse al backend que corre en `http://localhost:3001`.

