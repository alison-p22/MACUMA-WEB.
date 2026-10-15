const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'macuma-maria-currea-secret-key-2026';

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      nombre: user.nombre,
      role: user.role,
      grado: user.grado || null,
      grupo: user.grupo || null,
      materias: user.materias || []
    },
    JWT_SECRET,
    { expiresIn: '12h' }
  );
}

function authenticateToken(req, res, next) {
  let token = null;

  // 1. From Authorization Header
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // 2. From Cookies
  if (!token && req.cookies && req.cookies.macuma_token) {
    token = req.cookies.macuma_token;
  }

  // 3. From Query param (useful for printable report downloads)
  if (!token && req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Acceso no autorizado. Inicie sesión para continuar.'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Sesión inválida o expirada. Por favor vuelva a iniciar sesión.'
      });
    }

    // Verify user still exists in DB
    const user = db.findOne('usuarios', (u) => u.id === decoded.id);
    if (!user) {
      return res.status(403).json({
        success: false,
        message: 'El usuario ya no existe en el sistema.'
      });
    }

    req.user = decoded;
    req.currentUser = user;
    next();
  });
}

function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Acceso restringido. Su rol (${req.user.role}) no tiene permisos para esta acción.`
      });
    }

    next();
  };
}

module.exports = {
  JWT_SECRET,
  generateToken,
  authenticateToken,
  requireRole
};
