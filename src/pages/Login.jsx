import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { loginUser } from "../services/api";
import styles from "./Login.module.css";

export default function Login() {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // ✅ Chama a função login do contexto passando email e password como strings
      const result = await login(email, password);
      
      if (result.token) {      
        // REDIRECIONAMENTO BASEADO NO ROLE
        if (result.role === 'admin') {
          navigate("/admin");
        } else {
          navigate("/schedule");
        }
      } else {
        setError(result.error || "Erro ao fazer login");
      }
    } catch (err) {
      setError(err.message || "Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <span>🔐</span>
          </div>
          <h1 className={styles.title}>Bem-vindo</h1>
          <p className={styles.subtitle}>Faça login em sua conta</p>
        </div>

        <form className={`${styles.form} ${loading ? styles.loading : ''}`} onSubmit={handleLogin}>
          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}
          
          <div className={styles.inputGroup}>
            <input
              type="email"
              placeholder="Seu email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className={styles.input}
              disabled={loading}
            />
            <span className={styles.inputIcon}>📧</span>
          </div>

          <div className={styles.inputGroup}>
            <input
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className={styles.input}
              disabled={loading}
            />
            <span className={styles.inputIcon}>🔒</span>
          </div>

          <button 
            type="submit" 
            className={styles.button}
            disabled={loading}
          >
            {loading ? "Entrando..." : "Entrar na Conta"}
          </button>
        </form>

          <div className={styles.forgotPassword}>
            <Link to="/forgot-password" className={styles.forgotLink}>
              {/* Adicione um ícone se usar as opções com ícone */}
              <span>🔒</span>
              Esqueci minha senha
            </Link>
          </div>
        <div className={styles.registerSection}>
          <p className={styles.registerText}>
            Ainda não tem uma conta?
          </p>
          <Link to="/register" className={styles.registerButton}>
            Criar Conta Gratuita
          </Link>
        </div>
      </div>
    </div>
  );
}