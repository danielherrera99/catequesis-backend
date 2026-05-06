const { google } = require('googleapis');
const path = require('path');
const stream = require('stream');

// ID de la carpeta institucional "Actas y Fotos Catequesis"
const FOLDER_ID = '1T80MXhIYiq5sezxamPTcvk1-BL2w1FmE';

const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
);

auth.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

const drive = google.drive({ version: 'v3', auth });

/**
 * Sube un archivo (PDF o Imagen) a Google Drive.
 */
const uploadToDrive = async (fileBuffer, fileName, mimeType) => {
    try {
        const bufferStream = new stream.PassThrough();
        bufferStream.end(fileBuffer);

        const fileMetadata = {
            name: fileName,
            parents: [FOLDER_ID],
        };

        const media = {
            mimeType: mimeType,
            body: bufferStream,
        };

        const response = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id, webViewLink, webContentLink'
        });

        const fileId = response.data.id;
        
        // Dar permiso de lectura a quien tenga el link
        await drive.permissions.create({
            fileId: fileId,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            }
        });

        // Retornar el link directo del contenido (webContentLink) o de vista (webViewLink)
        // Para imágenes en la app, a veces es mejor el ID para construir una URL directa
        return response.data.id; 
    } catch (error) {
        console.error('Error al subir a Google Drive:', error);
        throw error;
    }
};

const uploadPdfToDrive = async (fileBuffer, fileName) => {
    const fileId = await uploadToDrive(fileBuffer, fileName, 'application/pdf');
    // Para PDFs queremos el link de vista
    const res = await drive.files.get({ fileId, fields: 'webViewLink' });
    return res.data.webViewLink;
};

const uploadImageToDrive = async (fileBuffer, fileName, mimeType = 'image/jpeg') => {
    const fileId = await uploadToDrive(fileBuffer, fileName, mimeType);
    // Para imágenes retornamos el ID para construir la URL de visualización directa
    return fileId;
};

module.exports = {
    uploadPdfToDrive,
    uploadImageToDrive
};
