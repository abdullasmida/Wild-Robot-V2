// ==========================================
// WILD ROBOT APP - FINAL PRODUCTION FIX (V4)
// ==========================================

// 1. EMBEDDED LOGO (Base64) - This solves the "Tainted Canvas" Error completely.
const ROBOT_LOGO_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAABmJLR0QA/wD/AP+gvaeTAAAAjklEQVRogeaQwQmAMAxE30VQ8CiW4zWcw2M4hidxFw9iK/4IBiGTXPLwIcnL50ZmBqpq8L1q7HW+b6w19l73/aeqEBGd9xMRlFLovZ+5+733zF1VnTci8tE450TkzD2PxjknIufsfTSO/D/y/8j/I/+P/D/y/8j/I/+P/D/y/8j/I/+P/D/y/8j/I/+P/D/y/8j/I68C22s8k1vAuwAAAABJRU5ErkJggg==";

// 2. GLOBAL STATE
const S = { view: 'home', branchIdx: 0, sessIdx: 0, playerIdx: 0, lastView: 'home' };
const DB = { branches: [], skillLibrary: [], allPlayers: [] };
const PROMOTION_SEQUENCE = ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Sapphire"];
window.currentPDFConfig = { filename: 'document', orientation: 'portrait' };

// 3. INIT
window.addEventListener('DOMContentLoaded', () => {
  console.log("🚀 App Starting...");
  setupNavigation(); // Activate buttons immediately

  if (window.supabaseClient && typeof window.loadPlayersFromSupabase === 'function') {
    window.loadPlayersFromSupabase(DB, () => {
      // Flatten players for search
      DB.allPlayers = [];
      DB.branches.forEach((b, bI) => {
        b.sessions.forEach((s, sI) => {
          s.players.forEach((p, pI) => {
            p._ptr = { bI, sI, pI };
            p.branchName = b.name;
            DB.allPlayers.push(p);
          });
        });
      });
      window.renderHome();
    });
  } else {
    document.body.innerHTML = "<h3 style='text-align:center; padding:50px; color:red;'>⚠️ Error: Supabase Not Connected.</h3>";
  }
});

// --- 4. NAVIGATION HANDLERS ---

function setupNavigation() {
  // Footer Tabs
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.onclick = () => {
      const tab = btn.dataset.tab || btn.getAttribute('data-tab');
      window.switchTab(btn, tab);
    };
  });
  // Back Button
  const backBtn = document.getElementById('backBtn');
  if (backBtn) backBtn.onclick = () => window.goBack();
}

window.switchTab = function (btn, tab) {
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  if (btn) btn.classList.add('active');

  if (tab === 'home') window.renderHome();
  else if (tab === 'sessions') {
    if (DB.branches.length > 0) window.renderSessions();
    else window.renderHome();
  }
  else if (tab === 'athletes') window.renderAthletes();
  else if (tab === 'settings') window.renderSettings();
};

window.goBack = function () {
  if (S.view === 'eval') {
    if (S.lastView === 'athletes') window.renderAthletes();
    else window.renderRoster();
  }
  else if (S.view === 'roster') window.renderSessions();
  else if (S.view === 'sessions') window.renderHome();
  else window.renderHome();
};

// --- 5. RENDERERS ---

window.renderHome = function () {
  S.view = 'home';
  document.getElementById('backBtn').style.visibility = 'hidden';
  const main = document.getElementById('mainView');

  let html = `<div style="padding:20px;"><h2 class="strong">Select Branch</h2>`;
  DB.branches.forEach((b, i) => {
    html += `<div class="card" onclick="selectBranch(${i})" style="margin-bottom:12px;">
            <div class="card-row"><div><div class="strong">${b.name}</div><div class="muted">${b.city}</div></div><div class="strong">➝</div></div></div>`;
  });
  main.innerHTML = html + "</div>";
};

window.selectBranch = (i) => { S.branchIdx = i; window.renderSessions(); };

