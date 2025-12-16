const Service = require("../models/Service");
const logger = require('../utils/logger');
const Appointment = require("../models/Appointment");

const serviceController = {
  // Criar novo serviço
  createService: async (req, res) => {
    try {
      const { name, icon } = req.body;

      logger.info('Tentativa de criação de serviço', { 
        adminId: req.userId, 
        serviceName: name 
      });

      if (!name) {
        return res.status(400).json({ error: "Nome do serviço é obrigatório" });
      }

      // Verifica se já existe um serviço com o mesmo nome
      const existingService = await Service.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') } 
      });
      
      if (existingService) {
        logger.warn('Tentativa de criar serviço com nome duplicado', { 
          serviceName: name,
          adminId: req.userId 
        });
        return res.status(400).json({ error: "Já existe um serviço com este nome" });
      }

      const service = new Service({
        name: name.trim(),
        icon: icon || "📋"
      });

      await service.save();

      logger.info('Serviço criado com sucesso', {
        serviceId: service._id,
        serviceName: service.name,
        adminId: req.userId
      });

      res.status(201).json(service);
    } catch (err) {
      logger.error('Erro ao criar serviço', {
        error: err.message,
        adminId: req.userId,
        serviceName: req.body.name
      });
      console.error("Erro ao criar serviço:", err);
      
      if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(error => error.message);
        return res.status(400).json({ error: errors.join(', ') });
      }
      
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  },

  // Listar todos os serviços
  getServices: async (req, res) => {
    try {
      const services = await Service.find({ isActive: true }).sort({ name: 1 });
      res.json(services);
    } catch (err) {
      console.error("Erro ao carregar serviços:", err);
      res.status(500).json({ error: "Erro ao carregar serviços" });
    }
  },

  // Atualizar serviço
  updateService: async (req, res) => {
    try {
      const { name, icon, isActive } = req.body;

      logger.info('Tentativa de atualização de serviço', {
        serviceId: req.params.id,
        adminId: req.userId,
        updates: { name, icon, isActive }
      });

      const service = await Service.findById(req.params.id);

      if (!service) {
        logger.warn('Tentativa de atualizar serviço não encontrado', {
          serviceId: req.params.id,
          adminId: req.userId
        });
        return res.status(404).json({ error: "Serviço não encontrado" });
      }

      const oldData = {
        name: service.name,
        icon: service.icon,
        isActive: service.isActive
      };

      if (name) {
        // Verifica se o novo nome já existe em outro serviço
        const existingService = await Service.findOne({ 
          name: { $regex: new RegExp(`^${name}$`, 'i') },
          _id: { $ne: req.params.id }
        });
        
        if (existingService) {
          logger.warn('Tentativa de atualizar para nome de serviço duplicado', {
            serviceId: req.params.id,
            newName: name,
            adminId: req.userId
          });
          return res.status(400).json({ error: "Já existe um serviço com este nome" });
        }
        
        service.name = name.trim();
      }

      if (icon) service.icon = icon;
      if (typeof isActive === 'boolean') service.isActive = isActive;

      await service.save();

      logger.info('Serviço atualizado com sucesso', {
        serviceId: service._id,
        adminId: req.userId,
        oldData,
        newData: {
          name: service.name,
          icon: service.icon,
          isActive: service.isActive
        }
      });

      res.json(service);
    } catch (err) {
      logger.error('Erro ao atualizar serviço', {
        error: err.message,
        serviceId: req.params.id,
        adminId: req.userId
      });
      console.error("Erro ao atualizar serviço:", err);
      
      if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(error => error.message);
        return res.status(400).json({ error: errors.join(', ') });
      }
      
      res.status(500).json({ error: "Erro ao atualizar serviço" });
    }
  },

  // Deletar serviço
  deleteService: async (req, res) => {
    try {
      const service = await Service.findById(req.params.id);

      if (!service) {
        logger.warn('Tentativa de excluir serviço não encontrado', {
          serviceId: req.params.id,
          adminId: req.userId
        });
        return res.status(404).json({ error: "Serviço não encontrado" });
      }

      // Verifica se há agendamentos vinculados
      const appointmentsWithService = await Appointment.findOne({ 
        service: service.name 
      });

      if (appointmentsWithService) {
        logger.warn('Tentativa de excluir serviço com agendamentos vinculados', {
          serviceId: service._id,
          serviceName: service.name,
          adminId: req.userId
        });
        return res.status(400).json({ 
          error: "Não é possível excluir este serviço pois existem agendamentos vinculados a ele." 
        });
      }

      // ✅ DELETA PERMANENTEMENTE do banco de dados
      await Service.findByIdAndDelete(req.params.id);

      logger.info('Serviço excluído com sucesso', {
        serviceId: service._id,
        serviceName: service.name,
        adminId: req.userId
      });

      res.json({ message: "Serviço deletado com sucesso" });
    } catch (err) {
      logger.error('Erro ao excluir serviço', {
        error: err.message,
        serviceId: req.params.id,
        adminId: req.userId
      });
      console.error("Erro ao deletar serviço:", err);
      res.status(500).json({ error: "Erro ao deletar serviço" });
    }
  }
};

module.exports = serviceController;