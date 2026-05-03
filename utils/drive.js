const { google } = require('googleapis');
const path = require('path');
const stream = require('stream');

const FOLDER_ID = '104IEJOkcsC-AbXatZgcDbzwx40pubk-_';

const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback' // redirect_uri no se necesita para API calls con refresh token, pero se pone para no romper la libreria
);

auth.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

const drive = google.drive({ version: 'v3', auth });

/**
 * Sube un archivo PDF a Google Drive.
 * @param {Buffer} fileBuffer Buffer del archivo PDF
 * @param {String} fileName Nombre del archivo a crear en Drive
 * @returns {Promise<String>} Enlace de vista del archivo creado
 */
const uploadPdfToDrive = async (fileBuffer, fileName) => {
    try {
        const bufferStream = new stream.PassThrough();
        bufferStream.end(fileBuffer);

        const fileMetadata = {
            name: fileName,
            parents: [FOLDER_ID],
        };

        const media = {
            mimeType: 'application/pdf',
            body: bufferStream,
        };

        const response = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id, webViewLink'
        });

        const fileId = response.data.id;
        
        // Dar permiso de vista publica o lectura a quien tenga el link por si acaso
        await drive.permissions.create({
            fileId: fileId,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            }
        });

        // Obtener el enlace actualizado
        const result = await drive.files.get({
            fileId: fileId,
            fields: 'webViewLink'
        });

        return result.data.webViewLink;
    } catch (error) {
        console.error('Error al subir a Google Drive:', error);
        throw error;
    }
};

module.exports = {
    uploadPdfToDrive
};
