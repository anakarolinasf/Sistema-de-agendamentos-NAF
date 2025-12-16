// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const SECRET = process.env.JWT_SECRET;

const authMiddleware = async (req, res, next) => {
  const header = req.headers["authorization"];
  if (!header) return res.status(401).json({ error: "Não autorizado" });

  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, SECRET);
    req.userId = decoded.id;

    const user = await User.findById(decoded.id);
    req.userRole = user.role;

    next();
  } catch {
    res.status(401).json({ error: "Token inválido" });
  }
};

module.exports = authMiddleware;