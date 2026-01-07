import { Link } from 'react-router-dom';
import './Header.css';

export function Header() {
  return (
    <header className="header">
      <Link to="/" className="header-logo">AIMAF</Link>
      <Link to="/settings" className="header-settings">Settings</Link>
    </header>
  );
}
