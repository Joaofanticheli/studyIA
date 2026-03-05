import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './CoursePage.css';

const AREA_CONFIG = {
  tecnologia: { color: '#7c6ff7', label: 'Tecnologia' },
  ciencias:   { color: '#22d3ee', label: 'Ciências' },
  humanas:    { color: '#fbbf24', label: 'Humanas' },
  idiomas:    { color: '#4ade80', label: 'Idiomas' },
  negocios:   { color: '#fb923c', label: 'Negócios' },
  artes:      { color: '#f472b6', label: 'Artes' },
  saude:      { color: '#34d399', label: 'Saúde' },
  geral:      { color: '#94a3b8', label: 'Geral' },
};

export default function CoursePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [curso, setCurso]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCert, setShowCert] = useState(false);
  const [sugestao, setSugestao] = useState(null);
  const [iniciandoSugestao, setIniciandoSugestao] = useState(false);

  useEffect(() => {
    api.get(`/courses/${id}`)
      .then(({ data }) => { setCurso(data); setLoading(false); })
      .catch(() => navigate('/'));
  }, [id, navigate]);

  // Busca sugestão quando curso está 100% completo
  useEffect(() => {
    if (!curso) return;
    const totalAulas = curso.modulos.reduce((s, m) => s + m.aulas.length, 0);
    const completas  = curso.progresso?.aulasCompletas?.length || 0;
    if (totalAulas > 0 && completas >= totalAulas) {
      api.get(`/courses/${id}/sugestao`)
        .then(({ data }) => setSugestao(data))
        .catch(() => {});
    }
  }, [curso, id]);

  const comecarSugestao = async () => {
    if (!sugestao || iniciandoSugestao) return;
    setIniciandoSugestao(true);
    try {
      const { data } = await api.post(`/courses/templates/${sugestao.id}`);
      navigate(`/curso/${data._id}`);
    } catch (err) {
      if (err.response?.data?.courseId) {
        navigate(`/curso/${err.response.data.courseId}`);
      } else {
        setIniciandoSugestao(false);
      }
    }
  };

  if (loading) return (
    <div className="page-loading">
      <div className="spinner-lg" />
      <p>Carregando curso...</p>
    </div>
  );

  const totalAulas = curso.modulos.reduce((s, m) => s + m.aulas.length, 0);
  const completas  = curso.progresso?.aulasCompletas?.length || 0;
  const pct        = totalAulas ? Math.round((completas / totalAulas) * 100) : 0;
  const config     = AREA_CONFIG[curso.area] || AREA_CONFIG.geral;
  const concluido  = pct === 100 && totalAulas > 0;

  return (
    <div className="course-page">
      {/* Hero */}
      <div className="course-hero">
        <div className="hero-content">
          <Link to="/" className="back-link">← Meus cursos</Link>
          <div className="hero-top">
            <span className="hero-emoji">{curso.emoji}</span>
            <span className="hero-area" style={{ color: config.color, background: config.color + '22' }}>
              {config.label}
            </span>
            {concluido && (
              <button className="btn-ver-cert" onClick={() => setShowCert(true)}>
                🏆 Ver certificado
              </button>
            )}
          </div>
          <h1>{curso.titulo}</h1>
          <p>{curso.descricao}</p>
          <div className="hero-meta">
            {curso.duracaoEstimada && <span>⏱ {curso.duracaoEstimada}</span>}
            <span>📚 {totalAulas} aulas</span>
            <span>🎯 {curso.nivel}</span>
            <span>✅ {completas}/{totalAulas} concluídas</span>
          </div>
          <div className="hero-progress">
            <div className="hero-track">
              <div className="hero-bar" style={{ width: `${pct}%`, background: config.color }} />
            </div>
            <span>{pct}% concluído</span>
          </div>
        </div>
      </div>

      {/* Módulos */}
      <div className="modules-list">
        {curso.modulos.map((mod, mIdx) => {
          const aulasCompletas = mod.aulas.filter((_, aIdx) =>
            curso.progresso?.aulasCompletas?.includes(`${mIdx}-${aIdx}`)
          ).length;
          return (
            <div key={mIdx} className="module-block">
              <div className="module-header">
                <div className="module-num" style={{ background: config.color + '22', color: config.color }}>
                  {mIdx + 1}
                </div>
                <div>
                  <h2>{mod.titulo}</h2>
                  <span className="module-progress">{aulasCompletas}/{mod.aulas.length} aulas concluídas</span>
                </div>
              </div>
              <div className="lessons-grid">
                {mod.aulas.map((aula, aIdx) => {
                  const aulaId   = `${mIdx}-${aIdx}`;
                  const concluida = curso.progresso?.aulasCompletas?.includes(aulaId);
                  return (
                    <Link
                      key={aIdx}
                      to={`/curso/${id}/modulo/${mIdx}/aula/${aIdx}`}
                      className={`lesson-card ${concluida ? 'done' : ''}`}
                    >
                      <div className="lesson-status">
                        {concluida
                          ? <span className="check">✓</span>
                          : <span className="lesson-num">{aIdx + 1}</span>}
                      </div>
                      <div className="lesson-info">
                        <span className="lesson-title">{aula.titulo}</span>
                        <span className="lesson-tag">{concluida ? 'Concluída' : 'Iniciar aula'}</span>
                      </div>
                      {user?.isAdmin && aula.videoId && (
                        <span className="lesson-yt-icon" title={aula.videoTitulo || 'Tem vídeo'}>
                          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                            <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.75 15.5v-7l6.5 3.5-6.5 3.5z"/>
                          </svg>
                        </span>
                      )}
                      <span className="lesson-arrow">→</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sugestão de próximo curso */}
      {concluido && sugestao && (
        <div className="sugestao-card fade-in">
          <div className="sugestao-label">🎯 Próximo passo recomendado</div>
          <div className="sugestao-content">
            <span className="sugestao-emoji">{sugestao.emoji}</span>
            <div className="sugestao-info">
              <h3>{sugestao.titulo}</h3>
              <p>{sugestao.descricao}</p>
              <div className="sugestao-meta">
                <span>{sugestao.nivel}</span>
                {sugestao.duracaoEstimada && <span>⏱ {sugestao.duracaoEstimada}</span>}
                <span>{sugestao.totalAulas} aulas</span>
              </div>
            </div>
            <button
              className="btn-comecar-sugestao"
              onClick={comecarSugestao}
              disabled={iniciandoSugestao}
            >
              {iniciandoSugestao ? 'Criando...' : '▶ Começar'}
            </button>
          </div>
        </div>
      )}

      {/* Modal Certificado */}
      {showCert && (
        <div className="cert-overlay" onClick={() => setShowCert(false)}>
          <div className="cert-modal" onClick={(e) => e.stopPropagation()}>
            <button className="cert-close" onClick={() => setShowCert(false)}>✕</button>
            <div className="cert-header">
              <div className="cert-stars">✦ ✦ ✦</div>
              <div className="cert-brand">🧠 StudyIA</div>
              <div className="cert-subtitle">Certificado de Conclusão</div>
            </div>
            <div className="cert-body">
              <p className="cert-certifica">Certifica que</p>
              <h2 className="cert-nome">{user?.nome}</h2>
              <p className="cert-concluiu">concluiu com êxito o curso</p>
              <div className="cert-curso">
                <span className="cert-emoji">{curso.emoji}</span>
                <span className="cert-titulo">{curso.titulo}</span>
              </div>
              <div className="cert-info-row">
                <div className="cert-info-item">
                  <span className="cert-info-label">Área</span>
                  <span className="cert-info-val">{config.label}</span>
                </div>
                <div className="cert-info-item">
                  <span className="cert-info-label">Nível</span>
                  <span className="cert-info-val" style={{ textTransform: 'capitalize' }}>{curso.nivel}</span>
                </div>
                <div className="cert-info-item">
                  <span className="cert-info-label">Aulas</span>
                  <span className="cert-info-val">{totalAulas}</span>
                </div>
                <div className="cert-info-item">
                  <span className="cert-info-label">Data</span>
                  <span className="cert-info-val">{new Date().toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            </div>
            <div className="cert-footer">
              <div className="cert-seal" style={{ borderColor: config.color, color: config.color }}>
                ✓ Verificado
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
