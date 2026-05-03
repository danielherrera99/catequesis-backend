const mongoose = require('mongoose');

const GaleriaSchema = new mongoose.Schema({
    titulo: {
        type: String,
        required: [true, 'El título es requerido'],
        trim: true
    },
    descripcion: {
        type: String,
        trim: true
    },
    fecha: {
        type: Date,
        default: Date.now
    },
    archivoUrl: {
        type: String,
        required: [true, 'El archivo es requerido']
    },
    tipoArchivo: {
        type: String,
        enum: ['imagen', 'video'],
        default: 'imagen'
    },
    categoria: {
        type: String,
        default: 'general'
    },
    subidoPor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Miembro',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Galeria', GaleriaSchema);
