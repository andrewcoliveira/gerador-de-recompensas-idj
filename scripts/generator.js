// --- UTILITÁRIOS BASE ---

const dictionaries = {};
let rollLog = [];

function rollDie(rolls, die) {
  let sum = 0;
  for (let i = 0; i < rolls; i++) {
    sum += Math.floor(Math.random() * die) + 1;
  }
  return sum;
}

function formatPrice(price) {
  return price.toLocaleString("pt-BR") + " ¥o";
}

function describeTableResult(value) {
  if (!value || value === "-") return "Nenhum item";
  if (typeof value === "string") return value;
  if (value.examples) {
    const p = value.price;
    const expr = typeof p === "number"
      ? `${p} ¥o`
      : `${p.rolls}d${p.die}${p.mult > 1 ? ` × ${p.mult}` : ""} ¥o`;
    return `Faixa: ${expr}`;
  }
  if (value.name !== undefined && value.price !== undefined) return `${value.name} (${formatPrice(value.price)})`;
  if (value.name !== undefined && value.bonus_equiv !== undefined) return `${value.name} (equiv. +${value.bonus_equiv})`;
  switch (value.type) {
    case "equipment": {
      const labels = { weapons: "Arma", armors: "Armadura", items: "Item", clothings: "Vestimenta" };
      const base = labels[value.dict] || value.dict;
      return value.special ? `${base} de material especial` : base;
    }
    case "magic_item": return `Item mágico ${value.tier}`;
    case "magic_item_type": {
      const cats = { armas: "Armas", armaduras: "Armaduras", ofuda: "Ofuda", amuletos: "Amuletos", acessorios: "Acessórios" };
      return cats[value.category] || value.category;
    }
    case "riches": {
      const [rolls, die, mod, mult, symbol] = value.args;
      const modStr = mod ? ` + ${mod}` : "";
      return `${rolls}d${die}${modStr} × ${mult} ${symbol}`;
    }
    case "rare": return value.dict === "gems" ? "Gema(s)" : "Obra(s) de arte";
    case "magic_bonus": return `Bônus +${value.bonus}`;
    case "special_power": return "Poder especial";
    case "specific": return "Item específico";
    case "jutsu": return `Jutsu ${value.tier === "basic" ? "básico" : "mediano"}`;
    default: return value.type;
  }
}

function rollFromTable(table, label) {
  const roll = rollDie(1, 100);
  for (const [threshold, value] of table) {
    if (roll <= threshold) {
      rollLog.push({ type: "d100", roll, label, result: describeTableResult(value) });
      return value;
    }
  }
  return null;
}

function resolvePriceFormula(formula, context = "") {
  if (typeof formula === "number") return formula;
  const { rolls, die, mult = 1 } = formula;
  const raw = rollDie(rolls, die);
  const result = raw * mult;
  const expression = `${rolls}d${die}${mult > 1 ? ` × ${mult}` : ""}`;
  rollLog.push({ type: "formula", expression, result, label: context ? `Valor: ${context}` : "Valor" });
  return result;
}

// --- GERADORES LÓGICOS ---

function equipmentGenerator(dictName, isSpecialMaterial = false) {
  const dict = dictionaries[dictName];
  if (!dict) return `Erro: Dicionário ${dictName} não encontrado`;

  const dictLabels = { weapons: "Arma base", armors: "Armadura base", items: "Item", clothings: "Vestimenta" };
  const result = rollFromTable(dict, dictLabels[dictName] || dictName);

  if (result && typeof result === "object" && result.type) {
    return resolveAction(result);
  }

  const equipment = result || "Item desconhecido";

  if (isSpecialMaterial && dictionaries.materials) {
    const material = rollFromTable(dictionaries.materials, "Material especial");
    if (material) return `${equipment} de ${material}`;
  }

  return equipment;
}

function richesGenerator(rolls, die, modifier, multiplicator, symbol) {
  const raw = rollDie(rolls, die);
  const result = (raw + modifier) * multiplicator;
  const modStr = modifier ? ` + ${modifier}` : "";
  const expression = `${rolls}d${die}${modStr}${multiplicator > 1 ? ` × ${multiplicator}` : ""}`;
  rollLog.push({ type: "formula", expression, result, label: `Valor em ${symbol}` });
  return `${result} ${symbol}`;
}

