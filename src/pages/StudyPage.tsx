import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  Coffee,
  Pause,
  Play,
  Plus,
  RotateCcw,
  SkipForward,
  Sparkles,
  Target,
  Timer,
  Trash2,
  X,
} from 'lucide-react';
import { FlipCard, FlipColon } from '../components/FlipCard';
import type { AppSettings, StudySessionRecord, StudyTask } from '../types';
import {
  playFocusTick,
  playSoundOnce,
  sendDesktopNotification,
} from '../utils/soundEngine';
import { readStorage, writeStorage } from '../utils/storage';
import { getLanguageMeta, getStrings } from '../i18n';

interface StudyPageProps {
  settings: AppSettings;
  onShowToast?: (msg: string) => void;
}

type SessionMode = 'work' | 'shortBreak' | 'longBreak';
type StatsRange = '7' | '30' | 'year';

const TASKS_STORAGE_KEY = 'splitflap_study_tasks_v2';
const HISTORY_STORAGE_KEY = 'splitflap_study_history_v2';
const STUDY_STATE_KEY = 'splitflap_study_state_v2';
const MAX_ESTIMATE = 10;

interface PersistedStudyState {
  mode: SessionMode;
  durationSec: number;
  remainingMs: number;
  endAt: number;
  running: boolean;
  cycleCompleted: number;
  activeTaskId: string | null;
}

function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDurationMinutes(totalMin: number): string {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  return `${m}m`;
}

