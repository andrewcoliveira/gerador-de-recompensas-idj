// --- UTILITÁRIOS BASE ---

const dictionaries = {};

function rollDie(rolls, die) {
  let sum = 0;
  for (let i = 0; i < rolls; i++) {
    sum += Math.floor(Math.random() * die) + 1;
  }
  return sum;
}

function resolvePriceFormula(formula) {
  if (typeof formula === "number") return formula;
  const { rolls, die, mult = 1 } = formula;
  return rollDie(rolls, die) * mult;
}

function rollFromTable(table) {
  const roll = rollDie(1, 100);
  for (const [threshold, value] of table) {
    if (roll <= threshold) return value;
  }
  return null;
}

function formatPrice(price) {
  return price.toLocaleString("pt-BR") + " ¥o";
}

// --- GERADORES LÓGICOS ---

function equipmentGenerator(dictName, isSpecialMaterial = false) {
  const dict = dictionaries[dictName];
  if (!dict) return `Erro: Dicionário ${dictName} não encontrado`;

  const result = rollFromTable(dict);

  if (result && typeof result === "object" && result.type) {
    return resolveAction(result);
  }

  const equipment = result || "Item desconhecido";

  if (isSpecialMaterial && dictionaries.materials) {
    const material = rollFromTable(dictionaries.materials);
    if (material) return `${equipment} de ${material}`;
  }

  return equipment;
}

function richesGenerator(rolls, die, modifier, multiplicator, symbol) {
  const result = (rollDie(rolls, die) + modifier) * multiplicator;
  return `${result} ${symbol}`;
}

function rareItemGenerator(rolls, die, modifier, dictName) {
  const dict = dictionaries[dictName];
  const quantity = rollDie(rolls, die) + modifier;
  const inventory = new Map();
  let totalValue = 0;

  for (let i = 0; i < quantity; i++) {
    const itemData = rollFromTable(dict);
    if (!itemData) continue;

    const example = itemData.examples[Math.floor(Math.random() * itemData.examples.length)];
    const price = resolvePriceFormula(itemData.price);

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

function getWeaponBaseBonus(tier) {
  for (let i = 0; i < 10; i++) {
    const result = rollFromTable(dictionaries.magic_weapons[tier]);
    if (result?.type === "magic_bonus") return result;
  }
  return { bonus: 1, price_add: 2000 };
}

function getArmorBaseBonus(tier) {
  for (let i = 0; i < 10; i++) {
    const result = rollFromTable(dictionaries.magic_armors[tier]);
    if (result?.type === "magic_bonus") return result;
  }
  return { bonus: 1, price_add: 1000 };
}

function magicWeaponGenerator(tier) {
  const result = rollFromTable(dictionaries.magic_weapons[tier]);
  if (!result) return "Arma mágica desconhecida";

  if (result.type === "magic_bonus") {
    const weapon = equipmentGenerator("weapons");
    return `${weapon} +${result.bonus} (${formatPrice(result.price_add)})`;
  }

  if (result.type === "special_power") {
    const base = getWeaponBaseBonus(tier);
    const weapon = equipmentGenerator("weapons");
    const power = rollFromTable(dictionaries[result.dict][tier]);
    return `${weapon} +${base.bonus} ${power.name} (${formatPrice(base.price_add)}, poder equiv. +${power.bonus_equiv})`;
  }

  if (result.type === "specific") {
    const item = rollFromTable(dictionaries[result.dict][tier]);
    return `${item.name} (${formatPrice(item.price)})`;
  }

  return "Arma mágica desconhecida";
}

function magicArmorGenerator(tier) {
  const result = rollFromTable(dictionaries.magic_armors[tier]);
  if (!result) return "Armadura mágica desconhecida";

  if (result.type === "magic_bonus") {
    const armor = equipmentGenerator("armors");
    return `${armor} +${result.bonus} (${formatPrice(result.price_add)})`;
  }

  if (result.type === "special_power") {
    const base = getArmorBaseBonus(tier);
    const armor = equipmentGenerator("armors");
    const power = rollFromTable(dictionaries[result.dict][tier]);
    return `${armor} +${base.bonus} ${power.name} (${formatPrice(base.price_add)}, poder equiv. +${power.bonus_equiv})`;
  }

  if (result.type === "specific") {
    const item = rollFromTable(dictionaries[result.dict][tier]);
    return `${item.name} (${formatPrice(item.price)})`;
  }

  return "Armadura mágica desconhecida";
}

function ofudaGenerator(tier) {
  const result = rollFromTable(dictionaries.ofuda[tier]);
  if (!result) return "Ofuda desconhecida";

  const jutsuDict = result.tier === "basic" ? dictionaries.jutsus_basic : dictionaries.jutsus_medium;
  const jutsu = rollFromTable(jutsuDict);
  return `Ofuda ${jutsu} (${formatPrice(result.price)})`;
}

function amuletGenerator(tier) {
  const item = rollFromTable(dictionaries.amulets[tier]);
  if (!item) return "Amuleto desconhecido";
  return `Amuleto de ${item.name} (${formatPrice(item.price)})`;
}

function accessoryGenerator(tier) {
  const item = rollFromTable(dictionaries.accessories[tier]);
  if (!item) return "Acessório desconhecido";
  return `${item.name} (${formatPrice(item.price)})`;
}

function magicItemGenerator(tier) {
  const categoryAction = rollFromTable(dictionaries.magic_items[tier]);
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
  return resolveAction(rollFromTable(dict[nd]) ?? "Nenhum resultado");
}

function getND() {
  const nd = document.getElementById("ndSelector").value;
  const riches = getValueFromDict("richesDict", nd);
  const equip = getValueFromDict("equipmentDict", nd);

  document.getElementById("result").innerHTML = `
    <p class="reward">Riquezas: ${riches}</p>
    <p class="reward">Equipamento: ${equip}</p>
  `;
}