function rareItemGenerator(rolls, die, modifier, dictName) {
  const dict = dictionaries[dictName];
  const rawQty = rollDie(rolls, die);
  const quantity = rawQty + modifier;
  const modStr = modifier ? ` + ${modifier}` : "";
  const typeLabel = dictName === "gems" ? "gemas" : "obras de arte";
  const singular = dictName === "gems" ? "gema" : "obra de arte";
  rollLog.push({ type: "formula", expression: `${rolls}d${die}${modStr}`, result: quantity, label: `Quantidade de ${typeLabel}` });

  const inventory = new Map();
  let totalValue = 0;

  for (let i = 0; i < quantity; i++) {
    const itemData = rollFromTable(dict, `Faixa de valor (${singular} ${i + 1})`);
    if (!itemData) continue;

    const example = itemData.examples[Math.floor(Math.random() * itemData.examples.length)];
    const price = resolvePriceFormula(itemData.price, example);

    if (inventory.has(example)) {
      const entry = inventory.get(example);
      entry.qty++;
      entry.prices.push(price);
    } else {
      inventory.set(example, { qty: 1, prices: [price] });
    }
    totalValue += price;
  }

  const itemsFormatted = Array.from(inventory.entries()).map(([name, { qty, prices }]) => {
    const pricesStr = prices.map((p) => `${p} ¥o`).join(qty === 2 ? " e " : ", ");
    return qty > 1 ? `(${qty}x) ${name} (${pricesStr})` : `${name} (${prices[0]} ¥o)`;
  });

  return itemsFormatted.length > 0
    ? `${itemsFormatted.join(", ")}. Total: ${totalValue} ¥o`
    : "Nenhum item encontrado";
}

// --- GERADORES DE ITENS MÁGICOS ---
function magicWeaponGenerator(tier) {
  const baseWeapon = equipmentGenerator("weapons");
  if (typeof baseWeapon !== "string") return baseWeapon;

  let magicBonus = 0;
  let totalEquiv = 0;
  const powers = [];

  const dict = dictionaries.magic_weapons[tier];
  if (!dict) return "Erro: tabela de armas mágicas não encontrada";

  function processOneRoll() {
    const result = rollFromTable(dict, `Propriedade mágica (${tier})`);
    if (!result) return "stop";

    if (result.type === "magic_bonus") {
      const desiredBonus = result.bonus;
      const newBonus = Math.min(magicBonus + desiredBonus, 5);
      const addedBonus = newBonus - magicBonus;
      if (addedBonus > 0) {
        magicBonus = newBonus;
        totalEquiv += addedBonus;
      }
      return "stop";
    }

    if (result.type === "specific") {
      const specificDict = dictionaries[result.dict]?.[tier];
      if (specificDict) {
        const specificItem = rollFromTable(specificDict, "Arma específica");
        if (specificItem) {
          return { specific: true, name: specificItem.name, price: specificItem.price };
        }
      }
      return "stop";
    }

    if (result.type === "special_power") {
      const powerDict = dictionaries[result.dict]?.[tier];
      if (!powerDict) return "stop";
      const power = rollFromTable(powerDict, "Poder específico");
      if (!power) return "stop";

      const equiv = power.bonus_equiv || 0;
      if (totalEquiv + equiv > 10) {
        return "stop";
      }
      powers.push({ name: power.name, bonus_equiv: equiv });
      totalEquiv += equiv;
      return "continue";
    }

    return "stop";
  }

  let action = processOneRoll();

  if (action && typeof action === "object" && action.specific) {
    return `${action.name} (${formatPrice(action.price)})`;
  }

  while (action === "continue" && totalEquiv < 10) {
    action = processOneRoll();
    if (action && typeof action === "object" && action.specific) {
      return `${action.name} (${formatPrice(action.price)})`;
    }
  }

  let description = baseWeapon;
  if (magicBonus > 0) description += ` +${magicBonus}`;
  if (powers.length > 0) {
    description += ` ${powers.map(p => p.name).join(" e ")}`;
  }
  if (totalEquiv > 0) description += ` (equiv. +${totalEquiv})`;

  return description;
}

