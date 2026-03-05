const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const sendBrevoEmail = async ({ to, toName, subject, html }) => {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'StudyIA', email: process.env.BREVO_SENDER_EMAIL },
      to: [{ email: to, name: toName || to }],
      subject,
      htmlContent: html,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Erro ao enviar email');
};

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const register = async (req, res) => {
  try {
    const { nome, email, senha } = req.body;
    if (!nome || !email || !senha)
      return res.status(400).json({ message: 'Preencha todos os campos' });
    if (senha.length < 6)
      return res.status(400).json({ message: 'Senha deve ter ao menos 6 caracteres' });

    const existe = await User.findOne({ email });
    if (existe) return res.status(400).json({ message: 'Email já cadastrado' });

    const user = await User.create({ nome, email, senha });
    res.status(201).json({
      token: generateToken(user._id),
      user: { id: user._id, nome: user.nome, email: user.email, isAdmin: false, streak: 0 },
    });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao cadastrar' });
  }
};

const login = async (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha)
      return res.status(400).json({ message: 'Informe email e senha' });

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(senha)))
      return res.status(401).json({ message: 'Email ou senha incorretos' });

    res.json({
      token: generateToken(user._id),
      user: { id: user._id, nome: user.nome, email: user.email, isAdmin: user.isAdmin || false, streak: user.streak || 0 },
    });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao fazer login' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Sempre retorna sucesso para não revelar se o email existe
    if (!user) {
      return res.json({ message: 'Se esse email estiver cadastrado, você receberá as instruções em breve.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    await User.findByIdAndUpdate(user._id, {
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: Date.now() + 3600000, // 1 hora
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    await sendBrevoEmail({
      to: user.email,
      toName: user.nome,
      subject: 'Recuperação de senha — StudyIA',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; background: #0d0d1a; color: #e2e8f0; padding: 32px; border-radius: 12px;">
          <h2 style="color: #7c6ff7; margin-bottom: 8px;">🧠 StudyIA</h2>
          <h3 style="margin-bottom: 16px;">Recuperação de senha</h3>
          <p>Olá, <strong>${user.nome}</strong>!</p>
          <p>Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo:</p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background: #7c6ff7; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Redefinir minha senha</a>
          </div>
          <p style="color: #888; font-size: 0.85em;">Este link expira em 1 hora. Se você não solicitou, ignore este email.</p>
          <p style="color: #555; font-size: 0.78em;">Ou copie: ${resetUrl}</p>
        </div>
      `,
    });

    res.json({ message: 'Se esse email estiver cadastrado, você receberá as instruções em breve.' });
  } catch (err) {
    console.error('Erro em forgot password:', err.message);
    res.status(500).json({ message: 'Erro ao processar solicitação' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { novaSenha } = req.body;

    if (!novaSenha || novaSenha.trim().length < 6) {
      return res.status(400).json({ message: 'A nova senha deve ter no mínimo 6 caracteres' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: tokenHash,
      resetPasswordExpires: { $gt: Date.now() },
    }).select('+senha +resetPasswordToken +resetPasswordExpires');

    if (!user) {
      return res.status(400).json({ message: 'Token inválido ou expirado. Solicite um novo link.' });
    }

    user.senha = novaSenha;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Senha redefinida com sucesso! Faça login com sua nova senha.' });
  } catch (err) {
    console.error('Erro ao redefinir senha:', err);
    res.status(500).json({ message: 'Erro ao redefinir senha' });
  }
};

module.exports = { register, login, forgotPassword, resetPassword };
