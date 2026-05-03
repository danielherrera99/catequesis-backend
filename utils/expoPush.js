/**
 * Helper para enviar notificaciones push usando la API de Expo
 */

const https = require('https');

const enviarNotificacionGrupal = async (tokens, titulo, mensaje, data = {}) => {
    if (!tokens || tokens.length === 0) return;

    // Remove duplicates or nulls
    const pushTokens = [...new Set(tokens.filter(t => t && t.startsWith('ExponentPushToken')))];
    
    if (pushTokens.length === 0) return;

    const messages = pushTokens.map(pushToken => ({
        to: pushToken,
        sound: 'default',
        title: titulo,
        body: mensaje,
        data: data,
    }));

    // Use native https for broader Node version compatibility
    return new Promise((resolve, reject) => {
        const body = JSON.stringify(messages);
        const req = https.request({
            hostname: 'exp.host',
            port: 443,
            path: '/--/api/v2/push/send',
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            }
        }, (res) => {
            let resData = '';
            res.on('data', chunk => { resData += chunk; });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(resData);
                    console.log('Push notifications sent:', parsed);
                    resolve(parsed);
                } catch (e) {
                    console.error('Error parsing expo response:', e);
                    resolve({ error: 'Parse error' });
                }
            });
        });

        req.on('error', (e) => {
            console.error('Error sending push notifications:', e);
            resolve({ error: e.message });
        });

        req.write(body);
        req.end();
    });
};

module.exports = {
    enviarNotificacionGrupal
};
