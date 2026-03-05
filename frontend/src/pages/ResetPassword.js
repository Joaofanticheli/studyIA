import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import './Auth.css';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate  = useNavigate();
  const [form, setForm]       = useState({ novaSenha: '', confirmar: '' });
  const [loading, setLoading] = useState(false);
  const [erro, setErro]       = useState('');
  const [sucesso, setSucesso] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.novaSenha.length < 6) return setErro('A senha deve ter no mínimo 6 caracteres');
    if (form.novaSenha !== form.confirmar) return setErro('As senhas não coincidem');
    setErro('');
    setLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { novaSenha: form.novaSenha });
      setSucesso(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setErro(err.response?.data?.message || 'Erro ao redefinir senha');
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
        <h1 className="auth-title">Nova senha</h1>
        <p className="auth-subtitle">Escolha uma nova senha para sua conta</p>

        {sucesso ? (
          <div className="auth-success">
            <span>✅</span>
            <p>Senha redefinida com sucesso! Redirecionando para o login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            {erro && <div className="auth-error">{erro}</div>}
            <div className="form-field">
              <label>Nova senha</label>
              <input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={form.novaSenha}
                onChange={(e) => setForm({ ...form, novaSenha: e.target.value })}
                disabled={loading}
                autoFocus
                required
              />
            </div>
            <div className="form-field">
              <label>Confirmar nova senha</label>
              <input
                type="password"
                placeholder="Repita a senha"
                value={form.confirmar}
                onChange={(e) => setForm({ ...form, confirmar: e.target.value })}
                disabled={loading}
                required
              />
            </div>
            <button type="submit" className="btn-primary auth-btn" disabled={loading}>
              {loading ? <><span className="spinner" /> Salvando...</> : 'Redefinir senha'}
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
