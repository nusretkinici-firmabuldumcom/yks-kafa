const TYT_SUBJECTS = [
  { name: 'Türkçe', exam: 'TYT', icon: 'T', kind: 'turkish', topic: 'Paragraf' },
  { name: 'Temel Matematik', exam: 'TYT', icon: '∑', kind: 'math', topic: 'Temel kavramlar' },
  { name: 'Fizik', exam: 'TYT', icon: '⚛', kind: 'science', topic: 'Hareket ve kuvvet' },
  { name: 'Kimya', exam: 'TYT', icon: '◉', kind: 'science', topic: 'Atom ve periyodik sistem' },
  { name: 'Biyoloji', exam: 'TYT', icon: '❋', kind: 'science', topic: 'Hücre' },
  { name: 'Tarih', exam: 'TYT', icon: '⌛', kind: 'social', topic: 'Tarih bilimi' },
  { name: 'Coğrafya', exam: 'TYT', icon: '⌖', kind: 'social', topic: 'Harita bilgisi' },
  { name: 'Felsefe', exam: 'TYT', icon: '◌', kind: 'social', topic: 'Felsefeye giriş' },
  { name: 'Din Kültürü', exam: 'TYT', icon: '✧', kind: 'social', topic: 'İnanç ve bilgi' },
];
const FIELD_SUBJECTS = {
  say: [
    { name: 'AYT Matematik', exam: 'AYT', icon: '∑', kind: 'math', topic: 'Fonksiyonlar' },
    { name: 'AYT Fizik', exam: 'AYT', icon: '⚛', kind: 'science', topic: 'Kuvvet ve hareket' },
    { name: 'AYT Kimya', exam: 'AYT', icon: '◉', kind: 'science', topic: 'Modern atom teorisi' },
    { name: 'AYT Biyoloji', exam: 'AYT', icon: '❋', kind: 'science', topic: 'Hücre bölünmeleri' },
  ],
  ea: [
    { name: 'AYT Matematik', exam: 'AYT', icon: '∑', kind: 'math', topic: 'Fonksiyonlar' },
    { name: 'Türk Dili ve Edebiyatı', exam: 'AYT', icon: 'T', kind: 'turkish', topic: 'Şiir bilgisi' },
    { name: 'Tarih-1', exam: 'AYT', icon: '⌛', kind: 'social', topic: 'Tarih ve zaman' },
    { name: 'Coğrafya-1', exam: 'AYT', icon: '⌖', kind: 'social', topic: 'Doğal sistemler' },
  ],
  soz: [
    { name: 'Türk Dili ve Edebiyatı', exam: 'AYT', icon: 'T', kind: 'turkish', topic: 'Şiir bilgisi' },
    { name: 'Tarih-1', exam: 'AYT', icon: '⌛', kind: 'social', topic: 'Tarih ve zaman' },
    { name: 'Coğrafya-1', exam: 'AYT', icon: '⌖', kind: 'social', topic: 'Doğal sistemler' },
    { name: 'Tarih-2', exam: 'AYT', icon: '⌛', kind: 'social', topic: 'Osmanlı tarihi' },
    { name: 'Coğrafya-2', exam: 'AYT', icon: '⌖', kind: 'social', topic: 'Türkiye coğrafyası' },
    { name: 'Felsefe Grubu', exam: 'AYT', icon: '◌', kind: 'social', topic: 'Felsefe ve düşünce' },
    { name: 'Din Kültürü (AYT)', exam: 'AYT', icon: '✧', kind: 'social', topic: 'Ahlak ve değerler' },
  ],
  dil: [{ name: 'YDT İngilizce', exam: 'YDT', icon: 'EN', kind: 'language', topic: 'Vocabulary & cloze test' }],
};
const DEFAULTS = { grade: '12. sınıf', field: 'say', parentEmail: '', parentOptIn: false };
let profile = { ...DEFAULTS, ...readStore('yk-profile', {}) };
let progress = readStore('yk-progress', {});
let plan = readStore('yk-plan', { startTime: '16:00', breakMin: 5, subjects: {} });
let daily = readStore('yk-daily', null);
let goals = readStore('yk-goals', []);
let currentMockNets = readStore('yk-current-nets', { tyt: 0, ayt: 0 });
let mockSchedule = readStore('yk-mock-schedule', null);
let mockResults = readStore('yk-mock-results', []);
let mockSelection = readStore('yk-mock-selection', {});
let seenQuestionKeys = readStore('yk-seen-question-keys', []);
let mockExam = null;
let mockTimerHandle = null;
let reviewQueue = [];
let reviewSpeechIndex = 0;
let teacherSpeechToken = 0;
let dailyReviewQueue = readStore('yk-daily-review', []);
let activeSubject = TYT_SUBJECTS[1];
let currentSample = null;
let activeCarryId = null;
let activeQuestionTarget = 5;
let answeredThisSession = false;
let questionNumber = 1;
let questionStartedAt = 0;
let currentAccountUser = null;
let authInitialized = false;
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function readStore(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function saveStore(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function allSubjects() { return [...TYT_SUBJECTS, ...(FIELD_SUBJECTS[profile.field] || FIELD_SUBJECTS.say)]; }
function planSetting(name) { return plan.subjects[name] || { active: true, target: 5 }; }
function activeSubjects() { return allSubjects().filter(subject => planSetting(subject.name).active); }
function localDateKey(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
function localDateValue(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
function localNoon(value) { const [year, month, day] = value.split('-').map(Number); return new Date(year, month - 1, day, 12); }
function nextSaturday(date = new Date()) {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  let days = (6 - result.getDay() + 7) % 7;
  if (days === 0 && date.getHours() >= 10 && date.getMinutes() >= 15) days = 7;
  result.setDate(result.getDate() + days);
  return result;
}
function dayDate(value, offset) { const date = localNoon(value); date.setDate(date.getDate() + offset); return localDateValue(date); }
function dateLabel(value) { return new Intl.DateTimeFormat('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' }).format(localNoon(value)); }
function reconcilePlan() {
  plan.subjects ||= {};
  const next = {};
  for (const subject of allSubjects()) next[subject.name] = plan.subjects[subject.name] || { active: true, target: 5 };
  plan.subjects = next;
  plan.startTime ||= '16:00';
  plan.breakMin ||= 5;
}
function fieldName() { return ({ say: 'Sayısal', ea: 'Eşit Ağırlık', soz: 'Sözel', dil: 'Dil' })[profile.field] || 'Sayısal'; }
function codePoint(text) { return [...text].reduce((a, ch) => a + ch.codePointAt(0), 0); }
function subjectProgress(name) {
  return progress[name] || { done: 0, correct: 0, seconds: 0 };
}
function dailyTask(name) { return daily?.tasks?.[name] || { done: 0, target: Math.max(5, Number(planSetting(name).target) || 5) }; }
function getQuestionTarget() { return activeSubjects().reduce((sum, subject) => sum + Math.max(5, Number(planSetting(subject.name).target) || 5), 0); }
function totalDone() { return daily?.answered || 0; }
function totalCorrect() { return daily?.correct || 0; }
function totalSeconds() { return daily?.seconds || 0; }
function formatDate() { return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' }).format(new Date()); }
function escapeHTML(s) { return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]); }
function questionKey(sample) { return sample.prompt.trim().toLocaleLowerCase('tr-TR').replace(/\s+/g, ' '); }
function unseenSample(subject) {
  return questionBankFor(subject).find(sample => !seenQuestionKeys.includes(questionKey(sample))) || null;
}
function markQuestionSeen(sample) {
  const key = questionKey(sample);
  if (!seenQuestionKeys.includes(key)) {
    seenQuestionKeys.push(key);
    saveStore('yk-seen-question-keys', seenQuestionKeys);
  }
}

function prepareDailyRecord() {
  const today = localDateKey();
  if (!daily) daily = { date: today, tasks: {}, carry: [], answered: 0, correct: 0, seconds: 0 };
  if (daily.date !== today) {
    dailyReviewQueue = [];
    saveStore('yk-daily-review', dailyReviewQueue);
    const carry = Array.isArray(daily.carry) ? [...daily.carry] : [];
    for (const [name, task] of Object.entries(daily.tasks || {})) {
      const subject = task.subject || allSubjects().find(item => item.name === name);
      if (subject && task.done < task.target) carry.push({ id: `${daily.date}:${name}`, subject, done: task.done || 0, target: task.target, date: daily.date });
    }
    daily = { date: today, tasks: {}, carry, answered: 0, correct: 0, seconds: 0 };
  }
  daily.tasks ||= {}; daily.carry ||= []; daily.answered ||= 0; daily.correct ||= 0; daily.seconds ||= 0;
  for (const subject of activeSubjects()) {
    const target = Math.max(5, Number(planSetting(subject.name).target) || 5);
    if (!daily.tasks[subject.name]) daily.tasks[subject.name] = { subject, done: 0, target };
    daily.tasks[subject.name].subject = subject;
    daily.tasks[subject.name].target = target;
  }
  saveStore('yk-daily', daily);
}

function renderTasks(targetId) {
  const container = document.getElementById(targetId);
  if (!container) return;
  container.innerHTML = activeSubjects().map(subject => {
    const p = dailyTask(subject.name);
    const target = p.target;
    const percent = Math.min(100, Math.round(p.done / target * 100));
    const doneLabel = p.done >= target ? 'Tamamlandı' : p.done ? 'Devam et' : 'Başla';
    const minutes = Math.max(10, target * 2);
    return `<article class="task-card"><div class="task-head"><span class="subject-badge ${subject.kind}">${subject.icon}</span><div><div class="task-title">${escapeHTML(subject.name)}</div><div class="task-caption">${subject.exam} · ${escapeHTML(subject.topic)}</div></div></div><div class="task-progress-row"><span>${p.done} / ${target} soru</span><strong>${percent}%</strong></div><div class="progress-track"><i style="width:${percent}%"></i></div><div class="task-foot"><small>◷ ~ ${minutes} dk</small><button class="task-button ${p.done >= target ? 'completed' : ''}" data-subject="${escapeHTML(subject.name)}">${doneLabel} ${p.done >= target ? '✓' : '→'}</button></div></article>`;
  }).join('');
}

function renderCarry() {
  const root = $('#carryList');
  if (!root) return;
  const carry = (daily?.carry || []).filter(task => task.done < task.target);
  $('#carryCount').textContent = `${carry.length} görev`;
  root.innerHTML = carry.map(task => {
    const percent = Math.min(100, Math.round(task.done / task.target * 100));
    return `<div class="carry-card"><span class="carry-icon">↻</span><div><strong>${escapeHTML(task.subject.name)} · ${escapeHTML(task.subject.topic)}</strong><small>${escapeHTML(task.date)} · ${task.done} / ${task.target} soru tamamlandı</small></div><div class="carry-progress"><span>${percent}%</span><i><b style="width:${percent}%"></b></i></div><button class="small-button" data-carry-id="${escapeHTML(task.id)}">Devam et →</button></div>`;
  }).join('') || '<div class="schedule-empty">Tamamlanamayan görevin yok.</div>';
}

function formatClock(minutes) { const h = Math.floor(minutes / 60) % 24; const m = minutes % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`; }
function renderSchedule() {
  const root = $('#daySchedule');
  if (!root) return;
  let minute = (Number((plan.startTime || '16:00').slice(0, 2)) * 60) + Number((plan.startTime || '16:00').slice(3, 5));
  const subjects = activeSubjects();
  const rows = [];
  subjects.forEach((subject, index) => {
    const target = Math.max(5, Number(planSetting(subject.name).target) || 5);
    const duration = Math.max(10, target * 2);
    rows.push(`<div class="schedule-row"><span class="schedule-time">${formatClock(minute)}<i></i>${formatClock(minute + duration)}</span><span class="subject-badge ${subject.kind}">${subject.icon}</span><div class="schedule-main"><strong>${escapeHTML(subject.name)}</strong><small>${escapeHTML(subject.topic)} · ${target} soru</small></div><span class="schedule-duration">${duration} dk</span><button class="schedule-start" data-subject="${escapeHTML(subject.name)}">Başla →</button></div>`);
    minute += duration;
    if (index < subjects.length - 1) {
      const rest = Number(plan.breakMin) || 5;
      rows.push(`<div class="schedule-break"><span>☕</span> Mola · ${rest} dk <small>${formatClock(minute)} – ${formatClock(minute + rest)}</small></div>`);
      minute += rest;
    }
  });
  root.innerHTML = rows.join('') || '<div class="schedule-empty">Programına en az bir ders ekle.</div>';
  $('#scheduleCaption').textContent = `Tahmini bitiş ${formatClock(minute)} · Süreler soru sayısına göre hesaplanır`;
  $('#scheduleStartChip').textContent = `${plan.startTime || '16:00'} başlangıç`;
}

function renderMetrics() {
  const count = activeSubjects().length;
  const target = getQuestionTarget();
  const done = totalDone();
  const correct = totalCorrect();
  const accuracy = done ? `${Math.round(correct / done * 100)}%` : '—';
  const avgTime = done ? `${Math.round(totalSeconds() / done)} sn` : '—';
  $('#subjectCount').textContent = `${count} ders`;
  $('#questionTarget').textContent = `${target} soru`;
  $('#doneSummary').textContent = `${done} / ${target}`;
  const totalMinutes = activeSubjects().reduce((sum, subject) => sum + Math.max(10, Number(planSetting(subject.name).target) * 2), 0) + Math.max(0, count - 1) * (Number(plan.breakMin) || 5);
  $('#estimatedTime').textContent = `${Math.floor(totalMinutes / 60)} sa ${totalMinutes % 60} dk`;
  const targets = activeSubjects().map(subject => Number(planSetting(subject.name).target));
  const targetSummary = targets.length && targets.every(value => value === targets[0]) ? String(targets[0]) : 'değişken';
  $('#perSubjectSummary').innerHTML = `${targetSummary} <i>soru / ders</i>`;
  $('#planSubjectCount').textContent = `${count} ders`;
  $('#planTotal').textContent = `${target} soru`;
  $('#weekTotal').textContent = done;
  $('#metricSolved').textContent = done;
  $('#metricAccuracy').textContent = accuracy;
  $('#metricTime').textContent = avgTime;
  $('#parentSolved').textContent = done;
  $('#parentAccuracy').textContent = accuracy;
  $('#parentDailyTarget').textContent = `${target} soru`;
  const progressCaption = $('#metricSolved')?.parentElement.querySelector('.metric-caption');
  if (progressCaption) progressCaption.textContent = 'Bugün';
  const parentCaption = $('#parentSolved')?.parentElement.querySelector('.metric-caption');
  if (parentCaption) parentCaption.textContent = 'Bugün';
  const parentLink = $('#page-parent .connected-pill');
  if (parentLink) { parentLink.innerHTML = `<i></i> ${profile.parentOptIn ? 'Hesap bağlı' : 'Bağlı değil'}`; parentLink.classList.toggle('disconnected-pill', !profile.parentOptIn); }
  const parentBanner = $('#page-parent .parent-banner');
  if (parentBanner) {
    parentBanner.querySelector('strong').textContent = profile.parentOptIn ? 'Veli hesabı eşleştirilmiş.' : 'Veli hesabı henüz eklenmedi.';
    parentBanner.querySelector('p').textContent = profile.parentOptIn ? `Veli daveti ${profile.parentEmail} adresine gönderilecek. Bu prototipte giriş ve davet gönderimi henüz etkin değil.` : 'Veli hesabı eklemek için profil ayarlarından “Veli hesabı eklemek istiyorum” seçeneğini etkinleştir.';
  }
  const parentInsight = $('#page-parent .parent-insight > p');
  if (parentInsight) {
    const weakest = allSubjects().map(subject => ({ subject, ...subjectProgress(subject.name) })).filter(item => item.done).sort((a, b) => a.correct / a.done - b.correct / b.done)[0];
    parentInsight.textContent = weakest
      ? `Bugün ${done} soru çözüldü ve başarı oranı ${accuracy}. ${weakest.subject.name} dersindeki başarı oranı %${Math.round(weakest.correct / weakest.done * 100)}; bu derste konu tekrarı önerilir.`
      : 'Henüz soru çözümü kaydı yok. Öğrenci ilk sorularını çözdükçe günlük hedef, başarı oranı ve tekrar önerileri burada görünecek.';
  }
  renderWeakTopics();
  $('#todayDate').textContent = formatDate();
  $('#crumbTitle').textContent = ({ today: 'Bugün', plan: 'Çalışma planım', goals: 'Hedeflerim', mocks: 'Hafta sonu denemesi', courses: 'Dersler', questions: 'Soru çöz', progress: 'İlerlemem', parent: 'Veli görünümü', account: 'Hesap ve ödeme' })[currentPage] || 'Bugün';
  renderTasks('taskList'); renderTasks('planTaskList'); renderSubjectProgress(); renderSchedule(); renderCarry(); renderCourses(); renderQuestionPicker(); renderTasks('questionTaskList'); renderGoalPanel(); renderMockSchedule();
}

function renderCourses() {
  const root = $('#courseList');
  if (!root) return;
  const subjects = allSubjects();
  $('#courseCount').textContent = `${subjects.length} ders`;
  root.innerHTML = subjects.map(subject => {
    const task = dailyTask(subject.name);
    const active = planSetting(subject.name).active;
    return `<article class="task-card"><div class="task-head"><span class="subject-badge ${subject.kind}">${subject.icon}</span><div><div class="task-title">${escapeHTML(subject.name)}</div><div class="task-caption">${subject.exam} · ${escapeHTML(subject.topic)}</div></div></div><div class="course-status">${active ? 'Günlük planında' : 'Planında seçili değil'} · ${task.done}/${task.target} soru</div><div class="task-foot"><small>Konu başlığı · örnek soru</small><button class="task-button" data-subject="${escapeHTML(subject.name)}">Soru çöz →</button></div></article>`;
  }).join('');
}

function renderQuestionPicker() {
  const select = $('#questionPicker');
  if (!select) return;
  const previous = select.value;
  select.innerHTML = allSubjects().map(subject => `<option value="${escapeHTML(subject.name)}">${escapeHTML(subject.exam)} · ${escapeHTML(subject.name)}</option>`).join('');
  if (allSubjects().some(subject => subject.name === previous)) select.value = previous;
}

function renderGoalPanel() {
  const root = $('#goalList');
  if (!root) return;
  $('#currentTyt').value = currentMockNets.tyt ?? 0;
  $('#currentAyt').value = currentMockNets.ayt ?? 0;
  $('#goalCount').textContent = `${goals.length} hedef`;
  root.innerHTML = goals.map(goal => {
    const tytPct = Math.min(100, Math.round((currentMockNets.tyt / goal.tyt) * 100));
    const aytPct = Math.min(100, Math.round((currentMockNets.ayt / goal.ayt) * 100));
    const overall = Math.round((tytPct + aytPct) / 2);
    const gapTyt = Math.max(0, goal.tyt - currentMockNets.tyt);
    const gapAyt = Math.max(0, goal.ayt - currentMockNets.ayt);
    return `<article class="goal-card"><div class="goal-card-head"><div><span class="eyebrow">${escapeHTML(goal.field)}</span><h3>${escapeHTML(goal.program)}</h3><p>${escapeHTML(goal.university)} · 2024 yerleşen son kişi referansı</p></div><button class="goal-remove" type="button" data-remove-goal="${escapeHTML(goal.id)}" aria-label="Hedefi sil">×</button></div><div class="goal-overall"><strong>%${overall}</strong><span>yaklaşık ilerleme</span><i>${currentMockNets.tyt + currentMockNets.ayt} / ${goal.tyt + goal.ayt} toplam net</i></div><div class="goal-splits"><div><div><span>TYT</span><b>${currentMockNets.tyt} / ${goal.tyt} net</b></div><div class="progress-track"><i style="width:${tytPct}%"></i></div><small>${gapTyt ? `${gapTyt} net fark` : 'TYT hedefi yakalandı'}</small></div><div><div><span>AYT / YDT</span><b>${currentMockNets.ayt} / ${goal.ayt} net</b></div><div class="progress-track"><i style="width:${aytPct}%;background:#e3ad7b"></i></div><small>${gapAyt ? `${gapAyt} net fark` : 'AYT hedefi yakalandı'}</small></div></div><p class="goal-disclaimer">Net karşılaştırması yol göstericidir; yerleştirme sıralaması ve puan garantisi vermez.</p></article>`;
  }).join('') || '<div class="schedule-empty">Henüz hedef eklemedin. Bölümünü ve üniversiteni seçerek ilk hedefini oluştur.</div>';
}

function initMockSchedule() {
  if (!mockSchedule?.startSaturday) mockSchedule = { startSaturday: localDateValue(nextSaturday()) };
  $('#mockStartDate').value = mockSchedule.startSaturday;
  renderMockSchedule();
}

function nextScheduledSaturday() {
  const anchor = localNoon(mockSchedule.startSaturday);
  const next = nextSaturday();
  if (anchor >= next) return anchor;
  const weeks = Math.ceil((next - anchor) / (7 * 24 * 60 * 60 * 1000));
  const result = new Date(anchor);
  result.setDate(result.getDate() + weeks * 7);
  return result;
}

function currentMockDifficulty() {
  const anchor = localNoon(mockSchedule.startSaturday);
  const next = nextScheduledSaturday();
  const week = Math.max(0, Math.floor((next - anchor) / (7 * 24 * 60 * 60 * 1000)));
  return { week: week + 1, label: ['Kolay', 'Orta', 'Zor'][Math.min(2, week)] };
}

function renderMockSchedule() {
  if (!mockSchedule?.startSaturday) return;
  const saturday = nextScheduledSaturday();
  const saturdayValue = localDateValue(saturday);
  const sundayValue = dayDate(saturdayValue, 1);
  const level = currentMockDifficulty();
  $('#mockDifficultyBadge').textContent = `${level.week}. hafta · ${level.label}`;
  $('#mockWeekCaption').textContent = `${level.label} seviye · Zorluk her hafta artar ve üçüncü haftadan sonra zor seviyede sürer.`;
  const sessions = [{ type: 'TYT', title: 'TYT genel denemesi', date: saturdayValue, time: '10:15', subjects: TYT_SUBJECTS, duration: 165 }];
  if (profile.field === 'dil') sessions.push({ type: 'YDT', title: 'YDT İngilizce denemesi', date: sundayValue, time: '15:45', subjects: FIELD_SUBJECTS.dil, duration: 120 });
  else sessions.push({ type: 'AYT', title: 'AYT alan denemesi', date: sundayValue, time: '10:15', subjects: FIELD_SUBJECTS[profile.field] || FIELD_SUBJECTS.say, duration: 180 });
  renderMockPicker(sessions);
  $('#mockSessionList').innerHTML = sessions.map(session => {
    const available = getMockQuestions(session.type).length;
    return `<article class="mock-session-card"><span class="mock-session-icon">${session.type}</span><div class="mock-session-main"><strong>${session.title}</strong><small>${dateLabel(session.date)} · ${session.time} · ${session.duration} dk</small><small>${available} yeni örnek soru · ${level.label} seviye</small></div><button class="primary-button" data-start-mock="${session.type}" ${available ? '' : 'disabled'}>${available ? 'Denemeyi başlat' : 'Yeni soru bekleniyor'} <span>→</span></button></article>`;
  }).join('');
  const history = $('#mockHistory');
  history.innerHTML = mockResults.map(result => `<div class="mock-history-row"><span class="mock-history-type">${escapeHTML(result.type)}</span><div><strong>${escapeHTML(result.date)} · ${escapeHTML(result.difficulty)}</strong><small>${result.correct} doğru · ${result.wrong} yanlış · ${result.blank} boş</small></div><strong>${result.net} net</strong></div>`).join('') || '<div class="schedule-empty">Henüz tamamlanmış denemen yok.</div>';
}

function renderMockPicker(sessions) {
  const root = $('#mockContentPicker');
  if (!root) return;
  const types = [...new Set(sessions.map(session => session.type))];
  root.innerHTML = sessions.map(session => {
    const selected = mockSelection[session.type] || {};
    const subjects = session.subjects;
    return `<div class="mock-picker-exam"><h3>${session.type} içeriği</h3><div class="mock-picker-grid">${subjects.map(subject => {
      const bank = questionBankFor(subject);
      const sampleTopics = [...new Set(bank.map(sample => topicForMockSample(subject, sample)))];
      const topic = selected[subject.name]?.topic || sampleTopics[0];
      const active = selected[subject.name]?.active !== false;
      return `<label class="mock-picker-subject"><span><input type="checkbox" data-mock-subject="${escapeHTML(session.type)}|${escapeHTML(subject.name)}" ${active ? 'checked' : ''}><b>${escapeHTML(subject.name)}</b></span><select data-mock-topic="${escapeHTML(session.type)}|${escapeHTML(subject.name)}" ${active ? '' : 'disabled'}>${sampleTopics.map(value => `<option value="${escapeHTML(value)}" ${value === topic ? 'selected' : ''}>${escapeHTML(value.replace(/^KONU · /, ''))}</option>`).join('')}</select></label>`;
    }).join('')}</div></div>`;
  }).join('');
  root.querySelectorAll('[data-mock-subject]').forEach(input => input.addEventListener('change', () => {
    const [type, name] = input.dataset.mockSubject.split('|');
    const settings = mockSelection[type] ||= {};
    const subject = (sessions.find(session => session.type === type)?.subjects || []).find(item => item.name === name);
    settings[name] ||= { topic: topicForMockSample(subject, questionBankFor(subject)[0]) };
    settings[name].active = input.checked;
    saveStore('yk-mock-selection', mockSelection);
    renderMockSchedule();
  }));
  root.querySelectorAll('[data-mock-topic]').forEach(select => select.addEventListener('change', () => {
    const [type, name] = select.dataset.mockTopic.split('|');
    const settings = mockSelection[type] ||= {};
    settings[name] ||= { active: true };
    settings[name].topic = select.value;
    saveStore('yk-mock-selection', mockSelection);
    renderMockSchedule();
  }));
}

function topicForMockSample(subject, sample) {
  const name = subject.name;
  const prompt = sample.prompt.toLocaleLowerCase('tr-TR');
  if (name.includes('Matematik')) return /fonksiyon|f\(x\)/i.test(prompt) ? 'Fonksiyonlar' : /denklem|katının|bilinmeyen/i.test(prompt) ? 'Denklemler ve eşitlikler' : subject.topic;
  if (name.includes('Türkçe') || name.includes('Edebiyat')) return /bakış açısı|anlatım olanağı/i.test(prompt) ? 'Anlatım ve bakış açısı' : /betimleme|yağmur|görünüş/i.test(prompt) ? 'Anlatım biçimleri' : /ana düşünce|vurgulanan düşünce|paragraf/i.test(prompt) ? 'Paragrafta ana düşünce' : subject.topic;
  if (name.includes('Fizik')) return /sürat|yol|zaman/i.test(prompt) ? 'Hareket ve sürat' : /kuvvet|ivme/i.test(prompt) ? 'Kuvvet ve hareket' : subject.topic;
  if (name.includes('Kimya')) return /proton|nötron|elektron|atom numarası|kütle numarası/i.test(prompt) ? 'Atomun yapısı' : /periyodik/i.test(prompt) ? 'Periyodik sistem' : /çözün|karışım/i.test(prompt) ? 'Karışımlar ve çözeltiler' : subject.topic;
  if (name.includes('Coğrafya')) return /ölçek|harita/i.test(prompt) ? 'Harita ve ölçek' : /izohips|eğim/i.test(prompt) ? 'İzohips ve yer şekilleri' : /yerel saat|boylam/i.test(prompt) ? 'Dünya’nın hareketleri ve saat' : subject.topic;
  if (name.includes('Biyoloji')) return /protein sentezi|ribozom/i.test(prompt) ? 'Hücre organelleri' : /mitoz/i.test(prompt) ? 'Hücre bölünmeleri' : /fotosentez|klorofil/i.test(prompt) ? 'Fotosentez' : /endositoz|difüzyon|osmoz/i.test(prompt) ? 'Hücre zarından madde geçişi' : subject.topic;
  return subject.topic;
}

function getMockQuestions(type) {
  const subjects = type === 'TYT' ? TYT_SUBJECTS : type === 'YDT' ? FIELD_SUBJECTS.dil : (FIELD_SUBJECTS[profile.field] || FIELD_SUBJECTS.say);
  return subjects.filter(subject => mockSelection[type]?.[subject.name]?.active !== false).map(subject => {
    const chosenTopic = mockSelection[type]?.[subject.name]?.topic;
    const sample = questionBankFor(subject).find(item => (!chosenTopic || topicForMockSample(subject, item) === chosenTopic) && !seenQuestionKeys.includes(questionKey(item))) || null;
    return { subject, sample, answer: null };
  }).filter(item => item.sample);
}

function startMock(type) {
  const difficulty = currentMockDifficulty();
  const durations = { TYT: 165, AYT: 180, YDT: 120 };
  const questions = getMockQuestions(type);
  if (!questions.length) { toast('Bu kullanıcı için yeni soru kalmadı. Soru havuzu genişletilmeden tekrar sunulmayacak.'); return; }
  questions.forEach(item => markQuestionSeen(item.sample));
  renderMockSchedule();
  mockExam = { type, difficulty: difficulty.label, questions, index: 0, remaining: durations[type] * 60, startedAt: Date.now() };
  $('#mockExamSubtitle').textContent = `${type} DENEMESİ · ${difficulty.label.toLocaleUpperCase('tr-TR')} SEVİYE`;
  $('#mockExamTitle').textContent = type === 'YDT' ? 'Yabancı Dil Testi' : `${type} deneme sınavı`;
  $('#mockExamDialog').showModal();
  renderMockQuestion();
  clearInterval(mockTimerHandle);
  mockTimerHandle = setInterval(() => {
    if (!mockExam) return;
    mockExam.remaining -= 1;
    updateMockClock();
    if (mockExam.remaining <= 0) finishMock(true);
  }, 1000);
}

function updateMockClock() {
  if (!mockExam) return;
  const minutes = Math.floor(mockExam.remaining / 60);
  const seconds = mockExam.remaining % 60;
  $('#mockTimer').textContent = `${String(minutes).padStart(3, '0')}:${String(seconds).padStart(2, '0')}`;
}

function renderMockQuestion() {
  if (!mockExam) return;
  const item = mockExam.questions[mockExam.index];
  $('#mockQuestionCount').textContent = `Soru ${mockExam.index + 1} / ${mockExam.questions.length}`;
  $('#mockProgressBar').style.width = `${((mockExam.index + 1) / mockExam.questions.length) * 100}%`;
  $('#mockQuestionTopic').textContent = `${item.sample.topic} · ${item.subject.name}`;
  $('#mockQuestionPrompt').textContent = item.sample.prompt;
  $('#mockAnswerList').innerHTML = item.sample.options.map((option, index) => {
    const key = String.fromCharCode(65 + index);
    return `<button data-mock-answer="${key}" class="${item.answer === key ? 'selected' : ''}">${key} <span>${escapeHTML(option)}</span></button>`;
  }).join('');
  $$('#mockAnswerList [data-mock-answer]').forEach(button => button.addEventListener('click', () => {
    item.answer = button.dataset.mockAnswer;
    renderMockQuestion();
  }));
  $('#mockPrevious').disabled = mockExam.index === 0;
  $('#mockNext').textContent = mockExam.index === mockExam.questions.length - 1 ? 'Son soruyu bitir ✓' : 'Sonraki soru →';
  updateMockClock();
}

function finishMock(timeExpired = false) {
  if (!mockExam) return;
  if (!timeExpired && !window.confirm('Denemeyi bitirip sonuç ve yanlış çözümlerine geçmek istiyor musun?')) return;
  clearInterval(mockTimerHandle);
  const questions = mockExam.questions;
  const correct = questions.filter(item => item.answer === item.sample.correct).length;
  const wrong = questions.filter(item => item.answer && item.answer !== item.sample.correct).length;
  const blank = questions.filter(item => !item.answer).length;
  const result = { type: mockExam.type, difficulty: mockExam.difficulty, date: formatDate(), correct, wrong, blank, net: Number((correct - wrong / 4).toFixed(2)), total: questions.length };
  mockResults.unshift(result);
  saveStore('yk-mock-results', mockResults);
  renderMockSchedule();
  mockExam = null;
  $('#mockExamDialog').close();
  $('#mockReviewTitle').textContent = `${result.type} denemesi tamamlandı`;
  $('#mockReviewSummary').textContent = `${correct} doğru · ${wrong} yanlış · ${blank} boş · ${result.net} net${timeExpired ? ' · Süre doldu' : ''}`;
  reviewQueue = questions.filter(item => item.answer !== item.sample.correct);
  $('#mockWrongList').innerHTML = reviewQueue.map((item, index) => {
    const selected = item.answer ? `${item.answer}) ${item.sample.options[item.answer.charCodeAt(0) - 65]}` : 'Boş bırakıldı';
    const correctText = `${item.sample.correct}) ${item.sample.options[item.sample.correct.charCodeAt(0) - 65]}`;
    return `<article class="mock-wrong-item"><span class="question-topic">${escapeHTML(item.subject.name)} · ${escapeHTML(item.sample.topic)}</span><h3>${escapeHTML(item.sample.prompt)}</h3><div class="mock-answer-review"><span class="wrong-answer">Senin cevabın: ${escapeHTML(selected)}</span><strong>Doğru cevap: ${escapeHTML(correctText)}</strong></div><p>${escapeHTML(item.sample.explanation)}</p><div class="mock-review-steps">${item.sample.steps.map(([title, detail], step) => `<div><b>${step + 1}</b><span><strong>${escapeHTML(title)}</strong><small>${escapeHTML(detail)}</small></span></div>`).join('')}</div><button class="small-button" data-speak-one="${index}">Bu çözümü seslendir 🔊</button></article>`;
  }).join('') || '<div class="schedule-empty">Harika! Bu denemede yanlış veya boş cevabın yok.</div>';
  const reviewDialog = $('#mockReviewDialog');
  reviewDialog.classList.add('review-fallback');
  reviewDialog.setAttribute('open', '');
  if (reviewQueue.length && 'speechSynthesis' in window) setTimeout(() => speakReviewAt(0), 250);
}

function speakReviewAt(index) {
  if (!('speechSynthesis' in window) || !reviewQueue[index]) return;
  reviewSpeechIndex = index;
  const item = reviewQueue[index];
  const selected = item.answer ? `Sen ${item.answer} seçeneğini işaretlemişsin.` : 'Bu soruyu boş bırakmışsın; hiç sorun değil, şimdi beraber öğrenelim.';
  const correct = item.sample.correct;
  const answerText = item.sample.options[correct.charCodeAt(0) - 65];
  const chunks = [
    `Hadi ${item.subject.name} sorusuna birlikte bakalım. Acele etmiyoruz; önce sorunun bizden ne istediğini bulacağız.`,
    `Soru şöyle: ${item.sample.prompt}`,
    selected,
    `Doğru cevap ${correct} seçeneği: ${answerText}. Güzel, şimdi nedenini adım adım görelim.`,
    item.sample.explanation.replace(/Doğru cevap [A-E].*/i, ''),
    ...item.sample.steps.map(([title, detail], i) => `${i === 0 ? 'İlk adım' : `Sonraki adım, ${i + 1}`}. ${title}. ${detail}`),
    `Şimdi sonucu soru kökünde yerine koyalım. Cevap ${answerText}. Buradaki püf nokta, verilenleri doğru bağıntıyla eşleştirmek. Böyle sorularda önce bu yolu dene; yapabilirsin!`,
  ];
  speakTeacherSequence(chunks, () => { if (reviewSpeechIndex === index && index < reviewQueue.length - 1) speakReviewAt(index + 1); });
}

function spokenMath(text) {
  return String(text)
    .replace(/(\d)\s*x\b/gi, '$1 çarpı iks')
    .replace(/\b([xX])\b/g, 'iks')
    .replace(/=/g, ' eşittir ')
    .replace(/\+/g, ' artı ')
    .replace(/[−–]/g, ' eksi ')
    .replace(/\s-\s(?=\d)/g, ' eksi ')
    .replace(/[×·]/g, ' çarpı ')
    .replace(/÷|\//g, ' bölü ')
    .replace(/²|\^2/g, ' kare')
    .replace(/³|\^3/g, ' küp')
    .replace(/\s+/g, ' ')
    .trim();
}

function stopTeacherSpeech() {
  teacherSpeechToken += 1;
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}

function speakTeacherSequence(chunks, onComplete) {
  stopTeacherSpeech();
  const token = teacherSpeechToken;
  const cleanChunks = chunks.map(spokenMath).filter(Boolean);
  let index = 0;
  const speakNext = () => {
    if (token !== teacherSpeechToken) return;
    if (index >= cleanChunks.length) { onComplete?.(); return; }
    const utterance = new SpeechSynthesisUtterance(cleanChunks[index++]);
    utterance.lang = 'tr-TR'; utterance.rate = 0.9; utterance.pitch = 1.08; utterance.volume = 1;
    utterance.voice = speechSynthesis.getVoices().find(voice => voice.lang.toLocaleLowerCase().startsWith('tr')) || null;
    utterance.onend = () => setTimeout(speakNext, 170);
    utterance.onerror = () => setTimeout(speakNext, 170);
    speechSynthesis.speak(utterance);
  };
  speakNext();
}

function renderSubjectProgress() {
  const root = $('#subjectProgress');
  if (!root) return;
  root.innerHTML = allSubjects().map(subject => {
    const p = subjectProgress(subject.name);
    const percent = p.done ? Math.round(p.correct / p.done * 100) : 0;
    return `<div class="subject-line"><div class="subject-line-label"><span class="subject-badge ${subject.kind}">${subject.icon}</span>${escapeHTML(subject.name)}</div><div class="progress-track"><i style="width:${percent}%;background:${percent < 60 ? '#e3ad7b' : '#77bd9a'}"></i></div><span class="score">${p.done ? percent + '%' : '—'}</span><span class="right-answer">${p.correct} / ${p.done} doğru</span></div>`;
  }).join('');
}

function renderWeakTopics() {
  const weakest = allSubjects()
    .map(subject => ({ subject, ...subjectProgress(subject.name) }))
    .filter(item => item.done > 0)
    .sort((a, b) => (a.correct / a.done) - (b.correct / b.done))
    .slice(0, 3);
  const home = $('#weakTopicContent');
  const list = $('#weakTopicList');
  if (!weakest.length) {
    if (home) home.innerHTML = 'Soru çözdükçe kişisel tekrar önerilerin burada görünür.';
    if (list) list.innerHTML = '<div class="schedule-empty">Yeterli çalışma verisi oluştuğunda tekrar önerilerin burada listelenir.</div>';
    return;
  }
  if (home) {
    const item = weakest[0];
    const accuracy = Math.round(item.correct / item.done * 100);
    home.innerHTML = `<div class="topic-row"><span class="subject-badge ${item.subject.kind}">${item.subject.icon}</span><div><strong>${escapeHTML(item.subject.topic)}</strong><small>${escapeHTML(item.subject.name)} · ${item.done} soru çözüldü</small></div><span class="topic-score">%${accuracy}</span></div><div class="topic-progress"><i style="width:${accuracy}%"></i></div><button class="soft-button" data-subject="${escapeHTML(item.subject.name)}">Bu konuyu tekrar et <span>→</span></button>`;
  }
  if (list) list.innerHTML = weakest.map(item => {
    const accuracy = Math.round(item.correct / item.done * 100);
    return `<div class="weak-topic-row"><span class="subject-badge ${item.subject.kind}">${item.subject.icon}</span><div><strong>${escapeHTML(item.subject.topic)}</strong><small>${escapeHTML(item.subject.name)} · Son başarı %${accuracy}</small></div><span class="review-tag">Tekrar önerilir</span><button class="small-button" data-subject="${escapeHTML(item.subject.name)}">Çalış →</button></div>`;
  }).join('');
}

const boardHistory = new Map();
function resizeBoard(id) {
  const canvas = $(`#${id}`);
  if (!canvas || !canvas.offsetWidth) return;
  const ratio = window.devicePixelRatio || 1;
  const width = canvas.clientWidth, height = canvas.clientHeight;
  if (canvas.width === Math.round(width * ratio) && canvas.height === Math.round(height * ratio)) return;
  canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
  const context = canvas.getContext('2d'); context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.fillStyle = '#fff'; context.fillRect(0, 0, width, height);
  context.strokeStyle = '#20352a'; context.lineWidth = 2.4; context.lineCap = 'round'; context.lineJoin = 'round';
}
function clearBoard(id) {
  const canvas = $(`#${id}`); if (!canvas) return;
  resizeBoard(id);
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight); context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  boardHistory.set(id, []);
}
function setupBoard(id) {
  const canvas = $(`#${id}`); if (!canvas || canvas.dataset.ready) return;
  canvas.dataset.ready = 'true'; boardHistory.set(id, []);
  canvas.addEventListener('pointerdown', event => {
    resizeBoard(id); canvas.setPointerCapture(event.pointerId);
    const history = boardHistory.get(id) || [];
    if (history.length >= 15) history.shift();
    history.push(canvas.toDataURL('image/png')); boardHistory.set(id, history);
    const rect = canvas.getBoundingClientRect(), ctx = canvas.getContext('2d');
    ctx.beginPath(); ctx.moveTo(event.clientX - rect.left, event.clientY - rect.top); canvas.dataset.drawing = 'true';
  });
  canvas.addEventListener('pointermove', event => {
    if (canvas.dataset.drawing !== 'true') return;
    const rect = canvas.getBoundingClientRect(), ctx = canvas.getContext('2d');
    ctx.lineTo(event.clientX - rect.left, event.clientY - rect.top); ctx.stroke();
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) canvas.addEventListener(type, () => { canvas.dataset.drawing = 'false'; });
  requestAnimationFrame(() => resizeBoard(id));
}
function undoBoard(id) {
  const canvas = $(`#${id}`), history = boardHistory.get(id) || [];
  if (!canvas || !history.length) return;
  const previous = history.pop(), image = new Image();
  image.onload = () => { const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight); ctx.drawImage(image, 0, 0, canvas.clientWidth, canvas.clientHeight); };
  image.src = previous;
}

