import Typo from "typo-js";

let typoInstance: Typo | null = null;
let isLoading = false;
let isLoaded = false;
const listeners: ((loaded: boolean) => void)[] = [];

export function subscribeToSpellchecker(listener: (loaded: boolean) => void) {
  listeners.push(listener);
  listener(isLoaded);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

export function getSpellchecker() {
  return typoInstance;
}

export function isSpellcheckerLoaded() {
  return isLoaded;
}

export async function initSpellchecker() {
  if (typoInstance || isLoading) return;
  isLoading = true;
  try {
    const [affRes, dicRes] = await Promise.all([
      fetch("/dictionaries/pt_BR.aff"),
      fetch("/dictionaries/pt_BR.dic"),
    ]);
    if (!affRes.ok || !dicRes.ok) {
      throw new Error(`Failed to fetch dictionary files: aff status ${affRes.status}, dic status ${dicRes.status}`);
    }
    const [affData, dicData] = await Promise.all([
      affRes.text(),
      dicRes.text(),
    ]);
    typoInstance = new Typo("pt_BR", affData, dicData);
    isLoaded = true;
    listeners.forEach((l) => l(true));
  } catch (error) {
    console.error("Failed to load spellcheck dictionary:", error);
  } finally {
    isLoading = false;
  }
}

export function cleanWord(word: string): string {
  // Remove pontuações comuns no início e fim da palavra
  return word.replace(/^[.,\/#!$%\^&\*;:{}=\-_`~()?"'\[\]“»«”]+|[.,\/#!$%\^&\*;:{}=\-_`~()?"'\[\]“»«”]+$/g, "");
}

export function checkWord(word: string): boolean {
  if (!typoInstance) return true; // Se o dicionário não carregou, não marca como erro
  const cleaned = cleanWord(word);
  if (!cleaned) return true;
  if (/^\d+$/.test(cleaned)) return true; // Ignora números puros
  
  // Checagem direta
  if (typoInstance.check(cleaned)) return true;
  
  // Checa em minúsculo
  const lower = cleaned.toLowerCase();
  if (typoInstance.check(lower)) return true;
  
  // Checa com a primeira letra maiúscula (caso seja início de frase)
  const capitalized = lower.charAt(0).toUpperCase() + lower.slice(1);
  if (typoInstance.check(capitalized)) return true;

  return false;
}

export function getSuggestions(word: string): string[] {
  if (!typoInstance) return [];
  const cleaned = cleanWord(word);
  if (!cleaned) return [];
  return typoInstance.suggest(cleaned) || [];
}
