// ══════════════════════════════════════════════════
//  SISTEMA DE TALENTOS
// ══════════════════════════════════════════════════

let talentsData = null;
let allTalentNames = new Set(); // flat set of every talent name across all categories

const CATEGORY_META = {
  combate:          { label: "Combate",           icon: "⚔️" },
  pericia:          { label: "Perícia",            icon: "📚" },
  destino:          { label: "Destino",            icon: "🌟" },
  jutsu:            { label: "Jutsu",              icon: "🌀" },
  tormenta:         { label: "Tormenta",           icon: "🌩️" },
  poder_concedido:  { label: "Poder Concedido",    icon: "🌸" },
};

// ── Prerequisite checker ──────────────────────────
// Returns { met: bool, unmet: string[] }

function checkPrerequisitos(prereqs) {
  if (!prereqs || prereqs.length === 0) return { met: true, unmet: [] };

  const unmet = [];

  for (const req of prereqs) {
    if (!checkSinglePrereq(req)) unmet.push(req);
  }

  return { met: unmet.length === 0, unmet };
}

function checkSinglePrereq(req) {
  const r = req.trim().toLowerCase();

  // ── Ability score: "For 13", "Des 15", "Int 13" etc.
  const attrMatch = req.match(/^(For|Des|Con|Int|Sab|Car|Hon)\s+(\d+)$/i);
  if (attrMatch) {
    const key = attrMatch[1].toLowerCase();
    const needed = parseInt(attrMatch[2]);
    const val = finalValueFor(key);
    return val !== null && val >= needed;
  }

  // ── BBA: "bônus base de ataque +N"
  const bbaMatch = req.match(/bônus base de ataque \+(\d+)/i);
  if (bbaMatch) {
    const needed = parseInt(bbaMatch[1]);
    if (!state.classKey) return false;
    const cls = CLASSES[state.classKey];
    return cls.tabela[state.level - 1].bba >= needed;
  }

  // ── Level: "personagem de Nº nível" or "personagem Nº nível"
  const lvlMatch = req.match(/personagem\s+(?:de\s+)?(\d+)[ºo°]\s+n[íi]vel/i);
  if (lvlMatch) return state.level >= parseInt(lvlMatch[1]);

  // ── Class + level: "kensei 4º nível", "bushi 8º nível" etc.
  const classLvlMatch = req.match(/^(\w[\w-]*)\s+(\d+)[ºo°]\s+n[íi]vel$/i);
  if (classLvlMatch) {
    const reqClass = classLvlMatch[1].toLowerCase();
    const reqLevel = parseInt(classLvlMatch[2]);
    const currentClass = state.classKey?.toLowerCase();
    return currentClass === reqClass && state.level >= reqLevel;
  }

  // ── Race: "hanyô", "henge", "mashin", "nezumi", "ryuujin", "vanara", "hanyô ou vanara"
  if (r.includes(" ou ")) {
    return r.split(" ou ").some(part => checkSinglePrereq(part.trim()));
  }
  const raceNames = { "hanyô": "hanyo", "henge": "henge", "mashin": "mashin",
    "nezumi": "nezumi", "ryuujin": "ryuujin", "vanara": "vanara",
    "kaijin": "kaijin", "humano": "humano" };
  if (raceNames[r]) return state.race === raceNames[r];

  // ── Trained in skill: "treinado em Acrobacia" etc.
  const trainedMatch = req.match(/^treinado em (.+)$/i);
  if (trainedMatch) {
    const skillName = trainedMatch[1].trim();
    return state.selectedSkills.some(s => s.name.toLowerCase() === skillName.toLowerCase());
  }

  // ── Another talent: check if it's a known talent name (selected)
  if (allTalentNames.has(req)) {
    return state.selectedTalents.some(t => t.name === req);
  }

  // ── "N outros talentos da Tormenta" / "outro talento da Tormenta"
  const tormentaCountMatch = req.match(/^(um|outro|dois|três|\d+)\s+outros?\s+talentos?\s+da\s+tormenta/i);
  if (tormentaCountMatch) {
    const word = tormentaCountMatch[1].toLowerCase();
    const needed = word === "um" || word === "outro" ? 1
      : word === "dois" ? 2 : word === "três" ? 3 : parseInt(word);
    const tormentaCount = state.selectedTalents.filter(t => t.category === "tormenta").length;
    return tormentaCount >= needed;
  }

  // ── "canalizar energia Nd6"
  const canalMatch = req.match(/canalizar energia\s+(\d+)d6/i);
  if (canalMatch) {
    const needed = parseInt(canalMatch[1]);
    // Check if class ability gives this (shinkan table)
    if (!state.classKey) return false;
    const cls = CLASSES[state.classKey];
    const lvl = state.level;
    // Find max canalizar energia dice from tabela
    let maxDice = 0;
    cls.tabela.filter(r => r.nivel <= lvl).forEach(row => {
      row.hab.forEach(h => {
        const m = h.match(/canalizar energia (\d+)d6/i);
        if (m) maxDice = Math.max(maxDice, parseInt(m[1]));
      });
    });
    return maxDice >= needed;
  }

  // ── "canalizar energia" (without dice)
  if (r === "canalizar energia") {
    if (!state.classKey) return false;
    const cls = CLASSES[state.classKey];
    const lvl = state.level;
    return cls.tabela.slice(0, lvl).some(row =>
      row.hab.some(h => /canalizar energia/i.test(h))
    );
  }

  // ── "canalizar energia ou capacidade de executar jutsus de luz"
  if (r.includes("canalizar energia")) return checkSinglePrereq("canalizar energia");

  // ── "habilidade escolhida N" / "habilidade do chacra escolhido N" — stat check
  const habMatch = req.match(/habilidade\s+(?:do chacra\s+)?escolhida?\s+(\d+)/i);
  if (habMatch) {
    const needed = parseInt(habMatch[1]);
    return ABILITIES.some(a => (finalValueFor(a.key) ?? 0) >= needed);
  }

  // ── "saber usar a arma escolhida" / "saber usar o tipo de armadura escolhido"
  if (r.includes("saber usar a arma") || r.includes("saber usar o tipo de armadura")) return true;

  // ── "visão no escuro" — race ability
  if (r === "visão no escuro") {
    return ["kaijin", "mashin", "ryuujin"].includes(state.race ?? "");
  }

  // Unknown prereq — treat as unmet (safe default)
  return false;
}

