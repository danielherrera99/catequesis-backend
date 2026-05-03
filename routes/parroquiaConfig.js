const express = require('express');
const router = express.Router();
const ParroquiaConfig = require('../models/ParroquiaConfig');
const { proteger, autorizarRoles } = require('../middleware/auth');

// @route   GET /api/Parroquia-config
// @desc    Obtener configuración pública de la landing Parroquia
// @access  Public
router.get('/', async (req, res) => {
    try {
        let config = await ParroquiaConfig.findOne();
        if (!config) {
            config = new ParroquiaConfig();
            await config.save();
        }
        res.json({ success: true, data: config });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   PUT /api/Parroquia-config
// @desc    Actualizar configuración de la landing Parroquia
// @access  Private (Admin)
router.put('/', proteger, autorizarRoles('admin'), async (req, res) => {
    try {
        let config = await ParroquiaConfig.findOne();
        if (!config) {
            config = new ParroquiaConfig(req.body);
        } else {
            Object.assign(config, req.body);
            config.updatedAt = Date.now();
        }
        await config.save();
        res.json({ success: true, message: 'Configuración Parroquia actualizada correctamente', data: config });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
