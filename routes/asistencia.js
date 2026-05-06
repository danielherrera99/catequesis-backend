const express = require('express');
const router = express.Router();
const Asistencia = require('../models/Asistencia');
const Miembro = require('../models/Miembro');
const { proteger, autorizarRoles } = require('../middleware/auth');

// @route   POST /api/asistencia
// @desc    Registrar asistencia
// @access  Private (Admin/Consejo)
router.post('/', proteger, autorizarRoles('admin', 'consejo'), async (req, res) => {
    try {
        const { Miembro: MiembroId, fecha, tipoReunion, estado, metodoRegistro, observaciones } = req.body;

        // Verificar que el Miembro existe
        const miembroExistente = await Miembro.findById(MiembroId);
        if (!miembroExistente) {
            return res.status(404).json({
                success: false,
                message: 'Miembro no encontrado'
            });
        }

        // Crear registro de asistencia
        const asistencia = await Asistencia.create({
            Miembro: MiembroId,
            fecha: fecha || new Date(),
            tipoReunion,
            estado: estado || 'presente',
            presente: estado === 'presente',
            metodoRegistro,
            observaciones,
            registradoPor: req.Miembro._id
        });

        await asistencia.populate('Miembro', 'nombre apellido foto');

        res.status(201).json({
            success: true,
            message: 'Asistencia registrada exitosamente',
            asistencia
        });
    } catch (error) {
        console.error(error);

        // Manejar error de duplicado
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un registro de asistencia para este Miembro en esta fecha y tipo de reunión'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al registrar asistencia',
            error: error.message
        });
    }
});

// @route   POST /api/asistencia/lote
// @desc    Registrar asistencia masiva (por lote)
// @access  Private (Admin/Consejo)
router.post('/lote', proteger, autorizarRoles('admin', 'consejo'), async (req, res) => {
    try {
        const { asistencias, fecha, tipoReunion } = req.body;
        
        const bulkOps = asistencias.map(asis => {
            const fechaNormalizada = new Date(fecha);
            fechaNormalizada.setHours(12, 0, 0, 0);

            const mId = asis.MiembroId || asis.usuarioId;

            const filter = mId 
                ? { 
                    Miembro: mId, 
                    fecha: { $gte: new Date(fechaNormalizada).setHours(0,0,0,0), $lte: new Date(fechaNormalizada).setHours(23,59,59,999) }, 
                    tipoReunion 
                }
                : { 
                    nombreInvitado: asis.nombreInvitado, 
                    fecha: { $gte: new Date(fechaNormalizada).setHours(0,0,0,0), $lte: new Date(fechaNormalizada).setHours(23,59,59,999) }, 
                    tipoReunion 
                };

            return {
                updateOne: {
                    filter,
                    update: {
                        $set: {
                            Miembro: mId,
                            nombreInvitado: asis.nombreInvitado,
                            fecha: fechaNormalizada,
                            tipoReunion,
                            estado: asis.estado || 'presente',
                            presente: asis.estado === 'presente',
                            metodoRegistro: 'manual_web',
                            observaciones: asis.observaciones || '',
                            registradoPor: req.Miembro._id
                        }
                    },
                    upsert: true
                }
            };
        });

        await Asistencia.bulkWrite(bulkOps);

        res.status(201).json({
            success: true,
            message: 'Asistencia masiva procesada exitosamente'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al procesar asistencia masiva',
            error: error.message
        });
    }
});

// @route   POST /api/asistencia/qr
// @desc    Registrar asistencia mediante código QR
// @access  Private
router.post('/qr', proteger, async (req, res) => {
    try {
        const { qrData, tipoReunion } = req.body;

        // Parsear datos del QR
        const datosQR = JSON.parse(qrData);
        const MiembroId = datosQR.id;

        // Verificar que el Miembro existe
        const miembroEncontrado = await Miembro.findById(MiembroId);
        if (!miembroEncontrado) {
            return res.status(404).json({
                success: false,
                message: 'Miembro no encontrado'
            });
        }

        // Crear registro de asistencia
        const asistencia = await Asistencia.create({
            Miembro: MiembroId,
            fecha: new Date(),
            tipoReunion: tipoReunion || 'semanal',
            presente: true,
            metodoRegistro: 'qr',
            registradoPor: req.Miembro._id
        });

        await asistencia.populate('Miembro', 'nombre apellido foto');

        res.status(201).json({
            success: true,
            message: `Asistencia registrada para ${miembroEncontrado.nombreCompleto}`,
            asistencia
        });
    } catch (error) {
        console.error(error);

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'La asistencia ya fue registrada'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al registrar asistencia por QR',
            error: error.message
        });
    }
});