let currentPage = 'today';
function goToPage(page) {
  if (authInitialized && !currentAccountUser && page !== 'account') page = 'account';
  currentPage = page;
  $$('.page-view').forEach(el => el.classList.toggle('hidden', el.id !== `page-${page}`));
  $$('[data-page]').forEach(el => el.classList.toggle('active', el.dataset.page === page));
  $('#crumbTitle').textContent = ({ today: 'Bugün', plan: 'Çalışma planım', goals: 'Hedeflerim', mocks: 'Hafta sonu denemesi', courses: 'Dersler', questions: 'Soru çöz', progress: 'İlerlemem', parent: 'Veli görünümü', account: 'Hesap ve ödeme' })[page];
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (page === 'questions') { setupBoard('outsideBoard'); requestAnimationFrame(() => resizeBoard('outsideBoard')); }
}

function toast(message) {
  const el = $('#toast'); el.textContent = message; el.classList.add('show');
  clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('show'), 2600);
}

function sampleFor(subject) {
  const name = subject.name;
  if (name === 'Türkçe') return {
    topic: 'KONU · PARAGRAF',
    prompt: '“Bir kitabı bitirmek, o kitaptan öğrenilecek her şeyin bittiği anlamına gelmez. Okur, metne her dönüşünde yeni bir ayrıntı fark edebilir.” Bu parçanın ana düşüncesi aşağıdakilerden hangisidir?',
    options: ['Kitaplar yalnızca bir kez okunmalıdır.', 'Bir eser, farklı okumalarla yeni anlamlar kazandırabilir.', 'Her kitap aynı ölçüde öğreticidir.', 'Okur yalnızca bilmediği kitapları okumalıdır.', 'Bir metni anlamak için yazarı tanımak gerekir.'], correct: 'B',
    explanation: 'Parça, aynı eserin yeniden okunduğunda yeni ayrıntılar ve anlamlar sunabileceğini vurguluyor. Doğru cevap B.',
    steps: [['Parçanın odağını bul', 'Yazar, aynı kitaba yeniden dönmekten söz ediyor.'], ['Tekrarlanan düşünceyi yakala', 'Her okumada yeni bir ayrıntı fark edilebileceği belirtilmiş.'], ['Ana düşünceyi seç', 'Eserler farklı okumalarla yeni anlamlar kazanabilir ✓']],
  };
  if (name.includes('İngilizce')) return {
    topic: 'VOCABULARY · PRESENT PERFECT',
    prompt: 'Choose the correct word: She has been studying English ___ three years.',
    options: ['since', 'for', 'during', 'until', 'by'], correct: 'B',
    explanation: '“For three years” bir süredir devam eden zaman aralığını anlatır; doğru cevap B seçeneğidir.',
    steps: [['İpucunu yakala', '“Three years” geçmişten bugüne uzanan bir süreyi anlatıyor.'], ['Doğru yapıyı seç', 'Present perfect continuous ile “for + süre” kullanılır.'], ['Cümleyi kontrol et', 'She has been studying English for three years. ✓']],
  };
  if (name.includes('Matematik')) return {
    topic: 'KONU · TEMEL KAVRAMLAR',
    prompt: 'Bir sayının 3 katının 5 eksiği 16 ise bu sayı kaçtır?',
    options: ['5', '6', '7', '8', '9'], correct: 'C',
    explanation: 'Doğru cevap C (7). Bilinmeyen sayıya x diyerek verilen ilişkiyi denklem hâline getiriyoruz.',
    steps: [['Verilenleri belirle', 'Sayının 3 katından 5 çıkarılınca 16 elde ediliyor.'], ['Denklemi kur', '3x − 5 = 16'], ['Çöz ve kontrol et', '3x = 21, x = 7. Kontrol: 21 − 5 = 16 ✓']],
  };
  if (name.includes('Fizik')) return {
    topic: 'KONU · HAREKET',
    prompt: 'Bir araç 2 saatte 120 km yol alıyor. Aracın ortalama sürati kaç km/saattir?',
    options: ['40', '50', '60', '70', '80'], correct: 'C',
    explanation: 'Ortalama sürat, alınan yolun geçen zamana bölünmesiyle bulunur. Doğru cevap C (60 km/sa).',
    steps: [['Verilenleri yaz', 'Yol = 120 km, zaman = 2 saat.'], ['Bağıntıyı seç', 'Sürat = yol / zaman.'], ['Hesapla ve kontrol et', '120 / 2 = 60 km/sa ✓']],
  };
  if (name.includes('Kimya')) return {
    topic: 'KONU · ATOM VE PERİYODİK SİSTEM',
    prompt: 'Atom numarası 11 olan nötr bir atomun proton sayısı kaçtır?',
    options: ['1', '10', '11', '12', '22'], correct: 'C',
    explanation: 'Atom numarası proton sayısına eşittir. Doğru cevap C (11).',
    steps: [['Temel tanımı hatırla', 'Atom numarası, çekirdekteki proton sayısıdır.'], ['Nötrlüğü yorumla', 'Nötr olması elektron sayısını etkiler; proton sayısını değiştirmez.'], ['Sonucu yaz', 'Proton sayısı 11’dir ✓']],
  };
  if (name.includes('Biyoloji')) return {
    topic: 'KONU · HÜCRE',
    prompt: 'Ökaryot hücrelerde hücresel solunumla ATP üretiminin büyük bölümü hangi organelde gerçekleşir?',
    options: ['Ribozom', 'Lizozom', 'Mitokondri', 'Golgi aygıtı', 'Koful'], correct: 'C',
    explanation: 'Hücresel solunumun büyük bölümü mitokondride gerçekleşir. Doğru cevap C.',
    steps: [['Süreçle organeli eşleştir', 'ATP üretimi ve hücresel solunum soruluyor.'], ['Organellerin görevlerini ayır', 'Ribozom protein sentezler; mitokondri enerji dönüşümünde rol alır.'], ['Cevabı doğrula', 'Mitokondri ✓']],
  };
  if (name.includes('Coğrafya')) return {
    topic: 'KONU · HARİTA BİLGİSİ',
    prompt: 'Ölçeği 1 / 500.000 olan bir haritada 4 cm ile gösterilen uzaklık gerçekte kaç kilometredir?',
    options: ['2', '10', '20', '50', '200'], correct: 'C',
    explanation: 'Haritada 1 cm gerçekte 500.000 cm, yani 5 km’dir. 4 cm, 20 km eder. Doğru cevap C.',
    steps: [['Ölçeği yorumla', '1 cm haritada = 500.000 cm gerçekte.'], ['Santimetreyi kilometreye çevir', '500.000 cm = 5 km.'], ['Harita uzaklığıyla çarp', '4 × 5 = 20 km ✓']],
  };
  if (name.includes('Tarih')) return {
    topic: 'KONU · TARİH VE ZAMAN',
    prompt: 'Türkiye Cumhuriyeti’nin ilk cumhurbaşkanı kimdir?',
    options: ['İsmet İnönü', 'Fevzi Çakmak', 'Mustafa Kemal Atatürk', 'Celal Bayar', 'Kazım Karabekir'], correct: 'C',
    explanation: 'Türkiye Cumhuriyeti’nin ilk cumhurbaşkanı Mustafa Kemal Atatürk’tür. Doğru cevap C.',
    steps: [['Dönemi belirle', 'Soru, Cumhuriyet’in kuruluş dönemini soruyor.'], ['Bilgiyi hatırla', 'Cumhuriyet 29 Ekim 1923’te ilan edildi.'], ['Kişiyi eşleştir', 'İlk cumhurbaşkanı Mustafa Kemal Atatürk’tür ✓']],
  };
  if (name.includes('Felsefe')) return {
    topic: 'KONU · BİLGİ FELSEFESİ',
    prompt: '“Kesin bilgiye ancak akıl yoluyla ulaşılır.” görüşü aşağıdaki yaklaşımlardan hangisini yansıtır?',
    options: ['Empirizm', 'Rasyonalizm', 'Septisizm', 'Pragmatizm', 'Entüisyonizm'], correct: 'B',
    explanation: 'Bilginin kaynağını akılda gören yaklaşım rasyonalizmdir. Doğru cevap B.',
    steps: [['Anahtar ifadeyi bul', 'Cümle, kesin bilginin kaynağı olarak aklı gösteriyor.'], ['Yaklaşımları ayırt et', 'Empirizm duyuyu, rasyonalizm aklı öne çıkarır.'], ['Sonucu seç', 'Bu görüş rasyonalizmdir ✓']],
  };
  if (name.includes('Din Kültürü')) return {
    topic: 'KONU · İNANÇ VE BİLGİ',
    prompt: 'İslam’da ihtiyaç sahiplerine belirli ölçüde mal vermeyi ifade eden ibadet hangisidir?',
    options: ['Oruç', 'Hac', 'Zekât', 'Namaz', 'Kurban'], correct: 'C',
    explanation: 'Belirli şartları taşıyan Müslümanların mallarından ihtiyaç sahiplerine vermesi zekâttır. Doğru cevap C.',
    steps: [['İbadetin niteliğini belirle', 'Soru, mal ile yapılan ve ihtiyaç sahibine yönelik ibadeti soruyor.'], ['Kavramları ayır', 'Oruç ve namaz bedenî; zekât malî ibadettir.'], ['Cevabı kontrol et', 'Zekât ✓']],
  };
  if (name.includes('Edebiyat')) return {
    topic: 'KONU · EDEBİYAT BİLGİSİ',
    prompt: 'Aşağıdakilerden hangisi Millî Edebiyat dönemi sanatçılarındandır?',
    options: ['Tevfik Fikret', 'Recaizade Mahmut Ekrem', 'Ömer Seyfettin', 'Ahmet Haşim', 'Cenap Şahabettin'], correct: 'C',
    explanation: 'Ömer Seyfettin, Millî Edebiyat döneminin önde gelen öykücülerindendir. Doğru cevap C.',
    steps: [['Dönemin özelliğini hatırla', 'Millî Edebiyat, sade dil ve millî konularla ilişkilidir.'], ['Sanatçıları dönemlere ayır', 'Ömer Seyfettin bu dönemin öykücülerindendir.'], ['Cevabı doğrula', 'Ömer Seyfettin ✓']],
  };
  return {
    topic: `KONU · ${subject.topic.toLocaleUpperCase('tr-TR')}`,
    prompt: 'Bir konuyu öğrenirken önce verilen bilgileri ayırıp sonra uygun yöntemi seçmek neden önemlidir?',
    options: ['Çözümü ezberlemek için', 'Sorudaki bilgiyi ve isteneni doğru eşleştirmek için', 'Soru kökünü atlamak için', 'Daha çok işlem yapmak için', 'Cevabı tahmin etmek için'], correct: 'B',
    explanation: 'Verilenlerle isteneni doğru eşleştirmek, uygun yöntemi seçmenin ilk adımıdır. Doğru cevap B.',
    steps: [['Verilenleri bul', 'Sorunun sunduğu bilgileri belirle.'], ['İsteneni belirle', 'Hangi bilgiye ulaşman gerektiğini netleştir.'], ['Yöntemi uygula', 'Uygun konu bilgisini kullanıp sonucu kontrol et ✓']],
  };
}

