const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MiembroSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre es requerido'],
        trim: true
    },
    apellido: {
        type: String,
        required: [true, 'El apellido es requerido'],
        trim: true
    },
    username: {
        type: String,
        required: [true, 'El Miembro es requerido'],
        unique: true,
        trim: true,
        minlength: [4, 'El Miembro debe tener al menos 4 caracteres']
    },
    email: {
        type: String,
        required: false, // Ya no es obligatorio para login
        unique: true,
        sparse: true, // Permite nulos únicos
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
    },
    password: {
        type: String,
        required: [true, 'La contraseña es requerida'],
        minlength: 6,
        select: false
    },
    telefono: {
        type: String,
        trim: true
    },
    contactoEmergencia: {
        type: String,
        trim: true
    },
    nombreContactoEmergencia: {
        type: String,
        trim: true
    },
    fechaNacimiento: {
        type: Date
    },
    fechaIngreso: {
        type: Date,
        default: Date.now
    },
    fechaPromesa: {
        type: Date
    },
    rol: {
        type: String,
        enum: ['admin', 'consejo', 'miembro'],
        default: 'miembro'
    },
    cargo: {
        type: String,
        enum: ['coordinador', 'vice-coordinador', 'secretario', 'tesorero', 'formador', 'animador', 'ninguno'],
        default: 'ninguno'
    },
    foto: {
        type: String,
        default: null
    },
    activo: {
        type: Boolean,
        default: false
    },
    codigoQR: {
        type: String
    },
    expoPushToken: {
        type: String,
        default: null
    },
    resetPasswordCode: {
        type: String,
        select: false
    },
    resetPasswordExpire: {
        type: Date,
        select: false
    }
}, {
    timestamps: true
});

// Encriptar contraseña antes de guardar
MiembroSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Método para comparar contraseñas
MiembroSchema.methods.compararPassword = async function (passwordIngresado) {
    return await bcrypt.compare(passwordIngresado, this.password);
};

// Virtual para nombre completo
MiembroSchema.virtual('nombreCompleto').get(function () {
    return `${this.nombre} ${this.apellido}`;
});

module.exports = mongoose.model('Miembro', MiembroSchema);
