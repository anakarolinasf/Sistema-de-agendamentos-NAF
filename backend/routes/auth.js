const express = require("express");
const router = express.Router();
const authController = require("../Controllers/authController");

// Registro
router.post("/register", authController.register);

// Login
router.post("/login", authController.login);

// Solicitar reset de senha
router.post("/forgot-password", authController.forgotPassword);

// Resetar senha
router.post("/reset-password/:token", authController.resetPassword);

module.exports = router;