function questionBankFor(subject) {
  const first = sampleFor(subject);
  const name = subject.name;
  const make = (topic, prompt, options, correct, explanation, steps) => ({ topic, prompt, options, correct, explanation, steps });
  const q = (prompt, options, index, explanation, steps = null) => make(`KONU · ${subject.topic.toLocaleUpperCase('tr-TR')}`, prompt, options, String.fromCharCode(65 + index), explanation, steps || [['Soruda verileni belirle', 'Soru kökünde verilen bilgiyi ve isteneni ayır.'], ['İlgili bilgiyi kullan', explanation], ['Cevabı kontrol et', 'Sonucun soru köküyle uyuştuğunu doğrula.']]);
  const content = name.includes('Türkçe') ? [
    q('“Kentlerin belleği yalnızca eski yapılarda değil, sokak adlarında ve gündelik alışkanlıklarda da yaşar.” Bu cümlede vurgulanan düşünce hangisidir?', ['Kent yaşamı sürekli değişir.', 'Kentin geçmişi farklı kültürel izlerde korunur.', 'Eski yapılar korunmamalıdır.', 'Sokak adları rastgele belirlenir.', 'Gündelik alışkanlıklar önemsizdir.'], 1, 'Kent belleğinin yapılardan başka adlar ve alışkanlıklarla da taşındığı söyleniyor.'),
    q('Bir yazar, bir olayı farklı kişilerin bakış açısından anlatarak okura sunuyorsa hangi anlatım olanağını kullanır?', ['Tek yönlü anlatımı', 'Bakış açısı çeşitliliğini', 'Nesnel tanımlamayı', 'Özetlemeyi', 'Tanık göstermeyi'], 1, 'Farklı kişilerin bakış açıları aynı olayın farklı yönlerini görünür kılar.'),
    q('“Yağmur dindi; kaldırım taşlarında biriken ışık, sokağı olduğundan daha geniş gösteriyordu.” cümlesinde ağır basan anlatım biçimi hangisidir?', ['Tartışma', 'Açıklama', 'Betimleme', 'Öyküleme', 'Kanıtlama'], 2, 'Işık ve sokak görünüşü okuyucunun zihninde canlandırılıyor; betimleme ağır basıyor.'),
    q('Bir paragrafta düşüncenin gelişimini izlerken önce hangi ögeyi belirlemek en yararlıdır?', ['Örnek sayısını', 'Ana yargıyı ve onu destekleyen cümleleri', 'Yazarın yaşını', 'Paragrafın uzunluğunu', 'Kullanılan noktalama işaretlerinin sayısını'], 1, 'Ana yargı, destekleyici cümlelerin hangi düşünce etrafında kurulduğunu gösterir.'),
  ] : name.includes('Fizik') ? [
    q('Sabit süratle 3 saatte 180 km giden aracın sürati kaç km/sa olur?', ['30', '45', '60', '90', '120'], 2, 'Sürat = yol / zaman = 180 / 3 = 60 km/sa.', [['Verilenleri yaz', 'Alınan yol 180 kilometre, geçen süre 3 saattir.'], ['Bağıntıyı seç', 'Sürat, alınan yolun geçen zamana bölünmesiyle bulunur: v = x / t.'], ['Birimleri kontrol et', 'Kilometreyi saate böldüğümüz için sonuç birimi kilometre bölü saat olur.'], ['İşlemi yap ve doğrula', '180 / 3 = 60. Araç her saatte 60 kilometre gider; cevap 60 km/sa.']]),
    q('Bir cisme etki eden bileşke kuvvet sıfırsa cisim için hangisi kesinlikle doğrudur?', ['Kesinlikle durur.', 'Hızının büyüklüğü kesinlikle artar.', 'Dengelenmiş kuvvetlerin etkisindedir.', 'Hareket yönü kesinlikle değişir.', 'Üzerine hiç kuvvet etki etmez.'], 2, 'Bileşke kuvvetin sıfır olması kuvvetlerin dengelendiğini gösterir; cisim duruyor veya sabit hızla gidiyor olabilir.'),
    q('Kütlesi 2 kg olan cisme 6 N bileşke kuvvet uygulanıyor. Cismin ivmesi kaç m/s² olur?', ['2', '3', '4', '8', '12'], 1, 'Newton’un ikinci yasası F = m·a olduğundan a = 6 / 2 = 3 m/s².', [['Verilenleri belirle', 'Bileşke kuvvet 6 newton, kütle 2 kilogram. İstenen ivme.'], ['Fizik bağıntısını yaz', 'Newton’un ikinci yasası: F = m çarpı a.'], ['İvmeyi yalnız bırak', 'Her iki tarafı kütleye böleriz: a = F / m.'], ['Değerleri yerine koy', 'a = 6 / 2 = 3 metre bölü saniye kare.'], ['Sonucu yorumla', 'Her saniyede hız 3 metre bölü saniye değişir; cevap 3 m/s².']]),
    q('Aynı kuvvet uygulandığında kütlesi daha küçük olan cismin ivmesi nasıl değişir?', ['Azalır.', 'Artar.', 'Değişmez.', 'Sıfır olur.', 'Yönü kesin değişir.'], 1, 'a = F/m bağıntısına göre aynı kuvvette kütle azaldıkça ivme artar.'),
  ] : name.includes('Kimya') ? [
    q('Atom numarası 17 olan nötr klor atomunun elektron sayısı kaçtır?', ['8', '17', '18', '34', '35'], 1, 'Nötr atomda elektron sayısı proton sayısına, yani atom numarasına eşittir.'),
    q('Bir atomun proton sayısı 11, nötron sayısı 12 ise kütle numarası kaçtır?', ['11', '12', '23', '24', '132'], 2, 'Kütle numarası proton ve nötron sayılarının toplamıdır: 11 + 12 = 23.', [['Tanımları ayır', 'Proton ve nötron çekirdekte bulunur. Elektronlar kütle numarasına katılmaz.'], ['Kuralı yaz', 'Kütle numarası = proton sayısı + nötron sayısı.'], ['Sayıları yerine koy', '11 proton + 12 nötron = 23.'], ['Cevabı kontrol et', 'Toplam nükleon sayısı 23 olduğundan cevap 23.']]),
    q('NaCl katısının suda çözünmesiyle oluşan karışım hangi türdür?', ['Heterojen karışım', 'Süspansiyon', 'Homojen çözelti', 'Saf element', 'Alaşım'], 2, 'Tuz suda iyonlarına ayrılarak her yere eşit dağılan homojen çözelti oluşturur.'),
    q('Periyodik tabloda aynı grupta bulunan elementlerin benzer kimyasal özellik göstermesinin temel nedeni nedir?', ['Nötron sayılarının eşit olması', 'Değerlik elektron düzenlerinin benzer olması', 'Kütle numaralarının eşit olması', 'Aynı periyotta bulunmaları', 'Proton sayılarının eşit olması'], 1, 'Aynı gruptaki elementlerin son katman elektron düzenleri benzer olduğu için kimyasal özellikleri de benzerlik gösterir.'),
  ] : name.includes('Biyoloji') ? [
    q('Hücrede protein sentezinden doğrudan sorumlu yapı hangisidir?', ['Lizozom', 'Ribozom', 'Koful', 'Sentrozom', 'Golgi aygıtı'], 1, 'Protein sentezi ribozomlarda gerçekleşir.'),
    q('Hücre zarından geçemeyecek büyüklükteki bir maddenin hücre içine alınması hangi olayla gerçekleşir?', ['Difüzyon', 'Osmoz', 'Endositoz', 'Ekzositoz', 'Aktif taşıma'], 2, 'Büyük maddeler zarın içeri çökmesiyle vezikül oluşturularak endositozla alınır.'),
    q('Mitoz bölünme sonucunda oluşan hücrelerin kromozom sayısı ana hücreye göre nasıldır?', ['Yarıya iner.', 'İki katına çıkar.', 'Aynı kalır.', 'Önce artar sonra sıfırlanır.', 'Canlı türüne göre daima değişir.'], 2, 'Mitozda kromozom sayısı korunur ve genetik açıdan benzer iki hücre oluşur.'),
    q('Fotosentez sırasında ışık enerjisini soğurarak sürecin başlamasını sağlayan pigment hangisidir?', ['Hemoglobin', 'Melanin', 'Klorofil', 'Keratin', 'İnsülin'], 2, 'Klorofil, ışık enerjisini soğurarak fotosentezde kullanılmasını sağlar.'),
  ] : name.includes('Coğrafya') ? [
    q('1/200.000 ölçekli haritada 3 cm gösterilen uzaklık gerçekte kaç kilometredir?', ['3', '6', '12', '20', '60'], 1, 'Haritada 1 cm gerçekte 200.000 cm = 2 km olduğundan 3 cm, 6 km’dir.', [['Ölçeği oku', 'Ölçek 1 bölü 200.000; haritadaki her 1 santimetre gerçekte 200.000 santimetreyi gösterir.'], ['Santimetreyi kilometreye çevir', '100.000 santimetre 1 kilometredir. 200.000 santimetre bu nedenle 2 kilometredir.'], ['Harita uzunluğunu uygula', 'Haritada 3 santimetre olduğuna göre gerçek uzaklık 3 çarpı 2 kilometredir.'], ['İşlemi bitir', '3 çarpı 2 = 6 kilometre. Cevap 6.']]),
    q('Bir izohips haritasında eğrilerin birbirine yaklaştığı yerde yeryüzü şekli genellikle nasıldır?', ['Eğim azdır.', 'Eğim fazladır.', 'Yükselti sıfırdır.', 'Akarsu yoktur.', 'Kıyı çizgisi vardır.'], 1, 'İzohipsler yakınsa kısa yatay mesafede büyük yükselti değişimi olur; eğim fazladır.'),
    q('Türkiye’de kıyı ile iç kesimler arasındaki ulaşımın dağlık alanlarda zorlaşmasının temel nedeni hangisidir?', ['Boylam farkının az olması', 'Dağların kıyıya paralel uzanması', 'Akarsuların kısa olması', 'Yıllık sıcaklık farkı', 'Bitki örtüsünün gür olması'], 1, 'Kuzey ve güney kıyılarında dağların kıyıya paralel uzanması kıyı-iç kesim ulaşımını zorlaştırır.'),
    q('Yerel saat farkının oluşmasının temel nedeni Dünya’nın hangi hareketidir?', ['Güneş çevresinde dolanması', 'Kendi ekseni çevresinde dönmesi', 'Eksen eğikliği', 'Yörüngesinin elips olması', 'Ay çevresinde dolanması'], 1, 'Dünya’nın batıdan doğuya dönmesi nedeniyle boylamlara göre yerel saat değişir.'),
  ] : name.includes('Tarih') ? [
    q('Tarih araştırmalarında olayların oluş sırasını belirlemeye yardımcı olan zaman bilimine ne ad verilir?', ['Arkeoloji', 'Kronoloji', 'Paleografya', 'Epigrafi', 'Nümizmatik'], 1, 'Kronoloji, olayları zaman sırasına koyan bilim dalıdır.'),
    q('Yazılı kaynakların bulunmadığı dönemlerin aydınlatılmasında aşağıdakilerden hangisi özellikle önem taşır?', ['Sözlü tarih ve arkeolojik buluntular', 'Resmî gazeteler', 'Nüfus sayımları', 'Diplomatik yazışmalar', 'Anı kitapları'], 0, 'Yazı öncesi dönemler maddi kalıntılar ve sözlü aktarımlar gibi kaynaklarla incelenir.'),
    q('Bir tarihçinin farklı kaynakları karşılaştırmasının temel amacı hangisidir?', ['Kaynak sayısını azaltmak', 'Bilgilerin doğruluğunu ve tutarlılığını sınamak', 'Tek bir yorumu zorunlu kılmak', 'Olayların tarihini değiştirmek', 'Yorum yapmayı engellemek'], 1, 'Kaynakları karşılaştırmak bilgilerin güvenilirliğini değerlendirmeyi sağlar.'),
    q('Bir olayın ortaya çıktığı dönemin koşulları içinde değerlendirilmesi hangi tarih yaklaşımına uygundur?', ['Anakronizm', 'Dönemin bağlamını gözetme', 'Coğrafi determinizm', 'Deneysel yöntem', 'Sözlü anlatım'], 1, 'Tarihsel olayları kendi döneminin koşulları içinde ele almak anakronik yargılardan kaçınmayı sağlar.'),
  ] : name.includes('Felsefe') ? [
    q('“Bilginin kaynağı deney ve gözlemdir.” görüşünü savunan yaklaşım hangisidir?', ['Rasyonalizm', 'Empirizm', 'Septisizm', 'İdealizm', 'Nihilizm'], 1, 'Empirizm, bilginin temel kaynağının deneyim olduğunu savunur.'),
    q('Bir düşünürün ileri sürdüğü görüşü gerekçeleriyle temellendirmesi felsefede hangi özelliği gösterir?', ['Dogmatizmi', 'Eleştirel ve temellendirici düşünmeyi', 'Ezberciliği', 'Deney yapmayı', 'Otoriteye bağlılığı'], 1, 'Felsefi düşünce iddiaları gerekçelendirmeyi ve eleştirel biçimde incelemeyi gerektirir.'),
    q('“Bir davranışın doğruluğu, ortaya çıkardığı yararlı sonuçlarla değerlendirilmelidir.” görüşü hangi etik yaklaşıma yakındır?', ['Faydacılık', 'Ödev ahlakı', 'Egoizm', 'Septisizm', 'Fatalizm'], 0, 'Faydacılık eylemleri sonuçları ve sağladıkları yarar üzerinden değerlendirir.'),
    q('Varlığın temelinde madde bulunduğunu savunan yaklaşım hangisidir?', ['Düalizm', 'Materyalizm', 'İdealizm', 'Fenomenoloji', 'Rasyonalizm'], 1, 'Materyalizm, varlığın temelinde maddenin bulunduğunu savunur.'),
  ] : name.includes('Din Kültürü') ? [
    q('İslam’da Ramazan ayında tan yerinin ağarmasından güneş batımına kadar yeme içmeden uzak durmayı ifade eden ibadet hangisidir?', ['Zekât', 'Oruç', 'Hac', 'Kurban', 'Sadaka'], 1, 'Ramazan ayında belirli süre yeme içmeden uzak durmak oruç ibadetidir.'),
    q('İslam’da Müslümanların günde beş vakit yerine getirdiği temel ibadet hangisidir?', ['Hac', 'Oruç', 'Namaz', 'Zekât', 'Kurban'], 2, 'Günde beş vakit yerine getirilen ibadet namazdır.'),
    q('İhtiyaç sahiplerine gönüllü olarak yapılan karşılıksız yardıma genel olarak ne ad verilir?', ['Sadaka', 'Farz', 'Hac', 'Ezan', 'İhram'], 0, 'Sadaka, kişinin gönüllü olarak yaptığı maddi veya manevi yardımdır.'),
    q('İslam’da farklılıkların ve çeşitliliğin insanlar arasında tanışma ve dayanışmaya vesile olması hangi değerle ilişkilidir?', ['Üstünlük yarışı', 'Birlikte yaşama ve karşılıklı saygı', 'Dışlama', 'Zorunlu benzerlik', 'İlgisizlik'], 1, 'Farklılıkların tanışmaya vesile olması, karşılıklı saygı ve birlikte yaşama anlayışını destekler.'),
  ] : name.includes('İngilizce') ? [
    q('Choose the correct option: They have lived in Ankara ___ 2020.', ['for', 'since', 'during', 'by', 'until'], 1, '“Since” is used with a starting point in time such as 2020.'),
    q('Choose the correct option: If I ___ more time, I would join the course.', ['have', 'had', 'will have', 'am having', 'has'], 1, 'The second conditional uses “if + past simple” and “would + verb”.'),
    q('Choose the correct option: The report ___ by the students yesterday.', ['writes', 'wrote', 'was written', 'has writing', 'is write'], 2, 'The passive form in the past is “was/were + past participle”.'),
    q('Choose the closest meaning of “rapid”.', ['slow', 'quick', 'careful', 'silent', 'rare'], 1, '“Rapid” means fast or quick.'),
  ] : name.includes('Edebiyat') ? [
    q('“Sanat toplum içindir.” anlayışını ve sade bir dil kullanımını öne çıkaran edebî dönem hangisidir?', ['Servetifünun', 'Millî Edebiyat', 'Fecriati', 'Divan edebiyatı', 'Tanzimat’ın ilk dönemi'], 1, 'Millî Edebiyat sanatçıları sade dil ve millî konular üzerinde durmuşlardır.'),
    q('Bir şiirde dizelerin sonunda ses benzerliği bulunmasına ne ad verilir?', ['Ölçü', 'Kafiye', 'Redif', 'Nazım birimi', 'Tema'], 1, 'Dize sonlarındaki ses benzerliği kafiyedir.'),
    q('“Sanat şahsi ve muhteremdir.” görüşüyle tanınan topluluk hangisidir?', ['Garipçiler', 'Fecriati', 'Millî Edebiyatçılar', 'İkinci Yeniciler', 'Beş Hececiler'], 1, 'Fecriati topluluğunun benimsediği görüş “Sanat şahsi ve muhteremdir.” sözüdür.'),
    q('Bir edebî eserde işlenen temel duygu veya düşünceye ne ad verilir?', ['Kafiye', 'Tema', 'Ölçü', 'Redif', 'Noktalama'], 1, 'Eserde işlenen temel duygu veya düşünce temadır.'),
  ] : null;
  if (content) return [first, ...content];
  const common = [
    make(`KONU · ${subject.topic.toLocaleUpperCase('tr-TR')}`, `Bir öğrenci ${subject.topic.toLocaleLowerCase('tr-TR')} konusundaki bir soruyu çözerken önce soru kökünü, sonra verilenleri inceliyor. Bu sıranın temel amacı nedir?`, ['İşlem sayısını artırmak', 'İstenenle verilenleri doğru eşleştirmek', 'Seçenekleri görmezden gelmek', 'Konuyu değiştirmek', 'Soruyu ezberlemek'], 'B', 'Önce neyin verildiğini ve neyin istendiğini belirlemek, uygun bilgiyi ve çözüm yolunu seçmeyi sağlar.', [['Soru kökünü belirle', 'Sorunun istediği sonucu saptamak gerekir.'], ['Verilenleri ayır', 'İlgili bilgiler istenenle eşleştirilir.'], ['Yöntemi seç', 'Doğru çözüm yolu bu eşleştirmeyle bulunur.']]),
    make(`KONU · ${subject.topic.toLocaleUpperCase('tr-TR')}`, `Bir kaynakta ${subject.topic.toLocaleLowerCase('tr-TR')} ile ilgili bilgi veriliyor. Bu bilgiyi yorumlarken en güvenilir başlangıç hangisidir?`, ['Yalnızca başlığa bakmak', 'Veri ve bağlamı birlikte değerlendirmek', 'İlk seçeneği işaretlemek', 'Ön bilgiyi kanıt saymak', 'Soru kökünü atlamak'], 'B', 'Bilgi, bağlamı ve dayanağıyla birlikte değerlendirilmelidir; yalnızca başlık veya ön kabul yeterli değildir.', [['Bilginin kapsamını oku', 'Kaynağın ne söylediğini belirle.'], ['Bağlamı kontrol et', 'Bilginin hangi koşullarda geçerli olduğuna bak.'], ['Kanıta dayalı yorumla', 'Veri ve bağlam birlikte değerlendirilir.']]),
    make(`KONU · ${subject.topic.toLocaleUpperCase('tr-TR')}`, `Bir öğrenci ${subject.topic.toLocaleLowerCase('tr-TR')} sorusunda iki seçeneği birbirinden ayıramıyor. En etkili ilk adım hangisidir?`, ['Soru kökünü yeniden okuyup seçenekleri verilenlerle karşılaştırmak', 'Rastgele seçim yapmak', 'En uzun seçeneği işaretlemek', 'Soruyu boş bırakıp konuyu değiştirmek', 'Bütün seçenekleri doğru saymak'], 'A', 'Soru kökünü ve verilenleri seçeneklerle karşılaştırmak, seçenekler arasındaki belirleyici farkı buldurur.', [['İstenen bilgiyi bul', 'Soru kökünün neyi ölçtüğünü belirle.'], ['Seçenekleri karşılaştır', 'Her seçeneği verilen bilgiyle kontrol et.'], ['Ayırt edici farkı seç', 'Kanıtla uyuşan seçenek doğru olur.']]),
    make(`KONU · ${subject.topic.toLocaleUpperCase('tr-TR')}`, `Bir sorunun çözümünü kontrol etmek isteyen öğrenci aşağıdakilerden hangisini yapmalıdır?`, ['Sonucu sorudaki koşullara geri uygulamak', 'Yalnızca işlem hızına bakmak', 'Çözüm basamaklarını silmek', 'Başka bir sorunun cevabını kullanmak', 'Soru kökünü değiştirmek'], 'A', 'Sonucu başlangıçtaki koşullarda yerine koymak veya yorumlamak, cevabın tutarlılığını denetler.', [['Sonucu geri taşı', 'Bulduğun cevabı verilen koşullarda değerlendir.'], ['Koşulları denetle', 'Sonucun tüm bilgilerle uyuşup uyuşmadığına bak.'], ['Tutarlılığı doğrula', 'Uyuşuyorsa çözüm kontrol edilmiştir.']]),
  ];
  if (name.includes('Matematik')) {
    const vals = [[4, 7, 25], [5, 3, 22], [2, 9, 17], [6, 4, 31]];
    const math = vals.map(([a,b,c]) => { const x=(c+b)/a; return make('KONU · TEMEL KAVRAMLAR', `Bir sayının ${a} katının ${b} fazlası ${c} ise bu sayı kaçtır?`, [String(x-2), String(x), String(x+1), String(x+2), String(x+3)], 'B', `x bilinmeyen sayı olsun. ${a}x + ${b} = ${c}; buradan x = ${x} bulunur.`, [['Denklemi kur', `${a}x + ${b} = ${c}`], ['Bilinmeyeni yalnız bırak', `${a}x = ${c-b}`], ['Sonucu bul', `x = ${x} ✓`]]); });
    return [first, ...math];
  }
  return [first, ...common];
}

