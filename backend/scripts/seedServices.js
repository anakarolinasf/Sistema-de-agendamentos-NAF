const mongoose = require("mongoose");
const Service = require("../models/Service");
require("dotenv").config({ path: require('path').join(__dirname, '..', '.env') }); // ✅ Caminho absoluto

const initialServices = [
  { name: "Consulta Fiscal", icon: "📊" },
  { name: "Declaração de Impostos", icon: "📝" },
  { name: "Planejamento Tributário", icon: "📈" },
  { name: "Auditoria Fiscal", icon: "🔍" },
  { name: "Outros", icon: "📋" }
];

async function seedServices() {
  try {
    // ✅ DEBUG: Verifica se as variáveis de ambiente estão carregadas
    console.log("🔍 MONGO_URI:", process.env.MONGO_URI ? "Definida" : "NÃO DEFINIDA");
    
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI não está definida no arquivo .env");
    }

    // ✅ Conexão com fallback
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Conectado ao MongoDB");

    // 🔍 DEBUG: Verifica se o modelo está carregado
    console.log("🔍 Modelo Service:", Service ? "Carregado" : "NÃO carregado");
    
    // 🔍 DEBUG: Verifica quantos serviços existem atualmente
    const currentCount = await Service.countDocuments();
    console.log(`🔍 Serviços existentes no banco: ${currentCount}`);

    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const serviceData of initialServices) {
      try {
        // Verifica se o serviço já existe
        const existingService = await Service.findOne({ 
          name: { $regex: new RegExp(`^${serviceData.name}$`, 'i') } 
        });
        
        if (!existingService) {
          const service = new Service(serviceData);
          await service.save();
          console.log(`✅ Serviço criado: ${service.icon} ${service.name}`);
          createdCount++;
        } else {
          console.log(`⚠️ Serviço já existe: ${serviceData.icon} ${serviceData.name}`);
          skippedCount++;
        }
      } catch (itemError) {
        console.error(`❌ Erro ao processar ${serviceData.name}:`, itemError.message);
        errorCount++;
      }
    }

    console.log("\n🎉 Resumo da operação:");
    console.log(`✅ Serviços criados: ${createdCount}`);
    console.log(`⏭️ Serviços já existentes: ${skippedCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log(`📋 Total no banco: ${await Service.countDocuments()} serviços`);

  } catch (error) {
    console.error("❌ Erro geral no script:", error.message);
  } finally {
    // Fecha a conexão adequadamente
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log("🔌 Conexão com MongoDB fechada");
    }
    process.exit(0);
  }
}

// Executa o script
seedServices();