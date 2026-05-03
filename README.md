# JUFRA Backend API

API REST para la gestión administrativa de la Juventud Franciscana (JUFRA).

## 🚀 Características

- ✅ Autenticación JWT con roles
- ✅ Gestión de hermanos (base de datos)
- ✅ Control de asistencia (QR y manual)
- ✅ Tesorería con saldo en tiempo real
- ✅ Gestión de actas y acuerdos
- ✅ Códigos QR automáticos para cada usuario
- ✅ Cálculo de aniversarios (ingreso y promesa)

## 📋 Requisitos Previos

- Node.js (v14 o superior)
- MongoDB (local o Atlas)
- npm o yarn

## 🔧 Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
Edita el archivo `.env` con tus configuraciones:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/jufra-db
JWT_SECRET=tu_secreto_aqui
JWT_EXPIRE=30d
NODE_ENV=development
```

3. Iniciar MongoDB (si es local):
```bash
mongod
```

4. Iniciar el servidor:
```bash
# Desarrollo (con nodemon)
npm run dev

# Producción
npm start
```

## 📡 Endpoints Principales

### Autenticación
- `POST /api/auth/registro` - Registrar nuevo usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/perfil` - Obtener perfil (requiere token)

### Hermanos
- `GET /api/hermanos` - Listar todos los hermanos
- `GET /api/hermanos/:id` - Obtener un hermano
- `PUT /api/hermanos/:id` - Actualizar hermano (Admin/Consejo)
- `GET /api/hermanos/aniversarios/proximos` - Próximos aniversarios

### Asistencia
- `POST /api/asistencia` - Registrar asistencia manual
- `POST /api/asistencia/qr` - Registrar asistencia por QR
- `GET /api/asistencia` - Listar asistencias
- `GET /api/asistencia/estadisticas/:usuarioId` - Estadísticas de asistencia

### Tesorería
- `POST /api/tesoreria` - Registrar transacción
- `GET /api/tesoreria` - Listar transacciones
- `GET /api/tesoreria/saldo` - Obtener saldo actual
- `GET /api/tesoreria/estadisticas` - Estadísticas financieras

### Actas
- `POST /api/actas` - Crear acta
- `GET /api/actas` - Listar actas
- `GET /api/actas/:id` - Obtener acta específica
- `PUT /api/actas/:id` - Actualizar acta
- `PUT /api/actas/:id/acuerdos/:acuerdoId` - Marcar acuerdo como completado

## 🔐 Roles y Permisos

- **admin**: Acceso total
- **consejo**: Gestión administrativa (hermanos, asistencia, tesorería, actas)
- **formador**: Gestión de formación
- **miembro**: Acceso básico

## 🗄️ Modelos de Datos

### Usuario
- Información personal (nombre, apellido, email, teléfono)
- Fechas importantes (nacimiento, ingreso, promesa)
- Rol y cargo
- Etapa de formación
- Código QR único

### Asistencia
- Usuario
- Fecha y tipo de reunión
- Método de registro (QR/manual)
- Observaciones

### Transacción
- Tipo (ingreso/egreso)
- Monto y concepto
- Categoría y método de pago
- Usuario asociado

### Acta
- Título y fecha
- Tipo de reunión
- Contenido
- Asistentes
- Acuerdos con responsables

## 🛠️ Tecnologías

- **Express.js** - Framework web
- **MongoDB** - Base de datos
- **Mongoose** - ODM
- **JWT** - Autenticación
- **bcryptjs** - Encriptación de contraseñas
- **QRCode** - Generación de códigos QR

## 📝 Notas

- Los códigos QR se generan automáticamente al registrar un usuario
- El sistema previene registros duplicados de asistencia
- El saldo de tesorería se calcula en tiempo real
- Los aniversarios se calculan automáticamente

---

**Desarrollado con 🕊️ para la JUFRA**
