const Groq = require('groq-sdk');
const ytsr = require('ytsr');
const { INSTRUTORES } = require('./instructors');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function gerarEstruturaCurso(tema, nivel, area) {
  const instrutor = INSTRUTORES[area] || INSTRUTORES.geral;
  const nivelMap = {
    iniciante: 'iniciante (sem conhecimento prévio — parta do absoluto zero)',
    intermediario: 'intermediário (conhecimento básico já existe — aprofunde e expanda)',
    avancado: 'avançado (já domina os fundamentos — traga profundidade e casos complexos)',
  };

  const areaGuidance = {
    idiomas:    'Inclua módulos de vocabulário, gramática, conversação e situações reais. Progrida do básico ao comunicativo.',
    tecnologia: 'Inclua módulos de conceitos, prática com código, projetos e boas práticas. Cada aula deve ter algo construível.',
    negocios:   'Inclua módulos de teoria, ferramentas práticas, cases reais e aplicação imediata.',
    saude:      'Inclua módulos de fundamentos, prática diária, prevenção e autocuidado. Tom informativo e acessível.',
    humanas:    'Inclua módulos temáticos progressivos, conectando teoria com contexto atual e reflexão crítica.',
    ciencias:   'Inclua módulos conceituais, fenômenos do cotidiano, experimentos mentais e aplicações reais.',
    artes:      'Inclua módulos de fundamentos, técnicas, exercícios práticos e projetos expressivos.',
    geral:      'Organize de forma lógica e progressiva, do mais simples ao mais complexo.',
  };

  const prompt = `Crie uma estrutura de curso completa sobre "${tema}" para nível ${nivelMap[nivel]}.

Orientação por área (${area}): ${areaGuidance[area] || areaGuidance.geral}

Regras de qualidade:
- Módulos devem ser temáticos e progressivos — cada um constrói sobre o anterior
- Títulos de aulas devem ser específicos e descritivos (não genéricos como "Introdução ao módulo")
- A progressão deve ser: conceitos básicos → aplicação → prática avançada → projeto/síntese
- Última aula do curso deve ser uma síntese, revisão ou projeto prático

Retorne APENAS um JSON válido (sem texto antes ou depois):
{
  "titulo": "título do curso",
  "descricao": "descrição em 2 frases atraentes e motivadoras",
  "emoji": "um emoji relevante ao tema",
  "duracaoEstimada": "ex: 12 horas",
  "modulos": [
    {
      "titulo": "título temático do módulo",
      "aulas": [
        { "titulo": "título específico da aula" }
      ]
    }
  ]
}

Crie entre 3-5 módulos com 3-4 aulas cada. Títulos em português, claros e específicos.`;

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: instrutor.persona },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 2000,
  });

  const text = response.choices[0].message.content;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('IA não retornou JSON válido');

  return JSON.parse(jsonMatch[0]);
}

