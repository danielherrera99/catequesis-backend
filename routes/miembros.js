const express = require('express');
const router = express.Router();
const Miembro = require('../models/Miembro');
const { proteger, autorizarRoles } = require('../middleware/auth');

// @route   GET /api/Miembros
// @desc    Obtener todos los Miembros
// @access  Private
router.get('/', proteger, async (req, res) => {
    try {
        let query = { activo: true };

        // Si es admin o consejo, permitir ver inactivos/pendientes
        const esAdmin = req.Miembro.rol === 'admin' ||
            req.Miembro.rol === 'consejo' ||
            ['coordinador', 'vice-coordinador', 'secretario', 'tesorero', 'formador', 'animador'].includes(req.Miembro.cargo);

        if (esAdmin) {
            if (req.query.todos === 'true') {
                query = {};
            } else if (req.query.pendientes === 'true') {
                query = { activo: false };
            }
        }

        const Miembros = await Miembro.find(query)
            .select('-password')
            .sort({ nombre: 1 });

        res.status(200).json({
            success: true,
            count: Miembros.length,
            Miembros
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener Miembros',
            error: error.message
        });
    }
});

// @route   GET /api/Miembros/:id
// @desc    Obtener un Miembro por ID
// @access  Private
router.get('/:id', proteger, async (req, res) => {
    try {
        const miembroDoc = await Miembro.findById(req.params.id).select('-password');

        if (!miembroDoc) {
            return res.status(404).json({
                success: false,
                message: 'Miembro no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            Miembro: miembroDoc
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener Miembro',
            error: error.message
        });
    }
});

// @route   PUT /api/Miembros/:id
// @desc    Actualizar información de un Miembro
// @access  Private (Admin/Consejo)
router.put('/:id', proteger, autorizarRoles('admin', 'consejo'), async (req, res) => {
    try {
        const camposPermitidos = [
            'nombre', 'apellido', 'telefono', 'fechaNacimiento',
            'fechaIngreso', 'fechaPromesa', 'rol', 'cargo',
            'etapaFormacion', 'foto', 'activo', 'username', 'password', 'email'
        ];

        let miembroUpdate = await Miembro.findById(req.params.id);

        if (!miembroUpdate) {
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
                        miembroUpdate[campo] = valor;
                    }
                    return;
                }

                // Campos obligatorios: no permitir vacíos
                if (['nombre', 'apellido', 'username'].includes(campo) && (!valor || valor.trim() === '')) {
                    return;
                }

                // Campos opcionales: permitir vacíos (convertir a null si es fecha o string vacío)
                if (['fechaNacimiento', 'fechaIngreso', 'fechaPromesa', 'email'].includes(campo)) {
                    if (valor === '' || valor === null) {
                        if (campo === 'email') {
                            miembroUpdate[campo] = undefined;
                        } else {
                            miembroUpdate[campo] = null;
                        }
                    } else {
                        miembroUpdate[campo] = valor;
                    }
                } else {
                    // Otros campos (telefono, rol, cargo, email, etc.)
                    miembroUpdate[campo] = valor;
                }
            }
        });

        await miembroUpdate.save();

        // Devolver Miembro sin password
        const miembroFinal = await Miembro.findById(req.params.id).select('-password');

        res.status(200).json({
            success: true,
            message: 'Miembro actualizado exitosamente',
            Miembro: miembroFinal
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar Miembro',
            error: error.message
        });
    }
});

// @route   GET /api/Miembros/aniversarios/proximos
// @desc    Obtener próximos aniversarios (ingreso y promesa)
// @access  Private
router.get('/aniversarios/proximos', proteger, async (req, res) => {
    try {
        const hoy = new Date();
        const mesActual = hoy.getMonth();
        const diaActual = hoy.getDate();

        const Miembros = await Miembro.find({ activo: true }).select('-password');

        const aniversarios = Miembros.map(m => {
            const aniversariosMiembro = [];

            // Aniversario de ingreso
            if (m.fechaIngreso) {
                const fechaIngreso = new Date(m.fechaIngreso);
                const mesIngreso = fechaIngreso.getMonth();
                const diaIngreso = fechaIngreso.getDate();

                aniversariosMiembro.push({
                    Miembro: {
                        id: m._id,
                        nombre: m.nombreCompleto,
                        foto: m.foto
                    },
                    tipo: 'ingreso',
                    fecha: new Date(hoy.getFullYear(), mesIngreso, diaIngreso),
                    años: hoy.getFullYear() - fechaIngreso.getFullYear()
                });
            }

            // Aniversario de promesa
            if (m.fechaPromesa) {
                const fechaPromesa = new Date(m.fechaPromesa);
                const mesPromesa = fechaPromesa.getMonth();
                const diaPromesa = fechaPromesa.getDate();

                aniversariosMiembro.push({
                    Miembro: {
                        id: m._id,
                        nombre: m.nombreCompleto,
                        foto: m.foto
                    },
                    tipo: 'promesa',
                    fecha: new Date(hoy.getFullYear(), mesPromesa, diaPromesa),
                    años: hoy.getFullYear() - fechaPromesa.getFullYear()
                });
            }

            return aniversariosMiembro;
        }).flat();

        // Filtrar próximos 30 días
        const proximos = aniversarios.filter(aniv => {
            const diff = aniv.fecha - hoy;
            return diff >= 0 && diff <= 30 * 24 * 60 * 60 * 1000;
        }).sort((a, b) => a.fecha - b.fecha);

        res.status(200).json({
            success: true,
            count: proximos.length,
            aniversarios: proximos
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener aniversarios',
            error: error.message
        });
    }
});

