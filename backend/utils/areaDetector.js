const AREAS = {
  tecnologia: ['programação', 'programacao', 'python', 'javascript', 'java', 'react', 'node', 'nodejs', 'banco de dados', 'sql', 'nosql', 'css', 'html', 'codigo', 'algoritmo', 'machine learning', 'inteligencia artificial', 'web', 'app', 'software', 'hardware', 'rede', 'linux', 'git', 'api', 'docker', 'cloud', 'typescript', 'vue', 'angular', 'flutter', 'kotlin', 'swift', 'c++', 'rust', 'golang', 'php', 'ruby', 'django', 'fastapi', 'spring', 'devops', 'kubernetes', 'aws', 'azure', 'cybersegurança', 'cibersegurança', 'blockchain', 'iot', 'arduino'],
  ciencias: ['matematica', 'física', 'fisica', 'química', 'quimica', 'biologia', 'cálculo', 'calculo', 'algebra', 'geometria', 'estatística', 'estatistica', 'trigonometria', 'equação', 'equacao', 'célula', 'celula', 'átomo', 'atomo', 'molecula', 'genética', 'genetica', 'ecologia', 'astronomia', 'astrofisica', 'termodinâmica', 'eletromagnetismo', 'mecanica', 'optica', 'quântica'],
  humanas: ['história', 'historia', 'filosofia', 'literatura', 'geografia', 'sociologia', 'politica', 'política', 'brasil', 'guerra', 'revolução', 'revolucao', 'cultura', 'antropologia', 'arqueologia', 'mitologia', 'religiao', 'religião', 'direito', 'ciencias sociais', 'relações internacionais', 'relacoes internacionais'],
  idiomas: ['ingles', 'inglês', 'espanhol', 'francês', 'frances', 'alemão', 'alemao', 'japonês', 'japones', 'mandarim', 'chines', 'chinês', 'italiano', 'russo', 'arabe', 'árabe', 'coreano', 'lingua', 'língua', 'idioma', 'gramática', 'gramatica', 'vocabulario', 'vocabulário', 'conversação', 'conversacao'],
  negocios: ['marketing', 'finanças', 'financas', 'empreendedorismo', 'gestao', 'gestão', 'administração', 'administracao', 'vendas', 'negócio', 'negocio', 'startup', 'investimento', 'contabilidade', 'rh', 'recursos humanos', 'liderança', 'lideranca', 'estratégia', 'estrategia', 'logistica', 'logística', 'supply chain', 'ecommerce', 'e-commerce'],
  artes: ['música', 'musica', 'pintura', 'desenho', 'cinema', 'fotografia', 'design', 'animacao', 'animação', 'teatro', 'dança', 'danca', 'escultura', 'arte', 'ilustração', 'ilustracao', 'grafico', 'gráfico', 'ux', 'ui', 'moda', 'arquitetura', 'paisagismo', 'culinaria', 'culinária', 'gastronomia'],
  saude: ['medicina', 'nutrição', 'nutricao', 'saúde', 'saude', 'anatomia', 'farmácia', 'farmacia', 'enfermagem', 'exercicio', 'exercício', 'mental', 'psicologia', 'fitness', 'dieta', 'fisioterapia', 'odontologia', 'veterinaria', 'veterinária', 'primeiros socorros', 'meditação', 'meditacao', 'yoga', 'pilates'],
};

function detectarArea(tema) {
  const temaLower = tema
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  for (const [area, palavras] of Object.entries(AREAS)) {
    const normalizedPalavras = palavras.map((p) =>
      p.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    );
    if (normalizedPalavras.some((p) => temaLower.includes(p))) {
      return area;
    }
  }
  return 'geral';
}

module.exports = { detectarArea };
