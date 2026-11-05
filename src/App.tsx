import { Link, Route, Routes } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { AlarmPage } from './pages/AlarmPage';
import { CountdownPage } from './pages/CountdownPage';
import { HomePage } from './pages/HomePage';
import { StopwatchPage } from './pages/StopwatchPage';
import { StudyTimerPage } from './pages/StudyTimerPage';
import { TimerPage } from './pages/TimerPage';

function NotFoundPage() {
  return (
    <div className="py-16 text-center">
      <p className="label">404</p>
      <h1 className="mt-2 text-hero font-semibold text-ink">This page isn’t on the deck</h1>
      <p className="mx-auto mt-2 max-w-sm text-body text-muted">
        The address you opened does not exist. Head back to the flip clock to keep time.
      </p>
      <Link to="/" className="btn btn-primary mt-6 h-10 px-5">
        Back to the clock
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="stopwatch" element={<StopwatchPage />} />
        <Route path="timer" element={<TimerPage />} />
        <Route path="countdown" element={<CountdownPage />} />
        <Route path="alarm" element={<AlarmPage />} />
        <Route path="study-timer" element={<StudyTimerPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
