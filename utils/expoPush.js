/**
 * Helper para enviar notificaciones push usando la API de Expo
 */

const https = require('https');

const enviarNotificacionGrupal = async (tokens, titulo, mensaje, data = {}) => {
    if (!tokens || tokens.length === 0) return;

    // Remove duplicates or nulls
    const pushTokens = [...new Set(tokens.filter(t => t && t.startsWith('ExponentPushToken')))];
    
    if (pushTokens.length === 0) {
        console.log('⚠️ No tokens valid found in expoPush.js');
        return;
    }
    console.log(`📡 Sending push to ${pushTokens.length} tokens:`, pushTokens);

    const messages = pushTokens.map(pushToken => ({
        to: pushToken,
        sound: 'default',
        title: titulo,
        body: mensaje,
        data: data,
    }));

    // Intentar envío grupal primero
    const enviarPaquete = async (mensajes) => {
        return new Promise((resolve, reject) => {
            const body = JSON.stringify(mensajes);
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
                        resolve(parsed);
                    } catch (e) {
                        reject(e);
                    }
                });
            });
            req.on('error', e => reject(e));
            req.write(body);
            req.end();
        });
    };

    try {
        const resPush = await enviarPaquete(messages);
        
        // Si hay error de múltiples proyectos, reintentar uno por uno
        if (resPush.errors && resPush.errors.some(e => e.code === 'PUSH_TOO_MANY_EXPERIENCE_IDS')) {
            console.log('🔄 Detectados múltiples IDs de proyecto. Reintentando envío individual...');
            for (const msg of messages) {
                try {
                    await enviarPaquete([msg]);
                } catch (individualErr) {
                    console.error(`❌ Error enviando a token ${msg.to}:`, individualErr.message);
                }
            }
            return { success: true, method: 'individual_retry' };
        }
        
        console.log('Push notifications sent successfully');
        return resPush;
    } catch (e) {
        console.error('Error sending push notifications:', e);
        return { error: e.message };
    }
};

module.exports = {
    enviarNotificacionGrupal
};
