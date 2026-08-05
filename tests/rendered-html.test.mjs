import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
}

function section(source, start, end) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  assert.notEqual(startIndex, -1, `Missing section start: ${start}`);
  assert.notEqual(endIndex, -1, `Missing section end: ${end}`);
  return source.slice(startIndex, endIndex);
}

test("renders the reference-based home without an explanatory comparison panel", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();

  for (const text of ["Текущий экран", "Предлагаемое решение", "20:49", "Что с моей заявкой", "Разовый", "Пропуска", "Калитка №2 временно закрыта"]) assert.match(html, new RegExp(text));
  for (const text of ["Сравнение с текущим экраном", "Что изменилось", "Цель"]) assert.doesNotMatch(html, new RegExp(text));
  assert.match(html, /Текущая главная/);
  assert.doesNotMatch(html, /Следующий этап|экосистема|MVP|Порядок решений|Ответ на вопросы/i);
  assert.doesNotMatch(html, /codex-preview|Building your site|taking shape/i);
});

test("source keeps every pass entry, the one-time hub and the complete flow", async () => {
  const [page, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(page, /<select\b|Ситуация|native-select|renderChoose|"choose"/i);
  assert.doesNotMatch(page, /Следующий этап|экосистема|MVP|Порядок решений/i);

  const home = section(page, "const renderHome", "const renderHouse");
  assert.equal((home.match(/<button\b/g) ?? []).length, 2);
  assert.match(home, /onClick=\{openQuickPass\}/);
  assert.match(home, /onClick=\{\(\) => jumpTo\("passes"\)\}/);
  assert.match(home, /Быстрый<br \/>пропуск/);
  assert.match(home, /1 проход · сегодня/);
  assert.match(home, /<strong>Пропуска<\/strong>/);
  assert.match(home, /<StatusBar/);
  assert.match(home, /story-insurance\.png/);
  assert.match(home, /home-ai-field/);
  assert.match(home, /Поле вопроса помощнику/);
  assert.doesNotMatch(home, /home-ai-field[^>]*><input/);

  const house = section(page, "const renderHouse", "const renderPasses");
  assert.match(house, /house-passes-link/);
  assert.match(house, /house-passes-card\.png/);
  assert.match(house, /house-billing-hero/);
  assert.match(house, /Нет счетов по помещению/);
  assert.match(house, /Оставить заявку/);
  assert.match(house, /VK Hajime/);
  assert.match(house, /jumpTo\("passes"\)/);

  const passes = section(page, "const renderPasses", "const renderPersonForm");
  for (const text of ["Быстрый пропуск", "Без ФИО · один проход · сегодня", "Заказать постоянный пропуск", "Заказать разовый пропуск", "Мой пропуск", "Поиск пропусков", "Разовые", "Постоянные", "Повторить", "Удалить", "Вернуть"]) assert.match(passes, new RegExp(text));
  assert.match(passes, /openQuickPass/);
  for (const text of ["На согласовании", "Принят"]) assert.match(page, new RegExp(text));
  assert.match(passes, /requestStatus/);
  assert.match(passes, /passQuery/);
  assert.match(passes, /visiblePasses\.map/);
  assert.match(passes, /pass-swipe-row/);
  assert.match(passes, /pass-compact-card/);
  assert.match(passes, /beginPassSwipe/);
  assert.match(passes, /finishPassSwipe/);
  assert.match(passes, /togglePassActions/);
  assert.match(passes, /repeatPassItem/);
  assert.match(passes, /deletePassItem/);
  assert.match(passes, /undoPassDelete/);
  assert.match(page, /samplePersonRequest/);
  assert.doesNotMatch(passes, /•••|passExpanded|pass-card-details|pass-card-main/);

  const person = section(page, "const renderPersonForm", "const renderVehicleForm");
  for (const text of ["Человек", "Автомобиль", "Гость", "Курьер", "Посетитель", "Недавние", "Добавить ещё человека", "Заказать пропуск"]) assert.match(person, new RegExp(text));
  assert.doesNotMatch(person, /Мастер/);
  assert.match(person, /personNames\.map/);
  assert.match(person, /compact-pass-form/);
  assert.match(person, /<StackHeader title="Разовый пропуск"[^\n]+compact/);
  assert.match(person, /aria-label="Недавние посетители"/);
  assert.match(person, /personKind === "guest" \? <div className="recent-people"/);
  assert.match(person, /visitor-field-heading/);
  assert.match(person, /form-question-header/);
  assert.match(person, /add-person-field/);
  assert.match(person, /`Посетитель \$\{index\}`/);
  assert.match(person, /disabled=\{!personReady\}/);
  assert.match(person, /personSubmitHint/);
  assert.match(person, /CommentField/);
  assert.match(person, /DateTimeFields/);
  assert.match(person, /ФИО курьера/);
  assert.doesNotMatch(person, /Имя курьера/);
  assert.match(person, /ФИО посетителя/);
  assert.doesNotMatch(person, /Фамилия Имя Отчество/);
  assert.match(page, /Сейчас пропуск будет до конца дня/);
  assert.doesNotMatch(page, /Иначе пропуск действует весь день/);
  assert.match(page, /Комментарий, потребуется согласование УК/);
  assert.doesNotMatch(page, /Комментарий · необязательно/);
  assert.doesNotMatch(page, /<strong>Дополнительно<\/strong>/);

  const vehicle = section(page, "const renderVehicleForm", "const renderPending");
  for (const text of ["Гость", "Доставка", "Такси", "Россия", "Иностранный", "Мои авто", "Недавние", "Откуда доставка"]) assert.match(vehicle, new RegExp(text));
  for (const text of ["Яндекс Еда", "Яндекс Лавка", "Яндекс Маркет"]) assert.match(page, new RegExp(text));
  assert.doesNotMatch(vehicle, /Марка · необязательно|Тип авто|vehicle-type/);
  assert.match(vehicle, /CommentField/);
  assert.match(vehicle, /form-question-header/);
  assert.match(vehicle, /disabled=\{!vehicleReady\}/);
  assert.match(vehicle, /vehicleSubmitHint/);
  for (const text of ["Территория", "Гостевая парковка", "Моё место"]) assert.match(page, new RegExp(text));
  assert.match(vehicle, /onBlur=\{\(\) => setPlateTouched\(true\)\}/);
  assert.match(vehicle, /recentPlates/);
  assert.match(vehicle, /Недавние номера/);
  assert.match(vehicle, /chooseRecentPlate/);
  assert.match(vehicle, /addVehiclePlate/);
  assert.match(vehicle, /additionalVehiclePlates\.map/);
  assert.match(vehicle, /Добавить ещё автомобиль/);
  assert.match(vehicle, /Автомобиль \{index \+ 2\}/);
  assert.match(vehicle, /item !== "own-place"/);
  assert.match(page, /Если есть места/);
  assert.doesNotMatch(page, /Место назначит охрана/);
  assert.match(vehicle, /userVehicles\.map/);
  assert.match(vehicle, /saved-vehicle-strip/);
  assert.match(vehicle, /savedVehiclesOpen/);
  assert.match(vehicle, /aria-expanded=\{savedVehiclesOpen\}/);
  assert.match(vehicle, /className="manual-plate-entry"/);
  assert.doesNotMatch(vehicle, /Другой номер|manualPlateEntry/);
  assert.match(vehicle, /vehicle-direction/);
  assert.match(vehicle, /direction-summary/);
  assert.match(vehicle, /Парковка/);
  assert.match(vehicle, /directionOpen/);
  assert.match(vehicle, /vehicleKind === "guest" \? <div className="vehicle-direction"/);
  assert.match(vehicle, /recentDeliveryServices\.map/);
  assert.match(vehicle, /delivery-service-picker/);
  assert.match(vehicle, /filteredDeliveryServices/);
  assert.match(vehicle, /Разрешить данные Яндекс Go/);
  assert.match(vehicle, /connectYandexGo/);
  assert.match(vehicle, /Номер активной поездки подставится автоматически/);
  assert.match(vehicle, /serviceName\.startsWith\("Яндекс "\)/);
  assert.match(vehicle, /delivery-yandex-banner/);
  assert.match(vehicle, /Разрешить передачу данных/);
  assert.doesNotMatch(vehicle, /Подключить Яндекс Go|Подключить сервисы Яндекса/);
  assert.doesNotMatch(vehicle, /plate-kind-switch/);
  assert.match(vehicle, /plate-country-toggle/);
  assert.match(vehicle, /vehicle-field-heading"><label htmlFor="vehicle-plate">/);
  assert.doesNotMatch(vehicle, /vehicle-field-heading"><h2>Номер/);
  assert.match(vehicle, /Переключить на иностранный номер/);
  assert.match(vehicle, /Icon name="globe"/);
  assert.doesNotMatch(vehicle, /Номер не знаю|plate-unknown-toggle|toggleUnknownPlate|plateOptional/);
  assert.match(vehicle, /vehicleKind !== "delivery" \? <div className="vehicle-field-group"/);
  assert.match(vehicle, /Госномер РФ/);
  assert.match(vehicle, /vehicleKind !== "taxi" \? <DateTimeFields/);
  assert.match(vehicle, /vehicleKind === "taxi" \? "taxi-pass-form"/);
  assert.doesNotMatch(vehicle, /Время прибытия|arrivalRequired/);
  assert.match(vehicle, /startPersonForm\(true\)/);
  assert.match(page, /if \(next === vehicleKind\) return/);
  assert.match(page, /setDay\("today"\)/);
  assert.match(page, /effectivePlateValid/);
  assert.doesNotMatch(page, /Номер пока неизвестен/);
  assert.match(page, /isDeliveryRequest \? activeRequest\.serviceName/);

  const submission = section(page, "function submitPerson", "function openReady");
  assert.equal((submission.match(/submitAccessRequest\(/g) ?? []).length, 3);
  assert.match(submission, /if \(nextRequest\.comment\)/);
  assert.match(submission, /setApprovalRequest\(nextRequest\)/);
  assert.match(submission, /finishSubmission\(nextRequest, "ready"\)/);
  assert.match(submission, /finishSubmission\(nextRequest, "ready", "share"\)/);
  assert.match(submission, /finishSubmission\(approvalRequest, "pending"\)/);
  assert.match(submission, /function submitWithoutComment/);
  assert.match(submission, /finishSubmission\(\{ \.\.\.approvalRequest, comment: "" \}, "ready"\)/);
  assert.match(page, /approvalDemoRequest/);
  assert.match(page, /approval-warning-dialog/);
  for (const text of ["Нужно согласование УК", "УК прочитает комментарий", "без комментария он создаётся сразу", "Отправить на согласование", "Создать без комментария", "Вернуться к заявке"]) assert.match(page, new RegExp(text));

  const dateFields = section(page, "function DateTimeFields", "function CommentField");
  for (const text of ["Сегодня", "Завтра", "Другая дата", "{today}", "{tomorrow}", "Выбрать"]) assert.match(dateFields, new RegExp(text));
  assert.match(dateFields, /`С \$\{formatIsoDate\(draftStart\)\} по \$\{formatIsoDate\(draftEnd\)\}`/);
  for (const text of ["Утро", "День", "Вечер"]) assert.match(page, new RegExp(text));
  assert.match(dateFields, /customDateEnd/);
  assert.match(dateFields, /date-range-calendar/);
  assert.match(dateFields, /calendar-grid/);
  assert.match(dateFields, /chooseCalendarDay/);
  assert.match(dateFields, /calendar-day-selected/);
  assert.match(dateFields, /calendar-day-in-range/);
  assert.match(dateFields, /if \(draftEnd\) setTimeLimited\(false\)/);
  assert.match(dateFields, /showTimeSelection/);
  assert.match(dateFields, /showTimeSelection && timeLimited/);
  assert.match(dateFields, /role="switch"/);
  assert.match(dateFields, /timeLimited \? \(/);
  assert.match(dateFields, /timePresets\.map/);
  assert.match(dateFields, /step="900"/);
  assert.match(dateFields, /allowTime/);
  assert.doesNotMatch(dateFields, /arrivalRequired|taxi-arrival-time|Время прибытия|step="300"/);
  assert.doesNotMatch(dateFields, /custom-date-field|type="date"|showPicker|timingExpanded|detailsVisible|Настроить дату и время/);
  assert.equal((dateFields.match(/type="time"/g) ?? []).length, 2);

  const pending = section(page, "const renderPending", "const renderReady");
  assert.match(pending, /На согласовании/);
  assert.match(pending, /Пока нельзя/);
  assert.match(pending, /УК прочитает комментарий/);
  assert.match(pending, /request-comment/);
  assert.match(pending, /К разовым пропускам/);
  assert.match(pending, /pending-screen/);
  assert.match(pending, /pending-hero/);
  assert.match(pending, /pending-footer/);
  assert.doesNotMatch(pending, /requestProperty\.address/);

  const ready = section(page, "const renderReady", "const renderShare");
  assert.match(ready, /Можно проходить/);
  assert.match(ready, /Можно въезжать/);
  assert.match(ready, /Передать посетителю/);
  assert.match(ready, /Добавить в «Мой транспорт»/);
  assert.match(ready, /saveCurrentVehicle/);
  assert.match(ready, /Разрешить данные сервисов/);
  assert.match(ready, /Передача данных разрешена/);
  assert.match(ready, /servicesConnected/);
  assert.match(ready, /PersonAccessCredential/);
  assert.match(ready, /needsVisitorCredential/);
  assert.match(ready, /Для прохода · QR или PIN/);
  assert.match(ready, /Для въезда/);
  assert.match(ready, /copyPin/);
  assert.match(ready, /Одно использование/);
  assert.match(ready, /ready-screen/);
  assert.match(ready, /ready-hero/);
  assert.match(ready, /ready-footer/);
  assert.match(ready, /PersonAccessCredential[^\n]+compact/);
  assert.doesNotMatch(ready, /<dt>Объект<\/dt>/);

  const share = section(page, "const renderShare", "const screens");
  assert.match(share, /Доступ для посетителя/);
  assert.match(share, /Данные для въезда/);
  assert.match(share, /Отправить/);
  assert.match(share, /Скопировать/);
  assert.match(share, /PersonAccessCredential/);
  assert.match(share, /needsVisitorCredential/);
  assert.match(share, /Для прохода · QR или PIN/);
  assert.match(share, /доступ сработает один раз до конца дня/);
  assert.match(share, /share-screen/);
  assert.match(share, /share-hero/);
  assert.match(share, /share-footer/);
  assert.match(share, /share-help/);
  assert.doesNotMatch(share, /requestProperty\.address/);
  for (const text of ["QR или PIN", "Покажите QR или введите PIN", "Скопировать PIN"]) assert.match(page, new RegExp(text));
  assert.match(page, /QRCodeSVG/);
  assert.match(page, /makeDemoAccessToken/);
  assert.match(page, /marginSize=\{4\}/);
  assert.match(page, /buildAccessCardFile/);
  assert.match(page, /navigator\.canShare/);

  for (const text of ["Выберите квартиру", "Оформить быстрый пропуск", "Гостю", "Курьеру", "Сразу показать QR и PIN"]) assert.match(page, new RegExp(text));
  assert.match(page, /propertyId: string/);
  assert.match(page, /isQuick: boolean/);
  assert.match(page, /accessId: string/);
  assert.match(page, /setSelectedPropertyId\(itemRequest\.propertyId\)/);
  assert.match(page, /requestProperty\.fullAddress/);
  assert.match(page, /makeDemoPin/);

  for (const text of ["screenGuides", "Текущий экран", "Предлагаемое решение"]) assert.match(page, new RegExp(text));
  for (const text of ["Сравнение с текущим экраном", "Что изменилось", "Цель"]) assert.doesNotMatch(page, new RegExp(text));
  assert.match(page, /IMG_3819\.PNG/);
  for (const index of [3851, 3853, 3854, 3855, 3856, 3857, 3858]) assert.match(page, new RegExp(`IMG_${index}\\.PNG`));
  for (const index of [3829, 3835, 3836]) assert.match(page, new RegExp(`IMG_${index}\\.PNG`));
  for (const index of [3863, 3864, 3866, 3867, 3868]) assert.match(page, new RegExp(`IMG_${index}\\.PNG`));
  for (const index of [3870, 3871, 3872]) assert.match(page, new RegExp(`IMG_${index}\\.PNG`));
  assert.match(page, /IMG_3837\.PNG/);

  for (const selector of ["demo-stage", "reference-panel", "reference-list-multiple", "reference-count-4", "device-frame", "status-bar", "home-stories", "home-ai-field", "property-header-trigger", "stack-property-trigger", "property-switcher-backdrop", "property-switcher-dialog", "property-chip-strip", "property-chip-active", "quick-pass-trigger", "quick-pass-backdrop", "quick-pass-dialog", "quick-pass-kinds", "pass-action-grid", "pass-history", "pass-swipe-row", "pass-compact-card", "pass-actions-toggle", "pass-inline-actions", "pass-undo-toast", "form-mode-switch", "compact-pass-form", "taxi-pass-form", "compact-stack-shell", "house-billing-hero", "house-shortcuts", "house-passes-link", "vehicle-field-heading", "vehicle-heading-actions", "add-vehicle-field", "additional-vehicle-list", "additional-vehicle-entry", "my-vehicles-trigger", "saved-vehicle-strip", "direction-choice", "delivery-service-shortcuts", "delivery-service-picker", "taxi-go-banner", "ready-next-actions", "save-vehicle-card", "yandex-integration-card", "person-access-card", "person-access-qr", "person-access-pin", "share-credential", "credential-plate-list", "visitor-field-heading", "add-person-field", "form-submit-footer", "submit-hint", "date-range-calendar", "calendar-header", "calendar-weekdays", "calendar-grid", "calendar-day", "calendar-day-selected", "calendar-day-in-range", "calendar-confirm", "approval-warning-backdrop", "approval-warning-dialog", "approval-warning-close", "approval-warning-icon", "request-comment", "time-toggle-row", "time-presets", "time-fields"]) assert.match(css, new RegExp(selector));
  assert.doesNotMatch(css, /decision-panel/);
  assert.match(css, /--black:\s*#1f1e20/i);
  assert.match(css, /--action-red:\s*#c81410/i);
  assert.ok((css.match(/background: var\(--action-red\)/g) ?? []).length >= 3);
  assert.match(css, /@media \(max-width: 460px\)/);
});
