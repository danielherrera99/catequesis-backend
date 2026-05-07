
const { google } = require('googleapis');
require('dotenv').config();

const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
);
auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
const drive = google.drive({ version: 'v3', auth });

const rootId = '1T80MXhIYiq5sezxamPTcvk1-BL2w1FmE';

const subfolders = [
    'Actas',
    'Fotos Perfil',
    'Galeria',
    'Fotos Anuncios',
    'Fotos Eventos',
    'Fotos Servicios',
    'Recursos Formacion'
];

async function setupFolders() {
    const results = {};
    for (const name of subfolders) {
        try {
            console.log(`Creando carpeta: ${name}...`);
            const res = await drive.files.create({
                resource: {
                    name: name,
                    mimeType: 'application/vnd.google-apps.folder',
                    parents: [rootId]
                },
                fields: 'id'
            });
            results[name] = res.data.id;
            console.log(`✅ ${name}: ${res.data.id}`);
        } catch (err) {
            console.error(`❌ Error al crear ${name}:`, err.message);
        }
    }
    console.log('\n--- MAPA DE IDs PARA drive.js ---');
    console.log(JSON.stringify(results, null, 2));
}

setupFolders();
