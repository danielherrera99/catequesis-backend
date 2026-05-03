const mongoose = require('mongoose');

const FormacionSchema = new mongoose.Schema({
    titulo: {
        type: String,
        required: [true, 'El título es requerido'],
        trim: true
    },
    descripcion: {
        type: String,
        trim: true
    },
    contenido: {
        type: String, // Puede ser texto largo o HTML básico
        required: [true, 'El contenido es requerido']
    },
    fecha: {
        type: Date,
        default: Date.now
    },
    autor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Miembro',
        required: true
    },
    archivoUrl: {
        type: String,
        default: null
    },
    archivoNombre: {
        type: String,
        default: null
    },
    etiquetas: [{
        type: String,
        trim: true
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Formacion', FormacionSchema);
