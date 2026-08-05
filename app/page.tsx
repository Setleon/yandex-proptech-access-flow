"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

type Screen = "home" | "house" | "passes" | "person-form" | "vehicle-form" | "pending" | "ready" | "share";
type VisitorKind = "guest" | "courier";
type VehicleKind = "guest" | "taxi" | "delivery";
type Direction = "territory" | "guest-parking" | "own-place";
type PlateKind = "russian" | "foreign";
type VehiclePlateField = { plate: string; plateKind: PlateKind; touched: boolean };
type DayChoice = "today" | "tomorrow" | "custom";
type RequestStatus = "pending" | "ready";
type IconName = "arrow-left" | "bell" | "bolt" | "bookmark" | "calendar" | "car" | "check" | "chevron-down" | "chevron-right" | "clock" | "close" | "copy" | "door" | "edit" | "globe" | "grid" | "home" | "house" | "layers" | "message" | "parking" | "pass" | "person-plus" | "profile" | "search" | "share" | "shield-check" | "sparkle" | "store";

type Property = {
  id: string;
  label: string;
  address: string;
  fullAddress: string;
};

type AccessRequest = {
  accessId: string;
  kind: "person" | "vehicle";
  subtype: VisitorKind | VehicleKind;
  propertyId: string;
  isQuick: boolean;
  personNames: string[];
  plate: string;
  plateKind: PlateKind;
  direction: Direction;
  day: DayChoice;
  dateLabel: string;
  timeLimited: boolean;
  from: string;
  to: string;
  serviceName: string;
  comment: string;
};

type PassListItem = {
  id: string;
  request: AccessRequest;
  status: RequestStatus;
  statusLabel: string;
  title: string;
  subject: string;
  dateLabel: string;
  timeLabel: string;
  directionLabel: string;
  icon: "profile" | "car";
};

type ScreenGuide = {
  navLabel: string;
  references: Array<{ src: string; alt: string; caption: string }>;
};

const properties: Property[] = [
  { id: "volgograd-77", label: "Квартира №77", address: "Волгоградский пр-кт, д. 555", fullAddress: "Волгоградский пр-кт, д. 555 кв. 77" },
  { id: "volgograd-21", label: "Квартира №21", address: "Волгоградский пр-кт, д. 555", fullAddress: "Волгоградский пр-кт, д. 555 кв. 21" },
  { id: "khodynskiy-15", label: "Квартира №15", address: "Ходынский б-р, д. 2", fullAddress: "Ходынский б-р, д. 2 кв. 15" },
];
const defaultPropertyId = properties[0].id;
const validScreens: Screen[] = ["home", "house", "passes", "person-form", "vehicle-form", "pending", "ready", "share"];
const guideScreens: Screen[] = ["home", "house", "passes", "person-form", "vehicle-form", "pending", "ready", "share"];

const screenGuides: Record<Screen, ScreenGuide> = {
  home: {
    navLabel: "Главная",
    references: [{ src: "/references/current-flow/IMG_3819.PNG", alt: "Текущая главная приложения", caption: "Текущая главная" }],
  },
  house: {
    navLabel: "Дом",
    references: [
      { src: "/references/current-flow/IMG_3870.PNG", alt: "Полный текущий экран Дом", caption: "Верхняя часть экрана «Дом»" },
      { src: "/references/current-flow/IMG_3822.PNG", alt: "Текущий раздел дома с виджетом пропусков", caption: "Экран после прокрутки" },
    ],
  },
  passes: {
    navLabel: "Разовые",
    references: [
      { src: "/references/current-flow/IMG_3864.PNG", alt: "Текущий раздел разовых пропусков с несколькими статусами", caption: "История разовых пропусков сейчас" },
      { src: "/references/current-flow/IMG_3871.PNG", alt: "Текущее меню действий принятого пропуска для человека", caption: "Действия с пропуском человека" },
      { src: "/references/current-flow/IMG_3872.PNG", alt: "Текущее меню действий принятого пропуска для транспорта", caption: "Действия с пропуском транспорта" },
      { src: "/references/current-flow/IMG_3829.PNG", alt: "Пустой раздел разовых пропусков", caption: "Пустое состояние раздела" },
    ],
  },
  "person-form": {
    navLabel: "Человек",
    references: [
      { src: "/references/current-flow/IMG_3854.PNG", alt: "Текущая форма разового пропуска для человека", caption: "Начало формы сейчас" },
      { src: "/references/current-flow/IMG_3851.PNG", alt: "Текущая форма с несколькими людьми и выбором даты", caption: "Заполненная форма сейчас" },
    ],
  },
  "vehicle-form": {
    navLabel: "Автомобиль",
    references: [
      { src: "/references/current-flow/IMG_3856.PNG", alt: "Текущая форма гостевого автомобиля", caption: "Гостевой автомобиль сейчас" },
      { src: "/references/current-flow/IMG_3855.PNG", alt: "Текущий отдельный экран типа автомобиля", caption: "Тип авто сейчас открывается отдельно" },
    ],
  },
  pending: {
    navLabel: "Согласование",
    references: [{ src: "/references/current-flow/IMG_3837.PNG", alt: "Текущий экран результата создания пропуска", caption: "Текущий результат создания" }],
  },
  ready: {
    navLabel: "Готов",
    references: [
      { src: "/references/current-flow/IMG_3853.PNG", alt: "Принятый разовый пропуск в текущем разделе", caption: "Принятый пропуск сейчас" },
      { src: "/references/current-flow/IMG_3866.PNG", alt: "Транспорт находится в нижней части профиля", caption: "Транспорт сейчас спрятан в профиле" },
      { src: "/references/current-flow/IMG_3867.PNG", alt: "Текущий экран Мой транспорт", caption: "Сохранённый автомобиль сейчас" },
      { src: "/references/current-flow/IMG_3868.PNG", alt: "Текущий экран добавления транспорта", caption: "Добавление транспорта сейчас" },
    ],
  },
  share: {
    navLabel: "Передача",
    references: [],
  },
};

const personLabels: Record<VisitorKind, string> = {
  guest: "Гость",
  courier: "Курьер",
};

const vehicleLabels: Record<VehicleKind, string> = {
  guest: "Гость",
  taxi: "Такси",
  delivery: "Доставка",
};

const directionLabels: Record<Direction, { title: string; detail: string }> = {
  territory: { title: "Территория", detail: "Только въезд" },
  "guest-parking": { title: "Гостевая парковка", detail: "Если есть места" },
  "own-place": { title: "Моё место", detail: "Паркинг P-1 · №47" },
};

const savedVehicles: Array<{ label: string; plate: string; plateKind: PlateKind }> = [
  { label: "Основная", plate: "А 123 АА 77", plateKind: "russian" },
  { label: "Семейная", plate: "М 456 ММ 77", plateKind: "russian" },
  { label: "Иностранная", plate: "KTR 4821", plateKind: "foreign" },
];

const timePresets = [
  { label: "Утро", from: "08:00", to: "12:00" },
  { label: "День", from: "12:00", to: "18:00" },
  { label: "Вечер", from: "18:00", to: "22:00" },
];

const recentDeliveryServices = ["Яндекс Еда", "Яндекс Лавка", "Яндекс Маркет"];
const deliveryServices = [
  "Яндекс Доставка", "Яндекс Еда", "Яндекс Лавка", "Яндекс Маркет",
  "Самокат", "Ozon", "Перекрёсток", "ВкусВилл", "Азбука Вкуса",
  "Купер", "Магнит", "Wildberries", "Lamoda", "Boxberry", "Додо Пицца",
];

const recentPeople = ["Илья тест"];
const recentPlates = ["А 123 АА 77", "М 456 ММ 77", "В 122 АР 233"];

const vehicleReferenceSets: Record<VehicleKind, ScreenGuide["references"]> = {
  guest: [
    { src: "/references/current-flow/IMG_3856.PNG", alt: "Текущая форма гостевого автомобиля", caption: "Гость: номер, марка и тип авто" },
    { src: "/references/current-flow/IMG_3835.PNG", alt: "Текущий отдельный экран ввода номера", caption: "Номер открывается отдельно" },
    { src: "/references/current-flow/IMG_3836.PNG", alt: "Текущий отдельный экран ввода марки", caption: "Марка открывается отдельно" },
    { src: "/references/current-flow/IMG_3855.PNG", alt: "Текущий отдельный экран типа автомобиля", caption: "Тип авто открывается отдельно" },
  ],
  delivery: [
    { src: "/references/current-flow/IMG_3857.PNG", alt: "Текущая форма автомобиля доставки", caption: "Доставка: сервис и номер" },
    { src: "/references/current-flow/IMG_3863.PNG", alt: "Текущий полный список сервисов доставки", caption: "Полный список открывается отдельно" },
  ],
  taxi: [{ src: "/references/current-flow/IMG_3858.PNG", alt: "Текущая форма такси", caption: "Такси: только номер" }],
};

const russianPlateLetters = "АВЕКМНОРСТУХ";

function plateIdentity(value: string) {
  return value.toUpperCase().replace(/[\s-]+/g, "");
}

function plateIsValid(value: string, kind: PlateKind) {
  return kind === "russian" ? isRussianPlateValid(value) : isForeignPlateValid(value);
}

function requestPlateValues(request: AccessRequest) {
  return request.plate.split(" · ").map((value) => value.trim()).filter(Boolean);
}

function normalizeRussianPlate(value: string) {
  const transliterated = value.toUpperCase().replace(/[ABEKMHOPCTYX]/g, (letter) => ({
    A: "А", B: "В", E: "Е", K: "К", M: "М", H: "Н", O: "О", P: "Р", C: "С", T: "Т", Y: "У", X: "Х",
  }[letter] ?? letter));
  const compact = transliterated.replace(/[^АВЕКМНОРСТУХ0-9]/g, "").slice(0, 9);
  return [compact.slice(0, 1), compact.slice(1, 4), compact.slice(4, 6), compact.slice(6, 9)].filter(Boolean).join(" ");
}

function normalizeForeignPlate(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9 -]/g, "").replace(/\s{2,}/g, " ").slice(0, 12);
}

function isRussianPlateValid(value: string) {
  const compact = value.replace(/\s/g, "");
  const letter = `[${russianPlateLetters}]`;
  return new RegExp(`^${letter}\\d{3}${letter}{2}\\d{2,3}$`).test(compact);
}

function isForeignPlateValid(value: string) {
  const compact = value.replace(/[ -]/g, "");
  return compact.length >= 4 && compact.length <= 10 && /^[A-Z0-9]+$/.test(compact);
}

function dateAtOffset(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" }).format(date);
}

