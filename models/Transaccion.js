const mongoose = require('mongoose');

const transaccionSchema = new mongoose.Schema({
    tipo: {
        type: String,
        enum: ['ingreso', 'egreso'],
        required: true
    },
    monto: {
        type: Number,
        required: true
    },
    descripcion: {
        type: String,
        required: true
    },
    categoria: {
        type: String,
        default: 'General'
    },
    fecha: {
        type: Date,
        default: Date.now
    },
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Miembro',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Transaccion', transaccionSchema);
