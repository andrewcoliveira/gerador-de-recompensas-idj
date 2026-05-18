// ══════════════════════════════════════════════════
//  DADOS DO SISTEMA
// ══════════════════════════════════════════════════

const ABILITIES = [
  { key: "for", label: "Força",         abbr: "For" },
  { key: "des", label: "Destreza",      abbr: "Des" },
  { key: "con", label: "Constituição",  abbr: "Con" },
  { key: "int", label: "Inteligência",  abbr: "Int" },
  { key: "sab", label: "Sabedoria",     abbr: "Sab" },
  { key: "car", label: "Carisma",       abbr: "Car" },
  { key: "hon", label: "Honra",         abbr: "Hon" },
];

const POINT_COST = { 8:-2, 9:-1, 10:0, 11:1, 12:2, 13:3, 14:4, 15:6, 16:8, 17:11, 18:14 };
const POINT_BUDGET = 24;

function abilityMod(v) { return Math.floor((v - 10) / 2); }
function fmtMod(m) { return m >= 0 ? `+${m}` : `${m}`; }

const RACES = {
  humano: {
    label: "Humano", img: "assets/images/races/Humano.png",
    desc: "Versáteis e adaptáveis, os humanos recebem bônus em duas habilidades à escolha e talentos extras.",
    bonuses: {},
    choiceBonus: { count: 2, amount: 2 },
    abilities: [
      "2 perícias treinadas extras (podem ser fora da classe, mas é violação de honra leve).",
      "2 talentos extras (pré-requisitos ainda se aplicam).",
    ],
  },
  hanyo: {
    label: "Hanyô", img: "assets/images/races/Hanyo.png",
    desc: "Meio-youkai cheios de entusiasmo e esperteza, mas sem bom senso.",
    bonuses: { car: 4, int: 2, sab: -2 },
    abilities: [
      "Arcano: +4 em testes de Identificar Magia.",
      "Brincar com os sentimentos: chacra das emoções aberto (grau básico); soma bônus de Car a PM e limite; aprende e executa jutsus básicos de Car; aprende 1 jutsu básico de Car à escolha.",
      "Espírito livre: +4 em testes contra efeitos que restringem movimento (agarrar, redes, paralisia, etc.).",
      "Poder salvador: quando em perigo (metade ou menos de PV, ou CA reduzida em combate), executa jutsus/poderes com custo em PM por –1 PM (mínimo 1 PM).",
    ],
  },
  henge: {
    label: "Henge", img: "assets/images/races/Henge.png", img: "assets/images/races/Henge.png",
    desc: "Metamorfos ágeis e perceptivos com forma animal, mas físico frágil.",
    bonuses: { des: 4, sab: 2, for: -2 },
    abilities: [
      "Animal: imune a jutsus/efeitos que afetam apenas humanoides.",
      "Forma animal: transforma-se em 1 animal (Pequeno ou Mínimo) como ação completa, quantas vezes quiser.",
      "Movimento especial: deslocamento variado na forma animal (voo, natação, escalada, etc.) conforme a espécie.",
      "Arma natural: mordida ou garras na forma animal, conforme a espécie.",
      "Agilidade animal: Atletismo é baseado em Destreza, não Força.",
      "Sentidos aguçados: +4 em Percepção; detecta criaturas automaticamente a até 9m.",
      "Visão na penumbra: ignora camuflagem por escuridão; enxerga 2× mais longe com pouca luz.",
    ],
  },
  kaijin: {
    label: "Kaijin", img: "assets/images/races/Kaijin.png",
    desc: "Criaturas da Tormenta, fortes e resilientes, mas grotescas e desonradas.",
    bonuses: { for: 4, con: 2, car: -2, hon: -1 },
    abilities: [
      "Monstro: imune a jutsus/efeitos que afetam apenas humanoides.",
      "Afinidade com a Tormenta: jamais recebe níveis negativos por efeitos da Tormenta.",
      "Ameaçador: Intimidação é baseada em Força, não Carisma.",
      "Disforme: não pode usar itens mundanos normais; pode usar obra-prima (sob medida), mágicos ou de talentos/habilidades de classe.",
      "Talentos: recebe Anatomia Insana, Carapaça e mais 2 talentos da Tormenta à escolha (sem dano de Honra por eles).",
      "Visão no escuro: ignora camuflagem total por escuridão; enxerga normalmente no escuro (preto e branco).",
    ],
  },
  mashin: {
    label: "Mashin", img: "assets/images/races/Mashin.png",
    desc: "Construtos elementais adaptados à sociedade humana, criados para as mais variadas tarefas.",
    bonuses: { hon: 1 },
    choiceBonus: { count: 2, amount: 2 },
    abilities: [
      "Construto: imune a jutsus/efeitos que afetam apenas humanoides.",
      "Imunidades: atordoamento, doenças, enjoo, fadiga, luz, paralisia, trevas, sono e venenos; não precisa respirar, comer, beber ou dormir.",
      "Quase vivo: possui Constituição; recupera PV com descanso; não é destruído a 0 PV; pode ser ressuscitado.",
      "Sem cura: não recupera PV com curas mágicas; usa Ofício (metalurgia) no lugar de Cura.",
      "Cura elemental: escolha 1 descritor elemental — é imune ao dano desse tipo e cura metade do dano mágico recebido.",
      "Visão no escuro: ignora camuflagem total por escuridão; enxerga normalmente no escuro (preto e branco).",
    ],
  },
  nezumi: {
    label: "Nezumi", img: "assets/images/races/Nezumi.png",
    desc: "Ratovens rápidos e resistentes, mas rudes e primitivos.",
    bonuses: { con: 4, des: 2, int: -2, hon: -2 },
    abilities: [
      "Tamanho Pequeno: +1 CA, +1 ataque, +4 Furtividade, –4 manobras; usa armas como criaturas Médias.",
      "Deslocamento 9m (mesmo de criaturas Médias).",
      "Amedrontador: +4 em testes de Intimidação.",
      "Faro: +4 em Percepção; detecta criaturas automaticamente a até 9m.",
      "Visão na penumbra: ignora camuflagem por escuridão; enxerga 2× mais longe com pouca luz.",
    ],
  },
  ryuujin: {
    label: "Ryuujin", img: "assets/images/races/Ryuujin.png",
    desc: "Meio-dragões iluminados por Lin-Wu, honrados e resilientes, mas lentos a reagir.",
    bonuses: { sab: 4, for: 2, hon: 2, des: -2 },
    abilities: [
      "Digno: +4 em testes de Diplomacia.",
      "Honra superior: +1 CA e +1 ataque/dano contra adversários com Honra menor que a sua.",
      "Resistência celestial: escolha 3 descritores elementais — resistência 5 contra cada um.",
      "Sorte ancestral: +2 em todos os testes de resistência.",
      "Visão no escuro: ignora camuflagem total por escuridão; enxerga normalmente no escuro (preto e branco).",
    ],
  },
  vanara: {
    label: "Vanara", img: "assets/images/races/Vanara.png",
    desc: "Primatas eruditos, brilhantes e sábios, mas com compleição física fraca.",
    bonuses: { int: 4, sab: 2, hon: 1, con: -2 },
    abilities: [
      "Cauda preênsil: usa a cauda como mão inábil (segurar objetos, armas leves, escudos, selos de jutsus).",
      "Conheça o inimigo: margem de ameaça aumentada em +1 nos ataques.",
      "Culto: faz testes de Conhecimento sem treinamento; sempre pode escolher 10 nesses testes.",
      "Mente sobre a matéria: nos testes de Fortitude, rola também Vontade e fica com o melhor resultado.",
      "Visão na penumbra: ignora camuflagem por escuridão; enxerga 2× mais longe com pouca luz.",
    ],
  },
};

