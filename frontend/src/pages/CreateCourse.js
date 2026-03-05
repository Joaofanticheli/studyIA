import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './CreateCourse.css';

const AREAS_INFO = [
  { emoji: '💻', label: 'Tecnologia',     exemplo: 'Python, React, SQL...' },
  { emoji: '🔬', label: 'Ciências',       exemplo: 'Matemática, Física, Química...' },
  { emoji: '📚', label: 'Humanas',        exemplo: 'História, Filosofia, Literatura...' },
  { emoji: '🌍', label: 'Idiomas',        exemplo: 'Inglês, Espanhol, Japonês...' },
  { emoji: '💼', label: 'Negócios',       exemplo: 'Marketing, Finanças, Gestão...' },
  { emoji: '🎨', label: 'Artes',          exemplo: 'Música, Design, Cinema...' },
  { emoji: '❤️', label: 'Saúde',          exemplo: 'Nutrição, Psicologia...' },
  { emoji: '🤖', label: 'Qualquer tema',  exemplo: 'IA detecta a área sozinha!' },
];

const NIVEIS = [
  { value: 'iniciante',     emoji: '🌱', label: 'Iniciante',     desc: 'Sem conhecimento prévio' },
  { value: 'intermediario', emoji: '📈', label: 'Intermediário', desc: 'Já sei o básico' },
  { value: 'avancado',      emoji: '🚀', label: 'Avançado',      desc: 'Quero aprofundar' },
];

