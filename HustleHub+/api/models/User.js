const mongoose = require('mongoose');//(The IIE, 2026)
const bcrypt = require('bcrypt');//(The IIE, 2026)

// Define the User schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['client','freelancer','admin'], default: 'client' },
}, { timestamps: true });

// Pre-save hook to hash the password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return ;
  this.password = await bcrypt.hash(this.password, 12);
});

// Method to compare candidate password with the hashed password
userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
//The Independent Institute of Education (IIE) (2026) Information Systems 3D (INSY7314/w): 
//  Module manual. The Independent Institute of Education (Pty) Ltd. 