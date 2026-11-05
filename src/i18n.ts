export type LangCode =
  | 'en'
  | 'ar'
  | 'es'
  | 'de'
  | 'fr'
  | 'pt'
  | 'it'
  | 'pl'
  | 'ru'
  | 'uk'
  | 'cs'
  | 'fi'
  | 'id'
  | 'ja'
  | 'nl'
  | 'th'
  | 'tw'
  | 'vi'
  | 'da'
  | 'hu'
  | 'no'
  | 'el'
  | 'sv'
  | 'ko';

export interface LanguageOption {
  code: LangCode;
  nativeName: string;
  bcp47: string;
  dir: 'ltr' | 'rtl';
}

// All 23 languages from aflipclock.com + Arabic (العربية)
export const LANGUAGES: LanguageOption[] = [
  { code: 'en', nativeName: 'English', bcp47: 'en-US', dir: 'ltr' },
  { code: 'ar', nativeName: 'العربية', bcp47: 'ar-EG', dir: 'rtl' },
  { code: 'es', nativeName: 'Español', bcp47: 'es-ES', dir: 'ltr' },
  { code: 'de', nativeName: 'Deutsch', bcp47: 'de-DE', dir: 'ltr' },
  { code: 'fr', nativeName: 'Français', bcp47: 'fr-FR', dir: 'ltr' },
  { code: 'pt', nativeName: 'Português', bcp47: 'pt-BR', dir: 'ltr' },
  { code: 'it', nativeName: 'Italiano', bcp47: 'it-IT', dir: 'ltr' },
  { code: 'pl', nativeName: 'Polski', bcp47: 'pl-PL', dir: 'ltr' },
  { code: 'ru', nativeName: 'Русский', bcp47: 'ru-RU', dir: 'ltr' },
  { code: 'uk', nativeName: 'Українська', bcp47: 'uk-UA', dir: 'ltr' },
  { code: 'cs', nativeName: 'Čeština', bcp47: 'cs-CZ', dir: 'ltr' },
  { code: 'fi', nativeName: 'Suomi', bcp47: 'fi-FI', dir: 'ltr' },
  { code: 'id', nativeName: 'Bahasa Indonesia', bcp47: 'id-ID', dir: 'ltr' },
  { code: 'ja', nativeName: '日本語', bcp47: 'ja-JP', dir: 'ltr' },
  { code: 'nl', nativeName: 'Nederlands', bcp47: 'nl-NL', dir: 'ltr' },
  { code: 'th', nativeName: 'ไทย', bcp47: 'th-TH', dir: 'ltr' },
  { code: 'tw', nativeName: '繁體中文', bcp47: 'zh-TW', dir: 'ltr' },
  { code: 'vi', nativeName: 'Tiếng Việt', bcp47: 'vi-VN', dir: 'ltr' },
  { code: 'da', nativeName: 'Dansk', bcp47: 'da-DK', dir: 'ltr' },
  { code: 'hu', nativeName: 'Magyar', bcp47: 'hu-HU', dir: 'ltr' },
  { code: 'no', nativeName: 'Norsk', bcp47: 'nb-NO', dir: 'ltr' },
  { code: 'el', nativeName: 'Ελληνικά', bcp47: 'el-GR', dir: 'ltr' },
  { code: 'sv', nativeName: 'Svenska', bcp47: 'sv-SE', dir: 'ltr' },
  { code: 'ko', nativeName: '한국어', bcp47: 'ko-KR', dir: 'ltr' },
];

export interface UIStrings {
  // Navigation & Headers
  dockClock: string;
  dockStudy: string;
  dockTimer: string;
  dockStopwatch: string;
  dockCountdown: string;
  dockAlarm: string;

  headerClock: string;
  headerStudy: string;
  headerTimer: string;
  headerStopwatch: string;
  headerCountdown: string;
  headerAlarm: string;
  headerLocalTime: string;

  // Common Actions & Units
  start: string;
  pause: string;
  resume: string;
  reset: string;
  lap: string;
  skip: string;
  ok: string;
  restart: string;
  snooze: string;
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  hour: string;
  minute: string;

  // Settings Sheet
  settingsTitle: string;
  studySettingsTitle: string;
  themeSelection: string;
  themeDark: string;
  themeLight: string;
  themeMidnight: string;
  themeSand: string;
  flipStyle: string;
  styleSimple: string;
  styleStandard: string;
  stylePro: string;

  clockDisplay: string;
  use24Hour: string;
  showSeconds: string;
  showDateDay: string;

  clockStyle: string;
  appearance: string;
  layout: string;
  layoutAuto: string;
  layoutHorizontal: string;
  layoutVertical: string;
  size: string;
  cornerRadius: string;
  resetDefaults: string;
  settingsResetToast: string;
  fullscreenExitToast: string;

  // Sound & Study Settings
  presets: string;
  presetClassic: string;
  presetShort: string;
  presetLong: string;
  timeSettingsMin: string;
  workSession: string;
  shortBreak: string;
  longBreak: string;
  sessionsUntilLong: string;
  dailyGoalSessions: string;
  soundAndNotifs: string;
  alarmSound: string;
  soundNotification: string;
  selectSound: string;
  soundBell: string;
  soundClassic: string;
  soundBeacon: string;
  soundSunrise: string;
  soundChime: string;
  soundDigital: string;
  soundMelody: string;
  volume: string;
  testSound: string;
  ringUntilStopped: string;
  gradualVolume: string;
  snoozeLengthMin: string;
  tickingSound: string;
  desktopNotifs: string;
  behavior: string;
  autoStartBreaks: string;
  autoStartWork: string;
  autoCheckTask: string;

