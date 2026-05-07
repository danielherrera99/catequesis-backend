const { google } = require('googleapis');
const path = require('path');
const stream = require('stream');

// IDs de carpetas organizadas
const ROOT_FOLDER_ID = '1T80MXhIYiq5sezxamPTcvk1-BL2w1FmE';
const FOLDERS = {
    ACTAS: '1iUMZtEBFSNoq4cQdaozyA96K8gZ7rV-W',
    PERFIL: '10MSMlspfPT-E_j4xNpd6TJ9COrA5baU3',
    GALERIA: '1Cz4-lhqIj1Q47SHl4eaWnuBiBMLK3cR8',
    ANUNCIOS: '1TgMK9axJJU7Svhqmgz9YYk2Yk377wUeC',
    EVENTOS: '1OqKPVOg8JyKMCx4xrLEaNkYp6AnzCxuh',
    SERVICIOS: '1pBTjBnvhExVSBvVvvgESB9kAlBw39r3R',
    FORMACION: '1ZFpX4ej9uOKpXZXP7FVwrPGQE5wY-_hT'
};

const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
);

auth.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

if (process.env.GOOGLE_REFRESH_TOKEN) {
    console.log('✅ Google Drive Auth: Token detectado (comienza con:', process.env.GOOGLE_REFRESH_TOKEN.substring(0, 10) + '...)');
} else {
    console.warn('⚠️ Google Drive Auth: No se encontró GOOGLE_REFRESH_TOKEN en el entorno');
}

console.log('📂 Configuración de carpetas Drive:', JSON.stringify(FOLDERS, null, 2));

const drive = google.drive({ version: 'v3', auth });

/**
 * Sube un archivo (PDF o Imagen) a Google Drive.
 */
const uploadToDrive = async (fileBuffer, fileName, mimeType, folderId = ROOT_FOLDER_ID) => {
    try {
        const bufferStream = new stream.PassThrough();
        bufferStream.end(fileBuffer);

        const fileMetadata = {
            name: fileName,
            parents: [folderId],
        };

        console.log(`📤 Subiendo archivo: ${fileName} a la carpeta: ${folderId}`);

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
    const fileId = await uploadToDrive(fileBuffer, fileName, 'application/pdf', FOLDERS.ACTAS);
    // Para PDFs queremos el link de vista
    const res = await drive.files.get({ fileId, fields: 'webViewLink' });
    return res.data.webViewLink;
};

const uploadImageToDrive = async (fileBuffer, fileName, folderType = 'GALERIA', mimeType = 'image/jpeg') => {
    const folderId = FOLDERS[folderType.toUpperCase()] || FOLDERS.GALERIA;
    const fileId = await uploadToDrive(fileBuffer, fileName, mimeType, folderId);
    // Para imágenes retornamos el ID para construir la URL de visualización directa
    return fileId;
};

const uploadFileToDrive = async (fileBuffer, fileName, folderType = 'FORMACION', mimeType = 'application/octet-stream') => {
    const folderId = FOLDERS[folderType.toUpperCase()] || FOLDERS.FORMACION;
    const fileId = await uploadToDrive(fileBuffer, fileName, mimeType, folderId);
    return fileId;
};

module.exports = {
    uploadPdfToDrive,
    uploadImageToDrive,
    uploadFileToDrive,
    FOLDERS
};
