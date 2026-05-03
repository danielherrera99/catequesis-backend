const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Cargar env desde el backend
dotenv.config({ path: path.join(__dirname, '.env') });

async function checkTokens() {
    try {
        console.log('📡 Conectando a MongoDB para verificar Tokens...');
        await mongoose.connect(process.env.MONGODB_URI);
        
        const Miembro = require('./models/Miembro');
        const MiembrosConToken = await Miembro.find({ 
            expoPushToken: { $exists: true, $ne: null, $ne: '' } 
        }, 'nombre username expoPushToken');

        console.log('\n--- 📱 ESTADO DE TOKENS REGISTRADOS ---');
        if (MiembrosConToken.length === 0) {
            console.log('❌ NO HAY TOKENS EN LA BASE DE DATOS.');
            console.log('💡 CAUSA: Ningún Miembro ha iniciado sesión con la NUEVA App todavía.');
        } else {
            console.log(`✅ SE ENCONTRARON ${MiembrosConToken.length} TOKENS:`);
            MiembrosConToken.forEach(u => {
                console.log(`- ${u.nombre} (@${u.username}): ${u.expoPushToken.substring(0, 20)}...`);
            });
        }
        console.log('--------------------------------------\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error en el check:', error);
        process.exit(1);
    }
}

checkTokens();
