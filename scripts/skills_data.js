// ══════════════════════════════════════════════════
//  PERÍCIAS
// ══════════════════════════════════════════════════

const SKILLS_DATA = {
  "Acrobacia":        { attr:"Des", trained:false, armor:true,  honor:null },
  "Adestrar Animais": { attr:"Car", trained:true,  armor:false, honor:null },
  "Atletismo":        { attr:"For", trained:false, armor:false, honor:null },
  "Atuação":          { attr:"Car", trained:false, armor:false, honor:"leve",     specialties:["Arte tradicional","Dramaturgia","Dança","Música","Oratória"] },
  "Cavalgar":         { attr:"Des", trained:false, armor:false, honor:null },
  "Conhecimento":     { attr:"Int", trained:true,  armor:false, honor:null,       specialties:["Arcano","Engenharia","Geografia","Guerra","História","Natureza","Nobreza","Religião","Tormenta"] },
  "Cura":             { attr:"Sab", trained:false, armor:false, honor:null },
  "Diplomacia":       { attr:"Car", trained:false, armor:false, honor:"leve" },
  "Enganação":        { attr:"Car", trained:false, armor:false, honor:"leve" },
  "Furtividade":      { attr:"Des", trained:false, armor:true,  honor:"leve" },
  "Identificar Magia":{ attr:"Int", trained:true,  armor:false, honor:"moderada" },
  "Iniciativa":       { attr:"Des", trained:false, armor:false, honor:null },
  "Intimidação":      { attr:"Car", trained:false, armor:false, honor:null },
  "Intuição":         { attr:"Sab", trained:false, armor:false, honor:null },
  "Ladinagem":        { attr:"Des", trained:true,  armor:true,  honor:"moderada" },
  "Obter Informação": { attr:"Car", trained:false, armor:false, honor:"moderada" },
  "Ofício":           { attr:"Int", trained:false, armor:false, honor:null,       specialties:["Alquimia","Alvenaria","Carpintaria","Joalheria","Metalurgia","Uma arte","Uma profissão"] },
  "Percepção":        { attr:"Sab", trained:false, armor:false, honor:null },
  "Sobrevivência":    { attr:"Sab", trained:false, armor:false, honor:null },
};

// Per-class skill lists (array of skill names for fast lookup)
const CLASS_SKILLS = {
  bushi:    ["Adestrar Animais","Atletismo","Cavalgar","Iniciativa","Intimidação","Ofício","Percepção","Sobrevivência"],
  kensei:   ["Acrobacia","Atletismo","Cavalgar","Iniciativa","Intimidação","Intuição","Ofício","Percepção"],
  monge:    ["Acrobacia","Atletismo","Conhecimento","Cura","Diplomacia","Furtividade","Iniciativa","Intuição","Ofício","Percepção"],
  ninja:    ["Acrobacia","Atletismo","Atuação","Cavalgar","Cura","Enganação","Furtividade","Identificar Magia","Iniciativa","Intimidação","Ladinagem","Obter Informação","Ofício","Percepção","Sobrevivência"],
  onimusha: ["Adestrar Animais","Atletismo","Cavalgar","Conhecimento","Cura","Furtividade","Iniciativa","Ofício","Percepção","Sobrevivência"],
  samurai:  ["Acrobacia","Adestrar Animais","Atletismo","Atuação","Cavalgar","Conhecimento","Diplomacia","Iniciativa","Intimidação","Intuição","Ofício","Percepção"],
  shinkan:  ["Adestrar Animais","Atletismo","Cavalgar","Conhecimento","Cura","Diplomacia","Enganação","Identificar Magia","Intuição","Ofício","Percepção","Sobrevivência"],
  shugenja: ["Atletismo","Atuação","Cavalgar","Conhecimento","Cura","Diplomacia","Identificar Magia","Iniciativa","Intuição","Ofício","Percepção"],
  wujen:    ["Conhecimento","Enganação","Identificar Magia","Intimidação","Intuição","Ofício","Percepção","Sobrevivência"],
  yakuza:   ["Acrobacia","Atletismo","Atuação","Cavalgar","Conhecimento","Diplomacia","Enganação","Furtividade","Identificar Magia","Iniciativa","Intimidação","Intuição","Ladinagem","Obter Informação","Ofício","Percepção"],
};