// @route   GET /api/asistencia
// @desc    Obtener registros de asistencia
// @access  Private
router.get('/', proteger, async (req, res) => {
    try {
        const { fecha, tipoReunion, Miembro } = req.query;

        // Construir filtro
        const filtro = {};
        if (fecha) filtro.fecha = { $gte: new Date(fecha) };
        if (tipoReunion) filtro.tipoReunion = tipoReunion;
        if (Miembro) filtro.Miembro = Miembro;

        const asistencias = await Asistencia.find(filtro)
            .populate('Miembro', 'nombre apellido foto')
            .populate('registradoPor', 'nombre apellido')
            .sort({ fecha: -1 });

        res.status(200).json({
            success: true,
            count: asistencias.length,
            asistencias
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener asistencias',
            error: error.message
        });
    }
});

// @route   GET /api/asistencia/estadisticas/:MiembroId
// @desc    Obtener estadísticas de asistencia de un Miembro
// @access  Private
router.get('/estadisticas/:MiembroId', proteger, async (req, res) => {
    try {
        const { MiembroId } = req.params;

        const totalAsistencias = await Asistencia.countDocuments({
            Miembro: MiembroId,
            presente: true
        });

        const totalFaltas = await Asistencia.countDocuments({
            Miembro: MiembroId,
            presente: false
        });

        const porTipo = await Asistencia.aggregate([
            { $match: { Miembro: MiembroId } },
            {
                $group: {
                    _id: '$tipoReunion',
                    total: { $sum: 1 },
                    presentes: {
                        $sum: { $cond: ['$presente', 1, 0] }
                    }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            estadisticas: {
                totalAsistencias,
                totalFaltas,
                porcentajeAsistencia: totalAsistencias + totalFaltas > 0
                    ? ((totalAsistencias / (totalAsistencias + totalFaltas)) * 100).toFixed(2)
                    : 0,
                porTipo
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas',
            error: error.message
        });
    }
});

// @route   GET /api/asistencia/exportar
// @desc    Exportar reporte de asistencias a Excel
// @access  Private (Admin/Consejo)
router.get('/exportar', proteger, autorizarRoles('admin', 'consejo'), async (req, res) => {
    try {
        const { fechaInicio, fechaFin } = req.query;
        let filtro = {};

        if (fechaInicio && fechaFin) {
            const start = new Date(fechaInicio);
            start.setHours(0, 0, 0, 0); // Inicio del día
            
            const end = new Date(fechaFin);
            end.setHours(23, 59, 59, 999); // Final del día logístico
            
            filtro.fecha = { $gte: start, $lte: end };
        }

        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Asistencias');

        worksheet.columns = [
            { header: 'Fecha', key: 'fecha', width: 15 },
            { header: 'Miembro', key: 'Miembro', width: 30 },
            { header: 'Tipo Reunión', key: 'tipo', width: 15 },
            { header: 'Estado', key: 'estado', width: 10 },
            { header: 'Método', key: 'metodo', width: 15 },
            { header: 'Observaciones', key: 'observaciones', width: 30 },
        ];

        const asistencias = await Asistencia.find(filtro)
            .populate('Miembro', 'nombre apellido')
            .sort({ fecha: -1 });

        asistencias.forEach(a => {
            worksheet.addRow({
                fecha: a.fecha ? new Date(a.fecha).toLocaleDateString('es-ES', { timeZone: 'America/Lima' }) : '',
                Miembro: a.Miembro ? `${a.Miembro.nombre} ${a.Miembro.apellido}` : 'Miembro Eliminado',
                tipo: a.tipoReunion,
                estado: a.estado ? (a.estado.charAt(0).toUpperCase() + a.estado.slice(1)) : (a.presente ? 'Presente' : 'Falta'),
                metodo: a.metodoRegistro,
                observaciones: a.observaciones || ''
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=asistencias.xlsx');

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al exportar excel',
            error: error.message
        });
    }
});

module.exports = router;
