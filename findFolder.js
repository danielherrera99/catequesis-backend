const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const KEY_FILE_PATH = path.join(__dirname, 'Catequesis Pomalca-drive-b66f05f577a8.json');
const SCOPES = ['https://www.googleapis.com/auth/drive'];

const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE_PATH,
    scopes: SCOPES,
});

async function findFolder() {
    const drive = google.drive({ version: 'v3', auth });
    try {
        const res = await drive.files.list({
            q: "mimeType='application/vnd.google-apps.folder' and name='Actas de Catequesis Pomalca'",
            fields: 'nextPageToken, files(id, name)',
            spaces: 'drive',
        });
        
        const folders = res.data.files;
        if (folders.length > 0) {
            fs.writeFileSync('true_id.txt', folders[0].id, 'utf8');
            console.log('ID saved to true_id.txt');
        } else {
            console.log('Not found');
        }
    } catch (err) {
        console.error(err);
    }
}

findFolder();