function magicArmorGenerator(tier) {
  const baseArmor = equipmentGenerator("armors");
  if (typeof baseArmor !== "string") return baseArmor;

  let magicBonus = 0;
  let totalEquiv = 0;
  const powers = [];

  const dict = dictionaries.magic_armors[tier];
  if (!dict) return "Erro: tabela de armaduras mágicas não encontrada";

  function processOneRoll() {
    const result = rollFromTable(dict, `Propriedade mágica (${tier})`);
    if (!result) return "stop";

    if (result.type === "magic_bonus") {
      const desiredBonus = result.bonus;
      const newBonus = Math.min(magicBonus + desiredBonus, 5);
      const addedBonus = newBonus - magicBonus;
      if (addedBonus > 0) {
        magicBonus = newBonus;
        totalEquiv += addedBonus;
      }
      return "stop";
    }

    if (result.type === "specific") {
      const specificDict = dictionaries[result.dict]?.[tier];
      if (specificDict) {
        const specificItem = rollFromTable(specificDict, "Armadura específica");
        if (specificItem) {
          return { specific: true, name: specificItem.name, price: specificItem.price };
        }
      }
      return "stop";
    }

    if (result.type === "special_power") {
      const powerDict = dictionaries[result.dict]?.[tier];
      if (!powerDict) return "stop";
      const power = rollFromTable(powerDict, "Poder específico");
      if (!power) return "stop";

      const equiv = power.bonus_equiv || 0;
      if (totalEquiv + equiv > 10) {
        return "stop";
      }
      powers.push({ name: power.name, bonus_equiv: equiv });
      totalEquiv += equiv;
      return "continue";
    }

    return "stop";
  }

  let action = processOneRoll();
  if (action && typeof action === "object" && action.specific) {
    return `${action.name} (${formatPrice(action.price)})`;
  }

  while (action === "continue" && totalEquiv < 10) {
    action = processOneRoll();
    if (action && typeof action === "object" && action.specific) {
      return `${action.name} (${formatPrice(action.price)})`;
    }
  }

  let description = baseArmor;
  if (magicBonus > 0) description += ` +${magicBonus}`;
  if (powers.length > 0) {
    description += ` ${powers.map(p => p.name).join(" e ")}`;
  }
  if (totalEquiv > 0) description += ` (equiv. +${totalEquiv})`;

  return description;
}

function ofudaGenerator(tier) {
  const result = rollFromTable(dictionaries.ofuda[tier], `Grau de jutsu (${tier})`);
  if (!result) return "Ofuda desconhecida";
  const jutsuDict = result.tier === "basic" ? dictionaries.jutsus_basic : dictionaries.jutsus_medium;
  const jutsu = rollFromTable(jutsuDict, "Jutsu");
  return `Ofuda: ${jutsu} (${formatPrice(result.price)})`;
}

function amuletGenerator(tier) {
  const item = rollFromTable(dictionaries.amulets[tier], `Amuleto (${tier})`);
  if (!item) return "Amuleto desconhecido";
  return `Amuleto de ${item.name} (${formatPrice(item.price)})`;
}

function accessoryGenerator(tier) {
  const item = rollFromTable(dictionaries.accessories[tier], `Acessório (${tier})`);
  if (!item) return "Acessório desconhecido";
  return `${item.name} (${formatPrice(item.price)})`;
}

function magicItemGenerator(tier) {
  const categoryAction = rollFromTable(dictionaries.magic_items[tier], `Categoria (item mágico ${tier})`);
  if (!categoryAction) return "Item mágico não encontrado";

  switch (categoryAction.category) {
    case "armas": return magicWeaponGenerator(tier);
    case "armaduras": return magicArmorGenerator(tier);
    case "ofuda": return ofudaGenerator(tier);
    case "amuletos": return amuletGenerator(tier);
    case "acessorios": return accessoryGenerator(tier);
    default: return "Categoria desconhecida";
  }
}

// --- RESOLVER CENTRAL ---

const actionResolvers = {
  equipment: (action) => equipmentGenerator(action.dict, action.special || false),
  riches: (action) => richesGenerator(...action.args),
  rare: (action) => rareItemGenerator(...action.args, action.dict),
  magic_item: (action) => magicItemGenerator(action.tier),
};

function resolveAction(action) {
  if (!action) return "-";
  if (typeof action === "string") return action;
  return actionResolvers[action.type]?.(action) ?? "Ação desconhecida";
}

async function loadDict(name, url) {
  const response = await fetch(url);
  dictionaries[name] = await response.json();
}

