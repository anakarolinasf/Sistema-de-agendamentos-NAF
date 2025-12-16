const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const updateExistingUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('📡 Conectado ao MongoDB...');

    // Busca todos os usuários sem nome
    const usersWithoutName = await User.find({ name: { $exists: false } });
    console.log(`👥 Encontrados ${usersWithoutName.length} usuários sem nome`);

    // Atualiza cada usuário com um placeholder baseado no email
    for (const user of usersWithoutName) {
      const placeholderName = generatePlaceholderName(user.email);
      
      await User.findByIdAndUpdate(user._id, { 
        name: placeholderName 
      });
      
      console.log(`✅ Atualizado: ${user.email} -> ${placeholderName}`);
    }

    console.log('🎉 Todos os usuários foram atualizados com sucesso!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro ao atualizar usuários:', error);
    process.exit(1);
  }
};

// Função para gerar nome placeholder baseado no email
const generatePlaceholderName = (email) => {
  // Pega a parte antes do @ do email
  const username = email.split('@')[0];
  
  // Remove números e caracteres especiais, mantendo apenas letras
  const cleanName = username.replace(/[^a-zA-ZÀ-ÿ]/g, '');
  
  // Se não tiver letras, usa "Usuário"
  if (!cleanName) {
    return 'Usuário';
  }
  
  // Capitaliza a primeira letra
  return cleanName.charAt(0).toUpperCase() + cleanName.slice(1).toLowerCase();
};

// Executa o script
updateExistingUsers();