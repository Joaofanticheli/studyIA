const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  nome: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  senha: { type: String, required: true },
  resetPasswordToken:   { type: String, select: false },
  resetPasswordExpires: { type: Date,   select: false },
  isAdmin: { type: Boolean, default: false },
  streak: { type: Number, default: 0 },
  ultimoEstudo: { type: Date, default: null },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('senha')) return next();
  this.senha = await bcrypt.hash(this.senha, 10);
  next();
});

userSchema.methods.comparePassword = function (senha) {
  return bcrypt.compare(senha, this.senha);
};

module.exports = mongoose.model('User', userSchema);
