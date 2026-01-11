import { Link } from 'react-router-dom';
import { GamePhase } from '../types';
import './Header.css';

interface HeaderProps {
  onNext?: () => void;
  gamePhase?: GamePhase;
  showBack?: boolean;
  disableSettings?: boolean;
  disableNext?: boolean;
}

export function Header({ onNext, gamePhase, showBack, disableSettings, disableNext }: HeaderProps) {
  return (
    <header className="header">
      <Link to="/" className="header-logo">AIMAF</Link>
      {!showBack && (
        <div className="header-center">
          {gamePhase && (
            <span className="header-phase">Current Phase: {gamePhase.toUpperCase()}</span>
          )}
          <button 
            className="header-btn header-next-btn" 
            onClick={onNext}
            disabled={disableNext}
          >
            Next Phase
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
