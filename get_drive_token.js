const { google } = require('googleapis');
const express = require('express');
const app = express();
const fs = require('fs');

require('dotenv').config();
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/oauth2callback';

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/gmail.send'
];

const url = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent' // fuerza a crear siempre un refresh_token
});

console.log('================================================================');
console.log('🔑  LINK MAGICO GENERADO  🔑');
console.log('Haz clic en el enlace, elige tu correo de Catequesis Pomalca y dale permisos.');
console.log('');
console.log(url);
console.log('');
console.log('================================================================');

app.get('/oauth2callback', async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.send('Error: No se recibio ningun codigo');
  }
  
  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    let envContent = '';
    if (fs.existsSync('.env')) {
      envContent = fs.readFileSync('.env', 'utf8');
      envContent = envContent.replace(/GOOGLE_REFRESH_TOKEN=.*\n/g, '');
    }
    
    fs.writeFileSync('.env', envContent + `\nGOOGLE_CLIENT_ID=${CLIENT_ID}\nGOOGLE_CLIENT_SECRET=${CLIENT_SECRET}\nGOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`);
    
    console.log('¡ÉXITO TOTAL! Refresh Token atrapado limpiamente y guardado en .env.');
    res.send('<h1 style="color:green; font-family:sans-serif; text-align:center; margin-top:50px;">¡Completado! 🎉</h1><p style="text-align:center; font-family:sans-serif;">El puente con Google Drive se ha conectado silenciosamente. Ya puedes cerrar esta ventana y regresar al chat.</p>');
    process.exit(0);
  } catch (err) {
    console.error('Error al atrapar el token:', err);
    res.send('Ocurrió un error obteniendo el token. Mira la consola.');
    process.exit(1);
  }
});

app.listen(3000, () => {
    // servidor silencioso esperando confirmacion
});
