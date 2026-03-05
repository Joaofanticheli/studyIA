const Course = require('../models/Course');
const Progress = require('../models/Progress');
const User = require('../models/User');
const { detectarArea } = require('../utils/areaDetector');
const { gerarEstruturaCurso, gerarConteudoAula, gerarQuiz, extrairEstruturaDoTexto, corrigirDiscursiva, buscarVideoAula, gerarFlashcards } = require('../utils/courseGenerator');
const TEMPLATES = require('../data/templates');


const criarCurso = async (req, res) => {
  try {
    const { tema, nivel } = req.body;
    if (!tema || !tema.trim())
      return res.status(400).json({ message: 'Informe o tema do curso' });

    const area = detectarArea(tema);
    const estrutura = await gerarEstruturaCurso(tema, nivel || 'iniciante', area);

    const modulos = estrutura.modulos.map((mod, modIdx) => ({
      titulo: mod.titulo,
      ordem: modIdx,
      aulas: mod.aulas.map((aula, aulaIdx) => ({
        titulo: aula.titulo,
        ordem: aulaIdx,
        conteudo: '',
        conteudoGerado: false,
        quiz: [],
      })),
    }));

    const course = await Course.create({
      titulo: estrutura.titulo,
      descricao: estrutura.descricao,
      area,
      nivel: nivel || 'iniciante',
      emoji: estrutura.emoji || '📖',
      duracaoEstimada: estrutura.duracaoEstimada,
      criadoPor: req.user._id,
      geradoPorIA: true,
      modulos,
    });

    await Progress.create({ userId: req.user._id, courseId: course._id });

    res.status(201).json(course);
  } catch (err) {
    console.error('Erro ao criar curso:', err);
    res.status(500).json({ message: 'Erro ao gerar curso com IA', error: err.message });
  }
};

const getMeusCursos = async (req, res) => {
  try {
    const cursos = await Course.find({ criadoPor: req.user._id })
      .select('-modulos.aulas.conteudo -modulos.aulas.quiz')
      .sort('-createdAt');

    const progressos = await Progress.find({ userId: req.user._id });

    const cursosComProgresso = cursos.map((curso) => {
      const prog = progressos.find(
        (p) => p.courseId.toString() === curso._id.toString()
      );
      const totalAulas = curso.modulos.reduce((sum, m) => sum + m.aulas.length, 0);
      const aulasCompletas = prog ? prog.aulasCompletas.length : 0;
      return { ...curso.toObject(), progresso: { aulasCompletas, totalAulas } };
    });

    res.json(cursosComProgresso);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar cursos' });
  }
};

const getCurso = async (req, res) => {
  try {
    const curso = await Course.findOne({
      _id: req.params.id,
      criadoPor: req.user._id,
    }).select('-modulos.aulas.conteudo -modulos.aulas.quiz');

    if (!curso) return res.status(404).json({ message: 'Curso não encontrado' });

    const prog = await Progress.findOne({
      userId: req.user._id,
      courseId: curso._id,
    });

    res.json({ ...curso.toObject(), progresso: prog || { aulasCompletas: [] } });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar curso' });
  }
};