// CLASSES is defined in classes_data.js (loaded before this file)

// ══════════════════════════════════════════════════
//  ESTADO
// ══════════════════════════════════════════════════

let state = {
  mode: "roll",
  rolls: [],
  assignments: {},
  pointValues: {},
  race: null,
  raceChoices: [],
  classKey: null,
  level: 1,
  selectedSkills: [],
  selectedTalents: [],
};

function initState() {
  state.assignments = {};
  state.pointValues = {};
  state.raceChoices = [];
  state.selectedSkills = [];
  state.selectedTalents = [];
  ABILITIES.forEach(a => {
    state.assignments[a.key] = null;
    state.pointValues[a.key] = 10;
  });
}

initState();

// ══════════════════════════════════════════════════
//  ROLAGEM
// ══════════════════════════════════════════════════

function rollD6() { return Math.floor(Math.random() * 6) + 1; }

function roll4d6dropLowest() {
  const dice = [rollD6(), rollD6(), rollD6(), rollD6()];
  const sorted = [...dice].sort((a, b) => a - b);
  const sum = sorted[1] + sorted[2] + sorted[3];
  return { dice, sum };
}

function generateRolls() {
  state.rolls = Array.from({ length: 7 }, () => roll4d6dropLowest());
  state.assignments = {};
  ABILITIES.forEach(a => { state.assignments[a.key] = null; });
  renderRolls();
  renderAssignments();
  checkSummaryReady();
}

// ══════════════════════════════════════════════════
//  DISTRIBUIÇÃO POR PONTOS
// ══════════════════════════════════════════════════

function pointsSpent() {
  return ABILITIES.reduce((t, a) => t + (POINT_COST[state.pointValues[a.key]] ?? 0), 0);
}

function pointsLeft() { return POINT_BUDGET - pointsSpent(); }

// ══════════════════════════════════════════════════
//  BÔNUS RACIAIS
// ══════════════════════════════════════════════════

