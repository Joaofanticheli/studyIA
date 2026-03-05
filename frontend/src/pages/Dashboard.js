import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Dashboard.css';

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

const AREA_ORDER = ['idiomas', 'tecnologia', 'negocios', 'saude', 'humanas', 'ciencias', 'artes'];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [aba, setAba] = useState('meus');
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletando, setDeletando] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [iniciando, setIniciando] = useState(null);

  useEffect(() => {
    api.get('/courses')
      .then(({ data }) => { setCursos(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (aba === 'biblioteca' && templates.length === 0) {
      setLoadingTemplates(true);
      api.get('/courses/templates')
        .then(({ data }) => { setTemplates(data); setLoadingTemplates(false); })
        .catch(() => setLoadingTemplates(false));
    }
  }, [aba]);

  const deletarCurso = async (e, id) => {
    e.preventDefault();
    if (!window.confirm('Tem certeza que quer deletar este curso?')) return;
    setDeletando(id);
    try {
      await api.delete(`/courses/${id}`);
      setCursos(prev => prev.filter(c => c._id !== id));
    } catch {
      alert('Erro ao deletar curso.');
    } finally {
      setDeletando(null);
    }
  };

  const comecarTemplate = async (templateId) => {
    setIniciando(templateId);
    try {
      const { data } = await api.post(`/courses/templates/${templateId}`);
      navigate(`/curso/${data._id}`);
    } catch (err) {
      if (err.response?.data?.courseId) {
        navigate(`/curso/${err.response.data.courseId}`);
      } else {
        alert(err.response?.data?.message || 'Erro ao iniciar curso.');
        setIniciando(null);
      }
    }
  };

  const getPct = (c) => {
    const total = c.progresso?.totalAulas || 0;
    if (!total) return 0;
    return Math.round((c.progresso.aulasCompletas / total) * 100);
  };

  const templatesPorArea = AREA_ORDER.reduce((acc, area) => {
    const lista = templates.filter(t => t.area === area);
    if (lista.length) acc[area] = lista;
    return acc;
  }, {});

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-text">
          <h1>Olá, {user?.nome?.split(' ')[0]}! 👋</h1>
          <p>O que você vai aprender hoje?</p>
        </div>
        <Link to="/criar" className="btn-primary btn-novo">
          ✨ Novo Curso com IA
        </Link>
      </div>

      <div className="dash-tabs">
        <button className={`dash-tab${aba === 'meus' ? ' active' : ''}`} onClick={() => setAba('meus')}>
          Meus Cursos
        </button>
        <button className={`dash-tab${aba === 'biblioteca' ? ' active' : ''}`} onClick={() => setAba('biblioteca')}>
          Biblioteca
        </button>
      </div>

      {aba === 'meus' && (
        loading ? (
          <div className="loading-grid">
            {[1, 2, 3].map((i) => <div key={i} className="course-card skeleton" />)}
          </div>
        ) : cursos.length === 0 ? (
          <div className="empty-state fade-in">
            <div className="empty-emoji">🚀</div>
            <h2>Nenhum curso ainda</h2>
            <p>Crie seu primeiro curso com IA ou explore a Biblioteca com cursos prontos!</p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <Link to="/criar" className="btn-primary">✨ Criar com IA</Link>
              <button className="btn-secondary" onClick={() => setAba('biblioteca')}>📚 Ver Biblioteca</button>
            </div>
          </div>
        ) : (
          <>
            <p className="courses-count">{cursos.length} curso{cursos.length !== 1 ? 's' : ''}</p>
            <div className="courses-grid fade-in">
              {cursos.map((curso) => {
                const config = AREA_CONFIG[curso.area] || AREA_CONFIG.geral;
                const pct = getPct(curso);
                return (
                  <div key={curso._id} className="course-card-wrapper">
                    <Link to={`/curso/${curso._id}`} className="course-card">
                      <div className="card-top">
                        <span className="card-emoji">{curso.emoji}</span>
                        <span className="card-area" style={{ background: config.color + '22', color: config.color }}>
                          {config.label}
                        </span>
                      </div>
                      <h3 className="card-title">{curso.titulo}</h3>
                      <p className="card-desc">{curso.descricao}</p>
                      <div className="card-footer">
                        <div className="card-meta">
                          <span className="nivel-chip">{curso.nivel}</span>
                          {curso.duracaoEstimada && <span className="duracao">⏱ {curso.duracaoEstimada}</span>}
                        </div>
                        <div className="progress-row">
                          <div className="progress-track">
                            <div className="progress-bar" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${config.color}, ${config.color}99)` }} />
                          </div>
                          <span className="progress-pct">{pct}%</span>
                        </div>
                      </div>
                    </Link>
                    <button
                      className="btn-deletar-curso"
                      onClick={(e) => deletarCurso(e, curso._id)}
                      disabled={deletando === curso._id}
                      title="Deletar curso"
                    >
                      {deletando === curso._id ? '...' : '🗑️'}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )
      )}

      {aba === 'biblioteca' && (
        loadingTemplates ? (
          <div className="loading-grid">
            {[1, 2, 3, 4].map((i) => <div key={i} className="course-card skeleton" />)}
          </div>
        ) : (
          <div className="biblioteca fade-in">
            <p className="biblioteca-desc">Cursos prontos para você começar agora. Clique em "Começar curso" e o conteúdo será gerado pela IA conforme você avança.</p>
            {Object.entries(templatesPorArea).map(([area, lista]) => {
              const config = AREA_CONFIG[area] || AREA_CONFIG.geral;
              return (
                <div key={area} className="biblioteca-section">
                  <h2 className="biblioteca-area-titulo" style={{ color: config.color }}>
                    {config.label}
                  </h2>
                  <div className="courses-grid">
                    {lista.map((tpl) => (
                      <div key={tpl.id} className="template-card">
                        <div className="card-top">
                          <span className="card-emoji">{tpl.emoji}</span>
                          <span className="card-area" style={{ background: config.color + '22', color: config.color }}>
                            {config.label}
                          </span>
                        </div>
                        <h3 className="card-title">{tpl.titulo}</h3>
                        <p className="card-desc">{tpl.descricao}</p>
                        <div className="card-footer">
                          <div className="card-meta">
                            <span className="nivel-chip">{tpl.nivel}</span>
                            {tpl.duracaoEstimada && <span className="duracao">⏱ {tpl.duracaoEstimada}</span>}
                            <span className="duracao">{tpl.totalAulas} aulas</span>
                          </div>
                          <button
                            className="btn-comecar-template"
                            onClick={() => comecarTemplate(tpl.id)}
                            disabled={iniciando === tpl.id}
                          >
                            {iniciando === tpl.id ? 'Criando...' : '▶ Começar curso'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