const getAula = async (req, res) => {
  try {
    const { id, moduloIdx, aulaIdx } = req.params;
    const curso = await Course.findOne({ _id: id, criadoPor: req.user._id });
    if (!curso) return res.status(404).json({ message: 'Curso não encontrado' });

    const modulo = curso.modulos[Number(moduloIdx)];
    if (!modulo) return res.status(404).json({ message: 'Módulo não encontrado' });

    const aula = modulo.aulas[Number(aulaIdx)];
    if (!aula) return res.status(404).json({ message: 'Aula não encontrada' });

    if (!aula.conteudoGerado || !aula.conteudo) {
      const conteudo = await gerarConteudoAula(
        curso.titulo, modulo.titulo, aula.titulo, curso.nivel, curso.area
      );
      const [quiz, videoInfo, flashcards] = await Promise.all([
        gerarQuiz(curso.titulo, aula.titulo, conteudo, curso.area),
        buscarVideoAula(curso.titulo, aula.titulo, conteudo),
        gerarFlashcards(curso.titulo, aula.titulo, conteudo, curso.area),
      ]);

      curso.modulos[Number(moduloIdx)].aulas[Number(aulaIdx)].conteudo = conteudo;
      curso.modulos[Number(moduloIdx)].aulas[Number(aulaIdx)].conteudoGerado = true;
      curso.modulos[Number(moduloIdx)].aulas[Number(aulaIdx)].quiz = quiz;
      curso.modulos[Number(moduloIdx)].aulas[Number(aulaIdx)].flashcards = flashcards;
      curso.modulos[Number(moduloIdx)].aulas[Number(aulaIdx)].flashcardsGerados = true;
      if (videoInfo) {
        curso.modulos[Number(moduloIdx)].aulas[Number(aulaIdx)].videoId = videoInfo.videoId;
        curso.modulos[Number(moduloIdx)].aulas[Number(aulaIdx)].videoTitulo = videoInfo.videoTitulo;
      }
      await curso.save();
    } else if (!aula.flashcardsGerados || !aula.flashcards?.length) {
      const flashcards = await gerarFlashcards(curso.titulo, aula.titulo, aula.conteudo, curso.area);
      curso.modulos[Number(moduloIdx)].aulas[Number(aulaIdx)].flashcards = flashcards;
      curso.modulos[Number(moduloIdx)].aulas[Number(aulaIdx)].flashcardsGerados = true;
      await curso.save();
    }

    const prog = await Progress.findOne({ userId: req.user._id, courseId: curso._id });
    const aulaId = `${moduloIdx}-${aulaIdx}`;

    res.json({
      aula: curso.modulos[Number(moduloIdx)].aulas[Number(aulaIdx)],
      moduloTitulo: modulo.titulo,
      cursoTitulo: curso.titulo,
      area: curso.area,
      aulaConcluida: prog ? prog.aulasCompletas.includes(aulaId) : false,
      aulaId,
    });
  } catch (err) {
    console.error('Erro ao carregar aula:', err);
    res.status(500).json({ message: 'Erro ao carregar aula', error: err.message });
  }
};

const concluirAula = async (req, res) => {
  try {
    const { id, moduloIdx, aulaIdx } = req.params;
    const { acertos, total } = req.body;
    const aulaId = `${moduloIdx}-${aulaIdx}`;

    let prog = await Progress.findOne({ userId: req.user._id, courseId: id });
    if (!prog) prog = new Progress({ userId: req.user._id, courseId: id });

    if (!prog.aulasCompletas.includes(aulaId)) {
      prog.aulasCompletas.push(aulaId);
    }

    if (acertos !== undefined) {
      const existing = prog.pontuacoes.findIndex(
        (p) => p.moduloIdx === Number(moduloIdx) && p.aulaIdx === Number(aulaIdx)
      );
      const pontuacao = {
        moduloIdx: Number(moduloIdx),
        aulaIdx: Number(aulaIdx),
        acertos,
        total,
      };
      if (existing >= 0) prog.pontuacoes[existing] = pontuacao;
      else prog.pontuacoes.push(pontuacao);
    }

    await prog.save();

    // Atualizar streak do usuário
    let streakAtual = 0;
    try {
      const userDoc = await User.findById(req.user._id);
      const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
      if (userDoc.ultimoEstudo) {
        const ultimo = new Date(userDoc.ultimoEstudo); ultimo.setHours(0, 0, 0, 0);
        const ontem = new Date(hoje); ontem.setDate(ontem.getDate() - 1);
        if (ultimo.getTime() === hoje.getTime()) {
          streakAtual = userDoc.streak || 0;
        } else if (ultimo.getTime() === ontem.getTime()) {
          streakAtual = (userDoc.streak || 0) + 1;
          userDoc.streak = streakAtual; userDoc.ultimoEstudo = hoje; await userDoc.save();
        } else {
          streakAtual = 1;
          userDoc.streak = 1; userDoc.ultimoEstudo = hoje; await userDoc.save();
        }
      } else {
        streakAtual = 1;
        userDoc.streak = 1; userDoc.ultimoEstudo = hoje; await userDoc.save();
      }
    } catch {}

    res.json({ message: 'Aula concluída!', progresso: prog, streak: streakAtual });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao concluir aula' });
  }
};

const criarCursoDoTexto = async (req, res) => {
  try {
    const { texto, nivel } = req.body;
    if (!texto || !texto.trim()) return res.status(400).json({ message: 'Cole o texto do seu curso' });

    const estrutura = await extrairEstruturaDoTexto(texto);
    const area = detectarArea(estrutura.titulo);

    const modulosFormatados = estrutura.modulos.map((mod, modIdx) => ({
      titulo: mod.titulo,
      ordem: modIdx,
      aulas: mod.aulas.map((aula, aulaIdx) => ({
        titulo: aula.titulo,
        ordem: aulaIdx,
        conteudo: '',
        conteudoGerado: false,
        quiz: [],
      })),
    }));

    const course = await Course.create({
      titulo: estrutura.titulo,
      descricao: `Curso criado a partir de conteúdo colado. ${estrutura.modulos.length} módulos gerados pela IA.`,
      area,
      nivel: nivel || 'iniciante',
      emoji: '📝',
      duracaoEstimada: null,
      criadoPor: req.user._id,
      geradoPorIA: true,
      modulos: modulosFormatados,
    });

    await Progress.create({ userId: req.user._id, courseId: course._id });

    res.status(201).json(course);
  } catch (err) {
    console.error('Erro ao criar curso do texto:', err);
    res.status(500).json({ message: 'Erro ao processar texto', error: err.message });
  }
};

