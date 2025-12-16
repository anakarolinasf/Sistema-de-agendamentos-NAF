const User = require("../models/User");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const logger = require('../utils/logger');

const SECRET = process.env.JWT_SECRET;

// Configuração do email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const authController = {
  // Registro (ATUALIZADO com nome)
  register: async (req, res) => {
    try {
      const { email, password, name } = req.body;

      logger.info('Tentativa de registro de usuário', { email, name });
      
      // Verifica se o email já existe
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        logger.warn('Tentativa de registro com email já existente', { email });
        return res.status(400).json({ 
          error: "Este email já está cadastrado. Por favor, use outro email ou faça login." 
        });
      }

      const user = new User({ 
        email: email.toLowerCase(),
        password,
        name: name || null // Pode ser opcional
      });
      
      await user.save();

      logger.info('Usuário registrado com sucesso', { 
        userId: user._id, 
        email: user.email,
        role: user.role 
      });
      
      const token = jwt.sign({ 
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role 
      }, SECRET, { expiresIn: "24h" });
      
      res.status(201).json({ 
        token, 
        email: user.email,
        name: user.name,
        role: user.role,
        message: "Usuário criado com sucesso!" 
      });
      
    } catch (err) {
      logger.error('Erro no registro de usuário', { 
        error: err.message,
        email: req.body.email 
      });
      console.error("Erro no registro:", err);
      
      if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(error => error.message);
        return res.status(400).json({ 
          error: `Dados inválidos: ${errors.join(', ')}` 
        });
      }
      
      res.status(400).json({ 
        error: "Erro ao criar usuário. Tente novamente." 
      });
    }
  },

  // Login (ATUALIZADO para retornar nome)
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // ✅ Garante que email é uma string para o log
      const emailForLog = typeof email === 'string' ? email : 
                        (email?.email || 'email não fornecido');

      logger.info('Tentativa de login', { email: emailForLog });

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) throw new Error("Usuário não encontrado");
      const isMatch = await user.comparePassword(password);
      if (!isMatch) throw new Error("Senha incorreta");
      
      const token = jwt.sign({ 
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role 
      }, SECRET, { expiresIn: "24h" });

      logger.info('Login realizado com sucesso', { 
        userId: user._id, 
        email: user.email,
        role: user.role 
      });
      
      res.json({ 
        token, 
        email: user.email,
        name: user.name,
        role: user.role 
      });
    } catch (err) {
      // ✅ CORREÇÃO: Tratamento seguro do email para o log
      const emailForLog = typeof req.body.email === 'string' ? req.body.email : 
                        (req.body.email?.email || 'email não fornecido');

      logger.error('Erro no processo de login', { 
        error: err.message,
        email: emailForLog  // ✅ Agora sempre será uma string
      });
      res.status(400).json({ error: err.message });
    }
  },

  // Solicitar reset de senha
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;

      logger.info('Solicitação de reset de senha', { email });
      
      if (!email) {
        logger.warn('Solicitação de reset de senha sem email');
        return res.status(400).json({ error: "Email é obrigatório" });
      }

      const user = await User.findOne({ email });
      if (!user) {
        // Por segurança, não revelamos se o email existe ou não
        logger.info('Solicitação de reset para email não cadastrado (não revelado)', { email });
        return res.json({ message: "Se o email existir, enviaremos instruções para resetar a senha" });
      }

      // Gera token único
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = Date.now() + 3600000; // 1 hora

      // Salva token no usuário
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = resetTokenExpiry;
      await user.save();

      logger.info('Token de reset gerado para usuário', {
        userId: user._id,
        email: user.email
      });

      // Cria link de reset
      const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

      // Configura email
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Redefinição de Senha - Sistema de Agendamentos',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #667eea;">Redefinição de Senha</h2>
            <p>Olá,</p>
            <p>Você solicitou a redefinição da sua senha. Clique no link abaixo para criar uma nova senha:</p>
            <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
              Redefinir Senha
            </a>
            <p>Este link expira em 1 hora.</p>
            <p>Se você não solicitou esta redefinição, ignore este email.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
            <p style="color: #718096; font-size: 14px;">
              Sistema de Agendamentos
            </p>
          </div>
        `
      };

      // Envia email
      await transporter.sendMail(mailOptions);

      logger.info('Email de reset de senha enviado com sucesso', {
        userId: user._id,
        email: user.email
      });

      res.json({ message: "Se o email existir, enviaremos instruções para resetar a senha" });
    } catch (error) {
      logger.error('Erro no processo de reset de senha', {
        error: error.message,
        email: req.body.email
      });
      console.error("Erro no forgot-password:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  },

  // Resetar senha
  resetPassword: async (req, res) => {
    try {
      const { token } = req.params;
      const { password } = req.body;

      logger.info('Tentativa de reset de senha com token', { 
        token: token.substring(0, 10) + '...' // Log parcial por segurança
      });

      if (!password) {
        logger.warn('Tentativa de reset de senha sem nova senha');
        return res.status(400).json({ error: "Nova senha é obrigatória" });
      }

      // Busca usuário com token válido
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
      });

      if (!user) {
        logger.warn('Token de reset inválido ou expirado', {
          token: token.substring(0, 10) + '...'
        });
        return res.status(400).json({ error: "Token inválido ou expirado" });
      }

      logger.info('Token de reset válido encontrado', {
        userId: user._id,
        email: user.email
      });

      // Atualiza senha
      user.password = password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      logger.info('Senha redefinida com sucesso', {
        userId: user._id,
        email: user.email
      });

      res.json({ message: "Senha redefinida com sucesso" });
    } catch (error) {
      logger.error('Erro ao resetar senha', {
        error: error.message,
        token: req.params.token ? req.params.token.substring(0, 10) + '...' : 'none'
      });
      console.error("Erro no reset-password:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
};

module.exports = authController;