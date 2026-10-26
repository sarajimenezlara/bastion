// RecordStore: récord de la partida en localStorage (Fase 6, CA-16).
// Recibe el almacenamiento por inyección para poder probarse con `node --test`
// y para tolerar navegadores que bloquean `localStorage` bajo `file://`.
// Patrón UMD simplificado: navegador (window) y node --test (CommonJS).

const STORAGE_KEY = 'bastion.record';

class RecordStore {
  /**
   * @param {object|null} storage objeto con getItem/setItem/removeItem (localStorage)
   * @param {string} [key] clave usada en el almacenamiento
   */
  constructor(storage, key = STORAGE_KEY) {
    this.storage = storage || null;
    this.key = key;
  }

  /**
   * `localStorage` del navegador, si está disponible. Devuelve null en
   * entornos sin navegador o cuando el acceso lanza (modo privado, políticas).
   * @returns {object|null}
   */
  static defaultStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage;
      }
    } catch (error) {
      // Acceso bloqueado: la partida sigue jugándose sin récord.
    }
    return null;
  }

  /**
   * Valida la forma de un récord leído del almacenamiento.
   * @param {*} value
   * @returns {boolean}
   */
  static isValidRecord(value) {
    if (!value || typeof value !== 'object') return false;
    if (!Number.isFinite(value.score)) return false;
    if (!Number.isFinite(value.wave)) return false;
    return typeof value.result === 'string';
  }

  /**
   * Récord guardado.
   * @returns {{score:number,wave:number,result:string,date:string}|null}
   */
  load() {
    if (!this.storage) return null;

    try {
      const raw = this.storage.getItem(this.key);
      if (typeof raw !== 'string' || raw.length === 0) return null;

      const parsed = JSON.parse(raw);
      if (!RecordStore.isValidRecord(parsed)) return null;

      return {
        score: Math.floor(parsed.score),
        wave: Math.floor(parsed.wave),
        result: parsed.result,
        date: typeof parsed.date === 'string' ? parsed.date : '',
      };
    } catch (error) {
      // JSON corrupto o almacenamiento caído: se trata como «sin récord».
      return null;
    }
  }

  /**
   * Guarda la partida si mejora el récord existente.
   * @param {{score:number,wave:number,result:string,date?:string}} entry
   * @returns {{best:object|null,isNewRecord:boolean}}
   */
  save(entry) {
    const current = this.load();
    const source = entry && typeof entry === 'object' ? entry : {};

    const record = {
      score: Number.isFinite(source.score) ? Math.max(0, Math.floor(source.score)) : 0,
      wave: Number.isFinite(source.wave) ? Math.max(0, Math.floor(source.wave)) : 0,
      result: typeof source.result === 'string' ? source.result : 'DEFEAT',
      date: typeof source.date === 'string' ? source.date : new Date().toISOString(),
    };

    // Solo se reemplaza con una puntuación estrictamente mayor.
    if (current && current.score >= record.score) {
      return { best: current, isNewRecord: false };
    }
    if (!this.storage) {
      return { best: current, isNewRecord: false };
    }

    try {
      this.storage.setItem(this.key, JSON.stringify(record));
    } catch (error) {
      // Sin espacio o almacenamiento bloqueado: no se pierde la partida.
      return { best: current, isNewRecord: false };
    }

    return { best: record, isNewRecord: true };
  }

  /** Elimina el récord guardado. @returns {void} */
  clear() {
    if (!this.storage) return;
    try {
      this.storage.removeItem(this.key);
    } catch (error) {
      // Nada que hacer: el récord seguirá ahí.
    }
  }
}

RecordStore.STORAGE_KEY = STORAGE_KEY;

if (typeof window !== 'undefined') {
  window.RecordStore = RecordStore;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RecordStore;
}
