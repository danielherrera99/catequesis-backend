const express = require('express');
const router = express.Router();
const Espiritualidad = require('../models/Espiritualidad');
const { proteger, autorizarRoles } = require('../middleware/auth');

// @route   GET /api/espiritualidad
// @desc    Obtener todos los items
// @access  Public
router.get('/', async (req, res) => {
    try {
        const items = await Espiritualidad.find().sort({ createdAt: -1 });
        res.json({ success: true, items });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

// @route   POST /api/espiritualidad
// @desc    Crear item
// @access  Private (Admin/Consejo)
router.post('/', proteger, autorizarRoles('admin', 'consejo'), async (req, res) => {
    try {
        const { titulo, contenido, tipo } = req.body;
        const newItem = new Espiritualidad({
            titulo,
            contenido,
            tipo,
            creadoPor: req.Miembro._id
        });
        await newItem.save();
        res.status(201).json({ success: true, item: newItem });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al crear' });
    }
});

// @route   PUT /api/espiritualidad/:id
// @desc    Actualizar item
// @access  Private (Admin/Consejo)
router.put('/:id', proteger, autorizarRoles('admin', 'consejo'), async (req, res) => {
    try {
        const { titulo, contenido, tipo } = req.body;
        let item = await Espiritualidad.findById(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: 'No encontrado' });

        item.titulo = titulo || item.titulo;
        item.contenido = contenido || item.contenido;
        item.tipo = tipo || item.tipo;

        await item.save();
        res.json({ success: true, item });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al actualizar' });
    }
});

// @route   DELETE /api/espiritualidad/:id
// @desc    Eliminar item
// @access  Private (Admin/Consejo)
router.delete('/:id', proteger, autorizarRoles('admin', 'consejo'), async (req, res) => {
    try {
        const item = await Espiritualidad.findById(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: 'No encontrado' });

        await item.deleteOne();
        res.json({ success: true, message: 'Eliminado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al eliminar' });
    }
});

module.exports = router;
