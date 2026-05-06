const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

// Inicializar Express
const app = express();

// Middleware
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(async () => {
        console.log('✅ MongoDB conectado exitosamente');

        // Crear o actualizar Miembro por defecto
        try {
            const Miembro = require('./models/Miembro');
            let MiembroCatequesis = await Miembro.findOne({ username: 'Catequesis' });

            if (!MiembroCatequesis) {
                // Crear si no existe
                MiembroCatequesis = new Miembro({
                    nombre: 'Administrador',
                    apellido: 'Catequesis',
                    username: 'Catequesis',
                    password: '201599',
                    rol: 'admin',
                    cargo: 'coordinador',

                    email: 'admin@catequesis.com',
                    activo: true
                });
                await MiembroCatequesis.save();
                console.log('👤 Miembro por defecto "Catequesis" creado exitosamente');
            } else {
                // Actualizar contraseña si ya existe (para asegurar acceso)
                MiembroCatequesis.password = '201599';
                MiembroCatequesis.rol = 'admin'; // Asegurar rol admin
                MiembroCatequesis.activo = true; // Asegurar que esté activo
                if (!MiembroCatequesis.email) MiembroCatequesis.email = 'admin@catequesis.com';
                await MiembroCatequesis.save(); // Esto disparará el pre-save hook y hasheará el password
                console.log('🔄 Miembro por defecto "Catequesis" actualizado/verificado');
            }
        } catch (error) {
            console.error('❌ Error al gestionar Miembro por defecto:', error);
        }
    })
    .catch((err) => console.error('❌ Error al conectar MongoDB:', err));

// Rutas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/miembros', require('./routes/miembros'));
app.use('/api/asistencia', require('./routes/asistencia'));
app.use('/api/actas', require('./routes/actas'));
app.use('/api/anuncios', require('./routes/anuncios'));
app.use('/api/formacion', require('./routes/formacion'));
app.use('/api/eventos', require('./routes/eventos'));
app.use('/api/cantos', require('./routes/cantos'));

app.use('/api/peticiones', require('./routes/peticiones'));
app.use('/api/documentos', require('./routes/documentos'));
app.use('/api/galeria', require('./routes/galeria'));
app.use('/api/servicios', require('./routes/servicios'));
app.use('/api/espiritualidad', require('./routes/espiritualidad'));
app.use('/api/mensajes', require('./routes/mensajes'));
app.use('/api/web-config', require('./routes/webConfig'));
app.use('/api/parroquia-config', require('./routes/parroquiaConfig'));
app.use('/api/tienda', require('./routes/tienda'));

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({
        message: '🕊️ Catequesis Pomalca API - Bienvenido',
        version: '1.0.0',
        status: 'active'
    });
});

// Ruta de diagnóstico (Temporal)
app.get('/api/debug', async (req, res) => {
    try {
        const dbStatus = mongoose.connection.readyState === 1 ? 'Conectado' : 'Desconectado';
        const dbName = mongoose.connection.name;
        const Miembro = require('./models/Miembro');
        const count = await Miembro.countDocuments();
        const adminExists = await Miembro.findOne({ username: 'Catequesis' });

        res.json({
            status: 'ok',
            mongodb: dbStatus,
            database: dbName,
            miembrosTotales: count,
            adminExiste: !!adminExists,
            googleEnv: !!process.env.GOOGLE_CLIENT_ID
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

// Puerto
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`🌐 http://localhost:${PORT}`);
});

module.exports = app;