function raceBonusFor(abilityKey) {
  if (!state.race) return 0;
  const race = RACES[state.race];
  let bonus = race.bonuses[abilityKey] ?? 0;
  if (race.choiceBonus) {
    const count = state.raceChoices.filter(k => k === abilityKey).length;
    bonus += count * race.choiceBonus.amount;
  }
  return bonus;
}

function baseValueFor(abilityKey) {
  if (state.mode === "roll") {
    const idx = state.assignments[abilityKey];
    return idx !== null && idx !== undefined ? state.rolls[idx].sum : null;
  }
  return state.pointValues[abilityKey];
}

function finalValueFor(abilityKey) {
  const base = baseValueFor(abilityKey);
  if (base === null) return null;
  return base + raceBonusFor(abilityKey);
}

// ══════════════════════════════════════════════════
//  RENDER — ROLAGEM
// ══════════════════════════════════════════════════

function renderRolls() {
  const container = document.getElementById("rollsPool");
  if (!container) return;

  const usedIndices = new Set(Object.values(state.assignments).filter(v => v !== null));

  container.innerHTML = state.rolls.map((r, i) => {
    const used = usedIndices.has(i);
    const diceFaces = r.dice.map((d, di) => {
      const dropped = di === r.dice.indexOf(Math.min(...r.dice)) && !r.dice.slice(0, di).some((x, xi) => x === d);
      const isMin = r.dice.indexOf(Math.min(...r.dice)) === di;
      return `<span class="die-face ${isMin ? 'die-dropped' : ''}">${d}</span>`;
    }).join("");
    return `<div class="roll-chip ${used ? 'roll-chip-used' : ''}" data-roll="${i}" draggable="true" ondragstart="onRollDragStart(event,${i})">
      <div class="roll-chip-dice">${diceFaces}</div>
      <div class="roll-chip-sum">${r.sum}</div>
    </div>`;
  }).join("");
}

function onRollDragStart(e, idx) {
  e.dataTransfer.setData("rollIndex", idx);
}

function onAbilityDrop(e, abilityKey) {
  e.preventDefault();
  const idx = parseInt(e.dataTransfer.getData("rollIndex"));
  const prevOwner = Object.keys(state.assignments).find(k => state.assignments[k] === idx);
  if (prevOwner) state.assignments[prevOwner] = null;
  const displaced = state.assignments[abilityKey];
  if (displaced !== null && prevOwner) state.assignments[prevOwner] = displaced;
  state.assignments[abilityKey] = idx;
  renderRolls();
  renderAssignments();
  checkSummaryReady();
}

function onAbilityDragOver(e) { e.preventDefault(); }

function unassignRoll(abilityKey) {
  state.assignments[abilityKey] = null;
  renderRolls();
  renderAssignments();
  checkSummaryReady();
}

// ══════════════════════════════════════════════════
//  RENDER — DISTRIBUIÇÃO POR PONTOS
// ══════════════════════════════════════════════════

function changePointValue(abilityKey, delta) {
  const cur = state.pointValues[abilityKey];
  const levels = Object.keys(POINT_COST).map(Number).sort((a,b)=>a-b);
  const curIdx = levels.indexOf(cur);
  const newIdx = curIdx + delta;
  if (newIdx < 0 || newIdx >= levels.length) return;
  const newVal = levels[newIdx];
  const diff = (POINT_COST[newVal] ?? 0) - (POINT_COST[cur] ?? 0);
  if (diff > 0 && pointsLeft() < diff) return;
  state.pointValues[abilityKey] = newVal;
  renderPoints();
  checkSummaryReady();
}

function renderPoints() {
  const left = pointsLeft();
  const el = document.getElementById("pointsLeft");
  if (el) {
    el.textContent = left;
    el.className = "points-left-num " + (left < 0 ? "over-budget" : left === 0 ? "budget-zero" : "");
  }
  ABILITIES.forEach(a => {
    const v = state.pointValues[a.key];
    const row = document.getElementById(`pts-row-${a.key}`);
    if (!row) return;
    row.querySelector(".pts-value").textContent = v;
    row.querySelector(".pts-cost").textContent = fmtMod(POINT_COST[v] ?? 0) + " pts";
    row.querySelector(".pts-btn-down").disabled = v <= 8;
    row.querySelector(".pts-btn-up").disabled   = v >= 18 || pointsLeft() < 1;
    renderAbilityFinal(a.key);
  });
}

// ══════════════════════════════════════════════════
//  RENDER — ASSIGNMENTS (modo rolagem)
// ══════════════════════════════════════════════════

function renderAssignments() {
  ABILITIES.forEach(a => {
    const base = baseValueFor(a.key);
    const slot = document.getElementById(`slot-${a.key}`);
    if (!slot) return;
    if (base !== null) {
      slot.innerHTML = `<div class="slot-filled" onclick="unassignRoll('${a.key}')">
        <span class="slot-val">${base}</span>
        <span class="slot-remove" title="Remover">×</span>
      </div>`;
    } else {
      slot.innerHTML = `<div class="slot-empty">Arraste</div>`;
    }
    renderAbilityFinal(a.key);
  });
}

