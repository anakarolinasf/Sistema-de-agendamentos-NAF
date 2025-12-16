const express = require("express");
const router = express.Router();
const serviceController = require("../Controllers/serviceController");
const authMiddleware = require("../middleware/authMiddleware");

// Apenas admin pode gerenciar serviços
router.post("/", authMiddleware, serviceController.createService);
router.get("/", serviceController.getServices); // Público para agendamentos
router.put("/:id", authMiddleware, serviceController.updateService);
router.delete("/:id", authMiddleware, serviceController.deleteService);

module.exports = router;