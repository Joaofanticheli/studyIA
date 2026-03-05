import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <span className="brand-icon">🧠</span>
        <span className="brand-name">StudyIA</span>
      </Link>

      <div className="navbar-center">
        <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
          Meus Cursos
        </Link>
        <Link to="/criar" className={`nav-link ${isActive('/criar') ? 'active' : ''}`}>
          + Novo Curso
        </Link>
      </div>

      <div className="navbar-right">
        {user?.streak > 0 && (
          <div className="streak-badge" title={`${user.streak} dia${user.streak !== 1 ? 's' : ''} seguido${user.streak !== 1 ? 's' : ''} estudando`}>
            🔥 {user.streak}
          </div>
        )}
        <div className="user-avatar">
          {user?.nome?.charAt(0).toUpperCase()}
        </div>
        <span className="user-name">{user?.nome?.split(' ')[0]}</span>
        <button onClick={handleLogout} className="logout-btn">Sair</button>
      </div>
    </nav>
  );
}