const criarCursoCustom = async (req, res) => {
  try {
    const { tema, nivel, modulos } = req.body;
    if (!tema || !tema.trim()) return res.status(400).json({ message: 'Informe o título do curso' });
    if (!modulos || !modulos.length) return res.status(400).json({ message: 'Adicione pelo menos um módulo' });

    const area = detectarArea(tema);

    const modulosFormatados = modulos.map((mod, modIdx) => ({
      titulo: mod.titulo,
      ordem: modIdx,
      aulas: mod.aulas.map((aula, aulaIdx) => ({
        titulo: aula.titulo,
        ordem: aulaIdx,
        conteudo: '',
        conteudoGerado: false,
        quiz: [],
      })),
    }));

    const totalAulas = modulosFormatados.reduce((sum, m) => sum + m.aulas.length, 0);

    const course = await Course.create({
      titulo: tema.trim(),
      descricao: `Curso personalizado com ${modulos.length} módulo${modulos.length !== 1 ? 's' : ''} e ${totalAulas} aula${totalAulas !== 1 ? 's' : ''}.`,
      area,
      nivel: nivel || 'iniciante',
      emoji: '📋',
      duracaoEstimada: null,
      criadoPor: req.user._id,
      geradoPorIA: false,
      modulos: modulosFormatados,
    });

    await Progress.create({ userId: req.user._id, courseId: course._id });

    res.status(201).json(course);
  } catch (err) {
    console.error('Erro ao criar curso customizado:', err);
    res.status(500).json({ message: 'Erro ao criar curso', error: err.message });
  }
};

