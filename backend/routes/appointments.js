// routes/appointments.js
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware"); // Nome alterado
const appointmentController = require("../Controllers/AppointmentController");

// Criar agendamento
router.post("/", authMiddleware, appointmentController.createAppointment);

// Gerar relatório
router.get("/report", authMiddleware, appointmentController.generateReport);

// Listar agendamentos do usuário
router.get("/", authMiddleware, appointmentController.getUserAppointments);

// Obter horários disponíveis
router.get("/available-slots", authMiddleware, appointmentController.getAvailableSlots);

// Listar todos os agendamentos (admin)
router.get("/all", authMiddleware, appointmentController.getAllAppointments);

// Editar agendamento
router.put("/:id", authMiddleware, appointmentController.updateAppointment);

// Encerrar agendamento (concluir serviço)
router.delete("/:id/complete", authMiddleware, appointmentController.completeAppointment);

// Deletar agendamento
router.delete("/:id", authMiddleware, appointmentController.deleteAppointment);

// Criar agendamento Admin
router.post("/admin-create", authMiddleware, appointmentController.createAppointmentAsAdmin);

module.exports = router;