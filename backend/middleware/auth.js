const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Não autenticado' });
  }
  try {
    const token = auth.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-senha');
    if (!req.user) return res.status(401).json({ message: 'Usuário não encontrado' });
    next();
  } catch {
    res.status(401).json({ message: 'Token inválido ou expirado' });
  }
};

const protectAdmin = async (req, res, next) => {
  await protect(req, res, () => {
    if (!req.user?.isAdmin) return res.status(403).json({ message: 'Acesso restrito a administradores' });
    next();
  });
};

module.exports = { protect, protectAdmin };
