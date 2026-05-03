const mongoose = require('mongoose');

const MensajeSchema = new mongoose.Schema({
    remitente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Miembro',
        required: true
    },
    destinatario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Miembro',
        required: true
    },
    contenido: {
        type: String,
        required: true,
        trim: true
    },
    leido: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Mensaje', MensajeSchema);