function renderAbilityFinal(key) {
  const final = finalValueFor(key);
  const el = document.getElementById(`final-${key}`);
  const modEl = document.getElementById(`mod-${key}`);
  const bonus = raceBonusFor(key);
  if (!el) return;
  if (final !== null) {
    el.textContent = final;
    el.className = "ability-final has-value";
    if (modEl) {
      modEl.textContent = fmtMod(abilityMod(final));
      modEl.className = "ability-mod " + (abilityMod(final) >= 0 ? "mod-pos" : "mod-neg");
    }
  } else {
    el.textContent = "—";
    el.className = "ability-final";
    if (modEl) { modEl.textContent = "—"; modEl.className = "ability-mod"; }
  }
  const bonusEl = document.getElementById(`bonus-${key}`);
  if (bonusEl) {
    if (bonus !== 0) {
      bonusEl.textContent = fmtMod(bonus);
      bonusEl.className = "ability-race-bonus " + (bonus > 0 ? "bonus-pos" : "bonus-neg");
      bonusEl.style.display = "";
    } else {
      bonusEl.style.display = "none";
    }
  }
}

// ══════════════════════════════════════════════════
//  RENDER — RAÇA
// ══════════════════════════════════════════════════

function selectRace(key) {
  state.race = key;
  state.raceChoices = [];
  document.querySelectorAll(".race-card").forEach(c => c.classList.toggle("selected", c.dataset.race === key));
  renderRaceDetail();
  renderAllAbilityFinals();
  checkSummaryReady();
}

function renderRaceDetail() {
  const panel = document.getElementById("raceDetail");
  if (!panel) return;
  if (!state.race) { panel.innerHTML = ""; return; }
  const race = RACES[state.race];

  let bonusHtml = "";
  const bonusEntries = Object.entries(race.bonuses ?? {});
  if (bonusEntries.length) {
    bonusHtml = bonusEntries.map(([k, v]) => {
      const ab = ABILITIES.find(a => a.key === k);
      return `<span class="bonus-tag ${v > 0 ? 'pos' : 'neg'}">${v > 0 ? "+" : ""}${v} ${ab?.abbr ?? k}</span>`;
    }).join(" ");
  }

  let choiceHtml = "";
  if (race.choiceBonus) {
    const chosen = state.raceChoices;
    choiceHtml = `<div class="choice-bonus-wrap">
      <p class="choice-label">Escolha ${race.choiceBonus.count} habilidade(s) para +${race.choiceBonus.amount}:</p>
      <div class="choice-btns">
        ${ABILITIES.map(a => {
          const cnt = chosen.filter(k => k === a.key).length;
          const maxed = chosen.length >= race.choiceBonus.count;
          return `<button class="choice-btn ${cnt > 0 ? 'chosen' : ''}" onclick="toggleRaceChoice('${a.key}')" ${(!cnt && maxed) ? 'disabled' : ''}>${a.abbr}</button>`;
        }).join("")}
      </div>
    </div>`;
  }

  const abilitiesHtml = race.abilities.map(ab => `<li>${ab}</li>`).join("");

  panel.innerHTML = `
    <div class="race-detail-inner">
      <div class="race-detail-header-row">
        ${race.img ? `<img class="race-detail-img no-interaction" src="${race.img}" alt="${race.label}"/>` : ""}
        <div>
          <h4 class="race-detail-name">${race.label}</h4>
          <p class="race-detail-desc">${race.desc}</p>
        </div>
      </div>
      ${bonusHtml ? `<div class="race-bonus-tags">${bonusHtml}</div>` : ""}
      ${choiceHtml}
      <ul class="race-abilities-list">${abilitiesHtml}</ul>
    </div>`;
}

function toggleRaceChoice(key) {
  const race = RACES[state.race];
  if (!race?.choiceBonus) return;
  const idx = state.raceChoices.indexOf(key);
  if (idx >= 0) {
    state.raceChoices.splice(idx, 1);
  } else {
    if (state.raceChoices.length >= race.choiceBonus.count) return;
    state.raceChoices.push(key);
  }
  renderRaceDetail();
  renderAllAbilityFinals();
  checkSummaryReady();
}

function renderAllAbilityFinals() {
  ABILITIES.forEach(a => renderAbilityFinal(a.key));
  if (state.mode === "points") renderPoints();
}

// ══════════════════════════════════════════════════
//  RENDER — CLASSE
// ══════════════════════════════════════════════════

function selectClass(key) {
  state.classKey = key;
  state.selectedSkills = []; // reset skills when class changes
  document.querySelectorAll(".class-card").forEach(c => c.classList.toggle("selected", c.dataset.class === key));
  renderClassDetail();
  renderSkillsPanel();
  checkSummaryReady();
}

function selectLevel(lvl) {
  state.level = parseInt(lvl);
  renderClassDetail();
  renderSkillsPanel();
  checkSummaryReady();
}

