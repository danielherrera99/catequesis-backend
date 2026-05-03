const http = require('https');
const data = JSON.stringify({
    usernameOrEmail: 'mesadeayudaitd@gmail.com'
});

const options = {
    hostname: 'api-Catequesis Pomalca.onrender.com',
    port: 443,
    path: '/api/auth/recuperar-password',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const startTime = Date.now();

const req = http.request(options, res => {
    let responseData = '';
    res.on('data', d => {
        responseData += d;
    });
    res.on('end', () => {
        const endTime = Date.now();
        console.log(`Status Code: ${res.statusCode}`);
        console.log(`Time taken: ${endTime - startTime}ms`);
        console.log('Response:', responseData);
    });
});

req.on('error', error => {
    console.error(error);
});

req.write(data);
req.end();
