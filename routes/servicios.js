const express = require('express');
const router = express.Router();
const Servicio = require('../models/Servicio');
const { proteger, autorizarRoles } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configurar almacenamiento en memoria para subir a Drive
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new Error('No es una imagen'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: fileFilter
});

const { uploadImageToDrive } = require('../utils/drive');

// @route   GET /api/servicios
// @desc    Obtener todas las oportunidades de servicio
// @access  Private
router.get('/', proteger, async (req, res) => {
    try {
        const servicios = await Servicio.find()
            .sort({ fecha: 1 })
            .populate('participantes', 'nombre apellido foto');

        res.status(200).json({
            success: true,
            count: servicios.length,
            servicios
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener servicios'
        });
    }
});

// @route   POST /api/servicios
// @desc    Crear nueva oportunidad de servicio
// @access  Private (Admin/Consejo)
router.post('/', proteger, autorizarRoles('admin', 'consejo'), upload.single('imagen'), async (req, res) => {
    try {
        const { titulo, descripcion, fecha, lugar, cupoMaximo, lat, lng } = req.body;

        let imagen = null;
        if (req.file) {
            const fileName = `Servicio_${Date.now()}_${req.file.originalname}`;
            const fileId = await uploadImageToDrive(req.file.buffer, fileName, 'SERVICIOS', req.file.mimetype);
            imagen = `https://lh3.googleusercontent.com/d/${fileId}`;
        }

        const servicioData = {
            titulo,
            descripcion,
            fecha,
            lugar,
            cupoMaximo,
            imagen,
            creadoPor: req.Miembro._id
        };

        if (lat && lng) {
            servicioData.ubicacion = {
                lat: parseFloat(lat),
                lng: parseFloat(lng)
            };
        }

        const servicio = await Servicio.create(servicioData);

        res.status(201).json({
            success: true,
            message: 'Servicio creado correctamente',
            servicio
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al crear servicio'
        });
    }
});

// @route   PUT /api/servicios/:id/participar
// @desc    Inscribirse o desinscribirse de un servicio
// @access  Private
router.put('/:id/participar', proteger, async (req, res) => {
    try {
        const servicio = await Servicio.findById(req.params.id);

        if (!servicio) {
            return res.status(404).json({ success: false, message: 'Servicio no encontrado' });
        }

        // Verificar si ya está inscrito
        const index = servicio.participantes.indexOf(req.Miembro._id);

        if (index !== -1) {
            // Ya está inscrito, desinscribir
            servicio.participantes.splice(index, 1);
            await servicio.save();
            return res.status(200).json({
                success: true,
                message: 'Te has desinscrito del servicio',
                inscrito: false,
                servicio
            });
        } else {
            // No está inscrito, verificar cupo
            if (servicio.cupoMaximo > 0 && servicio.participantes.length >= servicio.cupoMaximo) {
                return res.status(400).json({
                    success: false,
                    message: 'El cupo para este servicio está lleno'
                });
            }

            servicio.participantes.push(req.Miembro._id);
            await servicio.save();
            return res.status(200).json({
                success: true,
                message: 'Te has inscrito al servicio correctamente',
                inscrito: true,
                servicio
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al procesar inscripción'
        });
    }
});

// @route   DELETE /api/servicios/:id
// @desc    Eliminar servicio
// @access  Private (Admin/Consejo)
router.delete('/:id', proteger, autorizarRoles('admin', 'consejo'), async (req, res) => {
    try {
        const servicio = await Servicio.findById(req.params.id);

        if (!servicio) {
            return res.status(404).json({ success: false, message: 'Servicio no encontrado' });
        }

        await servicio.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Servicio eliminado correctamente'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar servicio'
        });
    }
});

module.exports = router;
