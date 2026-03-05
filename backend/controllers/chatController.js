const Groq = require('groq-sdk');
const Course = require('../models/Course');
const { INSTRUTORES } = require('../utils/instructors');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const chat = async (req, res) => {
  try {
    const { mensagem, historico, courseId, aulaTitulo, aulaConteudo } = req.body;
    if (!mensagem) return res.status(400).json({ message: 'Mensagem vazia' });

    let area = 'geral';
    let cursoTitulo = '';

    if (courseId) {
      const curso = await Course.findById(courseId).select('area titulo');
      if (curso) {
        area = curso.area;
        cursoTitulo = curso.titulo;
      }
    }

    const instrutor = INSTRUTORES[area] || INSTRUTORES.geral;

    const conteudoContexto = aulaConteudo
      ? `\n\nCONTEÚDO DA AULA (use como referência principal para responder dúvidas):\n${aulaConteudo.substring(0, 3000)}`
      : '';

    const systemPrompt = `${instrutor.persona}

Você está ajudando um aluno${cursoTitulo ? ` no curso "${cursoTitulo}"` : ''}${aulaTitulo ? `, na aula "${aulaTitulo}"` : ''}.

INSTRUÇÕES:
- Responda em português do Brasil, de forma clara, didática e motivadora
- Use o conteúdo da aula como base quando a pergunta for relacionada ao tema
- Respostas podem ter entre 1 parágrafo (dúvidas simples) e 4 parágrafos (conceitos complexos)
- Use **negrito** para termos importantes e \`código\` para exemplos técnicos quando relevante
- Se a dúvida for totalmente fora do escopo do curso, responda brevemente e redirecione
- Nunca diga "como mencionado no conteúdo" — responda diretamente${conteudoContexto}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(historico || []).slice(-8),
      { role: 'user', content: mensagem },
    ];

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.65,
      max_tokens: 1000,
    });

    res.json({ resposta: response.choices[0].message.content });
  } catch (err) {
    console.error('Erro no chat:', err);
    res.status(500).json({ message: 'Erro ao processar mensagem' });
  }
};

module.exports = { chat };
