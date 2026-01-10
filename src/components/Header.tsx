import { Link } from 'react-router-dom';
import './Header.css';

interface HeaderProps {
  onStart?: () => void;
  showBack?: boolean;
}

export function Header({ onStart, showBack }: HeaderProps) {
  return (
    <header className="header">
      <Link to="/" className="header-logo">AIMAF</Link>
      <div className="header-actions">
        {onStart && (
          <button className="header-start" onClick={onStart}>
            Start
          </button>
        )}
        {showBack ? (
          <Link to="/" className="header-back">← Back</Link>
        ) : (
          <Link to="/settings" className="header-settings">Settings</Link>
        )}
      </div>
    </header>
  );
}
