const express = require('express');
const router = express.Router();
const Documento = require('../models/Documento');
const { proteger, autorizarRoles } = require('../middleware/auth');

// @route   GET /api/documentos
// @desc    Obtener todos los documentos
// @access  Private
router.get('/', proteger, async (req, res) => {
    try {
        const documentos = await Documento.find()
            .sort({ titulo: 1 });

        res.status(200).json({
            success: true,
            count: documentos.length,
            documentos
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener documentos'
        });
    }
});

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración de Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'uploads/documentos';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, 'doc-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: function (req, file, cb) {
        const filetypes = /pdf|doc|docx|ppt|pptx|xls|xlsx|txt|jpg|jpeg|png/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Error: Tipo de archivo no soportado'));
    }
});

// @route   POST /api/documentos
// @desc    Crear nuevo documento
// @access  Private (Admin/Consejo)
router.post('/', proteger, autorizarRoles('admin', 'consejo'), upload.single('archivo'), async (req, res) => {
    try {
        const { titulo, descripcion, tipo, contenido } = req.body;

        // Validar que haya contenido O archivo
        if (!contenido && !req.file) {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar contenido de texto o subir un archivo'
            });
        }

        const documentoData = {
            titulo,
            descripcion,
            tipo,
            contenido,
            creadoPor: req.Miembro._id
        };

        if (req.file) {
            documentoData.archivoUrl = `/uploads/documentos/${req.file.filename}`;
            documentoData.archivoNombre = req.file.originalname;
        }

        const documento = await Documento.create(documentoData);

        res.status(201).json({
            success: true,
            message: 'Documento creado exitosamente',
            documento
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al crear documento',
            error: error.message
        });
    }
});

// @route   GET /api/documentos/:id
// @desc    Obtener un documento por ID
// @access  Private
router.get('/:id', proteger, async (req, res) => {
    try {
        const documento = await Documento.findById(req.params.id);

        if (!documento) {
            return res.status(404).json({ success: false, message: 'Documento no encontrado' });
        }

        res.status(200).json({
            success: true,
            documento
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener documento'
        });
    }
});

// @route   PUT /api/documentos/:id
// @desc    Actualizar documento
// @access  Private (Admin/Consejo/Formador)
router.put('/:id', proteger, autorizarRoles('admin', 'consejo'), upload.single('archivo'), async (req, res) => {
    try {
        const datosActualizar = { ...req.body };

        if (req.file) {
            datosActualizar.archivoUrl = `/uploads/documentos/${req.file.filename}`;
            datosActualizar.archivoNombre = req.file.originalname;
        }

        const documento = await Documento.findByIdAndUpdate(req.params.id, datosActualizar, {
            new: true,
            runValidators: true
        });

        if (!documento) {
            return res.status(404).json({ success: false, message: 'Documento no encontrado' });
        }

        res.status(200).json({
            success: true,
            message: 'Documento actualizado exitosamente',
            documento
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar documento'
        });
    }
});

// @route   DELETE /api/documentos/:id
// @desc    Eliminar documento
// @access  Private (Admin/Consejo/Formador)
router.delete('/:id', proteger, autorizarRoles('admin', 'consejo'), async (req, res) => {
    try {
        const documento = await Documento.findByIdAndDelete(req.params.id);

        if (!documento) {
            return res.status(404).json({ success: false, message: 'Documento no encontrado' });
        }

        res.status(200).json({
            success: true,
            message: 'Documento eliminado exitosamente'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar documento'
        });
    }
});

module.exports = router;
