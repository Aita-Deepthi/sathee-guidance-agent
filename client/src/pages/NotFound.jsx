import { Link } from 'react-router-dom';
import { IconLogo, IconArrowLeft } from '../components/Icons';

export default function NotFound() {
  return (
    <div className="notfound">
      <IconLogo size={36} />
      <div className="overline mt-6">Error 404</div>
      <h1>Page not found</h1>
      <p className="muted">The page you're looking for doesn't exist or has moved.</p>
      <Link className="btn btn-secondary mt-4" to="/"><IconArrowLeft /> Back to home</Link>
    </div>
  );
}
