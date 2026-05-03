const mongoose = require('mongoose');

const EspiritualidadSchema = new mongoose.Schema({
    titulo: {
        type: String,
        required: true,
        trim: true
    },
    contenido: {
        type: String,
        required: true
    },
    tipo: {
        type: String,
        enum: ['oracion', 'carisma'],
        required: true
    },
    creadoPor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Miembro'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Espiritualidad', EspiritualidadSchema);