function renderClassDetail() {
  const panel = document.getElementById("classDetail");
  if (!panel) return;
  if (!state.classKey) { panel.innerHTML = ""; return; }

  const cls = CLASSES[state.classKey];
  const lvl = state.level;

  // Level selector row
  const levelBtns = Array.from({length:20}, (_,i) => i+1).map(n =>
    `<button class="level-btn ${n === lvl ? 'level-active' : ''}" onclick="selectLevel(${n})">${n}</button>`
  ).join("");

  // Stats for current level
  const conFinal = finalValueFor("con");
  const conMod = conFinal !== null ? abilityMod(conFinal) : null;
  const pvTotal = conMod !== null
    ? cls.pv_base + conMod + (lvl - 1) * (cls.pv_nivel + conMod)
    : cls.pv_base + cls.pv_nivel * (lvl - 1);
  const pvDisplay = conMod !== null ? pvTotal : `${pvTotal} + mod. Con`;
  const pmTotal = cls.pm_base + cls.pm_nivel * (lvl - 1);

  // Level table — highlight up to current level
  const tableRows = cls.tabela.map(row => {
    const isCurrent = row.nivel === lvl;
    const isPast    = row.nivel <= lvl;
    return `<tr class="${isCurrent ? 'row-current' : ''} ${isPast ? 'row-past' : 'row-future'}">
      <td class="ctbl-nivel">${row.nivel}º</td>
      <td class="ctbl-bba">+${row.bba}</td>
      <td class="ctbl-hab">${row.hab.join(", ")}</td>
    </tr>`;
  }).join("");

  // Use explicit nivel_inicial map for clean, reliable matching
  const nivelInicial = cls.nivel_inicial || {};
  const gainedNames = new Set(
    Object.entries(nivelInicial)
      .filter(([, n]) => n <= lvl)
      .map(([name]) => name)
  );

  // Only show gained abilities; hide locked ones entirely
  const abilitiesHtml = Object.entries(cls.habilidades)
    .filter(([name]) => gainedNames.has(name))
    .map(([name, desc]) => `<div class="class-ability ability-gained">
      <div class="class-ability-header">
        <span class="class-ability-name">${name}</span>
        <span class="ability-status-badge gained">✓ Obtida</span>
      </div>
      <p class="class-ability-desc">${desc}</p>
    </div>`)
    .join("")
    || `<p class="no-abilities-yet">Nenhuma habilidade desbloqueada neste nível.</p>`;

  panel.innerHTML = `
    <div class="jade-card class-detail-card">
      <div class="jade-card-inner">
        <div class="card-ornament-top" aria-hidden="true">✦ ─── ✦</div>

        <div class="class-detail-header">
          <img class="class-detail-img no-interaction" src="${cls.img}" alt="${cls.label}"/>
          <div>
            <h4 class="class-detail-name">${cls.label}</h4>
            <p class="class-detail-desc">${cls.desc}</p>
          </div>
        </div>

        <div class="class-stats-row">
          <div class="cstat"><span class="cstat-label">Honra</span><span class="cstat-val">${cls.honra}</span></div>
          <div class="cstat"><span class="cstat-label">PV base</span><span class="cstat-val">${cls.pv_base} + ${cls.pv_nivel}/nív.</span></div>
          <div class="cstat"><span class="cstat-label">PM base</span><span class="cstat-val">${cls.pm_base} + ${cls.pm_nivel}/nív.</span></div>
          <div class="cstat"><span class="cstat-label">Perícias</span><span class="cstat-val">${cls.pericias_treinadas}</span></div>
        </div>

        <div class="class-detail-chars">
          <details class="char-details">
            <summary>Perícias de Classe & Talentos Iniciais</summary>
            <p><strong>Perícias:</strong> ${cls.pericias_classe}</p>
            <p><strong>Talentos iniciais:</strong> ${cls.talentos_iniciais}</p>
          </details>
        </div>

        <div class="level-selector-wrap">
          <div class="level-selector-label">Nível de início:</div>
          <div class="level-btns-grid">${levelBtns}</div>
        </div>

        <div class="level-stats-bar">
          <div class="lstat lstat-lvl"><span>Nível ${lvl}</span></div>
          <div class="lstat"><span class="lstat-label">BBA</span><span class="lstat-val">+${cls.tabela[lvl-1].bba}</span></div>
          <div class="lstat"><span class="lstat-label">PV máx.</span><span class="lstat-val">${pvDisplay}</span></div>
          <div class="lstat"><span class="lstat-label">PM máx.</span><span class="lstat-val">${pmTotal}</span></div>
        </div>

        <div class="class-table-wrap">
          <table class="class-table">
            <thead>
              <tr><th>Nível</th><th>BBA</th><th>Habilidades de Classe</th></tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        </div>

        <div class="class-abilities-section">
          <h5 class="class-abilities-title">Habilidades de Classe</h5>
          <div class="class-abilities-list">${abilitiesHtml}</div>
        </div>

        <div class="card-ornament-bottom" aria-hidden="true">✦ ─── ✦</div>
      </div>
    </div>`;
}

