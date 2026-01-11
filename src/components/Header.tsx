import { Link } from 'react-router-dom';
import { GamePhase, GameState } from '../types';
import './Header.css';

interface HeaderProps {
  onNext?: () => void;
  onRestart?: () => void;
  gamePhase?: GamePhase;
  gameState?: GameState;
  showBack?: boolean;
  disableSettings?: boolean;
  disableNext?: boolean;
  autoPlay?: boolean;
  onAutoPlayChange?: (enabled: boolean) => void;
}

export function Header({ onNext, onRestart, gamePhase, gameState, showBack, disableSettings, disableNext, autoPlay, onAutoPlayChange }: HeaderProps) {
  const isGameEnded = gameState === GameState.Ended;
  
  return (
    <header className="header">
      <Link to="/" className="header-logo">AIMAF</Link>
      {!showBack && (
        <div className="header-center">
          {isGameEnded ? (
            <button 
              className="header-btn header-restart-btn" 
              onClick={onRestart}
            >
              Restart Game
            </button>
          ) : (
            <>
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
              <label className="header-autoplay">
                <input 
                  type="checkbox" 
                  checked={autoPlay}
                  onChange={(e) => onAutoPlayChange?.(e.target.checked)}
                />
                <span>Auto Play</span>
              </label>
            </>
          )}
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
