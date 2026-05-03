const mongoose = require('mongoose');

const WebConfigSchema = new mongoose.Schema({
    heroTitle: {
        type: String,
        default: 'Juventud Franciscana - Pomalca'
    },
    heroSubtitle: {
        type: String,
        default: 'Siguiendo los pasos de San Francisco de Asís y Santa Clara, viviendo el Evangelio en fraternidad, paz y bien.'
    },
    mision: {
        type: String,
        default: 'Vivimos una fe alegre y sencilla, encontrando a Dios en la creación y en el servicio a los Miembros más necesitados.'
    },
    vision: {
        type: String,
        default: 'Crecemos juntos en el conocimiento del Evangelio y el carisma franciscano para ser instrumentos de paz en el mundo.'
    },
    valores: {
        type: String,
        default: 'No caminamos solos. Formamos una familia que se apoya, celebra y vive en comunión constante.'
    },
    fraseInspiradora: {
        type: String,
        default: '"Comienza haciendo lo que es necesario, después lo que es posible y de repente estarás haciendo lo imposible."'
    },
    autorFrase: {
        type: String,
        default: 'San Francisco de Asís'
    },
    emailContacto: {
        type: String,
        default: 'Catequesis Pomalcapomalca@gmail.com'
    },
    telefonoContacto: {
        type: String,
        default: '+51 981 574 685'
    },
    mapQuery: {
        type: String,
        default: 'Parroquia San Juan Maria Vianney, Pomalca, Chiclayo'
    },
    familiaTitulo: {
        type: String,
        default: 'Fraternidad Parroquia Santa Isabel de Hungría - Chiclayo'
    },
    familiaDescripcion: {
        type: String,
        default: 'Caminamos junto a nuestros Miembros mayores de la Orden Franciscana Seglar, quienes nos acompañan y guían en nuestro camino de fe y servicio.'
    },
    ParroquiaHeroTitle: {
        type: String,
        default: 'Fraternidad Parroquia Santa Isabel de Hungría'
    },
    ParroquiaHeroSubtitle: {
        type: String,
        default: 'Orden Franciscana Seglar: Viviendo el Evangelio en medio del mundo.'
    },
    ParroquiaMapQuery: {
        type: String,
        default: 'Convento San Antonio de Padua, Chiclayo, Perú'
    },
    facebookUrl: { type: String, default: '' },
    instagramUrl: { type: String, default: '' },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('WebConfig', WebConfigSchema);