function startQuestion(subjectName, carryId = null) {
  activeCarryId = carryId;
  const carryTask = carryId ? daily.carry.find(task => task.id === carryId) : null;
  activeSubject = carryTask?.subject || allSubjects().find(x => x.name === subjectName) || activeSubjects()[0] || TYT_SUBJECTS[1];
  if (!carryTask) daily.tasks[activeSubject.name] ||= { subject: activeSubject, done: 0, target: Math.max(5, Number(planSetting(activeSubject.name).target) || 5) };
  const p = carryTask || dailyTask(activeSubject.name);
  const target = p.target;
  activeQuestionTarget = target;
  if (p.done >= target) { toast(`${activeSubject.name} günlük hedefine ulaştı.`); return; }
  questionNumber = p.done + 1;
  questionStartedAt = Date.now();
  answeredThisSession = false;
  $('#questionSubject').textContent = `${activeSubject.exam} · ${activeSubject.name.toLocaleUpperCase('tr-TR')}`;
  $('#questionCounter').textContent = `Soru ${questionNumber} / ${target}`;
  $('#questionProgress').style.width = `${(questionNumber - 1) / target * 100}%`;
  currentSample = unseenSample(activeSubject);
  if (!currentSample) { toast(`${activeSubject.name} için yeni soru kalmadı. Aynı soru tekrar gösterilmedi.`); return; }
  markQuestionSeen(currentSample);
  renderMockSchedule();
  $('#questionTopic').textContent = currentSample.topic;
  $('#questionTitle').textContent = currentSample.prompt;
  $('#answerList').innerHTML = currentSample.options.map((option, i) => `<button data-answer="${String.fromCharCode(65 + i)}">${String.fromCharCode(65 + i)} <span>${escapeHTML(option)}</span></button>`).join('');
  $$('#answerList button').forEach(button => button.addEventListener('click', () => answerQuestion(button)));
  $('#answerList').classList.remove('hidden');
  $('#solutionBox').classList.add('hidden');
  $('#nextQuestion').classList.remove('hidden');
  $('#nextQuestion').textContent = 'Boş bırak ve devam et →';
  $('#questionHint').classList.remove('hidden');
  $('#questionHint').textContent = 'Cevabını seç; önce kendi başına denemeni istiyorum.';
  $('#questionDialog').showModal();
  setupBoard('solutionBoard'); requestAnimationFrame(() => { resizeBoard('solutionBoard'); clearBoard('solutionBoard'); });
}

