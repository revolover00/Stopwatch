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

// Interface strings for the supported locales, including Arabic.
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
  headerWorldClock: string;
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
  tomorrow: string;

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
  soundGroupWakeup: string;
  soundGroupMusical: string;
  soundSiren: string;
  soundAirhorn: string;
  soundAirraid: string;
  soundFiretruck: string;
  soundFirebell: string;
  soundRooster: string;
  soundBell: string;
  soundPiano: string;
  soundGuitar: string;
  soundMelody: string;
  soundKalimba: string;
  soundChime: string;
  soundSunrise: string;
  soundHarmony: string;
  soundCrystal: string;
  soundBeacon: string;
  soundDigital: string;
  soundClassic: string;
  volume: string;
  testSound: string;
  stopPreview: string;
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
  noPlacesFound: string;
  deviceClockSynced: string;
  now: string;
  sameTime: string;
  pinnedCityToast: string;
  unpinnedCityToast: string;
  pinCityLabel: string;
  unpinCityLabel: string;
  timeFromNow: string;
  daysFromToday: string;

  // Study Page
  workTab: string;
  todayStatsTemplate: string;
  tasksTitle: string;
  clearCompleted: string;
  addTaskPlaceholder: string;
  noTasksMessage: string;
  tasksSummaryTemplate: string;
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
  reachedPrefix: string;
  countdownComplete: string;
  footerHolidays: string;

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
  alarmSetToastTemplate: string;
  alarmDuplicateToastTemplate: string;
  snoozedUntilTemplate: string;
}

const EN: UIStrings = {
  dockClock: 'Clock',
  dockStudy: 'Study',
  dockTimer: 'Timer',
  dockStopwatch: 'Stopwatch',
  dockCountdown: 'Countdown',
  dockAlarm: 'Alarm',

  headerClock: 'Flip Clock',
  headerWorldClock: 'Online World Clock',
  headerStudy: 'Pomodoro Study Timer',
  headerTimer: 'Online Timer',
  headerStopwatch: 'Online Stopwatch',
  headerCountdown: 'Online Countdown',
  headerAlarm: 'Online Alarm Clock',
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
  tomorrow: 'Tomorrow',

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
  selectSound: 'Ringtone',
  soundGroupWakeup: '🚨 Extreme Wake-Up (Heavy Sleepers)',
  soundGroupMusical: '🎵 Musical Ringtones',
  soundSiren: '🚨 Security Siren',
  soundAirhorn: '📢 Stadium Airhorn',
  soundAirraid: '☢️ Air Raid Siren',
  soundFiretruck: '🚒 Fire Truck Siren',
  soundFirebell: '🔔 Loud Fire Bell',
  soundRooster: '🐓 Morning Rooster',
  soundPiano: 'Melody Piano',
  soundBell: 'Glass Marimba',
  soundGuitar: 'Acoustic Guitar',
  soundMelody: 'Arpeggio Ringtone',
  soundKalimba: 'Warm Kalimba',
  soundHarmony: 'Acoustic Chords',
  soundSunrise: 'Celestial Sunrise',
  soundChime: 'Morning Chimes',
  soundCrystal: 'Crystal Counterpoint',
  soundBeacon: 'Upbeat Ringtone',
  soundDigital: 'Synth Melody',
  soundClassic: 'Guitar Groove',
  volume: 'Volume',
  testSound: 'Preview Ringtone',
  stopPreview: 'Stop Preview',
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
  noPlacesFound: 'No places found.',
  deviceClockSynced: 'Your clock is exact',
  now: 'Now',
  sameTime: 'Same time',
  pinnedCityToast: 'World Clock now opens on {name}',
  unpinnedCityToast: 'World Clock opens on your local time',
  pinCityLabel: 'Make {name} the default World Clock city',
  unpinCityLabel: '{name} is pinned to World Clock',
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
  reachedPrefix: 'Reached',
  countdownComplete: 'Countdown Reached!',
  footerHolidays: 'Holidays',

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
  alarmSetToastTemplate: 'Alarm set for {time} from now.',
  alarmDuplicateToastTemplate: 'An alarm for {time} already exists.',
  snoozedUntilTemplate: 'Snoozed until {time}',
};

const AR: UIStrings = {
  dockClock: 'الساعة',
  dockStudy: 'مذاكرة',
  dockTimer: 'مؤقت',
  dockStopwatch: 'إيقاف',
  dockCountdown: 'عد تنازلي',
  dockAlarm: 'منبّه',

  headerClock: 'الساعة القلّابة',
  headerWorldClock: 'الساعة العالمية عبر الإنترنت',
  headerStudy: 'مؤقت المذاكرة بومودورو',
  headerTimer: 'المؤقت عبر الإنترنت',
  headerStopwatch: 'ساعة الإيقاف عبر الإنترنت',
  headerCountdown: 'العد التنازلي عبر الإنترنت',
  headerAlarm: 'ساعة المنبّه عبر الإنترنت',
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
  tomorrow: 'غداً',

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
  workSession: 'جلسة تركيز',
  shortBreak: 'استراحة قصيرة',
  longBreak: 'استراحة طويلة',
  sessionsUntilLong: 'الجلسات قبل الاستراحة الطويلة',
  dailyGoalSessions: 'الهدف اليومي (جلسات)',
  soundAndNotifs: 'الصوت والإشعارات',
  alarmSound: 'نغمة المنبّه',
  soundNotification: 'التنبيه الصوتي',
  selectSound: 'اختيار النغمة',
  soundGroupWakeup: '🚨 نغمات إيقاظ صادمة (للنوم الثقيل)',
  soundGroupMusical: '🎵 نغمات موسيقية وهادئة',
  soundSiren: '🚨 سرينة إنذار طوارئ',
  soundAirhorn: '📢 بوق هوائي صاعق',
  soundAirraid: '☢️ صفارة غارة جوية',
  soundFiretruck: '🚒 سرينة إطفاء وإسعاف',
  soundFirebell: '🔔 جرس حريق معدني صاخب',
  soundRooster: '🐓 صياح ديك فجري عالي',
  soundPiano: 'معزوفة البيانو',
  soundBell: 'ماريمبا زجاجية',
  soundGuitar: 'جيتار كلاسيكي',
  soundMelody: 'نغمة أربيجيو',
  soundKalimba: 'كاليمبا دافئة',
  soundHarmony: 'أوتار كوتو دافئة',
  soundSunrise: 'شروق سماوي',
  soundChime: 'أجراس الصباح',
  soundCrystal: 'معزوفة كريستال',
  soundBeacon: 'نغمة هاتف حيوية',
  soundDigital: 'نغمة سينث لحنية',
  soundClassic: 'إيقاع جيتار نشط',
  volume: 'مستوى الصوت',
  testSound: 'معاينة النغمة',
  stopPreview: 'إيقاف المعاينة',
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
  noPlacesFound: 'لم يتم العثور على مدن مطابقة.',
  deviceClockSynced: 'ساعة جهازك مضبوطة بدقة',
  now: 'الآن',
  sameTime: 'نفس التوقيت',
  pinnedCityToast: 'تفتح الساعة العالمية الآن على {name}',
  unpinnedCityToast: 'تفتح الساعة العالمية الآن على توقيتك المحلي',
  pinCityLabel: 'جعل {name} المدينة الافتراضية للساعة العالمية',
  unpinCityLabel: '{name} مثبّتة في الساعة العالمية',
  timeFromNow: 'الوقت من الآن',
  daysFromToday: 'أيام من اليوم',

  workTab: 'تركيز',
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
  reachedPrefix: 'وصل إلى',
  countdownComplete: 'اكتمل العد التنازلي!',
  footerHolidays: 'المناسبات',

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
  alarmTimes: 'أوقات المنبّه',
  alarmSetToastTemplate: 'تم ضبط المنبّه ليرن بعد {time} من الآن.',
  alarmDuplicateToastTemplate: 'يوجد منبّه مضبوط بالفعل عند {time}.',
  snoozedUntilTemplate: 'غفوة حتى {time}',
};

