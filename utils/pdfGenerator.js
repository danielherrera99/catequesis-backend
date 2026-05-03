const PDFDocument = require('pdfkit');

/**
 * Genera un Buffer de un archivo PDF a partir del objeto Acta
 * @param {Object} actaData Objeto que contiene título, fecha, tipo de reunión, contenido, asistentes y acuerdos
 * @returns {Promise<Buffer>} Promesa con el Buffer del PDF resultante
 */
const generarActaPDF = (actaData) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            let buffers = [];
            
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });

            // --- ESTILO Y CONTENIDO DEL PDF ---

            // Cabecera
            doc.fontSize(20).font('Helvetica-Bold').text('FRATERNIDAD Catequesis Pomalca', { align: 'center' });
            doc.moveDown(0.5);
            doc.fontSize(16).font('Helvetica-Bold').text(`ACTA DE REUNIÓN`, { align: 'center' });
            doc.moveDown(1.5);

            // Título
            doc.fontSize(14).font('Helvetica-Bold').text(actaData.titulo.toUpperCase(), { align: 'center' });
            doc.moveDown(1);

            // Información General
            doc.fontSize(12).font('Helvetica-Bold').text('Detalles Generales:');
            doc.moveDown(0.2);
            doc.font('Helvetica').text(`Fecha: ${new Date(actaData.fecha).toLocaleDateString()}`);
            doc.text(`Tipo de Reunión: ${actaData.tipoReunion.toUpperCase()}`);
            doc.moveDown(1);

            // Contenido / Desarrollo de la reunión
            doc.font('Helvetica-Bold').text('Desarrollo de la Reunión:');
            doc.moveDown(0.5);
            doc.font('Helvetica').text(actaData.contenido, {
                align: 'justify',
                indent: 20
            });
            doc.moveDown(1.5);

            // Asistentes
            if (actaData.asistentes && actaData.asistentes.length > 0) {
                doc.font('Helvetica-Bold').text('Asistentes:');
                doc.moveDown(0.5);
                doc.font('Helvetica');
                actaData.asistentes.forEach(asis => {
                    const nombre = asis.nombreCompleto ? asis.nombreCompleto : `${asis.nombre} ${asis.apellido}`;
                    doc.text(`• ${nombre}`, { indent: 20 });
                });
                doc.moveDown(1);
            }

            // Acuerdos
            if (actaData.acuerdos && actaData.acuerdos.length > 0) {
                doc.font('Helvetica-Bold').text('Acuerdos Tomados:');
                doc.moveDown(0.5);
                doc.font('Helvetica');
                actaData.acuerdos.forEach((acuerdo, idx) => {
                    const resNombre = acuerdo.responsable ? (acuerdo.responsable.nombreCompleto || `${acuerdo.responsable.nombre} ${acuerdo.responsable.apellido}`) : 'Sin asignar';
                    const fLimite = acuerdo.fechaLimite ? new Date(acuerdo.fechaLimite).toLocaleDateString() : 'Sin fecha';
                    doc.text(`${idx + 1}. ${acuerdo.descripcion}`, { indent: 20 });
                    doc.text(`   Responsable: ${resNombre} - Límite: ${fLimite}`, { indent: 20 });
                    doc.moveDown(0.5);
                });
            }

            // Pie de página con firma
            doc.moveDown(3);
            doc.font('Helvetica-Bold').text('______________________________', { align: 'center' });
            const creador = actaData.creadoPor ? (actaData.creadoPor.nombreCompleto || `${actaData.creadoPor.nombre} ${actaData.creadoPor.apellido}`) : 'Secretaría de la Fraternidad';
            doc.text(creador, { align: 'center' });
            doc.font('Helvetica').fontSize(10).text('Registrado en Sistema', { align: 'center' });

            // Finalizar PDF
            doc.end();
        } catch (err) {
            reject(err);
        }
    });
};

module.exports = {
    generarActaPDF
};
