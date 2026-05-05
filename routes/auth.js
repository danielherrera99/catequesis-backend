const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Miembro = require('../models/Miembro');
const { generarToken } = require('../middleware/auth');
const QRCode = require('qrcode');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configurar Cloudinary con variables de entorno
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configurar almacenamiento de fotos de perfil en Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'Catequesis Pomalca_perfiles', // Carpeta en Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg'],
    public_id: (req, file) => `perfil-${req.Miembro._id}-${Date.now()}`,
  },
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Formato de archivo no soportado. Solo imágenes.'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileFilter
});

// @route   POST /api/auth/foto
// @desc    Subir foto de perfil
// @access  Private
router.post('/foto', require('../middleware/auth').proteger, upload.single('foto'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Por favor sube una imagen'
            });
        }

        // En Cloudinary, la URL segura viene en req.file.path
        const archivoUrl = req.file.path;

        const miembroDoc = await Miembro.findById(req.Miembro._id);
        if (!miembroDoc) {
            return res.status(404).json({ success: false, message: 'Miembro no encontrado' });
        }

        miembroDoc.foto = archivoUrl;
        await miembroDoc.save();

        res.status(200).json({
            success: true,
            message: 'Foto de perfil actualizada correctamente',
            foto: archivoUrl
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al subir foto de perfil',
            error: error.message
        });
    }
});

// @route   POST /api/auth/registro
// @desc    Registrar nuevo Miembro
// @access  Public
router.post('/registro', [
    body('nombre').notEmpty().withMessage('El nombre es requerido'),
    body('apellido').notEmpty().withMessage('El apellido es requerido'),
    body('username').notEmpty().withMessage('El Miembro es requerido'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: errors.array()[0].msg
            });
        }

        const { nombre, apellido, username, email, password, telefono, fechaNacimiento, contactoEmergencia, nombreContactoEmergencia } = req.body;

        // Verificar si el Miembro ya existe por username o email
        const miembroExiste = await Miembro.findOne({ 
            $or: [{ username }, { email }]
        });
        
        if (miembroExiste) {
            if (miembroExiste.username === username) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre de Miembro ya está en uso'
                });
            }
            if (MiembroExiste.email === email) {
                return res.status(400).json({
                    success: false,
                    message: 'El correo electrónico ya está registrado'
                });
            }
        }

        // Crear Miembro
        const nuevoMiembro = await Miembro.create({
            nombre,
            apellido,
            username,
            email: email || undefined, // Evitar guardar string vacío para que funcione sparse index
            password,
            telefono,
            fechaNacimiento,
            contactoEmergencia,
            nombreContactoEmergencia
        });

        // Generar código QR para el Miembro
        const qrData = JSON.stringify({
            id: nuevoMiembro._id,
            nombre: nuevoMiembro.nombreCompleto,
            username: nuevoMiembro.username
        });

        const qrCode = await QRCode.toDataURL(qrData);
        nuevoMiembro.codigoQR = qrCode;
        await nuevoMiembro.save();

        // No generamos token porque el Miembro debe ser aprobado primero

        res.status(201).json({
            success: true,
            message: 'Registro exitoso. Tu cuenta está pendiente de aprobación por el Consejo.',
            usuario: {
                id: nuevoMiembro._id,
                nombre: nuevoMiembro.nombre,
                apellido: nuevoMiembro.apellido,
                username: nuevoMiembro.username
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar Miembro',
            error: error.message
        });
    }
});

