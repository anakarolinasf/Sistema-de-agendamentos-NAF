require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/auth");
const appointmentRoutes = require("./routes/appointments");
const serviceRoutes = require("./routes/services");

const app = express();

// Middlewares
app.use(cors({
  origin: "*", // Em produção você pode restringir para o domínio do frontend
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// Rotas da API
app.use("/api/auth", authRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/services", serviceRoutes);

// Rota de teste (opcional, mas útil para verificar se está online)
app.get("/api/status", (req, res) => {
  res.json({ status: "Servidor NAF online ✅" });
});

// Conexão com MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Atlas conectado com sucesso"))
  .catch(err => console.error("❌ Erro ao conectar MongoDB:", err));

// Porta compatível com Render e ambiente local
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
