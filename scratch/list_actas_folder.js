
const { google } = require('googleapis');
require('dotenv').config();

const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
);
auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
const drive = google.drive({ version: 'v3', auth });

const folderId = '1iUMZtEBFSNoq4cQdaozyA96K8gZ7rV-W'; // Actas

async function listFiles() {
    try {
        const res = await drive.files.list({
            q: `'${folderId}' in parents`,
            fields: 'files(id, name, mimeType)'
        });
        console.log(JSON.stringify(res.data.files, null, 2));
    } catch (err) {
        console.error(err);
    }
}

listFiles();
