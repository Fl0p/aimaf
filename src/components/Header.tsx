import { Link } from 'react-router-dom';
import './Header.css';

interface HeaderProps {
  onStart?: () => void;
  onStatus?: () => void;
  onRound?: () => void;
  onToggleDayNight?: () => void;
  isDay?: boolean;
  showBack?: boolean;
  disableSettings?: boolean;
  disableStart?: boolean;
  disableDayNight?: boolean;
}

export function Header({ onStart, onStatus, onRound, onToggleDayNight, isDay, showBack, disableSettings, disableStart, disableDayNight }: HeaderProps) {
  return (
    <header className="header">
      <Link to="/" className="header-logo">AIMAF</Link>
      {!showBack && (
        <div className="header-center">
          <button 
            className="header-btn" 
            onClick={onStart} 
            disabled={disableStart}
          >
            Start
          </button>
          <button className="header-btn header-btn-debug" onClick={onStatus}>
            Status
          </button>
          <button className="header-btn header-btn-debug" onClick={onRound}>
            Round
          </button>
          <button 
            className="header-btn header-btn-debug" 
            onClick={onToggleDayNight}
            disabled={disableDayNight}
          >
            {isDay ? 'Night' : 'Day'}
          </button>
        </div>
      )}
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