// ══════════════════════════════════════════════════
//  RESUMO / VALIDAÇÃO
// ══════════════════════════════════════════════════

function allAbilitiesSet() {
  if (state.mode === "roll") {
    return ABILITIES.every(a => state.assignments[a.key] !== null);
  }
  return pointsLeft() >= 0;
}

function raceChoicesComplete() {
  if (!state.race) return false;
  const race = RACES[state.race];
  if (!race.choiceBonus) return true;
  return state.raceChoices.length === race.choiceBonus.count;
}

// ══════════════════════════════════════════════════
//  PERÍCIAS
// ══════════════════════════════════════════════════

function skillSlotCount() {
  if (!state.classKey) return 0;
  const cls = CLASSES[state.classKey];
  const intMod = abilityMod(finalValueFor("int") ?? 10);
  const formula = cls.pericias_treinadas || "2 + modificador de Inteligência";
  const base = parseInt(formula.match(/^(\d+)/)?.[1] ?? "2");
  const extraHumano = (state.race === "humano") ? 2 : 0;
  return Math.max(1, base + intMod) + extraHumano;
}

// Map capitalized attr abbreviations → ability state keys
const ATTR_TO_KEY = { For:"for", Des:"des", Con:"con", Int:"int", Sab:"sab", Car:"car", Hon:"hon" };

function skillBonus(skillName, trained) {
  const skill = SKILLS_DATA[skillName];
  if (!skill) return null;
  const attrKey = ATTR_TO_KEY[skill.attr];
  const attrFinal = finalValueFor(attrKey);
  if (attrFinal === null) return null;
  const mod = abilityMod(attrFinal);
  const lvl = state.level;
  if (trained) {
    // 3 (treino) + nível + modificador
    return 3 + lvl + mod;
  } else {
    // metade do nível arredondado para baixo + modificador
    return Math.floor(lvl / 2) + mod;
  }
}

function skillBonusHtml(skillName, trained) {
  const bonus = skillBonus(skillName, trained);
  if (bonus === null) return "";
  const cls = bonus >= 0 ? "skill-bonus-pos" : "skill-bonus-neg";
  const trainLabel = trained ? " <span class='skill-bonus-source'>(treino)</span>" : " <span class='skill-bonus-source'>(sem treino)</span>";
  return `<span class="skill-bonus-tag ${cls}">${fmtMod(bonus)}${trainLabel}</span>`;
}

function isSkillSelected(name) {
  return state.selectedSkills.some(s => s.name === name);
}

function toggleSkill(name) {
  const idx = state.selectedSkills.findIndex(s => s.name === name);
  if (idx >= 0) {
    state.selectedSkills.splice(idx, 1);
  } else {
    const slots = skillSlotCount();
    if (state.selectedSkills.length >= slots) return;
    const skill = SKILLS_DATA[name];
    state.selectedSkills.push({ name, specialty: skill?.specialties ? skill.specialties[0] : null });
  }
  renderSkillsPanel();
  checkSummaryReady();
}

function setSkillSpecialty(name, value) {
  const entry = state.selectedSkills.find(s => s.name === name);
  if (entry) entry.specialty = value;
  renderSkillsPanel();
}

function getSkillWarnings(name) {
  if (!state.classKey) return [];
  const skill = SKILLS_DATA[name];
  const classSkills = CLASS_SKILLS[state.classKey] || [];
  const warnings = [];
  if (skill?.armor) warnings.push({ type: "armor", label: "Penalidade de armadura" });
  if (skill?.honor) warnings.push({ type: "honor", label: `Violação de honra ${skill.honor}` });
  if (!classSkills.includes(name)) warnings.push({ type: "outclass", label: "Fora das perícias de classe (violação de honra leve)" });
  return warnings;
}

function warningBadgesHtml(warnings) {
  if (!warnings.length) return "";
  return warnings.map(w => {
    const icons = { armor: "🛡️", honor: "⚠️", outclass: "⚠️" };
    const colors = { armor: "warn-armor", honor: "warn-honor", outclass: "warn-honor" };
    return `<span class="skill-warn-badge ${colors[w.type]}" title="${w.label}">${icons[w.type]} ${w.label}</span>`;
  }).join("");
}

