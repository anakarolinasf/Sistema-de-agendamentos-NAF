// controllers/appointmentController.js
const Appointment = require("../models/Appointment");
const User = require("../models/User");
const ScheduleUtils = require("../utils/scheduleUtils");
const { sendCancellationEmail, sendCompletionEmail } = require("../services/emailService");
const { generateBeautifulReport } = require("../services/reportService");
const logger = require('../utils/logger');


const appointmentController = {
  // Criar agendamento
  createAppointment: async (req, res) => {
    try {
      const { service, date, time } = req.body;

      logger.info('Tentativa de criação de agendamento', { 
        userId: req.userId, 
        service, 
        date, 
        time 
      });
      
      console.log(`\n📥 NOVO AGENDAMENTO:`, { service, date, time });
      
      // Validação básica
      if (!service || !date || !time) {
        return res.status(400).json({ error: "Serviço, data e horário são obrigatórios" });
      }

      // CORREÇÃO: Usa a função corrigida que considera fuso horário
      const combinedDateTime = ScheduleUtils.createLocalDate(date, time);
      
      console.log(`📅 Data/hora combinada (local): ${combinedDateTime}`);
      console.log(`📅 Data/hora combinada (ISO): ${combinedDateTime.toISOString()}`);
      
      // Verifica se a data é válida
      if (isNaN(combinedDateTime.getTime())) {
        return res.status(400).json({ error: "Data ou horário inválidos" });
      }

      // VALIDAÇÃO COMPLETA DO HORÁRIO
      const validation = await ScheduleUtils.isTimeSlotAvailable(date, time);
      if (!validation.available) {
        console.log(`❌ Validação falhou: ${validation.reason}`);
        return res.status(400).json({ 
          error: `Horário indisponível: ${validation.reason}` 
        });
      }

      // VERIFICAÇÃO EXTRA: Busca agendamentos conflitantes (CORRIGIDO)
      const startOfSlot = new Date(combinedDateTime);
      const endOfSlot = new Date(combinedDateTime.getTime() + (30 * 60 * 1000)); // +30 minutos

      console.log(`🔍 Verificando conflitos: ${startOfSlot} até ${endOfSlot}`);

      const conflictingAppointment = await Appointment.findOne({
        date: {
          $gte: startOfSlot,
          $lt: endOfSlot
        }
      });

      if (conflictingAppointment) {
        console.log(`❌ Conflito encontrado:`, conflictingAppointment);
        return res.status(400).json({ 
          error: "Este horário já está ocupado por outro agendamento" 
        });
      }

      // Se passou por todas as validações, cria o agendamento
      const appointment = new Appointment({ 
        userId: req.userId, 
        service, 
        date: combinedDateTime
      });
      
      await appointment.save();

      logger.info('Agendamento criado com sucesso', {
        appointmentId: appointment._id,
        userId: req.userId,
        service,
        date: combinedDateTime
      });

      console.log(`✅ Agendamento criado com sucesso: ${appointment._id}`);
      
      res.json(appointment);
    } catch (err) {

      logger.error('Erro ao criar agendamento', {
        error: err.message,
        userId: req.userId,
        service: req.body.service
      });

      console.error("❌ Erro ao criar agendamento:", err);
      
      // Erro de duplicação do MongoDB
      if (err.code === 11000) {
        return res.status(400).json({ error: "Horário já está agendado" });
      }
      
      if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(error => error.message);
        return res.status(400).json({ error: errors.join(', ') });
      }
      
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  },

  // NOVO: Endpoint para obter horários disponíveis
  getAvailableSlots: async (req, res) => {
    try {
      const { date } = req.query;
      
      if (!date) {
        return res.status(400).json({ error: "Data é obrigatória" });
      }

      // Verifica se a data é válida
      const selectedDate = new Date(date);
      if (isNaN(selectedDate.getTime())) {
        return res.status(400).json({ error: "Data inválida" });
      }

      // Usa o ScheduleUtils para obter os horários disponíveis
      const availableSlots = await ScheduleUtils.getAvailableTimeSlots(date);
      
      res.json({
        date,
        availableSlots,
        businessHours: {
          start: "08:00",
          end: "19:00"
        },
        breaks: [
          {
            name: "Almoço",
            start: "12:00",
            end: "13:00"
          }
        ]
      });
    } catch (err) {
      console.error("Erro ao buscar horários disponíveis:", err);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  },

  // Listar agendamentos do usuário
  getUserAppointments: async (req, res) => {
    try {
      const appointments = await Appointment.find({ userId: req.userId });
      res.json(appointments);
    } catch (err) {
      res.status(500).json({ error: "Erro ao carregar agendamentos" });
    }
  },

  // Listar todos os agendamentos (admin)
  getAllAppointments: async (req, res) => {
    try {
      const appointments = await Appointment.find().populate("userId", "email name");
      res.json(appointments);
    } catch (err) {
      res.status(500).json({ error: "Erro ao carregar agendamentos" });
    }
  },

  // Editar agendamento
  updateAppointment: async (req, res) => {
    try {
      const { service, date, time } = req.body;

      logger.info('Tentativa de atualização de agendamento', {
        appointmentId: req.params.id,
        userId: req.userId,
        updates: { service, date, time }
      });

      const appointment = await Appointment.findById(req.params.id);

      if (!appointment) {
        logger.warn('Tentativa de atualizar agendamento não encontrado', {
          appointmentId: req.params.id,
          userId: req.userId
        });
        return res.status(404).json({ error: "Agendamento não encontrado" });
      }

      if (req.userRole !== "admin" && appointment.userId.toString() !== req.userId) {
        logger.warn('Tentativa de atualização não autorizada', {
          appointmentId: req.params.id,
          userId: req.userId,
          actualOwner: appointment.userId.toString(),
          userRole: req.userRole
        });
        return res.status(403).json({ error: "Acesso negado" });
      }

      const oldData = {
        service: appointment.service,
        date: appointment.date
      };

      // Se estiver alterando a data/hora, valida a disponibilidade
      if (date && time) {
        const validation = await ScheduleUtils.isTimeSlotAvailable(date, time);
        if (!validation.available && 
            !(appointment.date.toISOString().split('T')[0] === date && 
              ScheduleUtils.minutesToTime(appointment.date.getHours() * 60 + appointment.date.getMinutes()) === time)) {
          logger.warn('Tentativa de atualizar para horário indisponível', {
            appointmentId: req.params.id,
            requestedTime: time,
            requestedDate: date,
            reason: validation.reason
          });
          return res.status(400).json({ 
            error: `Horário indisponível: ${validation.reason}` 
          });
        }
      }

      // Atualiza os campos
      if (service) appointment.service = service;
      
      if (date && time) {
        const combinedDateTime = new Date(`${date}T${time}:00`);
        if (isNaN(combinedDateTime.getTime())) {
          logger.warn('Data/hora inválida fornecida na atualização', {
            appointmentId: req.params.id,
            date,
            time
          });
          return res.status(400).json({ error: "Data ou horário inválidos" });
        }
        appointment.date = combinedDateTime;
      } else if (date) {
        const originalTime = appointment.date.toTimeString().split(' ')[0];
        const combinedDateTime = new Date(`${date}T${originalTime}`);
        if (isNaN(combinedDateTime.getTime())) {
          return res.status(400).json({ error: "Data inválida" });
        }
        appointment.date = combinedDateTime;
      } else if (time) {
        const originalDate = appointment.date.toISOString().split('T')[0];
        const combinedDateTime = new Date(`${originalDate}T${time}:00`);
        if (isNaN(combinedDateTime.getTime())) {
          return res.status(400).json({ error: "Horário inválido" });
        }
        appointment.date = combinedDateTime;
      }

      await appointment.save();

      logger.info('Agendamento atualizado com sucesso', {
        appointmentId: appointment._id,
        userId: req.userId,
        oldData,
        newData: {
          service: appointment.service,
          date: appointment.date
        }
      });

      res.json(appointment);
    } catch (err) {
      logger.error('Erro ao atualizar agendamento', {
        error: err.message,
        appointmentId: req.params.id,
        userId: req.userId
      });
      console.error("Erro ao atualizar agendamento:", err);
      
      if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(error => error.message);
        return res.status(400).json({ error: errors.join(', ') });
      }
      
      res.status(500).json({ error: "Erro ao atualizar agendamento" });
    }
  },

  // Deletar agendamento (CORRIGIDA a lógica de permissões)
  deleteAppointment: async (req, res) => {
    try {
      const appointment = await Appointment.findById(req.params.id).populate("userId", "email name");

      if (!appointment) {
        logger.warn('Tentativa de excluir agendamento não encontrado', {
          appointmentId: req.params.id,
          userId: req.userId
        });
        return res.status(404).json({ error: "Agendamento não encontrado" });
      }

      // CORREÇÃO: Verifica se o usuário é admin OU se é o dono do agendamento
      const isAdmin = req.userRole === "admin";
      const isOwner = appointment.userId._id.toString() === req.userId;

      logger.info('Tentativa de exclusão de agendamento', {
        appointmentId: req.params.id,
        requestedBy: req.userId,
        isAdmin,
        isOwner,
        actualOwner: appointment.userId._id
      });
      
      console.log(`🔐 Verificação de permissões:`, {
        userId: req.userId,
        appointmentUserId: appointment.userId._id.toString(),
        userRole: req.userRole,
        isAdmin,
        isOwner,
        canDelete: isAdmin || isOwner
      });

      if (!isAdmin && !isOwner) {
        logger.warn('Tentativa de exclusão não autorizada', {
          appointmentId: req.params.id,
          userId: req.userId,
          userRole: req.userRole
        });
        return res.status(403).json({ error: "Acesso negado" });
      }

      // Salva as informações antes de deletar para o email
      const appointmentInfo = {
        userEmail: appointment.userId.email,
        service: appointment.service,
        date: appointment.date,
        appointmentId: appointment._id,
        cancelledByAdmin: isAdmin && !isOwner // Indica se foi cancelado por admin
      };

      await appointment.deleteOne();

      logger.info('Agendamento excluído com sucesso', {
        appointmentId: req.params.id,
        deletedBy: req.userId,
        userEmail: appointment.userId.email,
        cancelledByAdmin: isAdmin && !isOwner
      });

      // Se foi um admin quem cancelou (e não o próprio usuário), envia email de notificação
      if (appointmentInfo.cancelledByAdmin) {
        await sendCancellationEmail(appointmentInfo);
        console.log(`📧 Email de cancelamento enviado para: ${appointmentInfo.userEmail}`);
      }

      res.json({ 
        message: "Agendamento deletado com sucesso!",
        cancelledByAdmin: appointmentInfo.cancelledByAdmin
      });
    } catch (err) {
      logger.error('Erro ao excluir agendamento', {
        error: err.message,
        appointmentId: req.params.id,
        userId: req.userId
      });
      console.error("❌ Erro ao deletar agendamento:", err);
      res.status(500).json({ error: "Erro ao deletar agendamento" });
    }
  },

  // FUNÇÃO ATUALIZADA: Gerar relatório com opção de download
  generateReport: async (req, res) => {
    try {
      const { type, download } = req.query; // all, service, daily + download flag

      logger.info('Geração de relatório solicitada', {
        adminId: req.userId,
        reportType: type,
        download: download === 'true'
      });

      const appointments = await Appointment.find().populate("userId", "email name");

      if (appointments.length === 0) {
        logger.warn('Tentativa de gerar relatório sem agendamentos', {
          adminId: req.userId
        });
        return res.status(400).json({ error: "Não há agendamentos para gerar relatório" });
      }

      const reportType = type || 'all';
      const htmlReport = generateBeautifulReport(appointments, reportType);

      const filename = `relatorio_${reportType}_${new Date().toISOString().split('T')[0]}.html`;

      logger.info('Relatório gerado com sucesso', {
        adminId: req.userId,
        reportType,
        appointmentsCount: appointments.length,
        download: download === 'true'
      });

      if (download === 'true') {
        // Força download do HTML
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(htmlReport);
      } else {
        // Exibe inline no navegador
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        res.send(htmlReport);
      }

    } catch (err) {
      logger.error('Erro ao gerar relatório', {
        error: err.message,
        adminId: req.userId,
        reportType: req.query.type
      });
      console.error("❌ Erro ao gerar relatório:", err);
      res.status(500).json({ error: "Erro interno ao gerar relatório" });
    }
  },

  // NOVA FUNÇÃO: Encerrar agendamento (concluir serviço)
  completeAppointment: async (req, res) => {
    try {
      const appointment = await Appointment.findById(req.params.id).populate("userId", "email name");

      logger.info('Tentativa de encerramento de agendamento', {
        appointmentId: req.params.id,
        adminId: req.userId
      });

      if (!appointment) {
        logger.warn('Tentativa de encerrar agendamento não encontrado', {
          appointmentId: req.params.id,
          adminId: req.userId
        });
        return res.status(404).json({ error: "Agendamento não encontrado" });
      }

      // Apenas admin pode encerrar agendamentos
      if (req.userRole !== "admin") {
        logger.warn('Tentativa não autorizada de encerrar agendamento', {
          appointmentId: req.params.id,
          userId: req.userId,
          userRole: req.userRole
        });
        return res.status(403).json({ error: "Acesso negado. Apenas administradores podem encerrar agendamentos." });
      }

      // Salva as informações antes de deletar para o email
      const appointmentInfo = {
        userEmail: appointment.userId.email,
        service: appointment.service,
        date: appointment.date,
        appointmentId: appointment._id,
        completedByAdmin: true
      };

      // Deleta o agendamento
      await appointment.deleteOne();

      logger.info('Agendamento encerrado com sucesso', {
        appointmentId: appointmentInfo.appointmentId,
        adminId: req.userId,
        userEmail: appointmentInfo.userEmail
      });

      // Envia email de conclusão
      await sendCompletionEmail(appointmentInfo);

      logger.info('Email de conclusão enviado', {
        userEmail: appointmentInfo.userEmail,
        appointmentId: appointmentInfo.appointmentId
      });

      res.json({ 
        message: "Agendamento encerrado com sucesso! O usuário foi notificado por email.",
        completed: true
      });
    } catch (err) {
      logger.error('Erro ao encerrar agendamento', {
        error: err.message,
        appointmentId: req.params.id,
        adminId: req.userId
      });
      console.error("❌ Erro ao encerrar agendamento:", err);
      res.status(500).json({ error: "Erro ao encerrar agendamento" });
    }
  },

   // Criar agendamento como admin (para qualquer usuário)
  createAppointmentAsAdmin: async (req, res) => {
    try {
      const { service, date, time, userEmail } = req.body;

      logger.info('Admin criando agendamento para usuário', {
        adminId: req.userId,
        userEmail,
        service,
        date,
        time
      });
      
      if (!service || !date || !time || !userEmail) {
        logger.warn('Dados incompletos para criação de agendamento por admin', {
          adminId: req.userId,
          providedData: { service, date, time, userEmail }
        });
        return res.status(400).json({ error: "Serviço, data, horário e email do usuário são obrigatórios" });
      }

      // Busca o usuário pelo email
      const user = await User.findOne({ email: userEmail });
      if (!user) {
        logger.warn('Tentativa de criar agendamento para usuário não encontrado', {
          adminId: req.userId,
          userEmail
        });
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      // VALIDAÇÃO DO HORÁRIO DISPONÍVEL
      const validation = await ScheduleUtils.isTimeSlotAvailable(date, time);
      if (!validation.available) {
        logger.warn('Horário indisponível para agendamento por admin', {
          adminId: req.userId,
          date,
          time,
          reason: validation.reason
        });
        return res.status(400).json({ 
          error: `Horário indisponível: ${validation.reason}` 
        });
      }

      // Combina data e hora no formato ISO
      const combinedDateTime = new Date(`${date}T${time}:00`);
      
      if (isNaN(combinedDateTime.getTime())) {
        logger.warn('Data/hora inválida fornecida por admin', {
          adminId: req.userId,
          date,
          time
        });
        return res.status(400).json({ error: "Data ou horário inválidos" });
      }

      const appointment = new Appointment({ 
        userId: user._id, 
        service, 
        date: combinedDateTime
      });
      
      await appointment.save();
      await appointment.populate("userId", "email name");

       logger.info('Agendamento criado com sucesso por admin', {
        appointmentId: appointment._id,
        adminId: req.userId,
        userEmail,
        service,
        date: combinedDateTime
      });
      
      res.json(appointment);
    } catch (err) {
      logger.error('Erro ao criar agendamento como admin', {
        error: err.message,
        adminId: req.userId,
        userEmail: req.body.userEmail
      });
      console.error("Erro ao criar agendamento como admin:", err);
      
      if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(error => error.message);
        return res.status(400).json({ error: errors.join(', ') });
      }
      
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
};



module.exports = appointmentController;