window.renderSessions = function () {
  S.view = 'sessions';
  document.getElementById('backBtn').style.visibility = 'visible';
  const b = DB.branches[S.branchIdx];
  const main = document.getElementById('mainView');

  let html = `<div style="padding:20px;"><h2 class="strong">${b.name}</h2>`;
  b.sessions.forEach((sess, i) => {
    html += `<div class="card" onclick="selectSession(${i})" style="margin-bottom:12px;">
            <div class="card-row"><div class="strong">⏰ ${sess.slot}</div><div class="pill">${sess.players.length} Players</div></div></div>`;
  });
  main.innerHTML = html + "</div>";
};

window.selectSession = (i) => { S.sessIdx = i; window.renderRoster(); };

window.renderRoster = function () {
  S.view = 'roster';
  S.lastView = 'roster';
  const sess = DB.branches[S.branchIdx].sessions[S.sessIdx];
  const main = document.getElementById('mainView');

  let html = `<div style="padding:20px; padding-bottom:80px;">
        <h2 class="strong">Roster (${sess.slot})</h2>`;

  if (sess.players.length === 0) {
    html += `<div class="muted" style="margin-bottom:20px;">No players found in this session.</div>`;
  }

  sess.players.forEach((p, i) => {
    html += `<div class="card" onclick="selectPlayer(${i})" style="margin-bottom:10px;">
            <div class="card-row">
                <div style="display:flex; align-items:center">
                    <div class="avatar">${p.name.substring(0, 2)}</div>
                    <div><div class="strong">${p.name}</div><div class="muted">${p.levelCode}</div></div>
                </div>
                <div class="strong">➝</div>
            </div></div>`;
  });

  // ADD PLAYER BUTTON
  html += `
        <button onclick="window.openAddPlayerModal()" style="
            width: 100%; margin-top: 20px; padding: 15px; 
            background: #f0fdf4; border: 2px dashed #10b981; 
            color: #047857; font-weight: bold; border-radius: 15px; 
            cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;">
            <span style="font-size:20px;">+</span> Add New Athlete
        </button>
    </div>`;

  main.innerHTML = html;
};

window.selectPlayer = (i) => { S.playerIdx = i; window.renderEval(); };

window.renderAthletes = function () {
  S.view = 'athletes';
  document.getElementById('backBtn').style.visibility = 'hidden';
  const main = document.getElementById('mainView');

  let html = `
    <div style="padding:20px;">
        <h2 class="strong">All Athletes</h2>
        <input type="text" placeholder="🔍 Search..." onkeyup="window.filterAthletes(this.value)" 
               style="width:100%; padding:14px; border-radius:12px; border:1px solid #ddd; margin-bottom:20px;">
        <div id="athletesList">` + window.generatePlayerListHTML(DB.allPlayers) + `</div>
    </div>`;
  main.innerHTML = html;
};

window.filterAthletes = function (term) {
  const filtered = DB.allPlayers.filter(p => p.name.toLowerCase().includes(term.toLowerCase()));
  document.getElementById('athletesList').innerHTML = window.generatePlayerListHTML(filtered);
};

window.generatePlayerListHTML = function (list) {
  if (!list.length) return '<div class="muted">No matches.</div>';
  return list.map(p => `
        <div class="card" onclick="jumpToEval(${p._ptr.bI}, ${p._ptr.sI}, ${p._ptr.pI})" style="margin-bottom:10px;">
            <div class="card-row">
                <div style="display:flex; align-items:center">
                    <div class="avatar" style="background:#eee; color:#333;">${p.name.substring(0, 2)}</div>
                    <div><div class="strong">${p.name}</div><div class="muted">${p.branchName} • ${p.levelCode}</div></div>
                </div>
                <div class="strong">➝</div>
            </div>
        </div>`).join('');
};