function answerQuestion(button) {
  if (answeredThisSession) return;
  answeredThisSession = true;
  const correctKey = currentSample.correct;
  const isCorrect = button.dataset.answer === correctKey;
  button.classList.add('selected');
  $$('.answer-list button').forEach(el => el.disabled = true);
  $('#questionHint').classList.remove('hidden');
  $('#questionHint').textContent = 'Yanıtın kaydedildi. Doğru cevap ve çözüm, oturum tamamlandığında yalnızca yanlış ve boş sorular için açılacak.';
  $('#solutionBox').classList.add('hidden');
  $('#nextQuestion').classList.remove('hidden');
  $('#nextQuestion').textContent = 'Sonraki soru →';
  if (!isCorrect) {
    dailyReviewQueue.push({ subject: activeSubject, sample: currentSample, answer: button.dataset.answer });
    saveStore('yk-daily-review', dailyReviewQueue);
  }
  const target = activeQuestionTarget;
  $('#questionProgress').style.width = `${questionNumber / target * 100}%`;
  let p = subjectProgress(activeSubject.name);
  p.done += 1;
  p.correct += isCorrect ? 1 : 0;
  p.seconds += Math.max(1, Math.round((Date.now() - questionStartedAt) / 1000));
  progress[activeSubject.name] = p;
  saveStore('yk-progress', progress);
  daily.answered += 1;
  daily.correct += isCorrect ? 1 : 0;
  daily.seconds += Math.max(1, Math.round((Date.now() - questionStartedAt) / 1000));
  const task = activeCarryId ? daily.carry.find(item => item.id === activeCarryId) : daily.tasks[activeSubject.name];
  if (task) task.done = Math.min(task.target, task.done + 1);
  if (activeCarryId && task?.done >= task.target) daily.carry = daily.carry.filter(item => item.id !== activeCarryId);
  saveStore('yk-daily', daily);
  renderMetrics();
  toast('Cevabın kaydedildi. Çözümler oturum sonunda gösterilecek.');
}

