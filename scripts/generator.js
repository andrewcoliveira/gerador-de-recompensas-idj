// --- UTILITÁRIOS BASE ---

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

// --- GERADORES LÓGICOS ---

function equipmentGenerator(dictName, isSpecialMaterial = false) {
  const dict = dictionaries[dictName];
  if (!dict) return `Erro: Dicionário ${dictName} não encontrado`;

  const dHundred = rollDie(1, 100);
  let result = null;

  for (const chance in dict) {
    if (dHundred <= parseInt(chance)) {
      result = dict[chance];
      break;
    }
  }

  if (typeof result === "object" && result.type) {
    return resolveAction(result);
  }

  let equipment = result || "Item desconhecido";

  if (isSpecialMaterial && dictionaries.materials) {
    const materialRoll = rollDie(1, 100);
    for (const matChance in dictionaries.materials) {
      if (materialRoll <= parseInt(matChance)) {
        return `${equipment} de ${dictionaries.materials[matChance]}`;
      }
    }
  }
  return equipment;
}

function richesGenerator(rolls, die, modifier, multiplicator, symbol) {
  const result = (rollDie(rolls, die) + modifier) * multiplicator;
  return `${result} ${symbol}`;
}

function rareItemGenerator(rolls, die, modifier, dictName) {
  const dict = dictionaries[dictName];
  let quantity = rollDie(rolls, die) + modifier;
  let inventory = new Map();
  let totalValue = 0;

  for (let i = 0; i < quantity; i++) {
    const dHundred = rollDie(1, 100);
    for (const chance in dict) {
      if (dHundred <= parseInt(chance)) {
        const itemData = dict[chance];
        const example =
          itemData.examples[
            Math.floor(Math.random() * itemData.examples.length)
          ];
        const price = resolvePriceFormula(itemData.price);

        if (inventory.has(example)) {
          const entry = inventory.get(example);
          entry.prices.push(price);
          inventory.set(example, { qty: entry.qty + 1, prices: entry.prices });
        } else {
          inventory.set(example, { qty: 1, prices: [price] });
        }
        totalValue += price;
        break;
      }
    }
  }

  const itemsFormatted = Array.from(inventory.entries()).map(([name, data]) => {
    const pricesStr = data.prices
      .map((p) => `${p} ¥o`)
      .join(data.qty === 2 ? " e " : ", ");
    return data.qty > 1
      ? `(${data.qty}x) ${name} (${pricesStr})`
      : `${name} (${data.prices[0]} ¥o)`;
  });

  return itemsFormatted.length > 0
    ? `${itemsFormatted.join(", ")}. Total: ${totalValue} ¥o`
    : "Nenhum item encontrado";
}

// --- RESOLVER CENTRAL ---

function resolveAction(action) {
  if (!action) return "-";
  if (typeof action === "string") return action;

  switch (action.type) {
    case "equipment":
      return equipmentGenerator(action.dict, action.special || false);
    case "riches":
      return richesGenerator(...action.args);
    case "rare":
      return rareItemGenerator(...action.args, action.dict);
    default:
      return "Ação desconhecida";
  }
}

const dictionaries = {};

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
]).then(() => {
  console.log("Dicionários carregados.");
});

function getValueFromDict(dictName, nd) {
  const dict = dictionaries[dictName];
  if (!dict || !dict[nd]) return "ND inválido";

  const dHundred = rollDie(1, 100);
  for (const chance in dict[nd]) {
    if (dHundred <= parseInt(chance)) {
      return resolveAction(dict[nd][chance]);
    }
  }
  return "Nenhum resultado";
}

function getND() {
  const nd = document.getElementById("ndSelector").value;

  const riches = getValueFromDict("richesDict", nd);
  const equip = getValueFromDict("equipmentDict", nd);

  const resultsDiv = document.getElementById("result");
  resultsDiv.innerHTML = `<p class="reward">Riquezas: ${riches}</p>
                            <p class="reward">Equipamento: ${equip}</p>`;
}