window.jumpToEval = function (bI, sI, pI) {
  S.branchIdx = bI; S.sessIdx = sI; S.playerIdx = pI;
  S.lastView = 'athletes';
  document.getElementById('backBtn').style.visibility = 'visible';
  window.renderEval();
};

window.renderSettings = function () {
  S.view = 'settings';
  document.getElementById('mainView').innerHTML = `
        <div style="padding:20px;">
            <h2 class="strong">Settings</h2>
            <div class="card"><div class="strong">User</div><div class="muted">Active ✅</div></div>
            <button class="btn-report" style="margin-top:20px; background:#fee2e2; color:#ef4444; border:none;" onclick="window.location.reload()">Refresh App</button>
        </div>`;
};

// --- 6. EVALUATION VIEW ---

window.renderEval = function () {
  S.view = 'eval';
  const p = DB.branches[S.branchIdx].sessions[S.sessIdx].players[S.playerIdx];
  const main = document.getElementById('mainView');

  let total = 0, count = 0;
  p.devices.forEach(d => d.skills.forEach(s => { total += s.rating; count++; }));
  const max = count * 5;
  const pct = max ? Math.round((total / max) * 100) : 0;

  const nextLvlIndex = PROMOTION_SEQUENCE.indexOf(p.levelCode) + 1;
  const hasNextLevel = nextLvlIndex < PROMOTION_SEQUENCE.length;

  let btnClass = "btn-promote btn-disabled";
  let btnText = "Target: 90%";
  let btnAction = "";

  if (pct >= 90 && hasNextLevel) {
    btnClass = "btn-promote btn-gold";
    btnText = `🚀 Promote to ${PROMOTION_SEQUENCE[nextLvlIndex]}`;
    btnAction = `onclick="window.handlePromotion()"`;
  } else if (pct >= 90 && !hasNextLevel) {
    btnClass = "btn-promote btn-report";
    btnText = "🎉 Max Level Reached";
  }

  let html = `<div style="padding:20px; padding-bottom:100px;">
        <div style="text-align:center; margin-bottom:20px;">
            <div class="strong" style="font-size:24px;">${p.name}</div>
            <div class="pill">${p.levelCode}</div>
            <div style="font-size:50px; font-weight:900; color:var(--primary); margin:10px 0;">${pct}%</div>
        </div>`;

  p.devices.forEach(dev => {
    if (!dev.skills.length) return;
    html += `<div style="background:white; border:1px solid #eee; border-radius:16px; margin-bottom:15px; overflow:hidden;">
            <div style="background:#f9fafb; padding:10px 15px; font-weight:bold; color:#6b7280; font-size:12px;">${dev.name}</div>`;
    dev.skills.forEach(skill => {
      html += `<div style="padding:12px 15px; border-bottom:1px dashed #eee; display:flex; justify-content:space-between; align-items:center;">
                <span>${skill.name}</span>
                <div class="stars">`;
      for (let k = 1; k <= 5; k++) {
        const fill = k <= skill.rating ? "#f59e0b" : "none";
        const stroke = k <= skill.rating ? "#f59e0b" : "#e5e7eb";
        html += `<div onclick="window.rateSkill('${dev.name}', '${skill.name}', ${k})">
                    <svg viewBox="0 0 24 24" width="30" height="30" fill="${fill}" stroke="${stroke}" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                </div>`;
      }
      html += `</div></div>`;
    });
    html += `</div>`;
  });

  html += `</div>
        <div class="action-bar">
            <button class="btn-report" style="flex:0.2; background:#f3f4f6;" onclick="window.openManageModal()">⚙️</button>
            <button class="btn-report" onclick="window.handleSaveReport()">📄 Report</button>
            <button class="${btnClass}" ${btnAction}>${btnText}</button>
        </div>`;

  main.innerHTML = html;
};

window.rateSkill = function (dName, sName, val) {
  const p = DB.branches[S.branchIdx].sessions[S.sessIdx].players[S.playerIdx];
  const dev = p.devices.find(d => d.name === dName);
  const skill = dev.skills.find(s => s.name === sName);
  skill.rating = (skill.rating === val) ? 0 : val;
  window.renderEval();
};