  // World Clock
  worldClock: string;
  allCitiesLink: string;
  yourTime: string;
  yourCities: string;
  searchCityPlaceholder: string;
  deviceClockSynced: string;
  now: string;
  timeFromNow: string;
  daysFromToday: string;

  // Study Page
  workTab: string;
  todayStatsTemplate: string; // "Today: {s} completed · {m} min focused"
  tasksTitle: string;
  clearCompleted: string;
  addTaskPlaceholder: string;
  noTasksMessage: string;
  tasksSummaryTemplate: string; // "{done} of {total} sessions · Finish at {time}"
  progressTitle: string;
  statisticsTitle: string;
  dailyGoalLabel: string;
  focusTimeLabel: string;
  dayStreakLabel: string;
  last7Days: string;
  range7Days: string;
  range30Days: string;
  range12Months: string;
  sessionsLabel: string;
  dailyAverageLabel: string;
  bestDayLabel: string;
  longestStreakLabel: string;
  tasksDoneLabel: string;
  privacyNote: string;
  exportCsv: string;
  clearHistory: string;
  tapAgainToClear: string;

  // Timer, Stopwatch, Countdown, Alarm
  customTime: string;
  timesUp: string;
  allTimers: string;
  lapCol: string;
  lapTimeCol: string;
  totalTimeCol: string;
  createCountdown: string;
  dateLabel: string;
  timeLabel: string;
  countdownNameLabel: string;
  setCountdown: string;
  presetCountdowns: string;
  todayGroup: string;
  holidaysGroup: string;
  quickCountdownsGroup: string;
  holidayCountdowns: string;
  holidayCol: string;
  daysLeftCol: string;
  untilPrefix: string;

  addAlarm: string;
  setNewAlarm: string;
  alarmsTitle: string;
  noAlarmsSet: string;
  labelField: string;
  repeatField: string;
  repeatOnce: string;
  repeatEveryDay: string;
  repeatWeekdays: string;
  repeatWeekends: string;
  vibrate: string;
  alarmTimes: string;
}

const EN: UIStrings = {
  dockClock: 'Clock',
  dockStudy: 'Study',
  dockTimer: 'Timer',
  dockStopwatch: 'Stopwatch',
  dockCountdown: 'Countdown',
  dockAlarm: 'Alarm',

  headerClock: 'Current Time Flip Clock',
  headerStudy: 'Study Timer',
  headerTimer: 'Timer',
  headerStopwatch: 'Stopwatch',
  headerCountdown: 'Countdown Timer',
  headerAlarm: 'Alarm Clock',
  headerLocalTime: 'Your Local Time',

  start: 'Start',
  pause: 'Pause',
  resume: 'Resume',
  reset: 'Reset',
  lap: 'Lap',
  skip: 'Skip',
  ok: 'OK',
  restart: 'Restart',
  snooze: 'Snooze',
  days: 'Days',
  hours: 'Hours',
  minutes: 'Minutes',
  seconds: 'Seconds',
  hour: 'Hour',
  minute: 'Minute',

  settingsTitle: 'Settings',
  studySettingsTitle: 'Study Timer Settings',
  themeSelection: 'Theme Selection',
  themeDark: 'Dark',
  themeLight: 'Light',
  themeMidnight: 'Midnight',
  themeSand: 'Sand',
  flipStyle: 'Flip Style',
  styleSimple: 'Simple',
  styleStandard: 'Standard',
  stylePro: 'Professional',

  clockDisplay: 'Clock Display',
  use24Hour: 'Use 24-Hour Format',
  showSeconds: 'Show Seconds',
  showDateDay: 'Show Date & Day',

  clockStyle: 'Clock Style',
  appearance: 'Appearance',
  layout: 'Layout',
  layoutAuto: 'Auto',
  layoutHorizontal: 'Horizontal',
  layoutVertical: 'Vertical',
  size: 'Size',
  cornerRadius: 'Corner Radius',
  resetDefaults: 'Reset to Defaults',
  settingsResetToast: 'Settings reset to defaults',
  fullscreenExitToast: 'Double-tap to exit fullscreen',

  presets: 'Presets',
  presetClassic: 'Classic (25-5-15)',
  presetShort: 'Short (15-3-9)',
  presetLong: 'Long (50-10-30)',
  timeSettingsMin: 'Time Settings (minutes)',
  workSession: 'Work Session',
  shortBreak: 'Short Break',
  longBreak: 'Long Break',
  sessionsUntilLong: 'Sessions Until Long Break',
  dailyGoalSessions: 'Daily Goal (sessions)',
  soundAndNotifs: 'Sound & Notifications',
  alarmSound: 'Alarm Sound',
  soundNotification: 'Sound Notification',
  selectSound: 'Select Sound',
  soundBell: 'Bell Sound (Default)',
  soundClassic: 'Classic Alarm',
  soundBeacon: 'Beacon',
  soundSunrise: 'Sunrise',
  soundChime: 'Gentle Chime',
  soundDigital: 'Digital Beep',
  soundMelody: 'Short Melody',
  volume: 'Volume',
  testSound: 'Test Sound',
  ringUntilStopped: 'Ring Until Stopped',
  gradualVolume: 'Gradually Increase Volume',
  snoozeLengthMin: 'Snooze Length (minutes)',
  tickingSound: 'Ticking Sound While Focusing',
  desktopNotifs: 'Show Desktop Notifications',
  behavior: 'Behavior',
  autoStartBreaks: 'Auto-start Breaks',
  autoStartWork: 'Auto-start Work',
  autoCheckTask: 'Auto-check Task on Complete',

  worldClock: 'World Clock',
  allCitiesLink: 'All cities and time zones →',
  yourTime: 'Your Time',
  yourCities: 'Your Cities',
  searchCityPlaceholder: 'Search city or country...',
  deviceClockSynced: 'Device clock synced',
  now: 'Now',
  timeFromNow: 'Time From Now',
  daysFromToday: 'Days From Today',

  workTab: 'Work',
  todayStatsTemplate: 'Today: {s} completed · {m} min focused',
  tasksTitle: 'Tasks',
  clearCompleted: 'Clear Completed',
  addTaskPlaceholder: 'Add a task...',
  noTasksMessage: 'No tasks added. Add tasks to track your study sessions.',
  tasksSummaryTemplate: '{done} of {total} sessions · Finish at {time}',
  progressTitle: 'Progress',
  statisticsTitle: 'Statistics',
  dailyGoalLabel: 'Daily Goal',
  focusTimeLabel: 'Focus Time',
  dayStreakLabel: 'Day Streak',
  last7Days: 'Last 7 Days',
  range7Days: '7 Days',
  range30Days: '30 Days',
  range12Months: '12 Months',
  sessionsLabel: 'Sessions',
  dailyAverageLabel: 'Daily Average',
  bestDayLabel: 'Best Day',
  longestStreakLabel: 'Longest Streak',
  tasksDoneLabel: 'Tasks Done',
  privacyNote: 'Your history is saved only in this browser. Nothing is sent to a server.',
  exportCsv: 'Export CSV',
  clearHistory: 'Clear History',
  tapAgainToClear: 'Tap Again to Clear',

  customTime: 'Custom Time',
  timesUp: "Time's Up",
  allTimers: 'All Timers',
  lapCol: 'Lap',
  lapTimeCol: 'Lap Time',
  totalTimeCol: 'Total Time',
  createCountdown: 'Create a countdown timer',
  dateLabel: 'Date',
  timeLabel: 'Time',
  countdownNameLabel: 'Countdown name',
  setCountdown: 'Set Countdown',
  presetCountdowns: 'Preset Countdowns',
  todayGroup: 'Today',
  holidaysGroup: 'Holidays',
  quickCountdownsGroup: 'Quick Countdowns',
  holidayCountdowns: 'Holiday Countdowns',
  holidayCol: 'Holiday',
  daysLeftCol: 'Days Left',
  untilPrefix: 'until',

  addAlarm: 'Add Alarm',
  setNewAlarm: 'Set New Alarm',
  alarmsTitle: 'Alarms',
  noAlarmsSet: 'No alarms set.',
  labelField: 'Label',
  repeatField: 'Repeat',
  repeatOnce: 'Once',
  repeatEveryDay: 'Every Day',
  repeatWeekdays: 'Weekdays',
  repeatWeekends: 'Weekends',
  vibrate: 'Vibrate',
  alarmTimes: 'Alarm Times',
};