function renderSkillsPanel() {
  const panel = document.getElementById("skillsPanel");
  if (!panel) return;

  if (!state.classKey) {
    panel.innerHTML = `<p class="skills-no-class">Selecione uma classe primeiro para ver as perícias disponíveis.</p>`;
    return;
  }

  const slots = skillSlotCount();
  const used  = state.selectedSkills.length;
  const classSkills = CLASS_SKILLS[state.classKey] || [];
  const allSkillNames = Object.keys(SKILLS_DATA).sort();

  // Split into class skills and out-of-class
  const inClass  = allSkillNames.filter(n =>  classSkills.includes(n));
  const outClass = allSkillNames.filter(n => !classSkills.includes(n));

  function skillRowHtml(name) {
    const skill    = SKILLS_DATA[name];
    const selected = isSkillSelected(name);
    const entry    = state.selectedSkills.find(s => s.name === name);
    const warnings = getSkillWarnings(name);
    const atFull   = used >= slots && !selected;
    const badgesHtml = warningBadgesHtml(warnings);

    // Show bonus: trained if selected AND trained-only or not trained-only
    // Untrained skills always show the untrained bonus; trained-only only show when selected
    const isTrained = selected;
    const showBonus = !skill.trained || selected; // trained-only: only when selected
    const bonusHtml = showBonus ? skillBonusHtml(name, isTrained) : "";

    const specialtyHtml = selected && skill?.specialties
      ? `<select class="skill-specialty-select" onchange="setSkillSpecialty('${name}', this.value)">
          ${skill.specialties.map(sp =>
            `<option value="${sp}" ${entry?.specialty === sp ? "selected" : ""}>${sp}</option>`
          ).join("")}
        </select>`
      : "";

    return `<label class="skill-row ${selected ? "skill-selected" : ""} ${atFull ? "skill-disabled" : ""} ${warnings.length ? "skill-has-warn" : ""}">
      <input type="checkbox" class="skill-checkbox" ${selected ? "checked" : ""} ${atFull ? "disabled" : ""}
        onchange="toggleSkill('${name}')"/>
      <span class="skill-info">
        <span class="skill-name">${name}</span>
        <span class="skill-attr">${skill.attr}</span>
        ${skill.trained ? '<span class="skill-trained-tag">só treinado</span>' : ""}
        ${bonusHtml}
        ${badgesHtml}
        ${specialtyHtml}
      </span>
    </label>`;
  }

  const slotColor = used >= slots ? "slots-full" : used > 0 ? "slots-partial" : "";

  panel.innerHTML = `
    <div class="skills-budget ${slotColor}">
      <span class="skills-budget-label">Perícias treinadas:</span>
      <span class="skills-budget-num">${used} / ${slots}</span>
      ${used >= slots ? '<span class="skills-budget-note">Limite atingido</span>' : ''}
    </div>

    <div class="skills-section">
      <div class="skills-section-title">📚 Perícias de Classe</div>
      <div class="skills-list">${inClass.map(skillRowHtml).join("")}</div>
    </div>

    <div class="skills-section skills-outclass-section">
      <div class="skills-section-title">
        ⚠️ Fora da Classe
        <span class="skills-section-note">(violação de honra leve)</span>
      </div>
      <div class="skills-list">${outClass.map(skillRowHtml).join("")}</div>
    </div>`;
}

function skillsSummaryHtml() {
  const allSkillNames = Object.keys(SKILLS_DATA).sort();
  return allSkillNames.map(name => {
    const skill      = SKILLS_DATA[name];
    const selected   = isSkillSelected(name);
    const entry      = state.selectedSkills.find(s => s.name === name);
    const warnings   = selected ? getSkillWarnings(name) : [];
    const badges     = warningBadgesHtml(warnings);
    const spec       = entry?.specialty ? ` <span class="sum-skill-spec">(${entry.specialty})</span>` : "";
    const isTrained  = selected;
    const total      = skillBonus(name, isTrained);
    const attrKey    = ATTR_TO_KEY[skill?.attr];
    const attrFinal  = attrKey ? finalValueFor(attrKey) : null;
    const mod        = attrFinal !== null ? abilityMod(attrFinal) : 0;
    const lvl        = state.level;

    const breakdown = attrFinal !== null
      ? selected
        ? `<span class="sum-skill-breakdown">treino +3 · nível +${lvl} · ${skill.attr} ${fmtMod(mod)}</span>`
        : `<span class="sum-skill-breakdown">½ nível +${Math.floor(lvl/2)} · ${skill.attr} ${fmtMod(mod)}</span>`
      : "";

    return `<div class="sum-skill-row ${selected ? "sum-skill-trained" : "sum-skill-untrained"}">
      <div class="sum-skill-main">
        <span class="sum-skill-name">${name}${spec}</span>
        ${selected ? '<span class="sum-skill-trained-badge">Treinada</span>' : ""}
        ${badges}
      </div>
      <div class="sum-skill-meta">
        ${breakdown}
        <span class="sum-skill-total ${total !== null && total >= 0 ? "sum-skill-pos" : "sum-skill-neg"}">${total !== null ? fmtMod(total) : "—"}</span>
      </div>
    </div>`;
  }).join("");
}

function checkSummaryReady() {
  const ready = allAbilitiesSet() && state.race && raceChoicesComplete() && state.classKey;
  const btn = document.getElementById("showSummaryBtn");
  if (btn) btn.disabled = !ready;
  if (ready) renderSummary();
  renderSkillsPanel();
  if (typeof renderTalentsPanel === "function") renderTalentsPanel();
}

