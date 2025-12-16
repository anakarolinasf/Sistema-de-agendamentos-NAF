import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../services/api";
import styles from "./ForgotPassword.module.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const result = await forgotPassword(email);
      if (result.error) {
        setError(result.error);
      } else {
        setMessage("Se o email existir, enviaremos instruções para resetar a senha");
        setEmail("");
      }
    } catch (err) {
      setError("Erro ao processar solicitação");
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
          <h1 className={styles.title}>Redefinir Senha</h1>
          <p className={styles.subtitle}>Digite seu email para receber instruções</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}
          
          {message && (
            <div className={styles.success}>
              {message}
            </div>
          )}

          <div className={styles.inputGroup}>
            <label className={styles.label}>Email</label>
            <input
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className={styles.button}
            disabled={loading || !email}
          >
            {loading ? "Enviando..." : "Enviar Instruções"}
          </button>
        </form>

        <div className={styles.footer}>
          <Link to="/login" className={styles.backLink}>
            ← Voltar para o Login
          </Link>
        </div>
      </div>
    </div>
  );
}