function openDailyReview() {
  reviewQueue = (Array.isArray(dailyReviewQueue) ? dailyReviewQueue : []).filter(item =>
    typeof item?.subject?.name === 'string' && typeof item.sample?.prompt === 'string' &&
    typeof item.sample.topic === 'string' && Array.isArray(item.sample.options) &&
    typeof item.sample.correct === 'string' && typeof item.sample.explanation === 'string' &&
    Array.isArray(item.sample.steps) && item.sample.steps.every(step => Array.isArray(step) && typeof step[0] === 'string' && typeof step[1] === 'string')
  );
  $('#mockReviewTitle').textContent = 'Günlük çalışma tamamlandı';
  $('#mockReviewSummary').textContent = `${reviewQueue.length} yanlış veya boş soru için çözümler`;
  $('#mockWrongList').innerHTML = reviewQueue.map((item, index) => {
    const selected = item.answer ? `${item.answer}) ${item.sample.options[item.answer.charCodeAt(0) - 65]}` : 'Boş bırakıldı';
    const correctText = `${item.sample.correct}) ${item.sample.options[item.sample.correct.charCodeAt(0) - 65]}`;
    return `<article class="mock-wrong-item"><span class="question-topic">${escapeHTML(item.subject.name)} · ${escapeHTML(item.sample.topic)}</span><h3>${escapeHTML(item.sample.prompt)}</h3><div class="mock-answer-review"><span class="wrong-answer">Senin cevabın: ${escapeHTML(selected)}</span><strong>Doğru cevap: ${escapeHTML(correctText)}</strong></div><p>${escapeHTML(item.sample.explanation)}</p><div class="mock-review-steps">${item.sample.steps.map(([title, detail], step) => `<div><b>${step + 1}</b><span><strong>${escapeHTML(title)}</strong><small>${escapeHTML(detail)}</small></span></div>`).join('')}</div><button class="small-button" data-speak-one="${index}">Bu çözümü seslendir 🔊</button></article>`;
  }).join('') || '<div class="schedule-empty">Harika! Yanlış veya boş sorun yok.</div>';
  const reviewDialog = $('#mockReviewDialog');
  reviewDialog.classList.add('review-fallback');
  reviewDialog.setAttribute('open', '');
  if (reviewQueue.length && 'speechSynthesis' in window) setTimeout(() => speakReviewAt(0), 250);
  dailyReviewQueue = [];
  saveStore('yk-daily-review', dailyReviewQueue);
}