function renderSummary() {
  const section = document.getElementById("summarySection");
  if (!section) return;
  section.style.display = "";

  const race = RACES[state.race];
  const cls  = CLASSES[state.classKey];

  const abRows = ABILITIES.map(a => {
    const base  = baseValueFor(a.key) ?? "—";
    const bonus = raceBonusFor(a.key);
    const final = finalValueFor(a.key);
    const mod   = final !== null ? fmtMod(abilityMod(final)) : "—";
    const bonusStr = bonus !== 0 ? `<span class="${bonus>0?'sum-bonus-pos':'sum-bonus-neg'}">${fmtMod(bonus)}</span>` : `<span class="sum-bonus-zero">—</span>`;
    return `<tr>
      <td class="sum-ability-name">${a.label}</td>
      <td class="sum-base">${base}</td>
      <td class="sum-bonus">${bonusStr}</td>
      <td class="sum-final ${final !== null ? 'sum-final-val' : ''}">${final ?? "—"}</td>
      <td class="sum-mod ${final!==null ? (abilityMod(final)>=0?'sum-mod-pos':'sum-mod-neg') : ''}">${mod}</td>
    </tr>`;
  }).join("");

  const totalMod = ABILITIES.reduce((t, a) => {
    const f = finalValueFor(a.key);
    return t + (f !== null ? abilityMod(f) : 0);
  }, 0);

  section.innerHTML = `
    <div class="jade-card summary-card">
      <div class="jade-card-inner">
        <div class="card-ornament-top" aria-hidden="true">✦ ─── ✦</div>
        <h3 class="summary-title">Resumo do Personagem</h3>
        <div class="summary-meta">
          <div class="sum-meta-item">
            <span class="sum-meta-label">Raça</span>
            <span class="sum-meta-value">${race.label}</span>
          </div>
          <div class="sum-meta-item">
            <span class="sum-meta-label">Classe</span>
            <span class="sum-meta-value">${cls.icon} ${cls.label}</span>
          </div>
          <div class="sum-meta-item">
            <span class="sum-meta-label">Nível</span>
            <span class="sum-meta-value">${state.level}º</span>
          </div>
          <div class="sum-meta-item">
            <span class="sum-meta-label">BBA</span>
            <span class="sum-meta-value">+${cls.tabela[state.level-1].bba}</span>
          </div>
          <div class="sum-meta-item">
            <span class="sum-meta-label">PV máx.</span>
            <span class="sum-meta-value">${(()=>{
              const conFinal = finalValueFor("con");
              const conMod = conFinal !== null ? abilityMod(conFinal) : 0;
              const lvl = state.level;
              const pv = cls.pv_base + conMod + (lvl - 1) * (cls.pv_nivel + conMod);
              const conStr = conMod >= 0 ? `+${conMod} Con/nív.` : `${conMod} Con/nív.`;
              return conFinal !== null ? pv : `${cls.pv_base + (lvl-1)*cls.pv_nivel} + mod. Con`;
            })()}</span>
          </div>
          <div class="sum-meta-item">
            <span class="sum-meta-label">Método</span>
            <span class="sum-meta-value">${state.mode === "roll" ? "Rolagem de Dados" : "Distribuição de Pontos"}</span>
          </div>
        </div>
        <table class="summary-table">
          <thead>
            <tr>
              <th>Habilidade</th>
              <th>Base</th>
              <th>Racial</th>
              <th>Final</th>
              <th>Mod</th>
            </tr>
          </thead>
          <tbody>${abRows}</tbody>
        </table>
        <p class="sum-total-mod">Soma dos modificadores: <strong>${fmtMod(totalMod)}</strong></p>

        <div class="sum-skills-section">
          <h4 class="sum-skills-title">Perícias</h4>
          ${skillsSummaryHtml()}
        </div>

        <div class="sum-skills-section">
          <h4 class="sum-skills-title">Talentos</h4>
          ${typeof talentsSummaryHtml === "function" ? talentsSummaryHtml() : "<em>Carregando...</em>"}
        </div>

        <div class="card-ornament-bottom" aria-hidden="true">✦ ─── ✦</div>
      </div>
    </div>`;
}

// ══════════════════════════════════════════════════
//  INIT / MODE SWITCH
// ══════════════════════════════════════════════════

function switchMode(mode) {
  state.mode = mode;
  initState();
  document.getElementById("modeRoll").classList.toggle("mode-active", mode === "roll");
  document.getElementById("modePoints").classList.toggle("mode-active", mode === "points");
  document.getElementById("rollPanel").style.display  = mode === "roll" ? "" : "none";
  document.getElementById("pointsPanel").style.display = mode === "points" ? "" : "none";
  if (mode === "roll") { state.rolls = []; renderRolls(); renderAssignments(); }
  if (mode === "points") { ABILITIES.forEach(a => { state.pointValues[a.key] = 10; }); renderPoints(); renderAssignments(); }
  renderAllAbilityFinals();
  checkSummaryReady();
}