function isoDateAtOffset(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatIsoDate(value: string) {
  if (!value) return "";
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" }).format(new Date(year, month - 1, day));
}

function parseIsoDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

function toIsoDate(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function formatDateSelection(start: string, end: string) {
  if (!start) return "";
  return end ? `С ${formatIsoDate(start)} по ${formatIsoDate(end)}` : formatIsoDate(start);
}

function formatCalendarMonth(value: string) {
  const label = new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" }).format(parseIsoDate(value));
  return label.slice(0, 1).toUpperCase() + label.slice(1);
}

function makeDemoAccessToken(request: AccessRequest) {
  const source = [request.accessId, request.propertyId, request.kind, request.subtype, request.isQuick, request.personNames.join("|"), request.plate, request.dateLabel, request.direction, request.from, request.to].join(":");
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) { hash ^= source.charCodeAt(index); hash = Math.imul(hash, 16777619); }
  return `urn:yandex-proptech:access:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function makeDemoPin(request: AccessRequest) {
  const hash = Number.parseInt(makeDemoAccessToken(request).slice(-8), 16) >>> 0;
  const digits = String(10_000_000 + (hash % 90_000_000));
  return `${digits.slice(0, 4)} ${digits.slice(4)}`;
}

function createAccessId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

function Icon({ name, size = 24 }: { name: IconName; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  const paths: Record<IconName, React.ReactNode> = {
    "arrow-left": <><path d="m15 18-6-6 6-6" /><path d="M9 12h10" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    bolt: <path d="m13 2-8 12h6l-1 8 9-13h-6V2Z" />,
    bookmark: <path d="M6 4h12v17l-6-4-6 4V4Z" />,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4M16 3v4M3 10h18" /></>,
    car: <><path d="m5 11 1.5-4.2A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.3L19 11" /><path d="M4 11h16v7H4z" /><circle cx="7" cy="15" r="1" /><circle cx="17" cy="15" r="1" /></>,
    check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.7 2.7L16.5 9" /></>,
    "chevron-down": <path d="m7 10 5 5 5-5" />,
    "chevron-right": <path d="m9 18 6-6-6-6" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    close: <><path d="M6 6l12 12" /><path d="m18 6-12 12" /></>,
    copy: <><rect x="8" y="8" width="11" height="11" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></>,
    door: <><path d="M5 21V4l12-1v18" /><path d="M5 21h14" /><circle cx="14" cy="12" r=".8" fill="currentColor" stroke="none" /></>,
    edit: <><path d="m4 20 4.2-1 10.6-10.6a2 2 0 0 0-2.8-2.8L5.4 16.2 4 20Z" /><path d="m14.5 7 2.8 2.8" /></>,
    globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></>,
    home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></>,
    house: <><path d="M4 10.5 12 4l8 6.5" /><path d="M6 9v11h12V9" /></>,
    layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5" /><path d="m3 16 9 5 9-5" /></>,
    message: <path d="M4 4h16v12H8l-4 4V4Z" />,
    parking: <><circle cx="12" cy="12" r="9" /><path d="M9 17V7h4a3 3 0 0 1 0 6H9" /></>,
    pass: <><rect x="3" y="5" width="18" height="14" rx="3" /><circle cx="9" cy="11" r="2" /><path d="M6.5 16c.7-1.5 1.5-2 2.5-2s1.8.5 2.5 2" /><path d="M14 10h4M14 14h4" /></>,
    "person-plus": <><circle cx="9" cy="8" r="3" /><path d="M3.5 19c.7-3.4 2.5-5 5.5-5s4.8 1.6 5.5 5" /><path d="M18 8v6M15 11h6" /></>,
    profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21c.8-5 3.5-7 8-7s7.2 2 8 7" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m16 16 5 5" /></>,
    share: <><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="m8.2 10.8 7.5-4.3M8.2 13.2l7.5 4.3" /></>,
    "shield-check": <><path d="M12 3 5 6v5c0 4.5 2.8 7.8 7 10 4.2-2.2 7-5.5 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></>,
    sparkle: <><path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4L12 3Z" /><path d="m18.5 14 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" /></>,
    store: <><path d="M4 9h16l-1.5-5h-13L4 9Z" /><path d="M5 9v11h14V9" /><path d="M9 20v-6h6v6" /></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

function PersonAccessCredential({ pin, token, copied, onCopy, compact = false, label = "QR или PIN" }: { pin: string; token: string; copied: boolean; onCopy: () => void; compact?: boolean; label?: string }) {
  return (
    <section className={`person-access-card ${compact ? "person-access-compact" : ""}`} aria-label="Доступ по QR-коду или PIN">
      <div className="person-access-qr" aria-hidden="true"><QRCodeSVG value={token} size={112} level="M" marginSize={4} bgColor="#ffffff" fgColor="#1f1e20" /></div>
      <div className="person-access-pin">
        <small>{label}</small>
        <strong>{pin}</strong>
        <button type="button" onClick={onCopy} aria-label={copied ? "PIN скопирован" : "Скопировать PIN"}><Icon name={copied ? "check" : "copy"} size={16} /><span aria-live="polite">{copied ? "PIN скопирован" : "Скопировать PIN"}</span></button>
      </div>
      <p>Покажите QR или введите PIN</p>
    </section>
  );
}

function StatusBar() {
  return <div className="status-bar" aria-hidden="true"><div><strong>20:49</strong><span className="muted-bell"><Icon name="bell" size={17} /></span></div><div className="system-status"><span className="cell-signal"><i /><i /><i /><i /></span><span className="wifi-signal"><i /><b /></span><span className="battery-status">65</span></div></div>;
}

function AddressHeader({ property, onPropertyClick }: { property: Property; onPropertyClick: () => void }) {
  return <header className="address-header"><span><Icon name="home" size={27} /></span><button className="property-header-trigger" type="button" onClick={onPropertyClick} aria-haspopup="dialog"><span><strong>{property.label}</strong><small>{property.address}</small></span><Icon name="chevron-down" size={18} /></button><span><Icon name="bell" size={25} /></span></header>;
}

function BottomNav({ active, onHome, onHouse }: { active: "home" | "house"; onHome: () => void; onHouse: () => void }) {
  return <nav className="bottom-nav" aria-label="Основная навигация"><button type="button" className={active === "home" ? "bottom-nav-active" : ""} onClick={onHome}><Icon name="home" size={23} /><b>Главная</b></button><button type="button" className={active === "house" ? "bottom-nav-active" : ""} onClick={onHouse}><Icon name="house" size={23} /><b>Дом</b></button><span><Icon name="layers" size={23} /><b>Витрина</b></span><span><Icon name="grid" size={23} /><b>Сервисы</b></span><span><Icon name="profile" size={23} /><b>Профиль</b></span></nav>;
}

function StackHeader({ title, property, onPropertyClick, onBack, onClose, compact = false }: { title: string; property: Property; onPropertyClick?: () => void; onBack?: () => void; onClose?: () => void; compact?: boolean }) {
  return <div className={`stack-shell ${compact ? "compact-stack-shell" : ""}`}><StatusBar /><header className="stack-header">{onBack ? <button type="button" onClick={onBack} aria-label="Назад"><Icon name="arrow-left" /></button> : <span />}<div><strong>{title}</strong>{onPropertyClick ? <button className="stack-property-trigger" type="button" onClick={onPropertyClick} aria-haspopup="dialog"><span>{property.label} · {property.address}</span><Icon name="chevron-down" size={14} /></button> : <small>{property.fullAddress}</small>}</div>{onClose ? <button type="button" onClick={onClose} aria-label="Закрыть"><Icon name="close" /></button> : <span />}</header></div>;
}

function DateTimeFields({ day, setDay, customDate, setCustomDate, customDateEnd, setCustomDateEnd, timeLimited, setTimeLimited, from, setFrom, to, setTo, today, tomorrow, error, allowTime = true }: { day: DayChoice; setDay: (value: DayChoice) => void; customDate: string; setCustomDate: (value: string) => void; customDateEnd: string; setCustomDateEnd: (value: string) => void; timeLimited: boolean; setTimeLimited: (value: boolean) => void; from: string; setFrom: (value: string) => void; to: string; setTo: (value: string) => void; today: string; tomorrow: string; error: string; allowTime?: boolean }) {
  const todayIso = isoDateAtOffset(0);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(`${todayIso.slice(0, 7)}-01`);
  const [draftStart, setDraftStart] = useState("");
  const [draftEnd, setDraftEnd] = useState("");
  const calendarDays = useMemo(() => {
    const first = parseIsoDate(calendarMonth);
    const firstGridDay = new Date(first);
    firstGridDay.setDate(1 - ((first.getDay() + 6) % 7));
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(firstGridDay);
      date.setDate(firstGridDay.getDate() + index);
      const iso = toIsoDate(date);
      return { iso, dayNumber: date.getDate(), inMonth: iso.slice(0, 7) === calendarMonth.slice(0, 7), disabled: iso < todayIso };
    });
  }, [calendarMonth, todayIso]);

  const chooseQuickDate = (next: "today" | "tomorrow") => {
    setDay(next);
    setCustomDateEnd("");
    setCalendarOpen(false);
  };

  const toggleCalendar = () => {
    if (calendarOpen) {
      setCalendarOpen(false);
      return;
    }
    const selectedStart = day === "custom" ? customDate : "";
    setDraftStart(selectedStart);
    setDraftEnd(day === "custom" ? customDateEnd : "");
    setCalendarMonth(`${(selectedStart || todayIso).slice(0, 7)}-01`);
    setCalendarOpen(true);
  };

  const shiftCalendarMonth = (offset: number) => {
    setCalendarMonth((current) => {
      const next = parseIsoDate(current);
      next.setMonth(next.getMonth() + offset, 1);
      return toIsoDate(next);
    });
  };

  const chooseCalendarDay = (value: string) => {
    if (!draftStart || draftEnd) {
      setDraftStart(value);
      setDraftEnd("");
      return;
    }
    if (value === draftStart) {
      setDraftEnd("");
      return;
    }
    if (value < draftStart) {
      setDraftEnd(draftStart);
      setDraftStart(value);
      return;
    }
    setDraftEnd(value);
  };

  const confirmCalendar = () => {
    if (!draftStart) return;
    setCustomDate(draftStart);
    setCustomDateEnd(draftEnd);
    if (draftEnd) setTimeLimited(false);
    setDay("custom");
    setCalendarOpen(false);
  };

  const customDateLabel = day === "custom" ? formatDateSelection(customDate, customDateEnd) : "Календарь";
  const calendarConfirmLabel = draftStart ? draftEnd ? `С ${formatIsoDate(draftStart)} по ${formatIsoDate(draftEnd)}` : `Выбрать ${formatIsoDate(draftStart)}` : "Выберите дату";
  const showTimeSelection = allowTime && !(day === "custom" && customDateEnd) && !(calendarOpen && draftEnd);

  return (
    <section className="form-section date-time-section">
      <h2>Когда</h2>
      <div className="day-choice">
        <button type="button" className={day === "today" ? "choice-active" : ""} aria-pressed={day === "today"} onClick={() => chooseQuickDate("today")}><strong>Сегодня</strong><small>{today}</small></button>
        <button type="button" className={day === "tomorrow" ? "choice-active" : ""} aria-pressed={day === "tomorrow"} onClick={() => chooseQuickDate("tomorrow")}><strong>Завтра</strong><small>{tomorrow}</small></button>
        <button type="button" className={day === "custom" || calendarOpen ? "choice-active" : ""} aria-pressed={day === "custom"} aria-expanded={calendarOpen} aria-controls="date-range-calendar" onClick={toggleCalendar}><strong>Другая дата</strong><small>{customDateLabel}</small></button>
      </div>
      {calendarOpen ? (
        <div className="date-range-calendar" id="date-range-calendar" role="dialog" aria-label="Выбор даты пропуска">
          <div className="calendar-header"><button type="button" aria-label="Предыдущий месяц" disabled={calendarMonth.slice(0, 7) <= todayIso.slice(0, 7)} onClick={() => shiftCalendarMonth(-1)}><Icon name="chevron-right" size={18} /></button><strong>{formatCalendarMonth(calendarMonth)}</strong><button type="button" aria-label="Следующий месяц" onClick={() => shiftCalendarMonth(1)}><Icon name="chevron-right" size={18} /></button></div>
          <div className="calendar-weekdays" aria-hidden="true">{["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((label) => <span key={label}>{label}</span>)}</div>
          <div className="calendar-grid" role="grid">
            {calendarDays.map((item) => {
              const selected = item.iso === draftStart || item.iso === draftEnd;
              const inRange = Boolean(draftStart && draftEnd && item.iso > draftStart && item.iso < draftEnd);
              const className = ["calendar-day", !item.inMonth ? "calendar-day-outside" : "", selected ? "calendar-day-selected" : "", inRange ? "calendar-day-in-range" : ""].filter(Boolean).join(" ");
              return <button type="button" role="gridcell" key={item.iso} className={className} disabled={item.disabled || !item.inMonth} aria-selected={selected || inRange} aria-label={formatIsoDate(item.iso)} onClick={() => chooseCalendarDay(item.iso)}>{item.dayNumber}</button>;
            })}
          </div>
          <button className="calendar-confirm" type="button" disabled={!draftStart} onClick={confirmCalendar}>{calendarConfirmLabel}</button>
        </div>
      ) : null}
      {showTimeSelection ? <button className="time-toggle-row" type="button" role="switch" aria-checked={timeLimited} onClick={() => setTimeLimited(!timeLimited)}><span><strong>Указать время</strong><small>Сейчас пропуск будет до конца дня</small></span><i aria-hidden="true"><b /></i></button> : null}
      {showTimeSelection && timeLimited ? (
        <div className="time-editor">
          <div className="time-presets" role="group" aria-label="Быстрый выбор времени">
            {timePresets.map((preset) => {
              const selected = from === preset.from && to === preset.to;
              return <button type="button" key={preset.label} className={selected ? "time-preset-active" : ""} aria-pressed={selected} onClick={() => { setFrom(preset.from); setTo(preset.to); }}><strong>{preset.label}</strong><small>{preset.from}–{preset.to}</small></button>;
            })}
          </div>
          <div className="time-fields">
            <label><span>С</span><input type="time" step="900" value={from} onChange={(event) => setFrom(event.target.value)} aria-label="Время начала" required /></label>
            <span className="time-separator" aria-hidden="true">—</span>
            <label><span>До</span><input type="time" step="900" value={to} min={from} onChange={(event) => setTo(event.target.value)} aria-label="Время окончания" required /></label>
          </div>
        </div>
      ) : null}
      {error ? <small className="form-error" role="alert">{error}</small> : null}
    </section>
  );
}

function CommentField({ expanded, setExpanded, value, setValue, placeholder }: { expanded: boolean; setExpanded: (value: boolean) => void; value: string; setValue: (value: string) => void; placeholder: string }) {
  return <section className="form-section comment-section"><button className="disclosure-row" type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}><strong>Комментарий</strong><Icon name={expanded ? "chevron-down" : "chevron-right"} size={20} /></button>{expanded ? <label className="text-field comment-field"><span>Комментарий, потребуется согласование УК</span><textarea value={value} onChange={(event) => setValue(event.target.value)} placeholder={placeholder} rows={3} /></label> : null}</section>;
}

function defaultRequest(today: string, propertyId = defaultPropertyId): AccessRequest {
  return { accessId: `demo-vehicle-${propertyId}`, kind: "vehicle", subtype: "guest", propertyId, isQuick: false, personNames: [], plate: "В 122 АР 233", plateKind: "russian", direction: "guest-parking", day: "today", dateLabel: today, timeLimited: false, from: "", to: "", serviceName: "", comment: "" };
}

function approvalDemoRequest(today: string, propertyId = defaultPropertyId): AccessRequest {
  return { ...defaultRequest(today, propertyId), comment: "Позвонить перед въездом и направить машину к третьему подъезду" };
}

function samplePersonRequest(propertyId = defaultPropertyId): AccessRequest {
  return { accessId: `demo-person-${propertyId}`, kind: "person", subtype: "guest", propertyId, isQuick: false, personNames: ["Илья тест"], plate: "", plateKind: "russian", direction: "territory", day: "custom", dateLabel: "5 сентября", timeLimited: false, from: "", to: "", serviceName: "", comment: "" };
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("home");
  const [selectedPropertyId, setSelectedPropertyId] = useState(defaultPropertyId);
  const [propertySwitcherOpen, setPropertySwitcherOpen] = useState(false);
  const [quickPassOpen, setQuickPassOpen] = useState(false);
  const [personKind, setPersonKind] = useState<VisitorKind>("guest");
  const [vehicleKind, setVehicleKind] = useState<VehicleKind>("guest");
  const [personNames, setPersonNames] = useState([""]);
  const [plateKind, setPlateKind] = useState<PlateKind>("russian");
  const [plate, setPlate] = useState("");
  const [plateTouched, setPlateTouched] = useState(false);
  const [additionalVehiclePlates, setAdditionalVehiclePlates] = useState<VehiclePlateField[]>([]);
  const [activeVehiclePlateIndex, setActiveVehiclePlateIndex] = useState(0);
  const [savedVehiclesOpen, setSavedVehiclesOpen] = useState(false);
  const [userVehicles, setUserVehicles] = useState(savedVehicles);
  const [direction, setDirection] = useState<Direction>("guest-parking");
  const [directionOpen, setDirectionOpen] = useState(false);
  const [serviceName, setServiceName] = useState("");
  const [deliveryPickerOpen, setDeliveryPickerOpen] = useState(false);
  const [deliveryQuery, setDeliveryQuery] = useState("");
  const [comment, setComment] = useState("");
  const [commentExpanded, setCommentExpanded] = useState(false);
  const [day, setDay] = useState<DayChoice>("today");
  const [customDate, setCustomDate] = useState(isoDateAtOffset(0));
  const [customDateEnd, setCustomDateEnd] = useState("");
  const [timeLimited, setTimeLimited] = useState(false);
  const [from, setFrom] = useState("14:00");
  const [to, setTo] = useState("18:00");
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [request, setRequest] = useState<AccessRequest | null>(null);
  const [viewRequest, setViewRequest] = useState<AccessRequest | null>(null);
  const [approvalRequest, setApprovalRequest] = useState<AccessRequest | null>(null);
  const [requestStatus, setRequestStatus] = useState<RequestStatus>("ready");
  const [passQuery, setPassQuery] = useState("");
  const [revealedPassId, setRevealedPassId] = useState<string | null>(null);
  const [hiddenPassIds, setHiddenPassIds] = useState<string[]>([]);
  const [lastDeletedPassId, setLastDeletedPassId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pinCopied, setPinCopied] = useState(false);
  const [vehicleSaved, setVehicleSaved] = useState(false);
  const [servicesConnected, setServicesConnected] = useState(false);
  const [goConnected, setGoConnected] = useState(false);
  const routeRef = useRef<HTMLDivElement>(null);
  const approvalDialogRef = useRef<HTMLElement>(null);
  const navigationDepthRef = useRef(0);
  const passSwipeStartXRef = useRef<number | null>(null);
  const passSwipeHandledRef = useRef(false);
  const pinCopyTimerRef = useRef<number | null>(null);

  const today = useMemo(() => dateAtOffset(0), []);
  const tomorrow = useMemo(() => dateAtOffset(1), []);
  const selectedProperty = properties.find((item) => item.id === selectedPropertyId) ?? properties[0];
  const selectedDate = day === "today" ? today : day === "tomorrow" ? tomorrow : formatDateSelection(customDate, customDateEnd);
  const plateValid = plateIsValid(plate, plateKind);
  const plateRequired = vehicleKind !== "delivery";
  const guestVehiclePlateFields = [{ plate, plateKind, touched: plateTouched }, ...additionalVehiclePlates];
  const effectivePlateValid = !plateRequired || (vehicleKind === "guest" ? guestVehiclePlateFields.every((field) => plateIsValid(field.plate, field.plateKind)) : plateValid);
  const showPlateError = plateRequired && (plateTouched || submitAttempted);
  const plateError = !showPlateError ? "" : plate.trim() === "" ? "Введите номер" : !plateValid ? plateKind === "russian" ? "Проверьте формат: А 123 АА 77" : "Используйте латиницу и цифры" : "";
  const invalidPersonIndex = personNames.findIndex((name) => name.trim().length < 2);
  const personError = submitAttempted && invalidPersonIndex >= 0 ? "Введите имя" : "";
  const serviceError = submitAttempted && vehicleKind === "delivery" && serviceName.trim().length < 2 ? "Укажите сервис доставки" : "";
  const personTimeError = submitAttempted && timeLimited && (!from || !to || to <= from) ? "Время окончания должно быть позже начала" : "";
  const vehicleTimeError = submitAttempted && timeLimited && (!from || !to || to <= from) ? "Время окончания должно быть позже начала" : "";
  const timeRangeValid = !timeLimited || Boolean(from && to && to > from);
  const vehicleTimeValid = timeRangeValid;
  const personMissingFields = [
    ...(invalidPersonIndex >= 0 ? [personNames.length > 1 ? "всех посетителей" : "посетителя"] : []),
    ...(!selectedDate ? ["дату"] : []),
    ...(!timeRangeValid ? ["корректное время"] : []),
  ];
  const vehicleMissingFields = [
    ...(vehicleKind === "delivery" && serviceName.trim().length < 2 ? ["сервис доставки"] : []),
    ...(!effectivePlateValid ? [vehicleKind === "guest" && guestVehiclePlateFields.length > 1 ? "все госномера" : "госномер"] : []),
    ...(!selectedDate ? ["дату"] : []),
    ...(!vehicleTimeValid ? ["корректное время"] : []),
  ];
  const personReady = personMissingFields.length === 0;
  const vehicleReady = vehicleMissingFields.length === 0;
  const personSubmitHint = `Заполните: ${personMissingFields.join(", ")}`;
  const vehicleSubmitHint = `Заполните: ${vehicleMissingFields.join(", ")}`;
  const activeVehiclePlate = activeVehiclePlateIndex === 0 ? plate : additionalVehiclePlates[activeVehiclePlateIndex - 1]?.plate ?? "";
  const activeVehiclePlateKind = activeVehiclePlateIndex === 0 ? plateKind : additionalVehiclePlates[activeVehiclePlateIndex - 1]?.plateKind ?? "russian";
  const filteredDeliveryServices = deliveryServices.filter((item) => item.toLocaleLowerCase("ru").includes(deliveryQuery.trim().toLocaleLowerCase("ru")));

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const value = new URLSearchParams(window.location.search).get("state");
      const requested = value && validScreens.includes(value as Screen) ? value as Screen : "home";
      if (["pending", "ready", "share"].includes(requested)) {
        setViewRequest(null);
        setRequest(requested === "pending" ? approvalDemoRequest(today, defaultPropertyId) : defaultRequest(today, defaultPropertyId));
        setRequestStatus(requested === "pending" ? "pending" : "ready");
      }
      window.history.replaceState({ screen: requested }, "", window.location.href);
      setScreen(requested);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [today]);

  useEffect(() => {
    const handlePopState = () => {
      const value = new URLSearchParams(window.location.search).get("state");
      const next = value && validScreens.includes(value as Screen) ? value as Screen : "home";
      navigationDepthRef.current = Math.max(0, navigationDepthRef.current - 1);
      setScreen(next);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    routeRef.current?.focus();
    routeRef.current?.querySelector<HTMLElement>(".app-scroll")?.scrollTo({ top: 0 });
  }, [screen]);

  useEffect(() => {
    if (approvalRequest) approvalDialogRef.current?.focus();
  }, [approvalRequest]);

  useEffect(() => {
    if (!propertySwitcherOpen && !quickPassOpen) return;
    const closeSheet = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setPropertySwitcherOpen(false);
      setQuickPassOpen(false);
    };
    window.addEventListener("keydown", closeSheet);
    return () => window.removeEventListener("keydown", closeSheet);
  }, [propertySwitcherOpen, quickPassOpen]);

  function jumpTo(next: Screen, replace = false) {
    const url = new URL(window.location.href);
    if (next === "home") url.searchParams.delete("state");
    else url.searchParams.set("state", next);
    if (replace) window.history.replaceState({ screen: next }, "", url);
    else { window.history.pushState({ screen: next }, "", url); navigationDepthRef.current += 1; }
    setSubmitAttempted(false);
    setCopied(false);
    setPinCopied(false);
    setApprovalRequest(null);
    setPropertySwitcherOpen(false);
    setQuickPassOpen(false);
    setScreen(next);
  }

  function openPropertySwitcher() {
    setQuickPassOpen(false);
    setApprovalRequest(null);
    setPropertySwitcherOpen(true);
  }

  function chooseProperty(propertyId: string) {
    setSelectedPropertyId(propertyId);
    setPropertySwitcherOpen(false);
  }

  function openQuickPass() {
    setPropertySwitcherOpen(false);
    setApprovalRequest(null);
    setQuickPassOpen(true);
  }

  function goBack(fallback: Screen) {
    if (navigationDepthRef.current > 0) window.history.back();
    else jumpTo(fallback, true);
  }

  function startPersonForm(replace = false) {
    setPersonKind("guest");
    setPersonNames([""]);
    setComment("");
    setCommentExpanded(false);
    setDay("today");
    setCustomDate(isoDateAtOffset(0));
    setCustomDateEnd("");
    setTimeLimited(false);
    setFrom("14:00");
    setTo("18:00");
    setVehicleSaved(false);
    jumpTo("person-form", replace);
  }

  function startVehicleForm(replace = false) {
    setVehicleKind("guest");
    setPlateKind("russian");
    setPlate("");
    setPlateTouched(false);
    setAdditionalVehiclePlates([]);
    setActiveVehiclePlateIndex(0);
    setSavedVehiclesOpen(false);
    setDirection("guest-parking");
    setDirectionOpen(false);
    setServiceName("");
    setDeliveryPickerOpen(false);
    setDeliveryQuery("");
    setComment("");
    setCommentExpanded(false);
    setDay("today");
    setCustomDate(isoDateAtOffset(0));
    setCustomDateEnd("");
    setTimeLimited(false);
    setFrom("14:00");
    setTo("18:00");
    setVehicleSaved(false);
    jumpTo("vehicle-form", replace);
  }

  function submitPerson() {
    setSubmitAttempted(true);
    const cleanNames = personNames.map((name) => name.trim());
    if (cleanNames.some((name) => name.length < 2) || !selectedDate || (timeLimited && (!from || !to || to <= from))) return;
    submitAccessRequest({ accessId: createAccessId(), kind: "person", subtype: personKind, propertyId: selectedPropertyId, isQuick: false, personNames: cleanNames, plate: "", plateKind: "russian", direction: "territory", day, dateLabel: selectedDate, timeLimited, from: timeLimited ? from : "", to: timeLimited ? to : "", serviceName: "", comment: comment.trim() });
  }

  function submitVehicle() {
    setSubmitAttempted(true);
    const invalidTime = timeLimited && (!from || !to || to <= from);
    if (!effectivePlateValid || !selectedDate || invalidTime || (vehicleKind === "delivery" && serviceName.trim().length < 2)) return;
    const submittedPlate = vehicleKind === "guest" ? guestVehiclePlateFields.map((field) => field.plate.trim()).join(" · ") : vehicleKind === "delivery" ? "" : plate;
    submitAccessRequest({ accessId: createAccessId(), kind: "vehicle", subtype: vehicleKind, propertyId: selectedPropertyId, isQuick: false, personNames: [], plate: submittedPlate, plateKind: vehicleKind === "guest" ? plateKind : "russian", direction: vehicleKind === "guest" ? direction : "territory", day, dateLabel: selectedDate, timeLimited, from: timeLimited ? from : "", to: timeLimited ? to : "", serviceName: vehicleKind === "delivery" ? serviceName.trim() : "", comment: comment.trim() });
  }

  function submitAccessRequest(nextRequest: AccessRequest) {
    if (nextRequest.comment) {
      setApprovalRequest(nextRequest);
      return;
    }
    finishSubmission(nextRequest, "ready");
  }

  function finishSubmission(nextRequest: AccessRequest, status: RequestStatus, destination: Screen = status === "pending" ? "pending" : "ready") {
    setViewRequest(null);
    setRequest(nextRequest);
    setHiddenPassIds((current) => current.filter((id) => id !== "current"));
    setLastDeletedPassId(null);
    setRequestStatus(status);
    jumpTo(destination, true);
  }

  function createQuickPass(subtype: VisitorKind) {
    const nextRequest: AccessRequest = {
      accessId: createAccessId(),
      kind: "person",
      subtype,
      propertyId: selectedPropertyId,
      isQuick: true,
      personNames: [],
      plate: "",
      plateKind: "russian",
      direction: "territory",
      day: "today",
      dateLabel: today,
      timeLimited: false,
      from: "",
      to: "",
      serviceName: "",
      comment: "",
    };
    setQuickPassOpen(false);
    finishSubmission(nextRequest, "ready", "share");
  }

  function confirmCommentApproval() {
    if (!approvalRequest) return;
    finishSubmission(approvalRequest, "pending");
  }

  function submitWithoutComment() {
    if (!approvalRequest) return;
    setComment("");
    setCommentExpanded(false);
    finishSubmission({ ...approvalRequest, comment: "" }, "ready");
  }

  function openReady() {
    setRequestStatus("ready");
    jumpTo("ready", true);
  }

  function jumpFromGuide(next: Screen) {
    if (next === "person-form") { startPersonForm(); return; }
    if (next === "vehicle-form") { startVehicleForm(); return; }
    if (next === "pending") {
      setViewRequest(null);
      if (!request?.comment) setRequest(approvalDemoRequest(today, selectedPropertyId));
    } else if (["ready", "share"].includes(next) && !request) {
      setViewRequest(null);
      setRequest(defaultRequest(today, selectedPropertyId));
    }
    if (next === "pending") setRequestStatus("pending");
    if (next === "ready" || next === "share") setRequestStatus("ready");
    jumpTo(next);
  }

  function switchPlateKind(next: PlateKind) {
    setPlateKind(next);
    setPlate("");
    setPlateTouched(false);
    setSubmitAttempted(false);
    setActiveVehiclePlateIndex(0);
  }

  function chooseSavedVehicle(vehicle: (typeof savedVehicles)[number]) {
    if (activeVehiclePlateIndex === 0) {
      setPlateKind(vehicle.plateKind);
      setPlate(vehicle.plate);
      setPlateTouched(false);
    } else {
      setAdditionalVehiclePlates((current) => current.map((field, index) => index === activeVehiclePlateIndex - 1 ? { plate: vehicle.plate, plateKind: vehicle.plateKind, touched: false } : field));
    }
    setSubmitAttempted(false);
    setSavedVehiclesOpen(false);
  }

  function selectDeliveryService(service: string) {
    setServiceName(service);
    setDeliveryPickerOpen(false);
    setDeliveryQuery("");
    setSubmitAttempted(false);
  }

  function connectYandexGo() {
    setGoConnected(true);
    setPlateKind("russian");
    setPlate("С 777 СС 77");
    setPlateTouched(false);
    setAdditionalVehiclePlates([]);
    setActiveVehiclePlateIndex(0);
    setSubmitAttempted(false);
  }

  function changePersonName(index: number, value: string) {
    setPersonNames((current) => current.map((name, itemIndex) => itemIndex === index ? value : name));
  }

  function chooseRecentPerson(name: string) {
    setPersonNames((current) => [name, ...current.slice(1)]);
    setSubmitAttempted(false);
  }

  function chooseRecentPlate(recentPlate: string) {
    if (activeVehiclePlateIndex === 0) {
      setPlateKind("russian");
      setPlate(recentPlate);
      setPlateTouched(false);
    } else {
      setAdditionalVehiclePlates((current) => current.map((field, index) => index === activeVehiclePlateIndex - 1 ? { plate: recentPlate, plateKind: "russian", touched: false } : field));
    }
    setSubmitAttempted(false);
  }

  function addVehiclePlate() {
    if (additionalVehiclePlates.length >= 4) return;
    setAdditionalVehiclePlates((current) => [...current, { plate: "", plateKind: "russian", touched: false }]);
    setActiveVehiclePlateIndex(additionalVehiclePlates.length + 1);
    if (direction === "own-place") setDirection("guest-parking");
    setSubmitAttempted(false);
  }

  function changeAdditionalVehiclePlate(index: number, value: string) {
    setAdditionalVehiclePlates((current) => current.map((field, itemIndex) => itemIndex === index ? { ...field, plate: field.plateKind === "russian" ? normalizeRussianPlate(value) : normalizeForeignPlate(value) } : field));
  }

  function switchAdditionalPlateKind(index: number) {
    setAdditionalVehiclePlates((current) => current.map((field, itemIndex) => itemIndex === index ? { plate: "", plateKind: field.plateKind === "russian" ? "foreign" : "russian", touched: false } : field));
    setSubmitAttempted(false);
  }

  function removeVehiclePlate(index: number) {
    setAdditionalVehiclePlates((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setActiveVehiclePlateIndex(0);
    setSubmitAttempted(false);
  }

  function addPerson() {
    setPersonNames((current) => current.length >= 5 ? current : [...current, ""]);
  }

  function removePerson(index: number) {
    setPersonNames((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function changePersonKind(next: VisitorKind) {
    setPersonKind(next);
    if (next === "courier") setPersonNames((current) => [current[0] ?? ""]);
  }

  function changeVehicleKind(next: VehicleKind) {
    if (next === vehicleKind) return;
    setVehicleKind(next);
    setSavedVehiclesOpen(false);
    setDeliveryPickerOpen(false);
    setDeliveryQuery("");
    if (next === "guest") {
      setPlateKind("russian");
      setPlate("");
      setDirection("guest-parking");
      setDirectionOpen(false);
      setTimeLimited(false);
      setFrom("14:00");
      setTo("18:00");
      setAdditionalVehiclePlates([]);
      setActiveVehiclePlateIndex(0);
    } else if (next === "taxi") {
      setPlateKind("russian");
      setPlate(goConnected ? "С 777 СС 77" : "");
      setDay("today");
      setCustomDate(isoDateAtOffset(0));
      setCustomDateEnd("");
      setTimeLimited(false);
      setFrom("14:00");
      setTo("18:00");
      setDirection("territory");
      setDirectionOpen(false);
      setAdditionalVehiclePlates([]);
      setActiveVehiclePlateIndex(0);
    } else {
      setPlateKind("russian");
      setPlate("");
      setTimeLimited(false);
      setFrom("14:00");
      setTo("18:00");
      setDirection("territory");
      setDirectionOpen(false);
      setAdditionalVehiclePlates([]);
      setActiveVehiclePlateIndex(0);
    }
    setPlateTouched(false);
    setSubmitAttempted(false);
  }

  const activeRequest = viewRequest ?? request ?? defaultRequest(today, selectedPropertyId);
  const requestProperty = properties.find((item) => item.id === activeRequest.propertyId) ?? selectedProperty;
  const activeVehiclePlates = activeRequest.kind === "vehicle" ? requestPlateValues(activeRequest) : [];
  const baseRequestTitle = activeRequest.isQuick ? "Быстрый пропуск" : activeRequest.kind === "person" ? personLabels[activeRequest.subtype as VisitorKind] : vehicleLabels[activeRequest.subtype as VehicleKind];
  const requestTitle = baseRequestTitle;
  const isDeliveryRequest = activeRequest.kind === "vehicle" && activeRequest.subtype === "delivery";
  const needsVisitorCredential = activeRequest.kind === "person" || (activeRequest.kind === "vehicle" && ["guest", "delivery"].includes(activeRequest.subtype));
  const requestSubject = activeRequest.isQuick ? personLabels[activeRequest.subtype as VisitorKind] : activeRequest.kind === "person" ? activeRequest.personNames.length > 1 ? `${activeRequest.personNames[0]} и ещё ${activeRequest.personNames.length - 1}` : activeRequest.personNames[0] ?? "Посетитель" : isDeliveryRequest ? activeRequest.serviceName || "Сервис доставки" : activeVehiclePlates.length > 1 ? `${activeVehiclePlates[0]} и ещё ${activeVehiclePlates.length - 1}` : activeRequest.plate;
  const requestDirection = activeRequest.kind === "person" ? "Главный вход" : directionLabels[activeRequest.direction].title;
  const canSaveVehicle = activeRequest.kind === "vehicle" && activeRequest.subtype === "guest" && activeVehiclePlates.length === 1 && !userVehicles.some((vehicle) => vehicle.plateKind === activeRequest.plateKind && plateIdentity(vehicle.plate) === plateIdentity(activeRequest.plate));
  const entryPin = makeDemoPin(activeRequest);
  const credential = activeRequest.kind === "person" ? entryPin : isDeliveryRequest ? activeRequest.serviceName || "Сервис доставки" : activeRequest.plate;
  const credentialLabel = activeRequest.kind === "person" ? "PIN для домофона" : isDeliveryRequest ? "Сервис доставки" : "Госномер";
  const requestTime = activeRequest.isQuick ? "До конца дня" : activeRequest.timeLimited ? `${activeRequest.from}–${activeRequest.to}` : "Весь день";
  const accessQrToken = makeDemoAccessToken(activeRequest);

  function saveCurrentVehicle() {
    if (activeRequest.kind !== "vehicle" || activeVehiclePlates.length !== 1) return;
    setUserVehicles((current) => current.some((vehicle) => vehicle.plateKind === activeRequest.plateKind && plateIdentity(vehicle.plate) === plateIdentity(activeRequest.plate)) ? current : [...current, { label: "Недавно добавлена", plate: activeRequest.plate, plateKind: activeRequest.plateKind }]);
    setVehicleSaved(true);
  }
  const shareText = `${requestTitle}: ${requestProperty.fullAddress}. ${activeRequest.dateLabel}, ${requestTime}. ${requestDirection}. ${activeRequest.isQuick ? "Одно использование. " : ""}${credentialLabel}: ${credential}.${activeRequest.kind === "vehicle" && needsVisitorCredential ? ` PIN для прохода: ${entryPin}.` : ""} Если доступ не сработает, покажите эту карточку на посту охраны.`;

  async function writeClipboard(value: string) {
    try {
      if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(value); return true; }
    } catch { /* Use the local fallback below. */ }
    const field = document.createElement("textarea");
    field.value = value;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    const success = document.execCommand("copy");
    field.remove();
    return success;
  }

  async function buildAccessCardFile() {
    if (activeRequest.kind !== "person") return null;
    const qr = document.querySelector<SVGSVGElement>(".share-card .person-access-qr svg");
    if (!qr) return null;
    const qrCopy = qr.cloneNode(true) as SVGSVGElement;
    qrCopy.setAttribute("width", "512");
    qrCopy.setAttribute("height", "512");
    const qrUrl = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(qrCopy)], { type: "image/svg+xml;charset=utf-8" }));
    try {
      const qrImage = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("QR image could not be prepared"));
        image.src = qrUrl;
      });
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1350;
      const context = canvas.getContext("2d");
      if (!context) return null;
      context.fillStyle = "#1f1e20";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#ffffff";
      context.font = "700 58px Arial, sans-serif";
      context.fillText("Разовый пропуск", 72, 105);
      context.fillStyle = "#aaa9af";
      context.font = "32px Arial, sans-serif";
      context.fillText(requestProperty.fullAddress, 72, 165, 936);
      context.fillStyle = "#ffffff";
      context.fillRect(72, 230, 456, 456);
      context.drawImage(qrImage, 92, 250, 416, 416);
      context.fillStyle = "#aaa9af";
      context.font = "28px Arial, sans-serif";
      context.fillText("PIN", 590, 310);
      context.fillStyle = "#ffffff";
      context.font = "700 58px Arial, sans-serif";
      context.fillText(credential, 590, 385, 420);
      context.fillStyle = "#aaa9af";
      context.font = "28px Arial, sans-serif";
      context.fillText("Кто", 72, 800);
      context.fillText("Когда", 72, 920);
      context.fillText("Куда", 72, 1040);
      context.fillStyle = "#ffffff";
      context.font = "38px Arial, sans-serif";
      context.fillText(`${requestTitle} · ${requestSubject}`, 270, 800, 738);
      context.fillText(`${activeRequest.dateLabel}, ${requestTime}`, 270, 920, 738);
      context.fillText(requestDirection, 270, 1040, 738);
      context.fillStyle = "#aaa9af";
      context.font = "30px Arial, sans-serif";
      context.fillText("Покажите QR на входе или введите PIN", 72, 1240, 936);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png", 0.95));
      return blob ? new File([blob], "razovyi-propusk.png", { type: "image/png" }) : null;
    } finally {
      URL.revokeObjectURL(qrUrl);
    }
  }

  async function shareAccess() {
    if (navigator.share) {
      try {
        const cardFile = await buildAccessCardFile();
        const shareData: ShareData = { title: "Доступ", text: shareText };
        if (cardFile && navigator.canShare?.({ files: [cardFile] })) shareData.files = [cardFile];
        await navigator.share(shareData);
        return;
      } catch (error) { if (error instanceof DOMException && error.name === "AbortError") return; }
    }
    await copyAccess();
  }

  async function copyAccess() {
    setCopied(await writeClipboard(shareText));
  }

  async function copyPin() {
    const success = await writeClipboard(entryPin.replace(/\s/g, ""));
    setPinCopied(success);
    if (pinCopyTimerRef.current) window.clearTimeout(pinCopyTimerRef.current);
    if (success) pinCopyTimerRef.current = window.setTimeout(() => setPinCopied(false), 1800);
  }

  function makePassListItem(id: string, itemRequest: AccessRequest, status: RequestStatus): PassListItem {
    const baseTitle = itemRequest.isQuick ? "Быстрый" : itemRequest.kind === "person" ? personLabels[itemRequest.subtype as VisitorKind] : vehicleLabels[itemRequest.subtype as VehicleKind];
    const title = baseTitle;
    const itemIsDelivery = itemRequest.kind === "vehicle" && itemRequest.subtype === "delivery";
    const subject = itemRequest.isQuick ? personLabels[itemRequest.subtype as VisitorKind] : itemRequest.kind === "person" ? itemRequest.personNames.length > 1 ? `${itemRequest.personNames[0]} и ещё ${itemRequest.personNames.length - 1}` : itemRequest.personNames[0] ?? "Посетитель" : itemIsDelivery ? itemRequest.serviceName || "Сервис доставки" : itemRequest.plate;
    return {
      id,
      request: itemRequest,
      status,
      statusLabel: status === "ready" ? "Принят" : "На согласовании",
      title,
      subject,
      dateLabel: itemRequest.dateLabel,
      timeLabel: itemRequest.isQuick ? "До конца дня" : itemRequest.timeLimited ? `${itemRequest.from}–${itemRequest.to}` : "Весь день",
      directionLabel: itemRequest.kind === "person" ? "Главный вход" : directionLabels[itemRequest.direction].title,
      icon: itemRequest.kind === "person" ? "profile" : "car",
    };
  }

  function beginPassSwipe(event: React.PointerEvent<HTMLButtonElement>, id: string) {
    passSwipeStartXRef.current = event.clientX;
    passSwipeHandledRef.current = false;
    if (revealedPassId && revealedPassId !== id) setRevealedPassId(null);
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* Pointer capture is optional. */ }
  }

  function finishPassSwipe(event: React.PointerEvent<HTMLButtonElement>, id: string) {
    const start = passSwipeStartXRef.current;
    passSwipeStartXRef.current = null;
    if (start === null) return;
    const delta = event.clientX - start;
    if (Math.abs(delta) < 28) return;
    passSwipeHandledRef.current = true;
    window.setTimeout(() => { passSwipeHandledRef.current = false; }, 0);
    setRevealedPassId(delta < 0 ? id : null);
  }

  function cancelPassSwipe() {
    passSwipeStartXRef.current = null;
  }

  function openPassItem(item: PassListItem) {
    if (passSwipeHandledRef.current) { passSwipeHandledRef.current = false; return; }
    setLastDeletedPassId(null);
    setRevealedPassId(null);
    setSelectedPropertyId(item.request.propertyId);
    setViewRequest(item.request);
    setRequestStatus(item.status);
    jumpTo(item.status === "ready" ? "ready" : "pending");
  }

  function togglePassActions(id: string) {
    setRevealedPassId((current) => current === id ? null : id);
  }

  function repeatPassItem(item: PassListItem) {
    const itemRequest = item.request;
    setSelectedPropertyId(itemRequest.propertyId);
    if (itemRequest.isQuick) {
      setViewRequest(null);
      setRevealedPassId(null);
      setQuickPassOpen(true);
      return;
    }
    setViewRequest(null);
    setComment(itemRequest.comment);
    setCommentExpanded(Boolean(itemRequest.comment));
    setDay("today");
    setCustomDate(isoDateAtOffset(0));
    setCustomDateEnd("");
    setFrom(itemRequest.from || "14:00");
    setTo(itemRequest.to || "18:00");
    setVehicleSaved(false);
    setRevealedPassId(null);

    if (itemRequest.kind === "person") {
      setPersonKind(itemRequest.subtype as VisitorKind);
      setPersonNames([...itemRequest.personNames]);
      setTimeLimited(itemRequest.timeLimited);
      jumpTo("person-form");
      return;
    }

    const subtype = itemRequest.subtype as VehicleKind;
    const repeatedPlates = requestPlateValues(itemRequest);
    setVehicleKind(subtype);
    setPlateKind(subtype === "guest" ? itemRequest.plateKind : "russian");
    setPlate(repeatedPlates[0] ?? itemRequest.plate);
    setPlateTouched(false);
    setAdditionalVehiclePlates(subtype === "guest" ? repeatedPlates.slice(1).map((repeatedPlate) => ({ plate: repeatedPlate, plateKind: itemRequest.plateKind, touched: false })) : []);
    setActiveVehiclePlateIndex(0);
    setSavedVehiclesOpen(false);
    setDirection(itemRequest.direction);
    setDirectionOpen(false);
    setServiceName(itemRequest.serviceName);
    setDeliveryPickerOpen(false);
    setDeliveryQuery("");
    setTimeLimited(subtype !== "taxi" && itemRequest.timeLimited);
    jumpTo("vehicle-form");
  }

  function deletePassItem(id: string) {
    setHiddenPassIds((current) => current.includes(id) ? current : [...current, id]);
    setLastDeletedPassId(id);
    setRevealedPassId(null);
  }

  function undoPassDelete() {
    if (!lastDeletedPassId) return;
    setHiddenPassIds((current) => current.filter((id) => id !== lastDeletedPassId));
    setLastDeletedPassId(null);
  }

  const normalizedPassQuery = passQuery.trim().toLocaleLowerCase("ru");

  const renderHome = () => <section className="app-screen home-screen"><div className="home-reference-top"><StatusBar /><AddressHeader property={selectedProperty} onPropertyClick={openPropertySwitcher} /><div className="home-stories" aria-label="Истории"><article><img src="/story-insurance.png" alt="Страхование — не трогать" /></article></div><div className="home-ai-field" aria-label="Поле вопроса помощнику"><span className="home-ai-placeholder">Что с моей заявкой?</span><span aria-hidden="true"><Icon name="sparkle" size={23} /></span></div></div><div className="app-scroll home-scroll"><section className="home-services"><header><h1>Сервисы</h1><span><Icon name="edit" size={19} /></span></header><div className="service-shortcuts"><button type="button" onClick={openQuickPass}><span className="service-icon"><Icon name="bolt" /></span><strong>Быстрый<br />пропуск</strong><small>1 проход · сегодня</small></button><div><span className="service-icon"><Icon name="message" /></span><strong>Счета</strong><small>0 ₽</small></div><button type="button" onClick={() => jumpTo("passes")}><span className="service-icon"><Icon name="pass" /></span><strong>Пропуска</strong><small>1 доступ</small></button></div><div className="service-divider" /><div className="secondary-services"><article><span><Icon name="profile" size={21} /></span><strong>Должники</strong></article><article><span><Icon name="door" size={21} /></span><strong>Временный<br />пинкод</strong></article><article><span><Icon name="calendar" size={21} /></span><strong>Мероприятия</strong></article></div></section><section className="home-news"><header><h2>Лента новостей</h2><span><Icon name="bookmark" size={18} />0</span></header><div className="news-tabs"><strong>Все</strong><span>Новости</span><span>Опросы</span><span>Акции</span></div><article><small>Важное · сегодня, 10:30</small><h3>Калитка №2 временно закрыта</h3><p>Сегодня до 18:00 войти через калитку №2 не получится. Используйте центральную калитку со стороны Волгоградского проспекта.</p><div><Icon name="check" size={18} /><span>Центральная калитка работает</span></div><em>Управляющая компания</em></article></section></div><BottomNav active="home" onHome={() => jumpTo("home", true)} onHouse={() => jumpTo("house")} /></section>;

  const renderHouse = () => (
    <section className="app-screen home-screen">
      <div className="house-reference-top"><StatusBar /><AddressHeader property={selectedProperty} onPropertyClick={openPropertySwitcher} /></div>
      <div className="app-scroll house-scroll">
        <section className="house-billing-hero" aria-label="Счета по помещению">
          <span className="house-building-mark" aria-hidden="true"><Icon name="house" size={78} /></span>
          <p><Icon name="clock" size={18} />Нет счетов по помещению</p>
          <span className="house-billing-cta">Перейти в счета</span>
        </section>
        <section className="house-shortcuts" aria-label="Сервисы управляющей компании">
          <article><span className="house-shortcut-icon" aria-hidden="true">☷</span><div><strong>Оставить заявку</strong><small>В УК</small></div></article>
          <article><img src="/house-management-thumb.png" alt="" aria-hidden="true" /><div><strong>VK Hajime</strong><small>Лучшая УК</small></div></article>
        </section>
        <button className="house-photo-card house-passes-link" type="button" onClick={() => jumpTo("passes")}><img src="/house-passes-card.png" alt="Пропуска — мой и гостевые" /></button>
        <article className="house-photo-card"><img src="/house-people-card.png" alt="Люди — предоставление доступа к помещению" /></article>
        <article className="house-mini-card"><span>🏖</span><strong>Мини апп</strong><small>тут</small></article>
        <div className="house-card-grid"><article className="house-photo-card"><img src="/house-my-home-card.png" alt="Мой дом" /></article><article className="house-apartment-card"><span><Icon name="door" size={26} /></span><strong>Моя квартира</strong><small>Документы и данные о помещении</small></article></div>
        <div className="house-edit"><Icon name="edit" size={18} />Настроить виджеты</div>
      </div>
      <BottomNav active="house" onHome={() => jumpTo("home")} onHouse={() => jumpTo("house", true)} />
    </section>
  );

  const renderPasses = () => {
    const sourcePasses = request?.propertyId === selectedPropertyId
      ? [makePassListItem("current", request, requestStatus)]
      : [makePassListItem("vehicle-today", defaultRequest(today, selectedPropertyId), "ready"), makePassListItem("person-september", samplePersonRequest(selectedPropertyId), "ready")];
    const visiblePasses = sourcePasses.filter((item) => !hiddenPassIds.includes(item.id) && (!normalizedPassQuery || `${item.statusLabel} ${item.title} ${item.subject} ${item.dateLabel} ${item.directionLabel}`.toLocaleLowerCase("ru").includes(normalizedPassQuery)));

    return (
      <section className="app-screen passes-screen">
        <StackHeader title="Пропуска" property={selectedProperty} onPropertyClick={openPropertySwitcher} onBack={() => goBack("home")} />
        <div className="app-scroll passes-content">
          <button className="quick-pass-trigger" type="button" onClick={openQuickPass}><span><Icon name="bolt" size={22} /></span><div><strong>Быстрый пропуск</strong><small>Без ФИО · один проход · сегодня</small></div><Icon name="chevron-right" size={20} /></button>
          <div className="pass-action-grid"><article><span><Icon name="pass" size={23} /></span><strong>Заказать постоянный пропуск</strong></article><button type="button" onClick={() => startPersonForm()}><span><Icon name="person-plus" size={23} /></span><strong>Заказать разовый пропуск</strong></button><article><span><Icon name="profile" size={23} /></span><strong>Мой пропуск</strong></article></div>
          <label className="pass-search"><Icon name="search" size={19} /><input value={passQuery} onChange={(event) => setPassQuery(event.target.value)} placeholder="Поиск пропусков" aria-label="Поиск пропусков" /></label>
          <div className="pass-tabs" aria-label="Тип пропусков"><strong>Разовые</strong><span>Постоянные</span></div>
          <section className="pass-history" aria-label="История разовых пропусков">
            {visiblePasses.length ? visiblePasses.map((item) => (
              <div className={`pass-swipe-row ${revealedPassId === item.id ? "pass-actions-open" : ""}`} key={item.id}>
                <article className={`pass-card-shell ${item.status}`}>
                  <div className="pass-card-top">
                    <button className="pass-compact-card" type="button" aria-label={`Открыть пропуск: ${item.subject}`} onPointerDown={(event) => beginPassSwipe(event, item.id)} onPointerUp={(event) => finishPassSwipe(event, item.id)} onPointerCancel={cancelPassSwipe} onClick={() => openPassItem(item)}>
                      <span className="pass-record-icon"><Icon name={item.icon} size={21} /></span>
                      <div className="pass-compact-copy"><div className="pass-compact-topline"><b>{item.statusLabel}</b><em>{item.title}</em></div><strong>{item.subject}</strong><small><span>{item.dateLabel} · {item.timeLabel}</span><span>{item.directionLabel}</span></small></div>
                    </button>
                    {item.status === "ready" ? <button className="pass-actions-toggle" type="button" aria-label={`Действия с пропуском: ${item.subject}`} aria-expanded={revealedPassId === item.id} onClick={() => togglePassActions(item.id)}><Icon name="chevron-down" size={20} /></button> : <button className="pass-details-button" type="button" aria-label={`Открыть пропуск: ${item.subject}`} onClick={() => openPassItem(item)}><Icon name="chevron-right" size={20} /></button>}
                  </div>
                  {item.status === "ready" && revealedPassId === item.id ? <div className="pass-inline-actions"><button type="button" onClick={() => repeatPassItem(item)}><span aria-hidden="true">↻</span>Повторить</button><button className="pass-inline-delete" type="button" onClick={() => deletePassItem(item.id)}><Icon name="close" size={17} />Удалить</button></div> : null}
                </article>
              </div>
            )) : <div className="passes-empty"><Icon name="bookmark" size={28} /><strong>Ничего не найдено</strong><span>Проверьте имя или номер автомобиля</span></div>}
          </section>
          {lastDeletedPassId ? <div className="pass-undo-toast" role="status"><span>Пропуск удалён</span><button type="button" onClick={undoPassDelete}>Вернуть</button></div> : null}
        </div>
      </section>
    );
  };

  const renderPersonForm = () => (
    <form className="app-screen flow-screen compact-pass-form" onSubmit={(event) => { event.preventDefault(); submitPerson(); }}>
      <StackHeader title="Разовый пропуск" property={selectedProperty} onPropertyClick={openPropertySwitcher} compact onClose={() => jumpTo("passes", true)} />
      <div className="app-scroll form-content">
        <div className="form-mode-switch">
          <button type="button" className="choice-active" aria-pressed="true"><Icon name="person-plus" size={22} />Человек</button>
          <button type="button" aria-pressed="false" onClick={() => startVehicleForm(true)}><Icon name="car" size={22} />Автомобиль</button>
        </div>
        <section className="form-section person-section">
          <header className="form-question-header"><h1>Кто придёт?</h1></header>
          <div className="type-choice two">
            <button type="button" className={personKind === "guest" ? "choice-active" : ""} aria-pressed={personKind === "guest"} onClick={() => changePersonKind("guest")}>Гость</button>
            <button type="button" className={personKind === "courier" ? "choice-active" : ""} aria-pressed={personKind === "courier"} onClick={() => changePersonKind("courier")}>Курьер</button>
          </div>
          <div className="person-fields">
            {personNames.map((name, index) => {
              const invalid = submitAttempted && name.trim().length < 2;
              const fieldLabel = index === 0 ? "Посетитель" : `Посетитель ${index}`;
              return <div className={`person-entry visitor-field ${invalid ? "field-error" : ""}`} key={index}><div className="visitor-field-heading"><label htmlFor={`visitor-${index}`}>{fieldLabel}</label>{index === 0 && personKind === "guest" && personNames.length < 5 ? <button className="add-person-field" type="button" onClick={addPerson} aria-label="Добавить ещё человека"><span aria-hidden="true">+</span></button> : null}{index > 0 ? <button className="remove-person" type="button" onClick={() => removePerson(index)} aria-label={`Удалить посетителя ${index}`}><Icon name="close" size={16} /></button> : null}</div><input id={`visitor-${index}`} value={name} onChange={(event) => changePersonName(index, event.target.value)} placeholder={personKind === "courier" ? "ФИО курьера" : "ФИО посетителя"} autoComplete={index === 0 ? "name" : "off"} aria-invalid={invalid} />{invalid ? <small role="alert">{personError}</small> : null}</div>;
            })}
          </div>
          {personKind === "guest" ? <div className="recent-people" role="group" aria-label="Недавние посетители">{recentPeople.map((name) => <button type="button" key={name} onClick={() => chooseRecentPerson(name)}>{name}</button>)}</div> : null}
        </section>
        <DateTimeFields day={day} setDay={setDay} customDate={customDate} setCustomDate={setCustomDate} customDateEnd={customDateEnd} setCustomDateEnd={setCustomDateEnd} timeLimited={timeLimited} setTimeLimited={setTimeLimited} from={from} setFrom={setFrom} to={to} setTo={setTo} today={today} tomorrow={tomorrow} error={personTimeError} />
        <CommentField expanded={commentExpanded} setExpanded={setCommentExpanded} value={comment} setValue={setComment} placeholder="Например, позвонить в квартиру" />
      </div>
      <footer className="flow-footer form-submit-footer">{!personReady ? <small className="submit-hint" id="person-submit-hint" aria-live="polite">{personSubmitHint}</small> : null}<button className="primary-button" type="submit" disabled={!personReady} aria-describedby={!personReady ? "person-submit-hint" : undefined}>Заказать пропуск</button></footer>
    </form>
  );

  const renderVehicleForm = () => (
    <form className={`app-screen flow-screen compact-pass-form ${vehicleKind === "taxi" ? "taxi-pass-form" : ""}`} onSubmit={(event) => { event.preventDefault(); submitVehicle(); }}>
      <StackHeader title="Разовый пропуск" property={selectedProperty} onPropertyClick={openPropertySwitcher} compact onClose={() => jumpTo("passes", true)} />
      <div className="app-scroll form-content">
        <div className="form-mode-switch">
          <button type="button" aria-pressed="false" onClick={() => startPersonForm(true)}><Icon name="person-plus" size={22} />Человек</button>
          <button type="button" className="choice-active" aria-pressed="true"><Icon name="car" size={22} />Автомобиль</button>
        </div>
        <section className="form-section vehicle-section">
          <header className="form-question-header"><h1>Кто приедет?</h1></header>
          <div className="type-choice three">
            <button type="button" className={vehicleKind === "guest" ? "choice-active" : ""} aria-pressed={vehicleKind === "guest"} onClick={() => changeVehicleKind("guest")}>Гость</button>
            <button type="button" className={vehicleKind === "delivery" ? "choice-active" : ""} aria-pressed={vehicleKind === "delivery"} onClick={() => changeVehicleKind("delivery")}>Доставка</button>
            <button type="button" className={vehicleKind === "taxi" ? "choice-active" : ""} aria-pressed={vehicleKind === "taxi"} onClick={() => changeVehicleKind("taxi")}>Такси</button>
          </div>
          {vehicleKind === "taxi" ? <article className={`taxi-go-banner ${goConnected ? "taxi-go-connected" : ""}`}><span aria-hidden="true">{goConnected ? <Icon name="check" size={20} /> : "Go"}</span><div><strong>{goConnected ? "Передача из Яндекс Go разрешена" : "Разрешить данные Яндекс Go"}</strong><small>{goConnected ? "Номер подставлен из активной поездки." : "Номер активной поездки подставится автоматически."}</small></div>{!goConnected ? <button type="button" onClick={connectYandexGo}>Разрешить</button> : null}</article> : null}
          {vehicleKind === "delivery" ? <div className={`delivery-service-field ${serviceError ? "field-error" : ""}`}><span>Откуда доставка?</span><div className="delivery-service-shortcuts" role="group" aria-label="Недавние сервисы доставки">{recentDeliveryServices.map((service) => <button type="button" key={service} className={serviceName === service ? "choice-active" : ""} aria-pressed={serviceName === service} onClick={() => selectDeliveryService(service)}>{service}</button>)}<button type="button" className={serviceName && !recentDeliveryServices.includes(serviceName) ? "choice-active" : ""} aria-expanded={deliveryPickerOpen} onClick={() => setDeliveryPickerOpen(!deliveryPickerOpen)}>{serviceName && !recentDeliveryServices.includes(serviceName) ? serviceName : "Другой"}</button></div>{deliveryPickerOpen ? <div className="delivery-service-picker"><label><Icon name="search" size={18} /><input value={deliveryQuery} onChange={(event) => setDeliveryQuery(event.target.value)} placeholder="Найти сервис" /></label><div>{filteredDeliveryServices.length ? filteredDeliveryServices.map((service) => <button type="button" key={service} className={serviceName === service ? "delivery-service-selected" : ""} onClick={() => selectDeliveryService(service)}><span>{service.slice(0, 1)}</span><strong>{service}</strong>{serviceName === service ? <Icon name="check" size={18} /> : null}</button>) : <small>Ничего не найдено</small>}</div></div> : null}{serviceError ? <small className="form-error" role="alert">{serviceError}</small> : null}</div> : null}
          {vehicleKind === "delivery" && serviceName.startsWith("Яндекс ") ? <article className={`taxi-go-banner delivery-yandex-banner ${servicesConnected ? "taxi-go-connected" : ""}`}><span aria-hidden="true">{servicesConnected ? <Icon name="check" size={20} /> : "Я"}</span><div><strong>{servicesConnected ? "Передача данных разрешена" : "Разрешить передачу данных"}</strong><small>{servicesConnected ? "Следующие пропуска создадутся автоматически." : `${serviceName} передаст данные заказа для автоматического пропуска.`}</small></div>{!servicesConnected ? <button type="button" onClick={() => setServicesConnected(true)}>Разрешить</button> : null}</article> : null}
          {vehicleKind !== "delivery" ? <div className="vehicle-field-group">
            <div className="vehicle-field-heading"><label htmlFor="vehicle-plate">{vehicleKind === "guest" ? "Госномер" : "Госномер РФ"}</label>{vehicleKind === "guest" ? <div className="vehicle-heading-actions"><button className="my-vehicles-trigger" type="button" aria-expanded={savedVehiclesOpen} onClick={() => setSavedVehiclesOpen(!savedVehiclesOpen)}><Icon name="car" size={16} /><span>Мои авто</span><Icon name={savedVehiclesOpen ? "chevron-down" : "chevron-right"} size={15} /></button><button className="add-vehicle-field" type="button" onClick={addVehiclePlate} disabled={additionalVehiclePlates.length >= 4} aria-label="Добавить ещё автомобиль"><span aria-hidden="true">+</span></button></div> : null}</div>
            {vehicleKind === "guest" && savedVehiclesOpen ? <div className="saved-vehicles"><div className="saved-vehicle-strip">{userVehicles.map((vehicle) => { const selected = activeVehiclePlateKind === vehicle.plateKind && plateIdentity(activeVehiclePlate) === plateIdentity(vehicle.plate); return <button type="button" key={`${vehicle.plateKind}-${plateIdentity(vehicle.plate)}`} className={selected ? "saved-vehicle-active" : ""} aria-pressed={selected} onClick={() => chooseSavedVehicle(vehicle)}><strong>{vehicle.plate}</strong><small>{vehicle.label}</small></button>; })}</div></div> : null}
            <div className="manual-plate-entry">
              <div className={`plate-field ${plateError ? "field-error" : ""}`}><div className="plate-input-row"><input id="vehicle-plate" value={plate} onFocus={() => setActiveVehiclePlateIndex(0)} onChange={(event) => setPlate(plateKind === "russian" ? normalizeRussianPlate(event.target.value) : normalizeForeignPlate(event.target.value))} onBlur={() => setPlateTouched(true)} placeholder={plateKind === "russian" ? "А 123 АА 77" : "ABC 1234"} aria-invalid={Boolean(plateError)} />{vehicleKind === "guest" ? <button className="plate-country-toggle" type="button" aria-label={plateKind === "russian" ? "Переключить на иностранный номер" : "Переключить на российский номер"} title={plateKind === "russian" ? "Россия — изменить тип номера" : "Иностранный номер — изменить тип"} onClick={() => switchPlateKind(plateKind === "russian" ? "foreign" : "russian")}>{plateKind === "russian" ? <span className="russia-flag" aria-hidden="true" /> : <Icon name="globe" size={19} />}<strong>{plateKind === "russian" ? "RUS" : "INT"}</strong></button> : null}</div>{plateError ? <small role="alert">{plateError}</small> : <small>{plateKind === "russian" ? "Кириллица и регион" : "Латиница и цифры"}</small>}</div>
              {vehicleKind === "guest" ? <div className="additional-vehicle-list">{additionalVehiclePlates.map((field, index) => { const fieldInvalid = (field.touched || submitAttempted) && !plateIsValid(field.plate, field.plateKind); const fieldError = !fieldInvalid ? "" : field.plate.trim() ? field.plateKind === "russian" ? "Проверьте формат: А 123 АА 77" : "Используйте латиницу и цифры" : "Введите номер"; return <div className={`additional-vehicle-entry ${fieldError ? "field-error" : ""}`} key={index}><div className="additional-vehicle-heading"><label htmlFor={`vehicle-plate-${index + 2}`}>Автомобиль {index + 2}</label><button type="button" onClick={() => removeVehiclePlate(index)} aria-label={`Удалить автомобиль ${index + 2}`}><Icon name="close" size={15} /></button></div><div className="plate-input-row"><input id={`vehicle-plate-${index + 2}`} value={field.plate} onFocus={() => setActiveVehiclePlateIndex(index + 1)} onChange={(event) => changeAdditionalVehiclePlate(index, event.target.value)} onBlur={() => setAdditionalVehiclePlates((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, touched: true } : item))} placeholder={field.plateKind === "russian" ? "А 123 АА 77" : "ABC 1234"} aria-invalid={Boolean(fieldError)} /> <button className="plate-country-toggle" type="button" aria-label={field.plateKind === "russian" ? "Переключить на иностранный номер" : "Переключить на российский номер"} onClick={() => switchAdditionalPlateKind(index)}>{field.plateKind === "russian" ? <span className="russia-flag" aria-hidden="true" /> : <Icon name="globe" size={19} />}<strong>{field.plateKind === "russian" ? "RUS" : "INT"}</strong></button></div><small role={fieldError ? "alert" : undefined}>{fieldError || (field.plateKind === "russian" ? "Кириллица и регион" : "Латиница и цифры")}</small></div>; })}</div> : null}
              {vehicleKind === "guest" ? <div className="recent-plates" role="group" aria-label="Недавние номера">{recentPlates.map((recentPlate) => <button type="button" key={recentPlate} className={activeVehiclePlateKind === "russian" && plateIdentity(activeVehiclePlate) === plateIdentity(recentPlate) ? "choice-active" : ""} aria-pressed={activeVehiclePlateKind === "russian" && plateIdentity(activeVehiclePlate) === plateIdentity(recentPlate)} onClick={() => chooseRecentPlate(recentPlate)}>{recentPlate}</button>)}</div> : null}
            </div>
          </div> : null}
          {vehicleKind === "guest" ? <div className="vehicle-direction"><button className="direction-summary" type="button" aria-expanded={directionOpen} onClick={() => setDirectionOpen(!directionOpen)}><span><Icon name={direction === "territory" ? "shield-check" : "parking"} size={20} /></span><div><small>Парковка</small><strong>{directionLabels[direction].title}</strong></div><em>{directionOpen ? "Скрыть" : "Изменить"}</em><Icon name={directionOpen ? "chevron-down" : "chevron-right"} size={18} /></button>{directionOpen ? <div className="direction-choice">{(Object.keys(directionLabels) as Direction[]).filter((item) => additionalVehiclePlates.length === 0 || item !== "own-place").map((item) => <button key={item} type="button" className={direction === item ? "choice-active" : ""} aria-pressed={direction === item} onClick={() => { setDirection(item); setDirectionOpen(false); }}><span><Icon name={item === "territory" ? "shield-check" : "parking"} size={20} /></span><div><strong>{directionLabels[item].title}</strong><small>{directionLabels[item].detail}</small></div></button>)}</div> : null}</div> : null}
        </section>
        {vehicleKind !== "taxi" ? <DateTimeFields day={day} setDay={setDay} customDate={customDate} setCustomDate={setCustomDate} customDateEnd={customDateEnd} setCustomDateEnd={setCustomDateEnd} timeLimited={timeLimited} setTimeLimited={setTimeLimited} from={from} setFrom={setFrom} to={to} setTo={setTo} today={today} tomorrow={tomorrow} error={vehicleTimeError} /> : null}
        <CommentField expanded={commentExpanded} setExpanded={setCommentExpanded} value={comment} setValue={setComment} placeholder={vehicleKind === "delivery" ? "Например, разгрузка у второго подъезда" : "Что важно знать охране"} />
      </div>
      <footer className="flow-footer form-submit-footer">{!vehicleReady ? <small className="submit-hint" id="vehicle-submit-hint" aria-live="polite">{vehicleSubmitHint}</small> : null}<button className="primary-button" type="submit" disabled={!vehicleReady} aria-describedby={!vehicleReady ? "vehicle-submit-hint" : undefined}>Заказать пропуск</button></footer>
    </form>
  );

  const renderPending = () => (
    <section className="app-screen flow-screen pending-screen">
      <StackHeader title="Разовый пропуск" property={requestProperty} compact onClose={() => jumpTo("passes", true)} />
      <div className="app-scroll status-content">
        <header className="pending-hero"><span className="status-icon pending"><Icon name="clock" size={22} /></span><div><small className="status-label">На согласовании</small><h1>{activeRequest.kind === "person" ? "Пока нельзя проходить" : "Пока нельзя въезжать"}</h1></div></header>
        <p className="pending-note">УК прочитает комментарий и подтвердит пропуск. Сообщим, когда решение будет готово.</p>
        <article className="request-summary"><strong>{requestTitle} · {requestSubject}</strong><span>{activeRequest.dateLabel}, {requestTime}</span><span>{requestDirection}</span>{activeRequest.comment ? <span className="request-comment"><small>Комментарий для УК</small>{activeRequest.comment}</span> : null}</article>
      </div>
      <footer className="flow-footer stacked pending-footer"><button className="secondary-button" type="button" onClick={openReady}>Проверить статус</button><button className="quiet-button" type="button" onClick={() => jumpTo("passes", true)}>К разовым пропускам</button></footer>
    </section>
  );

  const renderReady = () => (
    <section className="app-screen flow-screen ready-screen">
      <StackHeader title={activeRequest.isQuick ? "Быстрый пропуск" : "Разовый пропуск"} property={requestProperty} compact onClose={() => jumpTo("passes", true)} />
      <div className="app-scroll ready-content">
        <header className="ready-hero"><span className="status-icon ready"><Icon name="check" size={22} /></span><div><small className="status-label ready-label">Готов</small><h1>{activeRequest.kind === "person" ? "Можно проходить" : "Можно въезжать"}</h1></div></header>
        {activeRequest.kind === "person" ? <PersonAccessCredential pin={entryPin} token={accessQrToken} copied={pinCopied} onCopy={copyPin} compact /> : <div className="vehicle-access-credentials"><section className="credential-card"><span>{activeVehiclePlates.length > 1 ? "Для въезда · Госномера" : `Для въезда · ${credentialLabel}`}</span>{activeVehiclePlates.length > 1 ? <div className="credential-plate-list">{activeVehiclePlates.map((requestPlate) => <strong key={requestPlate}>{requestPlate}</strong>)}</div> : <strong>{credential}</strong>}<small>{requestDirection}</small></section>{needsVisitorCredential ? <PersonAccessCredential pin={entryPin} token={accessQrToken} copied={pinCopied} onCopy={copyPin} compact label="Для прохода · QR или PIN" /> : null}</div>}
        <dl className="ready-details"><div><dt>Кто</dt><dd>{requestTitle} · {requestSubject}</dd></div><div><dt>Когда</dt><dd>{activeRequest.dateLabel}, {requestTime}</dd></div><div><dt>Куда</dt><dd>{requestDirection}</dd></div>{activeRequest.isQuick ? <div className="quick-pass-validity"><dt>Доступ</dt><dd>Одно использование</dd></div> : null}</dl>
        <div className="ready-next-actions">
          {canSaveVehicle || (vehicleSaved && activeRequest.kind === "vehicle" && activeRequest.subtype === "guest") ? <article className={`save-vehicle-card ${vehicleSaved ? "action-complete" : ""}`}><span><Icon name={vehicleSaved ? "check" : "car"} size={22} /></span><div><strong>{vehicleSaved ? "Автомобиль добавлен" : "Добавить в «Мой транспорт»"}</strong><small>{vehicleSaved ? "Он появится среди быстрых вариантов." : `${activeRequest.plate} — не придётся вводить снова.`}</small></div>{!vehicleSaved ? <button type="button" onClick={saveCurrentVehicle}>Добавить</button> : null}</article> : null}
          <article className={`yandex-integration-card ${servicesConnected ? "action-complete" : ""}`}><span aria-hidden="true">{servicesConnected ? <Icon name="check" size={22} /> : "Я"}</span><div><strong>{servicesConnected ? "Передача данных разрешена" : "Разрешить данные сервисов"}</strong><small>{servicesConnected ? "Для следующих заказов пропуск создастся к приезду." : "Такси, Еда, Лавка и Маркет смогут передавать данные заказа."}</small></div>{!servicesConnected ? <button type="button" onClick={() => setServicesConnected(true)}>Разрешить</button> : null}</article>
        </div>
      </div>
      <footer className="flow-footer stacked ready-footer"><button className="primary-button" type="button" onClick={() => jumpTo("share")}><Icon name="share" size={20} />Передать посетителю</button><button className="quiet-button" type="button" onClick={() => jumpTo("passes", true)}>К разовым пропускам</button></footer>
    </section>
  );

  const renderShare = () => (
    <section className="app-screen flow-screen share-screen">
      <StackHeader title="Передать доступ" property={requestProperty} compact onBack={() => activeRequest.isQuick ? jumpTo("passes", true) : goBack("ready")} onClose={() => jumpTo("passes", true)} />
      <div className="app-scroll share-content">
        <header className="share-hero"><h1>{activeRequest.kind === "person" ? "Доступ для посетителя" : "Данные для въезда"}</h1><p>{activeRequest.isQuick ? "Отправьте QR или PIN — доступ сработает один раз до конца дня." : activeRequest.kind === "person" ? "Отправьте QR или PIN — этого достаточно для прохода." : activeVehiclePlates.length > 1 ? "Отправьте номера автомобилей и время действия пропуска." : "Отправьте номер автомобиля и время действия пропуска."}</p></header>
        <article className="share-card">
          {activeRequest.kind === "person" ? <PersonAccessCredential pin={entryPin} token={accessQrToken} copied={pinCopied} onCopy={copyPin} compact /> : <div className="vehicle-access-credentials"><div className="share-credential"><span>{activeVehiclePlates.length > 1 ? "Для въезда · Госномера" : `Для въезда · ${credentialLabel}`}</span>{activeVehiclePlates.length > 1 ? <div className="credential-plate-list">{activeVehiclePlates.map((requestPlate) => <strong key={requestPlate}>{requestPlate}</strong>)}</div> : <strong>{credential}</strong>}</div>{needsVisitorCredential ? <PersonAccessCredential pin={entryPin} token={accessQrToken} copied={pinCopied} onCopy={copyPin} compact label="Для прохода · QR или PIN" /> : null}</div>}
          <dl><div><dt>Кто</dt><dd>{requestTitle} · {requestSubject}</dd></div><div><dt>Когда</dt><dd>{activeRequest.dateLabel}, {requestTime}</dd></div>{activeRequest.isQuick ? <div><dt>Доступ</dt><dd>Одно использование</dd></div> : null}<div><dt>Куда</dt><dd>{requestDirection}</dd></div></dl>
          <p className="share-help">Если доступ не сработает — покажите эту карточку охране.</p>
        </article>
      </div>
      <footer className="flow-footer stacked share-footer"><button className="primary-button" type="button" onClick={shareAccess}><Icon name="share" size={20} />Отправить доступ</button><button className="secondary-button" type="button" onClick={copyAccess}><Icon name="copy" size={19} />{copied ? "Скопировано" : "Скопировать"}</button></footer>
    </section>
  );

  const screens: Record<Screen, () => React.ReactNode> = { home: renderHome, house: renderHouse, passes: renderPasses, "person-form": renderPersonForm, "vehicle-form": renderVehicleForm, pending: renderPending, ready: renderReady, share: renderShare };
  const baseGuide = screenGuides[screen];
  const guide = screen === "vehicle-form" ? { ...baseGuide, references: vehicleReferenceSets[vehicleKind] } : baseGuide;

  return (
    <main className="demo-root">
      <header className="demo-header"><div><small>Интерактивный прототип</small><strong>Разовый пропуск</strong></div><nav aria-label="Экраны сценария">{guideScreens.map((item) => <button key={item} type="button" className={screen === item ? "demo-nav-active" : ""} aria-current={screen === item ? "step" : undefined} onClick={() => jumpFromGuide(item)}>{screenGuides[item].navLabel}</button>)}</nav></header>
      <section className="demo-stage">
        <aside className="reference-panel"><span className="stage-label">Текущий экран</span><div className={`reference-list ${guide.references.length > 1 ? `reference-list-multiple reference-count-${guide.references.length}` : ""}`}>{guide.references.length ? guide.references.map((reference) => <figure key={reference.src}><a href={reference.src} target="_blank" rel="noreferrer" aria-label={`${reference.caption}: открыть крупно`}><img src={reference.src} alt={reference.alt} /></a><figcaption>{reference.caption}</figcaption></figure>) : <div className="no-current-reference"><strong>Такого экрана сейчас нет</strong><span>Текущий сценарий заканчивается до передачи инструкции посетителю.</span></div>}</div></aside>
        <div className="proposal-column">
          <span className="stage-label">Предлагаемое решение</span>
          <div className="device-frame">
            <div className="app-root">
              <div className="screen-route" ref={routeRef} tabIndex={-1}>{screens[screen]()}</div>
              {propertySwitcherOpen ? <div className="property-switcher-backdrop"><section className="property-switcher-dialog" role="dialog" aria-modal="true" aria-labelledby="property-switcher-title"><button className="sheet-close" type="button" onClick={() => setPropertySwitcherOpen(false)} aria-label="Закрыть выбор квартиры"><Icon name="close" size={18} /></button><h2 id="property-switcher-title">Выберите квартиру</h2><p>Она станет адресом для нового пропуска.</p><div className="property-chip-strip">{properties.map((item) => <button type="button" key={item.id} className={item.id === selectedPropertyId ? "property-chip-active" : ""} aria-pressed={item.id === selectedPropertyId} onClick={() => chooseProperty(item.id)}><strong>{item.label}</strong><small>{item.address}</small>{item.id === selectedPropertyId ? <Icon name="check" size={18} /> : null}</button>)}</div></section></div> : null}
              {quickPassOpen ? <div className="quick-pass-backdrop"><section className="quick-pass-dialog" role="dialog" aria-modal="true" aria-labelledby="quick-pass-title"><button className="sheet-close" type="button" onClick={() => setQuickPassOpen(false)} aria-label="Закрыть быстрый пропуск"><Icon name="close" size={18} /></button><span className="quick-pass-dialog-icon"><Icon name="bolt" size={24} /></span><h2 id="quick-pass-title">Оформить быстрый пропуск</h2><p>Действует сегодня до конца дня и сработает один раз. ФИО и время не нужны.</p><div className="quick-pass-kinds"><button type="button" onClick={() => createQuickPass("guest")}><span><Icon name="person-plus" size={22} /></span><div><strong>Гостю</strong><small>Сразу показать QR и PIN</small></div><Icon name="chevron-right" size={20} /></button><button type="button" onClick={() => createQuickPass("courier")}><span><Icon name="door" size={22} /></span><div><strong>Курьеру</strong><small>Сразу показать QR и PIN</small></div><Icon name="chevron-right" size={20} /></button></div></section></div> : null}
              {approvalRequest ? <div className="approval-warning-backdrop"><section className="approval-warning-dialog" ref={approvalDialogRef} role="alertdialog" aria-modal="true" aria-labelledby="approval-warning-title" aria-describedby="approval-warning-copy" tabIndex={-1}><button className="approval-warning-close" type="button" onClick={() => setApprovalRequest(null)} aria-label="Вернуться к заявке"><Icon name="close" size={18} /></button><span className="approval-warning-icon"><Icon name="clock" size={24} /></span><h2 id="approval-warning-title">Нужно согласование УК</h2><p id="approval-warning-copy">УК прочитает комментарий, чтобы учесть особые условия. Пропуск станет активен после подтверждения; без комментария он создаётся сразу.</p><div><button className="primary-button" type="button" onClick={confirmCommentApproval}>Отправить на согласование</button><button className="secondary-button" type="button" onClick={submitWithoutComment}>Создать без комментария</button></div></section></div> : null}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
