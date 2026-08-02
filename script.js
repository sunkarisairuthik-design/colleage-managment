// CampusHub - Local-only script
// Seeds sample students, assignments, and timetable so the app works fully offline.

const assignmentsKey = 'college-assignments';
const timetableKey = 'college-timetable';
const storageKey = 'college-management-students';

const demoUsers = [
  { role: 'student', username: 'student', password: 'student123', displayName: 'Aanya Sharma' },
  { role: 'faculty', username: 'faculty', password: 'faculty123', displayName: 'Prof. Mehta' }
];

const seededStudents = [
  { name: 'Aanya Sharma', course: 'Computer Science', batch: '2024', attendance: 0 },
  { name: 'Rohan Verma', course: 'Mechanical', batch: '2023', attendance: 0 },
  { name: 'Meera Iyer', course: 'Commerce', batch: '2024', attendance: 0 },
  { name: 'Vikram Singh', course: 'Electronics', batch: '2023', attendance: 0 },
  { name: 'Sana Patel', course: 'Information Technology', batch: '2025', attendance: 0 },
  { name: 'Arjun Das', course: 'Civil', batch: '2024', attendance: 0 },
  { name: 'Priya Nair', course: 'Computer Science', batch: '2025', attendance: 0 },
  { name: 'Karan Malhotra', course: 'Information Technology', batch: '2024', attendance: 0 },
  { name: 'Lakshmi Rao', course: 'Commerce', batch: '2023', attendance: 0 },
  { name: 'Devansh Patel', course: 'Mechanical', batch: '2025', attendance: 0 }
];

const seededAssignments = [
  { id: 1, title: 'Data Structures - HW1', due: '2026-08-10', desc: 'Implement linked list operations', createdBy: 'Prof. Mehta', submissions: [] },
  { id: 2, title: 'Mathematics - Quiz', due: '2026-08-11', desc: 'Chapter 3 and 4', createdBy: 'Prof. Mehta', submissions: [] },
  { id: 3, title: 'Web Design - Project', due: '2026-08-15', desc: 'Create a responsive portfolio', createdBy: 'Prof. Mehta', submissions: [] },
  { id: 4, title: 'Physics Lab - Report', due: '2026-08-13', desc: 'Experiment 5 report', createdBy: 'Prof. Mehta', submissions: [] },
  { id: 5, title: 'Design Studio - Sketches', due: '2026-08-12', desc: 'Portfolio sketches for review', createdBy: 'Prof. Mehta', submissions: [ { student: 'Aanya Sharma', note: 'Submitted images', status: 'Submitted', submittedAt: '2026-08-01' } ] }
];

// Full-week timetable: Mon-Fri with hourly slots from 08:00–15:00 (8 AM start, last slot starts 15:00 -> ends 16:00)
const seededTimetable = [];
const week = ['Monday','Tuesday','Wednesday','Thursday','Friday'];
const periods = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00'];
const subjects = ['Data Structures','Mathematics','Web Design','Physics Lab','Design Studio','Professional Ethics','Electronics','Mechanics','Thermodynamics','Database Systems'];
let ttId = 2000;
for (let d = 0; d < week.length; d++) {
  for (let p = 0; p < periods.length; p++) {
    const subject = subjects[(d * periods.length + p) % subjects.length];
    seededTimetable.push({ id: ttId++, day: week[d], time: periods[p], subject });
  }
}

// Elements
const loginForm = document.getElementById('loginForm');
const authScreen = document.getElementById('authScreen');
const appShell = document.getElementById('appShell');
const authError = document.getElementById('authError');
const logoutBtn = document.getElementById('logoutBtn');
const studentView = document.getElementById('studentView');
const facultyView = document.getElementById('facultyView');
const pageTitle = document.getElementById('pageTitle');
const userBadge = document.getElementById('userBadge');
const studentAttendanceValue = document.getElementById('studentAttendanceValue');
const studentProfileNameEls = document.querySelectorAll('#studentProfileName');
const studentProfileCard = document.getElementById('studentProfileCard');
const studentProgressList = document.getElementById('studentProgressList');
const attendanceHistoryList = document.getElementById('attendanceHistoryList');
const studentList = document.getElementById('studentList');
const studentCount = document.getElementById('studentCount');
const attendanceAverage = document.getElementById('attendanceAverage');
const assignmentForm = document.getElementById('assignmentForm');
const assignmentListEl = document.getElementById('assignmentList');
const assignmentSubmissionsEl = document.getElementById('assignmentSubmissions');
const timetableForm = document.getElementById('timetableForm');
const timetableListEl = document.getElementById('timetableList');
const settingsForm = document.getElementById('settingsForm');
const settingNameInput = document.getElementById('settingName');
const assignmentsEl = document.getElementById('assignments');
const timetableEl = document.getElementById('timetable');
const settingsEl = document.getElementById('settings');
const facultyDashboardEl = document.getElementById('facultyDashboard');
const facultyAttendanceEl = document.getElementById('facultyAttendance');
const facultyDashboardContent = document.getElementById('facultyDashboardContent');
const pendingReviewsEl = document.getElementById('pendingReviews');

