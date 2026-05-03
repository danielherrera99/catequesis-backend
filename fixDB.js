require('dotenv').config();
const mongoose = require('mongoose');

const fixIndexes = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('asistencias');
        
        const indexes = await collection.indexes();
        console.log('Current Indexes:', indexes.map(i => i.name));

        // Find the restrictive index
        const indexToDrop = indexes.find(i => i.name === 'Miembro_1_fecha_1_tipoReunion_1');
        
        if (indexToDrop) {
            console.log('Dropping strict index:', indexToDrop.name);
            await collection.dropIndex(indexToDrop.name);
            console.log('Dropped successfully.');
        } else {
            console.log('Strict index not found or already dropped.');
        }

        console.log('Mongoose will recreate the new sparse index when the app starts next.');
        
        await mongoose.disconnect();
        console.log('Done.');
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

fixIndexes();
