const jwt = require('jsonwebtoken');
const Miembro = require('../models/Miembro');

// Proteger rutas - verificar token
exports.proteger = async (req, res, next) => {
    let token;

    // Verificar si el token existe en los headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // Verificar si el token existe
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'No autorizado - Token no proporcionado'
        });
    }

    try {
        // Verificar token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Obtener Miembro del token
        req.Miembro = await Miembro.findById(decoded.id);

        if (!req.Miembro) {
            return res.status(401).json({
                success: false,
                message: 'Miembro no encontrado'
            });
        }

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'No autorizado - Token inválido'
        });
    }
};

// Autorizar roles específicos
exports.autorizarRoles = (...roles) => {
    return (req, res, next) => {
        const cargosConsejo = ['coordinador', 'vice-coordinador', 'secretario', 'tesorero', 'formador', 'animador'];

        // Si el Miembro tiene rol permitido
        if (roles.includes(req.Miembro.rol)) {
            return next();
        }

        // Si se requiere rol 'consejo' y el Miembro tiene un cargo del consejo
        if (roles.includes('consejo') && cargosConsejo.includes(req.Miembro.cargo)) {
            return next();
        }

        return res.status(403).json({
            success: false,
            message: `El rol ${req.Miembro.rol} no tiene permiso para acceder a este recurso`
        });
    };
};

// Generar token JWT
exports.generarToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};