// ── Rendering ─────────────────────────────────────

let talentFilter = "";
let talentOpenCategories = new Set(["combate", "pericia", "destino", "jutsu", "tormenta", "poder_concedido"]);

function renderTalentsPanel() {
  const panel = document.getElementById("talentsPanel");
  if (!panel || !talentsData) return;

  const search = talentFilter.toLowerCase();

  let html = `
    <div class="talents-header">
      <div class="talents-count-bar">
        <span class="talents-selected-count">${state.selectedTalents.length} talento(s) selecionado(s)</span>
      </div>
      <div class="talents-search-wrap">
        <input id="talentSearchInput" class="talent-search" type="text"
          placeholder="Buscar talento..." value="${talentFilter}"
          oninput="talentFilter=this.value; renderTalentsPanel()"/>
      </div>
    </div>`;

  // Iterate categories
  for (const [catKey, catMeta] of Object.entries(CATEGORY_META)) {
    const raw = talentsData[catKey];
    if (!raw) continue;

    // Flatten poder_concedido nested structure
    let talents = {};
    if (catKey === "poder_concedido") {
      for (const [deity, subs] of Object.entries(raw)) {
        for (const [name, data] of Object.entries(subs)) {
          talents[name] = { ...data, _deity: deity };
        }
      }
    } else {
      talents = raw;
    }

    // Filter by search
    const entries = Object.entries(talents).filter(([name, data]) => {
      if (!search) return true;
      return name.toLowerCase().includes(search) ||
        (data.desc || "").toLowerCase().includes(search);
    });

    if (entries.length === 0) continue;

    // Sort: met prereqs first, then alphabetical within each group
    entries.sort(([na, da], [nb, db]) => {
      const metA = checkPrerequisitos(da.prerequisitos ?? []).met;
      const metB = checkPrerequisitos(db.prerequisitos ?? []).met;
      if (metA !== metB) return metA ? -1 : 1;
      return na.localeCompare(nb, "pt");
    });

    const isOpen = talentOpenCategories.has(catKey);
    const metCount = entries.filter(([,d]) => checkPrerequisitos(d.prerequisitos ?? []).met).length;

    html += `
      <div class="talent-category">
        <button class="talent-cat-header ${isOpen ? "open" : ""}"
          onclick="toggleTalentCategory('${catKey}')">
          <span class="talent-cat-icon">${catMeta.icon}</span>
          <span class="talent-cat-label">${catMeta.label}</span>
          <span class="talent-cat-counts">
            <span class="tcc-available">${metCount} disponíveis</span>
            <span class="tcc-total">/ ${entries.length}</span>
          </span>
          <span class="talent-cat-chevron">${isOpen ? "▾" : "▸"}</span>
        </button>
        ${isOpen ? `<div class="talent-list">${entries.map(([name, data]) =>
          talentCardHtml(name, data, catKey)).join("")}</div>` : ""}
      </div>`;
  }

  panel.innerHTML = html;
}

