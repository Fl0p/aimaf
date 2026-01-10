import { Link } from 'react-router-dom';
import './Header.css';

interface HeaderProps {
  onStart?: () => void;
  onTest1?: () => void;
  onTest2?: () => void;
  onTest3?: () => void;
  showBack?: boolean;
  disableSettings?: boolean;
  disableStart?: boolean;
}

export function Header({ onStart, onTest1, onTest2, onTest3, showBack, disableSettings, disableStart }: HeaderProps) {
  return (
    <header className="header">
      <Link to="/" className="header-logo">AIMAF</Link>
      <div className="header-center">
        <button 
          className="header-btn" 
          onClick={onStart} 
          disabled={disableStart}
        >
          Start
        </button>
        <button className="header-btn header-btn-debug" onClick={onTest1}>
          Test1
        </button>
        <button className="header-btn header-btn-debug" onClick={onTest2}>
          Test2
        </button>
        <button className="header-btn header-btn-debug" onClick={onTest3}>
          Test3
        </button>
      </div>
      <div className="header-actions">
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
