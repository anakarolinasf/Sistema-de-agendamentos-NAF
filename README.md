# NAF – Sistema de Agendamentos 

Sistema web para **agendamento de atendimentos contábeis e fiscais** do **NAF (Núcleo de Apoio Contábil e Fiscal) da Universidade de Fortaleza – UNIFOR**.

O projeto foi desenvolvido como **projeto acadêmico**, contemplando **frontend e backend**, com foco em usabilidade, segurança e organização do fluxo de atendimentos.

---

## Visão Geral

* **Frontend:** React + Vite
* **Backend:** Node.js + Express
* **Banco de Dados:** MongoDB (Mongoose)
* **Objetivo:**

  * Permitir que usuários realizem cadastro, login e agendamento de serviços
  * Disponibilizar horários e tipos de serviços
  * Oferecer um **painel administrativo** para gerenciamento de agendamentos, serviços e relatórios

---

## 🎯 Público-alvo

* Comunidade externa que busca atendimento gratuito no NAF
* Alunos da UNIFOR responsáveis pelos atendimentos supervisionados
* Administradores e coordenadores do NAF

---

## 🚀 Tecnologias Utilizadas

### Frontend

* React
* Vite
* JavaScript
* HTML5
* CSS3

### Backend

* Node.js
* Express.js
* MongoDB (Mongoose)
* JWT (autenticação e autorização)
* Nodemailer (envio de e-mails)

### Outros

* Git e GitHub (versionamento)

---

## 📁 Estrutura do Repositório

```
Agendamentos-Naf/
├── public/              # Arquivos públicos do frontend
├── src/                 # Código do frontend (React)
│   ├── assets/
│   ├── components/
│   ├── pages/
│   ├── App.jsx
│   └── main.jsx
├── backend/             # API REST (Express)
│   ├── controllers/     # Lógica dos endpoints
│   ├── routes/          # Rotas da API
│   ├── models/          # Schemas Mongoose
│   ├── scripts/         # Scripts auxiliares (ex: seedServices.js)
│   ├── server.js
│   └── .env
└── README.md
```

---

## ⚙️ Pré-requisitos

* Node.js >= 16
* npm ou yarn
* MongoDB local ou MongoDB Atlas

---

## 🛠️ Configuração e Execução (Local)

### 1️⃣ Clonar o repositório

```bash
git clone <repo-url>
cd Agendamentos-Naf
```

---

### 2️⃣ Frontend

```bash
npm install
npm run dev
# ou
yarn
yarn dev
```

* URL padrão do frontend:

```
http://localhost:5173
```

**Variável de ambiente opcional (frontend):**

```
VITE_API_URL=http://localhost:5000/api
```

---

### 3️⃣ Backend

```bash
cd backend
npm install
node server.js
# ou, em desenvolvimento
npx nodemon server.js
```

**Variáveis de ambiente (`backend/.env`):**

```
MONGO_URI=sua_string_de_conexao_mongodb
PORT=5000
JWT_SECRET=chave_secreta
EMAIL_USER=email_para_envio
EMAIL_PASS=senha_ou_token_do_email
SUPPORT_EMAIL=email_de_suporte
FRONTEND_URL=http://localhost:5173
```

> Observação: scripts auxiliares utilizam o `.env` dentro da pasta `backend`.

---

### 4️⃣ Popular serviços iniciais

```bash
cd backend
node scripts/seedServices.js
```

---

## 🧭 Funcionalidades Principais

### 👤 Usuário

* Cadastro e autenticação
* Recuperação de senha por e-mail
* Agendamento de serviços
* Visualização de horários disponíveis
* Consulta aos próprios agendamentos

### 🛠️ Administrador

* Painel administrativo
* Gerenciamento de serviços
* Edição e exclusão de agendamentos
* Criação de agendamentos administrativos
* Geração de relatórios
* Acompanhamento do histórico de atendimentos

---

## 🔐 Como tornar um usuário administrador

No banco de dados, altere o campo `role` do usuário para:

```
role: "admin"
```

---

## 🐛 Troubleshooting

* **Erro de conexão com MongoDB:** verifique `MONGO_URI` e liberação de IP no Atlas
* **E-mails não enviados:** confirme credenciais e uso de token do provedor
* **Erro de CORS ou API:** confira `VITE_API_URL` e se o backend está rodando

---

## 👩‍💻 Equipe do Projeto

* **Arthur Fraga Mota** — Gerente de Projetos
* **Noah Gabriel Urano Siqueira** — Back-end
* **Lídia Araújo e Silva** — Front-end
* **Ana Karolina Silva Ferreira** — Design UX/UI
* **Pedro Roger Silveira Veras** — Desenvolvimento

---

## 🎓 Contexto Acadêmico

Projeto desenvolvido para a disciplina de Engenharia de Software / Sistemas Web da **Universidade de Fortaleza (UNIFOR)**, com prazo final de entrega em **26 de novembro de 2025**.

---

## 📄 Licença

Sugerida: **MIT** (adicione o arquivo `LICENSE` se desejar).

---


