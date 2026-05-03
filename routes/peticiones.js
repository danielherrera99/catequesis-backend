const express = require('express');
const router = express.Router();
const Peticion = require('../models/Peticion');
const { proteger } = require('../middleware/auth');

// @route   GET /api/peticiones
// @desc    Obtener todas las peticiones recientes
// @access  Private
router.get('/', proteger, async (req, res) => {
    try {
        const peticiones = await Peticion.find()
            .sort({ createdAt: -1 })
            .populate('autor', 'nombre apellido foto')
            .limit(50); // Limitar a las últimas 50

        res.status(200).json({
            success: true,
            count: peticiones.length,
            peticiones
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener peticiones'
        });
    }
});

// @route   POST /api/peticiones
// @desc    Crear nueva petición
// @access  Private
router.post('/', proteger, async (req, res) => {
    try {
        const { contenido, anonimo } = req.body;

        const peticion = await Peticion.create({
            contenido,
            anonimo,
            autor: req.Miembro._id
        });

        // Poblar autor para devolver respuesta completa
        await peticion.populate('autor', 'nombre apellido foto');

        res.status(201).json({
            success: true,
            message: 'Petición creada exitosamente',
            peticion
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al crear petición'
        });
    }
});

// @route   PUT /api/peticiones/:id/orar
// @desc    Agregar oración a una petición
// @access  Private
router.put('/:id/orar', proteger, async (req, res) => {
    try {
        const peticion = await Peticion.findById(req.params.id);

        if (!peticion) {
            return res.status(404).json({ success: false, message: 'Petición no encontrada' });
        }

        // Verificar si ya oró
        const yaOro = peticion.oraciones.find(
            o => o.Miembro.toString() === req.Miembro._id.toString()
        );

        if (yaOro) {
            // Quitar oración (toggle)
            peticion.oraciones = peticion.oraciones.filter(
                o => o.Miembro.toString() !== req.Miembro._id.toString()
            );
        } else {
            // Agregar oración
            peticion.oraciones.unshift({ Miembro: req.Miembro._id });
        }

        await peticion.save();

        res.status(200).json({
            success: true,
            oraciones: peticion.oraciones
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar oración'
        });
    }
});

// @route   PUT /api/peticiones/:id
// @desc    Actualizar petición
// @access  Private (Autor/Admin/Consejo)
router.put('/:id', proteger, async (req, res) => {
    try {
        let peticion = await Peticion.findById(req.params.id);

        if (!peticion) {
            return res.status(404).json({ success: false, message: 'Petición no encontrada' });
        }

        // Verificar si es el autor o admin/consejo
        if (peticion.autor.toString() !== req.Miembro._id.toString() &&
            !['admin', 'consejo'].includes(req.Miembro.rol)) {
            return res.status(401).json({ success: false, message: 'No autorizado' });
        }

        peticion = await Peticion.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            message: 'Petición actualizada exitosamente',
            peticion
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar petición'
        });
    }
});

// @route   DELETE /api/peticiones/:id
// @desc    Eliminar petición
// @access  Private (Autor/Admin/Consejo)
router.delete('/:id', proteger, async (req, res) => {
    try {
        const peticion = await Peticion.findById(req.params.id);

        if (!peticion) {
            return res.status(404).json({ success: false, message: 'Petición no encontrada' });
        }

        // Verificar si es el autor o admin/consejo
        if (peticion.autor.toString() !== req.Miembro._id.toString() &&
            !['admin', 'consejo'].includes(req.Miembro.rol)) {
            return res.status(401).json({ success: false, message: 'No autorizado' });
        }

        await peticion.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Petición eliminada exitosamente'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar petición'
        });
    }
});

module.exports = router;
