const generateBeautifulReport = (appointments, reportType) => {
  const now = new Date();
  const reportDate = now.toLocaleDateString('pt-BR');
  const reportTime = now.toLocaleTimeString('pt-BR');
  
  let title = '';
  let data = [];
  let summary = '';

  switch (reportType) {
    case 'all':
      title = 'Relatório Completo de Agendamentos';
      data = appointments.map((apt, index) => ({
        numero: index + 1,
        usuario: apt.userId?.email || 'N/A',
        servico: apt.service,
        data: new Date(apt.date).toLocaleDateString('pt-BR'),
        hora: new Date(apt.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        criadoEm: apt.createdAt ? new Date(apt.createdAt).toLocaleString('pt-BR') : 'N/A'
      }));
      summary = `Total de ${appointments.length} agendamentos`;
      break;

    case 'service':
      title = 'Relatório por Serviço';
      const serviceStats = appointments.reduce((acc, apt) => {
        if (!acc[apt.service]) acc[apt.service] = 0;
        acc[apt.service]++;
        return acc;
      }, {});
      
      data = Object.entries(serviceStats).map(([servico, total]) => ({
        servico,
        total,
        percentual: `${((total / appointments.length) * 100).toFixed(1)}%`
      }));
      summary = `${Object.keys(serviceStats).length} tipos de serviços`;
      break;

    case 'daily':
      title = 'Relatório Diário';
      const dailyStats = appointments.reduce((acc, apt) => {
        const date = new Date(apt.date).toLocaleDateString('pt-BR');
        if (!acc[date]) acc[date] = 0;
        acc[date]++;
        return acc;
      }, {});
      
      data = Object.entries(dailyStats)
        .map(([data, total]) => ({ data, total }))
        .sort((a, b) => new Date(a.data.split('/').reverse().join('-')) - 
                         new Date(b.data.split('/').reverse().join('-')));
      summary = `${Object.keys(dailyStats).length} dias com agendamentos`;
      break;
  }

  // Função generateTable movida para dentro do escopo e recebendo parâmetros
  const generateTable = (tableData, tableReportType) => {
    if (tableData.length === 0) {
      return '<p style="text-align: center; color: #718096; padding: 40px; font-style: italic;">Nenhum dado disponível para exibir.</p>';
    }

    let headers = [];
    let rows = [];

    switch (tableReportType) {
      case 'all':
        headers = ['#', 'Usuário', 'Serviço', 'Data', 'Hora', 'Criado Em'];
        rows = tableData.map(item => `
          <tr>
            <td style="text-align: center; color: #718096; font-weight: 600;">${item.numero}</td>
            <td>${item.usuario}</td>
            <td><span class="service-badge">${item.servico}</span></td>
            <td><strong>${item.data}</strong></td>
            <td style="color: #667eea; font-weight: 600;">${item.hora}</td>
            <td><small style="color: #718096;">${item.criadoEm}</small></td>
          </tr>
        `);
        break;

      case 'service':
        headers = ['Serviço', 'Total', 'Percentual'];
        rows = tableData.map(item => `
          <tr>
            <td><strong>${item.servico}</strong></td>
            <td style="text-align: center; font-weight: 700; color: #667eea; font-size: 1.1rem;">${item.total}</td>
            <td style="text-align: center;">
              <span style="background: #c6f6d5; color: #22543d; padding: 6px 12px; border-radius: 20px; font-weight: 600; font-size: 0.9rem;">
                ${item.percentual}
              </span>
            </td>
          </tr>
        `);
        break;

      case 'daily':
        headers = ['Data', 'Total de Agendamentos'];
        rows = tableData.map(item => `
          <tr>
            <td><strong>${item.data}</strong></td>
            <td style="text-align: center;">
              <span style="font-weight: 700; color: #667eea; font-size: 1.2rem; background: #ebf8ff; padding: 8px 16px; border-radius: 20px; display: inline-block; min-width: 60px;">
                ${item.total}
              </span>
            </td>
          </tr>
        `);
        break;
    }

    return `
      <table class="data-table">
        <thead>
          <tr>
            ${headers.map(header => `<th>${header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.join('')}
        </tbody>
      </table>
    `;
  };

  // Agora gera o HTML content
  const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', sans-serif;
            line-height: 1.6;
            color: #2d3748;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 40px 20px;
        }
        
        .report-container {
            max-width: 1000px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        
        .report-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .report-header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
        
        .report-title {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 10px;
            position: relative;
        }
        
        .report-subtitle {
            font-size: 1.1rem;
            opacity: 0.9;
            font-weight: 400;
        }
        
        .report-meta {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin-top: 20px;
            flex-wrap: wrap;
        }
        
        .meta-item {
            background: rgba(255, 255, 255, 0.1);
            padding: 12px 20px;
            border-radius: 12px;
            backdrop-filter: blur(10px);
        }
        
        .report-content {
            padding: 40px;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        
        .stat-card {
            background: #f7fafc;
            padding: 25px;
            border-radius: 15px;
            text-align: center;
            border-left: 4px solid #667eea;
            transition: transform 0.3s ease;
        }
        
        .stat-card:hover {
            transform: translateY(-5px);
        }
        
        .stat-number {
            font-size: 2.5rem;
            font-weight: 700;
            color: #667eea;
            display: block;
        }
        
        .stat-label {
            color: #718096;
            font-size: 0.9rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .data-section {
            margin-top: 30px;
        }
        
        .section-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e2e8f0;
        }
        
        .data-table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
        }
        
        .data-table th {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px 20px;
            text-align: left;
            font-weight: 600;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .data-table td {
            padding: 14px 20px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 0.95rem;
        }
        
        .data-table tr:hover {
            background: #f7fafc;
        }
        
        .data-table tr:last-child td {
            border-bottom: none;
        }
        
        .service-badge {
            background: #e6fffa;
            color: #234e52;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
            display: inline-block;
        }
        
        .report-footer {
            background: #f7fafc;
            padding: 30px 40px;
            text-align: center;
            color: #718096;
            border-top: 1px solid #e2e8f0;
        }
        
        .footer-text {
            margin-bottom: 10px;
        }
        
        .logo {
            font-size: 1.2rem;
            font-weight: 700;
            color: #667eea;
            margin-top: 10px;
        }
        
        /* Cores diferentes para os cards de estatística */
        .stat-card:nth-child(2) {
            border-left-color: #48bb78;
        }
        
        .stat-card:nth-child(2) .stat-number {
            color: #48bb78;
        }
        
        .stat-card:nth-child(3) {
            border-left-color: #ed8936;
        }
        
        .stat-card:nth-child(3) .stat-number {
            color: #ed8936;
        }
        
        .stat-card:nth-child(4) {
            border-left-color: #9f7aea;
        }
        
        .stat-card:nth-child(4) .stat-number {
            color: #9f7aea;
        }
        
        @media (max-width: 768px) {
            body {
                padding: 20px 10px;
            }
            
            .report-header {
                padding: 30px 20px;
            }
            
            .report-title {
                font-size: 2rem;
            }
            
            .report-content {
                padding: 20px;
            }
            
            .stats-grid {
                grid-template-columns: 1fr;
            }
            
            .data-table {
                font-size: 0.8rem;
            }
            
            .data-table th,
            .data-table td {
                padding: 10px 12px;
            }
        }
    </style>
</head>
<body>
    <div class="report-container">
        <header class="report-header">
            <h1 class="report-title">${title}</h1>
            <p class="report-subtitle">Relatório gerado automaticamente pelo sistema</p>
            
            <div class="report-meta">
                <div class="meta-item">
                    <strong>📅 Data:</strong> ${reportDate}
                </div>
                <div class="meta-item">
                    <strong>🕒 Hora:</strong> ${reportTime}
                </div>
                <div class="meta-item">
                    <strong>📊 Resumo:</strong> ${summary}
                </div>
            </div>
        </header>
        
        <div class="report-content">
            <div class="stats-grid">
                <div class="stat-card">
                    <span class="stat-number">${appointments.length}</span>
                    <span class="stat-label">Total de Agendamentos</span>
                </div>
                <div class="stat-card">
                    <span class="stat-number">${new Set(appointments.map(a => a.userId?.email)).size}</span>
                    <span class="stat-label">Usuários Únicos</span>
                </div>
                <div class="stat-card">
                    <span class="stat-number">${new Set(appointments.map(a => a.service)).size}</span>
                    <span class="stat-label">Tipos de Serviços</span>
                </div>
                <div class="stat-card">
                    <span class="stat-number">${new Set(appointments.map(a => new Date(a.date).toLocaleDateString('pt-BR'))).size}</span>
                    <span class="stat-label">Dias com Agendamentos</span>
                </div>
            </div>
            
            <div class="data-section">
                <h2 class="section-title">📋 Dados Detalhados</h2>
                ${generateTable(data, reportType)}
            </div>
        </div>
        
        <footer class="report-footer">
            <p class="footer-text">Relatório gerado automaticamente pelo Sistema de Agendamentos</p>
            <p class="footer-text">© ${now.getFullYear()} - Todos os direitos reservados</p>
            <div class="logo">📅 Sistema de Agendamentos</div>
        </footer>
    </div>
</body>
</html>
  `;

  return htmlContent;
};

module.exports = { generateBeautifulReport };