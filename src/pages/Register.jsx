import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { registerUser } from "../services/api";
import styles from "./Register.module.css";

export default function Register() {
  const { login } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, text: "Fraca", color: "#e53e3e" };
    
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;

    const strengthInfo = {
      0: { text: "Muito Fraca", color: "#e53e3e" },
      25: { text: "Fraca", color: "#ed8936" },
      50: { text: "Média", color: "#ecc94b" },
      75: { text: "Forte", color: "#48bb78" },
      100: { text: "Muito Forte", color: "#38a169" }
    };

    return {
      strength,
      ...strengthInfo[Math.floor(strength / 25) * 25]
    };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Por favor, informe seu nome");
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError("As senhas não coincidem");
      return false;
    }
    
    if (formData.password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return false;
    }
    
    return true;
  };

  const handleRegister = async (e) => {
  e.preventDefault();
  setError("");

  if (!validateForm()) return;

  setLoading(true);

  try {
    const res = await registerUser(formData.name, formData.email, formData.password);
    if (res.token) {
      // ✅ CORREÇÃO: Passa email e password como strings separadas
      await login(formData.email, formData.password);
      navigate("/schedule");
    } else {
      setError(res.error || "Erro ao criar conta");
    }
  } catch (err) {
    setError("Erro de conexão. Tente novamente.");
  } finally {
    setLoading(false);
  }
};

  const checkRequirement = (test, text) => {
    const met = test(formData.password);
    return (
      <li className={`${styles.requirement} ${met ? styles.met : ''}`}>
        <span className={styles.requirementIcon}>
          {met ? "✓" : "○"}
        </span>
        {text}
      </li>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <span>👤</span>
          </div>
          <h1 className={styles.title}>Criar Conta</h1>
          <p className={styles.subtitle}>Junte-se a nós hoje mesmo</p>
        </div>

        <form className={`${styles.form} ${loading ? styles.loading : ''}`} onSubmit={handleRegister}>
          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}
          
          <div className={styles.inputGroup}>
            <input
              type="text"
              name="name"
              placeholder="Seu nome completo"
              value={formData.name}
              onChange={handleChange}
              required
              className={styles.input}
              disabled={loading}
            />
            <span className={styles.inputIcon}>👤</span>
          </div>

          <div className={styles.inputGroup}>
            <input
              type="email"
              name="email"
              placeholder="Seu email"
              value={formData.email}
              onChange={handleChange}
              required
              className={styles.input}
              disabled={loading}
            />
            <span className={styles.inputIcon}>📧</span>
          </div>

          <div className={styles.inputGroup}>
            <input
              type="password"
              name="password"
              placeholder="Crie uma senha"
              value={formData.password}
              onChange={handleChange}
              required
              className={styles.input}
              disabled={loading}
            />
            <span className={styles.inputIcon}>🔒</span>
          </div>

          {formData.password && (
            <div className={styles.passwordStrength}>
              <div className={styles.strengthBar}>
                <div 
                  className={styles.strengthFill}
                  style={{
                    width: `${passwordStrength.strength}%`,
                    backgroundColor: passwordStrength.color
                  }}
                />
              </div>
              <p className={styles.strengthText}>
                Força da senha: {passwordStrength.text}
              </p>
              
              <div className={styles.requirements}>
                <h4 className={styles.requirementsTitle}>Requisitos:</h4>
                <ul className={styles.requirementList}>
                  {checkRequirement(pwd => pwd.length >= 8, "Pelo menos 8 caracteres")}
                  {checkRequirement(pwd => /[A-Z]/.test(pwd), "Pelo menos uma letra maiúscula")}
                  {checkRequirement(pwd => /[0-9]/.test(pwd), "Pelo menos um número")}
                  {checkRequirement(pwd => /[^A-Za-z0-9]/.test(pwd), "Pelo menos um caractere especial")}
                </ul>
              </div>
            </div>
          )}

          <div className={styles.inputGroup}>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirme sua senha"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className={styles.input}
              disabled={loading}
            />
            <span className={styles.inputIcon}>✅</span>
          </div>

          <button 
            type="submit" 
            className={styles.button}
            disabled={loading}
          >
            {loading ? "Criando Conta..." : "Criar Minha Conta"}
          </button>
        </form>

        <div className={styles.loginSection}>
          <p className={styles.loginText}>
            Já tem uma conta?
          </p>
          <Link to="/login" className={styles.loginButton}>
            Fazer Login
          </Link>
        </div>

        
      </div>
    </div>
  );
}