const nodemailer = require('nodemailer');
const logger = require('../utils/logger');



// Configuração do transporter de email (use a mesma do seu sistema de senha)
const transporter = nodemailer.createTransport({
  service: 'gmail', // ou outro serviço
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Função para enviar email de cancelamento
const sendCancellationEmail = async (appointmentInfo) => {
  try {
    const { userEmail, service, date, appointmentId } = appointmentInfo;
    
    // Formata a data para exibição
    const formattedDate = new Date(date).toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: '📅 Agendamento Cancelado - Sistema de Agendamentos',
      html: /*html*/`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f9f9f9;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 600;
            }
            .content {
              padding: 30px;
            }
            .appointment-details {
              background: #f8fafc;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
              border-left: 4px solid #667eea;
            }
            .detail-item {
              margin-bottom: 10px;
              display: flex;
              align-items: center;
            }
            .detail-label {
              font-weight: 600;
              color: #4a5568;
              min-width: 100px;
            }
            .detail-value {
              color: #2d3748;
            }
            .warning {
              background: #fff5f5;
              border: 1px solid #fed7d7;
              border-radius: 8px;
              padding: 15px;
              margin: 20px 0;
              text-align: center;
            }
            .footer {
              background: #f7fafc;
              padding: 20px;
              text-align: center;
              color: #718096;
              font-size: 14px;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 8px;
              margin: 10px 0;
              font-weight: 600;
            }
            .icon {
              font-size: 20px;
              margin-right: 10px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 Agendamento Cancelado</h1>
            </div>
            
            <div class="content">
              <p>Prezado(a) cliente,</p>
              
              <p>Informamos que o seguinte agendamento foi <strong>cancelado pela administração</strong>:</p>
              
              <div class="appointment-details">
                <div class="detail-item">
                  <span class="detail-label">📋 Serviço:</span>
                  <span class="detail-value">${service}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">📅 Data/Hora:</span>
                  <span class="detail-value">${formattedDate}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">🆔 ID:</span>
                  <span class="detail-value">${appointmentId}</span>
                </div>
              </div>
              
              <div class="warning">
                <p>🚫 <strong>Este agendamento não está mais ativo em nosso sistema.</strong></p>
              </div>
              
              <p>Se você precisar reagendar este serviço ou tiver alguma dúvida, entre em contato conosco:</p>
              
              <p>
                <a href="mailto:${process.env.SUPPORT_EMAIL}" class="button">
                  📞 Entrar em Contato
                </a>
              </p>
              
              <p><em>Estamos à disposição para ajudá-lo!</em></p>
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} Sistema de Agendamentos. Todos os direitos reservados.</p>
              <p>Este é um email automático, por favor não responda.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);

    logger.info('Email de cancelamento enviado com sucesso', {
      userEmail: appointmentInfo.userEmail
    });

    console.log(`✅ Email de cancelamento enviado para: ${userEmail}`);
    
    return true;
  } catch (error) {

    logger.error('Erro ao enviar email de cancelamento', {
      error: error.message,
      userEmail: appointmentInfo.userEmail
    });

    console.error('❌ Erro ao enviar email de cancelamento:', error);
    // Não lança erro para não afetar o fluxo principal
    return false;
  }
};
// Função para enviar email de encerramento/conclusão
const sendCompletionEmail = async (appointmentInfo) => {
  try {
    const { userEmail, service, date, appointmentId } = appointmentInfo;
    
    // Formata a data para exibição
    const formattedDate = new Date(date).toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: '✅ Serviço Concluído - Sistema de Agendamentos',
      html: /*html*/`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f9f9f9;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 600;
            }
            .content {
              padding: 30px;
            }
            .appointment-details {
              background: #f0fff4;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
              border-left: 4px solid #48bb78;
            }
            .detail-item {
              margin-bottom: 10px;
              display: flex;
              align-items: center;
            }
            .detail-label {
              font-weight: 600;
              color: #2d3748;
              min-width: 100px;
            }
            .detail-value {
              color: #2d3748;
            }
            .success {
              background: #f0fff4;
              border: 1px solid #9ae6b4;
              border-radius: 8px;
              padding: 15px;
              margin: 20px 0;
              text-align: center;
            }
            .footer {
              background: #f7fafc;
              padding: 20px;
              text-align: center;
              color: #718096;
              font-size: 14px;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 8px;
              margin: 10px 0;
              font-weight: 600;
            }
            .rating {
              text-align: center;
              margin: 25px 0;
            }
            .stars {
              font-size: 24px;
              color: #f6e05e;
              margin: 10px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Serviço Concluído</h1>
            </div>
            
            <div class="content">
              <p>Prezado(a) cliente,</p>
              
              <p>É com satisfação que informamos que o seguinte serviço foi <strong>concluído com sucesso</strong>:</p>
              
              <div class="appointment-details">
                <div class="detail-item">
                  <span class="detail-label">📋 Serviço:</span>
                  <span class="detail-value">${service}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">📅 Data/Hora:</span>
                  <span class="detail-value">${formattedDate}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">🆔 ID:</span>
                  <span class="detail-value">${appointmentId}</span>
                </div>
              </div>
              
              <div class="success">
                <p>🎉 <strong>Seu serviço foi finalizado com sucesso!</strong></p>
                <p>Agradecemos pela confiança em nossos serviços.</p>
              </div>

              <div class="rating">
                <p><strong>Como foi sua experiência?</strong></p>
                <div class="stars">
                  ⭐⭐⭐⭐⭐
                </div>
                <p>Seu feedback é muito importante para nós!</p>
              </div>
              
              <p style="text-align: center;">
                <a href="mailto:${process.env.SUPPORT_EMAIL}?subject=Feedback sobre o serviço ${appointmentId}" class="button">
                  💬 Deixar Feedback
                </a>
              </p>
              
              <p><em>Estamos à disposição para futuros serviços!</em></p>
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} Sistema de Agendamentos. Todos os direitos reservados.</p>
              <p>Este é um email automático, por favor não responda.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email de conclusão enviado para: ${userEmail}`);
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar email de conclusão:', error);
    return false;
  }
};

module.exports = {
  sendCancellationEmail,
  sendCompletionEmail
};
