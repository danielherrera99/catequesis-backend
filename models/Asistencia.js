const mongoose = require('mongoose');

const AsistenciaSchema = new mongoose.Schema({
    Miembro: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Miembro',
        required: false // Ahora opcional para permitir invitados
    },
    nombreInvitado: {
        type: String,
        trim: true // Para personas sin cuenta
    },
    fecha: {
        type: Date,
        required: true,
        default: Date.now
    },
    tipoReunion: {
        type: String,
        enum: ['semanal', 'consejo', 'formacion', 'apostolado', 'especial'],
        default: 'semanal'
    },
    presente: {
        type: Boolean,
        default: true
    },
    estado: {
        type: String,
        enum: ['presente', 'ausente', 'justificado', 'falta', 'permiso', 'tardanza'],
        default: 'presente'
    },
    metodoRegistro: {
        type: String,
        enum: ['qr', 'manual', 'automatico', 'manual_web', 'manual_app'],
        default: 'manual'
    },
    observaciones: {
        type: String,
        trim: true
    },
    registradoPor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Miembro'
    }
}, {
    timestamps: true
});

// Índice compuesto para evitar duplicados en Miembros (los invitados no usarán este índice para no chocar)
AsistenciaSchema.index({ Miembro: 1, fecha: 1, tipoReunion: 1 }, { unique: true, sparse: true, partialFilterExpression: { Miembro: { $exists: true, $ne: null } } });

module.exports = mongoose.model('Asistencia', AsistenciaSchema);
