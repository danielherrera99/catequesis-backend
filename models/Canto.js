const mongoose = require('mongoose');

const CantoSchema = new mongoose.Schema({
    titulo: {
        type: String,
        required: [true, 'El título es requerido'],
        trim: true
    },
    letra: {
        type: String,
        required: [true, 'La letra es requerida']
    },
    categoria: {
        type: String,
        enum: ['entrada', 'ofertorio', 'comunion', 'salida', 'franciscano', 'mariano', 'adoracion', 'animacion', 'otro'],
        default: 'otro'
    },
    autor: {
        type: String,
        trim: true
    },
    creadoPor: {
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
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Canto', CantoSchema);
