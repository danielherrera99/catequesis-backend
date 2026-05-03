const mongoose = require('mongoose');

const PeticionSchema = new mongoose.Schema({
    contenido: {
        type: String,
        required: [true, 'El contenido de la petición es requerido'],
        trim: true
    },
    autor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Miembro',
        required: true
    },
    oraciones: [{
        Miembro: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Miembro'
        },
        fecha: {
            type: Date,
            default: Date.now
        }
    }],
    anonimo: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Peticion', PeticionSchema);