export const StudyPage: React.FC<StudyPageProps> = ({ settings, onShowToast }) => {
  const t = getStrings(settings.language);
  const langMeta = getLanguageMeta(settings.language);
  const isAr = settings.language === 'ar';

  const durationForMode = useCallback(
    (m: SessionMode) => {
      if (m === 'work') return settings.studyWorkMin * 60;
      if (m === 'shortBreak') return settings.studyShortBreakMin * 60;
      return settings.studyLongBreakMin * 60;
    },
    [settings.studyWorkMin, settings.studyShortBreakMin, settings.studyLongBreakMin]
  );

  const initialStudy = useMemo(() => {
    const defaultDur = settings.studyWorkMin * 60;
    const saved = readStorage<PersistedStudyState | null>(STUDY_STATE_KEY, null);
    if (!saved) {
      return {
        mode: 'work' as SessionMode,
        secondsLeft: defaultDur,
        remainingMs: defaultDur * 1000,
        endAt: 0,
        running: false,
        cycleCompleted: 0,
        activeTaskId: null as string | null,
        expiredWhileAway: false,
      };
    }
    const m: SessionMode =
      saved.mode === 'shortBreak' || saved.mode === 'longBreak' ? saved.mode : 'work';
    const modeDur =
      m === 'work'
        ? settings.studyWorkMin * 60
        : m === 'shortBreak'
        ? settings.studyShortBreakMin * 60
        : settings.studyLongBreakMin * 60;

    if (saved.running && saved.endAt > 0) {
      const leftMs = saved.endAt - Date.now();
      if (leftMs > 0) {
        return {
          mode: m,
          secondsLeft: Math.max(1, Math.ceil(leftMs / 1000)),
          remainingMs: leftMs,
          endAt: saved.endAt,
          running: true,
          cycleCompleted: Math.max(0, Number(saved.cycleCompleted) || 0),
          activeTaskId: saved.activeTaskId ?? null,
          expiredWhileAway: false,
        };
      }
      return {
        mode: m,
        secondsLeft: 0,
        remainingMs: 0,
        endAt: 0,
        running: false,
        cycleCompleted: Math.max(0, Number(saved.cycleCompleted) || 0),
        activeTaskId: saved.activeTaskId ?? null,
        expiredWhileAway: true,
      };
    }

    const remMs =
      typeof saved.remainingMs === 'number' && saved.remainingMs > 0
        ? Math.min(modeDur * 1000, saved.remainingMs)
        : modeDur * 1000;
    return {
      mode: m,
      secondsLeft: Math.max(1, Math.ceil(remMs / 1000)),
      remainingMs: remMs,
      endAt: 0,
      running: false,
      cycleCompleted: Math.max(0, Number(saved.cycleCompleted) || 0),
      activeTaskId: saved.activeTaskId ?? null,
      expiredWhileAway: false,
    };
  }, [settings.studyWorkMin, settings.studyShortBreakMin, settings.studyLongBreakMin]);

  const [mode, setMode] = useState<SessionMode>(initialStudy.mode);
  const [secondsLeft, setSecondsLeft] = useState<number>(initialStudy.secondsLeft);
  const [running, setRunning] = useState<boolean>(initialStudy.running);
  const [cycleCompleted, setCycleCompleted] = useState<number>(initialStudy.cycleCompleted);

  const [tasks, setTasks] = useState<StudyTask[]>(() =>
    readStorage<StudyTask[]>(TASKS_STORAGE_KEY, [])
  );
  const [activeTaskId, setActiveTaskId] = useState<string | null>(initialStudy.activeTaskId);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskEst, setNewTaskEst] = useState(1);

  const [history, setHistory] = useState<StudySessionRecord[]>(() =>
    readStorage<StudySessionRecord[]>(HISTORY_STORAGE_KEY, [])
  );
  const [statsOpen, setStatsOpen] = useState(false);
  const [statsRange, setStatsRange] = useState<StatsRange>('7');
  const [confirmClear, setConfirmClear] = useState(false);

  const runningRef = useRef(running);
  runningRef.current = running;
  const endAtRef = useRef<number>(initialStudy.endAt);
  const remainingMsRef = useRef<number>(initialStudy.remainingMs);
  const lastTickSecRef = useRef<number>(initialStudy.secondsLeft);
  const prevDurationsRef = useRef({
    work: settings.studyWorkMin,
    shortBreak: settings.studyShortBreakMin,
    longBreak: settings.studyLongBreakMin,
  });

  const persistStudyState = useCallback(
    (
      nextMode: SessionMode,
      nextDurSec: number,
      nextRemMs: number,
      nextEndAt: number,
      nextRunning: boolean,
      nextCompleted: number,
      nextActiveTask: string | null
    ) => {
      writeStorage<PersistedStudyState>(STUDY_STATE_KEY, {
        mode: nextMode,
        durationSec: nextDurSec,
        remainingMs: Math.max(0, nextRemMs),
        endAt: nextEndAt,
        running: nextRunning,
        cycleCompleted: nextCompleted,
        activeTaskId: nextActiveTask,
      });
    },
    []
  );

  useEffect(() => {
    writeStorage(TASKS_STORAGE_KEY, tasks);
  }, [tasks]);

  useEffect(() => {
    writeStorage(HISTORY_STORAGE_KEY, history);
  }, [history]);

  // Persist activeTaskId updates immediately
  useEffect(() => {
    persistStudyState(
      mode,
      durationForMode(mode),
      runningRef.current ? Math.max(0, endAtRef.current - Date.now()) : remainingMsRef.current,
      endAtRef.current,
      runningRef.current,
      cycleCompleted,
      activeTaskId
    );
  }, [activeTaskId, mode, cycleCompleted, durationForMode, persistStudyState]);

  // Sync body[data-session] so Work=Red (#ff453a), ShortBreak=Green (#30d158), LongBreak=Blue (#64d2ff)
  useEffect(() => {
    document.body.dataset.session = mode;
    return () => {
      delete document.body.dataset.session;
    };
  }, [mode]);

  // Only update idle duration when user changes work/shortBreak/longBreak settings in SettingsDrawer
  useEffect(() => {
    const prev = prevDurationsRef.current;
    const changed =
      prev.work !== settings.studyWorkMin ||
      prev.shortBreak !== settings.studyShortBreakMin ||
      prev.longBreak !== settings.studyLongBreakMin;
    prevDurationsRef.current = {
      work: settings.studyWorkMin,
      shortBreak: settings.studyShortBreakMin,
      longBreak: settings.studyLongBreakMin,
    };
    if (changed && !runningRef.current) {
      const nextSec = durationForMode(mode);
      remainingMsRef.current = nextSec * 1000;
      endAtRef.current = 0;
      setSecondsLeft(nextSec);
      persistStudyState(mode, nextSec, nextSec * 1000, 0, false, cycleCompleted, activeTaskId);
    }
  }, [
    settings.studyWorkMin,
    settings.studyShortBreakMin,
    settings.studyLongBreakMin,
    mode,
    durationForMode,
    cycleCompleted,
    activeTaskId,
    persistStudyState,
  ]);

  const advanceSession = useCallback(
    (wasCompletedNaturally: boolean) => {
      if (wasCompletedNaturally && settings.soundEnabled) {
        playSoundOnce(settings.soundProfile, settings.volume);
      }

      if (mode === 'work') {
        const nextCount = wasCompletedNaturally ? cycleCompleted + 1 : cycleCompleted;
        if (wasCompletedNaturally) {
          setCycleCompleted(nextCount);
          const activeTask = tasks.find((tk) => tk.id === activeTaskId);
          setHistory((prev) => [
            ...prev,
            {
              id: `sess-${Date.now()}`,
              dateISO: todayKey(),
              timestamp: Date.now(),
              minutes: settings.studyWorkMin,
              taskTitle: activeTask?.title,
            },
          ]);

          if (activeTaskId) {
            setTasks((prev) =>
              prev.map((tk) => {
                if (tk.id !== activeTaskId) return tk;
                const nextDoneCount = tk.completedSessions + 1;
                const autoDone =
                  settings.studyAutoCheckTask && nextDoneCount >= tk.estSessions ? true : tk.done;
                return { ...tk, completedSessions: nextDoneCount, done: autoDone };
              })
            );
          }
        }

        const nextMode: SessionMode =
          nextCount > 0 && nextCount % settings.studySessionsBeforeLong === 0
            ? 'longBreak'
            : 'shortBreak';
        const nextDur = durationForMode(nextMode);
        const shouldRun = wasCompletedNaturally ? settings.studyAutoStartBreaks : false;
        const nextEnd = shouldRun ? Date.now() + nextDur * 1000 : 0;

        if (wasCompletedNaturally) {
          const msg = nextMode === 'longBreak' ? t.longBreak : t.shortBreak;
          onShowToast?.(msg);
          if (settings.studyDesktopNotifications) {
            sendDesktopNotification(t.headerStudy, msg);
          }
        }

        endAtRef.current = nextEnd;
        remainingMsRef.current = nextDur * 1000;
        lastTickSecRef.current = nextDur;
        setMode(nextMode);
        setSecondsLeft(nextDur);
        setRunning(shouldRun);
        persistStudyState(
          nextMode,
          nextDur,
          nextDur * 1000,
          nextEnd,
          shouldRun,
          nextCount,
          activeTaskId
        );
      } else {
        const nextDur = durationForMode('work');
        const shouldRun = wasCompletedNaturally ? settings.studyAutoStartWork : false;
        const nextEnd = shouldRun ? Date.now() + nextDur * 1000 : 0;

        if (wasCompletedNaturally) {
          onShowToast?.(t.workSession);
          if (settings.studyDesktopNotifications) {
            sendDesktopNotification(t.headerStudy, t.workSession);
          }
        }

        endAtRef.current = nextEnd;
        remainingMsRef.current = nextDur * 1000;
        lastTickSecRef.current = nextDur;
        setMode('work');
        setSecondsLeft(nextDur);
        setRunning(shouldRun);
        persistStudyState(
          'work',
          nextDur,
          nextDur * 1000,
          nextEnd,
          shouldRun,
          cycleCompleted,
          activeTaskId
        );
      }
    },
    [
      mode,
      cycleCompleted,
      tasks,
      activeTaskId,
      settings,
      durationForMode,
      onShowToast,
      persistStudyState,
      t.longBreak,
      t.shortBreak,
      t.headerStudy,
      t.workSession,
    ]
  );

  // If a running session expired while the tab was closed, advance once on mount
  const handledExpiredRef = useRef(false);
  useEffect(() => {
    if (initialStudy.expiredWhileAway && !handledExpiredRef.current) {
      handledExpiredRef.current = true;
      advanceSession(true);
    }
  }, [initialStudy.expiredWhileAway, advanceSession]);

  const toggleStudyRunning = useCallback(() => {
    const durSec = durationForMode(mode);
    if (runningRef.current) {
      const leftMs = Math.max(0, endAtRef.current - Date.now());
      endAtRef.current = 0;
      remainingMsRef.current = leftMs;
      setRunning(false);
      setSecondsLeft(Math.max(1, Math.ceil(leftMs / 1000)));
      persistStudyState(mode, durSec, leftMs, 0, false, cycleCompleted, activeTaskId);
    } else {
      const baseMs =
        remainingMsRef.current > 0 ? remainingMsRef.current : durSec * 1000;
      const nextEnd = Date.now() + baseMs;
      endAtRef.current = nextEnd;
      remainingMsRef.current = baseMs;
      lastTickSecRef.current = Math.ceil(baseMs / 1000);
      setSecondsLeft(Math.max(1, Math.ceil(baseMs / 1000)));
      setRunning(true);
      persistStudyState(mode, durSec, baseMs, nextEnd, true, cycleCompleted, activeTaskId);
    }
  }, [mode, durationForMode, cycleCompleted, activeTaskId, persistStudyState]);

  useEffect(() => {
    if (!running) return;
    if (!endAtRef.current) {
      endAtRef.current = Date.now() + Math.max(1000, secondsLeft * 1000);
    }

    const checkTick = () => {
      const leftMs = endAtRef.current - Date.now();
      if (leftMs <= 0) {
        advanceSession(true);
        return;
      }
      remainingMsRef.current = leftMs;
      const nextSec = Math.max(1, Math.ceil(leftMs / 1000));
      if (nextSec !== lastTickSecRef.current) {
        lastTickSecRef.current = nextSec;
        setSecondsLeft(nextSec);
        if (mode === 'work' && settings.studyTickingSound && !document.hidden) {
          playFocusTick(settings.volume);
        }
      }
    };

    checkTick();
    const id = window.setInterval(checkTick, 200);
    const onVis = () => {
      if (document.visibilityState === 'visible') checkTick();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [running, secondsLeft, mode, settings.studyTickingSound, settings.volume, advanceSession]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (statsOpen) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        toggleStudyRunning();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [statsOpen, toggleStudyRunning]);

  const totalSec = durationForMode(mode);
  const progress = totalSec > 0 ? Math.min(1, Math.max(0, 1 - secondsLeft / totalSec)) : 0;
  const minsStr = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secsStr = String(secondsLeft % 60).padStart(2, '0');
  const isPausedMidSession = !running && secondsLeft < totalSec;

  useEffect(() => {
    if (running || isPausedMidSession) {
      document.title = `${minsStr}:${secsStr} · ${t.headerStudy}`;
    } else {
      document.title = `${t.headerStudy} — Flip Clock`;
    }
    return () => {
      document.title = 'Flip Clock';
    };
  }, [running, isPausedMidSession, minsStr, secsStr, t.headerStudy]);

  const handleSelectMode = (next: SessionMode) => {
    if (running) return;
    const nextSec = durationForMode(next);
    endAtRef.current = 0;
    remainingMsRef.current = nextSec * 1000;
    lastTickSecRef.current = nextSec;
    setMode(next);
    setSecondsLeft(nextSec);
    persistStudyState(next, nextSec, nextSec * 1000, 0, false, cycleCompleted, activeTaskId);
  };

  const handleResetCycle = () => {
    const workSec = durationForMode('work');
    endAtRef.current = 0;
    remainingMsRef.current = workSec * 1000;
    lastTickSecRef.current = workSec;
    setRunning(false);
    setCycleCompleted(0);
    setMode('work');
    setSecondsLeft(workSec);
    persistStudyState('work', workSec, workSec * 1000, 0, false, 0, activeTaskId);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTaskTitle.trim();
    if (!trimmed) return;
    const item: StudyTask = {
      id: `task-${Date.now()}`,
      title: trimmed,
      estSessions: newTaskEst,
      completedSessions: 0,
      done: false,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [item, ...prev]);
    if (!activeTaskId) setActiveTaskId(item.id);
    setNewTaskTitle('');
    setNewTaskEst(1);
  };

  const todayISO = todayKey();
  const todayRecords = useMemo(
    () => history.filter((h) => h.dateISO === todayISO),
    [history, todayISO]
  );
  const todaySessions = todayRecords.length;
  const todayMinutes = todayRecords.reduce((acc, r) => acc + r.minutes, 0);

  const streakDays = useMemo(() => {
    const set = new Set(history.map((h) => h.dateISO));
    let count = 0;
    const cursor = new Date();
    if (!set.has(todayKey(cursor))) {
      cursor.setDate(cursor.getDate() - 1);
    }
    while (set.has(todayKey(cursor))) {
      count += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  }, [history]);

  const last7Bars = useMemo(() => {
    const out: { label: string; count: number; isToday: boolean; reached: boolean }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = todayKey(d);
      const count = history.filter((h) => h.dateISO === key).length;
      out.push({
        label: new Intl.DateTimeFormat(langMeta.bcp47, { weekday: 'narrow' }).format(d),
        count,
        isToday: i === 0,
        reached: count >= settings.studyDailyGoal,
      });
    }
    return out;
  }, [history, settings.studyDailyGoal, langMeta.bcp47]);

  const maxWeekBar = Math.max(settings.studyDailyGoal, 1, ...last7Bars.map((b) => b.count));

  // Modal chart & metrics for 7d / 30d / 12m
  const modalStats = useMemo(() => {
    const numDays = statsRange === 'year' ? 365 : Number(statsRange);
    const dayList = Array.from({ length: numDays }, (_, idx) => {
      const d = new Date();
      d.setDate(d.getDate() - (numDays - 1 - idx));
      const key = todayKey(d);
      const recs = history.filter((h) => h.dateISO === key);
      return {
        date: d,
        key,
        sessions: recs.length,
        minutes: recs.reduce((s, r) => s + r.minutes, 0),
      };
    });

    const totalSess = dayList.reduce((s, d) => s + d.sessions, 0);
    const totalMin = dayList.reduce((s, d) => s + d.minutes, 0);
    const nonEmptyIndex = dayList.findIndex((d) => d.sessions > 0);
    const spanDays = nonEmptyIndex >= 0 ? dayList.length - nonEmptyIndex : 1;
    const avgMin = Math.round(totalMin / Math.max(1, spanDays));

    let best: (typeof dayList)[number] | null = null;
    let longest = 0;
    let cur = 0;
    for (const d of dayList) {
      if (d.sessions > 0) {
        cur += 1;
        longest = Math.max(longest, cur);
        if (!best || d.sessions > best.sessions) best = d;
      } else {
        cur = 0;
      }
    }

    let chartBars: { label: string; count: number; isToday: boolean; reached: boolean }[] = [];
    if (statsRange === 'year') {
      const now = new Date();
      chartBars = Array.from({ length: 12 }, (_, i) => {
        const mDate = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
        const count = dayList
          .filter(
            (d) =>
              d.date.getFullYear() === mDate.getFullYear() &&
              d.date.getMonth() === mDate.getMonth()
          )
          .reduce((s, d) => s + d.sessions, 0);
        return {
          label: new Intl.DateTimeFormat(langMeta.bcp47, { month: 'narrow' }).format(mDate),
          count,
          isToday: i === 11,
          reached: false,
        };
      });
    } else {
      const dense = dayList.length > 7;
      chartBars = dayList.map((d, idx) => ({
        label: dense
          ? (dayList.length - 1 - idx) % 7 === 0
            ? String(d.date.getDate())
            : ''
          : new Intl.DateTimeFormat(langMeta.bcp47, { weekday: 'narrow' }).format(d.date),
        count: d.sessions,
        isToday: idx === dayList.length - 1,
        reached: d.sessions >= settings.studyDailyGoal,
      }));
    }

    return {
      totalSess,
      totalMin,
      avgMin,
      bestSessions: best ? String(best.sessions) : '–',
      bestDate: best
        ? `· ${new Intl.DateTimeFormat(`${langMeta.bcp47}-u-nu-latn`, { month: 'short', day: 'numeric' }).format(best.date)}`
        : '',
      longest,
      chartBars,
    };
  }, [history, statsRange, settings.studyDailyGoal, langMeta.bcp47]);

  const modalMaxBar = Math.max(
    statsRange === 'year' ? 1 : settings.studyDailyGoal,
    1,
    ...modalStats.chartBars.map((b) => b.count)
  );

  // Tasks summary ("1 of 4 sessions · Finish at 5:35 PM")
  const tasksSummaryText = useMemo(() => {
    const open = tasks.filter((t) => !t.done);
    const totalEst = open.reduce((sum, t) => sum + (t.estSessions || 1), 0);
    const totalDone = open.reduce(
      (sum, t) => sum + Math.min(t.completedSessions || 0, t.estSessions || 1),
      0
    );
    const left = totalEst - totalDone;
    if (left <= 0) return '';

    let ms = left * settings.studyWorkMin * 60000;
    if (mode === 'work') {
      ms -= (totalSec - secondsLeft) * 1000;
    } else {
      ms += secondsLeft * 1000;
    }
    let cyc = cycleCompleted;
    for (let i = 1; i < left; i++) {
      cyc += 1;
      ms +=
        (cyc % settings.studySessionsBeforeLong === 0
          ? settings.studyLongBreakMin
          : settings.studyShortBreakMin) * 60000;
    }
    const finishStr = new Date(Date.now() + Math.max(0, ms)).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: !settings.use24Hour,
    });
    return t.tasksSummaryTemplate
      .replace('{done}', String(totalDone))
      .replace('{total}', String(totalEst))
      .replace('{time}', finishStr);
  }, [
    tasks,
    settings,
    mode,
    totalSec,
    secondsLeft,
    cycleCompleted,
    t.tasksSummaryTemplate,
  ]);

  const focusedTask = useMemo(
    () => tasks.find((t) => t.id === activeTaskId && !t.done) ?? null,
    [tasks, activeTaskId]
  );

  const doneInCycle =
    cycleCompleted % settings.studySessionsBeforeLong === 0 &&
    cycleCompleted > 0 &&
    mode === 'longBreak'
      ? settings.studySessionsBeforeLong
      : cycleCompleted % settings.studySessionsBeforeLong;

  const exportCsv = () => {
    const header = 'date,sessions,focus_minutes\n';
    const byDay: Record<string, { s: number; m: number }> = {};
    for (const r of history) {
      byDay[r.dateISO] ??= { s: 0, m: 0 };
      byDay[r.dateISO].s += 1;
      byDay[r.dateISO].m += r.minutes;
    }
    const rows = Object.keys(byDay)
      .sort()
      .map((k) => `${k},${byDay[k].s},${byDay[k].m}`)
      .join('\n');
    const blob = new Blob([header + rows + '\n'], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study-history-${todayISO}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="page-content-wrapper glow-stage">
        <div id="pomodoro-page" className="page-container">
          {/* Segmented Session Selector */}
          <div
            className="segmented session-type-selector hide-in-fullscreen"
            role="group"
            aria-label="Study session mode"
          >
            <button
              type="button"
              disabled={running}
              onClick={() => handleSelectMode('work')}
              aria-pressed={mode === 'work'}
              className={`session-selector-btn ${mode === 'work' ? 'active' : ''}`.trim()}
            >
              <BookOpen className="session-icon w-[16px] h-[16px]" />
              <span>{t.workTab}</span>
            </button>
            <button
              type="button"
              disabled={running}
              onClick={() => handleSelectMode('shortBreak')}
              aria-pressed={mode === 'shortBreak'}
              className={`session-selector-btn ${mode === 'shortBreak' ? 'active' : ''}`.trim()}
            >
              <Coffee className="session-icon w-[16px] h-[16px]" />
              <span>{t.shortBreak}</span>
            </button>
            <button
              type="button"
              disabled={running}
              onClick={() => handleSelectMode('longBreak')}
              aria-pressed={mode === 'longBreak'}
              className={`session-selector-btn ${mode === 'longBreak' ? 'active' : ''}`.trim()}
            >
              <Sparkles className="session-icon w-[16px] h-[16px]" />
              <span>{t.longBreak}</span>
            </button>
          </div>

          <span className="sr-only">
            {mode === 'work' ? 'Work Session' : mode === 'shortBreak' ? 'Short Break' : 'Long Break'}
          </span>

          {/* Flip Display with Red / Green / Blue Session Glow */}
          <div className="pomodoro-face">
            <div
              className="flip-display"
              role="timer"
              aria-label={`${minsStr} minutes ${secsStr} seconds`}
            >
              <FlipCard value={minsStr} srLabel={`${minsStr} Minutes`} />
              <FlipColon />
              <FlipCard value={secsStr} srLabel={`${secsStr} Seconds`} />
            </div>

            <div className="session-meta">
              <div className="session-progress" aria-hidden="true">
                <div
                  className="session-progress-bar"
                  style={{ transform: `scaleX(${progress})` }}
                />
              </div>

              <div
                className="session-count"
                aria-label={`Completed ${doneInCycle} of ${settings.studySessionsBeforeLong} sessions`}
              >
                {Array.from({ length: settings.studySessionsBeforeLong }).map((_, idx) => {
                  const cls =
                    idx < doneInCycle
                      ? 'done'
                      : idx === doneInCycle && mode === 'work'
                      ? 'current'
                      : '';
                  return <span key={idx} className={cls} />;
                })}
              </div>
            </div>
          </div>

          {/* Controls: Reset Icon + Session-Colored Start/Pause Pill + Skip Icon (remain visible in Fullscreen per aflipclock.com) */}
          <div className="controls">
            <button
              type="button"
              onClick={handleResetCycle}
              disabled={!running && !isPausedMidSession && cycleCompleted === 0 && mode === 'work'}
              className="btn btn-lg btn-secondary btn-icon"
              aria-label={t.reset}
              title={t.reset}
            >
              <RotateCcw className="w-[20px] h-[20px]" />
            </button>

            <button
              id="pomodoro-start-pause-btn"
              type="button"
              onClick={toggleStudyRunning}
              className="btn btn-lg btn-primary"
            >
              {running ? (
                <>
                  <Pause className="w-[20px] h-[20px]" />
                  <span>{t.pause}</span>
                </>
              ) : (
                <>
                  <Play className="w-[20px] h-[20px]" />
                  <span>{isPausedMidSession ? t.resume : t.start}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => advanceSession(false)}
              className="btn btn-lg btn-secondary btn-icon"
              aria-label={t.skip}
              title={t.skip}
            >
              <SkipForward className="w-[20px] h-[20px]" />
            </button>
          </div>

          {/* Status Pills */}
          <div className="pomodoro-status hide-in-fullscreen">
            {focusedTask ? (
              <a
                href="#tasks-panel"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('tasks-panel')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="focus-task"
              >
                <Target
                  className="w-[17px] h-[17px] shrink-0"
                  style={{ color: 'var(--session-color)' }}
                />
                <span>
                  {focusedTask.title} · {focusedTask.completedSessions}/{focusedTask.estSessions}
                </span>
              </a>
            ) : null}

            <button
              type="button"
              onClick={() => {
                setConfirmClear(false);
                setStatsOpen(true);
              }}
              className="session-stats"
            >
              <CheckCircle2
                className="w-[16px] h-[16px]"
                style={{ color: 'var(--session-color)' }}
              />
              <span>
                {t.todayStatsTemplate
                  .replace('{s}', String(todaySessions))
                  .replace('{m}', String(todayMinutes))}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Two-Column Panels Below Stage: Tasks & Progress */}
      <div className="page-panels two-col">
        {/* Tasks Panel */}
        <section id="tasks-panel" className="panel" aria-labelledby="tasks-heading">
          <div className="panel-header">
            <h2 id="tasks-heading" className="panel-title">
              {t.tasksTitle}
            </h2>
            {tasks.some((tk) => tk.done) ? (
              <button
                type="button"
                onClick={() => setTasks((prev) => prev.filter((tk) => !tk.done))}
                className="text-button"
              >
                <span>{t.clearCompleted}</span>
              </button>
            ) : null}
          </div>

          <form onSubmit={handleAddTask} className="task-input-row">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder={t.addTaskPlaceholder}
              aria-label={t.addTaskPlaceholder}
              className="input"
            />
            <button
              type="button"
              onClick={() => setNewTaskEst((n) => (n >= MAX_ESTIMATE ? 1 : n + 1))}
              className="estimate-button"
              title="Estimated sessions (click to increase)"
              aria-label={`${newTaskEst} estimated sessions`}
            >
              <Timer className="w-[16px] h-[16px]" />
              <span>{newTaskEst}</span>
            </button>
            <button
              type="submit"
              className="btn btn-icon btn-primary"
              aria-label="Add task"
              title="Add task"
            >
              <Plus className="w-[20px] h-[20px]" />
            </button>
          </form>

          {tasks.length === 0 ? (
            <p id="no-tasks-message" className="empty-state">
              {t.noTasksMessage}
            </p>
          ) : (
            <ul className="tasks-list">
              {tasks.map((task) => {
                const isActive = activeTaskId === task.id && !task.done;
                const met = task.completedSessions >= task.estSessions;
                return (
                  <li
                    key={task.id}
                    className={`task-item ${task.done ? 'completed' : ''} ${
                      isActive ? 'active' : ''
                    }`.trim()}
                  >
                    <input
                      type="checkbox"
                      checked={task.done}
                      aria-label={task.title}
                      onChange={() => {
                        setTasks((prev) => {
                          const next = prev.map((t) =>
                            t.id === task.id ? { ...t, done: !t.done } : t
                          );
                          if (next.length > 0 && next.every((t) => t.done)) {
                            onShowToast?.('All tasks completed!');
                          }
                          return next;
                        });
                      }}
                      className="check"
                    />
                    <span className="task-text">{task.title}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setTasks((prev) =>
                          prev.map((t) =>
                            t.id === task.id
                              ? {
                                  ...t,
                                  estSessions:
                                    t.estSessions >= MAX_ESTIMATE
                                      ? Math.max(1, t.completedSessions)
                                      : t.estSessions + 1,
                                }
                              : t
                          )
                        )
                      }
                      className={`estimate-button ${met ? 'met' : ''}`.trim()}
                      aria-label={`Sessions: ${task.completedSessions} of ${task.estSessions} estimated`}
                    >
                      <Timer className="w-[14px] h-[14px]" />
                      <span>
                        {task.completedSessions}/{task.estSessions}
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-pressed={isActive}
                      aria-label={isActive ? 'Unset as focus task' : 'Set as focus task'}
                      title={isActive ? 'Unfocus task' : 'Set as focus task'}
                      onClick={() => setActiveTaskId(isActive ? null : task.id)}
                      className="task-btn focus-btn"
                    >
                      {isActive ? (
                        <X className="w-[17px] h-[17px]" />
                      ) : (
                        <Target className="w-[17px] h-[17px]" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTasks((prev) => prev.filter((t) => t.id !== task.id));
                        if (activeTaskId === task.id) setActiveTaskId(null);
                      }}
                      className="task-btn delete-btn"
                      aria-label="Delete task"
                    >
                      <Trash2 className="w-[17px] h-[17px]" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {tasksSummaryText ? <div className="tasks-summary">{tasksSummaryText}</div> : null}
        </section>

        {/* Progress Panel */}
        <section id="progress-panel" className="panel" aria-labelledby="progress-heading">
          <div className="panel-header">
            <h2 id="progress-heading" className="panel-title">
              {t.progressTitle}
            </h2>
            <button
              type="button"
              onClick={() => {
                setConfirmClear(false);
                setStatsOpen(true);
              }}
              className="text-button"
            >
              <BarChart3 className="w-[17px] h-[17px]" />
              <span>{t.statisticsTitle}</span>
            </button>
          </div>

          <div className="progress-stats">
            <div className="progress-stat">
              <span className="progress-value" dir="ltr">
                {todaySessions}/{settings.studyDailyGoal}
              </span>
              <span className="progress-label">{t.dailyGoalLabel}</span>
              <div
                className={`goal-bar ${
                  todaySessions >= settings.studyDailyGoal ? 'reached' : ''
                }`.trim()}
              >
                <span
                  style={{
                    transform: `scaleX(${Math.min(1, todaySessions / settings.studyDailyGoal)})`,
                  }}
                />
              </div>
            </div>

            <div className="progress-stat">
              <span className="progress-value" dir="ltr">{formatDurationMinutes(todayMinutes)}</span>
              <span className="progress-label">{t.focusTimeLabel}</span>
            </div>

            <div className="progress-stat">
              <span className="progress-value" dir="ltr">{streakDays}</span>
              <span className="progress-label">{t.dayStreakLabel}</span>
            </div>
          </div>

          <span className="section-label">{t.last7Days}</span>
          <div
            className="week-chart"
            style={{ '--bars': 7 } as React.CSSProperties}
            aria-label={t.last7Days}
          >
            <span
              className="week-goal"
              style={{
                bottom: `calc(${settings.studyDailyGoal / maxWeekBar} * 96px + 20px)`,
              }}
            />
            {last7Bars.map((bar, idx) => (
              <div
                key={idx}
                className={`week-bar ${bar.isToday ? 'today' : ''} ${
                  bar.reached ? 'reached' : ''
                }`.trim()}
              >
                <span className="week-bar-value">{bar.count > 0 ? bar.count : ''}</span>
                <div className="week-bar-track">
                  <div
                    className="week-bar-fill"
                    style={{ height: `${(bar.count / maxWeekBar) * 100}%` }}
                  />
                </div>
                <span className="week-bar-day">{bar.label}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Neutral Editorial Guide */}
      <article className="info-article">
        {isAr ? (
          <>
            <h2>ما هو مؤقت المذاكرة بتقنية بومودورو؟</h2>
            <p>
              يقسم مؤقت المذاكرة فترات الدراسة والعمل العميق إلى جلسات تركيز محددة تليها استراحات قصيرة
              لاستعادة النشاط، مع إضاءة محيطية ملونة توضح حالة الجلسة الحالية.
            </p>
            <h2>اختيار إيقاع الجلسات المناسب</h2>
            <ul>
              <li><strong>كلاسيكي (25-5-15):</strong> 25 دقيقة تركيز، و5 دقائق استراحة قصيرة، و15 دقيقة استراحة طويلة كل 4 جلسات.</li>
              <li><strong>قصير (15-3-9):</strong> جلسات سريعة مثالية للمراجعة والتمارين المركزة.</li>
              <li><strong>طويل (50-10-30):</strong> فترات عمل عميق ممتدة للبرمجة والكتابة وحل المسائل.</li>
            </ul>
          </>
        ) : (
          <>
            <h2>What Is a Split-Flap Study Timer?</h2>
            <p>
              A study timer breaks long study or deep-work stretches into structured focus intervals and
              recovery breaks. Large split-flap numerals show exact remaining minutes and seconds, while
              color-coded ambient lighting signals whether you are in a work block or resting.
            </p>

            <h2>Choosing Your Interval Rhythm</h2>
            <ul>
              <li>
                <strong>Classic (25-5-15):</strong> 25 minutes of focused study, a 5-minute short break,
                and a 15-minute long break every four sessions.
              </li>
              <li>
                <strong>Short (15-3-9):</strong> Compact sprints ideal for quick warm-ups and review
                drills.
              </li>
              <li>
                <strong>Long (50-10-30):</strong> Extended deep-work blocks for writing, coding, and
                problem sets.
              </li>
            </ul>
          </>
        )}
      </article>

      {/* Statistics Modal */}
      {statsOpen ? (
        <div className="modal-overlay" onClick={() => setStatsOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t.statisticsTitle}
            className="stats-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="panel-title">{t.statisticsTitle}</h2>
              <button
                type="button"
                onClick={() => setStatsOpen(false)}
                className="icon-button"
                aria-label="Close statistics"
              >
                <X className="w-[20px] h-[20px]" />
              </button>
            </div>

            <div className="segmented w-full flex">
              {(
                [
                  { id: '7', label: t.range7Days },
                  { id: '30', label: t.range30Days },
                  { id: 'year', label: t.range12Months },
                ] as { id: StatsRange; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatsRange(tab.id)}
                  className={`flex-1 ${statsRange === tab.id ? 'active' : ''}`.trim()}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="stats-grid">
              <div className="progress-stat">
                <span className="progress-value" dir="ltr">{modalStats.totalSess}</span>
                <span className="progress-label">{t.sessionsLabel}</span>
              </div>
              <div className="progress-stat">
                <span className="progress-value" dir="ltr">{formatDurationMinutes(modalStats.totalMin)}</span>
                <span className="progress-label">{t.focusTimeLabel}</span>
              </div>
              <div className="progress-stat">
                <span className="progress-value" dir="ltr">{formatDurationMinutes(modalStats.avgMin)}</span>
                <span className="progress-label">{t.dailyAverageLabel}</span>
              </div>
              <div className="progress-stat">
                <span className="progress-value" dir="ltr">
                  {modalStats.bestSessions}{' '}
                  <span className="text-[13px] font-normal" style={{ color: 'var(--text-2)' }}>
                    {modalStats.bestDate}
                  </span>
                </span>
                <span className="progress-label">{t.bestDayLabel}</span>
              </div>
              <div className="progress-stat">
                <span className="progress-value" dir="ltr">{modalStats.longest} {t.days}</span>
                <span className="progress-label">{t.longestStreakLabel}</span>
              </div>
              <div className="progress-stat">
                <span className="progress-value" dir="ltr">{tasks.filter((tk) => tk.done).length}</span>
                <span className="progress-label">{t.tasksDoneLabel}</span>
              </div>
            </div>

            <div
              className={`week-chart stats-chart ${
                modalStats.chartBars.length > 12 ? 'dense' : ''
              }`.trim()}
              style={{ '--bars': modalStats.chartBars.length } as React.CSSProperties}
            >
              {statsRange !== 'year' ? (
                <span
                  className="week-goal"
                  style={{
                    bottom: `calc(${settings.studyDailyGoal / modalMaxBar} * 120px + 20px)`,
                  }}
                />
              ) : null}
              {modalStats.chartBars.map((bar, idx) => (
                <div
                  key={idx}
                  className={`week-bar ${bar.isToday ? 'today' : ''} ${
                    bar.reached ? 'reached' : ''
                  }`.trim()}
                >
                  <span className="week-bar-value">{bar.count > 0 ? bar.count : ''}</span>
                  <div className="week-bar-track">
                    <div
                      className="week-bar-fill"
                      style={{ height: `${(bar.count / modalMaxBar) * 100}%` }}
                    />
                  </div>
                  <span className="week-bar-day">{bar.label}</span>
                </div>
              ))}
            </div>

            <p className="stats-note">
              {t.privacyNote}
            </p>

            <div className="stats-actions">
              <button type="button" onClick={exportCsv} className="btn btn-secondary">
                {t.exportCsv}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!confirmClear) {
                    setConfirmClear(true);
                    return;
                  }
                  setHistory([]);
                  setConfirmClear(false);
                }}
                className={`text-button danger ${confirmClear ? 'confirm' : ''}`.trim()}
              >
                {confirmClear ? t.tapAgainToClear : t.clearHistory}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};
