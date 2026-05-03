const express = require('express');
const router = express.Router();
const Galeria = require('../models/Galeria');
const { proteger, autorizarRoles } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configurar almacenamiento de archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'uploads/galeria';
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
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
        cb(null, true);
    } else {
        cb(new Error('Formato de archivo no soportado. Solo imágenes y videos.'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for videos
    fileFilter: fileFilter
});

// @route   GET /api/galeria
// @desc    Obtener toda la galería
// @access  Private
router.get('/', proteger, async (req, res) => {
    try {
        const galeria = await Galeria.find()
            .sort({ fecha: -1 })
            .populate('subidoPor', 'nombre apellido');

        res.status(200).json({
            success: true,
            count: galeria.length,
            galeria
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener galería'
        });
    }
});

// @route   POST /api/galeria
// @desc    Subir foto o video
// @access  Private (Admin/Consejo)
router.post('/', proteger, autorizarRoles('admin', 'consejo'), upload.single('archivo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Por favor sube una imagen o video'
            });
        }

        const { titulo, descripcion, fecha, categoria } = req.body;
        const tipoArchivo = req.file.mimetype.startsWith('video/') ? 'video' : 'imagen';
        const archivoUrl = `${req.protocol}://${req.get('host')}/uploads/galeria/${req.file.filename}`;

        const item = await Galeria.create({
            titulo,
            descripcion,
            fecha: fecha || Date.now(),
            categoria: categoria || 'general',
            archivoUrl,
            tipoArchivo,
            subidoPor: req.Miembro._id
        });

        res.status(201).json({
            success: true,
            message: 'Archivo subido correctamente',
            item
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al subir archivo'
        });
    }
});

// @route   DELETE /api/galeria/:id
// @desc    Eliminar item de galería
// @access  Private (Admin/Consejo)
router.delete('/:id', proteger, autorizarRoles('admin', 'consejo'), async (req, res) => {
    try {
        const item = await Galeria.findById(req.params.id);

        if (!item) {
            return res.status(404).json({ success: false, message: 'Item no encontrado' });
        }

        // Eliminar archivo físico (opcional, pero recomendado)
        // const filename = item.archivoUrl.split('/').pop();
        // const filePath = path.join(__dirname, '../uploads/galeria', filename);
        // if (fs.existsSync(filePath)) {
        //     fs.unlinkSync(filePath);
        // }

        await item.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Item eliminado correctamente'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar item'
        });
    }
});

module.exports = router;