function talentCardHtml(name, data, catKey) {
  const prereqs = data.prerequisitos ?? [];
  const { met, unmet } = checkPrerequisitos(prereqs);
  const selected = state.selectedTalents.some(t => t.name === name);
  const deity = data._deity;

  const prereqBadges = prereqs.length
    ? prereqs.map(p => {
        const ok = checkSinglePrereq(p);
        return `<span class="prereq-badge ${ok ? "prereq-ok" : "prereq-fail"}" title="${p}">${p}</span>`;
      }).join("")
    : `<span class="prereq-none">Sem pré-requisitos</span>`;

  const deityBadge = deity
    ? `<span class="talent-deity-badge">${deity}</span>` : "";

  return `<div class="talent-card ${selected ? "talent-selected" : ""} ${!met && !selected ? "talent-locked" : ""}">
    <div class="talent-card-top">
      <div class="talent-card-title-row">
        <span class="talent-name">${name}</span>
        ${deityBadge}
        ${selected ? '<span class="talent-selected-badge">✓ Selecionado</span>' : ""}
      </div>
      <button class="talent-toggle-btn ${selected ? "btn-remove" : (met ? "btn-add" : "btn-locked")}"
        ${!met && !selected ? "disabled" : ""}
        onclick="toggleTalent('${name.replace(/'/g,"\\'")}', '${catKey}')">
        ${selected ? "Remover" : met ? "+ Adicionar" : "🔒 Bloqueado"}
      </button>
    </div>
    <div class="talent-prereqs">${prereqBadges}</div>
    <p class="talent-desc">${data.desc || ""}</p>
  </div>`;
}

function toggleTalentCategory(catKey) {
  if (talentOpenCategories.has(catKey)) talentOpenCategories.delete(catKey);
  else talentOpenCategories.add(catKey);
  renderTalentsPanel();
}

function toggleTalent(name, catKey) {
  const idx = state.selectedTalents.findIndex(t => t.name === name);
  if (idx >= 0) {
    state.selectedTalents.splice(idx, 1);
  } else {
    state.selectedTalents.push({ name, category: catKey });
  }
  renderTalentsPanel();
  checkSummaryReady();
}

// ── Summary HTML ──────────────────────────────────

function talentsSummaryHtml() {
  if (!state.selectedTalents.length) return "<em>Nenhum talento selecionado.</em>";

  const byCat = {};
  for (const t of state.selectedTalents) {
    if (!byCat[t.category]) byCat[t.category] = [];
    byCat[t.category].push(t.name);
  }

  return Object.entries(byCat).map(([cat, names]) => {
    const meta = CATEGORY_META[cat] || { label: cat, icon: "" };
    return `<div class="sum-talent-group">
      <div class="sum-talent-cat">${meta.icon} ${meta.label}</div>
      ${names.map(n => `<div class="sum-talent-name">${n}</div>`).join("")}
    </div>`;
  }).join("");
}

// ── Init ──────────────────────────────────────────

async function loadTalents() {
  const resp = await fetch("scripts/talents.json");
  talentsData = await resp.json();

  // Build flat set of all talent names for prereq checking
  for (const [cat, talents] of Object.entries(talentsData)) {
    if (cat === "poder_concedido") {
      for (const subs of Object.values(talents)) {
        for (const name of Object.keys(subs)) allTalentNames.add(name);
      }
    } else {
      for (const name of Object.keys(talents)) allTalentNames.add(name);
    }
  }

  renderTalentsPanel();
}
