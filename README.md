# 🧠 StudyIA

Plataforma de aprendizado com inteligência artificial. Crie cursos personalizados, aprenda com professores IA especializados e acompanhe seu progresso.

## ✨ Funcionalidades

- **Criação de cursos com IA** — descreva o que quer aprender e a IA monta a estrutura completa
- **Conteúdo gerado sob demanda** — cada aula é gerada pela IA no momento que você abre
- **Professores IA especializados** — cada área tem um instrutor com persona própria (tecnologia, idiomas, negócios, saúde, etc.)
- **Quiz por aula** — perguntas geradas automaticamente para fixar o conteúdo
- **Flashcards com repetição espaçada** — cards para memorização com sistema Difícil/Bom/Fácil
- **Chat com instrutor** — tire dúvidas com o professor IA baseado no conteúdo da aula
- **Streak de estudos** — acompanhe sua sequência diária de estudos
- **Certificado de conclusão** — gerado automaticamente ao completar 100% do curso
- **Sugestão de próximo curso** — recomendação inteligente ao finalizar um curso
- **Biblioteca de templates** — 30+ cursos prontos para começar imediatamente
- **Recuperação de senha** — via email (Brevo)

## 🛠️ Tecnologias

**Frontend**
- React
- Axios
- Web Speech API (pronúncia para idiomas)

**Backend**
- Node.js + Express
- MongoDB Atlas + Mongoose
- JWT (autenticação)
- Groq API — modelo `llama-3.3-70b-versatile`
- Brevo (envio de emails)

## 🌐 Deploy

- **Frontend:** [Vercel](https://vercel.com) — root directory: `frontend`
- **Backend:** [Render](https://render.com) — root directory: `backend`, start command: `npm start`

### Variáveis de ambiente no Render

| Variável | Descrição |
|---|---|
| `MONGO_URI` | URI do MongoDB Atlas |
| `JWT_SECRET` | Chave secreta para JWT |
| `GROQ_API_KEY` | Chave da API Groq |
| `BREVO_API_KEY` | Chave da API Brevo |
| `BREVO_SENDER_EMAIL` | Email remetente cadastrado no Brevo |
| `FRONTEND_URL` | URL do frontend em produção |

### Variáveis de ambiente no Vercel

| Variável | Descrição |
|---|---|
| `REACT_APP_API_URL` | URL do backend no Render + `/api` |

## 📁 Estrutura do projeto

```
StudyIA/
├── backend/
│   ├── config/        # Conexão com banco de dados
│   ├── controllers/   # Lógica das rotas
│   ├── data/          # Templates de cursos
│   ├── middleware/     # Autenticação JWT
│   ├── models/        # Schemas do MongoDB
│   ├── routes/        # Definição das rotas
│   └── utils/         # Gerador de conteúdo, flashcards, instrutores
└── frontend/
    └── src/
        ├── components/ # Navbar, Flashcards
        ├── context/    # AuthContext
        ├── pages/      # Dashboard, CoursePage, LessonPage, etc.
        └── services/   # Configuração do Axios
```
