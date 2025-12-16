import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { 
  createAppointment, 
  getAppointments, 
  deleteAppointment, 
  updateAppointment, 
  getAvailableSlots,
  getServices 
} from "../services/api";
import styles from "./Schedule.module.css";

export default function Schedule() {
  const { token } = useContext(AuthContext);
  const [services, setServices] = useState([]);
  const [service, setService] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  
  // Estados para edição
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [editService, setEditService] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  
  // Estados para horários disponíveis para edição
  const [editAvailableSlots, setEditAvailableSlots] = useState([]);
  const [editLoadingSlots, setEditLoadingSlots] = useState(false);

  // Carregar serviços do banco de dados
  const loadServicesFromDB = async () => {
    try {
      const data = await getServices();
      if (Array.isArray(data) && data.length > 0) {
        setServices(data);
        setService(data[0].name); // Define o primeiro serviço como padrão
      } else {
        setServices([]);
        setService("");
      }
    } catch (error) {
      console.error("Erro ao carregar serviços:", error);
      setServices([]);
      setService("");
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    loadServicesFromDB();
    loadAppointments();
  }, []);

  // Efeito para carregar horários do formulário principal
  useEffect(() => {
    if (date) {
      loadAvailableSlots(date);
    } else {
      setAvailableSlots([]);
      setTime("");
    }
  }, [date]);

  // Efeito para carregar horários quando a data de edição mudar
  useEffect(() => {
    if (editDate) {
      loadEditAvailableSlots(editDate);
    } else {
      setEditAvailableSlots([]);
      setEditTime("");
    }
  }, [editDate]);

  const loadAvailableSlots = async (selectedDate) => {
    try {
      setLoadingSlots(true);
      const data = await getAvailableSlots(token, selectedDate);
      
      if (data.error) {
        console.error("Erro ao carregar horários:", data.error);
        setAvailableSlots([]);
      } else if (data.availableSlots) {
        setAvailableSlots(data.availableSlots);
        if (time && !data.availableSlots.includes(time)) {
          setTime("");
        }
      }
    } catch (error) {
      console.error("Erro ao carregar horários disponíveis:", error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Carregar horários para edição
  const loadEditAvailableSlots = async (selectedDate) => {
    try {
      setEditLoadingSlots(true);
      const data = await getAvailableSlots(token, selectedDate);
      
      if (data.error) {
        console.error("Erro ao carregar horários para edição:", data.error);
        setEditAvailableSlots([]);
      } else if (data.availableSlots) {
        setEditAvailableSlots(data.availableSlots);
        
        // Se o horário atual de edição não estiver disponível, mantém o original
        if (editTime && !data.availableSlots.includes(editTime)) {
          console.log("Horário original não está mais disponível, mas mantendo para referência");
        }
      }
    } catch (error) {
      console.error("Erro ao carregar horários disponíveis para edição:", error);
      setEditAvailableSlots([]);
    } finally {
      setEditLoadingSlots(false);
    }
  };

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const data = await getAppointments(token);
      setAppointments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao carregar agendamentos:", error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    if (!date || !time || !service) {
      alert("Por favor, preencha todos os campos");
      return;
    }

    try {
      setSubmitting(true);
      await createAppointment(token, service, date, time);
      setDate("");
      setTime("");
      await loadAppointments();
    } catch (error) {
      console.error("Erro ao criar agendamento:", error);
      alert(error.message || "Erro ao criar agendamento. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir este agendamento?")) {
      try {
        await deleteAppointment(token, id);
        await loadAppointments();
      } catch (error) {
        console.error("Erro ao excluir agendamento:", error);
        alert("Erro ao excluir agendamento. Tente novamente.");
      }
    }
  };

  const handleEdit = (appointment) => {
    setEditingAppointment(appointment);
    setEditService(appointment.service);
    
    const dateTime = new Date(appointment.date);
    const appointmentDate = dateTime.toISOString().split('T')[0];
    const appointmentTime = dateTime.toTimeString().slice(0, 5);
    
    setEditDate(appointmentDate);
    setEditTime(appointmentTime);
    
    // Carrega os horários disponíveis para a data do agendamento
    loadEditAvailableSlots(appointmentDate);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editDate || !editTime) return;

    try {
      setEditLoading(true);
      await updateAppointment(token, editingAppointment._id, editService, editDate, editTime);
      await loadAppointments();
      setEditingAppointment(null);
      setEditService("");
      setEditDate("");
      setEditTime("");
      setEditAvailableSlots([]);
    } catch (error) {
      console.error("Erro ao atualizar agendamento:", error);
      alert(error.message || "Erro ao atualizar agendamento. Tente novamente.");
    } finally {
      setEditLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getServiceIcon = (serviceName) => {
    const serviceObj = services.find(s => s.name === serviceName);
    return serviceObj ? serviceObj.icon : "📋";
  };

  // Se não há serviços disponíveis
  if (services.length === 0 && !loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Agendamento de Serviços</h1>
          <p className={styles.subtitle}>Gerencie seus agendamentos de forma simples e rápida</p>
        </div>
        
        <div className={styles.noServices}>
          <div className={styles.noServicesIcon}>⚠️</div>
          <h2>Nenhum serviço disponível</h2>
          <p>No momento não há serviços disponíveis para agendamento.</p>
          <p>Entre em contato com o administrador do sistema.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Modal de Edição */}
      {editingAppointment && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Editar Agendamento</h3>
              <button 
                className={styles.closeButton}
                onClick={() => {
                  setEditingAppointment(null);
                  setEditAvailableSlots([]);
                }}
              >
                ×
              </button>
            </div>
            <form className={styles.modalForm} onSubmit={handleUpdate}>
              <div className={styles.modalContent}>
                <div className={styles.modalInputGroup}>
                  <label className={styles.modalLabel}>Serviço</label>
                  <select
                    className={styles.modalSelect}
                    value={editService}
                    onChange={e => setEditService(e.target.value)}
                    required
                  >
                    {services.map(s => (
                      <option key={s._id} value={s.name}>
                        {s.icon} {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className={styles.modalInputGroup}>
                  <label className={styles.modalLabel}>Nova Data</label>
                  <input
                    type="date"
                    className={styles.modalInput}
                    value={editDate}
                    onChange={e => {
                      setEditDate(e.target.value);
                      setEditTime(""); // Limpa o horário quando a data muda
                    }}
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className={styles.modalInputGroup}>
                  <label className={styles.modalLabel}>
                    Novo Horário
                    {editLoadingSlots && <span className={styles.loadingText}> (carregando...)</span>}
                  </label>
                  <select
                    className={styles.modalInput}
                    value={editTime}
                    onChange={e => setEditTime(e.target.value)}
                    required
                    disabled={!editDate || editLoadingSlots}
                  >
                    <option value="">Selecione um horário</option>
                    {/* Opção especial para manter o horário original se não estiver disponível */}
                    {editTime && !editAvailableSlots.includes(editTime) && (
                      <option key="original" value={editTime}>
                        {editTime} (horário original - pode não estar disponível)
                      </option>
                    )}
                    {editAvailableSlots.map(slot => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                  {editAvailableSlots.length === 0 && editDate && !editLoadingSlots && (
                    <div className={styles.warningText}>
                      Não há horários disponíveis para esta data
                    </div>
                  )}
                </div>

                {/* Informações sobre horários no modal */}
                {editDate && (
                  <div className={styles.scheduleInfo}>
                    <div className={styles.infoItem}>
                      <strong>Horário de funcionamento:</strong> 08:00 - 19:00 (Segunda a Sexta)
                    </div>
                    <div className={styles.infoItem}>
                      <strong>Pausa para almoço:</strong> 12:00 - 13:00
                    </div>
                    <div className={styles.infoItem}>
                      <strong>Intervalo entre agendamentos:</strong> 30 minutos
                    </div>
                    <div className={styles.infoItem}>
                      <strong>Horários disponíveis:</strong> {editAvailableSlots.length} opções
                    </div>
                  </div>
                )}
              </div>
              <div className={styles.modalActions}>
                <button 
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => {
                    setEditingAppointment(null);
                    setEditAvailableSlots([]);
                  }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className={styles.saveButton}
                  disabled={editLoading || !editDate || !editTime || editLoadingSlots}
                >
                  {editLoading ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className={styles.header}>
        <h1 className={styles.title}>Agendamento de Serviços</h1>
        <p className={styles.subtitle}>Gerencie seus agendamentos de forma simples e rápida</p>
      </div>

      <div className={styles.content}>
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Novo Agendamento</h2>
          <form className={styles.form} onSubmit={handleSchedule}>
            {/* Linha do Serviço*/}
            <div className={styles.serviceRow}>
              <label className={styles.label}>Serviço</label>
              <select
                className={styles.serviceSelect}
                value={service}
                onChange={e => setService(e.target.value)}
                required
                disabled={services.length === 0}
              >
                {services.length === 0 ? (
                  <option value="">Carregando serviços...</option>
                ) : (
                  <>
                    <option value="">Selecione um serviço</option>
                    {services.map(s => (
                      <option key={s._id} value={s.name}>
                        {s.icon} {s.name}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>
            
            {/* Linha de Data/Hora/Botão*/}
            <div className={styles.datetimeRow}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Data</label>
                <input
                  type="date"
                  className={styles.input}
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  disabled={services.length === 0}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  Horário
                  {loadingSlots && <span className={styles.loadingText}> (carregando...)</span>}
                </label>
                <select
                  className={styles.input}
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  required
                  disabled={!date || loadingSlots || services.length === 0}
                >
                  <option value="">Selecione um horário</option>
                  {availableSlots.map(slot => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
                {availableSlots.length === 0 && date && !loadingSlots && (
                  <div className={styles.warningText}>
                    Não há horários disponíveis para esta data
                  </div>
                )}
              </div>
              
              <button 
                className={styles.button} 
                type="submit"
                disabled={submitting || !date || !time || !service || loadingSlots || services.length === 0}
              >
                {submitting ? "⏳ Agendando..." : "✅ Agendar"}
              </button>
            </div>

            {/* Informações sobre horários */}
            {date && (
              <div className={styles.scheduleInfo}>
                <div className={styles.infoItem}>
                  <strong>Horário de funcionamento:</strong> 08:00 - 19:00 (Segunda a Sexta)
                </div>
                <div className={styles.infoItem}>
                  <strong>Pausa para almoço:</strong> 12:00 - 13:00
                </div>
                <div className={styles.infoItem}>
                  <strong>Intervalo entre agendamentos:</strong> 30 minutos
                </div>
                <div className={styles.infoItem}>
                  <strong>Horários disponíveis:</strong> {availableSlots.length} opções
                </div>
              </div>
            )}

            {/* Mensagem se não há serviços */}
            {services.length === 0 && (
              <div className={styles.warningMessage}>
                ⚠️ Nenhum serviço disponível para agendamento no momento.
              </div>
            )}
          </form>
        </div>

        <div className={styles.appointmentsSection}>
          <div className={styles.appointmentsHeader}>
            <h2 className={styles.appointmentsTitle}>Meus Agendamentos</h2>
            <div className={styles.appointmentsCount}>
              {appointments.length} {appointments.length === 1 ? 'agendamento' : 'agendamentos'}
            </div>
          </div>
          
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Carregando seus agendamentos...</p>
            </div>
          ) : (
            <ul className={styles.list}>
              {appointments.length === 0 ? (
                <li className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📅</div>
                  <h3>Nenhum agendamento encontrado</h3>
                  <p>Agende seu primeiro serviço usando o formulário acima</p>
                </li>
              ) : (
                appointments.map(appointment => (
                  <li key={appointment._id} className={styles.listItem}>
                    <div className={styles.appointmentInfo}>
                      <h3 className={styles.appointmentDate}>
                        {formatDate(appointment.date)} • {formatTime(appointment.date)}
                      </h3>
                      <p className={styles.appointmentService}>
                        {getServiceIcon(appointment.service)} {appointment.service}
                      </p>
                    </div>
                    <div className={styles.actionsContainer}>
                      <button
                        className={styles.editButton}
                        onClick={() => handleEdit(appointment)}
                      >
                        ✏️ Editar
                      </button>
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDelete(appointment._id)}
                      >
                        🗑️ Excluir
                      </button>
                    </div>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}