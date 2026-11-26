import { Link } from 'react-router-dom';
import { IconAlertCircle, IconRefresh } from './Icons';

export function EmptyState({ icon, title, text, action, to, onAction, compact = false }) {
  return (
    <div className={`empty ${compact ? 'compact' : ''}`}>
      {icon && <div className="empty-icon">{icon}</div>}
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action && to && <Link className="btn btn-secondary btn-sm" to={to}>{action}</Link>}
      {action && onAction && !to && <button type="button" className="btn btn-secondary btn-sm" onClick={onAction}>{action}</button>}
    </div>
  );
}

export function ErrorState({ message, onRetry, title = 'This section could not be loaded' }) {
  return (
    <div className="alert alert-danger" role="alert">
      <IconAlertCircle />
      <div className="alert-body">
        <div className="alert-title">{title}</div>
        <div>{message}</div>
      </div>
      {onRetry && (
        <div className="alert-actions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}><IconRefresh /> Try again</button>
        </div>
      )}
    </div>
  );
}
