const express = require('express');
const router = express.Router();
const Formacion = require('../models/Formacion');
const { proteger, autorizarRoles } = require('../middleware/auth');

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configurar almacenamiento en memoria para subir a Drive
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    // Aceptar documentos y audios
    if (file.mimetype.startsWith('application/') || file.mimetype.startsWith('text/') || file.mimetype.startsWith('audio/') || file.mimetype.startsWith('image/')) {
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

const { uploadFileToDrive } = require('../utils/drive');

// @route   GET /api/formacion
// @desc    Obtener todos los temas de formación
// @access  Private
router.get('/', proteger, async (req, res) => {
    try {
        const temas = await Formacion.find()
            .populate('autor', 'nombre apellido')
            .sort({ fecha: -1 });

        res.status(200).json({
            success: true,
            count: temas.length,
            temas
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener temas de formación'
        });
    }
});

// @route   POST /api/formacion
// @desc    Crear nuevo tema de formación
// @access  Private (Admin/Consejo/Formador)
router.post('/', proteger, autorizarRoles('admin', 'consejo'), upload.single('archivo'), async (req, res) => {
    try {
        const { titulo, descripcion, contenido, etiquetas } = req.body;

        let archivoUrl = null;
        let archivoNombre = null;

        if (req.file) {
            const fileName = `Formacion_${Date.now()}_${req.file.originalname}`;
            const fileId = await uploadFileToDrive(req.file.buffer, fileName, 'FORMACION', req.file.mimetype);
            archivoUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
            archivoNombre = req.file.originalname;
        }

        const tema = await Formacion.create({
            titulo,
            descripcion,
            contenido,
            etiquetas,
            autor: req.Miembro._id,
            archivoUrl,
            archivoNombre
        });

        res.status(201).json({
            success: true,
            message: 'Tema de formación creado',
            tema
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al crear tema'
        });
    }
});

// @route   GET /api/formacion/:id
// @desc    Obtener un tema por ID
// @access  Private
router.get('/:id', proteger, async (req, res) => {
    try {
        const tema = await Formacion.findById(req.params.id).populate('autor', 'nombre apellido');
        if (!tema) {
            return res.status(404).json({ success: false, message: 'Tema no encontrado' });
        }
        res.status(200).json({ success: true, tema });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al obtener tema' });
    }
});

// @route   PUT /api/formacion/:id
// @desc    Actualizar tema de formación
// @access  Private (Admin/Consejo/Formador)
router.put('/:id', proteger, autorizarRoles('admin', 'consejo'), upload.single('archivo'), async (req, res) => {
    try {
        const datosActualizar = { ...req.body };

        if (req.file) {
            const fileName = `Formacion_Edit_${Date.now()}_${req.file.originalname}`;
            const fileId = await uploadFileToDrive(req.file.buffer, fileName, 'FORMACION', req.file.mimetype);
            datosActualizar.archivoUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
            datosActualizar.archivoNombre = req.file.originalname;
        }

        const tema = await Formacion.findByIdAndUpdate(req.params.id, datosActualizar, {
            new: true,
            runValidators: true
        });

        if (!tema) {
            return res.status(404).json({ success: false, message: 'Tema no encontrado' });
        }

        res.status(200).json({
            success: true,
            message: 'Tema actualizado exitosamente',
            tema
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar tema'
        });
    }
});

// @route   DELETE /api/formacion/:id
// @desc    Eliminar tema de formación
// @access  Private (Admin/Consejo/Formador)
router.delete('/:id', proteger, autorizarRoles('admin', 'consejo'), async (req, res) => {
    try {
        const tema = await Formacion.findByIdAndDelete(req.params.id);

        if (!tema) {
            return res.status(404).json({ success: false, message: 'Tema no encontrado' });
        }

        res.status(200).json({
            success: true,
            message: 'Tema eliminado exitosamente'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar tema'
        });
    }
});

module.exports = router;
