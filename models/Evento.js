const mongoose = require('mongoose');

const EventoSchema = new mongoose.Schema({
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
        required: [true, 'La fecha es requerida']
    },
    hora: {
        type: String, // Guardar hora como string "18:00" o parte de la fecha
    },
    lugar: {
        type: String,
        default: 'Parroquia'
    },
    ubicacion: {
        lat: { type: Number },
        lng: { type: Number }
    },
    tipo: {
        type: String,
        enum: ['reunion', 'misa', 'formacion', 'retiro', 'fraternidad', 'otro'],
        default: 'otro'
    },
    creadoPor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Miembro',
        required: true
    },
    imagenUrl: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Evento', EventoSchema);