async function gerarConteudoAula(cursoTitulo, moduloTitulo, aulaTitulo, nivel, area) {
  const instrutor = INSTRUTORES[area] || INSTRUTORES.geral;

  const areaExtra = {
    idiomas: `
- Inclua uma tabela de vocabulário com: Palavra/Frase | Pronúncia (fonética simples) | Tradução | Exemplo de uso
- Inclua um diálogo curto (4-6 linhas) situando o vocabulário em contexto real
- Explique regras gramaticais com exemplos afirmativos, negativos e interrogativos
- Dê dicas de pronúncia para sons difíceis para falantes de português`,
    tecnologia: `
- Inclua exemplos de código FUNCIONAIS e comentados (não pseudocódigo)
- Mostre o código errado comum e o código correto lado a lado quando relevante
- Inclua saída esperada do código quando aplicável
- Conecte cada conceito a uma situação real de desenvolvimento`,
    ciencias: `
- Inclua fórmulas quando relevante, com explicação de cada variável
- Use analogias do cotidiano para fenômenos abstratos
- Inclua pelo menos um experimento mental ou exemplo observável no dia a dia
- Contextualize com descobertas científicas reais`,
    negocios: `
- Inclua pelo menos um case real (empresa conhecida) ilustrando o conceito
- Apresente ferramentas, templates ou frameworks práticos quando aplicável
- Use dados e métricas para embasar afirmações
- Inclua "Como aplicar hoje" com passos acionáveis`,
    saude: `
- Cite evidências científicas de forma acessível (sem jargão desnecessário)
- Inclua sinais de alerta e quando procurar um profissional de saúde
- Desmistifique mitos comuns relacionados ao tema
- Inclua dicas práticas aplicáveis no dia a dia`,
    humanas: `
- Conecte o tema com eventos ou questões atuais
- Inclua citações ou pensamentos de autores/filósofos relevantes
- Apresente perspectivas divergentes sobre o tema
- Estimule a reflexão com perguntas abertas ao final`,
    artes: `
- Descreva técnicas com passos detalhados e sequenciais
- Inclua referências de artistas/obras que exemplificam o conceito
- Sugira um exercício prático que o aluno pode fazer imediatamente
- Fale sobre erros comuns de quem está aprendendo a técnica`,
  };

  const extraInstrucoes = areaExtra[area] || '';

  const prompt = `Você está ministrando o curso "${cursoTitulo}" (nível ${nivel}).
Módulo atual: "${moduloTitulo}"
Aula atual: "${aulaTitulo}"

Crie o conteúdo COMPLETO desta aula em Markdown. Seja profundo, didático e envolvente — o aluno deve sair com domínio real do tema.

SEÇÕES OBRIGATÓRIAS (use exatamente estes títulos):
## Introdução
(Contextualize: por que este tema importa, onde aparece no mundo real, o que o aluno vai dominar)

## Conceitos Fundamentais
(Explique cada conceito com profundidade — mostre como funciona por dentro, não só defina)

## Como Funciona na Prática
(Exemplos concretos e aplicados — não teóricos)

## Erros Comuns e Como Evitá-los
(Armadilhas reais que iniciantes cometem, com a explicação do porquê é errado e como corrigir)

## Aprofundamento
(Variações, casos especiais, conexões com outros conceitos do curso, o que vem depois)

## Pontos-chave
(Lista de 5-7 conceitos essenciais desta aula em bullets)

## Conclusão
(Síntese do aprendizado e gancho motivador para o próximo conteúdo)

REGRAS DE QUALIDADE:
- Mínimo de 1000 palavras — cada seção deve ter substância real, sem parágrafo de enchimento
- Use **negrito** para termos técnicos na primeira vez que aparecem
- Use listas e tabelas para organizar comparações e informações estruturadas
- Tom: profissional mas acessível, como um professor experiente explicando para um amigo inteligente
- Escreva em português do Brasil
${extraInstrucoes}`;

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: instrutor.persona },
      { role: 'user', content: prompt },
    ],
    temperature: 0.65,
    max_tokens: 4500,
  });

  return response.choices[0].message.content;
}

async function gerarQuiz(cursoTitulo, aulaTitulo, conteudo, area) {
  const prompt = `Você é um avaliador educacional rigoroso. Com base no conteúdo da aula "${aulaTitulo}" do curso "${cursoTitulo}", crie um questionário com EXATAMENTE 8 perguntas desafiadoras.

DISTRIBUIÇÃO OBRIGATÓRIA:
- 4 perguntas do tipo "multipla_escolha": cenários aplicados, análise crítica, resolução de problemas — NÃO perguntas de definição simples
- 2 perguntas do tipo "verdadeiro_falso": afirmações sutis, pegadinhas conceituais, erros comuns
- 2 perguntas do tipo "discursiva": exigem raciocínio elaborado, comparação entre conceitos, ou aplicação em situação real

Retorne APENAS um JSON válido (array de 8 objetos), sem texto antes ou depois:
[
  {
    "tipo": "multipla_escolha",
    "pergunta": "Pergunta aplicada e desafiadora que exige raciocínio",
    "opcoes": ["opção A", "opção B", "opção C", "opção D"],
    "correta": 2,
    "explicacao": "Explicação detalhada do raciocínio correto e por que as outras opções estão erradas"
  },
  {
    "tipo": "verdadeiro_falso",
    "pergunta": "Afirmação completa e precisa sobre o conteúdo",
    "opcoes": ["Verdadeiro", "Falso"],
    "correta": 1,
    "explicacao": "Por que é verdadeiro ou falso, com a correção se for falsa"
  },
  {
    "tipo": "discursiva",
    "pergunta": "Pergunta aberta que exige dissertar, comparar ou aplicar o conceito",
    "opcoes": [],
    "correta": null,
    "explicacao": null,
    "respostaEsperada": "Resposta modelo completa com os pontos essenciais que devem estar presentes"
  }
]

REGRAS DE DIFICULDADE:
- Múltipla escolha: todas as opções devem parecer plausíveis; a correta exige entendimento profundo
- Verdadeiro/Falso: inclua ao menos uma afirmação FALSA com erro sutil e difícil de detectar
- Discursiva: a pergunta deve exigir síntese ou aplicação, não apenas repetição de definição
- Varie a posição da resposta correta nas múltipla escolha
- NÃO faça perguntas sobre datas, nomes ou fatos isolados — foque em raciocínio e aplicação

Conteúdo da aula:
${conteudo.substring(0, 4000)}`;

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: 'Você é um especialista em avaliação educacional universitária. Crie questionários rigorosos que realmente testem compreensão profunda, não memorização superficial.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.4,
    max_tokens: 3000,
  });

  const text = response.choices[0].message.content;
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return [];
  }
}

