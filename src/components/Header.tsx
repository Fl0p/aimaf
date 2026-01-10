import { Link } from 'react-router-dom';
import './Header.css';

interface HeaderProps {
  onStart?: () => void;
  showBack?: boolean;
  disableSettings?: boolean;
  disableStart?: boolean;
}

export function Header({ onStart, showBack, disableSettings, disableStart }: HeaderProps) {
  return (
    <header className="header">
      <Link to="/" className="header-logo">AIMAF</Link>
      <div className="header-actions">
        {onStart !== undefined && (
          <button 
            className="header-start" 
            onClick={onStart} 
            disabled={disableStart}
          >
            Start
          </button>
        )}
        {showBack ? (
          <Link to="/" className="header-back">← Back</Link>
        ) : (
          disableSettings ? (
            <span className="header-settings disabled">Settings</span>
          ) : (
            <Link to="/settings" className="header-settings">Settings</Link>
          )
        )}
      </div>
    </header>
  );
}
