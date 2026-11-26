import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { PageSkeleton } from './components/ui/Skeleton.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AppLayout from './layouts/AppLayout.jsx';
import { useAuth } from './context/AuthContext.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import StudyPlan from './pages/StudyPlan.jsx';
import Resources from './pages/Resources.jsx';
import DailyProgress from './pages/DailyProgress.jsx';
import MockTests from './pages/MockTests.jsx';
import TestAttempt from './pages/TestAttempt.jsx';
import TestResult from './pages/TestResult.jsx';
// Analytics uses the (large) charting library, so it is loaded only when opened
const Analytics = lazy(() => import('./pages/Analytics.jsx'));
// The assistant pulls in markdown + KaTeX rendering, so it is split out as well
const Assistant = lazy(() => import('./pages/Assistant.jsx'));
import Profile from './pages/Profile.jsx';
import NotFound from './pages/NotFound.jsx';

// Pages for logged-out visitors. Once logged in, go back to the page they wanted,
// or to the planner if they haven't set an exam date yet (new students).
function PublicOnly({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return children;
  const target = location.state?.from || (user.profile?.examDate ? '/dashboard' : '/plan');
  return <Navigate to={target} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicOnly><Landing /></PublicOnly>} />
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />

      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/assistant" element={<Suspense fallback={<PageSkeleton />}><Assistant /></Suspense>} />
        <Route path="/plan" element={<StudyPlan />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/progress" element={<DailyProgress />} />
        <Route path="/tests" element={<MockTests />} />
        <Route path="/tests/:id" element={<TestAttempt />} />
        <Route path="/results/:id" element={<TestResult />} />
        <Route path="/analytics" element={<Suspense fallback={<PageSkeleton variant="charts" />}><Analytics /></Suspense>} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
