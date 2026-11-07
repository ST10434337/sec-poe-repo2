const mongoose = require('mongoose');//(The IIE, 2026)
const bcrypt = require('bcrypt');//(The IIE, 2026)
const { ROLES } = require('../utils/roles');

// Define the User schema
const userSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true },
  
   password: { 
     type: String, 
     required: true 
  },
  name: { 
    type: String, 
    required: true, 
    trim: true, 
    maxLength: 100 
  },
  
  role: { 
    type: String, 
    enum: Object.values(ROLES), 
    default: ROLES.CLIENT },
  
  isActive: { 
    type: Boolean, 
    default: true 
  }, // Admins can disable accounts; checked on login and by requireAuth
  
  loginAttempts: { 
    type: Number, 
    default: 0 
  },

  lockUntil: { 
    type: Date, 
    default: null
  }  
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