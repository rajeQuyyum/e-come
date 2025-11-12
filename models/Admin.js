const mongoose = require('mongoose');
const AdminSchema = new mongoose.Schema({
username: { type: String, required: true, unique: true },
// store the password exactly as you import it in Compass (plaintext as you requested)
password: { type: String, required: true }
});
module.exports = mongoose.model('Admin', AdminSchema);