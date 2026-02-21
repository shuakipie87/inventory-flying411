import { Link } from 'react-router-dom';
import { Plane } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-5">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-6 border border-slate-100">
          <Plane className="text-slate-300" size={28} strokeWidth={1} />
        </div>
        <h1 className="text-6xl font-serif text-navy-900 mb-3">404</h1>
        <p className="text-lg text-slate-500 mb-2">Page not found</p>
        <p className="text-sm text-slate-400 mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/dashboard" className="btn btn-primary px-8 py-3">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
