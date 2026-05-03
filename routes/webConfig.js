const express = require('express');
const router = express.Router();
const WebConfig = require('../models/WebConfig');
const { proteger, autorizarRoles } = require('../middleware/auth');

// @route   GET /api/web-config
// @desc    Obtener configuración pública de la web
// @access  Public
router.get('/', async (req, res) => {
    try {
        let config = await WebConfig.findOne();
        if (!config) {
            // Si no existe, crear una por defecto
            config = new WebConfig();
            await config.save();
        }
        res.json({ success: true, data: config });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   PUT /api/web-config
// @desc    Actualizar configuración de la web
// @access  Private (Admin)
router.put('/', proteger, autorizarRoles('admin'), async (req, res) => {
    try {
        let config = await WebConfig.findOne();
        if (!config) {
            config = new WebConfig(req.body);
        } else {
            // Actualizar campos
            Object.assign(config, req.body);
            config.updatedAt = Date.now();
        }
        await config.save();
        res.json({ success: true, message: 'Configuración actualizada correctamente', data: config });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
