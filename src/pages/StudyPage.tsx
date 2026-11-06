import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlipCard, FlipColon } from '../components/FlipCard';
import { Icon } from '../components/Icon';
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

const TASKS_STORAGE_KEY = 'splitdeck:v1:study:tasks';
const HISTORY_STORAGE_KEY = 'splitdeck:v1:study:history';
const TASKS_BY_DAY_KEY = 'splitdeck:v1:study:tasks-by-day';
const STUDY_STATE_KEY = 'splitdeck:v1:study:state';
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
  const [tasksByDay, setTasksByDay] = useState<Record<string, number>>(() =>
    readStorage<Record<string, number>>(TASKS_BY_DAY_KEY, {})
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
  const clearConfirmTimerRef = useRef<number | null>(null);

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

  const recordTaskDelta = useCallback((delta: 1 | -1) => {
    const key = todayKey();
    setTasksByDay((prev) => {
      const nextCount = Math.max(0, (prev[key] || 0) + delta);
      return { ...prev, [key]: nextCount };
    });
  }, []);

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
    writeStorage(TASKS_BY_DAY_KEY, tasksByDay);
  }, [tasksByDay]);

  useEffect(() => {
    writeStorage(HISTORY_STORAGE_KEY, history);
  }, [history]);

  useEffect(() => {
    return () => {
      if (clearConfirmTimerRef.current !== null) {
        window.clearTimeout(clearConfirmTimerRef.current);
      }
    };
  }, []);

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

  // Update idle duration when user changes work/shortBreak/longBreak settings in SettingsDrawer
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
                if (tk.id !== activeTaskId || tk.done) return tk;
                const nextDoneCount = tk.completedSessions + 1;
                const autoDone =
                  settings.studyAutoCheckTask && nextDoneCount >= tk.estSessions ? true : tk.done;
                if (autoDone && !tk.done) {
                  recordTaskDelta(1);
                }
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
      recordTaskDelta,
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
      if (statsOpen) {
        if (e.key === 'Escape') setStatsOpen(false);
        return;
      }
      const tag = (e.target as HTMLElement)?.tagName;
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        document.body.classList.contains('settings-open')
      ) {
        return;
      }
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

  const currentSessionLabel =
    mode === 'work' ? t.workSession : mode === 'shortBreak' ? t.shortBreak : t.longBreak;

  // Reflect the active focus or break phase in the browser tab title.
  useEffect(() => {
    if (running || isPausedMidSession) {
      document.title = `${minsStr}:${secsStr} · ${currentSessionLabel}`;
    } else {
      document.title = t.headerStudy;
    }
    return () => {
      document.title = t.headerClock;
    };
  }, [running, isPausedMidSession, minsStr, secsStr, currentSessionLabel, t.headerStudy, t.headerClock]);

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
    const out: { label: string; count: number; isToday: boolean; reached: boolean; title: string }[] = [];
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
        title: `${key}: ${count}`,
      });
    }
    return out;
  }, [history, settings.studyDailyGoal, langMeta.bcp47]);

  const maxWeekBar = Math.max(settings.studyDailyGoal, 1, ...last7Bars.map((b) => b.count));

  // Build session summaries for the selected reporting range.
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
        tasksDone: tasksByDay[key] || 0,
      };
    });

    const totalSess = dayList.reduce((s, d) => s + d.sessions, 0);
    const totalMin = dayList.reduce((s, d) => s + d.minutes, 0);
    const rangeTasksDone = dayList.reduce((s, d) => s + d.tasksDone, 0);
    const fallbackTasksDone = tasks.filter((tk) => tk.done).length;
    const tasksDoneTotal = Math.max(rangeTasksDone, fallbackTasksDone);

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

    let chartBars: {
      label: string;
      count: number;
      isToday: boolean;
      reached: boolean;
      title: string;
    }[] = [];
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
          title: `${new Intl.DateTimeFormat(langMeta.bcp47, {
            month: 'long',
            year: 'numeric',
          }).format(mDate)}: ${count}`,
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
        title: `${d.key}: ${d.sessions}`,
      }));
    }

    return {
      totalSess,
      totalMin,
      avgMin,
      bestSessions: best ? String(best.sessions) : '–',
      bestDate: best
        ? `· ${new Intl.DateTimeFormat(`${langMeta.bcp47}-u-nu-latn`, {
            month: 'short',
            day: 'numeric',
          }).format(best.date)}`
        : '',
      longest,
      tasksDoneTotal,
      chartBars,
    };
  }, [history, tasksByDay, tasks, statsRange, settings.studyDailyGoal, langMeta.bcp47]);

  const modalMaxBar = Math.max(
    statsRange === 'year' ? 1 : settings.studyDailyGoal,
    1,
    ...modalStats.chartBars.map((b) => b.count)
  );

  // Tasks summary ("3 of 8 sessions · Finish at 4:40 PM")
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
  }, [tasks, settings, mode, totalSec, secondsLeft, cycleCompleted, t.tasksSummaryTemplate]);

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

  // Export study history as a compact, spreadsheet-friendly CSV.
  const exportCsv = () => {
    const header = 'date,sessions,focus_minutes,tasks_completed\n';
    const byDay: Record<string, { s: number; m: number; t: number }> = {};
    for (const r of history) {
      byDay[r.dateISO] ??= { s: 0, m: 0, t: tasksByDay[r.dateISO] || 0 };
      byDay[r.dateISO].s += 1;
      byDay[r.dateISO].m += r.minutes;
    }
    for (const [day, count] of Object.entries(tasksByDay)) {
      if (count > 0) {
        byDay[day] ??= { s: 0, m: 0, t: 0 };
        byDay[day].t = count;
      }
    }
    const rows = Object.keys(byDay)
      .sort()
      .map((k) => `${k},${byDay[k].s},${byDay[k].m},${byDay[k].t}`)
      .join('\n');
    const blob = new Blob([header + (rows ? rows + '\n' : '')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study-history-${todayISO}.csv`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <>
      <div className="sd-page-content-wrapper sd-glow-stage">
        <div id="pomodoro-page" className="sd-page-container">
          {/* Segmented Session Selector */}
          <div
            className="segmented sd-session-type-selector sd-hide-in-fullscreen"
            role="group"
            aria-label="Study session mode"
          >
            <button
              type="button"
              disabled={running}
              onClick={() => handleSelectMode('work')}
              aria-pressed={mode === 'work'}
              className={`sd-session-selector-btn ${mode === 'work' ? 'active' : ''}`.trim()}
            >
              <Icon name="menu_book" />
              <span>{t.workTab}</span>
            </button>
            <button
              type="button"
              disabled={running}
              onClick={() => handleSelectMode('shortBreak')}
              aria-pressed={mode === 'shortBreak'}
              className={`sd-session-selector-btn ${mode === 'shortBreak' ? 'active' : ''}`.trim()}
            >
              <Icon name="coffee" />
              <span>{t.shortBreak}</span>
            </button>
            <button
              type="button"
              disabled={running}
              onClick={() => handleSelectMode('longBreak')}
              aria-pressed={mode === 'longBreak'}
              className={`sd-session-selector-btn ${mode === 'longBreak' ? 'active' : ''}`.trim()}
            >
              <Icon name="self_improvement" />
              <span>{t.longBreak}</span>
            </button>
          </div>

          <span className="sd-sr-only">{currentSessionLabel}</span>

          {/* Flip Display with Red / Green / Blue Session Glow */}
          <div className="sd-pomodoro-face">
            <div
              className="sd-flip-display"
              role="timer"
              aria-label={`${minsStr} minutes ${secsStr} seconds`}
            >
              <FlipCard value={minsStr} srLabel={`${minsStr} Minutes`} />
              <FlipColon />
              <FlipCard value={secsStr} srLabel={`${secsStr} Seconds`} />
            </div>

            <div className="sd-session-meta">
              <div className="sd-session-progress" aria-hidden="true">
                <div
                  className="sd-session-progress-bar"
                  style={{ transform: `scaleX(${progress})` }}
                />
              </div>

              <div
                className="sd-session-count"
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

          {/* Controls: Reset Icon + Session-Colored Width-Stable Start/Pause Pill + Skip Icon */}
          <div className="controls">
            <button
              type="button"
              onClick={handleResetCycle}
              disabled={!running && !isPausedMidSession && cycleCompleted === 0 && mode === 'work'}
              className="btn sd-btn-lg sd-btn-secondary sd-btn-icon"
              aria-label={t.reset}
              title={t.reset}
            >
              <Icon name="refresh" />
            </button>

            <button
              id="pomodoro-start-pause-btn"
              type="button"
              onClick={toggleStudyRunning}
              className="btn sd-btn-lg sd-btn-primary"
            >
              <Icon name={running ? 'pause' : 'play_arrow'} />
              <span className="sd-btn-labels">
                <span className={!running && !isPausedMidSession ? 'on' : ''}>{t.start}</span>
                <span className={running ? 'on' : ''}>{t.pause}</span>
                <span className={!running && isPausedMidSession ? 'on' : ''}>{t.resume}</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => advanceSession(false)}
              className="btn sd-btn-lg sd-btn-secondary sd-btn-icon"
              aria-label={t.skip}
              title={t.skip}
            >
              <Icon name="skip_next" />
            </button>
          </div>

          {/* Status Pills */}
          <div className="sd-pomodoro-status sd-hide-in-fullscreen">
            {focusedTask ? (
              <a
                href="#tasks-panel"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('tasks-panel')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="sd-focus-task"
              >
                <Icon name="target" />
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
              className="sd-session-stats"
            >
              <Icon name="check_circle" />
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
      <div className="sd-page-panels two-col">
        {/* Tasks Panel */}
        <section id="tasks-panel" className="panel" aria-labelledby="tasks-heading">
          <div className="sd-panel-header">
            <h2 id="tasks-heading" className="sd-panel-title">
              {t.tasksTitle}
            </h2>
            {tasks.some((tk) => tk.done) ? (
              <button
                type="button"
                onClick={() => setTasks((prev) => prev.filter((tk) => !tk.done))}
                className="sd-text-button"
              >
                <span>{t.clearCompleted}</span>
              </button>
            ) : null}
          </div>

          <form onSubmit={handleAddTask} className="sd-task-input-row">
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
              className="sd-estimate-button"
              title="Estimated sessions (click to increase)"
              aria-label={`${newTaskEst} estimated sessions`}
            >
              <Icon name="timer" />
              <span>{newTaskEst}</span>
            </button>
            <button
              type="submit"
              className="btn sd-btn-icon sd-btn-primary"
              aria-label="Add task"
              title="Add task"
            >
              <Icon name="add" />
            </button>
          </form>

          {tasks.length === 0 ? (
            <p id="no-tasks-message" className="sd-empty-state">
              {t.noTasksMessage}
            </p>
          ) : (
            <ul className="sd-tasks-list">
              {tasks.map((task) => {
                const isActive = activeTaskId === task.id && !task.done;
                const met = task.completedSessions >= task.estSessions;
                return (
                  <li
                    key={task.id}
                    className={`sd-task-item ${task.done ? 'completed' : ''} ${
                      isActive ? 'active' : ''
                    }`.trim()}
                  >
                    <input
                      type="checkbox"
                      checked={task.done}
                      aria-label={task.title}
                      onChange={() => {
                        const willBeDone = !task.done;
                        recordTaskDelta(willBeDone ? 1 : -1);
                        setTasks((prev) => {
                          const next = prev.map((tk) =>
                            tk.id === task.id ? { ...tk, done: willBeDone } : tk
                          );
                          if (willBeDone && next.length > 0 && next.every((tk) => tk.done)) {
                            onShowToast?.(isAr ? 'اكتملت جميع المهام!' : 'All tasks completed!');
                          }
                          return next;
                        });
                      }}
                      className="check"
                    />
                    <span className="sd-task-text">{task.title}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setTasks((prev) =>
                          prev.map((tk) =>
                            tk.id === task.id
                              ? {
                                  ...tk,
                                  estSessions:
                                    tk.estSessions >= MAX_ESTIMATE
                                      ? Math.max(1, tk.completedSessions)
                                      : tk.estSessions + 1,
                                }
                              : tk
                          )
                        )
                      }
                      className={`sd-estimate-button ${met ? 'met' : ''}`.trim()}
                      aria-label={`Sessions: ${task.completedSessions} of ${task.estSessions} estimated`}
                    >
                      <Icon name="timer" />
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
                      className="sd-task-btn sd-focus-btn"
                    >
                      <Icon name={isActive ? 'cancel' : 'target'} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTasks((prev) => prev.filter((tk) => tk.id !== task.id));
                        if (activeTaskId === task.id) setActiveTaskId(null);
                      }}
                      className="sd-task-btn sd-delete-btn"
                      aria-label="Delete task"
                    >
                      <Icon name="delete" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {tasksSummaryText ? <div className="sd-tasks-summary">{tasksSummaryText}</div> : null}
        </section>

        {/* Progress Panel */}
        <section id="progress-panel" className="panel" aria-labelledby="progress-heading">
          <div className="sd-panel-header">
            <h2 id="progress-heading" className="sd-panel-title">
              {t.progressTitle}
            </h2>
            <button
              type="button"
              onClick={() => {
                setConfirmClear(false);
                setStatsOpen(true);
              }}
              className="sd-text-button"
            >
              <Icon name="bar_chart" />
              <span>{t.statisticsTitle}</span>
            </button>
          </div>

          <div className="sd-progress-stats">
            <div className="sd-progress-stat">
              <span className="sd-progress-value" dir="ltr">
                {todaySessions}/{settings.studyDailyGoal}
              </span>
              <span className="sd-progress-label">{t.dailyGoalLabel}</span>
              <div
                className={`sd-goal-bar ${
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

            <div className="sd-progress-stat">
              <span className="sd-progress-value" dir="ltr">
                {formatDurationMinutes(todayMinutes)}
              </span>
              <span className="sd-progress-label">{t.focusTimeLabel}</span>
            </div>

            <div className="sd-progress-stat">
              <span className="sd-progress-value" dir="ltr">
                {streakDays}
              </span>
              <span className="sd-progress-label">{t.dayStreakLabel}</span>
            </div>
          </div>

          <span className="sd-section-label">{t.last7Days}</span>
          <div
            className="sd-week-chart"
            style={{ '--bars': 7 } as React.CSSProperties}
            aria-label={t.last7Days}
          >
            <span
              className="sd-week-goal"
              style={{
                bottom: `calc(${settings.studyDailyGoal / maxWeekBar} * 96px + 20px)`,
              }}
            />
            {last7Bars.map((bar, idx) => (
              <div
                key={idx}
                title={bar.title}
                className={`sd-week-bar ${bar.isToday ? 'today' : ''} ${
                  bar.reached ? 'reached' : ''
                }`.trim()}
              >
                <span className="sd-week-bar-value">{bar.count > 0 ? bar.count : ''}</span>
                <div className="sd-week-bar-track">
                  <div
                    className="sd-week-bar-fill"
                    style={{ height: `${(bar.count / maxWeekBar) * 100}%` }}
                  />
                </div>
                <span className="sd-week-bar-day">{bar.label}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Study notes: original guidance written for this application. */}
      <article className="sd-info-article">
        {isAr ? (
          <>
            <h2>كيف ينظّم مؤقت الدراسة وقتك؟</h2>
            <p>
              حوّل المهمة الكبيرة إلى فترة تركيز محددة، ثم خذ استراحة قبل بدء الجولة التالية. تعرض الساعة
              الوقت المتبقي وحالة الجلسة، بينما تساعدك قائمة المهام ومؤشرات التقدّم على متابعة خطتك من هذا
              المتصفح.
            </p>

            <h2>إيقاع بسيط بين العمل والراحة</h2>
            <p>
              اختر جلسة عمل، وابدأ العدّ، ثم انتقل إلى استراحة قصيرة عند انتهائها. بعد عدد الجلسات الذي
              تحدده، خذ استراحة أطول. يمكنك إيقاف التشغيل التلقائي إذا كنت تفضّل بدء كل مرحلة بنفسك.
            </p>

            <h2>اختر مدة تناسب المهمة</h2>
            <ul>
              <li><strong>25–5–15:</strong> تركيز لمدة 25 دقيقة، ثم استراحة قصيرة من 5 دقائق.</li>
              <li><strong>15–3–9:</strong> جولات أقصر للمراجعة أو المهام الصغيرة.</li>
              <li><strong>50–10–30:</strong> فترة تركيز أطول يتبعها وقت كافٍ للابتعاد عن المكتب.</li>
            </ul>

            <h2>جهّز جلستك قبل البدء</h2>
            <p>
              اختر وضع العمل أو الاستراحة، وأضف المهمة التي تريد إنجازها، واضبط هدفك اليومي من الإعدادات.
              بعد الجلسة يمكنك تسجيل ما أنجزته ومراجعة الإحصاءات أو تنزيل السجل بصيغة CSV.
            </p>

            <h2>اجعل الاستراحة جزءاً من الخطة</h2>
            <p>
              ابتعد عن الشاشة للحظات، حرّك جسمك، أو دوّن الخطوة التالية. وإذا كانت إحدى المدد لا تناسب
              تركيزك، عدّلها من الإعدادات بدلاً من إجبار نفسك على إيقاع ثابت.
            </p>
          </>
        ) : (
          <>
            <h2>Give a study block a clear finish</h2>
            <p>
              Break a large assignment into a defined stretch of attention, then pause before the next round.
              The display shows the remaining time and current session; a task list and progress summaries
              help you keep your plan close at hand in this browser.
            </p>

            <h2>Build a repeatable work-and-rest cycle</h2>
            <p>
              Choose a work session and start the clock. When it ends, move into a short break; after the
              number of work rounds you set, take a longer one. Automatic transitions are optional, so you
              can decide when each phase begins.
            </p>

            <h2>Match the interval to the task</h2>
            <ul>
              <li><strong>25–5–15:</strong> A 25-minute work block followed by a 5-minute short break.</li>
              <li><strong>15–3–9:</strong> Smaller rounds for review or a quick, self-contained task.</li>
              <li><strong>50–10–30:</strong> A longer focus window with a more generous recovery break.</li>
            </ul>

            <h2>Set up before pressing start</h2>
            <p>
              Select a work or break mode, add the task you intend to tackle, and set a daily goal in
              settings. Afterward, log what you completed, review the summaries, or export your history as a
              CSV file.
            </p>

            <h2>Give the break its own purpose</h2>
            <p>
              Step away from the screen, stretch, or write down the next action. If an interval feels too
              short or too long, adjust it to suit the work instead of forcing every task into one rhythm.
            </p>
          </>
        )}
      </article>

      {/* Statistics Modal */}
      {statsOpen ? (
        <div className="sd-modal-overlay visible" onClick={() => setStatsOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t.statisticsTitle}
            className="sd-stats-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sd-stats-head">
              <h2 className="sd-panel-title">{t.statisticsTitle}</h2>
              <button
                type="button"
                onClick={() => setStatsOpen(false)}
                className="sd-icon-button"
                aria-label="Close statistics"
              >
                <Icon name="close" />
              </button>
            </div>

            <div className="segmented sd-stats-range">
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
                  aria-pressed={statsRange === tab.id}
                  onClick={() => setStatsRange(tab.id)}
                  className={statsRange === tab.id ? 'active' : ''}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="sd-stats-grid">
              <div className="sd-progress-stat">
                <span className="sd-progress-value" dir="ltr">
                  {modalStats.totalSess}
                </span>
                <span className="sd-progress-label">{t.sessionsLabel}</span>
              </div>
              <div className="sd-progress-stat">
                <span className="sd-progress-value" dir="ltr">
                  {formatDurationMinutes(modalStats.totalMin)}
                </span>
                <span className="sd-progress-label">{t.focusTimeLabel}</span>
              </div>
              <div className="sd-progress-stat">
                <span className="sd-progress-value" dir="ltr">
                  {formatDurationMinutes(modalStats.avgMin)}
                </span>
                <span className="sd-progress-label">{t.dailyAverageLabel}</span>
              </div>
              <div className="sd-progress-stat">
                <span className="sd-progress-value" dir="ltr">
                  {modalStats.bestSessions}{' '}
                  <span className="text-[13px] font-normal" style={{ color: 'var(--text-2)' }}>
                    {modalStats.bestDate}
                  </span>
                </span>
                <span className="sd-progress-label">{t.bestDayLabel}</span>
              </div>
              <div className="sd-progress-stat">
                <span className="sd-progress-value" dir="ltr">
                  {modalStats.longest} {t.days}
                </span>
                <span className="sd-progress-label">{t.longestStreakLabel}</span>
              </div>
              <div className="sd-progress-stat">
                <span className="sd-progress-value" dir="ltr">
                  {modalStats.tasksDoneTotal}
                </span>
                <span className="sd-progress-label">{t.tasksDoneLabel}</span>
              </div>
            </div>

            <div
              className={`sd-week-chart sd-stats-chart ${
                modalStats.chartBars.length > 12 ? 'dense' : ''
              }`.trim()}
              style={{ '--bars': modalStats.chartBars.length } as React.CSSProperties}
            >
              {statsRange !== 'year' ? (
                <span
                  className="sd-week-goal"
                  style={{
                    bottom: `calc(${settings.studyDailyGoal / modalMaxBar} * 120px + 20px)`,
                  }}
                />
              ) : null}
              {modalStats.chartBars.map((bar, idx) => (
                <div
                  key={idx}
                  title={bar.title}
                  className={`sd-week-bar ${bar.isToday ? 'today' : ''} ${
                    bar.reached ? 'reached' : ''
                  }`.trim()}
                >
                  <span className="sd-week-bar-value">{bar.count > 0 ? bar.count : ''}</span>
                  <div className="sd-week-bar-track">
                    <div
                      className="sd-week-bar-fill"
                      style={{ height: `${(bar.count / modalMaxBar) * 100}%` }}
                    />
                  </div>
                  <span className="sd-week-bar-day">{bar.label}</span>
                </div>
              ))}
            </div>

            <p className="sd-stats-note">{t.privacyNote}</p>

            <div className="sd-stats-actions">
              <button type="button" onClick={exportCsv} className="btn sd-btn-secondary">
                <Icon name="download" />
                <span>{t.exportCsv}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!confirmClear) {
                    setConfirmClear(true);
                    if (clearConfirmTimerRef.current !== null) {
                      window.clearTimeout(clearConfirmTimerRef.current);
                    }
                    clearConfirmTimerRef.current = window.setTimeout(() => {
                      setConfirmClear(false);
                    }, 4000);
                    return;
                  }
                  if (clearConfirmTimerRef.current !== null) {
                    window.clearTimeout(clearConfirmTimerRef.current);
                  }
                  setHistory([]);
                  setTasksByDay({});
                  setConfirmClear(false);
                }}
                className={`sd-text-button danger ${confirmClear ? 'confirm' : ''}`.trim()}
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
