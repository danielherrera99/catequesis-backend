const express = require('express');
const router = express.Router();
const Evento = require('../models/Evento');
const Miembro = require('../models/Miembro');
const { proteger, autorizarRoles } = require('../middleware/auth');
const { enviarNotificacionGrupal } = require('../utils/expoPush');

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configurar almacenamiento en memoria para subir a Drive
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten imágenes'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: fileFilter
});

const { uploadImageToDrive } = require('../utils/drive');

// @route   GET /api/eventos
// @desc    Obtener todos los eventos futuros
// @access  Private
router.get('/', proteger, async (req, res) => {
    try {
        // Obtener eventos desde hoy en adelante
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const eventos = await Evento.find({ fecha: { $gte: hoy } })
            .sort({ fecha: 1 })
            .populate('creadoPor', 'nombre apellido');

        res.status(200).json({
            success: true,
            count: eventos.length,
            eventos
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener eventos'
        });
    }
});

// @route   POST /api/eventos
// @desc    Crear nuevo evento
// @access  Private (Admin/Consejo)
router.post('/', proteger, autorizarRoles('admin', 'consejo', 'coordinador'), upload.single('imagen'), async (req, res) => {
    try {
        const { titulo, descripcion, fecha, hora, lugar, tipo, lat, lng } = req.body;

        let imagenUrl = null;

        if (req.file) {
            // Subir a Google Drive
            const fileName = `Evento_${Date.now()}_${req.file.originalname}`;
            const fileId = await uploadImageToDrive(req.file.buffer, fileName, req.file.mimetype);
            imagenUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
        }

        const eventoData = {
            titulo,
            descripcion,
            fecha,
            hora,
            lugar,
            tipo,
            creadoPor: req.Miembro._id,
            imagenUrl
        };

        const hasUbicacion = lat !== undefined && lat !== null && lat !== '' && 
                            lng !== undefined && lng !== null && lng !== '';
        
        if (hasUbicacion) {
            eventoData.ubicacion = {
                lat: parseFloat(lat),
                lng: parseFloat(lng)
            };
        }

        const evento = await Evento.create(eventoData);

        // Notificar a todos los Miembros activos
        try {
            const MiembrosActivos = await Miembro.find({ activo: true, expoPushToken: { $ne: null } });
            const tokens = MiembrosActivos.map(u => u.expoPushToken);
            if (tokens.length > 0) {
                await enviarNotificacionGrupal(
                    tokens, 
                    `📅 Nuevo Evento Programado: ${titulo}`, 
                    `${lugar ? '📍 ' + lugar + ' - ' : ''}${new Date(fecha).toLocaleDateString()} a las ${hora}`,
                    { id: evento._id, tipo: 'evento' }
                );
            }
        } catch (pushErr) {
            console.error('Error enviando notificaciones para evento:', pushErr);
        }

        res.status(201).json({
            success: true,
            message: 'Evento creado exitosamente',
            evento
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: `Error al crear evento: ${error.message}`
        });
    }
});

// @route   DELETE /api/eventos/:id
// @desc    Eliminar evento
// @access  Private (Admin/Consejo)
router.delete('/:id', proteger, autorizarRoles('admin', 'consejo'), async (req, res) => {
    try {
        const evento = await Evento.findById(req.params.id);

        if (!evento) {
            return res.status(404).json({ success: false, message: 'Evento no encontrado' });
        }

        await evento.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Evento eliminado'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar evento'
        });
    }
});

// @route   PUT /api/eventos/:id
// @desc    Actualizar evento
// @access  Private (Admin/Consejo)
router.put('/:id', proteger, autorizarRoles('admin', 'consejo', 'coordinador'), upload.single('imagen'), async (req, res) => {
    try {
        const camposActualizar = { ...req.body };

        if (req.file) {
            // Subir a Google Drive
            const fileName = `Evento_Edit_${Date.now()}_${req.file.originalname}`;
            const fileId = await uploadImageToDrive(req.file.buffer, fileName, req.file.mimetype);
            camposActualizar.imagenUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
        }

        if (req.body.lat && req.body.lng) {
            camposActualizar.ubicacion = {
                lat: parseFloat(req.body.lat),
                lng: parseFloat(req.body.lng)
            };
        }

        const evento = await Evento.findByIdAndUpdate(req.params.id, camposActualizar, {
            new: true,
            runValidators: true
        });

        if (!evento) {
            return res.status(404).json({ success: false, message: 'Evento no encontrado' });
        }

        res.status(200).json({
            success: true,
            message: 'Evento actualizado exitosamente',
            evento
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar evento'
        });
    }
});

module.exports = router;
