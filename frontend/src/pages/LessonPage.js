import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Flashcards from '../components/Flashcards';
import PronunciationPractice from '../components/PronunciationPractice';
import './LessonPage.css';

export default function LessonPage() {
  const { id, moduloIdx, aulaIdx } = useParams();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  const [aula, setAula]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [aba, setAba]           = useState('conteudo');

  // Chat
  const [chatMsgs, setChatMsgs]       = useState([]);
  const [mensagem, setMensagem]       = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Quiz
  const [quizIdx, setQuizIdx]             = useState(0);
  const [acertos, setAcertos]             = useState(0);
  const [quizFinalizado, setQuizFinalizado] = useState(false);
  const [respondido, setRespondido]       = useState(false);
  const [escolhido, setEscolhido]         = useState(null);
  // Discursiva
  const [respostaDigitada, setRespostaDigitada]   = useState('');
  const [correcaoIA, setCorrecaoIA]               = useState(null);
  const [correcaoLoading, setCorrecaoLoading]     = useState(false);

  // Regenerar quiz
  const [regenerando, setRegenerando] = useState(false);

  // Trocar vídeo (admin)
  const [trocandoVideo, setTrocandoVideo] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/courses/${id}/modulos/${moduloIdx}/aulas/${aulaIdx}`)
      .then(({ data }) => { setAula(data); setLoading(false); })
      .catch(() => navigate(`/curso/${id}`));
  }, [id, moduloIdx, aulaIdx, navigate]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMsgs, chatLoading]);

  /* ---------- Chat ---------- */
  const sendChat = async (e) => {
    e.preventDefault();
    if (!mensagem.trim() || chatLoading) return;
    const msg = mensagem.trim();
    setMensagem('');
    const newMsgs = [...chatMsgs, { role: 'user', content: msg }];
    setChatMsgs(newMsgs);
    setChatLoading(true);
    try {
      const { data } = await api.post('/chat', {
        mensagem: msg,
        historico: chatMsgs.slice(-8),
        courseId: id,
        aulaTitulo: aula?.aula?.titulo,
        aulaConteudo: aula?.aula?.conteudo,
      });
      setChatMsgs([...newMsgs, { role: 'assistant', content: data.resposta }]);
    } catch {
      setChatMsgs([...newMsgs, { role: 'assistant', content: 'Desculpe, ocorreu um erro. Tente novamente.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  /* ---------- Quiz ---------- */
  const responderQuiz = (opcaoIdx) => {
    if (respondido) return;
    setEscolhido(opcaoIdx);
    setRespondido(true);
  };

  const proximaQuestao = () => {
    const quiz    = aula.aula.quiz;
    const correto = quiz[quizIdx].correta === escolhido;
    const novosAcertos = acertos + (correto ? 1 : 0);

    if (quizIdx + 1 >= quiz.length) {
      setAcertos(novosAcertos);
      setQuizFinalizado(true);
      api.post(`/courses/${id}/modulos/${moduloIdx}/aulas/${aulaIdx}/concluir`, {
        acertos: novosAcertos, total: quiz.length,
      }).then(({ data }) => { if (data.streak !== undefined) updateUser({ streak: data.streak }); });
    } else {
      setAcertos(novosAcertos);
      setQuizIdx(quizIdx + 1);
      setRespondido(false);
      setEscolhido(null);
      setCorrecaoIA(null);
      setRespostaDigitada('');
    }
  };

  const enviarParaCorrecao = async () => {
    if (!respostaDigitada.trim() || correcaoLoading) return;
    setCorrecaoLoading(true);
    try {
      const { data } = await api.post('/courses/quiz/corrigir', {
        pergunta: questao.pergunta,
        respostaEsperada: questao.respostaEsperada,
        respostaAluno: respostaDigitada,
      });
      setCorrecaoIA(data);
    } catch {
      setCorrecaoIA({ nota: 0, acertou: false, feedback: 'Não foi possível corrigir agora. Tente novamente.', pontos_acertados: [], pontos_perdidos: [] });
    } finally {
      setCorrecaoLoading(false);
    }
  };

  const trocarVideo = async () => {
    if (trocandoVideo) return;
    setTrocandoVideo(true);
    try {
      const { data } = await api.post(`/courses/${id}/modulos/${moduloIdx}/aulas/${aulaIdx}/regenerar-video`);
      setAula((prev) => ({
        ...prev,
        aula: { ...prev.aula, videoId: data.videoId, videoTitulo: data.videoTitulo },
      }));
    } catch {
      // silencia
    } finally {
      setTrocandoVideo(false);
    }
  };

  const regenerarQuiz = async () => {
    if (regenerando) return;
    setRegenerando(true);
    try {
      const { data } = await api.post(`/courses/${id}/modulos/${moduloIdx}/aulas/${aulaIdx}/regenerar-quiz`);
      setAula((prev) => ({ ...prev, aula: { ...prev.aula, quiz: data.quiz } }));
      setQuizIdx(0);
      setAcertos(0);
      setQuizFinalizado(false);
      setRespondido(false);
      setEscolhido(null);
      setCorrecaoIA(null);
      setRespostaDigitada('');
    } catch {
      // silencia erro — quiz anterior continua
    } finally {
      setRegenerando(false);
    }
  };

  const avancarAposCorrecao = () => {
    const quiz = aula.aula.quiz;
    const acertou = correcaoIA?.acertou ?? false;
    const novosAcertos = acertos + (acertou ? 1 : 0);
    if (quizIdx + 1 >= quiz.length) {
      setAcertos(novosAcertos);
      setQuizFinalizado(true);
      api.post(`/courses/${id}/modulos/${moduloIdx}/aulas/${aulaIdx}/concluir`, {
        acertos: novosAcertos, total: quiz.length,
      }).then(({ data }) => { if (data.streak !== undefined) updateUser({ streak: data.streak }); });
    } else {
      setAcertos(novosAcertos);
      setQuizIdx(quizIdx + 1);
      setRespondido(false);
      setEscolhido(null);
      setCorrecaoIA(null);
      setRespostaDigitada('');
    }
  };

  const concluirSemQuiz = () => {
    api.post(`/courses/${id}/modulos/${moduloIdx}/aulas/${aulaIdx}/concluir`, {});
    navigate(`/curso/${id}`);
  };

  const reiniciarQuiz = () => {
    setQuizIdx(0);
    setAcertos(0);
    setQuizFinalizado(false);
    setRespondido(false);
    setEscolhido(null);
    setCorrecaoIA(null);
    setRespostaDigitada('');
  };

  /* ---------- Loading ---------- */
  if (loading) return (
    <div className="lesson-loading">
      <div className="spinner-lg" />
      <p>Gerando aula com IA... ✨</p>
      <small>Isso pode levar alguns segundos na primeira vez</small>
    </div>
  );

  const quiz    = aula?.aula?.quiz || [];
  const questao = quiz[quizIdx];

  return (
    <div className="lesson-page">
      {/* Topbar */}
      <div className="lesson-topbar">
        <Link to={`/curso/${id}`} className="back-link">← Voltar ao curso</Link>
        <div className="lesson-breadcrumb">
          <span>{aula.moduloTitulo}</span>
          <span className="bc-sep">›</span>
          <span className="bc-current">{aula.aula.titulo}</span>
        </div>
      </div>

      <div className="lesson-container">
        {/* Abas */}
        <div className="lesson-tabs">
          {[
            { key: 'conteudo',  label: '📖 Aula' },
            { key: 'chat',      label: '💬 Perguntar' },
            { key: 'quiz',      label: `🧠 Quiz${quiz.length ? ` (${quiz.length})` : ''}` },
            { key: 'flashcards', label: `🃏 Flashcards${aula.aula.flashcards?.length ? ` (${aula.aula.flashcards.length})` : ''}` },
            ...(aula.area === 'idiomas' ? [{ key: 'pronuncia', label: '🎤 Pronúncia' }] : []),
          ].map(({ key, label }) => (
            <button
              key={key}
              className={`lesson-tab ${aba === key ? 'active' : ''}`}
              onClick={() => setAba(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="lesson-body">

          {/* ── CONTEÚDO ── */}
          {aba === 'conteudo' && (
            <div className="content-panel fade-in">
              <h1 className="lesson-title">{aula.aula.titulo}</h1>
              <div className="markdown-content">
                <ReactMarkdown>{aula.aula.conteudo}</ReactMarkdown>
              </div>
              {aula.aula.videoId && (
                <div className="video-section">
                  <div className="video-section-header">
                    <div className="video-label">Vídeo complementar</div>
                    {user?.isAdmin && (
                      <button
                        className="btn-trocar-video"
                        onClick={trocarVideo}
                        disabled={trocandoVideo}
                      >
                        {trocandoVideo
                          ? <><span className="spinner-inline" /> Buscando...</>
                          : '↺ Trocar vídeo'}
                      </button>
                    )}
                  </div>
                  <div className="video-wrapper">
                    <iframe
                      src={`https://www.youtube.com/embed/${aula.aula.videoId}`}
                      title={aula.aula.videoTitulo}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  {aula.aula.videoTitulo && (
                    <p className="video-titulo">{aula.aula.videoTitulo}</p>
                  )}
                </div>
              )}

              <div className="content-actions">
                {quiz.length > 0 ? (
                  <button className="btn-quiz-start" onClick={() => setAba('quiz')}>
                    🧠 Fazer o quiz desta aula →
                  </button>
                ) : (
                  <button className="btn-concluir" onClick={concluirSemQuiz}>
                    ✅ Marcar como concluída
                  </button>
                )}
                <button className="btn-chat-open" onClick={() => setAba('chat')}>
                  💬 Tenho uma dúvida
                </button>
              </div>
            </div>
          )}

          {/* ── CHAT ── */}
          {aba === 'chat' && (
            <div className="chat-panel fade-in">
              <div className="chat-header">
                <div className="instrutor-badge">
                  <span className="instrutor-icon">🤖</span>
                  <div>
                    <strong>Instrutor IA</strong>
                    <small>Especialista neste conteúdo</small>
                  </div>
                </div>
              </div>

              <div className="chat-messages">
                {chatMsgs.length === 0 && (
                  <div className="chat-empty">
                    <p>Olá! Pode perguntar o que quiser sobre esta aula.</p>
                    <div className="sugestoes">
                      {[
                        'Pode explicar melhor este conceito?',
                        'Dê um exemplo prático',
                        'Como isso se aplica no dia a dia?',
                      ].map((s) => (
                        <button key={s} className="sugestao" onClick={() => setMensagem(s)}>{s}</button>
                      ))}
                    </div>
                  </div>
                )}

                {chatMsgs.map((msg, i) => (
                  <div key={i} className={`msg ${msg.role}`}>
                    {msg.role === 'assistant' && <span className="msg-avatar">🤖</span>}
                    <div className="msg-bubble">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                ))}

                {chatLoading && (
                  <div className="msg assistant">
                    <span className="msg-avatar">🤖</span>
                    <div className="msg-bubble typing">
                      <span /><span /><span />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={sendChat} className="chat-form">
                <input
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  placeholder="Digite sua dúvida..."
                  disabled={chatLoading}
                />
                <button type="submit" disabled={chatLoading || !mensagem.trim()}>↑</button>
              </form>
            </div>
          )}

          {/* ── QUIZ ── */}
          {aba === 'quiz' && (
            <div className="quiz-panel fade-in">
              <div className="quiz-panel-header">
                <button
                  className="btn-regenerar"
                  onClick={regenerarQuiz}
                  disabled={regenerando}
                  title="Gerar novas perguntas para esta aula"
                >
                  {regenerando ? <><span className="spinner-inline" /> Gerando...</> : '↺ Novo quiz'}
                </button>
              </div>
              {quiz.length === 0 ? (
                <div className="no-quiz">
                  <p>🎯 Esta aula não tem quiz.</p>
                  <button className="btn-concluir" onClick={concluirSemQuiz}>✅ Concluir aula</button>
                </div>
              ) : quizFinalizado ? (
                <div className="quiz-result">
                  <div className="result-icon">
                    {acertos === quiz.length ? '🏆' : acertos >= quiz.length / 2 ? '👍' : '📚'}
                  </div>
                  <h2>{acertos}/{quiz.length} acertos</h2>
                  <div className="result-pct">{Math.round((acertos / quiz.length) * 100)}% de acerto</div>
                  <p className="result-msg">
                    {acertos === quiz.length
                      ? 'Perfeito! Você dominou este conteúdo.'
                      : acertos >= quiz.length / 2
                      ? 'Bom trabalho! Continue assim.'
                      : 'Releia a aula e tente novamente!'}
                  </p>
                  <div className="result-actions">
                    <button onClick={() => navigate(`/curso/${id}`)} className="btn-primary">
                      Voltar ao curso
                    </button>
                    <button onClick={reiniciarQuiz} className="btn-retry">
                      ↺ Tentar novamente
                    </button>
                  </div>
                </div>
              ) : (
                <div className="quiz-question">
                  <div className="quiz-progress-bar">
                    <div className="quiz-progress-fill" style={{ width: `${(quizIdx / quiz.length) * 100}%` }} />
                  </div>
                  <div className="quiz-counter-row">
                    <span className="quiz-counter">Questão {quizIdx + 1} de {quiz.length}</span>
                    <span className={`quiz-tipo-badge tipo-${questao.tipo || 'multipla_escolha'}`}>
                      {questao.tipo === 'verdadeiro_falso' && 'V ou F'}
                      {questao.tipo === 'discursiva' && 'Discursiva'}
                      {(!questao.tipo || questao.tipo === 'multipla_escolha') && 'Múltipla Escolha'}
                    </span>
                  </div>
                  <h2 className="quiz-pergunta">{questao.pergunta}</h2>

                  {/* ── Discursiva ── */}
                  {questao.tipo === 'discursiva' ? (
                    <div className="quiz-discursiva">
                      {!correcaoIA ? (
                        <>
                          <textarea
                            className="discursiva-input"
                            value={respostaDigitada}
                            onChange={(e) => setRespostaDigitada(e.target.value)}
                            placeholder="Escreva sua resposta aqui com o máximo de detalhes que conseguir..."
                            rows={5}
                            disabled={correcaoLoading}
                          />
                          <button
                            className="btn-ver-gabarito"
                            onClick={enviarParaCorrecao}
                            disabled={!respostaDigitada.trim() || correcaoLoading}
                          >
                            {correcaoLoading ? (
                              <><span className="spinner-inline" /> Corrigindo...</>
                            ) : 'Enviar para correção →'}
                          </button>
                        </>
                      ) : (
                        <div className="gabarito-reveal">
                          <div className={`correcao-nota ${correcaoIA.acertou ? 'aprovado' : 'reprovado'}`}>
                            <span className="nota-numero">{correcaoIA.nota}</span>
                            <span className="nota-label">/ 100</span>
                            <span className="nota-status">{correcaoIA.acertou ? '✓ Aprovado' : '✗ Insuficiente'}</span>
                          </div>

                          <div className="correcao-feedback">
                            <strong>Feedback da IA:</strong>
                            <p>{correcaoIA.feedback}</p>
                          </div>

                          {correcaoIA.pontos_acertados?.length > 0 && (
                            <div className="correcao-pontos acertados">
                              <strong>O que você acertou:</strong>
                              <ul>{correcaoIA.pontos_acertados.map((p, i) => <li key={i}>{p}</li>)}</ul>
                            </div>
                          )}

                          {correcaoIA.pontos_perdidos?.length > 0 && (
                            <div className="correcao-pontos perdidos">
                              <strong>O que faltou:</strong>
                              <ul>{correcaoIA.pontos_perdidos.map((p, i) => <li key={i}>{p}</li>)}</ul>
                            </div>
                          )}

                          <button className="btn-next" onClick={avancarAposCorrecao}>
                            {quizIdx + 1 < quiz.length ? 'Próxima →' : 'Ver resultado →'}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* ── Múltipla Escolha e Verdadeiro/Falso ── */
                    <>
                      <div className="quiz-options">
                        {questao.opcoes.map((op, i) => {
                          let cls = 'quiz-option';
                          if (respondido) {
                            if (i === questao.correta) cls += ' correct';
                            else if (i === escolhido)  cls += ' wrong';
                          }
                          const letra = questao.tipo === 'verdadeiro_falso'
                            ? (i === 0 ? 'V' : 'F')
                            : ['A', 'B', 'C', 'D'][i];
                          return (
                            <button
                              key={i}
                              className={cls}
                              onClick={() => responderQuiz(i)}
                              disabled={respondido}
                            >
                              <span className="option-letter">{letra}</span>
                              {op}
                            </button>
                          );
                        })}
                      </div>

                      {respondido && (
                        <div className={`quiz-feedback ${escolhido === questao.correta ? 'correct' : 'wrong'}`}>
                          <strong>{escolhido === questao.correta ? '✓ Correto!' : '✗ Incorreto.'}</strong>
                          {' '}{questao.explicacao}
                          <button className="btn-next" onClick={proximaQuestao}>
                            {quizIdx + 1 < quiz.length ? 'Próxima →' : 'Ver resultado →'}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}


          {/* ── FLASHCARDS ── */}
          {aba === 'flashcards' && (
            <Flashcards flashcards={aula.aula.flashcards || []} />
          )}

          {/* ── PRONÚNCIA ── */}
          {aba === 'pronuncia' && (
            <PronunciationPractice
              conteudo={aula.aula.conteudo}
              cursoTitulo={aula.cursoTitulo}
            />
          )}

        </div>
      </div>
    </div>
  );
}