const deletarCurso = async (req, res) => {
  try {
    const curso = await Course.findOneAndDelete({ _id: req.params.id, criadoPor: req.user._id });
    if (!curso) return res.status(404).json({ message: 'Curso não encontrado' });
    await Progress.deleteMany({ courseId: req.params.id });
    res.json({ message: 'Curso deletado' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao deletar curso' });
  }
};

const regenerarVideo = async (req, res) => {
  try {
    const { id, moduloIdx, aulaIdx } = req.params;
    const curso = await Course.findOne({ _id: id, criadoPor: req.user._id });
    if (!curso) return res.status(404).json({ message: 'Curso não encontrado' });

    const aula = curso.modulos[Number(moduloIdx)]?.aulas[Number(aulaIdx)];
    if (!aula?.conteudo) return res.status(400).json({ message: 'Aula ainda não tem conteúdo gerado' });

    const videoInfo = await buscarVideoAula(curso.titulo, aula.titulo, aula.conteudo);

    curso.modulos[Number(moduloIdx)].aulas[Number(aulaIdx)].videoId    = videoInfo?.videoId    || null;
    curso.modulos[Number(moduloIdx)].aulas[Number(aulaIdx)].videoTitulo = videoInfo?.videoTitulo || null;
    await curso.save();

    res.json({ videoId: videoInfo?.videoId || null, videoTitulo: videoInfo?.videoTitulo || null });
  } catch (err) {
    console.error('Erro ao regenerar vídeo:', err);
    res.status(500).json({ message: 'Erro ao buscar vídeo', error: err.message });
  }
};

const regenerarQuiz = async (req, res) => {
  try {
    const { id, moduloIdx, aulaIdx } = req.params;
    const curso = await Course.findOne({ _id: id, criadoPor: req.user._id });
    if (!curso) return res.status(404).json({ message: 'Curso não encontrado' });

    const aula = curso.modulos[Number(moduloIdx)]?.aulas[Number(aulaIdx)];
    if (!aula) return res.status(404).json({ message: 'Aula não encontrada' });
    if (!aula.conteudo) return res.status(400).json({ message: 'Aula ainda não tem conteúdo gerado' });

    const novoQuiz = await gerarQuiz(curso.titulo, aula.titulo, aula.conteudo, curso.area);
    curso.modulos[Number(moduloIdx)].aulas[Number(aulaIdx)].quiz = novoQuiz;
    await curso.save();

    res.json({ quiz: novoQuiz });
  } catch (err) {
    console.error('Erro ao regenerar quiz:', err);
    res.status(500).json({ message: 'Erro ao regenerar quiz', error: err.message });
  }
};

const avaliarDiscursiva = async (req, res) => {
  try {
    const { pergunta, respostaEsperada, respostaAluno } = req.body;
    if (!pergunta || !respostaAluno?.trim())
      return res.status(400).json({ message: 'Dados insuficientes para correção' });

    const resultado = await corrigirDiscursiva(pergunta, respostaEsperada, respostaAluno);
    res.json(resultado);
  } catch (err) {
    console.error('Erro ao corrigir discursiva:', err);
    res.status(500).json({ message: 'Erro ao corrigir resposta', error: err.message });
  }
};

const getSugestao = async (req, res) => {
  try {
    const curso = await Course.findOne({ _id: req.params.id, criadoPor: req.user._id })
      .select('area nivel templateId');
    if (!curso) return res.status(404).json({ message: 'Curso não encontrado' });

    const nivelOrder = ['iniciante', 'intermediario', 'avancado'];
    const currentNivelIdx = nivelOrder.indexOf(curso.nivel);

    // 1. Mesma área, nível mais avançado
    let sugestao = TEMPLATES.find(t =>
      t.area === curso.area &&
      t.id !== curso.templateId &&
      nivelOrder.indexOf(t.nivel) > currentNivelIdx
    );
    // 2. Mesma área, qualquer nível
    if (!sugestao) {
      sugestao = TEMPLATES.find(t => t.area === curso.area && t.id !== curso.templateId);
    }
    // 3. Área complementar
    if (!sugestao) {
      const complementary = {
        tecnologia: ['ciencias', 'negocios'], idiomas: ['humanas', 'negocios'],
        negocios: ['tecnologia', 'idiomas'], saude: ['ciencias', 'humanas'],
        humanas: ['artes', 'idiomas'], ciencias: ['tecnologia', 'saude'],
        artes: ['humanas', 'tecnologia'], geral: ['tecnologia', 'humanas'],
      };
      for (const area of (complementary[curso.area] || [])) {
        sugestao = TEMPLATES.find(t => t.area === area && t.nivel === 'iniciante');
        if (sugestao) break;
      }
    }

    if (!sugestao) return res.json(null);
    res.json({
      id: sugestao.id, titulo: sugestao.titulo, descricao: sugestao.descricao,
      area: sugestao.area, nivel: sugestao.nivel, emoji: sugestao.emoji,
      duracaoEstimada: sugestao.duracaoEstimada,
      totalAulas: sugestao.modulos.reduce((sum, m) => sum + m.aulas.length, 0),
    });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar sugestão' });
  }
};

const getTemplates = (req, res) => {
  res.json(TEMPLATES.map(({ id, titulo, descricao, area, nivel, emoji, duracaoEstimada, modulos }) => ({
    id, titulo, descricao, area, nivel, emoji, duracaoEstimada,
    totalModulos: modulos.length,
    totalAulas: modulos.reduce((sum, m) => sum + m.aulas.length, 0),
  })));
};

const criarCursoDoTemplate = async (req, res) => {
  try {
    const template = TEMPLATES.find(t => t.id === req.params.templateId);
    if (!template) return res.status(404).json({ message: 'Template não encontrado' });

    const jaExiste = await Course.findOne({ criadoPor: req.user._id, templateId: template.id });
    if (jaExiste) return res.status(400).json({ message: 'Você já tem este curso na sua biblioteca', courseId: jaExiste._id });

    const modulos = template.modulos.map((mod, modIdx) => ({
      titulo: mod.titulo,
      ordem: modIdx,
      aulas: mod.aulas.map((aula, aulaIdx) => ({
        titulo: aula.titulo,
        ordem: aulaIdx,
        conteudo: '',
        conteudoGerado: false,
        quiz: [],
      })),
    }));

    const course = await Course.create({
      titulo: template.titulo,
      descricao: template.descricao,
      area: template.area,
      nivel: template.nivel,
      emoji: template.emoji,
      duracaoEstimada: template.duracaoEstimada,
      criadoPor: req.user._id,
      geradoPorIA: true,
      templateId: template.id,
      modulos,
    });

    await Progress.create({ userId: req.user._id, courseId: course._id });
    res.status(201).json(course);
  } catch (err) {
    console.error('Erro ao criar curso do template:', err);
    res.status(500).json({ message: 'Erro ao criar curso', error: err.message });
  }
};

module.exports = { criarCurso, criarCursoCustom, criarCursoDoTexto, getMeusCursos, getCurso, getAula, concluirAula, deletarCurso, avaliarDiscursiva, regenerarQuiz, regenerarVideo, getTemplates, criarCursoDoTemplate, getSugestao };