// --- 7. PDF LOGIC (SECURE) ---

window.openPreview = function (htmlContent, orientation, filename) {
  const modal = document.getElementById('previewModal');
  const content = document.getElementById('previewContent');
  const btn = document.getElementById('downloadBtn');

  window.currentPDFConfig = { orientation, filename };

  // Set Dimensions based on orientation
  if (orientation === 'landscape') {
    content.style.width = '297mm'; content.style.minHeight = '210mm';
  } else {
    content.style.width = '210mm'; content.style.minHeight = '297mm';
  }

  btn.innerText = "🖨️ Confirm & Download PDF";
  btn.disabled = false;
  btn.style.opacity = "1";

  content.innerHTML = htmlContent;
  modal.style.display = 'flex';
};

window.downloadCurrentPDF = function () {
  const btn = document.getElementById('downloadBtn');
  const element = document.getElementById('previewContent');
  const { filename, orientation } = window.currentPDFConfig;

  btn.innerText = "⏳ Processing...";
  btn.disabled = true;
  btn.style.opacity = "0.7";

  const opt = {
    margin: 0,
    filename: `${filename}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: orientation }
  };

  html2pdf().set(opt).from(element).save().then(() => {
    window.closePreview();
  }).catch(err => {
    alert("PDF Error: " + err.message);
    btn.innerText = "Retry"; btn.disabled = false; btn.style.opacity = "1";
  });
};

window.closePreview = function () {
  document.getElementById('previewModal').style.display = 'none';
};

// --- 8. REPORT & PROMOTION HANDLERS ---

window.handleSaveReport = function () {
  const p = DB.branches[S.branchIdx].sessions[S.sessIdx].players[S.playerIdx];

  let skillsHtml = '<div style="column-count: 2; column-gap: 40px;">';
  p.devices.forEach(dev => {
    skillsHtml += `<h4 style="margin:10px 0 5px; color:#047857; border-bottom:1px solid #eee;">${dev.name}</h4>`;
    dev.skills.forEach(s => {
      skillsHtml += `<div style="display:flex; justify-content:space-between; font-size:12px; padding:3px 0;"><span>${s.name}</span><span style="color:#f59e0b;">${'★'.repeat(s.rating) + '☆'.repeat(5 - s.rating)}</span></div>`;
    });
  });
  skillsHtml += '</div>';

  const content = `
        <div style="padding: 40px; font-family: 'Segoe UI', sans-serif; color: #333;">
            <div style="text-align:center; border-bottom: 2px solid #10b981; padding-bottom: 20px; margin-bottom: 20px;">
                <img src="${ROBOT_LOGO_BASE64}" width="60" style="display:block; margin:0 auto;">
                <h2 style="margin:5px 0; color:#047857;">Assessment Report</h2>
                <div style="color:#666;">Wild Robot App</div>
                <div style="color:#999; font-size:12px; margin-top:5px;">${new Date().toLocaleDateString()}</div>
            </div>
            <div style="background:#f0fdf4; padding:15px; border-radius:10px; margin-bottom:20px; display:flex; justify-content:space-between;">
                <div><strong>Athlete:</strong> ${p.name}</div><div><strong>Level:</strong> ${p.levelCode}</div>
            </div>
            ${skillsHtml}
            <div style="margin-top: 30px; text-align: right;">
                <div style="font-size: 14px; color: #666;">Evaluated by</div>
                <div class="signature-text">Coach Abdulla</div>
                <div style="font-size: 10px; color: #ccc; margin-top:5px;">Generated by Wild Robot App</div>
            </div>
        </div>`;

  window.openPreview(content, 'portrait', `${p.name}_Report`);
};

window.handlePromotion = async function () {
  const p = DB.branches[S.branchIdx].sessions[S.sessIdx].players[S.playerIdx];
  const currentLevel = p.levelCode;
  const nextLvl = PROMOTION_SEQUENCE[PROMOTION_SEQUENCE.indexOf(currentLevel) + 1];

  if (!confirm(`Promote to ${nextLvl}?`)) return;

  try {
    await window.supabaseClient.from('players').update({ level: nextLvl }).eq('id', p.supabaseId);

    // Reset Skills Locally
    p.levelCode = nextLvl;
    p.devices = ["Floor", "Bars", "Beam", "Vault"].map(devName => {
      const newSkills = DB.skillLibrary.filter(s =>
        (s.apparatus || "").toLowerCase() === devName.toLowerCase() && (s.level || "").toLowerCase() === nextLvl.toLowerCase()
      ).map(s => ({ name: s.name, rating: 0 }));
      return { name: devName, skills: newSkills };
    });

    // Certificate logic
    const content = `
        <div class="preview-center">
            <div class="cert-frame" style="transform: scale(0.95); border:none; box-shadow:none;">
                <div class="corner tl"></div><div class="corner tr"></div><div class="corner bl"></div><div class="corner br"></div>
                <img src="${ROBOT_LOGO_BASE64}" class="cert-logo">
                <div class="cert-academy">Wild Robot App</div>
                <h1 class="cert-title">Certificate of Completion</h1>
                <div class="cert-subtitle">Artistic Gymnastics Program</div>
                <p class="cert-text" style="margin-top:30px">This is to certify that the gymnast</p>
                <div class="cert-name">${p.name}</div>
                <p class="cert-text">Has successfully completed requirements for</p>
                <div class="cert-level">${currentLevel}</div> <div class="cert-footer">
                    <div class="sig-box"><div class="signature-text">Abdulla</div><div class="sig-line"></div><div class="sig-label">Head Coach</div></div>
                    <div class="sig-box"><div class="sig-line" style="border:none; border-bottom:1px solid #333;">${new Date().toLocaleDateString()}</div><div class="sig-label">Date</div></div>
                </div>
            </div>
        </div>`;

    window.openPreview(content, 'landscape', `${p.name}_${currentLevel}_Cert`);
    window.renderEval();
  } catch (err) { alert("Error: " + err.message); }
};

// --- PLAYER MANAGEMENT (DYNAMIC SESSIONS FIX) ---

window.openManageModal = function () {
  const p = DB.branches[S.branchIdx].sessions[S.sessIdx].players[S.playerIdx];
  const modal = document.getElementById('manageModal');

  // 1. Basic Fields
  document.getElementById('editName').value = p.name;
  document.getElementById('editLevel').value = p.levelCode;

  // 2. Handle Branch (Map to DB values)
  const bSelect = document.getElementById('editBranch');
  const dbBranchValue = p.branchName.includes('Ajman') ? 'Ajman' : 'Sharjah';
  bSelect.value = dbBranchValue;

  // 3. Populate Sessions & Select Current
  // We pass the current Session UUID if available, otherwise fallback
  updateSessionDropdown(dbBranchValue, p.sessionUUID);

  // 4. Update sessions when branch changes
  bSelect.onchange = (e) => {
    updateSessionDropdown(e.target.value);
  };

  modal.style.display = 'flex';
};

// HELPER: Populate Dropdown
function updateSessionDropdown(branchValue, currentSessionId = null) {
  const sSelect = document.getElementById('editSession');
  sSelect.innerHTML = ""; // Clear existing options

  // Map dropdown value ('Sharjah') to local branch ID ('VISS')
  const localBranchId = branchValue === 'Ajman' ? 'Ajman_Academy' : 'VISS';
  const branch = DB.branches.find(b => b.id === localBranchId);

  if (branch && branch.sessions) {
    branch.sessions.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id; // CRITICAL: Use the UUID from DB
      opt.innerText = s.slot; // Display text (e.g., 5-6 PM)

      // Auto-select if ID matches
      if (currentSessionId && s.id === currentSessionId) {
        opt.selected = true;
      }
      sSelect.appendChild(opt);
    });
  } else {
    // Fallback if no sessions loaded
    const opt = document.createElement('option');
    opt.innerText = "No sessions available";
    sSelect.appendChild(opt);
  }
}

window.savePlayerChanges = async function () {
  const p = DB.branches[S.branchIdx].sessions[S.sessIdx].players[S.playerIdx];
  const btn = document.querySelector('#manageModal .btn-download'); // Reuse styled button

  // Get Form Values
  const newName = document.getElementById('editName').value;
  const newBranch = document.getElementById('editBranch').value; // 'Sharjah' or 'Ajman'
  const newSessionId = document.getElementById('editSession').value; // UUID
  const newLevel = document.getElementById('editLevel').value;

  btn.innerText = "⏳ Saving...";
  btn.disabled = true;

  try {
    // Update Query (Using session_id)
    const { error } = await window.supabaseClient
      .from('players')
      .update({
        name: newName,
        branch: newBranch,
        session_id: newSessionId, // CRITICAL: Update the Link
        level: newLevel
      })
      .eq('id', p.supabaseId);

    if (error) throw error;

    // Success
    window.closeManageModal();
    btn.innerText = "💾 Save";
    btn.disabled = false;

    // Smart Refresh (Reload to reflect changes)
    // Since we changed fundamental structure (branch/session), a reload is safest
    window.location.reload();

  } catch (err) {
    alert("Error updating: " + err.message);
    btn.innerText = "💾 Save";
    btn.disabled = false;
  }
};

window.closeManageModal = function () {
  document.getElementById('manageModal').style.display = 'none';
};

window.deletePlayer = async function () {
  const p = DB.branches[S.branchIdx].sessions[S.sessIdx].players[S.playerIdx];
  if (!confirm(`⚠️ Delete ${p.name}?`)) return;

  try {
    const { error } = await window.supabaseClient.from('players').delete().eq('id', p.supabaseId);
    if (error) throw error;
    window.location.reload();
  } catch (err) { alert("Error: " + err.message); }
};

// --- ADD PLAYER LOGIC ---

window.openAddPlayerModal = function () {
  // Clear fields
  document.getElementById('newPlayerName').value = '';
  document.getElementById('newPlayerAge').value = '';
  document.getElementById('newPlayerLevel').value = 'Bronze';

  document.getElementById('addPlayerModal').style.display = 'flex';
};

window.addNewPlayer = async function () {
  const name = document.getElementById('newPlayerName').value;
  const age = document.getElementById('newPlayerAge').value;
  const level = document.getElementById('newPlayerLevel').value;
  const btn = document.querySelector('#addPlayerModal .btn-download');

  if (!name) { alert("Please enter a name"); return; }

  // Context: Current Branch & Session
  const currentBranch = DB.branches[S.branchIdx];
  const currentSession = currentBranch.sessions[S.sessIdx];

  // Determine DB values
  // branch column expects 'Sharjah' or 'Ajman' usually, mapping from ID
  const dbBranchVal = currentBranch.id.includes('Ajman') ? 'Ajman' : 'Sharjah';

  btn.innerText = "⏳ Adding...";
  btn.disabled = true;

  try {
    const { data, error } = await window.supabaseClient
      .from('players')
      .insert([{
        name: name,
        age: age || 0,
        level: level,
        branch: dbBranchVal,
        session_id: currentSession.id // Link to current session UUID
      }])
      .select();

    if (error) throw error;

    alert(`✅ ${name} added successfully!`);
    document.getElementById('addPlayerModal').style.display = 'none';

    // Refresh to show new player
    window.location.reload();

  } catch (err) {
    alert("Error adding player: " + err.message);
    btn.innerText = "✅ Add to Roster";
    btn.disabled = false;
  }
};