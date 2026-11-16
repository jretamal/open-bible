import { create } from 'zustand';
import { getJson, setJson } from '../storage';

export interface Bookmark {
  id: string;
  book: string;
  chapter: number;
  verse?: number;
  label?: string;
  createdAt: number;
  updatedAt?: number;
}

const STORAGE_KEY = 'ob:bookmarks';

interface BookmarksState {
  bookmarks: Bookmark[];
  addBookmark: (book: string, chapter: number, verse?: number, label?: string) => void;
  removeBookmark: (id: string) => void;
  toggleBookmark: (book: string, chapter: number, verse?: number) => boolean;
  isBookmarked: (book: string, chapter: number, verse?: number) => boolean;
  updateLabel: (id: string, label: string) => void;
}

export const makeBookmarkId = (book: string, chapter: number, verse?: number) =>
  verse ? `${book}-${chapter}-${verse}` : `${book}-${chapter}`;

export const useBookmarks = create<BookmarksState>((set, get) => ({
  bookmarks: getJson<Bookmark[]>(STORAGE_KEY, []),

  addBookmark: (book, chapter, verse, label) => {
    const id = makeBookmarkId(book, chapter, verse);
    const now = Date.now();
    set((s) => {
      const existing = s.bookmarks.filter((b) => b.id !== id);
      const updated = [{ id, book, chapter, verse, label, createdAt: now, updatedAt: now }, ...existing];
      setJson(STORAGE_KEY, updated);
      return { bookmarks: updated };
    });
  },

  removeBookmark: (id) => {
    set((s) => {
      const updated = s.bookmarks.filter((b) => b.id !== id);
      setJson(STORAGE_KEY, updated);
      return { bookmarks: updated };
    });
  },

  toggleBookmark: (book, chapter, verse) => {
    const id = makeBookmarkId(book, chapter, verse);
    const exists = get().bookmarks.some((b) => b.id === id);
    if (exists) {
      get().removeBookmark(id);
      return false;
    } else {
      get().addBookmark(book, chapter, verse);
      return true;
    }
  },

  isBookmarked: (book, chapter, verse) => {
    const id = makeBookmarkId(book, chapter, verse);
    return get().bookmarks.some((b) => b.id === id);
  },

  updateLabel: (id, label) => {
    const now = Date.now();
    set((s) => {
      const updated = s.bookmarks.map((b) => (b.id === id ? { ...b, label: label.trim() || undefined, updatedAt: now } : b));
      setJson(STORAGE_KEY, updated);
      return { bookmarks: updated };
    });
  },
}));