// Complete translation dictionaries for the supported interface languages.
const OVERRIDES: Partial<Record<LangCode, Partial<UIStrings>>> = {
  es: {
    dockClock: 'Reloj', dockStudy: 'Estudio', dockTimer: 'Temporizador', dockStopwatch: 'Cronómetro', dockCountdown: 'Cuenta atrás', dockAlarm: 'Alarma',
    headerClock: 'Reloj Flip', headerWorldClock: 'Reloj Mundial Online', headerStudy: 'Temporizador Pomodoro', headerTimer: 'Temporizador Online', headerStopwatch: 'Cronómetro Online', headerCountdown: 'Cuenta Regresiva Online', headerAlarm: 'Despertador Online', headerLocalTime: 'Tu Hora Local',
    start: 'Iniciar', pause: 'Pausar', resume: 'Reanudar', reset: 'Reiniciar', lap: 'Vuelta', skip: 'Saltar', ok: 'Aceptar', restart: 'Reiniciar', snooze: 'Posponer',
    days: 'Días', hours: 'Horas', minutes: 'Minutos', seconds: 'Segundos', hour: 'Hora', minute: 'Minuto', tomorrow: 'Mañana',
    settingsTitle: 'Configuración', studySettingsTitle: 'Ajustes de Estudio', themeSelection: 'Selección de Tema',
    themeDark: 'Oscuro', themeLight: 'Claro', themeMidnight: 'Medianoche', themeSand: 'Arena',
    flipStyle: 'Estilo de giro', styleSimple: 'Sencillo', styleStandard: 'Estándar', stylePro: 'Profesional',
    clockDisplay: 'Pantalla del Reloj', use24Hour: 'Formato de 24 Horas', showSeconds: 'Mostrar Segundos', showDateDay: 'Mostrar Fecha y Día',
    clockStyle: 'Estilo del Reloj', appearance: 'Apariencia', layout: 'Diseño', layoutAuto: 'Auto', layoutHorizontal: 'Horizontal', layoutVertical: 'Vertical',
    size: 'Tamaño', cornerRadius: 'Radio de Esquina', resetDefaults: 'Restablecer valores', settingsResetToast: 'Ajustes restablecidos', fullscreenExitToast: 'Doble toque para salir de pantalla completa',
    worldClock: 'Reloj Mundial', allCitiesLink: 'Todas las ciudades y zonas horarias →', yourTime: 'Tu Hora', yourCities: 'Tus Ciudades', searchCityPlaceholder: 'Buscar ciudad o país...', noPlacesFound: 'No se encontraron lugares.', deviceClockSynced: 'Tu reloj es exacto', now: 'Ahora', sameTime: 'Misma hora',
    workTab: 'Trabajo', workSession: 'Sesión de trabajo', shortBreak: 'Descanso corto', longBreak: 'Descanso largo',
    tasksTitle: 'Tareas', clearCompleted: 'Borrar completadas', addTaskPlaceholder: 'Añadir tarea...', noTasksMessage: 'No hay tareas añadidas.', progressTitle: 'Progreso', statisticsTitle: 'Estadísticas', dailyGoalLabel: 'Meta diaria', focusTimeLabel: 'Tiempo enfocado', dayStreakLabel: 'Racha', last7Days: 'Últimos 7 días', exportCsv: 'Exportar CSV', clearHistory: 'Borrar historial', tapAgainToClear: 'Toca otra vez para borrar',
    customTime: 'Tiempo personalizado', timesUp: '¡Tiempo terminado!', allTimers: 'Todos los temporizadores', lapCol: 'Vuelta', lapTimeCol: 'Tiempo vuelta', totalTimeCol: 'Tiempo total',
    createCountdown: 'Crear cuenta regresiva', dateLabel: 'Fecha', timeLabel: 'Hora', countdownNameLabel: 'Nombre del evento', setCountdown: 'Establecer cuenta regresiva', presetCountdowns: 'Cuentas predeterminadas', todayGroup: 'Hoy', holidaysGroup: 'Festivos', holidayCountdowns: 'Cuenta atrás para festivos', footerHolidays: 'Festivos', untilPrefix: 'Hasta', countdownComplete: '¡Cuenta regresiva completada!',
    addAlarm: 'Añadir Alarma', setNewAlarm: 'Nueva Alarma', alarmsTitle: 'Alarmas', noAlarmsSet: 'No hay alarmas configuradas.', labelField: 'Etiqueta', repeatField: 'Repetir', repeatOnce: 'Una vez', repeatEveryDay: 'Todos los días', repeatWeekdays: 'Días laborables', repeatWeekends: 'Fines de semana', vibrate: 'Vibrar', alarmTimes: 'Horas de alarma',
    volume: 'Volumen', selectSound: 'Tono', testSound: 'Probar tono', stopPreview: 'Detener',
  },
  de: {
    dockClock: 'Uhr', dockStudy: 'Lernen', dockTimer: 'Timer', dockStopwatch: 'Stoppuhr', dockCountdown: 'Countdown', dockAlarm: 'Wecker',
    headerClock: 'Flip-Uhr', headerWorldClock: 'Online-Weltuhr', headerStudy: 'Pomodoro-Lerntimer', headerTimer: 'Online-Timer', headerStopwatch: 'Online-Stoppuhr', headerCountdown: 'Online-Countdown', headerAlarm: 'Online-Wecker', headerLocalTime: 'Deine Ortszeit',
    start: 'Start', pause: 'Pause', resume: 'Weiter', reset: 'Zurücksetzen', lap: 'Runde', skip: 'Überspringen', ok: 'OK', restart: 'Neu starten', snooze: 'Schlummern',
    days: 'Tage', hours: 'Stunden', minutes: 'Minuten', seconds: 'Sekunden', hour: 'Stunde', minute: 'Minute', tomorrow: 'Morgen',
    settingsTitle: 'Einstellungen', studySettingsTitle: 'Lerntimer-Einstellungen', themeSelection: 'Themenauswahl', themeDark: 'Dunkel', themeLight: 'Hell', themeMidnight: 'Mitternacht', themeSand: 'Sand',
    flipStyle: 'Flip-Stil', styleSimple: 'Einfach', styleStandard: 'Standard', stylePro: 'Professionell',
    clockDisplay: 'Uhranzeige', use24Hour: '24-Stunden-Format', showSeconds: 'Sekunden anzeigen', showDateDay: 'Datum & Tag anzeigen',
    clockStyle: 'Uhrstil', appearance: 'Darstellung', layout: 'Layout', layoutAuto: 'Auto', layoutHorizontal: 'Horizontal', layoutVertical: 'Vertikal',
    size: 'Größe', cornerRadius: 'Eckenradius', resetDefaults: 'Auf Standard zurücksetzen', settingsResetToast: 'Einstellungen zurückgesetzt', fullscreenExitToast: 'Doppeltippen zum Beenden des Vollbilds',
    worldClock: 'Weltuhr', allCitiesLink: 'Alle Städte und Zeitzonen →', yourTime: 'Deine Zeit', yourCities: 'Deine Städte', searchCityPlaceholder: 'Stadt oder Land suchen...', noPlacesFound: 'Keine Orte gefunden.', deviceClockSynced: 'Deine Uhr geht genau', now: 'Jetzt', sameTime: 'Gleiche Zeit',
    workTab: 'Fokus', workSession: 'Fokus-Sitzung', shortBreak: 'Kurze Pause', longBreak: 'Lange Pause',
    tasksTitle: 'Aufgaben', clearCompleted: 'Erledigte löschen', addTaskPlaceholder: 'Aufgabe hinzufügen...', noTasksMessage: 'Noch keine Aufgaben vorhanden.', progressTitle: 'Fortschritt', statisticsTitle: 'Statistiken', dailyGoalLabel: 'Tagesziel', focusTimeLabel: 'Fokuszeit', dayStreakLabel: 'Tages-Serie', last7Days: 'Letzte 7 Tage', exportCsv: 'CSV exportieren', clearHistory: 'Verlauf löschen', tapAgainToClear: 'Erneut tippen zum Löschen',
    customTime: 'Eigene Zeit', timesUp: 'Zeit abgelaufen', allTimers: 'Alle Timer', lapCol: 'Runde', lapTimeCol: 'Rundenzeit', totalTimeCol: 'Gesamtzeit',
    createCountdown: 'Countdown erstellen', dateLabel: 'Datum', timeLabel: 'Uhrzeit', countdownNameLabel: 'Name des Countdowns', setCountdown: 'Countdown starten', presetCountdowns: 'Vorlagen', todayGroup: 'Heute', holidaysGroup: 'Feiertage', holidayCountdowns: 'Feiertags-Countdowns', footerHolidays: 'Feiertage', untilPrefix: 'Bis', countdownComplete: 'Countdown erreicht!',
    addAlarm: 'Wecker stellen', setNewAlarm: 'Neuer Wecker', alarmsTitle: 'Wecker', noAlarmsSet: 'Keine Wecker gestellt.', labelField: 'Bezeichnung', repeatField: 'Wiederholen', repeatOnce: 'Einmalig', repeatEveryDay: 'Täglich', repeatWeekdays: 'Werktags', repeatWeekends: 'Wochenende', vibrate: 'Vibrieren', alarmTimes: 'Weckzeiten',
    volume: 'Lautstärke', selectSound: 'Klingelton', testSound: 'Ton testen', stopPreview: 'Stopp',
  },
  fr: {
    dockClock: 'Horloge', dockStudy: 'Étude', dockTimer: 'Minuteur', dockStopwatch: 'Chrono', dockCountdown: 'Décompte', dockAlarm: 'Alarme',
    headerClock: 'Horloge Flip', headerWorldClock: 'Horloge Mondiale en Ligne', headerStudy: 'Minuteur Pomodoro', headerTimer: 'Minuteur en Ligne', headerStopwatch: 'Chronomètre en Ligne', headerCountdown: 'Compte à Rebours', headerAlarm: 'Réveil en Ligne', headerLocalTime: 'Votre Heure Locale',
    start: 'Démarrer', pause: 'Pause', resume: 'Reprendre', reset: 'Réinitialiser', lap: 'Tour', skip: 'Passer', ok: 'OK', restart: 'Recommencer', snooze: 'Répéter',
    days: 'Jours', hours: 'Heures', minutes: 'Minutes', seconds: 'Secondes', hour: 'Heure', minute: 'Minute', tomorrow: 'Demain',
    settingsTitle: 'Paramètres', studySettingsTitle: "Paramètres d'étude", themeSelection: 'Thème', themeDark: 'Sombre', themeLight: 'Clair', themeMidnight: 'Minuit', themeSand: 'Sable',
    flipStyle: 'Style de bascule', styleSimple: 'Simple', styleStandard: 'Standard', stylePro: 'Professionnel',
    clockDisplay: "Affichage de l'horloge", use24Hour: 'Format 24 heures', showSeconds: 'Afficher les secondes', showDateDay: 'Afficher date et jour',
    clockStyle: "Style d'horloge", appearance: 'Apparence', layout: 'Disposition', layoutAuto: 'Auto', layoutHorizontal: 'Horizontal', layoutVertical: 'Vertical',
    size: 'Taille', cornerRadius: 'Rayon des coins', resetDefaults: 'Réinitialiser par défaut', settingsResetToast: 'Paramètres réinitialisés', fullscreenExitToast: 'Double-cliquez pour quitter le plein écran',
    worldClock: 'Horloge Mondiale', allCitiesLink: 'Toutes les villes et fuseaux horaires →', yourTime: 'Votre heure', yourCities: 'Vos villes', searchCityPlaceholder: 'Rechercher une ville...', noPlacesFound: 'Aucun lieu trouvé.', deviceClockSynced: 'Votre horloge est exacte', now: 'Maintenant', sameTime: 'Même heure',
    workTab: 'Travail', workSession: 'Session de concentration', shortBreak: 'Pause courte', longBreak: 'Pause longue',
    tasksTitle: 'Tâches', clearCompleted: 'Effacer terminées', addTaskPlaceholder: 'Ajouter une tâche...', noTasksMessage: 'Aucune tâche ajoutée.', progressTitle: 'Progression', statisticsTitle: 'Statistiques', dailyGoalLabel: 'Objectif quotidien', focusTimeLabel: 'Temps concentré', dayStreakLabel: 'Série de jours', last7Days: '7 derniers jours', exportCsv: 'Exporter CSV', clearHistory: "Effacer l'historique", tapAgainToClear: 'Appuyez encore pour effacer',
    customTime: 'Durée personnalisée', timesUp: 'Temps écoulé !', allTimers: 'Tous les minuteurs', lapCol: 'Tour', lapTimeCol: 'Temps du tour', totalTimeCol: 'Temps total',
    createCountdown: 'Créer un compte à rebours', dateLabel: 'Date', timeLabel: 'Heure', countdownNameLabel: 'Nom', setCountdown: 'Lancer le décompte', presetCountdowns: 'Préréglages', todayGroup: "Aujourd'hui", holidaysGroup: 'Fêtes', holidayCountdowns: 'Jours fériés', footerHolidays: 'Fêtes', untilPrefix: "Jusqu'au", countdownComplete: 'Compte à rebours terminé !',
    addAlarm: 'Ajouter une alarme', setNewAlarm: 'Nouvelle alarme', alarmsTitle: 'Alarmes', noAlarmsSet: 'Aucune alarme définie.', labelField: 'Libellé', repeatField: 'Répéter', repeatOnce: 'Une fois', repeatEveryDay: 'Chaque jour', repeatWeekdays: 'Jours ouvrés', repeatWeekends: 'Week-ends', vibrate: 'Vibrer', alarmTimes: "Heures d'alarme",
    volume: 'Volume', selectSound: 'Sonnerie', testSound: 'Tester le son', stopPreview: 'Arrêter',
  },
  pt: {
    dockClock: 'Relógio', dockStudy: 'Estudo', dockTimer: 'Temporizador', dockStopwatch: 'Cronômetro', dockCountdown: 'Contagem', dockAlarm: 'Alarme',
    headerClock: 'Relógio Flip', headerWorldClock: 'Relógio Mundial Online', headerStudy: 'Temporizador Pomodoro', headerTimer: 'Temporizador Online', headerStopwatch: 'Cronômetro Online', headerCountdown: 'Contagem Regressiva', headerAlarm: 'Despertador Online', headerLocalTime: 'Sua Hora Local',
    start: 'Iniciar', pause: 'Pausar', resume: 'Retomar', reset: 'Redefinir', lap: 'Volta', skip: 'Pular', ok: 'OK', restart: 'Reiniciar', snooze: 'Soneca',
    days: 'Dias', hours: 'Horas', minutes: 'Minutos', seconds: 'Segundos', hour: 'Hora', minute: 'Minuto', tomorrow: 'Amanhã',
    settingsTitle: 'Configurações', themeSelection: 'Tema', themeDark: 'Escuro', themeLight: 'Claro', themeMidnight: 'Meia-noite', themeSand: 'Areia',
    flipStyle: 'Estilo Flip', styleSimple: 'Simples', styleStandard: 'Padrão', stylePro: 'Profissional',
    clockDisplay: 'Exibição do Relógio', use24Hour: 'Formato 24 Horas', showSeconds: 'Mostrar Segundos', showDateDay: 'Mostrar Data e Dia',
    appearance: 'Aparência', layout: 'Layout', size: 'Tamanho', cornerRadius: 'Raio do Canto', resetDefaults: 'Restaurar Padrões',
    worldClock: 'Relógio Mundial', allCitiesLink: 'Todas as cidades e fusos horários →', yourTime: 'Sua Hora', yourCities: 'Suas Cidades', searchCityPlaceholder: 'Buscar cidade ou país...', noPlacesFound: 'Nenhum local encontrado.', deviceClockSynced: 'Seu relógio está exato', now: 'Agora',
    workTab: 'Foco', workSession: 'Sessão de foco', shortBreak: 'Pausa Curta', longBreak: 'Pausa Longa',
    tasksTitle: 'Tarefas', progressTitle: 'Progresso', statisticsTitle: 'Estatísticas', customTime: 'Tempo personalizado', timesUp: 'Tempo esgotado!', allTimers: 'Todos os temporizadores',
    createCountdown: 'Criar contagem regressiva', dateLabel: 'Data', timeLabel: 'Hora', setCountdown: 'Definir Contagem', todayGroup: 'Hoje', holidaysGroup: 'Feriados', footerHolidays: 'Feriados', untilPrefix: 'Até',
    addAlarm: 'Adicionar Alarme', setNewAlarm: 'Novo Alarme', alarmsTitle: 'Alarmes', noAlarmsSet: 'Nenhum alarme definido.', repeatOnce: 'Uma vez', repeatEveryDay: 'Todos os dias', repeatWeekdays: 'Dias úteis', repeatWeekends: 'Fins de semana', vibrate: 'Vibrar', alarmTimes: 'Horários de alarme',
  },
  it: {
    dockClock: 'Orologio', dockStudy: 'Studio', dockTimer: 'Timer', dockStopwatch: 'Cronometro', dockCountdown: 'Conto alla rovescia', dockAlarm: 'Sveglia',
    headerClock: 'Orologio Flip', headerWorldClock: 'Orologio Mondiale Online', headerStudy: 'Timer Pomodoro', headerTimer: 'Timer Online', headerStopwatch: 'Cronometro Online', headerCountdown: 'Conto alla Rovescia', headerAlarm: 'Sveglia Online', headerLocalTime: 'La Tua Ora Locale',
    start: 'Avvia', pause: 'Pausa', resume: 'Riprendi', reset: 'Azzera', lap: 'Giro', skip: 'Salta', ok: 'OK', restart: 'Riavvia', snooze: 'Posponi',
    days: 'Giorni', hours: 'Ore', minutes: 'Minuti', seconds: 'Secondi', hour: 'Ora', minute: 'Minuto', tomorrow: 'Domani',
    settingsTitle: 'Impostazioni', themeSelection: 'Tema', themeDark: 'Scuro', themeLight: 'Chiaro', themeMidnight: 'Mezzanotte', themeSand: 'Sabbia',
    flipStyle: 'Stile Flip', styleSimple: 'Semplice', styleStandard: 'Standard', stylePro: 'Professionale',
    use24Hour: 'Formato 24 Ore', showSeconds: 'Mostra Secondi', showDateDay: 'Mostra Data e Giorno', size: 'Dimensione', cornerRadius: 'Raggio angoli',
    resetDefaults: 'Ripristina predefiniti', worldClock: 'Orologio Mondiale', allCitiesLink: 'Tutte le città e i fusi orari →', yourTime: 'La tua ora', yourCities: 'Le tue città', now: 'Ora',
    workTab: 'Studio', shortBreak: 'Pausa breve', longBreak: 'Pausa lunga', tasksTitle: 'Attività', progressTitle: 'Progressi', statisticsTitle: 'Statistiche',
    timesUp: 'Tempo scaduto!', allTimers: 'Tutti i timer', createCountdown: 'Crea conto alla rovescia', dateLabel: 'Data', timeLabel: 'Ora', setCountdown: 'Imposta', todayGroup: 'Oggi', holidaysGroup: 'Festività', footerHolidays: 'Festività', untilPrefix: 'Fino al',
    addAlarm: 'Aggiungi sveglia', setNewAlarm: 'Nuova sveglia', alarmsTitle: 'Sveglie', noAlarmsSet: 'Nessuna sveglia impostata.', alarmTimes: 'Orari sveglia',
  },
  pl: {
    dockClock: 'Zegar', dockStudy: 'Nauka', dockTimer: 'Minutnik', dockStopwatch: 'Stoper', dockCountdown: 'Odliczanie', dockAlarm: 'Budzik',
    headerClock: 'Zegar Klapkowy', headerWorldClock: 'Zegar Światowy Online', headerStudy: 'Timer Pomodoro', headerTimer: 'Minutnik Online', headerStopwatch: 'Stoper Online', headerCountdown: 'Odliczanie Online', headerAlarm: 'Budzik Online', headerLocalTime: 'Twój Czas Lokalny',
    start: 'Start', pause: 'Pauza', resume: 'Wznów', reset: 'Resetuj', lap: 'Okrążenie', skip: 'Pomiń', ok: 'OK', restart: 'Uruchom ponownie', snooze: 'Drzemka',
    days: 'Dni', hours: 'Godziny', minutes: 'Minuty', seconds: 'Sekundy', tomorrow: 'Jutro',
    settingsTitle: 'Ustawienia', themeSelection: 'Motyw', themeDark: 'Ciemny', themeLight: 'Jasny', themeMidnight: 'Północ', themeSand: 'Piasek',
    flipStyle: 'Styl klapek', styleSimple: 'Prosty', styleStandard: 'Standardowy', stylePro: 'Profesjonalny',
    use24Hour: 'Format 24-godzinny', showSeconds: 'Pokaż sekundy', showDateDay: 'Pokaż datę i dzień', size: 'Rozmiar', cornerRadius: 'Zaokrąglenie rogów', resetDefaults: 'Przywróć domyślne',
    worldClock: 'Zegar Światowy', allCitiesLink: 'Wszystkie miasta i strefy czasowe →', yourTime: 'Twój czas', yourCities: 'Twoje miasta', now: 'Teraz',
    workTab: 'Nauka', shortBreak: 'Krótka przerwa', longBreak: 'Długa przerwa', tasksTitle: 'Zadania', progressTitle: 'Postępy', statisticsTitle: 'Statystyki',
    timesUp: 'Czas minął!', allTimers: 'Wszystkie minutniki', createCountdown: 'Utwórz odliczanie', dateLabel: 'Data', timeLabel: 'Godzina', setCountdown: 'Ustaw odliczanie', footerHolidays: 'Święta',
    addAlarm: 'Dodaj budzik', setNewAlarm: 'Nowy budzik', alarmsTitle: 'Budziki', noAlarmsSet: 'Brak ustawionych budzików.', alarmTimes: 'Godziny budzika',
  },
  ru: {
    dockClock: 'Часы', dockStudy: 'Учёба', dockTimer: 'Таймер', dockStopwatch: 'Секундомер', dockCountdown: 'Отсчёт', dockAlarm: 'Будильник',
    headerClock: 'Перекидные Часы', headerWorldClock: 'Мировые Часы Онлайн', headerStudy: 'Таймер Помодоро', headerTimer: 'Онлайн Таймер', headerStopwatch: 'Онлайн Секундомер', headerCountdown: 'Обратный Отсчёт', headerAlarm: 'Онлайн Будильник', headerLocalTime: 'Ваше Местное Время',
    start: 'Старт', pause: 'Пауза', resume: 'Продолжить', reset: 'Сброс', lap: 'Круг', skip: 'Пропустить', ok: 'ОК', restart: 'Заново', snooze: 'Отложить',
    days: 'Дни', hours: 'Часы', minutes: 'Минуты', seconds: 'Секунды', hour: 'Час', minute: 'Минута', tomorrow: 'Завтра',
    settingsTitle: 'Настройки', themeSelection: 'Тема', themeDark: 'Тёмная', themeLight: 'Светлая', themeMidnight: 'Полночь', themeSand: 'Песок',
    flipStyle: 'Стиль карточек', styleSimple: 'Простой', styleStandard: 'Стандартный', stylePro: 'Профи',
    use24Hour: '24-часовой формат', showSeconds: 'Показывать секунды', showDateDay: 'Показывать дату и день', size: 'Размер', cornerRadius: 'Скругление углов',
    resetDefaults: 'Сбросить настройки', worldClock: 'Мировое время', allCitiesLink: 'Все города и часовые пояса →', yourTime: 'Ваше время', yourCities: 'Ваши города', searchCityPlaceholder: 'Поиск города...', noPlacesFound: 'Ничего не найдено.', deviceClockSynced: 'Точное время', now: 'Сейчас',
    workTab: 'Фокус', workSession: 'Рабочая сессия', shortBreak: 'Короткий перерыв', longBreak: 'Длинный перерыв', tasksTitle: 'Задачи', progressTitle: 'Прогресс', statisticsTitle: 'Статистика',
    timesUp: 'Время вышло!', allTimers: 'Все таймеры', createCountdown: 'Создать отсчёт', dateLabel: 'Дата', timeLabel: 'Время', setCountdown: 'Запустить отсчёт', todayGroup: 'Сегодня', holidaysGroup: 'Праздники', footerHolidays: 'Праздники', untilPrefix: 'До',
    addAlarm: 'Добавить будильник', setNewAlarm: 'Новый будильник', alarmsTitle: 'Будильники', noAlarmsSet: 'Будильники не установлены.', alarmTimes: 'Время будильника',
  },
  uk: {
    dockClock: 'Годинник', dockStudy: 'Навчання', dockTimer: 'Таймер', dockStopwatch: 'Секундомір', dockCountdown: 'Відлік', dockAlarm: 'Будильник',
    headerClock: 'Перекидний Годинник', headerWorldClock: 'Світовий Годинник', headerStudy: 'Таймер Помодоро', headerTimer: 'Онлайн Таймер', headerStopwatch: 'Онлайн Секундомір', headerCountdown: 'Зворотний Відлік', headerAlarm: 'Онлайн Будильник', headerLocalTime: 'Ваш Місцевий Час',
    start: 'Старт', pause: 'Пауза', resume: 'Продовжити', reset: 'Скинути', lap: 'Коло', skip: 'Пропустити', ok: 'ОК', restart: 'Наново', snooze: 'Відкласти',
    days: 'Дні', hours: 'Години', minutes: 'Хвилини', seconds: 'Секунди', tomorrow: 'Завтра',
    settingsTitle: 'Налаштування', themeSelection: 'Тема', themeDark: 'Темна', themeLight: 'Світла', themeMidnight: 'Північ', themeSand: 'Пісок',
    use24Hour: '24-годинний формат', showSeconds: 'Показувати секунди', showDateDay: 'Показувати дату й день', size: 'Розмір', cornerRadius: 'Заокруглення', resetDefaults: 'Скинути за замовчуванням',
    worldClock: 'Світовий час', allCitiesLink: 'Усі міста та часові пояси →', yourTime: 'Ваш час', yourCities: 'Ваші міста', now: 'Зараз',
    workTab: 'Фокус', shortBreak: 'Коротка перерва', longBreak: 'Довга перерва', tasksTitle: 'Завдання', progressTitle: 'Прогрес', statisticsTitle: 'Статистика',
    timesUp: 'Час вийшов!', allTimers: 'Усі таймери', createCountdown: 'Створити відлік', dateLabel: 'Дата', timeLabel: 'Час', setCountdown: 'Встановити', footerHolidays: 'Свята',
    addAlarm: 'Додати будильник', setNewAlarm: 'Новий будильник', alarmsTitle: 'Будильники', noAlarmsSet: 'Немає будильників.', alarmTimes: 'Час будильника',
  },
  cs: {
    dockClock: 'Hodiny', dockStudy: 'Studium', dockTimer: 'Časovač', dockStopwatch: 'Stopky', dockCountdown: 'Odpočet', dockAlarm: 'Budík',
    headerClock: 'Překlápěcí Hodiny', headerWorldClock: 'Světový Čas Online', headerStudy: 'Pomodoro Časovač', headerTimer: 'Online Časovač', headerStopwatch: 'Online Stopky', headerCountdown: 'Online Odpočet', headerAlarm: 'Online Budík', headerLocalTime: 'Váš Místní Čas',
    start: 'Start', pause: 'Pauza', resume: 'Pokračovat', reset: 'Reset', lap: 'Kolo', skip: 'Přeskočit', snooze: 'Odložit',
    days: 'Dny', hours: 'Hodiny', minutes: 'Minuty', seconds: 'Sekundy', tomorrow: 'Zítra',
    settingsTitle: 'Nastavení', themeSelection: 'Motiv', themeDark: 'Tmavý', themeLight: 'Světlý', themeMidnight: 'Půlnoc', themeSand: 'Písek',
    use24Hour: '24hodinový formát', showSeconds: 'Zobrazit sekundy', showDateDay: 'Zobrazit datum a den', resetDefaults: 'Obnovit výchozí',
    worldClock: 'Světový čas', allCitiesLink: 'Všechna města a časová pásma →', yourTime: 'Váš čas', yourCities: 'Vaše města', now: 'Nyní',
    workTab: 'Práce', shortBreak: 'Krátká pauza', longBreak: 'Dlouhá pauza', tasksTitle: 'Úkoly', progressTitle: 'Pokrok', statisticsTitle: 'Statistiky',
    timesUp: 'Čas vypršel!', allTimers: 'Všechny časovače', createCountdown: 'Vytvořit odpočet', setCountdown: 'Nastavit odpočet', footerHolidays: 'Svátky',
    addAlarm: 'Přidat budík', setNewAlarm: 'Nový budík', alarmsTitle: 'Budíky', alarmTimes: 'Časy budíku',
  },
  fi: {
    dockClock: 'Kello', dockStudy: 'Opiskelu', dockTimer: 'Ajastin', dockStopwatch: 'Sekuntikello', dockCountdown: 'Laskuri', dockAlarm: 'Herätys',
    headerClock: 'Kääntökello', headerWorldClock: 'Maailmankello', headerStudy: 'Pomodoro-ajastin', headerTimer: 'Verkkoajastin', headerStopwatch: 'Sekuntikello', headerCountdown: 'Lähtölaskenta', headerAlarm: 'Herätyskello', headerLocalTime: 'Paikallinen Aika',
    start: 'Käynnistä', pause: 'Tauko', resume: 'Jatka', reset: 'Nollaa', lap: 'Kierros', skip: 'Ohita', snooze: 'Torkku',
    days: 'Päivää', hours: 'Tuntia', minutes: 'Minuuttia', seconds: 'Sekuntia', tomorrow: 'Huomenna',
    settingsTitle: 'Asetukset', themeSelection: 'Teema', themeDark: 'Tumma', themeLight: 'Vaalea', themeMidnight: 'Keskiyö', themeSand: 'Hiekka',
    use24Hour: '24 tunnin muoto', showSeconds: 'Näytä sekunnit', showDateDay: 'Näytä päivämäärä', resetDefaults: 'Palauta oletukset',
    worldClock: 'Maailmankello', allCitiesLink: 'Kaikki kaupungit ja aikavyöhykkeet →', yourTime: 'Oma aika', yourCities: 'Omat kaupungit', now: 'Nyt',
    workTab: 'Työ', shortBreak: 'Lyhyt tauko', longBreak: 'Pitkä tauko', tasksTitle: 'Tehtävät', progressTitle: 'Edistyminen', statisticsTitle: 'Tilastot',
    timesUp: 'Aika loppui!', allTimers: 'Kaikki ajastimet', createCountdown: 'Luo lähtölaskenta', setCountdown: 'Aseta laskuri', footerHolidays: 'Juhlapyhät',
    addAlarm: 'Lisää herätys', setNewAlarm: 'Uusi herätys', alarmsTitle: 'Herätykset', alarmTimes: 'Herätysajat',
  },
  id: {
    dockClock: 'Jam', dockStudy: 'Belajar', dockTimer: 'Timer', dockStopwatch: 'Stopwatch', dockCountdown: 'Hitung Mundur', dockAlarm: 'Alarm',
    headerClock: 'Jam Flip', headerWorldClock: 'Jam Dunia Online', headerStudy: 'Timer Belajar Pomodoro', headerTimer: 'Timer Online', headerStopwatch: 'Stopwatch Online', headerCountdown: 'Hitung Mundur Online', headerAlarm: 'Jam Alarm Online', headerLocalTime: 'Waktu Lokal Anda',
    start: 'Mulai', pause: 'Jeda', resume: 'Lanjut', reset: 'Atur Ulang', lap: 'Putaran', skip: 'Lewati', snooze: 'Tunda',
    days: 'Hari', hours: 'Jam', minutes: 'Menit', seconds: 'Detik', tomorrow: 'Besok',
    settingsTitle: 'Pengaturan', themeSelection: 'Pilihan Tema', themeDark: 'Gelap', themeLight: 'Terang', themeMidnight: 'Tengah Malam', themeSand: 'Pasir',
    use24Hour: 'Format 24 Jam', showSeconds: 'Tampilkan Detik', showDateDay: 'Tampilkan Tanggal & Hari', resetDefaults: 'Atur Ulang ke Awal',
    worldClock: 'Jam Dunia', allCitiesLink: 'Semua kota dan zona waktu →', yourTime: 'Waktu Anda', yourCities: 'Kota Anda', now: 'Sekarang',
    workTab: 'Fokus', shortBreak: 'Istirahat Pendek', longBreak: 'Istirahat Panjang', tasksTitle: 'Tugas', progressTitle: 'Progres', statisticsTitle: 'Statistik',
    timesUp: 'Waktu Habis!', allTimers: 'Semua Timer', createCountdown: 'Buat Hitung Mundur', setCountdown: 'Atur Hitung Mundur', footerHolidays: 'Hari Libur',
    addAlarm: 'Tambah Alarm', setNewAlarm: 'Alarm Baru', alarmsTitle: 'Alarm', alarmTimes: 'Waktu Alarm',
  },
  ja: {
    dockClock: '時計', dockStudy: '学習', dockTimer: 'タイマー', dockStopwatch: 'ストップウォッチ', dockCountdown: 'カウントダウン', dockAlarm: 'アラーム',
    headerClock: 'フリップ時計', headerWorldClock: 'オンライン世界時計', headerStudy: 'ポモドーロ学習タイマー', headerTimer: 'オンラインタイマー', headerStopwatch: 'ストップウォッチ', headerCountdown: 'カウントダウン', headerAlarm: 'アラーム時計', headerLocalTime: '現在地の時刻',
    start: '開始', pause: '一時停止', resume: '再開', reset: 'リセット', lap: 'ラップ', skip: 'スキップ', ok: 'OK', restart: '再スタート', snooze: 'スヌーズ',
    days: '日', hours: '時間', minutes: '分', seconds: '秒', hour: '時', minute: '分', tomorrow: '明日',
    settingsTitle: '設定', studySettingsTitle: '学習タイマー設定', themeSelection: 'テーマ選択', themeDark: 'ダーク', themeLight: 'ライト', themeMidnight: 'ミッドナイト', themeSand: 'サンド',
    flipStyle: 'フリップスタイル', styleSimple: 'シンプル', styleStandard: 'スタンダード', stylePro: 'プロフェッショナル',
    use24Hour: '24時間表示', showSeconds: '秒を表示', showDateDay: '日付と曜日を表示',
    size: 'サイズ', cornerRadius: '角の丸み', resetDefaults: '初期設定に戻す', worldClock: '世界時計', allCitiesLink: 'すべての都市とタイムゾーン →', yourTime: '現在地', yourCities: 'マイ都市', searchCityPlaceholder: '都市や国を検索...', noPlacesFound: '見つかりませんでした。', deviceClockSynced: '時計は正確です', now: '現在',
    workTab: '集中', workSession: '集中セッション', shortBreak: '短い休憩', longBreak: '長い休憩', tasksTitle: 'タスク', progressTitle: '進捗', statisticsTitle: '統計',
    timesUp: '時間終了！', allTimers: 'すべてのタイマー', createCountdown: 'カウントダウンを作成', dateLabel: '日付', timeLabel: '時刻', setCountdown: 'セットする', todayGroup: '今日', holidaysGroup: '祝日・イベント', footerHolidays: '祝日', untilPrefix: '目標日時:',
    addAlarm: 'アラームを追加', setNewAlarm: '新しいアラーム', alarmsTitle: 'アラーム一覧', noAlarmsSet: 'アラームは設定されていません。', alarmTimes: 'アラーム時刻',
  },
  nl: {
    dockClock: 'Klok', dockStudy: 'Studie', dockTimer: 'Timer', dockStopwatch: 'Stopwatch', dockCountdown: 'Aftellen', dockAlarm: 'Wekker',
    headerClock: 'Flipklok', headerWorldClock: 'Online Wereldklok', headerStudy: 'Pomodoro Studietimer', headerTimer: 'Online Timer', headerStopwatch: 'Online Stopwatch', headerCountdown: 'Online Aftellen', headerAlarm: 'Online Wekker', headerLocalTime: 'Jouw Lokale Tijd',
    start: 'Start', pause: 'Pauze', resume: 'Hervatten', reset: 'Reset', lap: 'Ronde', skip: 'Overslaan', snooze: 'Sluimer',
    days: 'Dagen', hours: 'Uren', minutes: 'Minuten', seconds: 'Seconden', tomorrow: 'Morgen',
    settingsTitle: 'Instellingen', themeSelection: 'Thema', themeDark: 'Donker', themeLight: 'Licht', themeMidnight: 'Middernacht', themeSand: 'Zand',
    use24Hour: '24-uursnotatie', showSeconds: 'Seconden tonen', showDateDay: 'Datum & dag tonen', resetDefaults: 'Standaardwaarden herstellen',
    worldClock: 'Wereldklok', allCitiesLink: 'Alle steden en tijdzones →', yourTime: 'Jouw tijd', yourCities: 'Jouw steden', now: 'Nu',
    workTab: 'Focus', shortBreak: 'Korte pauze', longBreak: 'Lange pauze', tasksTitle: 'Taken', progressTitle: 'Voortgang', statisticsTitle: 'Statistieken',
    timesUp: 'Tijd is om!', allTimers: 'Alle timers', createCountdown: 'Aftelklok maken', setCountdown: 'Instellen', footerHolidays: 'Feestdagen',
    addAlarm: 'Wekker toevoegen', setNewAlarm: 'Nieuwe wekker', alarmsTitle: 'Wekkers', alarmTimes: 'Wekkertijden',
  },
  th: {
    dockClock: 'นาฬิกา', dockStudy: 'อ่านหนังสือ', dockTimer: 'จับเวลาถอยหลัง', dockStopwatch: 'จับเวลา', dockCountdown: 'นับถอยหลัง', dockAlarm: 'นาฬิกาปลุก',
    headerClock: 'นาฬิกาพลิก', headerWorldClock: 'นาฬิกาโลกออนไลน์', headerStudy: 'จับเวลาอ่านหนังสือ Pomodoro', headerTimer: 'นาฬิกาถอยหลังออนไลน์', headerStopwatch: 'นาฬิกาจับเวลาออนไลน์', headerCountdown: 'นับถอยหลังออนไลน์', headerAlarm: 'นาฬิกาปลุกออนไลน์', headerLocalTime: 'เวลาท้องถิ่นของคุณ',
    start: 'เริ่ม', pause: 'หยุดชั่วคราว', resume: 'ทำต่อ', reset: 'รีเซ็ต', lap: 'รอบ', skip: 'ข้าม', snooze: 'เลื่อนปลุก',
    days: 'วัน', hours: 'ชั่วโมง', minutes: 'นาที', seconds: 'วินาที', tomorrow: 'พรุ่งนี้',
    settingsTitle: 'การตั้งค่า', themeSelection: 'ธีม', themeDark: 'มืด', themeLight: 'สว่าง', themeMidnight: 'เที่ยงคืน', themeSand: 'ทราย',
    use24Hour: 'รูปแบบ 24 ชั่วโมง', showSeconds: 'แสดงวินาที', showDateDay: 'แสดงวันที่และวัน', resetDefaults: 'คืนค่าเริ่มต้น',
    worldClock: 'นาฬิกาโลก', allCitiesLink: 'เมืองและเขตเวลาทั้งหมด →', yourTime: 'เวลาของคุณ', yourCities: 'เมืองของคุณ', now: 'ตอนนี้',
    workTab: 'โฟกัส', shortBreak: 'พักสั้น', longBreak: 'พักยาว', tasksTitle: 'งาน', progressTitle: 'ความคืบหน้า', statisticsTitle: 'สถิติ',
    timesUp: 'หมดเวลา!', allTimers: 'ตัวจับเวลาทั้งหมด', createCountdown: 'สร้างการนับถอยหลัง', setCountdown: 'ตั้งเวลานับถอยหลัง', footerHolidays: 'วันหยุด',
    addAlarm: 'เพิ่มนาฬิกาปลุก', setNewAlarm: 'ตั้งปลุกใหม่', alarmsTitle: 'รายการปลุก', alarmTimes: 'เวลาปลุก',
  },
  tw: {
    dockClock: '時鐘', dockStudy: '專注', dockTimer: '計時器', dockStopwatch: '碼錶', dockCountdown: '倒數', dockAlarm: '鬧鐘',
    headerClock: '翻頁時鐘', headerWorldClock: '線上世界時鐘', headerStudy: '番茄鐘學習計時器', headerTimer: '線上計時器', headerStopwatch: '線上碼錶', headerCountdown: '線上倒數計時', headerAlarm: '線上鬧鐘', headerLocalTime: '您的當地時間',
    start: '開始', pause: '暫停', resume: '繼續', reset: '重設', lap: '分圈', skip: '跳過', ok: '確定', restart: '重新開始', snooze: '貪睡',
    days: '天', hours: '小時', minutes: '分鐘', seconds: '秒', hour: '時', minute: '分', tomorrow: '明天',
    settingsTitle: '設定', themeSelection: '主題選擇', themeDark: '深色', themeLight: '淺色', themeMidnight: '午夜', themeSand: '暖沙',
    flipStyle: '翻頁樣式', styleSimple: '簡約', styleStandard: '標準', stylePro: '專業',
    use24Hour: '使用 24 小時制', showSeconds: '顯示秒數', showDateDay: '顯示日期與星期',
    size: '大小', cornerRadius: '圓角半徑', resetDefaults: '重設為預設值', worldClock: '世界時鐘', allCitiesLink: '所有城市與時區 →', yourTime: '您的時間', yourCities: '您的城市', now: '現在',
    workTab: '專注', workSession: '專注時段', shortBreak: '短休息', longBreak: '長休息', tasksTitle: '任務', progressTitle: '進度', statisticsTitle: '統計',
    timesUp: '時間到！', allTimers: '所有計時器', createCountdown: '建立倒數計時', dateLabel: '日期', timeLabel: '時間', setCountdown: '設定倒數', todayGroup: '今天', holidaysGroup: '節日', footerHolidays: '節日',
    addAlarm: '新增鬧鐘', setNewAlarm: '設定新鬧鐘', alarmsTitle: '鬧鐘列表', noAlarmsSet: '尚未設定鬧鐘。', alarmTimes: '鬧鐘時間',
  },
  vi: {
    dockClock: 'Đồng hồ', dockStudy: 'Học tập', dockTimer: 'Hẹn giờ', dockStopwatch: 'Bấm giờ', dockCountdown: 'Đếm ngược', dockAlarm: 'Báo thức',
    headerClock: 'Đồng Hồ Lật', headerWorldClock: 'Đồng Hồ Thế Giới', headerStudy: 'Đồng Hồ Pomodoro', headerTimer: 'Hẹn Giờ Trực Tuyến', headerStopwatch: 'Bấm Giờ Trực Tuyến', headerCountdown: 'Đếm Ngược Trực Tuyến', headerAlarm: 'Báo Thức Trực Tuyến', headerLocalTime: 'Giờ Địa Phương Của Bạn',
    start: 'Bắt đầu', pause: 'Tạm dừng', resume: 'Tiếp tục', reset: 'Đặt lại', lap: 'Vòng', skip: 'Bỏ qua', snooze: 'Báo lại',
    days: 'Ngày', hours: 'Giờ', minutes: 'Phút', seconds: 'Giây', tomorrow: 'Ngày mai',
    settingsTitle: 'Cài đặt', themeSelection: 'Giao diện', themeDark: 'Tối', themeLight: 'Sáng', themeMidnight: 'Nửa đêm', themeSand: 'Cát',
    use24Hour: 'Định dạng 24 giờ', showSeconds: 'Hiện giây', showDateDay: 'Hiện ngày & thứ', resetDefaults: 'Khôi phục mặc định',
    worldClock: 'Giờ Thế Giới', allCitiesLink: 'Tất cả thành phố và múi giờ →', yourTime: 'Giờ của bạn', yourCities: 'Thành phố của bạn', now: 'Bây giờ',
    workTab: 'Tập trung', shortBreak: 'Nghỉ ngắn', longBreak: 'Nghỉ dài', tasksTitle: 'Nhiệm vụ', progressTitle: 'Tiến độ', statisticsTitle: 'Thống kê',
    timesUp: 'Hết giờ!', allTimers: 'Tất cả bộ hẹn giờ', createCountdown: 'Tạo đếm ngược', setCountdown: 'Đặt đếm ngược', footerHolidays: 'Ngày lễ',
    addAlarm: 'Thêm báo thức', setNewAlarm: 'Báo thức mới', alarmsTitle: 'Báo thức', alarmTimes: 'Giờ báo thức',
  },
  da: {
    dockClock: 'Ur', dockStudy: 'Studie', dockTimer: 'Timer', dockStopwatch: 'Stopur', dockCountdown: 'Nedtælling', dockAlarm: 'Alarm',
    headerClock: 'Flip-ur', headerWorldClock: 'Online Verdensur', headerStudy: 'Pomodoro Studietimer', headerTimer: 'Online Timer', headerStopwatch: 'Online Stopur', headerCountdown: 'Online Nedtælling', headerAlarm: 'Online Vækkeur', headerLocalTime: 'Din Lokale Tid',
    start: 'Start', pause: 'Pause', resume: 'Genoptag', reset: 'Nulstil', lap: 'Omgang', skip: 'Spring over', snooze: 'Slumre',
    days: 'Dage', hours: 'Timer', minutes: 'Minutter', seconds: 'Sekunder', tomorrow: 'I morgen',
    settingsTitle: 'Indstillinger', themeSelection: 'Tema', themeDark: 'Mørk', themeLight: 'Lys', themeMidnight: 'Midnat', themeSand: 'Sand',
    use24Hour: '24-timers format', showSeconds: 'Vis sekunder', showDateDay: 'Vis dato og dag', resetDefaults: 'Nulstil til standard',
    worldClock: 'Verdensur', allCitiesLink: 'Alle byer og tidszoner →', yourTime: 'Din tid', yourCities: 'Dine byer', now: 'Nu',
    workTab: 'Fokus', shortBreak: 'Kort pause', longBreak: 'Lang pause', tasksTitle: 'Opgaver', progressTitle: 'Fremskridt', statisticsTitle: 'Statistik',
    timesUp: 'Tiden er gået!', allTimers: 'Alle timere', createCountdown: 'Opret nedtælling', setCountdown: 'Start nedtælling', footerHolidays: 'Helligdage',
    addAlarm: 'Tilføj alarm', setNewAlarm: 'Ny alarm', alarmsTitle: 'Alarmer', alarmTimes: 'Alarmtider',
  },
  hu: {
    dockClock: 'Óra', dockStudy: 'Tanulás', dockTimer: 'Időzítő', dockStopwatch: 'Stopper', dockCountdown: 'Visszaszámláló', dockAlarm: 'Ébresztő',
    headerClock: 'Lapozós Óra', headerWorldClock: 'Online Világóra', headerStudy: 'Pomodoro Tanulásmérő', headerTimer: 'Online Időzítő', headerStopwatch: 'Online Stopper', headerCountdown: 'Online Visszaszámláló', headerAlarm: 'Online Ébresztőóra', headerLocalTime: 'Helyi Idő',
    start: 'Indítás', pause: 'Szünet', resume: 'Folytatás', reset: 'Visszaállítás', lap: 'Kör', skip: 'Kihagyás', snooze: 'Szundi',
    days: 'Nap', hours: 'Óra', minutes: 'Perc', seconds: 'Másodperc', tomorrow: 'Holnap',
    settingsTitle: 'Beállítások', themeSelection: 'Téma', themeDark: 'Sötét', themeLight: 'Világos', themeMidnight: 'Éjfél', themeSand: 'Homok',
    use24Hour: '24 órás formátum', showSeconds: 'Másodpercek megjelenítése', showDateDay: 'Dátum és nap megjelenítése', resetDefaults: 'Alaphelyzet',
    worldClock: 'Világóra', allCitiesLink: 'Minden város és időzóna →', yourTime: 'Saját idő', yourCities: 'Mentett városok', now: 'Most',
    workTab: 'Fókusz', shortBreak: 'Rövid szünet', longBreak: 'Hosszú szünet', tasksTitle: 'Feladatok', progressTitle: 'Haladás', statisticsTitle: 'Statisztika',
    timesUp: 'Lejárt az idő!', allTimers: 'Összes időzítő', createCountdown: 'Visszaszámlálás létrehozása', setCountdown: 'Beállítás', footerHolidays: 'Ünnepek',
    addAlarm: 'Ébresztő hozzáadása', setNewAlarm: 'Új ébresztő', alarmsTitle: 'Ébresztők', alarmTimes: 'Ébresztési idők',
  },
  no: {
    dockClock: 'Klokke', dockStudy: 'Studie', dockTimer: 'Timer', dockStopwatch: 'Stoppeklokke', dockCountdown: 'Nedtelling', dockAlarm: 'Alarm',
    headerClock: 'Flip-klokke', headerWorldClock: 'Online Verdensklokke', headerStudy: 'Pomodoro Studietimer', headerTimer: 'Online Timer', headerStopwatch: 'Online Stoppeklokke', headerCountdown: 'Online Nedtelling', headerAlarm: 'Online Vekkerklokke', headerLocalTime: 'Din Lokale Tid',
    start: 'Start', pause: 'Pause', resume: 'Fortsett', reset: 'Nullstill', lap: 'Runde', skip: 'Hopp over', snooze: 'Slumre',
    days: 'Dager', hours: 'Timer', minutes: 'Minutter', seconds: 'Sekunder', tomorrow: 'I morgen',
    settingsTitle: 'Innstillinger', themeSelection: 'Tema', themeDark: 'Mørk', themeLight: 'Lys', themeMidnight: 'Midnatt', themeSand: 'Sand',
    use24Hour: '24-timers format', showSeconds: 'Vis sekunder', showDateDay: 'Vis dato og dag', resetDefaults: 'Tilbakestill til standard',
    worldClock: 'Verdensklokke', allCitiesLink: 'Alle byer og tidssoner →', yourTime: 'Din tid', yourCities: 'Dine byer', now: 'Nå',
    workTab: 'Fokus', shortBreak: 'Kort pause', longBreak: 'Lang pause', tasksTitle: 'Oppgaver', progressTitle: 'Fremgang', statisticsTitle: 'Statistikk',
    timesUp: 'Tiden er ute!', allTimers: 'Alle timere', createCountdown: 'Opprett nedtelling', setCountdown: 'Sett nedtelling', footerHolidays: 'Helligdager',
    addAlarm: 'Legg til alarm', setNewAlarm: 'Ny alarm', alarmsTitle: 'Alarmer', alarmTimes: 'Alarmtider',
  },
  el: {
    dockClock: 'Ρολόι', dockStudy: 'Μελέτη', dockTimer: 'Χρονόμετρο', dockStopwatch: 'Χρονογράφος', dockCountdown: 'Αντίστροφη', dockAlarm: 'Ξυπνητήρι',
    headerClock: 'Ρολόι Flip', headerWorldClock: 'Παγκόσμιο Ρολόι', headerStudy: 'Χρονόμετρο Μελέτης Pomodoro', headerTimer: 'Online Χρονόμετρο', headerStopwatch: 'Online Χρονογράφος', headerCountdown: 'Αντίστροφη Μέτρηση', headerAlarm: 'Online Ξυπνητήρι', headerLocalTime: 'Η Τοπική Σας Ώρα',
    start: 'Έναρξη', pause: 'Παύση', resume: 'Συνέχεια', reset: 'Επαναφορά', lap: 'Γύρος', skip: 'Παράλειψη', snooze: 'Αναβολή',
    days: 'Ημέρες', hours: 'Ώρες', minutes: 'Λεπτά', seconds: 'Δευτερόλεπτα', tomorrow: 'Αύριο',
    settingsTitle: 'Ρυθμίσεις', themeSelection: 'Θέμα', themeDark: 'Σκοτεινό', themeLight: 'Φωτεινό', themeMidnight: 'Μεσάνυχτα', themeSand: 'Άμμος',
    use24Hour: '24ωρη μορφή', showSeconds: 'Εμφάνιση δευτερολέπτων', showDateDay: 'Εμφάνιση ημερομηνίας', resetDefaults: 'Επαναφορά προεπιλογών',
    worldClock: 'Παγκόσμιο Ρολόι', allCitiesLink: 'Όλες οι πόλεις και ζώνες ώρας →', yourTime: 'Η ώρα σας', yourCities: 'Οι πόλεις σας', now: 'Τώρα',
    workTab: 'Εργασία', shortBreak: 'Μικρό διάλειμμα', longBreak: 'Μεγάλο διάλειμμα', tasksTitle: 'Εργασίες', progressTitle: 'Πρόοδος', statisticsTitle: 'Στατιστικά',
    timesUp: 'Τέλος χρόνου!', allTimers: 'Όλα τα χρονόμετρα', createCountdown: 'Δημιουργία αντίστροφης μέτρησης', setCountdown: 'Ορισμός', footerHolidays: 'Γιορτές',
    addAlarm: 'Προσθήκη ξυπνητηριού', setNewAlarm: 'Νέο ξυπνητήρι', alarmsTitle: 'Ξυπνητήρια', alarmTimes: 'Ώρες ξυπνητηριού',
  },
  sv: {
    dockClock: 'Klocka', dockStudy: 'Studera', dockTimer: 'Timer', dockStopwatch: 'Stoppur', dockCountdown: 'Nedräkning', dockAlarm: 'Alarm',
    headerClock: 'Flipklocka', headerWorldClock: 'Online Världsklocka', headerStudy: 'Pomodoro Studietimer', headerTimer: 'Online Timer', headerStopwatch: 'Online Stoppur', headerCountdown: 'Online Nedräkning', headerAlarm: 'Online Väckarklocka', headerLocalTime: 'Din Lokala Tid',
    start: 'Starta', pause: 'Pausa', resume: 'Fortsätt', reset: 'Återställ', lap: 'Varv', skip: 'Hoppa över', snooze: 'Snooze',
    days: 'Dagar', hours: 'Timmar', minutes: 'Minuter', seconds: 'Sekunder', tomorrow: 'Imorgon',
    settingsTitle: 'Inställningar', themeSelection: 'Tema', themeDark: 'Mörkt', themeLight: 'Ljust', themeMidnight: 'Midnatt', themeSand: 'Sand',
    use24Hour: '24-timmarsformat', showSeconds: 'Visa sekunder', showDateDay: 'Visa datum och dag', resetDefaults: 'Återställ standard',
    worldClock: 'Världsklocka', allCitiesLink: 'Alla städer och tidszoner →', yourTime: 'Din tid', yourCities: 'Dina städer', now: 'Nu',
    workTab: 'Fokus', shortBreak: 'Kort paus', longBreak: 'Lång paus', tasksTitle: 'Uppgifter', progressTitle: 'Framsteg', statisticsTitle: 'Statistik',
    timesUp: 'Tiden är ute!', allTimers: 'Alla timers', createCountdown: 'Skapa nedräkning', setCountdown: 'Ställ in', footerHolidays: 'Helgdagar',
    addAlarm: 'Lägg till larm', setNewAlarm: 'Nytt larm', alarmsTitle: 'Larm', alarmTimes: 'Larmtider',
  },
  ko: {
    dockClock: '시계', dockStudy: '공부', dockTimer: '타이머', dockStopwatch: '스톱워치', dockCountdown: '카운트다운', dockAlarm: '알람',
    headerClock: '플립 시계', headerWorldClock: '온라인 세계 시계', headerStudy: '뽀모도로 공부 타이머', headerTimer: '온라인 타이머', headerStopwatch: '온라인 스톱워치', headerCountdown: '온라인 카운트다운', headerAlarm: '온라인 알람 시계', headerLocalTime: '내 현지 시간',
    start: '시작', pause: '일시정지', resume: '계속', reset: '초기화', lap: '랩', skip: '건너뛰기', ok: '확인', restart: '다시 시작', snooze: '다시 알림',
    days: '일', hours: '시간', minutes: '분', seconds: '초', hour: '시', minute: '분', tomorrow: '내일',
    settingsTitle: '설정', themeSelection: '테마 선택', themeDark: '다크', themeLight: '라이트', themeMidnight: '미드나잇', themeSand: '샌드',
    flipStyle: '플립 스타일', styleSimple: '심플', styleStandard: '스탠다드', stylePro: '프로페셔널',
    use24Hour: '24시간 형식 사용', showSeconds: '초 표시', showDateDay: '날짜 및 요일 표시',
    size: '크기', cornerRadius: '모서리 둥글기', resetDefaults: '기본값으로 재설정', worldClock: '세계 시계', allCitiesLink: '모든 도시 및 시간대 →', yourTime: '내 시간', yourCities: '내 도시', searchCityPlaceholder: '도시 또는 국가 검색...', noPlacesFound: '검색 결과가 없습니다.', deviceClockSynced: '시계가 정확합니다', now: '지금',
    workTab: '집중', workSession: '집중 세션', shortBreak: '짧은 휴식', longBreak: '긴 휴식', tasksTitle: '할 일', progressTitle: '진행률', statisticsTitle: '통계',
    timesUp: '시간 종료!', allTimers: '모든 타이머', createCountdown: '카운트다운 만들기', dateLabel: '날짜', timeLabel: '시간', setCountdown: '설정', todayGroup: '오늘', holidaysGroup: '기념일', footerHolidays: '기념일', untilPrefix: '목표:',
    addAlarm: '알람 추가', setNewAlarm: '새 알람 설정', alarmsTitle: '알람 목록', noAlarmsSet: '설정된 알람이 없습니다.', alarmTimes: '알람 시간',
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
