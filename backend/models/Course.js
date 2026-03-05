const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  tipo: { type: String, enum: ['multipla_escolha', 'verdadeiro_falso', 'discursiva'], default: 'multipla_escolha' },
  pergunta: String,
  opcoes: [String],
  correta: { type: Number, default: null },
  explicacao: String,
  respostaEsperada: String,
});

const flashcardSchema = new mongoose.Schema({
  frente: String,
  verso: String,
});

const lessonSchema = new mongoose.Schema({
  titulo: String,
  ordem: Number,
  conteudo: { type: String, default: '' },
  conteudoGerado: { type: Boolean, default: false },
  quiz: [quizSchema],
  videoId: { type: String, default: null },
  videoTitulo: { type: String, default: null },
  flashcards: [flashcardSchema],
  flashcardsGerados: { type: Boolean, default: false },
});

const moduleSchema = new mongoose.Schema({
  titulo: String,
  ordem: Number,
  aulas: [lessonSchema],
});

const courseSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  descricao: String,
  area: {
    type: String,
    enum: ['tecnologia', 'ciencias', 'humanas', 'idiomas', 'negocios', 'artes', 'saude', 'geral'],
    default: 'geral',
  },
  nivel: {
    type: String,
    enum: ['iniciante', 'intermediario', 'avancado'],
    default: 'iniciante',
  },
  emoji: { type: String, default: '📖' },
  duracaoEstimada: String,
  criadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  geradoPorIA: { type: Boolean, default: true },
  templateId: { type: String, default: null },
  modulos: [moduleSchema],
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);
