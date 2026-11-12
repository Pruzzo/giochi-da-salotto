// Le scelte della console che devono restare anche quando il server si riavvia (oggi: lo stile grafico).
// Il file sta nella cartella dell'utente: su Android HOME è la cartella dati dell'app,
// che a differenza del server scompattato sopravvive anche agli aggiornamenti.
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

export const SETTINGS_FILE = process.env.SETTINGS_FILE || join(homedir(), '.giochi-da-salotto', 'impostazioni.json');

/** Le impostazioni salvate, o un oggetto vuoto se il file manca o è rovinato. */
export function loadSettings(file = SETTINGS_FILE) {
  try {
    const data = JSON.parse(readFileSync(file, 'utf8'));
    return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  } catch {
    return {};
  }
}

/** Scrive tutto il file in un colpo: prima un file accanto, poi lo rinomina, così non resta mai a metà. */
export function saveSettings(settings, file = SETTINGS_FILE) {
  try {
    mkdirSync(dirname(file), { recursive: true });
    const tmp = `${file}.tmp`;
    writeFileSync(tmp, `${JSON.stringify(settings, null, 2)}\n`);
    renameSync(tmp, file);
    return true;
  } catch (error) {
    console.error('Impostazioni non salvate:', error.message);
    return false;
  }
}
