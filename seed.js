const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Importar modelos
const Miembro = require('./models/Miembro');
const Anuncio = require('./models/Anuncio');
const Acta = require('./models/Acta');
const Asistencia = require('./models/Asistencia');

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('✅ MongoDB conectado'))
    .catch((err) => console.error('❌ Error:', err));

const crearDatosPrueba = async () => {
    try {
        console.log('🗑️  Limpiando datos anteriores...');
        await Miembro.deleteMany({});
        await Anuncio.deleteMany({});
        await Acta.deleteMany({});
        await Asistencia.deleteMany({});

        // Importar QRCode (asegúrate de que esté requerido arriba)
        const QRCode = require('qrcode');

        console.log('👥 Creando Miembros...');

        // Datos de Miembros
        const datosMiembros = [
            {
                nombre: 'Francisco',
                apellido: 'de Asís',
                username: 'francisco',
                email: 'francisco@Catequesis Pomalca.org',
                password: 'paz123',
                telefono: '+1234567890',
                fechaNacimiento: new Date('1995-05-15'),
                fechaIngreso: new Date('2018-03-20'),
                fechaPromesa: new Date('2020-10-04'),
                rol: 'admin',
                cargo: 'coordinador',
                etapaFormacion: 'promesado'
            },
            {
                nombre: 'Clara',
                apellido: 'de Asís',
                username: 'clara',
                email: 'clara@Catequesis Pomalca.org',
                password: 'paz123',
                telefono: '+1234567891',
                fechaNacimiento: new Date('1996-08-11'),
                fechaIngreso: new Date('2018-06-15'),
                fechaPromesa: new Date('2020-10-04'),
                rol: 'consejo',
                cargo: 'secretario',
                etapaFormacion: 'promesado'
            },
            {
                nombre: 'Antonio',
                apellido: 'de Padua',
                username: 'antonio',
                email: 'antonio@Catequesis Pomalca.org',
                password: 'paz123',
                telefono: '+1234567892',
                fechaNacimiento: new Date('1998-06-13'),
                fechaIngreso: new Date('2020-01-10'),
                rol: 'consejo',
                cargo: 'tesorero',
                etapaFormacion: 'en_formacion'
            },
            {
                nombre: 'María',
                apellido: 'López',
                username: 'maria',
                email: 'maria@Catequesis Pomalca.org',
                password: 'paz123',
                telefono: '+1234567893',
                fechaNacimiento: new Date('2000-03-25'),
                fechaIngreso: new Date('2022-09-01'),
                rol: 'miembro',
                cargo: 'ninguno',
                etapaFormacion: 'iniciado'
            },
            {
                nombre: 'Juan',
                apellido: 'Pérez',
                username: 'juan',
                email: 'juan@Catequesis Pomalca.org',
                password: 'paz123',
                telefono: '+1234567894',
                fechaNacimiento: new Date('1999-11-30'),
                fechaIngreso: new Date('2021-02-14'),
                rol: 'consejo',
                cargo: 'formador',
                etapaFormacion: 'promesado'
            }
        ];

        const Miembros = [];

        for (const datos of datosMiembros) {
            const Miembro = await Miembro.create(datos);

            // Generar QR
            const qrData = JSON.stringify({
                id: Miembro._id,
                nombre: `${Miembro.nombre} ${Miembro.apellido}`,
                username: Miembro.username
            });

            Miembro.codigoQR = await QRCode.toDataURL(qrData);
            await Miembro.save();

            Miembros.push(Miembro);
        }

        console.log(`✅ ${Miembros.length} Miembros creados con QR`);

        // Obtener IDs
        const francisco = Miembros[0];
        const clara = Miembros[1];
        const antonio = Miembros[2];

        console.log('📢 Creando anuncios...');

        // Crear anuncios
        const anuncios = await Anuncio.create([
            {
                titulo: '🚨 Reunión Urgente de Consejo',
                contenido: 'Se convoca a todos los miembros del consejo a una reunión extraordinaria este viernes a las 19:00 hs. Temas importantes a tratar: planificación del retiro anual y organización del apostolado del mes.',
                tipo: 'urgente',
                prioridad: 'alta',
                destacado: true,
                destinatarios: 'consejo',
                autor: francisco._id,
                fechaPublicacion: new Date(),
                fechaExpiracion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días
            },
            {
                titulo: '📅 Retiro Franciscano - Inscripciones Abiertas',
                contenido: 'Ya están abiertas las inscripciones para el retiro franciscano que se realizará del 15 al 17 de diciembre en la casa de retiros "San Damián". Cupos limitados. Costo: $5000. Incluye alojamiento, comidas y materiales.',
                tipo: 'evento',
                prioridad: 'alta',
                destacado: true,
                destinatarios: 'todos',
                autor: clara._id,
                fechaPublicacion: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // hace 2 días
                vistas: 45
            },
            {
                titulo: '📖 Nuevo Ciclo de Formación: Fuentes Franciscanas',
                contenido: 'Comenzamos un nuevo ciclo de formación sobre las Fuentes Franciscanas. Todos los martes a las 20:00 hs por Zoom. Primer tema: "La conversión de San Francisco". Material disponible en el drive de la fraternidad.',
                tipo: 'formacion',
                prioridad: 'normal',
                destacado: false,
                destinatarios: 'formacion',
                autor: antonio._id,
                fechaPublicacion: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // hace 5 días
                vistas: 28
            },
            {
                titulo: '🙏 Apostolado en el Hogar de Ancianos',
                contenido: 'Este sábado 2 de diciembre visitaremos el hogar de ancianos "Santa Clara". Salimos a las 15:00 hs desde la parroquia. Llevaremos música, juegos y merienda. ¡Los esperamos!',
                tipo: 'apostolado',
                prioridad: 'normal',
                destacado: false,
                destinatarios: 'todos',
                autor: francisco._id,
                fechaPublicacion: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // hace 1 día
                vistas: 32
            },
            {
                titulo: '🎉 Aniversario de Promesa de Clara',
                contenido: 'El próximo 4 de octubre celebramos el 4° aniversario de promesa de nuestra hermana Clara. Habrá una misa especial a las 18:00 hs seguida de un ágape fraterno. ¡Están todos invitados!',
                tipo: 'general',
                prioridad: 'baja',
                destacado: false,
                destinatarios: 'todos',
                autor: francisco._id,
                fechaPublicacion: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // hace 10 días
                vistas: 67
            },
            {
                titulo: '📚 Biblioteca Franciscana Actualizada',
                contenido: 'Se actualizó la biblioteca digital de la fraternidad con nuevos libros sobre espiritualidad franciscana. Pueden acceder desde el drive compartido. Destacamos: "Francisco de Asís" de Eloi Leclerc.',
                tipo: 'general',
                prioridad: 'baja',
                destacado: false,
                destinatarios: 'todos',
                autor: clara._id,
                fechaPublicacion: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // hace 15 días
                vistas: 18
            }
        ]);

        console.log(`✅ ${anuncios.length} anuncios creados`);

        console.log('📝 Creando actas...');

        // Crear actas
        const actas = await Acta.create([
            {
                titulo: 'Reunión de Consejo - Noviembre 2024',
                fecha: new Date('2024-11-15'),
                tipoReunion: 'consejo',
                contenido: 'Se trataron los siguientes temas:\n1. Planificación del retiro anual\n2. Presupuesto para actividades de diciembre\n3. Organización del apostolado navideño\n4. Evaluación de nuevos aspirantes',
                asistentes: [francisco._id, clara._id, antonio._id],
                acuerdos: [
                    {
                        descripcion: 'Reservar casa de retiros para el 15-17 de diciembre',
                        responsable: clara._id,
                        fechaLimite: new Date('2024-11-30'),
                        completado: true
                    },
                    {
                        descripcion: 'Preparar presupuesto detallado de actividades',
                        responsable: antonio._id,
                        fechaLimite: new Date('2024-11-25'),
                        completado: false
                    }
                ],
                creadoPor: francisco._id
            },
            {
                titulo: 'Asamblea General - Octubre 2024',
                fecha: new Date('2024-10-20'),
                tipoReunion: 'fraternidad',
                contenido: 'Asamblea general de la fraternidad. Temas tratados:\n1. Renovación de cargos\n2. Evaluación del año\n3. Proyectos para 2025\n4. Celebración de aniversarios de promesa',
                asistentes: Miembros.map(u => u._id),
                acuerdos: [
                    {
                        descripcion: 'Organizar celebración de aniversarios',
                        responsable: clara._id,
                        fechaLimite: new Date('2024-10-31'),
                        completado: true
                    }
                ],
                creadoPor: francisco._id
            }
        ]);

        console.log(`✅ ${actas.length} actas creadas`);

        console.log('✅ Creando registros de asistencia...');

        // Crear asistencias
        const asistencias = [];
        const fechasReuniones = [
            new Date('2024-11-22'),
            new Date('2024-11-15'),
            new Date('2024-11-08'),
            new Date('2024-11-01')
        ];

        for (const fecha of fechasReuniones) {
            for (const Miembro of Miembros) {
                // 80% de probabilidad de asistencia
                const presente = Math.random() > 0.2;
                asistencias.push({
                    Miembro: Miembro._id,
                    fecha: fecha,
                    tipoReunion: 'semanal',
                    presente: presente,
                    metodoRegistro: 'manual',
                    registradoPor: francisco._id
                });
            }
        }

        await Asistencia.create(asistencias);
        console.log(`✅ ${asistencias.length} registros de asistencia creados`);

        console.log('\n🎉 ¡Datos de prueba creados exitosamente!\n');
        console.log('📊 Resumen:');
        console.log(`   👥 ${Miembros.length} Miembros`);
        console.log(`   📢 ${anuncios.length} anuncios`);
        console.log(`   📝 ${actas.length} actas`);
        console.log(`   ✅ ${asistencias.length} registros de asistencia`);
        console.log('\n🔑 Credenciales de acceso:');
        console.log('   Email: francisco@Catequesis Pomalca.org');
        console.log('   Password: paz123');
        console.log('\n   Email: clara@Catequesis Pomalca.org');
        console.log('   Password: paz123');
        console.log('\n🕊️ ¡Paz y Bien!\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

// Ejecutar
crearDatosPrueba();
