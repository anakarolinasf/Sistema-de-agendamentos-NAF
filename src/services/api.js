const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Função auxiliar para verificar se a resposta é JSON
const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  
  // Se não for JSON, lança erro
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    throw new Error(`Servidor retornou HTML em vez de JSON. Verifique se a API está funcionando.`);
  }
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || `Erro ${response.status}`);
  }
  
  return data;
};

// Registro (ATUALIZADA com nome)
export const registerUser = async (name, email, password) => {
  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    return await handleResponse(res);
  } catch (error) {
    console.error("Erro no registerUser:", error);
    return { error: error.message };
  }
};

export const loginUser = async (email, password) => {
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return await handleResponse(res);
  } catch (error) {
    console.error("Erro no loginUser:", error);
    return { error: error.message };
  }
};

export const createAppointment = async (token, service, date, time) => {
  try {
    console.log("Enviando para API:", { service, date, time });
    
    const res = await fetch(`${API_URL}/appointments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ service, date, time }),
    });
    
    return await handleResponse(res);
  } catch (error) {
    console.error("Erro no createAppointment:", error);
    return { error: error.message };
  }
};

export const getAppointments = async (token) => {
  try {
    const res = await fetch(`${API_URL}/appointments`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return await handleResponse(res);
  } catch (error) {
    console.error("Erro no getAppointments:", error);
    return { error: error.message };
  }
};

export const deleteAppointment = async (token, id) => {
  try {
    const res = await fetch(`${API_URL}/appointments/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    return await handleResponse(res);
  } catch (error) {
    console.error("Erro no deleteAppointment:", error);
    return { error: error.message };
  }
};

export const updateAppointment = async (token, id, service, date, time) => {
  try {
    const res = await fetch(`${API_URL}/appointments/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ service, date, time }),
    });
    return await handleResponse(res);
  } catch (error) {
    console.error("Erro no updateAppointment:", error);
    return { error: error.message };
  }
};

export const getAllAppointments = async (token) => {
  try {
    const res = await fetch(`${API_URL}/appointments/all`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return await handleResponse(res);
  } catch (error) {
    console.error("Erro no getAllAppointments:", error);
    return { error: error.message };
  }
};

export const createAppointmentAsAdmin = async (token, service, date, time, userEmail) => {
  try {
    console.log("📤 Enviando para API admin-create:", { service, date, time, userEmail });
    
    const res = await fetch(`${API_URL}/appointments/admin-create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ service, date, time, userEmail }),
    });
    
    console.log("📥 Resposta da API - Status:", res.status);
    
    return await handleResponse(res);
  } catch (error) {
    console.error("❌ Erro no createAppointmentAsAdmin:", error);
    return { error: error.message };
  }
};

export const forgotPassword = async (email) => {
  try {
    const res = await fetch(`${API_URL}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    return await handleResponse(res);
  } catch (error) {
    console.error("Erro no forgotPassword:", error);
    return { error: error.message };
  }
};

export const resetPassword = async (token, password) => {
  try {
    const res = await fetch(`${API_URL}/auth/reset-password/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    return await handleResponse(res);
  } catch (error) {
    console.error("Erro no resetPassword:", error);
    return { error: error.message };
  }
};

export const getAvailableSlots = async (token, date) => {
  try {
    const res = await fetch(`${API_URL}/appointments/available-slots?date=${date}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return await handleResponse(res);
  } catch (error) {
    console.error("Erro no getAvailableSlots:", error);
    return { error: error.message };
  }
};

// Encerrar agendamento (concluir serviço)
export const completeAppointment = async (token, id) => {
  try {
    const res = await fetch(`${API_URL}/appointments/${id}/complete`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    return await handleResponse(res);
  } catch (error) {
    console.error("Erro no completeAppointment:", error);
    return { error: error.message };
  }
};

// ATUALIZADA: Buscar relatório do backend com opção de download
export const getReport = async (token, type = 'all', download = false) => {
  try {
    const url = `${API_URL}/appointments/report?type=${type}&download=${download}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || `Erro ${res.status}`);
    }
    
    // Retorna o HTML do relatório
    return await res.text();
    
  } catch (error) {
    console.error("Erro no getReport:", error);
    return { error: error.message };
  }
};

// Serviços
export const getServices = async () => {
  try {
    const res = await fetch(`${API_URL}/services`);
    return await handleResponse(res);
  } catch (error) {
    console.error("Erro no getServices:", error);
    return { error: error.message };
  }
};

export const createService = async (token, name, icon) => {
  try {
    const res = await fetch(`${API_URL}/services`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, icon }),
    });
    return await handleResponse(res);
  } catch (error) {
    console.error("Erro no createService:", error);
    return { error: error.message };
  }
};

export const updateService = async (token, id, name, icon, isActive) => {
  try {
    const res = await fetch(`${API_URL}/services/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, icon, isActive }),
    });
    return await handleResponse(res);
  } catch (error) {
    console.error("Erro no updateService:", error);
    return { error: error.message };
  }
};

export const deleteService = async (token, id) => {
  try {
    const res = await fetch(`${API_URL}/services/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return await handleResponse(res);
  } catch (error) {
    console.error("Erro no deleteService:", error);
    return { error: error.message };
  }
};
