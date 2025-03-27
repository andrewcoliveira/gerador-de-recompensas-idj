// Gerar o valor dos dados
function rollDie(rolls, die) {
	let sum = 0;
	for (let i = 0; i < rolls; i++) {
		sum += Math.floor(Math.random() * die) + 1;
	}
	return sum;
}

// Gerar o tipo de equipamento e caso seja de material especial
function equipmentGenerator(type, isSpecialMaterial = false) {
	if (!type || typeof type !== 'object') return null;

	const dHundred = rollDie(1, 100);
	let equipment = null;

	// Encontra o equipamento
	for (const chance in type) {
		if (dHundred <= parseInt(chance)) {
			equipment = type[chance];
			break;
		}
	}

	if (!equipment) return null;

	// Adiciona material especial se necessário
	if (isSpecialMaterial && materials) {
		const materialRoll = rollDie(1, 100);
		for (const matChance in materials) {
			if (materialRoll <= parseInt(matChance)) {
				return `${equipment} de ${materials[matChance]}`;
			}
		}
	}

	return equipment;
}

// Função para gerar riquezas
function richesGenerator(rolls, die, modifier, multiplicator, value) {
	const result = (rollDie(rolls, die) + modifier) * multiplicator;
	return `${result} ${value}`;
}

// Função para gerar itens raros
function rareItemGenerator(rolls, die, modifier, richType) {
	let quantity = rollDie(rolls, die) + modifier;
	let masterpieceLib = new Map();
	let totalRiches = 0;
	let totalValue = 0;

	for (let i = 0; i < quantity; i++) {
		const dHundred = rollDie(1, 100);
		for (const cd in richType) {
			if (dHundred <= cd) {
				const masterpiece =
					richType[cd].examples[
						Math.floor(Math.random() * richType[cd].examples.length)
					];
				const price = richType[cd].price();

				if (masterpieceLib.has(masterpiece)) {
					const existing = masterpieceLib.get(masterpiece);
					existing.prices.push(price);
					masterpieceLib.set(masterpiece, {
						quantity: existing.quantity + 1,
						prices: existing.prices,
					});
				} else {
					masterpieceLib.set(masterpiece, {
						quantity: 1,
						prices: [price],
					});
				}
				totalRiches += 1;
				totalValue += price;
				break;
			}
		}
	}

	// Formata a lista de itens raros
	const formattedItems = [];
	for (const [masterpiece, data] of masterpieceLib.entries()) {
		if (data.quantity > 1) {
			const pricesFormatted = formatPrices(data.prices);
			formattedItems.push(
				`(${data.quantity}x) ${masterpiece} (${pricesFormatted})`
			);
		} else {
			formattedItems.push(`${masterpiece} (${data.prices[0]} ¥o)`);
		}
	}

	// Retorna a lista formatada com o total
	if (formattedItems.length === 1) {
		return `${formattedItems[0]}. Total: ${totalValue} ¥o`;
	} else if (formattedItems.length === 2) {
		return `${totalRiches} itens. ${formattedItems[0]} e ${formattedItems[1]}. Total: ${totalValue} ¥o`;
	} else if (formattedItems.length > 2) {
		const allButLast = formattedItems.slice(0, -1).join(', ');
		const lastItem = formattedItems[formattedItems.length - 1];
		return `${totalRiches} itens. ${allButLast} e ${lastItem}. Total: ${totalValue} ¥o`;
	} else {
		return 'Nenhum item encontrado.';
	}
}

// Função para formatar os preços
function formatPrices(prices) {
	if (prices.length === 1) {
		return `${prices[0]} ¥o`;
	} else if (prices.length === 2) {
		return `${prices[0]} ¥o e ${prices[1]} ¥o`;
	} else if (prices.length > 2) {
		const allButLast = prices.slice(0, -1).join(' ¥o, ');
		const lastPrice = prices[prices.length - 1];
		return `${allButLast} ¥o e ${lastPrice} ¥o`;
	}
	return '';
}

// Função para carregar e transformar dados JSON
async function loadAndTransformJSON(url, transformFn) {
	const response = await fetch(url);
	const data = await response.json();
	if (transformFn) {
		transformFn(data);
	}
	return data;
}

