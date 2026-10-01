import { HistoryItem } from '../types';

const STORAGE_KEY = 'vonigen_history_v1';
const PAIRING_KEY = 'vonigen_verified_code';

export const storageService = {
  getHistory(): HistoryItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to read history from localStorage', e);
      return [];
    }
  },

  saveItem(item: HistoryItem): void {
    try {
      const current = this.getHistory();
      // Keep most recent 50 items to avoid storage quota overflow
      const updated = [item, ...current.filter((i) => i.id !== item.id)].slice(0, 50);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Storage quota exceeded, removing oldest non-favorite items', e);
      try {
        const current = this.getHistory();
        const pruned = [item, ...current.filter((i) => i.isFavorite).slice(0, 20)];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
      } catch (err) {
        console.error('Failed to save to localStorage', err);
      }
    }
  },

  deleteItem(id: string): HistoryItem[] {
    try {
      const current = this.getHistory();
      const updated = current.filter((item) => item.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error('Failed to delete item', e);
      return [];
    }
  },

  toggleFavorite(id: string): HistoryItem[] {
    try {
      const current = this.getHistory();
      const updated = current.map((item) =>
        item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error('Failed to toggle favorite', e);
      return [];
    }
  },

  clearAll(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear storage', e);
    }
  },

  getSavedAccessCode(): string | null {
    try {
      return localStorage.getItem(PAIRING_KEY);
    } catch {
      return null;
    }
  },

  saveAccessCode(code: string): void {
    try {
      localStorage.setItem(PAIRING_KEY, code);
    } catch (e) {
      console.error('Failed to save code', e);
    }
  },

  clearAccessCode(): void {
    try {
      localStorage.removeItem(PAIRING_KEY);
    } catch (e) {
      console.error('Failed to clear code', e);
    }
  },
};
