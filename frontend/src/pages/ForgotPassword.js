import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './Auth.css';

export default function ForgotPassword() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro]       = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return setErro('Informe seu email');
    setErro('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email: email.trim() });
      setMensagem(data.message);
    } catch (err) {
      setErro(err.response?.data?.message || 'Erro ao processar solicitação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-orbs">
        <div className="orb orb1" />
        <div className="orb orb2" />
      </div>
      <div className="auth-card fade-in">
        <div className="auth-logo">🧠</div>
        <h1 className="auth-title">Recuperar senha</h1>
        <p className="auth-subtitle">Digite seu email e enviaremos um link para redefinir sua senha</p>

        {mensagem ? (
          <div className="auth-success">
            <span>✉️</span>
            <p>{mensagem}</p>
            <Link to="/login" className="btn-primary auth-btn" style={{ marginTop: '16px', display: 'block', textAlign: 'center', textDecoration: 'none' }}>
              Voltar ao login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            {erro && <div className="auth-error">{erro}</div>}
            <div className="form-field">
              <label>Email</label>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoFocus
                required
              />
            </div>
            <button type="submit" className="btn-primary auth-btn" disabled={loading}>
              {loading ? <><span className="spinner" /> Enviando...</> : 'Enviar link de recuperação'}
            </button>
          </form>
        )}

        <p className="auth-link">
          <Link to="/login">← Voltar ao login</Link>
        </p>
      </div>
    </div>
  );
}
