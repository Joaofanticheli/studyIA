import { useState, useEffect } from 'react';
import './Flashcards.css';

export default function Flashcards({ flashcards }) {
  const [queue, setQueue] = useState([]);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);
  const [stats, setStats] = useState({ facil: 0, bom: 0, dificil: 0 });

  useEffect(() => {
    if (flashcards.length > 0) {
      setQueue([...flashcards]);
      setFlipped(false);
      setDone(false);
      setStats({ facil: 0, bom: 0, dificil: 0 });
    }
  }, [flashcards]);

  if (!flashcards.length) {
    return (
      <div className="fc-empty fade-in">
        <p>Nenhum flashcard disponível para esta aula.</p>
      </div>
    );
  }

  const reiniciar = () => {
    setQueue([...flashcards]);
    setFlipped(false);
    setDone(false);
    setStats({ facil: 0, bom: 0, dificil: 0 });
  };

  if (done) {
    const total = flashcards.length;
    return (
      <div className="fc-done fade-in">
        <div className="fc-done-icon">🎉</div>
        <h2>Revisão concluída!</h2>
        <p>Você revisou todos os {total} flashcards desta aula.</p>
        <div className="fc-stats">
          <div className="fc-stat facil">
            <span className="fc-stat-num">{stats.facil}</span>
            <span>Fácil</span>
          </div>
          <div className="fc-stat bom">
            <span className="fc-stat-num">{stats.bom}</span>
            <span>Bom</span>
          </div>
          <div className="fc-stat dificil">
            <span className="fc-stat-num">{stats.dificil}</span>
            <span>Difícil</span>
          </div>
        </div>
        {stats.dificil > 0 && (
          <p className="fc-tip">Você marcou {stats.dificil} card{stats.dificil !== 1 ? 's' : ''} como difícil. Revise novamente para fixar melhor!</p>
        )}
        <button className="fc-btn-reiniciar" onClick={reiniciar}>↺ Revisar novamente</button>
      </div>
    );
  }

  const card = queue[0];
  const restantes = queue.length;

  const avaliar = (avaliacao) => {
    if (!flipped) return;
    setStats(prev => ({ ...prev, [avaliacao]: prev[avaliacao] + 1 }));
    setFlipped(false);
    setQueue(prev => {
      const [current, ...resto] = prev;
      if (avaliacao === 'dificil') return [...resto, current];
      return resto.length === 0 ? [] : resto;
    });
    if (avaliacao !== 'dificil' && restantes === 1) setDone(true);
  };

  return (
    <div className="fc-container fade-in">
      <div className="fc-header">
        <span className="fc-counter">{flashcards.length - restantes + 1} / {flashcards.length}</span>
        <div className="fc-progress-track">
          <div
            className="fc-progress-fill"
            style={{ width: `${((flashcards.length - restantes) / flashcards.length) * 100}%` }}
          />
        </div>
        <span className="fc-restantes">{restantes} restante{restantes !== 1 ? 's' : ''}</span>
      </div>

      <div className={`fc-card ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(f => !f)}>
        <div className="fc-card-inner">
          <div className="fc-card-front">
            <span className="fc-label">Pergunta</span>
            <p className="fc-text">{card?.frente}</p>
            <span className="fc-hint">Clique para ver a resposta</span>
          </div>
          <div className="fc-card-back">
            <span className="fc-label verso">Resposta</span>
            <p className="fc-text">{card?.verso}</p>
          </div>
        </div>
      </div>

      {flipped ? (
        <div className="fc-actions fade-in">
          <p className="fc-avaliar-label">Como você se saiu?</p>
          <div className="fc-btns">
            <button className="fc-btn dificil" onClick={() => avaliar('dificil')}>
              😓 Difícil<small>Revisar novamente</small>
            </button>
            <button className="fc-btn bom" onClick={() => avaliar('bom')}>
              🙂 Bom<small>Lembrei com esforço</small>
            </button>
            <button className="fc-btn facil" onClick={() => avaliar('facil')}>
              😄 Fácil<small>Lembrei na hora</small>
            </button>
          </div>
        </div>
      ) : (
        <p className="fc-flip-hint">Clique no card para revelar a resposta</p>
      )}
    </div>
  );
}
