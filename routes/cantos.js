const express = require('express');
const router = express.Router();
const Canto = require('../models/Canto');
const { proteger, autorizarRoles } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configurar almacenamiento de archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'uploads/cantos';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    // Aceptar documentos y audios
    if (file.mimetype.startsWith('application/') || file.mimetype.startsWith('text/') || file.mimetype.startsWith('audio/')) {
        cb(null, true);
    } else {
        cb(new Error('Formato de archivo no soportado'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: fileFilter
});

// @route   GET /api/cantos
// @desc    Obtener todos los cantos
// @access  Private
router.get('/', proteger, async (req, res) => {
    try {
        const cantos = await Canto.find()
            .sort({ titulo: 1 });

        res.status(200).json({
            success: true,
            count: cantos.length,
            cantos
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener cantos'
        });
    }
});

// @route   POST /api/cantos
// @desc    Crear nuevo canto
// @access  Private (Admin/Consejo/Formador/Animador)
router.post('/', proteger, autorizarRoles('admin', 'consejo', 'animador', 'coordinador'), upload.single('archivo'), async (req, res) => {
    try {
        const { titulo, letra, categoria, autor } = req.body;

        let archivoUrl = null;
        let archivoNombre = null;

        if (req.file) {
            archivoUrl = `${req.protocol}://${req.get('host')}/uploads/cantos/${req.file.filename}`;
            archivoNombre = req.file.originalname;
        }

        const canto = await Canto.create({
            titulo,
            letra,
            categoria,
            autor,
            creadoPor: req.Miembro._id,
            archivoUrl,
            archivoNombre
        });

        res.status(201).json({
            success: true,
            message: 'Canto agregado exitosamente',
            canto
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al crear canto'
        });
    }
});

// @route   GET /api/cantos/:id
// @desc    Obtener un canto por ID
// @access  Private
router.get('/:id', proteger, async (req, res) => {
    try {
        const canto = await Canto.findById(req.params.id);

        if (!canto) {
            return res.status(404).json({ success: false, message: 'Canto no encontrado' });
        }

        res.status(200).json({
            success: true,
            canto
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener canto'
        });
    }
});

// @route   PUT /api/cantos/:id
// @desc    Actualizar canto
// @access  Private (Admin/Consejo/Formador/Animador)
router.put('/:id', proteger, autorizarRoles('admin', 'consejo', 'animador', 'coordinador'), upload.single('archivo'), async (req, res) => {
    try {
        const datosActualizar = { ...req.body };

        if (req.file) {
            datosActualizar.archivoUrl = `${req.protocol}://${req.get('host')}/uploads/cantos/${req.file.filename}`;
            datosActualizar.archivoNombre = req.file.originalname;
        }

        const canto = await Canto.findByIdAndUpdate(req.params.id, datosActualizar, {
            new: true,
            runValidators: true
        });

        if (!canto) {
            return res.status(404).json({ success: false, message: 'Canto no encontrado' });
        }

        res.status(200).json({
            success: true,
            message: 'Canto actualizado exitosamente',
            canto
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar canto'
        });
    }
});

// @route   DELETE /api/cantos/:id
// @desc    Eliminar canto
// @access  Private (Admin/Consejo/Formador/Animador)
router.delete('/:id', proteger, autorizarRoles('admin', 'consejo', 'animador', 'coordinador'), async (req, res) => {
    try {
        const canto = await Canto.findByIdAndDelete(req.params.id);

        if (!canto) {
            return res.status(404).json({ success: false, message: 'Canto no encontrado' });
        }

        res.status(200).json({
            success: true,
            message: 'Canto eliminado exitosamente'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar canto'
        });
    }
});

module.exports = router;
