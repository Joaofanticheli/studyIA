import { useState, useRef } from 'react';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

function detectarIdioma(cursoTitulo) {
  const t = (cursoTitulo || '').toLowerCase();
  if (t.includes('inglês') || t.includes('ingles') || t.includes('english')) return 'en-US';
  if (t.includes('espanhol') || t.includes('spanish') || t.includes('español')) return 'es-ES';
  if (t.includes('francês') || t.includes('frances') || t.includes('français')) return 'fr-FR';
  if (t.includes('alemão') || t.includes('alemao') || t.includes('deutsch')) return 'de-DE';
  if (t.includes('italiano') || t.includes('italian')) return 'it-IT';
  if (t.includes('japonês') || t.includes('japones') || t.includes('japanese')) return 'ja-JP';
  if (t.includes('chinês') || t.includes('chines') || t.includes('mandarim')) return 'zh-CN';
  return 'en-US';
}

function extrairFrases(conteudo) {
  if (!conteudo) return [];
  const frases = new Set();

  const bold = conteudo.match(/\*\*([^*\n]{2,60})\*\*/g) || [];
  bold.forEach(b => frases.add(b.replace(/\*\*/g, '').trim()));

  const quoted = conteudo.match(/"([^"\n]{3,80})"/g) || [];
  quoted.forEach(q => frases.add(q.replace(/"/g, '').trim()));

  const bullets = conteudo.match(/^[-*]\s+(.{5,70})$/gm) || [];
  bullets.forEach(b => frases.add(b.replace(/^[-*]\s+/, '').trim()));

  return [...frases].filter(f => f.length >= 3 && f.length <= 80).slice(0, 12);
}

function calcularSimilaridade(original, falado) {
  const norm = s => s.toLowerCase().replace(/[^\w\s]/g, '').trim();
  const wordsA = norm(original).split(/\s+/);
  const wordsB = norm(falado).split(/\s+/);
  const acertos = wordsA.filter(w => wordsB.includes(w)).length;
  return Math.round((acertos / Math.max(wordsA.length, wordsB.length)) * 100);
}

export default function PronunciationPractice({ conteudo, cursoTitulo }) {
  const [fraseSelecionada, setFraseSelecionada] = useState(null);
  const [gravando, setGravando] = useState(false);
  const [resultados, setResultados] = useState({});
  const recognitionRef = useRef(null);

  const idioma = detectarIdioma(cursoTitulo);
  const frases = extrairFrases(conteudo);

  const ouvir = (frase) => {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(frase);
    utter.lang = idioma;
    utter.rate = 0.82;
    window.speechSynthesis.speak(utter);
  };

  const praticar = (frase) => {
    if (!SpeechRecognition) {
      alert('Reconhecimento de voz não suportado. Use o Chrome ou Edge.');
      return;
    }

    if (gravando && fraseSelecionada === frase) {
      recognitionRef.current?.stop();
      return;
    }

    setFraseSelecionada(frase);
    setGravando(true);

    const recognition = new SpeechRecognition();
    recognition.lang = idioma;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onresult = (e) => {
      const texto = e.results[0][0].transcript;
      const pct = calcularSimilaridade(frase, texto);
      setResultados(prev => ({ ...prev, [frase]: { texto, pct } }));
      setGravando(false);
    };

    recognition.onerror = () => setGravando(false);
    recognition.onend   = () => setGravando(false);

    recognition.start();
  };

  if (frases.length === 0) {
    return (
      <div className="pronunc-empty">
        <span>🎤</span>
        <p>Nenhuma frase identificada para praticar nesta aula.</p>
      </div>
    );
  }

  return (
    <div className="pronunc-panel fade-in">
      <div className="pronunc-header">
        <h3>🎤 Prática de Pronúncia</h3>
        <p>Clique em 🔊 para ouvir e em <strong>Falar</strong> para praticar</p>
        {!SpeechRecognition && (
          <div className="pronunc-aviso">⚠️ Para usar o microfone, abra no Chrome ou Edge.</div>
        )}
      </div>

      <div className="pronunc-list">
        {frases.map((frase, i) => {
          const res = resultados[frase];
          const estaGravando = gravando && fraseSelecionada === frase;
          return (
            <div key={i} className={`pronunc-item ${fraseSelecionada === frase ? 'selected' : ''}`}>
              <div className="pronunc-top">
                <span className="pronunc-text">{frase}</span>
                <div className="pronunc-btns">
                  <button className="btn-ouvir" onClick={() => ouvir(frase)} title="Ouvir pronúncia">
                    🔊
                  </button>
                  <button
                    className={`btn-falar ${estaGravando ? 'gravando' : ''}`}
                    onClick={() => praticar(frase)}
                  >
                    {estaGravando ? '⏹ Parar' : '🎤 Falar'}
                  </button>
                </div>
              </div>

              {res && (
                <div className={`pronunc-resultado ${res.pct >= 70 ? 'bom' : res.pct >= 40 ? 'medio' : 'fraco'}`}>
                  <div className="res-pct">{res.pct}%</div>
                  <div className="res-info">
                    <span className="res-label">
                      {res.pct >= 70 ? '✓ Ótimo!' : res.pct >= 40 ? '~ Quase lá!' : '✗ Tente novamente'}
                    </span>
                    <span className="res-texto">Você disse: "{res.texto}"</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
