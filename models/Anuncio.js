const mongoose = require('mongoose');

const AnuncioSchema = new mongoose.Schema({
    titulo: {
        type: String,
        required: [true, 'El título es requerido'],
        trim: true,
        maxlength: [100, 'El título no puede exceder 100 caracteres']
    },
    contenido: {
        type: String,
        required: [true, 'El contenido es requerido'],
        trim: true
    },
    tipo: {
        type: String,
        enum: ['general', 'urgente', 'evento', 'formacion', 'apostolado'],
        default: 'general'
    },
    prioridad: {
        type: String,
        enum: ['baja', 'normal', 'alta'],
        default: 'normal'
    },
    imagen: {
        type: String, // URL de la imagen
        default: null
    },
    fechaPublicacion: {
        type: Date,
        default: Date.now
    },
    fechaExpiracion: {
        type: Date,
        default: null
    },
    activo: {
        type: Boolean,
        default: true
    },
    destacado: {
        type: Boolean,
        default: false
    },
    autor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Miembro',
        required: true
    },
    vistas: {
        type: Number,
        default: 0
    },
    destinatarios: {
        type: String,
        enum: ['todos', 'consejo', 'formacion', 'promesados'],
        default: 'todos'
    },
    ubicacion: {
        lat: { type: Number },
        lng: { type: Number }
    }
}, {
    timestamps: true
});

// Índice para búsquedas eficientes
AnuncioSchema.index({ tipo: 1, activo: 1, fechaPublicacion: -1 });

// Virtual para verificar si está expirado
AnuncioSchema.virtual('estaExpirado').get(function () {
    if (!this.fechaExpiracion) return false;
    return new Date() > this.fechaExpiracion;
});

// Método para incrementar vistas
AnuncioSchema.methods.incrementarVistas = async function () {
    this.vistas += 1;
    await this.save();
};

module.exports = mongoose.model('Anuncio', AnuncioSchema);
