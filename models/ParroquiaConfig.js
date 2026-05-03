const mongoose = require('mongoose');

const ParroquiaConfigSchema = new mongoose.Schema({
    heroTitle: {
        type: String,
        default: 'Fraternidad Parroquia Santa Isabel de Hungría'
    },
    heroSubtitle: {
        type: String,
        default: 'Orden Franciscana Seglar: Viviendo el Evangelio en medio del mundo.'
    },
    mapQuery: {
        type: String,
        default: 'Convento San Antonio de Padua, Chiclayo, Perú'
    },
    quienesSomos: {
        type: String,
        default: 'Caminamos junto a nuestros Miembros mayores de la Orden Franciscana Seglar, quienes nos acompañan y guían en nuestro camino de fe y servicio.'
    },
    footerDireccion: {
        type: String,
        default: 'Convento San Antonio de Padua, Chiclayo, Perú'
    },
    footerEmail: {
        type: String,
        default: 'Catequesis Pomalcapomalca@gmail.com'
    },
    footerTelefono: {
        type: String,
        default: '+51 979 948 528'
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ParroquiaConfig', ParroquiaConfigSchema);
