const mongoose = require('mongoose');

const ActaSchema = new mongoose.Schema({
    titulo: {
        type: String,
        required: [true, 'El título es requerido'],
        trim: true
    },
    fecha: {
        type: Date,
        required: true,
        default: Date.now
    },
    tipoReunion: {
        type: String,
        enum: ['directiva', 'fraternidad', 'formacion', 'extraordinaria'],
        default: 'directiva'
    },
    contenido: {
        type: String,
        required: [true, 'El contenido es requerido']
    },
    asistentes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Miembro'
    }],
    archivoPDF: {
        type: String, // URL del PDF
        default: null
    },
    acuerdos: [{
        descripcion: String,
        responsable: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Miembro'
        },
        fechaLimite: Date,
        completado: {
            type: Boolean,
            default: false
        }
    }],
    creadoPor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Miembro',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Acta', ActaSchema);
