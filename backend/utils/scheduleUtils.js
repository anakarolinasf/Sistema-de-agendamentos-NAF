const businessConfig = require('../config/businessHours');
const Appointment = require('../models/Appointment');

class ScheduleUtils {
  // Converte hora no formato "HH:MM" para minutos do dia
  static timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Converte minutos do dia para formato "HH:MM"
  static minutesToTime(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  // CORREÇÃO: Cria uma data considerando o fuso horário local
  static createLocalDate(dateString, timeString) {
    // Combina data e hora e cria no fuso local
    const localDate = new Date(`${dateString}T${timeString}:00`);
    return localDate;
  }

  // CORREÇÃO: Converte data para UTC para comparação no banco
  static toUTCDate(date) {
    return new Date(Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
      date.getSeconds()
    ));
  }

  // CORREÇÃO: Obtém o dia da semana corretamente considerando UTC
  static getUTCDayOfWeek(date) {
    const utcDate = new Date(Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    ));
    return utcDate.getUTCDay(); // 0 = Domingo, 1 = Segunda, etc.
  }

  // Verifica se é um dia útil (CORRIGIDO)
  static isWorkingDay(date) {
    const dayOfWeek = this.getUTCDayOfWeek(date);
    console.log(`📅 Data: ${date}, Dia da semana (UTC): ${dayOfWeek}, Dias úteis: ${businessConfig.workingDays}`);
    return businessConfig.workingDays.includes(dayOfWeek);
  }

  // Verifica se um horário está dentro do expediente
  static isWithinBusinessHours(time) {
    const timeMinutes = this.timeToMinutes(time);
    const startMinutes = this.timeToMinutes(businessConfig.businessHours.start);
    const endMinutes = this.timeToMinutes(businessConfig.businessHours.end);
    
    return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
  }

  // Verifica se um horário está em uma pausa
  static isDuringBreak(time) {
    const timeMinutes = this.timeToMinutes(time);
    
    for (const breakItem of businessConfig.breaks) {
      const breakStart = this.timeToMinutes(breakItem.start);
      const breakEnd = this.timeToMinutes(breakItem.end);
      
      if (timeMinutes >= breakStart && timeMinutes < breakEnd) {
        return true;
      }
    }
    
    return false;
  }

  // Gera todos os slots de tempo possíveis para um dia
  static generateTimeSlots() {
    const slots = [];
    const startMinutes = this.timeToMinutes(businessConfig.businessHours.start);
    const endMinutes = this.timeToMinutes(businessConfig.businessHours.end);
    const interval = businessConfig.timeSlotInterval;
    
    for (let minutes = startMinutes; minutes < endMinutes; minutes += interval) {
      const time = this.minutesToTime(minutes);
      
      // Verifica se não está em uma pausa
      if (!this.isDuringBreak(time)) {
        slots.push(time);
      }
    }
    
    return slots;
  }

  // CORREÇÃO: Busca agendamentos existentes para uma data específica (corrigido fuso horário)
  static async getExistingAppointments(date) {
    try {
      console.log(`🔍 Buscando agendamentos para: ${date}`);
      
      // Cria as datas de início e fim no fuso horário local
      const startOfDay = new Date(`${date}T00:00:00`);
      const endOfDay = new Date(`${date}T23:59:59.999`);
      
      console.log(`📊 Início do dia (local): ${startOfDay}`);
      console.log(`📊 Fim do dia (local): ${endOfDay}`);
      
      const appointments = await Appointment.find({
        date: {
          $gte: startOfDay,
          $lt: endOfDay
        }
      }).select('date');
      
      console.log(`✅ Agendamentos encontrados: ${appointments.length}`);
      
      const bookedSlots = appointments.map(apt => {
        const aptDate = new Date(apt.date);
        // Converte para horário local
        const localHours = aptDate.getHours();
        const localMinutes = aptDate.getMinutes();
        
        // Arredonda para o slot de 30 minutos mais próximo
        const slotMinutes = localMinutes < 30 ? 0 : 30;
        const slotTime = this.minutesToTime(localHours * 60 + slotMinutes);
        
        console.log(`⏰ Agendamento: ${aptDate} -> Horário local: ${slotTime}`);
        return slotTime;
      });
      
      const uniqueSlots = [...new Set(bookedSlots)];
      console.log(`🎯 Horários ocupados: ${uniqueSlots}`);
      
      return uniqueSlots;
    } catch (error) {
      console.error('❌ Erro ao buscar agendamentos existentes:', error);
      return [];
    }
  }

  // CORREÇÃO: Obtém horários disponíveis para uma data específica
  static async getAvailableTimeSlots(date) {
    try {
      console.log(`\n🎯 BUSCANDO HORÁRIOS DISPONÍVEIS PARA: ${date}`);
      const selectedDate = new Date(`${date}T12:00:00`); // Meio-dia como referência
      
      // Verifica se é um dia útil
      if (!this.isWorkingDay(selectedDate)) {
        console.log(`❌ Não é dia útil: ${date}`);
        return [];
      }
      
      // Gera todos os slots possíveis
      const allSlots = this.generateTimeSlots();
      console.log(`📋 Todos os slots possíveis: ${allSlots}`);
      
      // Busca agendamentos existentes
      const existingAppointments = await this.getExistingAppointments(date);
      console.log(`🚫 Horários ocupados: ${existingAppointments}`);
      
      // Filtra slots disponíveis
      const availableSlots = allSlots.filter(slot => 
        !existingAppointments.includes(slot)
      );
      
      console.log(`✅ Horários disponíveis: ${availableSlots}`);
      console.log(`📊 Total: ${availableSlots.length} horários disponíveis\n`);
      
      return availableSlots;
    } catch (error) {
      console.error('❌ Erro ao gerar horários disponíveis:', error);
      return [];
    }
  }

  // CORREÇÃO: Valida se um horário específico está disponível
  static async isTimeSlotAvailable(date, time) {
    try {
      console.log(`\n🔍 VALIDANDO HORÁRIO: ${date} às ${time}`);
      const selectedDate = new Date(`${date}T12:00:00`);
      
      // Verifica se é dia útil
      if (!this.isWorkingDay(selectedDate)) {
        console.log(`❌ Fora do horário comercial`);
        return { available: false, reason: "Fora do horário comercial (fim de semana)" };
      }
      
      // Verifica se está dentro do expediente
      if (!this.isWithinBusinessHours(time)) {
        console.log(`❌ Fora do horário de funcionamento`);
        return { available: false, reason: "Fora do horário de funcionamento" };
      }
      
      // Verifica se não está em pausa
      if (this.isDuringBreak(time)) {
        console.log(`❌ Horário de pausa`);
        return { available: false, reason: "Horário de pausa/intervalo" };
      }
      
      // Verifica se não há conflito com outros agendamentos
      const existingAppointments = await this.getExistingAppointments(date);
      if (existingAppointments.includes(time)) {
        console.log(`❌ Horário já agendado`);
        return { available: false, reason: "Horário já agendado" };
      }
      
      console.log(`✅ Horário disponível`);
      return { available: true };
    } catch (error) {
      console.error('❌ Erro ao validar horário:', error);
      return { available: false, reason: "Erro interno do servidor" };
    }
  }
}

module.exports = ScheduleUtils;