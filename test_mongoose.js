const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MiembroSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true, minlength: 6, select: false }
});

MiembroSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

const Miembro = mongoose.model('MiembroTest', MiembroSchema);

async function test() {
    await mongoose.connect('mongodb+srv://admin:admin123@cluster0.mongodb.net/test?retryWrites=true&w=majority'); // Or mock
    console.log('Connected');
}
test().catch(console.error);