$$('[data-page]').forEach(button => button.addEventListener('click', () => goToPage(button.dataset.page)));
$$('[data-goto]').forEach(button => button.addEventListener('click', () => goToPage(button.dataset.goto)));
$$('.answer-list button').forEach(button => button.addEventListener('click', () => answerQuestion(button)));
$('#startSession').addEventListener('click', () => {
  const next = activeSubjects().find(subject => dailyTask(subject.name).done < dailyTask(subject.name).target);
  if (next) startQuestion(next.name); else toast('Bugünkü soru hedeflerinin hepsi tamamlandı.');
});
$('#nextQuestion').addEventListener('click', event => {
  event.preventDefault();
  if (!answeredThisSession) {
    dailyReviewQueue.push({ subject: activeSubject, sample: currentSample, answer: null });
    saveStore('yk-daily-review', dailyReviewQueue);
    const skippedTask = activeCarryId ? daily.carry.find(item => item.id === activeCarryId) : daily.tasks[activeSubject.name];
    if (skippedTask) skippedTask.done = Math.min(skippedTask.target, skippedTask.done + 1);
    saveStore('yk-daily', daily);
    renderMetrics();
  }
  if (questionNumber >= activeQuestionTarget) {
    $('#questionDialog').close();
    toast(`${activeSubject.name}: görev tamamlandı!`);
    activeCarryId = null;
    setTimeout(openDailyReview, 120);
    return;
  }
  startQuestion(activeSubject.name, activeCarryId);
});
$('#editPlan').addEventListener('click', openPlanner);
$('#planSettings').addEventListener('click', openPlanner);
$('#openPickedQuestion').addEventListener('click', () => startQuestion($('#questionPicker').value));

let questionAttachment = null;
function readFileData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error('Dosya okunamadı.'));
    reader.readAsDataURL(file);
  });
}
async function prepareAttachment(file) {
  if (/^text\//.test(file.type) || /\.(txt|md)$/i.test(file.name)) {
    $('#outsideQuestionText').value = await file.text(); $('#outsideQuestionStatus').textContent = 'Metin soruya eklendi. Öğretmene gönderebilirsin.'; return;
  }
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/msword', 'application/rtf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.oasis.opendocument.text', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv', 'text/tab-separated-values', 'application/json'];
  if (!allowedTypes.includes(file.type)) { toast('Görsel, PDF, Word, PowerPoint, Excel veya metin dosyası seç.'); return; }
  if (file.size > 6 * 1024 * 1024) { toast('Dosya en fazla 6 MB olabilir.'); return; }
  let data = await readFileData(file), mimeType = file.type;
  if (file.type.startsWith('image/') && file.type !== 'image/gif') {
    const image = new Image(); image.src = data; await image.decode();
    const scale = Math.min(1, 1800 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas'); canvas.width = Math.round(image.naturalWidth * scale); canvas.height = Math.round(image.naturalHeight * scale);
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height); data = canvas.toDataURL('image/jpeg', .82); mimeType = 'image/jpeg';
  }
  questionAttachment = { name: file.name, mimeType, data };
  $('#questionAttachmentName').textContent = file.name; $('#questionAttachmentPreview').classList.remove('hidden');
  $('#outsideQuestionStatus').textContent = 'Dosya hazır. Öğretmene gönderdiğinde soru açıklama için işlenecek.';
}
for (const input of [$('#questionCamera'), $('#questionFile')]) input.addEventListener('change', async () => {
  const file = input.files?.[0]; if (!file) return;
  try { await prepareAttachment(file); } catch { toast('Dosya açılamadı. Başka bir dosya dene.'); }
  input.value = '';
});
$('#removeQuestionAttachment').addEventListener('click', () => { questionAttachment = null; $('#questionAttachmentPreview').classList.add('hidden'); $('#outsideQuestionStatus').textContent = 'Dosya kaldırıldı.'; });
$('#solveOutsideQuestion').addEventListener('click', async () => {
  const question = $('#outsideQuestionText').value.trim();
  if (!question && !questionAttachment) { toast('Soruyu yaz veya bir fotoğraf/PDF ekle.'); return; }
  if (!currentAccountUser) { toast('Öğretmene soru göndermek için hesabına giriş yap.'); goToPage('account'); return; }
  const button = $('#solveOutsideQuestion'), status = $('#outsideQuestionStatus');
  button.disabled = true; status.textContent = 'Öğretmenin soruyu inceliyor…'; $('#teacherAnswer').classList.add('hidden');
  try {
    const response = await fetch('/api/solve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question, attachment: questionAttachment }) });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Soru çözülemedi.');
    $('#teacherAnswerText').innerHTML = escapeHTML(payload.answer).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/^###?\s+(.*)$/gm, '<strong>$1</strong>').replace(/\n/g, '<br>');
    $('#teacherAnswer').classList.remove('hidden'); status.textContent = 'Çözüm hazır. İstersen sesli dinle, sonra tahtada kendi çözümünü dene.';
    requestAnimationFrame(() => resizeBoard('outsideBoard'));
  } catch (error) { status.textContent = error.message || 'Bağlantı kurulamadı. Yeniden deneyebilirsin.'; }
  finally { button.disabled = false; }
});
$('#speakTeacherAnswer').addEventListener('click', () => {
  if (!('speechSynthesis' in window)) { toast('Bu tarayıcı sesli anlatımı desteklemiyor.'); return; }
  const paragraphs = $('#teacherAnswerText').innerText.split(/\n+/).filter(Boolean);
  speakTeacherSequence(['Hadi soruyu beraber çözelim. Önce verilenleri bulalım, sonra işlemi adım adım yapalım.', ...paragraphs, 'Güzel ilerledin. Sonucu bir kez daha kontrol edelim.']);
});
$('#stopTeacherAnswer').addEventListener('click', stopTeacherSpeech);
document.addEventListener('click', event => {
  const clear = event.target.closest('[data-board-clear]'); if (clear) clearBoard(clear.dataset.boardClear);
  const undo = event.target.closest('[data-board-undo]'); if (undo) undoBoard(undo.dataset.boardUndo);
});
$('#goalForm').addEventListener('submit', event => {
  event.preventDefault();
  const tyt = Number($('#goalTyt').value), ayt = Number($('#goalAyt').value);
  if (tyt <= 0 || tyt > 120 || ayt <= 0 || ayt > 80) { toast('TYT hedefi 0–120, AYT/YDT hedefi 0–80 net arasında olmalı.'); return; }
  const fields = { say: 'Sayısal', ea: 'Eşit Ağırlık', soz: 'Sözel', dil: 'Dil' };
  goals.push({ id: String(Date.now()), program: $('#goalProgram').value.trim(), university: $('#goalUniversity').value.trim(), field: fields[$('#goalField').value], tyt, ayt });
  saveStore('yk-goals', goals);
  event.currentTarget.reset();
  $('#goalField').value = profile.field;
  renderGoalPanel(); toast('Üniversite hedefin kaydedildi.');
});
$('#currentNetForm').addEventListener('submit', event => {
  event.preventDefault();
  currentMockNets = { tyt: Number($('#currentTyt').value) || 0, ayt: Number($('#currentAyt').value) || 0 };
  saveStore('yk-current-nets', currentMockNets); renderGoalPanel(); toast('Son deneme netlerin güncellendi.');
});
document.addEventListener('click', event => {
  const mockButton = event.target.closest('[data-start-mock]');
  if (mockButton) { startMock(mockButton.dataset.startMock); return; }
  const speakButton = event.target.closest('[data-speak-one]');
  if (speakButton) { speakReviewAt(Number(speakButton.dataset.speakOne)); return; }
  const remove = event.target.closest('[data-remove-goal]');
  if (!remove) return;
  goals = goals.filter(goal => goal.id !== remove.dataset.removeGoal);
  saveStore('yk-goals', goals); renderGoalPanel(); toast('Hedef kaldırıldı.');
});

