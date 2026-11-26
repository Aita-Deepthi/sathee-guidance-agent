// One consistent inline icon set: 24px grid, 1.75 stroke, round caps (Lucide-style geometry).
// Icons are decorative by default (aria-hidden); give the parent control an accessible label.
const base = {
  width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round',
};
const I = (paths, name) => {
  function Icon(props) {
    return <svg {...base} {...props} aria-hidden="true" focusable="false">{paths}</svg>;
  }
  Icon.displayName = name;
  return Icon;
};

export const IconHome = I(<><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" /><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></>, 'IconHome');
export const IconDashboard = I(<><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></>, 'IconDashboard');
export const IconChat = I(<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />, 'IconChat');
export const IconCalendar = I(<><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>, 'IconCalendar');
export const IconPlay = I(<><path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" /><rect x="2" y="6" width="14" height="12" rx="2" /></>, 'IconPlay');
export const IconCheck = I(<path d="M20 6 9 17l-5-5" />, 'IconCheck');
export const IconCheckCircle = I(<><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></>, 'IconCheckCircle');
export const IconCircle = I(<circle cx="12" cy="12" r="10" />, 'IconCircle');
export const IconXCircle = I(<><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6M9 9l6 6" /></>, 'IconXCircle');
export const IconMinusCircle = I(<><circle cx="12" cy="12" r="10" /><path d="M8 12h8" /></>, 'IconMinusCircle');
export const IconTest = I(<><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="m9 14 2 2 4-4" /></>, 'IconTest');
export const IconChart = I(<><path d="M3 3v16a2 2 0 0 0 2 2h16" /><path d="M18 17V9M13 17V5M8 17v-3" /></>, 'IconChart');
export const IconTrend = I(<><path d="M22 7 13.5 15.5 8.5 10.5 2 17" /><path d="M16 7h6v6" /></>, 'IconTrend');
export const IconUser = I(<><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>, 'IconUser');
export const IconLogout = I(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></>, 'IconLogout');
export const IconMenu = I(<path d="M4 6h16M4 12h16M4 18h16" />, 'IconMenu');
export const IconClose = I(<path d="M18 6 6 18M6 6l12 12" />, 'IconClose');
export const IconMore = I(<><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></>, 'IconMore');
export const IconSend = I(<><path d="M3.714 3.048a.498.498 0 0 0-.683.627l2.843 7.627a2 2 0 0 1 0 1.396l-2.842 7.627a.498.498 0 0 0 .682.627l18-8.5a.5.5 0 0 0 0-.904z" /><path d="M6 12h16" /></>, 'IconSend');
export const IconPlus = I(<path d="M12 5v14M5 12h14" />, 'IconPlus');
export const IconTrash = I(<><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></>, 'IconTrash');
export const IconClock = I(<><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>, 'IconClock');
export const IconFire = I(<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />, 'IconFire');
export const IconTarget = I(<><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>, 'IconTarget');
export const IconBook = I(<><path d="M12 7v14" /><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" /></>, 'IconBook');
export const IconExternal = I(<><path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></>, 'IconExternal');
export const IconAlert = I(<><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /><path d="M12 9v4M12 17h.01" /></>, 'IconAlert');
export const IconAlertCircle = I(<><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></>, 'IconAlertCircle');
export const IconInfo = I(<><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></>, 'IconInfo');
export const IconSparkle = I(<><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" /><path d="M20 3v4M22 5h-4" /></>, 'IconSparkle');
export const IconRefresh = I(<><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></>, 'IconRefresh');
export const IconRotateCcw = I(<><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></>, 'IconRotateCcw');
export const IconChevron = I(<path d="m9 18 6-6-6-6" />, 'IconChevron');
export const IconChevronLeft = I(<path d="m15 18-6-6 6-6" />, 'IconChevronLeft');
export const IconChevronDown = I(<path d="m6 9 6 6 6-6" />, 'IconChevronDown');
export const IconChevronsUpDown = I(<path d="m7 15 5 5 5-5M7 9l5-5 5 5" />, 'IconChevronsUpDown');
export const IconArrowRight = I(<path d="M5 12h14m-7-7 7 7-7 7" />, 'IconArrowRight');
export const IconArrowLeft = I(<path d="M19 12H5m7 7-7-7 7-7" />, 'IconArrowLeft');
export const IconEye = I(<><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" /></>, 'IconEye');
export const IconEyeOff = I(<><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49M14.084 14.158a3 3 0 0 1-4.242-4.242M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143M2 2l20 20" /></>, 'IconEyeOff');
export const IconFlag = I(<><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><path d="M4 22v-7" /></>, 'IconFlag');
export const IconPin = I(<><path d="M12 17v5" /><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" /></>, 'IconPin');
export const IconListChecks = I(<path d="m3 17 2 2 4-4M3 7l2 2 4-4M13 6h8M13 12h8M13 18h8" />, 'IconListChecks');
export const IconGraduation = I(<><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" /><path d="M22 10v6M6 12.5V16a6 3 0 0 0 12 0v-3.5" /></>, 'IconGraduation');
export const IconLock = I(<><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>, 'IconLock');
export const IconNote = I(<><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4M16 13H8M16 17H8M10 9H8" /></>, 'IconNote');
export const IconSearch = I(<><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>, 'IconSearch');
export const IconLayers = I(<><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" /><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65M22 12.65l-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" /></>, 'IconLayers');
export const IconHelp = I(<><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" /></>, 'IconHelp');
export const IconSettings = I(<><path d="M20 7h-9M14 17H5" /><circle cx="17" cy="17" r="3" /><circle cx="7" cy="7" r="3" /></>, 'IconSettings');

// Brand mark: a bookmark-shaped ribbon over a page — "a guide that keeps your place".
export function IconLogo({ size = 28, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false" {...props}>
      <rect width="32" height="32" rx="8" fill="var(--brand-600, #2c50c4)" />
      <path d="M9 8.5A1.5 1.5 0 0 1 10.5 7h11A1.5 1.5 0 0 1 23 8.5v15.2a.8.8 0 0 1-1.25.66L16 20.5l-5.75 3.86A.8.8 0 0 1 9 23.7z" fill="#fff" fillOpacity=".95" />
      <path d="M13 12h6M13 15.5h4" stroke="var(--brand-600, #2c50c4)" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