// State
let students = JSON.parse(localStorage.getItem(storageKey) || 'null') || seededStudents.slice();
let assignments = JSON.parse(localStorage.getItem(assignmentsKey) || 'null') || seededAssignments.slice();
let timetable = JSON.parse(localStorage.getItem(timetableKey) || 'null') || seededTimetable.slice();
let currentUser = JSON.parse(sessionStorage.getItem('college-current-user') || 'null');

// Ensure seeded data persisted if localStorage was empty
if (!localStorage.getItem(storageKey)) saveStudents();
if (!localStorage.getItem(assignmentsKey)) saveAssignments();
if (!localStorage.getItem(timetableKey)) saveTimetable();

// Compute attendance based on timetable periods: deterministic per-student presence
function computeAttendanceFromTimetable() {
  const totalPeriods = timetable.length || seededTimetable.length;
  if (!totalPeriods) return;
  // Ensure timetable state exists (if localStorage empty, use seededTimetable)
  if (!timetable || !timetable.length) timetable = seededTimetable.slice();

  // deterministic hash to get a pseudo-random attendance probability per student
  function nameHash(s) { let h=0; for (let i=0;i<s.length;i++) h = (h*31 + s.charCodeAt(i)) >>> 0; return h; }

  students.forEach(st => {
    const h = nameHash(st.name);
    // map hash to a probability between 0.7 and 0.95
    const prob = 0.7 + ((h % 26) / 100);
    // simulate presence count
    const present = Math.round(prob * totalPeriods);
    st.attendance = Math.round((present / totalPeriods) * 100);
  });
  saveStudents();
}

// initialize attendance from timetable if not already computed
computeAttendanceFromTimetable();

function saveStudents() { localStorage.setItem(storageKey, JSON.stringify(students)); }
function saveAssignments() { localStorage.setItem(assignmentsKey, JSON.stringify(assignments)); }
function saveTimetable() { localStorage.setItem(timetableKey, JSON.stringify(timetable)); }

function setCurrentUser(user) {
  currentUser = user;
  if (user) sessionStorage.setItem('college-current-user', JSON.stringify(user));
  else sessionStorage.removeItem('college-current-user');
}

function updateStats() {
  if (!studentCount || !attendanceAverage) return;
  const total = students.length;
  const average = students.length ? Math.round(students.reduce((s, x) => s + x.attendance, 0) / students.length) : 0;
  studentCount.textContent = total;
  attendanceAverage.textContent = `${average}%`;
}

function renderStudentView() {
  const profile = students[0] || { name: 'Student', course: '', batch: '' };
  studentAttendanceValue.textContent = `${profile.attendance || 0}%`;
  studentProfileCard.innerHTML = `<strong>${profile.name}</strong><span>${profile.course} • ${profile.batch}</span><span>Current GPA: 8.8</span>`;
  studentProfileNameEls.forEach(el => el.textContent = profile.name);
  // Today's schedule derived from timetable
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todays = timetable.filter(t => t.day === today).sort((a,b)=>a.time.localeCompare(b.time));
  const todaysEl = document.querySelector('.notice-list');
  if (todaysEl) {
    if (todays.length) {
      todaysEl.innerHTML = todays.map(t => `<li>${t.time} • ${t.subject}</li>`).join('');
    } else {
      todaysEl.innerHTML = '<li>No classes today</li>';
    }
  }

  if (studentProgressList) {
    studentProgressList.innerHTML = [
      { label: 'Data Structures', value: 'A-' },
      { label: 'Mathematics', value: 'A' },
      { label: 'Design Studio', value: 'B+' }
    ].map(item => `
      <article class="student-item">
        <div><strong>${item.label}</strong><span>Latest grade</span></div>
        <strong>${item.value}</strong>
      </article>`).join('');
  }
}