// @route   DELETE /api/Miembros/:id
// @desc    Eliminar Miembro (Si está pendiente: hard delete. Si está activo: soft delete)
// @access  Private (Admin/Consejo)
router.delete('/:id', proteger, autorizarRoles('admin', 'consejo'), async (req, res) => {
    try {
        const miembroDelete = await Miembro.findById(req.params.id);

        if (!miembroDelete) {
            return res.status(404).json({
                success: false,
                message: 'Miembro no encontrado'
            });
        }

        // Si el Miembro ya está inactivo (pendiente), eliminarlo físicamente
        if (!miembroDelete.activo) {
            await Miembro.findByIdAndDelete(req.params.id);
            return res.status(200).json({
                success: true,
                message: 'Solicitud rechazada y eliminada permanentemente'
            });
        }

        // Si el Miembro está activo, desactivarlo (soft delete)
        miembroDelete.activo = false;
        await miembroDelete.save();

        res.status(200).json({
            success: true,
            message: 'Miembro desactivado exitosamente'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar Miembro',
            error: error.message
        });
    }
});

// @route   POST /api/Miembros/comunicacion/masivo
// @desc    Enviar correos masivos o individuales a la fraternidad/externos
// @access  Private (Admin/Consejo)
router.post('/comunicacion/masivo', proteger, autorizarRoles('admin', 'consejo'), async (req, res) => {
    try {
        const { filtro, asunto, mensaje, correoManual, MiembroId } = req.body;

        if (!asunto || !mensaje) {
            return res.status(400).json({ success: false, message: 'Asunto y mensaje son requeridos.' });
        }

        let destinatarios = [];

        // Caso 1: Correo manual externo
        if (filtro === 'manual' && correoManual) {
            destinatarios = [{ email: correoManual.toLowerCase(), name: 'Invitado Externo' }];
        } 
        // Caso 2: Un solo Miembro específico
        else if (filtro === 'individual' && MiembroId) {
            const u = await Miembro.findById(MiembroId).select('nombre email');
            if (!u || !u.email) {
                return res.status(400).json({ success: false, message: 'El Miembro seleccionado no existe o no tiene correo registrado.' });
            }
            destinatarios = [{ email: u.email, name: u.nombre }];
        }
        // Caso 3: Filtro grupal (Todos, Rol, Etapa)
        else {
            let query = { activo: true, email: { $exists: true, $ne: null } };
            
            if (filtro && filtro !== 'todos') {
                if (['admin', 'consejo', 'miembro'].includes(filtro)) {
                    query.rol = filtro;
                } else if (['aspirante', 'iniciado', 'en_formacion', 'promesado'].includes(filtro)) {
                    query.etapaFormacion = filtro;
                }
            }

            const Miembros = await Miembro.find(query).select('nombre email');
            if (Miembros.length === 0) {
                return res.status(400).json({ success: false, message: 'No se encontraron destinatarios con correo registrado para este filtro.' });
            }
            destinatarios = Miembros.map(u => ({ email: u.email, name: u.nombre }));
        }

        // Usar Brevo API
        if (process.env.BREVO_API_KEY) {
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
                    to: destinatarios,
                    subject: asunto,
                    htmlContent: `
                        <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
                            <div style="background: #624b2b; color: white; padding: 20px; text-align: center;">
                                <h1>Comunicado Catequesis Pomalca</h1>
                            </div>
                            <div style="padding: 20px; border: 1px solid #eee;">
                                ${mensaje.replace(/\n/g, '<br>')}
                            </div>
                            <div style="padding: 10px; font-size: 11px; color: #777; text-align: center;">
                                <p>Este es un correo oficial enviado desde el panel administrativo de Catequesis Pomalca.</p>
                            </div>
                        </div>
                    `
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error detallado de Brevo:', errorData);
                return res.status(response.status).json({
                    success: false,
                    message: 'Brevo API rechazó el envío',
                    error: errorData.message || 'Error desconocido en el proveedor de correo'
                });
            }

            return res.status(200).json({ 
                success: true, 
                message: `Comunicado enviado exitosamente a ${destinatarios.length} destinatario(s).` 
            });
        } else {
            return res.status(500).json({ 
                success: false, 
                message: 'La configuración de envío de correos (Brevo) no está disponible en el servidor.' 
            });
        }
    } catch (error) {
        console.error('Error en envío masivo:', error);
        res.status(500).json({
            success: false,
            message: 'Error al enviar el comunicado masivo',
            error: error.message
        });
    }
});

module.exports = router;