const AR: UIStrings = {
  dockClock: 'الساعة',
  dockStudy: 'مذاكرة',
  dockTimer: 'مؤقت',
  dockStopwatch: 'إيقاف',
  dockCountdown: 'عد تنازلي',
  dockAlarm: 'منبّه',

  headerClock: 'ساعة الوقت الحالي القلّابة',
  headerStudy: 'مؤقت المذاكرة والتركيز',
  headerTimer: 'المؤقت',
  headerStopwatch: 'ساعة الإيقاف',
  headerCountdown: 'العد التنازلي',
  headerAlarm: 'ساعة المنبّه',
  headerLocalTime: 'توقيتك المحلي',

  start: 'بدء',
  pause: 'إيقاف مؤقت',
  resume: 'استئناف',
  reset: 'إعادة ضبط',
  lap: 'لفة',
  skip: 'تخطي',
  ok: 'موافق',
  restart: 'إعادة البدء',
  snooze: 'غفوة',
  days: 'أيام',
  hours: 'ساعات',
  minutes: 'دقائق',
  seconds: 'ثوانٍ',
  hour: 'الساعة',
  minute: 'الدقيقة',

  settingsTitle: 'الإعدادات',
  studySettingsTitle: 'إعدادات مؤقت المذاكرة',
  themeSelection: 'اختيار المظهر',
  themeDark: 'داكن',
  themeLight: 'فاتح',
  themeMidnight: 'منتصف الليل',
  themeSand: 'رملي',
  flipStyle: 'نمط القلب',
  styleSimple: 'بسيط',
  styleStandard: 'قياسي',
  stylePro: 'احترافي',

  clockDisplay: 'عرض الساعة',
  use24Hour: 'استخدام نظام 24 ساعة',
  showSeconds: 'إظهار الثواني',
  showDateDay: 'إظهار التاريخ واليوم',

  clockStyle: 'تصميم الساعة',
  appearance: 'المظهر',
  layout: 'التخطيط',
  layoutAuto: 'تلقائي',
  layoutHorizontal: 'أفقي',
  layoutVertical: 'عمودي',
  size: 'الحجم',
  cornerRadius: 'استدارة الحواف',
  resetDefaults: 'استعادة الإعدادات الافتراضية',
  settingsResetToast: 'تمت استعادة الإعدادات الافتراضية',
  fullscreenExitToast: 'انقر مرتين للخروج من ملء الشاشة',

  presets: 'القوالب الجاهزة',
  presetClassic: 'كلاسيكي (25-5-15)',
  presetShort: 'قصير (15-3-9)',
  presetLong: 'طويل (50-10-30)',
  timeSettingsMin: 'إعدادات الوقت (بالدقائق)',
  workSession: 'جلسة العمل',
  shortBreak: 'استراحة قصيرة',
  longBreak: 'استراحة طويلة',
  sessionsUntilLong: 'الجلسات قبل الاستراحة الطويلة',
  dailyGoalSessions: 'الهدف اليومي (جلسات)',
  soundAndNotifs: 'الصوت والإشعارات',
  alarmSound: 'صوت المنبّه',
  soundNotification: 'التنبيه الصوتي',
  selectSound: 'اختيار النغمة',
  soundBell: 'صوت الجرس (افتراضي)',
  soundClassic: 'منبّه كلاسيكي',
  soundBeacon: 'إشارة ضوئية',
  soundSunrise: 'شروق الشمس',
  soundChime: 'رنين هادئ',
  soundDigital: 'صفير رقمي',
  soundMelody: 'لحن قصير',
  volume: 'مستوى الصوت',
  testSound: 'تجربة الصوت',
  ringUntilStopped: 'رنين مستمر حتى الإيقاف',
  gradualVolume: 'رفع الصوت تدريجياً',
  snoozeLengthMin: 'مدة الغفوة (بالدقائق)',
  tickingSound: 'صوت عقارب أثناء التركيز',
  desktopNotifs: 'إظهار إشعارات سطح المكتب',
  behavior: 'السلوك التلقائي',
  autoStartBreaks: 'بدء الاستراحات تلقائياً',
  autoStartWork: 'بدء جلسات العمل تلقائياً',
  autoCheckTask: 'إكمال المهمة تلقائياً عند الانتهاء',

  worldClock: 'الساعة العالمية',
  allCitiesLink: 'جميع المدن والمناطق الزمنية ←',
  yourTime: 'توقيتك',
  yourCities: 'مدنك المفضلة',
  searchCityPlaceholder: 'ابحث عن مدينة أو دولة...',
  deviceClockSynced: 'ساعة الجهاز متزامنة',
  now: 'الآن',
  timeFromNow: 'الوقت من الآن',
  daysFromToday: 'أيام من اليوم',

  workTab: 'عمل',
  todayStatsTemplate: 'اليوم: {s} مكتملة · {m} د تركيز',
  tasksTitle: 'المهام',
  clearCompleted: 'مسح المكتملة',
  addTaskPlaceholder: 'أضف مهمة جديدة...',
  noTasksMessage: 'لا توجد مهام بعد. أضف مهامك لتتبع جلسات المذاكرة.',
  tasksSummaryTemplate: '{done} من {total} جلسات · الانتهاء عند {time}',
  progressTitle: 'التقدم',
  statisticsTitle: 'الإحصائيات',
  dailyGoalLabel: 'الهدف اليومي',
  focusTimeLabel: 'وقت التركيز',
  dayStreakLabel: 'أيام متتالية',
  last7Days: 'آخر 7 أيام',
  range7Days: '7 أيام',
  range30Days: '30 يوماً',
  range12Months: '12 شهراً',
  sessionsLabel: 'الجلسات',
  dailyAverageLabel: 'المتوسط اليومي',
  bestDayLabel: 'أفضل يوم',
  longestStreakLabel: 'أطول سلسلة',
  tasksDoneLabel: 'مهام منجزة',
  privacyNote: 'يتم حفظ سجلك محلياً في هذا المتصفح فقط ولا يُرسل إلى أي خادم.',
  exportCsv: 'تصدير CSV',
  clearHistory: 'مسح السجل',
  tapAgainToClear: 'اضغط مرة أخرى للتأكيد',

  customTime: 'وقت مخصص',
  timesUp: 'انتهى الوقت',
  allTimers: 'جميع المؤقتات',
  lapCol: 'اللفة',
  lapTimeCol: 'زمن اللفة',
  totalTimeCol: 'الزمن الكلي',
  createCountdown: 'إنشاء عد تنازلي',
  dateLabel: 'التاريخ',
  timeLabel: 'الوقت',
  countdownNameLabel: 'اسم المناسبة',
  setCountdown: 'ضبط العد التنازلي',
  presetCountdowns: 'عد تنازلي جاهز',
  todayGroup: 'اليوم',
  holidaysGroup: 'المناسبات',
  quickCountdownsGroup: 'سريع',
  holidayCountdowns: 'العد التنازلي للمناسبات',
  holidayCol: 'المناسبة',
  daysLeftCol: 'الأيام المتبقية',
  untilPrefix: 'حتى',

  addAlarm: 'إضافة منبّه',
  setNewAlarm: 'ضبط منبّه جديد',
  alarmsTitle: 'المنبّهات',
  noAlarmsSet: 'لا توجد منبّهات مضبوطة.',
  labelField: 'التسمية',
  repeatField: 'التكرار',
  repeatOnce: 'مرة واحدة',
  repeatEveryDay: 'يومياً',
  repeatWeekdays: 'أيام العمل',
  repeatWeekends: 'عطلة نهاية الأسبوع',
  vibrate: 'اهتزاز',
  alarmTimes: 'أوقات المنبّه السريعة',
};