function renderFacultyView() {
  if (!studentList) return;
  studentList.innerHTML = students.map((s, i) => `
    <article class="student-item">
      <div><strong>${s.name}</strong><span>${s.course} • ${s.batch}</span></div>
      <div class="attendance-actions">
        <button class="attendance-btn ${s.attendance>=90? 'active':''}" data-index="${i}" data-action="present">Present</button>
        <button class="attendance-btn ${s.attendance<90? 'active':''}" data-index="${i}" data-action="absent">Absent</button>
      </div>
    </article>`).join('');

  studentList.querySelectorAll('.attendance-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.index);
      const action = btn.dataset.action;
      const st = students[idx];
      if (!st) return;
      st.attendance = action === 'present' ? Math.min(100, st.attendance + 2) : Math.max(0, st.attendance - 2);
      saveStudents(); updateStats(); renderFacultyView(); renderStudentView();
    });
  });
}

function renderAssignments() {
  if (!assignmentListEl) return;
  const isFaculty = currentUser?.role === 'faculty';
  if (assignmentForm) assignmentForm.style.display = isFaculty ? 'grid' : 'none';

  if (!assignments.length) assignmentListEl.innerHTML = '<div class="student-item"><strong>No assignments</strong></div>';
  else if (isFaculty) {
    assignmentListEl.innerHTML = assignments.map(a => `
      <article class="student-item">
        <div><strong>${a.title}</strong><span>Due: ${a.due}</span><div style="font-size:0.9rem;color:var(--muted);">${a.desc||''}</div><div style="font-size:0.85rem;color:var(--muted);">Assigned by: ${a.createdBy||'Faculty'}</div></div>
        <div style="display:flex;gap:8px;align-items:center;"><button class="btn" data-id="${a.id}" data-action="edit">Edit</button><button class="btn" data-id="${a.id}" data-action="delete">Delete</button></div>
      </article>`).join('');
  } else {
    assignmentListEl.innerHTML = assignments.map(a => {
      const submission = a.submissions?.find(s => s.student === currentUser?.displayName);
      const submittedText = submission ? 'Submitted' : 'Submit';
      const disabled = submission ? 'disabled' : '';
      return `
        <article class="student-item">
          <div><strong>${a.title}</strong><span>Due: ${a.due}</span><div style="font-size:0.9rem;color:var(--muted);">${a.desc||''}</div></div>
          <button class="btn" data-id="${a.id}" data-action="submit" ${disabled}>${submittedText}</button>
        </article>`;
    }).join('');
  }

  // submissions view for faculty
  if (assignmentSubmissionsEl) {
    if (isFaculty) {
      assignmentSubmissionsEl.classList.remove('hidden');
      const submitted = assignments.flatMap(a => (a.submissions||[]).map(s => ({...s, title: a.title})));
      assignmentSubmissionsEl.innerHTML = submitted.length ? submitted.map(s => `
        <article class="student-item"><div><strong>${s.title}</strong><span>Student: ${s.student}</span><div style="font-size:0.9rem;color:var(--muted);">${s.note||'Submitted via portal'}</div></div><strong>${s.status}</strong></article>
      `).join('') : '<div class="student-item"><strong>No submitted assignments</strong></div>';
    } else assignmentSubmissionsEl.classList.add('hidden');
  }

  assignmentListEl.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id; const action = btn.dataset.action; const item = assignments.find(x => String(x.id) === String(id));
      if (!item) return;
      if (action === 'edit') {
        document.getElementById('assignmentTitle').value = item.title; document.getElementById('assignmentDue').value = item.due; document.getElementById('assignmentDesc').value = item.desc||''; document.getElementById('assignmentId').value = item.id;
      } else if (action === 'delete') { assignments = assignments.filter(x => String(x.id)!==String(id)); saveAssignments(); renderAssignments(); }
      else if (action === 'submit' && currentUser?.role === 'student') {
        const note = prompt('Enter a short submission note or file reference:', 'Submitted through portal'); if (note===null) return; item.submissions = item.submissions||[]; const existing = item.submissions.find(s=>s.student===currentUser.displayName); if (existing) { existing.note=note; existing.status='Submitted'; existing.submittedAt=new Date().toLocaleDateString(); } else { item.submissions.push({ student: currentUser.displayName, note, status:'Submitted', submittedAt:new Date().toLocaleDateString() }); } saveAssignments(); renderAssignments(); }
    });
  });
}

