const businessConfig = {
  // Horário de funcionamento
  businessHours: {
    start: "08:00",
    end: "19:00"
  },
  
  // Dias de funcionamento (0 = Domingo, 1 = Segunda, ..., 6 = Sábado)
  // ATUALIZADO: Segunda (1) a Sexta (5)
  workingDays: [1, 2, 3, 4, 5],
  
  // Intervalo entre agendamentos (em minutos)
  timeSlotInterval: 30,
  
  // Pausas/Intervalos
  breaks: [
    {
      name: "Almoço",
      start: "12:00",
      end: "13:00"
    }
  ]
};

// Função auxiliar para debug
businessConfig.getWorkingDaysNames = function() {
  const daysMap = {
    0: 'Domingo',
    1: 'Segunda', 
    2: 'Terça',
    3: 'Quarta',
    4: 'Quinta', 
    5: 'Sexta',
    6: 'Sábado'
  };
  return this.workingDays.map(day => daysMap[day]).join(', ');
};

console.log(`📅 Dias de funcionamento configurados: ${businessConfig.getWorkingDaysNames()}`);

module.exports = businessConfig;