async function extrairEstruturaDoTexto(texto) {
  const prompt = `Analise o texto abaixo e extraia a estrutura de um curso de estudos.

Retorne APENAS um JSON válido com esta estrutura (sem texto antes ou depois):
{
  "titulo": "título do curso extraído ou inferido do texto",
  "modulos": [
    {
      "titulo": "título do módulo",
      "aulas": [
        { "titulo": "título da aula" }
      ]
    }
  ]
}

Regras:
- Agrupe os tópicos em módulos lógicos se o texto não tiver módulos explícitos
- Cada módulo deve ter entre 2 e 5 aulas
- Títulos em português, curtos e claros
- Se o texto for uma lista simples de tópicos, crie módulos agrupando-os por tema

Texto:
${texto.substring(0, 3000)}`;

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 2000,
  });

  const text = response.choices[0].message.content;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('IA não conseguiu extrair estrutura do texto');

  return JSON.parse(jsonMatch[0]);
}

async function corrigirDiscursiva(pergunta, respostaEsperada, respostaAluno) {
  const prompt = `Você é um professor avaliando uma resposta discursiva. Avalie com rigor, mas de forma justa e didática.

PERGUNTA:
${pergunta}

RESPOSTA ESPERADA (gabarito):
${respostaEsperada}

RESPOSTA DO ALUNO:
${respostaAluno}

Avalie a resposta do aluno e retorne APENAS um JSON válido, sem texto antes ou depois:
{
  "nota": 75,
  "acertou": true,
  "feedback": "Feedback detalhado: o que o aluno acertou, o que deixou de mencionar, e como melhorar. Seja específico e educativo.",
  "pontos_acertados": ["ponto 1 que o aluno pegou bem", "ponto 2"],
  "pontos_perdidos": ["conceito que faltou", "detalhe importante omitido"]
}

Regras de pontuação:
- nota de 0 a 100
- acertou = true se nota >= 60
- feedback deve ter 2-4 frases diretas, sem elogios excessivos
- pontos_acertados e pontos_perdidos: listas curtas (máx 3 itens cada), podem ser vazias
- Se a resposta estiver completamente errada ou vazia, nota = 0`;

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: 'Você é um professor rigoroso e justo. Avalie respostas de forma objetiva e didática.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.2,
    max_tokens: 800,
  });

  const text = response.choices[0].message.content;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('IA não retornou JSON válido');

  return JSON.parse(jsonMatch[0]);
}

async function buscarVideoAula(cursoTitulo, aulaTitulo, conteudo) {
  // Passo 1: IA decide se vídeo agrega e gera a query ideal
  const decisaoPrompt = `Você é um curador de conteúdo educacional.

Curso: "${cursoTitulo}"
Aula: "${aulaTitulo}"
Trecho do conteúdo: ${conteudo.substring(0, 600)}

Um vídeo do YouTube complementaria MUITO esta aula?

Critérios para SIM: temas técnicos com demonstração visual (programação, matemática, ciências, idiomas, engenharia, música), conceitos que ficam muito mais claros assistindo do que lendo.
Critérios para NÃO: introduções simples de 1-2 parágrafos, conceitos triviais, temas puramente filosóficos ou de opinião, aulas que são apenas listas de definições.

Se SIM, a query deve ser muito específica (ex: "como funciona recursão em Python passo a passo", "Khan Academy limites cálculo", "React useEffect hook tutorial completo"). Prefira queries em português para temas brasileiros, inglês para temas técnicos internacionais.

Retorne APENAS JSON válido:
{"precisaVideo": true, "searchQuery": "query bem específica"}
ou
{"precisaVideo": false, "searchQuery": ""}`;

  const decisaoResp = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: decisaoPrompt }],
    temperature: 0.1,
    max_tokens: 120,
  });

  const decisaoText = decisaoResp.choices[0].message.content;
  const decisaoJson = decisaoText.match(/\{[\s\S]*\}/);
  if (!decisaoJson) return null;

  const decisao = JSON.parse(decisaoJson[0]);
  if (!decisao.precisaVideo || !decisao.searchQuery) return null;

  // Passo 2: Buscar no YouTube
  let videos = [];
  try {
    const resultados = await ytsr(decisao.searchQuery, { limit: 10 });
    videos = resultados.items.filter(
      (item) => item.type === 'video' && item.id && item.title && !item.isLive
    ).slice(0, 5);
    if (!videos.length) return null;
  } catch {
    return null;
  }

  // Passo 3: IA valida qual dos resultados é realmente relevante à aula
  try {
    const lista = videos.map((v, i) => `${i + 1}. "${v.title}"`).join('\n');
    const validacaoPrompt = `Você é um curador de conteúdo educacional rigoroso.

Aula: "${aulaTitulo}"
Curso: "${cursoTitulo}"

Dos vídeos abaixo, escolha o MAIS relevante e diretamente relacionado ao tema da aula.
Se NENHUM for claramente sobre o tema da aula, retorne -1.

${lista}

Retorne APENAS JSON: {"indice": 1} (1-based) ou {"indice": -1} se nenhum serve.`;

    const validacaoResp = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: validacaoPrompt }],
      temperature: 0,
      max_tokens: 30,
    });

    const valText = validacaoResp.choices[0].message.content;
    const valJson = valText.match(/\{[\s\S]*\}/);
    if (!valJson) return null;

    const { indice } = JSON.parse(valJson[0]);
    if (indice === -1 || indice < 1 || indice > videos.length) return null;

    const escolhido = videos[indice - 1];
    return { videoId: escolhido.id, videoTitulo: escolhido.title };
  } catch {
    return null;
  }
}

