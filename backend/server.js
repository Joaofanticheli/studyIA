require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
connectDB();

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/chat', require('./routes/chat'));
app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'StudyIA' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🧠 StudyIA backend rodando na porta ${PORT}`));