export default function CreateCourse() {
  const [modo, setModo]       = useState('ia'); // 'ia' | 'manual'
  const [tema, setTema]       = useState('');
  const [nivel, setNivel]     = useState('iniciante');
  const [loading, setLoading] = useState(false);
  const [erro, setErro]       = useState('');

  // modo texto
  const [texto, setTexto] = useState('');

  // modo manual
  const [modulos, setModulos] = useState([
    { titulo: '', aulas: [{ titulo: '' }] },
  ]);

  const navigate = useNavigate();

  /* ── Modo IA ── */
  const handleSubmitIA = async (e) => {
    e.preventDefault();
    if (!tema.trim()) return setErro('Informe o tema do curso');
    setErro('');
    setLoading(true);
    try {
      const { data } = await api.post('/courses', { tema: tema.trim(), nivel });
      navigate(`/curso/${data._id}`);
    } catch (err) {
      setErro(err.response?.data?.message || 'Erro ao gerar curso. Tente novamente.');
      setLoading(false);
    }
  };

  /* ── Modo Texto ── */
  const handleSubmitTexto = async (e) => {
    e.preventDefault();
    if (!texto.trim()) return setErro('Cole o conteúdo do seu curso');
    setErro('');
    setLoading(true);
    try {
      const { data } = await api.post('/courses/from-text', { texto: texto.trim(), nivel });
      navigate(`/curso/${data._id}`);
    } catch (err) {
      setErro(err.response?.data?.message || 'Erro ao processar texto. Tente novamente.');
      setLoading(false);
    }
  };

  /* ── Modo Manual ── */
  const addModulo = () =>
    setModulos(prev => [...prev, { titulo: '', aulas: [{ titulo: '' }] }]);

  const removeModulo = (mi) =>
    setModulos(prev => prev.filter((_, i) => i !== mi));

  const updateModulo = (mi, valor) =>
    setModulos(prev => prev.map((m, i) => i === mi ? { ...m, titulo: valor } : m));

  const addAula = (mi) =>
    setModulos(prev => prev.map((m, i) => i === mi ? { ...m, aulas: [...m.aulas, { titulo: '' }] } : m));

  const removeAula = (mi, ai) =>
    setModulos(prev => prev.map((m, i) => i === mi ? { ...m, aulas: m.aulas.filter((_, j) => j !== ai) } : m));

  const updateAula = (mi, ai, valor) =>
    setModulos(prev => prev.map((m, i) => i === mi
      ? { ...m, aulas: m.aulas.map((a, j) => j === ai ? { titulo: valor } : a) }
      : m
    ));

  const handleSubmitManual = async (e) => {
    e.preventDefault();
    if (!tema.trim()) return setErro('Informe o título do curso');
    const modulosValidos = modulos.filter(m => m.titulo.trim() && m.aulas.some(a => a.titulo.trim()));
    if (!modulosValidos.length) return setErro('Adicione pelo menos um módulo com uma aula');
    const modulosLimpos = modulosValidos.map(m => ({
      titulo: m.titulo.trim(),
      aulas: m.aulas.filter(a => a.titulo.trim()).map(a => ({ titulo: a.titulo.trim() })),
    }));
    setErro('');
    setLoading(true);
    try {
      const { data } = await api.post('/courses/custom', { tema: tema.trim(), nivel, modulos: modulosLimpos });
      navigate(`/curso/${data._id}`);
    } catch (err) {
      setErro(err.response?.data?.message || 'Erro ao criar curso. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <div className="create-page">
      {loading && (
        <div className="generating-overlay">
          <div className="generating-box">
            <div className="spinner-lg" />
            <h2>{modo === 'ia' ? 'Gerando seu curso com IA...' : 'Criando seu curso...'}</h2>
            <p>{modo === 'ia' ? 'Nossa IA está criando módulos e aulas personalizados ✨' : 'Montando a estrutura do seu curso 📋'}</p>
          </div>
        </div>
      )}

      <div className="create-container fade-in">
        <div className="create-header">
          <h1>✨ Criar novo curso</h1>
          <p>Deixa a IA criar tudo ou defina você mesmo os módulos</p>
        </div>

        {/* Toggle de modo */}
        <div className="modo-toggle">
          <button
            className={`modo-btn ${modo === 'ia' ? 'active' : ''}`}
            onClick={() => { setModo('ia'); setErro(''); }}
            type="button"
          >
            🤖 IA cria tudo
          </button>
          <button
            className={`modo-btn ${modo === 'manual' ? 'active' : ''}`}
            onClick={() => { setModo('manual'); setErro(''); }}
            type="button"
          >
            🗂️ Montar estrutura
          </button>
          <button
            className={`modo-btn ${modo === 'texto' ? 'active' : ''}`}
            onClick={() => { setModo('texto'); setErro(''); }}
            type="button"
          >
            📝 Colar texto
          </button>
        </div>

        {/* ── MODO IA ── */}
        {modo === 'ia' && (
          <form onSubmit={handleSubmitIA} className="create-form">
            {erro && <div className="create-error">{erro}</div>}

            <div className="form-section">
              <label className="form-label">O que você quer aprender?</label>
              <input
                type="text"
                className="tema-input"
                placeholder="Ex: Python para iniciantes, História do Brasil, Inglês conversacional..."
                value={tema}
                onChange={(e) => setTema(e.target.value)}
                disabled={loading}
                autoFocus
              />
            </div>

            <div className="form-section">
              <label className="form-label">Seu nível de conhecimento</label>
              <div className="nivel-grid">
                {NIVEIS.map(({ value, emoji, label, desc }) => (
                  <button
                    key={value}
                    type="button"
                    className={`nivel-card ${nivel === value ? 'active' : ''}`}
                    onClick={() => setNivel(value)}
                    disabled={loading}
                  >
                    <span className="nivel-emoji">{emoji}</span>
                    <strong>{label}</strong>
                    <small>{desc}</small>
                  </button>
                ))}
              </div>
            </div>

            <div className="areas-section">
              <p className="areas-label">🎯 A IA detecta a área e usa o instrutor especializado:</p>
              <div className="areas-grid">
                {AREAS_INFO.map((a) => (
                  <div key={a.label} className="area-chip">
                    <span>{a.emoji}</span>
                    <span>{a.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" className="btn-gerar" disabled={loading || !tema.trim()}>
              🚀 Gerar curso com IA
            </button>
          </form>
        )}

        {/* ── MODO TEXTO ── */}
        {modo === 'texto' && (
          <form onSubmit={handleSubmitTexto} className="create-form">
            {erro && <div className="create-error">{erro}</div>}

            <div className="form-section">
              <label className="form-label">Cole o conteúdo do seu curso</label>
              <p className="texto-hint">Pode ser uma ementa, sumário, lista de tópicos ou qualquer texto — a IA vai organizar os módulos e aulas automaticamente.</p>
              <textarea
                className="texto-input"
                placeholder={`Ex:\nMódulo 1: Introdução\n- O que é italiano\n- Alfabeto e pronúncia\n\nMódulo 2: Vocabulário básico\n- Cumprimentos\n- Números e cores\n\nOu simplesmente uma lista de tópicos...`}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                disabled={loading}
                rows={12}
              />
            </div>

            <div className="form-section">
              <label className="form-label">Seu nível de conhecimento</label>
              <div className="nivel-grid">
                {NIVEIS.map(({ value, emoji, label, desc }) => (
                  <button
                    key={value}
                    type="button"
                    className={`nivel-card ${nivel === value ? 'active' : ''}`}
                    onClick={() => setNivel(value)}
                    disabled={loading}
                  >
                    <span className="nivel-emoji">{emoji}</span>
                    <strong>{label}</strong>
                    <small>{desc}</small>
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="btn-gerar" disabled={loading || !texto.trim()}>
              📝 Gerar curso do meu texto
            </button>
          </form>
        )}

        {/* ── MODO MANUAL ── */}
        {modo === 'manual' && (
          <form onSubmit={handleSubmitManual} className="create-form">
            {erro && <div className="create-error">{erro}</div>}

            <div className="form-section">
              <label className="form-label">Título do curso</label>
              <input
                type="text"
                className="tema-input"
                placeholder="Ex: Inglês para Viagens, Violão do Zero..."
                value={tema}
                onChange={(e) => setTema(e.target.value)}
                disabled={loading}
                autoFocus
              />
            </div>

            <div className="form-section">
              <label className="form-label">Seu nível de conhecimento</label>
              <div className="nivel-grid">
                {NIVEIS.map(({ value, emoji, label, desc }) => (
                  <button
                    key={value}
                    type="button"
                    className={`nivel-card ${nivel === value ? 'active' : ''}`}
                    onClick={() => setNivel(value)}
                    disabled={loading}
                  >
                    <span className="nivel-emoji">{emoji}</span>
                    <strong>{label}</strong>
                    <small>{desc}</small>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-section">
              <label className="form-label">Seus módulos e aulas</label>
              <div className="modulos-list">
                {modulos.map((mod, mi) => (
                  <div key={mi} className="modulo-bloco">
                    <div className="modulo-header">
                      <span className="modulo-num">Módulo {mi + 1}</span>
                      {modulos.length > 1 && (
                        <button type="button" className="btn-remover" onClick={() => removeModulo(mi)}>✕</button>
                      )}
                    </div>
                    <input
                      className="modulo-input"
                      placeholder="Título do módulo. Ex: Introdução ao Vocabulário"
                      value={mod.titulo}
                      onChange={(e) => updateModulo(mi, e.target.value)}
                      disabled={loading}
                    />
                    <div className="aulas-list">
                      {mod.aulas.map((aula, ai) => (
                        <div key={ai} className="aula-row">
                          <span className="aula-num">{ai + 1}</span>
                          <input
                            className="aula-input"
                            placeholder="Título da aula. Ex: Cumprimentos e apresentações"
                            value={aula.titulo}
                            onChange={(e) => updateAula(mi, ai, e.target.value)}
                            disabled={loading}
                          />
                          {mod.aulas.length > 1 && (
                            <button type="button" className="btn-remover-aula" onClick={() => removeAula(mi, ai)}>✕</button>
                          )}
                        </div>
                      ))}
                      <button type="button" className="btn-add-aula" onClick={() => addAula(mi)} disabled={loading}>
                        + Adicionar aula
                      </button>
                    </div>
                  </div>
                ))}
                <button type="button" className="btn-add-modulo" onClick={addModulo} disabled={loading}>
                  + Adicionar módulo
                </button>
              </div>
            </div>

            <button type="submit" className="btn-gerar" disabled={loading || !tema.trim()}>
              📋 Criar curso com meus módulos
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