if (assignmentForm) {
  assignmentForm.addEventListener('submit', (e) => {
    e.preventDefault(); const title = document.getElementById('assignmentTitle').value.trim(); const due = document.getElementById('assignmentDue').value; const desc = document.getElementById('assignmentDesc').value.trim(); const id = document.getElementById('assignmentId').value; if (!title||!due) return; if (id) { const idx = assignments.findIndex(x=>String(x.id)===String(id)); if (idx>=0) { assignments[idx].title=title; assignments[idx].due=due; assignments[idx].desc=desc; } } else { assignments.unshift({ id: Date.now(), title, due, desc, createdBy: currentUser?.role==='faculty'?currentUser.displayName:null, submissions:[] }); } saveAssignments(); assignmentForm.reset(); renderAssignments(); });
}

function renderTimetable() {
  if (!timetableListEl) return; const isFaculty = currentUser?.role==='faculty'; if (timetableForm) timetableForm.style.display = isFaculty ? 'grid' : 'none';
  if (!timetable.length) { timetableListEl.innerHTML = '<div class="student-item"><strong>No timetable slots yet</strong></div>'; return; }
  timetableListEl.innerHTML = timetable.map(t => `
    <article class="timetable-card">
      <div><div class="tt-time">${t.day} • ${t.time}</div><div class="tt-subject">${t.subject}</div></div>
      ${isFaculty?`<div style="display:flex;gap:8px;align-items:center;"><button class="btn tt-edit" data-id="${t.id}">Edit</button><button class="btn tt-delete" data-id="${t.id}">Delete</button></div>`:''}
    </article>
  `).join('');
  if (isFaculty) {
    timetableListEl.querySelectorAll('.tt-edit').forEach(b=>b.addEventListener('click',()=>{ const id=b.dataset.id; const s=timetable.find(x=>String(x.id)===String(id)); if(!s) return; document.getElementById('ttDay').value=s.day; document.getElementById('ttTime').value=s.time; document.getElementById('ttSubject').value=s.subject; document.getElementById('ttId').value=s.id; }));
    timetableListEl.querySelectorAll('.tt-delete').forEach(b=>b.addEventListener('click',()=>{ const id=b.dataset.id; timetable=timetable.filter(x=>String(x.id)!==String(id)); saveTimetable(); renderTimetable(); }));
  }
}

if (timetableForm) {
  timetableForm.addEventListener('submit', (e) => {
    e.preventDefault(); if (!currentUser || currentUser.role !== 'faculty') return; const day=document.getElementById('ttDay').value; const time=document.getElementById('ttTime').value; const subject=document.getElementById('ttSubject').value.trim(); const id=document.getElementById('ttId').value; if(!day||!time||!subject) return; if (id) { const idx=timetable.findIndex(x=>String(x.id)===String(id)); if (idx>=0) { timetable[idx].day=day; timetable[idx].time=time; timetable[idx].subject=subject; } } else { timetable.push({ id: Date.now(), day, time, subject }); } saveTimetable(); timetableForm.reset(); renderTimetable(); });
}

function populateSettings() { if (!settingsForm || !currentUser) return; if (settingNameInput) settingNameInput.value = currentUser.displayName || ''; }
if (settingsForm) settingsForm.addEventListener('submit', (e)=>{ e.preventDefault(); if (!currentUser) return; const newName = settingNameInput.value.trim(); if (!newName) return; currentUser.displayName = newName; setCurrentUser(currentUser); if (userBadge) userBadge.textContent = `${currentUser.displayName} • ${currentUser.role}`; alert('Settings saved'); });

// Navigation and render
const collegeNavLinks = document.querySelectorAll('.college-nav a');
const placeholder = document.getElementById('placeholder');
const placeholderTitle = document.getElementById('placeholderTitle');
const placeholderContent = document.getElementById('placeholderContent');

function showPlaceholder(title, content) { if (!placeholder) return; if (placeholderTitle) placeholderTitle.textContent = title; if (placeholderContent) placeholderContent.textContent = content; placeholder.classList.remove('hidden'); if (studentView) studentView.classList.add('hidden'); if (facultyView) facultyView.classList.add('hidden'); }
function hideAllPanels() { [placeholder, document.getElementById('attendancePanel'), assignmentsEl, timetableEl, settingsEl, studentView, facultyView].forEach(p=>{ if(p) p.classList.add('hidden'); }); }
function setActiveNav(target) { if (!collegeNavLinks) return; collegeNavLinks.forEach(link => link.classList.toggle('active', link.dataset.target===target)); }
if (collegeNavLinks) collegeNavLinks.forEach(link => link.addEventListener('click', e=>{ e.preventDefault(); const t = link.dataset.target; setActiveNav(t); handleNav(t); }));

