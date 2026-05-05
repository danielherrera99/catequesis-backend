const express = require('express');
const router = express.Router();
const Transaccion = require('../models/Transaccion');
const { proteger } = require('../middleware/auth');

// @route   GET /api/tienda
// @desc    Obtener todas las transacciones
// @access  Private
router.get('/', proteger, async (req, res) => {
    try {
        const transacciones = await Transaccion.find()
            .populate('usuario', 'nombre apellido')
            .sort({ fecha: -1 });
        
        // Calcular balance total
        const ingresos = transacciones.filter(t => t.tipo === 'ingreso').reduce((acc, t) => acc + t.monto, 0);
        const egresos = transacciones.filter(t => t.tipo === 'egreso').reduce((acc, t) => acc + t.monto, 0);
        const balance = ingresos - egresos;

        res.json({
            success: true,
            transacciones,
            resumen: {
                ingresos,
                egresos,
                balance
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al obtener transacciones' });
    }
});

// @route   POST /api/tienda
// @desc    Crear una nueva transacción
// @access  Private
router.post('/', proteger, async (req, res) => {
    const { tipo, monto, descripcion, categoria, fecha } = req.body;

    try {
        const nuevaTransaccion = new Transaccion({
            tipo,
            monto,
            descripcion,
            categoria: categoria || 'General',
            fecha: fecha || Date.now(),
            usuario: req.Miembro._id
        });

        await nuevaTransaccion.save();
        res.status(201).json({ success: true, transaccion: nuevaTransaccion });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al crear transacción' });
    }
});

// @route   DELETE /api/tienda/:id
// @desc    Eliminar una transacción
// @access  Private
router.delete('/:id', proteger, async (req, res) => {
    try {
        const transaccion = await Transaccion.findById(req.params.id);
        if (!transaccion) {
            return res.status(404).json({ message: 'Transacción no encontrada' });
        }

        // Solo admin puede borrar? O quien la creó?
        // Por seguridad, pondremos que sea admin o consejo
        if (req.Miembro.rol !== 'admin' && req.Miembro.rol !== 'consejo') {
            return res.status(403).json({ message: 'No autorizado' });
        }

        await transaccion.deleteOne();
        res.json({ success: true, message: 'Transacción eliminada' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al eliminar transacción' });
    }
});

module.exports = router;
