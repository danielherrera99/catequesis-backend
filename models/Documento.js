const mongoose = require('mongoose');

const DocumentoSchema = new mongoose.Schema({
    titulo: {
        type: String,
        required: [true, 'El título es requerido'],
        trim: true
    },
    descripcion: {
        type: String,
        trim: true
    },
    tipo: {
        type: String,
        enum: ['regla', 'ccgg', 'estatuto', 'formacion', 'otro'],
        default: 'otro'
    },
    contenido: {
        type: String,
        // required: [true, 'El contenido es requerido'] // Hacemos opcional si hay archivo
    },
    archivoUrl: {
        type: String
    },
    archivoNombre: {
        type: String
    },
    creadoPor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Miembro',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Documento', DocumentoSchema);