function handleNav(target) {
  hideAllPanels(); if (!target) return; if (target==='dashboard') { renderApp(); return; }
  if (target==='attendance') { if (currentUser?.role==='faculty') { if (pageTitle) pageTitle.textContent='Mark Attendance'; if (facultyView) facultyView.classList.remove('hidden'); if (facultyDashboardEl) facultyDashboardEl.classList.add('hidden'); if (facultyAttendanceEl) facultyAttendanceEl.classList.remove('hidden'); renderFacultyView(); } else { if (pageTitle) pageTitle.textContent='Attendance'; const ap = document.getElementById('attendancePanel'); if (ap) ap.classList.remove('hidden'); renderStudentAttendance(); } return; }
  if (target==='assignments') { if (pageTitle) pageTitle.textContent='Assignments'; if (assignmentsEl) assignmentsEl.classList.remove('hidden'); renderAssignments(); return; }
  if (target==='timetable') { if (pageTitle) pageTitle.textContent='Timetable'; if (timetableEl) timetableEl.classList.remove('hidden'); renderTimetable(); return; }
  if (target==='settings') { if (pageTitle) pageTitle.textContent='Settings'; if (settingsEl) settingsEl.classList.remove('hidden'); populateSettings(); return; }
  showPlaceholder(target, `This is a placeholder for the ${target} page.`);
}

function renderStudentAttendance() {
  if (!attendanceHistoryList) return;
  attendanceHistoryList.innerHTML = [
    { date: '2026-07-20', status: 'Present' }, { date: '2026-07-21', status: 'Present' }, { date: '2026-07-22', status: 'Absent' }, { date: '2026-07-23', status: 'Present' }
  ].map(item => `
    <article class="student-item"><div><strong>${item.date}</strong><span>Attendance status</span></div><strong>${item.status}</strong></article>
  `).join('');
}

function renderApp() {
  if (!currentUser) { if (authScreen) authScreen.classList.remove('hidden'); if (appShell) appShell.classList.add('hidden'); return; }
  if (authScreen) authScreen.classList.add('hidden'); if (appShell) appShell.classList.remove('hidden'); if (userBadge) userBadge.textContent = `${currentUser.displayName} • ${currentUser.role}`;
  if (currentUser.role==='student') { if (pageTitle) pageTitle.textContent='Student Dashboard'; if (studentView) studentView.classList.remove('hidden'); if (facultyView) facultyView.classList.add('hidden'); renderStudentView(); renderAssignments(); renderTimetable(); populateSettings(); }
  else { if (pageTitle) pageTitle.textContent='Faculty Dashboard'; if (facultyView) facultyView.classList.remove('hidden'); if (studentView) studentView.classList.add('hidden'); updateStats(); if (facultyDashboardEl) facultyDashboardEl.classList.remove('hidden'); if (facultyAttendanceEl) facultyAttendanceEl.classList.add('hidden'); renderFacultyDashboard(); renderAssignments(); renderTimetable(); populateSettings(); }
}

function renderFacultyDashboard() { updateStats(); const pending = assignments.reduce((acc,a)=>acc+((a.submissions||[]).filter(s=>s.status==='Submitted').length),0); if (pendingReviewsEl) pendingReviewsEl.textContent = pending; if (!facultyDashboardContent) return; const recentNotices = ['Department meeting on Friday', 'Submit lab marks by next Wednesday', 'Guest lecture: Modern Pedagogy']; facultyDashboardContent.innerHTML = ` <article class="student-item"><div><strong>Pending submissions</strong><span>Items to review</span></div><strong>${pending}</strong></article> ${recentNotices.map(n=>`<article class="student-item"><div><strong>${n}</strong><span>Notice</span></div></article>`).join('')}`; }

// Login handlers
if (loginForm) loginForm.addEventListener('submit', (e)=>{ e.preventDefault(); const role = document.getElementById('roleSelect').value; const username = document.getElementById('usernameInput').value.trim(); const password = document.getElementById('passwordInput').value; const matched = demoUsers.find(u=>u.role===role && u.username===username && u.password===password); if (matched) { setCurrentUser(matched); authError.textContent=''; renderApp(); } else authError.textContent='Invalid username or password.'; });
if (logoutBtn) logoutBtn.addEventListener('click', ()=>{ setCurrentUser(null); renderApp(); });

// Initialize
updateStats(); renderApp();