const OVERRIDES: Partial<Record<LangCode, Partial<UIStrings>>> = {
  es: {
    dockClock: 'Reloj', dockStudy: 'Estudio', dockTimer: 'Temporizador', dockStopwatch: 'Cronómetro', dockCountdown: 'Cuenta atrás', dockAlarm: 'Alarma',
    headerClock: 'Reloj Flip de Hora Actual', headerStudy: 'Temporizador de Estudio', headerTimer: 'Temporizador', headerStopwatch: 'Cronómetro', headerCountdown: 'Cuenta Regresiva', headerAlarm: 'Despertador',
    start: 'Iniciar', pause: 'Pausar', resume: 'Reanudar', reset: 'Reiniciar', lap: 'Vuelta', ok: 'Aceptar', restart: 'Reiniciar', snooze: 'Posponer',
    days: 'Días', hours: 'Horas', minutes: 'Minutos', seconds: 'Segundos',
    settingsTitle: 'Configuración', studySettingsTitle: 'Ajustes de Estudio', themeSelection: 'Selección de Tema',
    themeDark: 'Oscuro', themeLight: 'Claro', themeMidnight: 'Medianoche', themeSand: 'Arena',
    flipStyle: 'Estilo de giro', styleSimple: 'Sencillo', styleStandard: 'Estándar', stylePro: 'Profesional',
    clockDisplay: 'Visualización del Reloj', use24Hour: 'Usar Formato de 24 Horas', showSeconds: 'Mostrar Segundos', showDateDay: 'Mostrar Fecha y Día',
    clockStyle: 'Estilo del Reloj', appearance: 'Apariencia', layout: 'Diseño', layoutAuto: 'Automático', layoutHorizontal: 'Horizontal', layoutVertical: 'Vertical',
    size: 'Tamaño', cornerRadius: 'Radio de Esquina', resetDefaults: 'Restablecer valores predeterminados',
    worldClock: 'Reloj Mundial', allCitiesLink: 'Todas las ciudades y zonas horarias →',
    workTab: 'Trabajo', shortBreak: 'Descanso corto', longBreak: 'Descanso largo',
    tasksTitle: 'Tareas', progressTitle: 'Progreso', statisticsTitle: 'Estadísticas',
    addAlarm: 'Añadir Alarma', setNewAlarm: 'Nueva Alarma', alarmsTitle: 'Alarmas',
  },
  de: {
    dockClock: 'Uhr', dockStudy: 'Lernen', dockTimer: 'Timer', dockStopwatch: 'Stoppuhr', dockCountdown: 'Countdown', dockAlarm: 'Wecker',
    headerClock: 'Aktuelle Flip-Uhr', headerStudy: 'Lerntimer', headerTimer: 'Timer', headerStopwatch: 'Stoppuhr', headerCountdown: 'Countdown-Timer', headerAlarm: 'Wecker',
    start: 'Start', pause: 'Pause', resume: 'Weiter', reset: 'Zurücksetzen', lap: 'Runde', snooze: 'Schlummern',
    days: 'Tage', hours: 'Stunden', minutes: 'Minuten', seconds: 'Sekunden',
    settingsTitle: 'Einstellungen', themeSelection: 'Themenauswahl', themeDark: 'Dunkel', themeLight: 'Hell', themeMidnight: 'Mitternacht', themeSand: 'Sand',
    flipStyle: 'Flip-Stil', styleSimple: 'Einfach', styleStandard: 'Standard', stylePro: 'Professionell',
    clockDisplay: 'Uhranzeige', use24Hour: '24-Stunden-Format verwenden', showSeconds: 'Sekunden anzeigen', showDateDay: 'Datum & Tag anzeigen',
    clockStyle: 'Uhrstil', appearance: 'Darstellung', layout: 'Layout', layoutAuto: 'Auto', layoutHorizontal: 'Horizontal', layoutVertical: 'Vertikal',
    size: 'Größe', cornerRadius: 'Eckenradius', resetDefaults: 'Auf Standard zurücksetzen',
    worldClock: 'Weltuhr', allCitiesLink: 'Alle Städte und Zeitzonen →',
    workTab: 'Fokus', shortBreak: 'Kurze Pause', longBreak: 'Lange Pause',
    tasksTitle: 'Aufgaben', progressTitle: 'Fortschritt', statisticsTitle: 'Statistiken',
    addAlarm: 'Wecker stellen', setNewAlarm: 'Neuer Wecker', alarmsTitle: 'Wecker',
  },
  fr: {
    dockClock: 'Horloge', dockStudy: 'Étude', dockTimer: 'Minuteur', dockStopwatch: 'Chrono', dockCountdown: 'Décompte', dockAlarm: 'Alarme',
    headerClock: 'Horloge Flip Heure Actuelle', headerStudy: "Minuteur d'Étude", headerTimer: 'Minuteur', headerStopwatch: 'Chronomètre', headerCountdown: 'Compte à Rebours', headerAlarm: 'Réveil',
    start: 'Démarrer', pause: 'Pause', resume: 'Reprendre', reset: 'Réinitialiser', lap: 'Tour', snooze: 'Répéter',
    days: 'Jours', hours: 'Heures', minutes: 'Minutes', seconds: 'Secondes',
    settingsTitle: 'Paramètres', themeSelection: 'Thème', themeDark: 'Sombre', themeLight: 'Clair', themeMidnight: 'Minuit', themeSand: 'Sable',
    flipStyle: 'Style de bascule', styleSimple: 'Simple', styleStandard: 'Standard', stylePro: 'Professionnel',
    clockDisplay: "Affichage de l'horloge", use24Hour: 'Format 24 heures', showSeconds: 'Afficher les secondes', showDateDay: 'Afficher la date et le jour',
    clockStyle: "Style d'horloge", appearance: 'Apparence', layout: 'Disposition', layoutAuto: 'Auto', layoutHorizontal: 'Horizontal', layoutVertical: 'Vertical',
    size: 'Taille', cornerRadius: 'Rayon des coins', resetDefaults: 'Réinitialiser par défaut',
    worldClock: 'Horloge Mondiale', allCitiesLink: 'Toutes les villes et fuseaux horaires →',
    workTab: 'Travail', shortBreak: 'Pause courte', longBreak: 'Pause longue',
    tasksTitle: 'Tâches', progressTitle: 'Progression', statisticsTitle: 'Statistiques',
    addAlarm: 'Ajouter une alarme', setNewAlarm: 'Nouvelle alarme', alarmsTitle: 'Alarmes',
  },
  pt: {
    dockClock: 'Relógio', dockStudy: 'Estudo', dockTimer: 'Temporizador', dockStopwatch: 'Cronômetro', dockCountdown: 'Contagem', dockAlarm: 'Alarme',
    headerClock: 'Relógio Flip Atual', headerStudy: 'Temporizador de Estudo', headerTimer: 'Temporizador', headerStopwatch: 'Cronômetro', headerCountdown: 'Contagem Regressiva', headerAlarm: 'Despertador',
    start: 'Iniciar', pause: 'Pausar', resume: 'Retomar', reset: 'Redefinir', lap: 'Volta', snooze: 'Soneca',
    days: 'Dias', hours: 'Horas', minutes: 'Minutos', seconds: 'Segundos',
    settingsTitle: 'Configurações', themeSelection: 'Tema', themeDark: 'Escuro', themeLight: 'Claro', themeMidnight: 'Meia-noite', themeSand: 'Areia',
    flipStyle: 'Estilo Flip', styleSimple: 'Simples', styleStandard: 'Padrão', stylePro: 'Profissional',
    clockDisplay: 'Exibição do Relógio', use24Hour: 'Formato 24 Horas', showSeconds: 'Mostrar Segundos', showDateDay: 'Mostrar Data e Dia',
    appearance: 'Aparência', size: 'Tamanho', cornerRadius: 'Raio do Canto', resetDefaults: 'Restaurar Padrões',
    worldClock: 'Relógio Mundial', workTab: 'Foco', shortBreak: 'Pausa Curta', longBreak: 'Pausa Longa',
  },
  it: {
    dockClock: 'Orologio', dockStudy: 'Studio', dockTimer: 'Timer', dockStopwatch: 'Cronometro', dockCountdown: 'Conto alla rovescia', dockAlarm: 'Sveglia',
    headerClock: 'Orologio Flip Ora Attuale', headerStudy: 'Timer di Studio', headerTimer: 'Timer', headerStopwatch: 'Cronometro', headerCountdown: 'Conto alla Rovescia', headerAlarm: 'Sveglia',
    start: 'Avvia', pause: 'Pausa', resume: 'Riprendi', reset: 'Azzera', lap: 'Giro',
    days: 'Giorni', hours: 'Ore', minutes: 'Minuti', seconds: 'Secondi',
    settingsTitle: 'Impostazioni', themeSelection: 'Tema', themeDark: 'Scuro', themeLight: 'Chiaro', themeMidnight: 'Mezzanotte', themeSand: 'Sabbia',
    flipStyle: 'Stile Flip', use24Hour: 'Formato 24 Ore', showSeconds: 'Mostra Secondi', showDateDay: 'Mostra Data e Giorno',
    resetDefaults: 'Ripristina predefiniti', worldClock: 'Orologio Mondiale',
  },
  pl: {
    dockClock: 'Zegar', dockStudy: 'Nauka', dockTimer: 'Minutnik', dockStopwatch: 'Stoper', dockCountdown: 'Odliczanie', dockAlarm: 'Budzik',
    headerClock: 'Zegar Klapkowy', settingsTitle: 'Ustawienia', themeSelection: 'Motyw', flipStyle: 'Styl klapek',
    start: 'Start', pause: 'Pauza', resume: 'Wznów', reset: 'Resetuj', lap: 'Okrążenie',
    use24Hour: 'Format 24-godzinny', showSeconds: 'Pokaż sekundy', showDateDay: 'Pokaż datę i dzień', resetDefaults: 'Przywróć domyślne',
  },
  ru: {
    dockClock: 'Часы', dockStudy: 'Учёба', dockTimer: 'Таймер', dockStopwatch: 'Секундомер', dockCountdown: 'Отсчёт', dockAlarm: 'Будильник',
    headerClock: 'Перекидные Часы', headerStudy: 'Таймер Учёбы', headerTimer: 'Таймер', headerStopwatch: 'Секундомер', headerCountdown: 'Обратный Отсчёт', headerAlarm: 'Будильник',
    start: 'Старт', pause: 'Пауза', resume: 'Продолжить', reset: 'Сброс', lap: 'Круг',
    days: 'Дни', hours: 'Часы', minutes: 'Минуты', seconds: 'Секунды',
    settingsTitle: 'Настройки', themeSelection: 'Тема', themeDark: 'Тёмная', themeLight: 'Светлая', themeMidnight: 'Полночь', themeSand: 'Песок',
    flipStyle: 'Стиль карточек', use24Hour: '24-часовой формат', showSeconds: 'Показывать секунды', showDateDay: 'Показывать дату и день',
    resetDefaults: 'Сбросить настройки', worldClock: 'Мировое время',
  },
  uk: {
    dockClock: 'Годинник', dockStudy: 'Навчання', dockTimer: 'Таймер', dockStopwatch: 'Секундомір', dockCountdown: 'Відлік', dockAlarm: 'Будильник',
    headerClock: 'Перекидний Годинник', settingsTitle: 'Налаштування', start: 'Старт', pause: 'Пауза', resume: 'Продовжити', reset: 'Скинути',
    use24Hour: '24-годинний формат', showSeconds: 'Показувати секунди', showDateDay: 'Показувати дату й день', resetDefaults: 'Скинути за замовчуванням',
  },
  cs: {
    dockClock: 'Hodiny', dockStudy: 'Studium', dockTimer: 'Časovač', dockStopwatch: 'Stopky', dockCountdown: 'Odpočet', dockAlarm: 'Budík',
    headerClock: 'Překlápěcí Hodiny', settingsTitle: 'Nastavení', start: 'Start', pause: 'Pauza', reset: 'Reset',
    use24Hour: '24hodinový formát', showSeconds: 'Zobrazit sekundy', showDateDay: 'Zobrazit datum a den', resetDefaults: 'Obnovit výchozí',
  },
  fi: {
    dockClock: 'Kello', dockStudy: 'Opiskelu', dockTimer: 'Ajastin', dockStopwatch: 'Sekuntikello', dockCountdown: 'Laskuri', dockAlarm: 'Herätys',
    headerClock: 'Kääntökello', settingsTitle: 'Asetukset', start: 'Käynnistä', pause: 'Tauko', reset: 'Nollaa',
    use24Hour: '24 tunnin muoto', showSeconds: 'Näytä sekunnit', showDateDay: 'Näytä päivämäärä', resetDefaults: 'Palauta oletukset',
  },
  id: {
    dockClock: 'Jam', dockStudy: 'Belajar', dockTimer: 'Timer', dockStopwatch: 'Stopwatch', dockCountdown: 'Hitung Mundur', dockAlarm: 'Alarm',
    headerClock: 'Jam Flip Waktu Saat Ini', settingsTitle: 'Pengaturan', start: 'Mulai', pause: 'Jeda', resume: 'Lanjut', reset: 'Atur Ulang',
    use24Hour: 'Format 24 Jam', showSeconds: 'Tampilkan Detik', showDateDay: 'Tampilkan Tanggal & Hari', resetDefaults: 'Atur Ulang ke Awal',
  },
  ja: {
    dockClock: '時計', dockStudy: '学習', dockTimer: 'タイマー', dockStopwatch: 'ストップウォッチ', dockCountdown: 'カウントダウン', dockAlarm: 'アラーム',
    headerClock: 'フリップ時計', headerStudy: 'ポモドーロ学習タイマー', headerTimer: 'タイマー', headerStopwatch: 'ストップウォッチ', headerCountdown: 'カウントダウン', headerAlarm: 'アラーム時計',
    start: '開始', pause: '一時停止', resume: '再開', reset: 'リセット', lap: 'ラップ', snooze: 'スヌーズ',
    days: '日', hours: '時間', minutes: '分', seconds: '秒',
    settingsTitle: '設定', themeSelection: 'テーマ選択', themeDark: 'ダーク', themeLight: 'ライト', themeMidnight: 'ミッドナイト', themeSand: 'サンド',
    flipStyle: 'フリップスタイル', styleSimple: 'シンプル', styleStandard: 'スタンダード', stylePro: 'プロフェッショナル',
    use24Hour: '24時間表示', showSeconds: '秒を表示', showDateDay: '日付と曜日を表示',
    size: 'サイズ', cornerRadius: '角の丸み', resetDefaults: '初期設定に戻す', worldClock: '世界時計',
  },
  nl: {
    dockClock: 'Klok', dockStudy: 'Studie', dockTimer: 'Timer', dockStopwatch: 'Stopwatch', dockCountdown: 'Aftellen', dockAlarm: 'Wekker',
    headerClock: 'Huidige Tijd Flipklok', settingsTitle: 'Instellingen', start: 'Start', pause: 'Pauze', reset: 'Reset',
    use24Hour: '24-uursnotatie', showSeconds: 'Seconden tonen', showDateDay: 'Datum & dag tonen', resetDefaults: 'Standaardwaarden herstellen',
  },
  th: {
    dockClock: 'นาฬิกา', dockStudy: 'อ่านหนังสือ', dockTimer: 'จับเวลาถอยหลัง', dockStopwatch: 'จับเวลา', dockCountdown: 'นับถอยหลัง', dockAlarm: 'นาฬิกาปลุก',
    headerClock: 'นาฬิกาพลิกเวลาปัจจุบัน', settingsTitle: 'การตั้งค่า', start: 'เริ่ม', pause: 'หยุดชั่วคราว', reset: 'รีเซ็ต',
    use24Hour: 'รูปแบบ 24 ชั่วโมง', showSeconds: 'แสดงวินาที', showDateDay: 'แสดงวันที่และวัน', resetDefaults: 'คืนค่าเริ่มต้น',
  },
  tw: {
    dockClock: '時鐘', dockStudy: '專注', dockTimer: '計時器', dockStopwatch: '碼錶', dockCountdown: '倒數', dockAlarm: '鬧鐘',
    headerClock: '翻頁時鐘', headerStudy: '專注學習計時器', headerTimer: '計時器', headerStopwatch: '碼錶', headerCountdown: '倒數計時器', headerAlarm: '鬧鐘',
    start: '開始', pause: '暫停', resume: '繼續', reset: '重設', lap: '分圈', snooze: '貪睡',
    days: '天', hours: '小時', minutes: '分鐘', seconds: '秒',
    settingsTitle: '設定', themeSelection: '主題選擇', themeDark: '深色', themeLight: '淺色', themeMidnight: '午夜', themeSand: '暖沙',
    flipStyle: '翻頁樣式', styleSimple: '簡約', styleStandard: '標準', stylePro: '專業',
    use24Hour: '使用 24 小時制', showSeconds: '顯示秒數', showDateDay: '顯示日期與星期',
    size: '大小', cornerRadius: '圓角半徑', resetDefaults: '重設為預設值', worldClock: '世界時鐘',
  },
  vi: {
    dockClock: 'Đồng hồ', dockStudy: 'Học tập', dockTimer: 'Hẹn giờ', dockStopwatch: 'Bấm giờ', dockCountdown: 'Đếm ngược', dockAlarm: 'Báo thức',
    headerClock: 'Đồng Hồ Lật Hiện Tại', settingsTitle: 'Cài đặt', start: 'Bắt đầu', pause: 'Tạm dừng', reset: 'Đặt lại',
    use24Hour: 'Định dạng 24 giờ', showSeconds: 'Hiện giây', showDateDay: 'Hiện ngày & thứ', resetDefaults: 'Khôi phục mặc định',
  },
  da: {
    dockClock: 'Ur', dockStudy: 'Studie', dockTimer: 'Timer', dockStopwatch: 'Stopur', dockCountdown: 'Nedtælling', dockAlarm: 'Alarm',
    headerClock: 'Flip-ur', settingsTitle: 'Indstillinger', start: 'Start', pause: 'Pause', reset: 'Nulstil',
    use24Hour: '24-timers format', showSeconds: 'Vis sekunder', showDateDay: 'Vis dato og dag', resetDefaults: 'Nulstil til standard',
  },
  hu: {
    dockClock: 'Óra', dockStudy: 'Tanulás', dockTimer: 'Időzítő', dockStopwatch: 'Stopper', dockCountdown: 'Visszaszámláló', dockAlarm: 'Ébresztő',
    headerClock: 'Lapozós Óra', settingsTitle: 'Beállítások', start: 'Indítás', pause: 'Szünet', reset: 'Visszaállítás',
    use24Hour: '24 órás formátum', showSeconds: 'Másodpercek megjelenítése', showDateDay: 'Dátum és nap megjelenítése', resetDefaults: 'Alaphelyzet',
  },
  no: {
    dockClock: 'Klokke', dockStudy: 'Studie', dockTimer: ' Nedtelling', dockStopwatch: 'Stoppeklokke', dockCountdown: 'Dato', dockAlarm: 'Alarm',
    headerClock: 'Flip-klokke', settingsTitle: 'Innstillinger', start: 'Start', pause: 'Pause', reset: 'Nullstill',
    use24Hour: '24-timers format', showSeconds: 'Vis sekunder', showDateDay: 'Vis dato og dag', resetDefaults: 'Tilbakestill til standard',
  },
  el: {
    dockClock: 'Ρολόι', dockStudy: 'Μελέτη', dockTimer: 'Χρονόμετρο', dockStopwatch: 'Χρονογράφος', dockCountdown: 'Αντίστροφη', dockAlarm: 'Ξυπνητήρι',
    headerClock: 'Ρολόι Flip', settingsTitle: 'Ρυθμίσεις', start: 'Έναρξη', pause: 'Παύση', reset: 'Επαναφορά',
    use24Hour: '24ωρη μορφή', showSeconds: 'Εμφάνιση δευτερολέπτων', showDateDay: 'Εμφάνιση ημερομηνίας', resetDefaults: 'Επαναφορά προεπιλογών',
  },
  sv: {
    dockClock: 'Klocka', dockStudy: 'Studera', dockTimer: 'Timer', dockStopwatch: 'Stoppur', dockCountdown: 'Nedräkning', dockAlarm: 'Alarm',
    headerClock: 'Flipklocka', settingsTitle: 'Inställningar', start: 'Starta', pause: 'Pausa', reset: 'Återställ',
    use24Hour: '24-timmarsformat', showSeconds: 'Visa sekunder', showDateDay: 'Visa datum och dag', resetDefaults: 'Återställ standard',
  },
  ko: {
    dockClock: '시계', dockStudy: '공부', dockTimer: '타이머', dockStopwatch: '스톱워치', dockCountdown: '카운트다운', dockAlarm: '알람',
    headerClock: '현재 시간 플립 시계', headerStudy: '공부 타이머', headerTimer: '타이머', headerStopwatch: '스톱워치', headerCountdown: '카운트다운', headerAlarm: '알람 시계',
    start: '시작', pause: '일시정지', resume: '계속', reset: '초기화', lap: '랩', snooze: '다시 알림',
    days: '일', hours: '시간', minutes: '분', seconds: '초',
    settingsTitle: '설정', themeSelection: '테마 선택', themeDark: '다크', themeLight: '라이트', themeMidnight: '미드나잇', themeSand: '샌드',
    flipStyle: '플립 스타일', styleSimple: '심플', styleStandard: '스탠다드', stylePro: '프로페셔널',
    use24Hour: '24시간 형식 사용', showSeconds: '초 표시', showDateDay: '날짜 및 요일 표시',
    size: '크기', cornerRadius: '모서리 둥글기', resetDefaults: '기본값으로 재설정', worldClock: '세계 시계',
  },
};

export function getStrings(lang: LangCode): UIStrings {
  if (lang === 'en') return EN;
  if (lang === 'ar') return AR;
  const partial = OVERRIDES[lang];
  return partial ? { ...EN, ...partial } : EN;
}

export function getLanguageMeta(lang: LangCode): LanguageOption {
  return LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];
}