async function gerarFlashcards(cursoTitulo, aulaTitulo, conteudo, area) {
  const formatoPorArea = {
    idiomas: `FORMATO OBRIGATÓRIO para idiomas:
- frente: a palavra, frase ou estrutura gramatical NO IDIOMA SENDO APRENDIDO (inglês, espanhol, etc.)
- verso: tradução em português + pronúncia simplificada entre colchetes + frase de exemplo no idioma
Exemplo: { "frente": "How are you?", "verso": "Como você está? [rau ar iú] — Ex: 'How are you? I'm fine, thanks!'" }
Misture vocabulário individual, frases completas e estruturas gramaticais.`,

    tecnologia: `FORMATO OBRIGATÓRIO para tecnologia:
- frente: conceito, termo técnico ou pergunta "como funciona X?"
- verso: explicação direta (1-2 frases) + exemplo de código curto quando aplicável
Exemplo: { "frente": "O que faz o 'const' em JS?", "verso": "Declara variável que não pode ser reatribuída. Ex: const pi = 3.14; // pi = 5 causa erro" }`,

    ciencias: `FORMATO para ciências:
- frente: fenômeno, fórmula, conceito ou pergunta "por que X acontece?"
- verso: explicação com analogia do cotidiano + fórmula ou dado concreto quando aplicável`,

    negocios: `FORMATO para negócios:
- frente: termo, conceito ou framework de gestão
- verso: definição prática + como aplicar em 1 frase + exemplo real`,

    default: `FORMATO padrão:
- frente: termo, pergunta direta ou conceito-chave (até 12 palavras)
- verso: resposta completa com contexto (2-3 frases) — suficiente para entender sem reler a aula`,
  };

  const formato = formatoPorArea[area] || formatoPorArea.default;

  const prompt = `Você é um especialista em aprendizado ativo e memorização. Com base no conteúdo da aula "${aulaTitulo}" do curso "${cursoTitulo}", crie 10 flashcards de alta qualidade.

${formato}

Regras gerais:
- Cubra os 10 conceitos MAIS IMPORTANTES da aula — priorize o que o aluno precisa fixar
- Variedade: não repita o mesmo tipo de pergunta
- Frente: clara e específica — quem lê deve saber exatamente o que responder
- Verso: completo o suficiente para confirmar o entendimento sem precisar reler a aula
- NÃO crie flashcards triviais ou óbvios demais

Retorne APENAS um JSON válido (array de 10 objetos), sem texto antes ou depois:
[{ "frente": "...", "verso": "..." }]

Conteúdo da aula:
${conteudo.substring(0, 3500)}`;

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: 'Você é um especialista em design instrucional e técnicas de memorização como Anki e repetição espaçada. Crie flashcards precisos, úteis e com o nível certo de dificuldade.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.4,
    max_tokens: 2500,
  });

  const text = response.choices[0].message.content;
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];
  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return [];
  }
}

module.exports = { gerarEstruturaCurso, gerarConteudoAula, gerarQuiz, extrairEstruturaDoTexto, corrigirDiscursiva, buscarVideoAula, gerarFlashcards };