// @route   POST /api/auth/login
// @desc    Iniciar sesión
// @access  Public
router.post('/login', [
    body('username').notEmpty().withMessage('El Miembro es requerido'),
    body('password').notEmpty().withMessage('La contraseña es requerida')
], async (req, res) => {
    try {
        const { username, password } = req.body;

        // Verificar si el Miembro existe (sensible a mayúsculas/minúsculas)
        const miembroLogueado = await Miembro.findOne({ username }).select('+password');

        if (!miembroLogueado) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // Verificar contraseña
        const passwordCorrecto = await miembroLogueado.compararPassword(password);
        if (!passwordCorrecto) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // Verificar si el Miembro está activo
        if (!miembroLogueado.activo) {
            return res.status(401).json({
                success: false,
                message: 'Tu cuenta está pendiente de aprobación o ha sido desactivada. Contacta al Consejo.'
            });
        }

        // Generar QR si no existe (Self-healing)
        if (!miembroLogueado.codigoQR) {
            try {
                const qrData = JSON.stringify({
                    id: miembroLogueado._id,
                    nombre: miembroLogueado.nombreCompleto || `${miembroLogueado.nombre} ${miembroLogueado.apellido}`,
                    username: miembroLogueado.username
                });
                miembroLogueado.codigoQR = await QRCode.toDataURL(qrData);
                await miembroLogueado.save();
            } catch (qrError) {
                console.error('Error generando QR en login:', qrError);
            }
        }

        // Generar token
        const token = generarToken(miembroLogueado._id);

        res.status(200).json({
            success: true,
            message: 'Inicio de sesión exitoso',
            token,
            usuario: {
                id: miembroLogueado._id,
                nombre: miembroLogueado.nombre,
                apellido: miembroLogueado.apellido,
                username: miembroLogueado.username,
                email: miembroLogueado.email,
                rol: miembroLogueado.rol,
                cargo: miembroLogueado.cargo,

                foto: miembroLogueado.foto,
                codigoQR: miembroLogueado.codigoQR
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al iniciar sesión',
            error: error.message
        });
    }
});

// @route   GET /api/auth/perfil
// @desc    Obtener perfil del Miembro autenticado
// @access  Private
router.get('/perfil', require('../middleware/auth').proteger, async (req, res) => {
    try {
        const miembroPerfil = await Miembro.findById(req.Miembro._id);

        // Generar QR si no existe (Self-healing)
        if (miembroPerfil && !miembroPerfil.codigoQR) {
            try {
                const qrData = JSON.stringify({
                    id: miembroPerfil._id,
                    nombre: miembroPerfil.nombreCompleto || `${miembroPerfil.nombre} ${miembroPerfil.apellido}`,
                    username: miembroPerfil.username
                });
                miembroPerfil.codigoQR = await QRCode.toDataURL(qrData);
                await miembroPerfil.save();
            } catch (qrError) {
                console.error('Error generando QR en perfil:', qrError);
            }
        }

        res.status(200).json({
            success: true,
            usuario: miembroPerfil
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener perfil',
            error: error.message
        });
    }
});

// @route   PUT /api/auth/perfil
// @desc    Actualizar perfil del Miembro autenticado
// @access  Private
router.put('/perfil', require('../middleware/auth').proteger, async (req, res) => {
    try {
        const camposPermitidos = [
            'nombre', 'apellido', 'telefono', 'fechaNacimiento',
            'fechaIngreso', 'fechaPromesa', 'foto', 'password',
            'contactoEmergencia', 'nombreContactoEmergencia', 'expoPushToken', 'email'
        ];

        let miembroEdit = await Miembro.findById(req.Miembro._id);

        if (!miembroEdit) {
            return res.status(404).json({
                success: false,
                message: 'Miembro no encontrado'
            });
        }

        camposPermitidos.forEach(campo => {
            const valor = req.body[campo];
            if (valor !== undefined) {
                // Si es password, solo actualizar si tiene contenido y longitud válida
                if (campo === 'password') {
                    if (valor && valor.trim().length >= 6) {
                        miembroEdit[campo] = valor;
                    }
                    return;
                }

                // Campos obligatorios: no permitir vacíos
                if (['nombre', 'apellido'].includes(campo) && (!valor || valor.trim() === '')) {
                    return;
                }

                // Campos opcionales: permitir vacíos (convertir a null si es fecha o string vacío)
                if (['fechaNacimiento', 'fechaIngreso', 'fechaPromesa', 'email'].includes(campo)) {
                    if (valor === '' || valor === null) {
                        // Para evitar el error E11000 en el índice sparse unique de email
                        if (campo === 'email') {
                            miembroEdit[campo] = undefined;
                        } else {
                            miembroEdit[campo] = null;
                        }
                    } else {
                        miembroEdit[campo] = valor;
                    }
                } else {
                    // Otros campos (telefono, foto)
                    miembroEdit[campo] = valor;
                }
            }
        });

        await miembroEdit.save();

        // Devolver Miembro sin password
        miembroEdit = await Miembro.findById(req.Miembro._id).select('-password');

        res.status(200).json({
            success: true,
            message: 'Perfil actualizado exitosamente',
            usuario: miembroEdit
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar perfil',
            error: error.message
        });
    }
});

// @route   POST /api/auth/recuperar-password
// @desc    Enviar código de recuperación al correo
// @access  Public
router.post('/recuperar-password', async (req, res) => {
    try {
        const { usernameOrEmail } = req.body;
        if (!usernameOrEmail) {
            return res.status(400).json({ success: false, message: 'Por favor, proporciona un Miembro o correo.' });
        }

        // Buscar por email o username
        const miembroRecuperar = await Miembro.findOne({
            $or: [{ email: usernameOrEmail.toLowerCase() }, { username: usernameOrEmail }]
        });

        if (!miembroRecuperar) {
            return res.status(404).json({ success: false, message: 'No existe una cuenta con esa información.' });
        }

        if (!miembroRecuperar.email) {
            return res.status(400).json({ success: false, message: 'Esta cuenta no tiene un correo registrado. Contacta al administrador.' });
        }

        // Generar código de 6 dígitos
        const crypto = require('crypto');
        const resetCode = crypto.randomInt(100000, 999999).toString();

        // Hashear el código antes de guardarlo por seguridad (opcional, pero buena práctica)
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        Miembro.resetPasswordCode = await bcrypt.hash(resetCode, salt);
        Miembro.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutos

        await Miembro.save({ validateBeforeSave: false });

        const mensaje = `
            <h2>Recuperación de Contraseña - Catequesis Pomalca</h2>
            <p>Hola ${Miembro.nombre},</p>
            <p>Has solicitado restablecer tu contraseña. Utiliza el siguiente código de 6 dígitos en la aplicación:</p>
            <h1 style="background: #f4f4f4; padding: 10px; text-align: center; letter-spacing: 5px; color: #624b2b;">${resetCode}</h1>
            <p>Este código expira en 15 minutos.</p>
            <p>Si no fuiste tú, puedes ignorar este correo.</p>
        `;

        // Usar Brevo API si está configurada (Recomendado para Render Free Tier)
        if (process.env.BREVO_API_KEY) {
            try {
                const response = await fetch('https://api.brevo.com/v3/smtp/email', {
                    method: 'POST',
                    headers: {
                        'accept': 'application/json',
                        'api-key': process.env.BREVO_API_KEY,
                        'content-type': 'application/json'
                    },
                    body: JSON.stringify({
                        sender: {
                            name: 'Catequesis Pomalca App',
                            email: process.env.EMAIL_USER || 'Catequesis Pomalcapomalca@gmail.com'
                        },
                        to: [{ email: Miembro.email, name: Miembro.nombre }],
                        subject: 'Código de Recuperación de Contraseña',
                        htmlContent: mensaje
                    })
                });

                if (!response.ok) {
                    const errorData = await response.text();
                    console.error('Error de Brevo API:', errorData);
                    throw new Error('Falló el envío a través de Brevo API');
                }

                return res.status(200).json({ success: true, message: 'Código enviado al correo electrónico registrado.' });
            } catch (err) {
                console.error('Error enviando email con Brevo:', err);
                Miembro.resetPasswordCode = undefined;
                Miembro.resetPasswordExpire = undefined;
                await Miembro.save({ validateBeforeSave: false });
                return res.status(500).json({ success: false, message: 'No se pudo enviar el correo. Verifica la configuración de Brevo.' });
            }
        }

        // Fallback a Nodemailer (Funciona en local, pero Render bloquea el puerto 465)
        const nodemailer = require('nodemailer');
        
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER || 'Catequesis Pomalca.app@gmail.com',
                pass: process.env.EMAIL_PASS || 'tu-contrasena-de-aplicacion'
            }
        });

        try {
            await transporter.sendMail({
                from: `"Catequesis Pomalca App" <${process.env.EMAIL_USER || 'Catequesis Pomalca.app@gmail.com'}>`,
                to: Miembro.email,
                subject: 'Código de Recuperación de Contraseña',
                html: mensaje
            });

            res.status(200).json({ success: true, message: 'Código enviado al correo electrónico registrado.' });
        } catch (err) {
            console.error('Error enviando email con Nodemailer:', err);
            Miembro.resetPasswordCode = undefined;
            Miembro.resetPasswordExpire = undefined;
            await Miembro.save({ validateBeforeSave: false });
            return res.status(500).json({ success: false, message: 'No se pudo enviar el correo. Verifica la configuración del servidor.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
    }
});

// @route   POST /api/auth/verificar-codigo
// @desc    Verificar que el código ingresado es correcto
// @access  Public
router.post('/verificar-codigo', async (req, res) => {
    try {
        const { usernameOrEmail, codigo } = req.body;
        if (!usernameOrEmail || !codigo) {
            return res.status(400).json({ success: false, message: 'Falta información.' });
        }

        const miembroCheck = await Miembro.findOne({
            $or: [{ email: usernameOrEmail.toLowerCase() }, { username: usernameOrEmail }],
            resetPasswordExpire: { $gt: Date.now() }
        }).select('+resetPasswordCode');

        if (!miembroCheck) {
            return res.status(400).json({ success: false, message: 'Código inválido o ha expirado.' });
        }

        const bcrypt = require('bcryptjs');
        const isMatch = await bcrypt.compare(codigo.toString(), miembroCheck.resetPasswordCode);

        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Código incorrecto.' });
        }

        res.status(200).json({ success: true, message: 'Código verificado correctamente.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
    }
});

// @route   PUT /api/auth/reset-password
// @desc    Restablecer contraseña usando el código verificado
// @access  Public
router.put('/reset-password', async (req, res) => {
    try {
        const { usernameOrEmail, codigo, newPassword } = req.body;
        if (!usernameOrEmail || !codigo || !newPassword) {
            return res.status(400).json({ success: false, message: 'Faltan datos.' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 6 caracteres.' });
        }

        const miembroReset = await Miembro.findOne({
            $or: [{ email: usernameOrEmail.toLowerCase() }, { username: usernameOrEmail }],
            resetPasswordExpire: { $gt: Date.now() }
        }).select('+resetPasswordCode');

        if (!miembroReset) {
            return res.status(400).json({ success: false, message: 'Código inválido o expirado.' });
        }

        const bcrypt = require('bcryptjs');
        const isMatch = await bcrypt.compare(codigo.toString(), miembroReset.resetPasswordCode);

        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Código incorrecto.' });
        }

        // Si todo está bien, actualizar la contraseña
        miembroReset.password = newPassword; // El middleware pre-save hará el hash
        miembroReset.resetPasswordCode = undefined;
        miembroReset.resetPasswordExpire = undefined;
        await miembroReset.save();

        res.status(200).json({ success: true, message: 'Contraseña restablecida exitosamente. Ya puedes iniciar sesión.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
    }
});

module.exports = router;
