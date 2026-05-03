const mongoose = require('mongoose');

const ServicioSchema = new mongoose.Schema({
    titulo: {
        type: String,
        required: [true, 'El título es requerido'],
        trim: true
    },
    descripcion: {
        type: String,
        required: [true, 'La descripción es requerida'],
        trim: true
    },
    fecha: {
        type: Date,
        required: [true, 'La fecha es requerida']
    },
    lugar: {
        type: String,
        required: [true, 'El lugar es requerido'],
        trim: true
    },
    cupoMaximo: {
        type: Number,
        default: 0 // 0 significa sin límite
    },
    imagen: {
        type: String,
        default: null
    },
    ubicacion: {
        lat: { type: Number },
        lng: { type: Number }
    },
    participantes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Miembro'
    }],
    creadoPor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Miembro',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Servicio', ServicioSchema);