Promise.all([
  loadDict("items", "scripts/dictionaries/items.json"),
  loadDict("materials", "scripts/dictionaries/materials.json"),
  loadDict("weapons", "scripts/dictionaries/weapons.json"),
  loadDict("armors", "scripts/dictionaries/armors.json"),
  loadDict("clothings", "scripts/dictionaries/clothings.json"),
  loadDict("gems", "scripts/dictionaries/gems.json"),
  loadDict("arts", "scripts/dictionaries/arts.json"),
  loadDict("richesDict", "scripts/dictionaries/riches.json"),
  loadDict("equipmentDict", "scripts/dictionaries/equipment.json"),
  loadDict("magic_items", "scripts/dictionaries/magic_items.json"),
  loadDict("magic_weapons", "scripts/dictionaries/magic_weapons.json"),
  loadDict("magic_armors", "scripts/dictionaries/magic_armors.json"),
  loadDict("weapon_powers_melee", "scripts/dictionaries/weapon_powers_melee.json"),
  loadDict("weapon_powers_ranged", "scripts/dictionaries/weapon_powers_ranged.json"),
  loadDict("armor_powers", "scripts/dictionaries/armor_powers.json"),
  loadDict("weapons_specific", "scripts/dictionaries/weapons_specific.json"),
  loadDict("armors_specific", "scripts/dictionaries/armors_specific.json"),
  loadDict("ofuda", "scripts/dictionaries/ofuda.json"),
  loadDict("jutsus_basic", "scripts/dictionaries/jutsus_basic.json"),
  loadDict("jutsus_medium", "scripts/dictionaries/jutsus_medium.json"),
  loadDict("amulets", "scripts/dictionaries/amulets.json"),
  loadDict("accessories", "scripts/dictionaries/accessories.json"),
]).then(() => {
  console.log("Dicionários carregados.");
});

function getValueFromDict(dictName, nd) {
  const dict = dictionaries[dictName];
  if (!dict?.[nd]) return "ND inválido";
  const labels = { richesDict: "Tipo de riqueza", equipmentDict: "Tipo de equipamento" };
  return resolveAction(rollFromTable(dict[nd], labels[dictName] || dictName) ?? "Nenhum resultado");
}

// --- RENDERIZAÇÃO DO LOG ---

function renderRollLog(log) {
  return log.map(entry => {
    if (entry.type === "d100") {
      return `<div class="roll-step">
        <span class="roll-badge roll-badge-d100"><span class="dice-icon">⚄</span>${entry.roll}</span>
        <span class="roll-label">${entry.label}</span>
        <span class="roll-arrow">▸</span>
        <span class="roll-result">${entry.result}</span>
      </div>`;
    }
    if (entry.type === "formula") {
      return `<div class="roll-step roll-step-formula">
        <span class="roll-badge roll-badge-formula">${entry.expression} = ${entry.result.toLocaleString("pt-BR")}</span>
        <span class="roll-label">${entry.label}</span>
      </div>`;
    }
    return "";
  }).join("");
}

function getND() {
  const nd = document.getElementById("ndSelector").value;

  rollLog = [];
  const riches = getValueFromDict("richesDict", nd);
  const richesLog = [...rollLog];

  rollLog = [];
  const equip = getValueFromDict("equipmentDict", nd);
  const equipLog = [...rollLog];

  const noRiches = riches === "-";
  const noEquip = equip === "-";

  const richesLogHTML = richesLog.length > 0 ? `
    <div class="roll-section">
      <div class="roll-section-title">Riquezas</div>
      ${renderRollLog(richesLog)}
    </div>` : "";

  const equipLogHTML = equipLog.length > 0 ? `
    <div class="roll-section">
      <div class="roll-section-title">Equipamento</div>
      ${renderRollLog(equipLog)}
    </div>` : "";

  const hasLog = richesLog.length > 0 || equipLog.length > 0;

  document.getElementById("result").innerHTML = `
    <div class="result-summary">
      <div class="reward-row">
        <span class="reward-label">Riquezas</span>
        <span class="reward-value${noRiches ? " reward-none" : ""}">${noRiches ? "—" : riches}</span>
      </div>
      <div class="reward-row">
        <span class="reward-label">Equipamento</span>
        <span class="reward-value${noEquip ? " reward-none" : ""}">${noEquip ? "—" : equip}</span>
      </div>
    </div>
    ${hasLog ? `
    <details class="roll-log">
      <summary><span class="log-toggle-icon">▸</span> Ver detalhes das rolagens</summary>
      <div class="roll-log-content">
        ${richesLogHTML}
        ${equipLogHTML}
      </div>
    </details>` : ""}
  `;

  document.getElementById("result").scrollIntoView({ behavior: "smooth", block: "nearest" });
}