$('#saveMockSchedule').addEventListener('click', () => {
  const value = $('#mockStartDate').value;
  if (!value || localNoon(value).getDay() !== 6) { toast('İlk deneme tarihi cumartesi olmalı.'); $('#mockStartDate').value = mockSchedule.startSaturday; return; }
  mockSchedule.startSaturday = value;
  saveStore('yk-mock-schedule', mockSchedule);
  renderMockSchedule(); toast('Haftalık deneme tarihi güncellendi.');
});
$('#mockPrevious').addEventListener('click', () => { if (mockExam?.index > 0) { mockExam.index -= 1; renderMockQuestion(); } });
$('#mockNext').addEventListener('click', () => {
  if (!mockExam) return;
  if (mockExam.index < mockExam.questions.length - 1) { mockExam.index += 1; renderMockQuestion(); }
  else finishMock();
});
$('#finishMock').addEventListener('click', () => finishMock());
$('#closeMockExam').addEventListener('click', () => {
  if (!window.confirm('Bu denemeden çıkarsan yanıtların sonuçlara eklenmeyecek. Çıkmak istiyor musun?')) return;
  clearInterval(mockTimerHandle); mockExam = null; $('#mockExamDialog').close();
});
$('#mockExamDialog').addEventListener('close', () => { clearInterval(mockTimerHandle); mockExam = null; });
$('#mockExamDialog').addEventListener('cancel', event => {
  if (!window.confirm('Sınavı kapatıp yanıtlarını kaybetmek istiyor musun?')) event.preventDefault();
});
$('#closeMockReview').addEventListener('click', () => { stopTeacherSpeech(); $('#mockReviewDialog').close(); });
$('#mockReviewDialog').addEventListener('close', stopTeacherSpeech);
$('#speakWrongAnswers').addEventListener('click', () => {
  if (!reviewQueue.length) { toast('Seslendirilecek yanlış veya boş cevap yok.'); return; }
  if (!('speechSynthesis' in window)) { toast('Bu tarayıcı sesli anlatımı desteklemiyor.'); return; }
  speakReviewAt(0);
});
$('#stopWrongAnswers').addEventListener('click', stopTeacherSpeech);
$$('[data-auth-tab]').forEach(button => button.addEventListener('click', () => {
  const mode = button.dataset.authTab;
  $$('[data-auth-tab]').forEach(tab => tab.classList.toggle('active', tab === button));
  $('#loginForm').classList.toggle('hidden', mode !== 'login');
  $('#registerForm').classList.toggle('hidden', mode !== 'register');
  $('#authNotice').classList.add('hidden');
}));

function setAccountSession(user) {
  const signedIn = Boolean(user);
  currentAccountUser = user || null;
  authInitialized = true;
  $('#appShell').classList.remove('auth-pending');
  $('#appShell').classList.toggle('auth-locked', !signedIn);
  $('#accountSession').classList.toggle('hidden', !signedIn);
  $('.auth-switch').classList.toggle('hidden', signedIn);
  $('#loginForm').classList.toggle('hidden', signedIn || !$('.auth-tab[data-auth-tab="login"]').classList.contains('active'));
  $('#registerForm').classList.toggle('hidden', signedIn || !$('.auth-tab[data-auth-tab="register"]').classList.contains('active'));
  if (!signedIn) {
    $('#profileButton .avatar').textContent = '•';
    $('#profileButton .profile-copy strong').textContent = 'Giriş yap';
    $('#profileButton .profile-copy small').textContent = 'Hesap bilgilerini aç';
    goToPage('account');
    return;
  }
  $('#profileButton .avatar').textContent = [...user.name.trim()][0]?.toLocaleUpperCase('tr-TR') || 'Ö';
  $('#profileButton .profile-copy strong').textContent = user.name;
  $('#profileButton .profile-copy small').textContent = `${user.accountType === 'parent' ? 'Veli hesabı' : 'Öğrenci hesabı'} · 14 gün deneme`;
  const welcome = $('#welcomeName');
  if (welcome) welcome.textContent = user.name.split(/\s+/)[0];
  const expiry = new Date(user.trialEndsAt);
  $('#accountGreeting').textContent = `${user.name} · ${user.accountType === 'parent' ? 'Veli hesabı' : 'Öğrenci hesabı'}`;
  $('#trialStatus').textContent = user.trialActive
    ? `Ücretsiz denemede · ${user.trialDaysRemaining} gün kaldı`
    : '14 günlük ücretsiz deneme süren doldu';
  $('#trialStatus').classList.toggle('trial-expired', !user.trialActive);
  $('#trialEndDate').textContent = `Deneme bitişi: ${new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(expiry)}`;
  if (currentPage === 'account') goToPage('today');
}

function showAuthNotice(message, isError = false) {
  const notice = $('#authNotice');
  notice.textContent = message;
  notice.classList.toggle('error', isError);
  notice.classList.remove('hidden');
}

async function requestAuth(path, body) {
  const response = await fetch(path, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    credentials: 'same-origin',
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'İşlem tamamlanamadı.');
  return result;
}

requestAuth('/api/auth/session').then(result => setAccountSession(result.user)).catch(() => setAccountSession(null));

$('#loginForm').addEventListener('submit', event => {
  event.preventDefault();
  const submit = $('#loginForm button[type="submit"]');
  submit.disabled = true;
  requestAuth('/api/auth/login', { email: $('#loginEmail').value, password: $('#loginPassword').value })
    .then(({ user }) => { setAccountSession(user); $('#loginForm').reset(); if (!localStorage.getItem('yk-profile')) { seedOnboarding(); $('#onboardingDialog').showModal(); } toast('Giriş başarılı.'); })
    .catch(error => showAuthNotice(error.message, true))
    .finally(() => { submit.disabled = false; });
});
$('#registerForm').addEventListener('submit', event => {
  event.preventDefault();
  const submit = $('#registerForm button[type="submit"]');
  submit.disabled = true;
  requestAuth('/api/auth/register', {
    name: $('#registerName').value,
    email: $('#registerForm input[type="email"]').value,
    password: $('#registerForm input[type="password"]').value,
    accountType: $('#accountType').value,
  }).then(({ user }) => {
    $('#registerForm').reset();
    setAccountSession(user);
    seedOnboarding();
    $('#onboardingDialog').showModal();
    toast('Hesabın oluşturuldu. 14 günlük ücretsiz denemen başladı.');
  }).catch(error => showAuthNotice(error.message, true))
    .finally(() => { submit.disabled = false; });
});
$('#logoutButton').addEventListener('click', () => {
  requestAuth('/api/auth/logout', {}).then(() => {
    setAccountSession(null);
    $('.auth-tab[data-auth-tab="login"]').click();
    toast('Hesabından çıkış yaptın.');
  }).catch(error => showAuthNotice(error.message, true));
});
$('#membershipPlan').addEventListener('change', event => {
  const amount = Number(event.target.value);
  $('#paymentAmount').textContent = amount ? `${amount.toLocaleString('tr-TR')} ₺` : '0 ₺';
  const paid = amount > 0;
  const cardFields = $$('#paymentForm [autocomplete^="cc-"]');
  cardFields.forEach(input => { input.disabled = !paid; input.closest('label').classList.toggle('hidden', !paid); });
  $('.payment-row').classList.toggle('hidden', !paid);
});
$('#paymentForm').addEventListener('submit', event => {
  event.preventDefault();
  const notice = $('#paymentNotice');
  notice.textContent = Number($('#membershipPlan').value) > 0
    ? 'Ödeme sağlayıcısı bağlı değil. Kart bilgileri saklanmadı ve ücret alınmadı.'
    : 'Ücretsiz plan seçildi. Hesap oluşturma servisi bağlı olmadığı için üyelik başlatılmadı.';
  notice.classList.remove('hidden');
});
$('#membershipPlan').value = '0';
$('#membershipPlan').dispatchEvent(new Event('change'));
$('#parentOptIn').addEventListener('change', event => {
  $('#parentFields').classList.toggle('hidden', !event.target.checked);
  $('#parentEmail').required = event.target.checked;
});
$('#saveOnboarding').addEventListener('click', event => {
  event.preventDefault();
  if ($('#parentOptIn').checked && (!$('#parentEmail').value.trim() || !$('#parentEmail').validity.valid)) {
    toast('Veli hesabı için geçerli bir e-posta adresi gir.'); $('#parentEmail').focus(); return;
  }
  profile.grade = $('#gradeSelect').value;
  profile.field = $('#fieldSelect').value;
  profile.parentOptIn = $('#parentOptIn').checked;
  profile.parentEmail = profile.parentOptIn ? $('#parentEmail').value.trim() : '';
  saveStore('yk-profile', profile);
  reconcilePlan(); saveStore('yk-plan', plan);
  $('#profileButton .profile-copy small').textContent = `${profile.grade} · ${fieldName()}`;
  $('#questionDialog').close(); $('#onboardingDialog').close();
  renderMetrics(); toast('Çalışma planın güncellendi.');
});
function seedOnboarding() {
  $('#gradeSelect').value = profile.grade;
  $('#fieldSelect').value = profile.field;
  $('#parentOptIn').checked = profile.parentOptIn;
  $('#parentFields').classList.toggle('hidden', !profile.parentOptIn);
  $('#parentEmail').required = profile.parentOptIn;
  $('#parentEmail').value = profile.parentEmail || '';
}
$('#parentReminders').addEventListener('click', () => toast('Hatırlatma saati ayarı sonraki sürümde açılacak.'));
$('#unlinkParent').addEventListener('click', () => toast('Veli hesabı yönetimi kayıt ve güvenli doğrulama servisiyle bağlanacak.'));
$('#profileButton').addEventListener('click', () => {
  if (!currentAccountUser) { goToPage('account'); return; }
  seedOnboarding(); $('#onboardingDialog').showModal();
});
$('#onboardingDialog').addEventListener('close', () => { if (!profile.grade || !profile.field) { profile = { ...DEFAULTS }; } });
document.addEventListener('click', event => {
  const carryButton = event.target.closest('[data-carry-id]');
  if (carryButton) {
    const task = daily.carry.find(item => item.id === carryButton.dataset.carryId);
    if (task) startQuestion(task.subject.name, task.id);
    return;
  }
  const button = event.target.closest('[data-subject]');
  if (button) startQuestion(button.dataset.subject);
});

function renderPlanner() {
  reconcilePlan();
  $('#plannerStart').value = plan.startTime || '16:00';
  $('#plannerBreak').value = String(plan.breakMin || 5);
  $('#plannerSubjects').innerHTML = allSubjects().map(subject => {
    const settings = planSetting(subject.name);
    return `<div class="planner-subject-row"><label class="planner-course"><input type="checkbox" data-active="${escapeHTML(subject.name)}" ${settings.active ? 'checked' : ''}><span class="subject-badge ${subject.kind}">${subject.icon}</span><span><strong>${escapeHTML(subject.name)}</strong><small>${subject.exam} · ${escapeHTML(subject.topic)}</small></span></label><label class="planner-count"><input type="number" min="5" step="1" value="${Math.max(5, Number(settings.target) || 5)}" data-target="${escapeHTML(subject.name)}" ${settings.active ? '' : 'disabled'}><span>soru</span></label></div>`;
  }).join('');
  previewPlanner();
}

function previewPlanner() {
  const rows = $$('.planner-subject-row', $('#plannerSubjects'));
  let count = 0, questions = 0;
  rows.forEach(row => {
    const check = $('input[data-active]', row);
    const amount = $('input[data-target]', row);
    if (check.checked) { count++; questions += Math.max(5, Number(amount.value) || 5); }
    amount.disabled = !check.checked;
  });
  $('#plannerTotals').textContent = `${count} ders · ${questions} soru`;
}

function openPlanner() {
  renderPlanner();
  $('#plannerDialog').showModal();
}

$('#plannerSubjects').addEventListener('input', previewPlanner);
$('#plannerSubjects').addEventListener('change', previewPlanner);
$('#savePlan').addEventListener('click', event => {
  event.preventDefault();
  const rows = $$('.planner-subject-row', $('#plannerSubjects'));
  const selected = rows.filter(row => $('input[data-active]', row).checked);
  if (!selected.length) { toast('Günlük programında en az bir ders seç.'); return; }
  for (const row of rows) {
    const name = $('input[data-active]', row).dataset.active;
    const active = $('input[data-active]', row).checked;
    const amount = $('input[data-target]', row);
    amount.value = String(Math.max(5, Math.floor(Number(amount.value) || 5)));
    plan.subjects[name] = { active, target: Number(amount.value) };
  }
  plan.startTime = $('#plannerStart').value || '16:00';
  plan.breakMin = Number($('#plannerBreak').value) || 5;
  for (const subject of activeSubjects()) {
    const target = Math.max(5, Number(planSetting(subject.name).target) || 5);
    daily.tasks[subject.name] ||= { subject, done: 0, target };
    daily.tasks[subject.name].subject = subject;
    daily.tasks[subject.name].target = target;
  }
  saveStore('yk-plan', plan);
  saveStore('yk-daily', daily);
  $('#plannerDialog').close(); renderMetrics(); toast('Günlük çalışma programın güncellendi.');
});

$('#profileButton .profile-copy small').textContent = 'Hesap bilgilerini aç';
const goalFieldLabel = document.createElement('label');
goalFieldLabel.textContent = 'Puan türü';
const goalFieldSelect = document.createElement('select');
goalFieldSelect.id = 'goalField'; goalFieldSelect.className = 'select-chip';
goalFieldSelect.innerHTML = '<option value="say">Sayısal</option><option value="ea">Eşit Ağırlık</option><option value="soz">Sözel</option><option value="dil">Dil</option>';
goalFieldSelect.value = profile.field;
goalFieldLabel.append(goalFieldSelect);
$('#goalForm .goal-net-fields').before(goalFieldLabel);
reconcilePlan();
prepareDailyRecord();
initMockSchedule();
seedOnboarding();
renderMetrics();