function transformFunctions(data, isNested = false) {
	const transformValue = (value) => {
		if (typeof value === 'string') {
			if (value.trim().startsWith('return')) {
				try {
					return new Function(value);
				} catch (e) {
					console.error('Erro ao criar função:', e);
					return value;
				}
			}
		}
		return value;
	};

	for (const key in data) {
		if (isNested && typeof data[key] === 'object') {
			for (const subKey in data[key]) {
				data[key][subKey] = transformValue(data[key][subKey]);
			}
		} else {
			data[key] = transformValue(data[key]);

			if (data[key] && typeof data[key] === 'object' && data[key].price) {
				data[key].price = transformValue(data[key].price);
			}
		}
	}
}

let items,
	materials,
	weapons,
	armors,
	clothings,
	gems,
	arts,
	richesDict,
	equipmentDict;

Promise.all([
	loadAndTransformJSON('scripts/dictionaries/items.json'),
	loadAndTransformJSON('scripts/dictionaries/materials.json'),
	loadAndTransformJSON('scripts/dictionaries/weapons.json'),
	loadAndTransformJSON('scripts/dictionaries/armors.json', (data) =>
		transformFunctions(data)
	),
	loadAndTransformJSON('scripts/dictionaries/clothings.json'),
	loadAndTransformJSON('scripts/dictionaries/gems.json', transformFunctions),
	loadAndTransformJSON('scripts/dictionaries/arts.json', transformFunctions),
	loadAndTransformJSON('scripts/dictionaries/riches.json', (data) =>
		transformFunctions(data, true)
	),
	loadAndTransformJSON('scripts/dictionaries/equipment.json', (data) =>
		transformFunctions(data, true)
	),
]).then(
	([
		itemsData,
		materialData,
		weaponsData,
		armorsData,
		clothingsData,
		gemsData,
		artsData,
		richesData,
		equipmentData,
	]) => {
		items = itemsData;
		materials = materialData;
		weapons = weaponsData;
		armors = armorsData;
		clothings = clothingsData;
		gems = gemsData;
		arts = artsData;
		richesDict = richesData;
		equipmentDict = equipmentData;
	}
);

function getValueFromDict(dict, nd) {
	if (!dict || !dict[nd]) return 'ND inválido';

	const dHundred = rollDie(1, 100);

	for (const cd in dict[nd]) {
		if (dHundred <= parseInt(cd)) {
			const value = dict[nd][cd];

			if (typeof value === 'function') {
				try {
					const result = value();
					return typeof result === 'function' ? result() : result;
				} catch (e) {
					console.error('Erro ao executar função:', e);
					return `Erro: ${e.message}`;
				}
			}
			return value;
		}
	}
	return 'Nenhum item encontrado';
}

// Função para obter o ND selecionado e gerar recompensas
function getND() {
	const ndSelector = document.getElementById('ndSelector');
	const nd = ndSelector.value;

	let riches = getValueFromDict(richesDict, nd);
	let equip = getValueFromDict(equipmentDict, nd);

	var elements = document.getElementsByClassName('hidden-initially');
	for (var i = 0; i < elements.length; i++) {
		if (elements[i].style.display === 'none') {
			elements[i].style.display = 'block';
		}
	}

	sleep(500).then(() => {
		for (var i = 0; i < elements.length; i++) {
			if (elements[i].style.display === 'block') {
				elements[i].style.display = 'none';
			}
		}
		console.log(`Riquezas: ${riches}`);
		console.log(`Equipamento: ${equip}`);

		const resultsDiv = document.getElementById('result');
		resultsDiv.innerHTML = '';

		const richesParagraph = document.createElement('p');
		richesParagraph.classList.add('reward');
		richesParagraph.innerText = `Riquezas: ${riches}`;

		const equipParagraph = document.createElement('p');
		equipParagraph.classList.add('reward');
		equipParagraph.innerText = `Equipamento: ${equip}`;

		resultsDiv.appendChild(richesParagraph);
		resultsDiv.appendChild(equipParagraph);
	});
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
