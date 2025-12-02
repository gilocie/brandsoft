
import { create } from 'zustand';

// A simple history (undo/redo) store built with Zustand.
// This is a basic implementation and can be expanded.

interface HistoryState<T> {
  past: T[];
  present: T | null;
  future: T[];

  setPresent: (newPresent: T) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
}

// This is a generic factory function to create a history store for any type of state.
export const createHistoryStore = <T>(initialPresent: T) => {
  return create<HistoryState<T>>((set, get) => ({
    past: [],
    present: initialPresent,
    future: [],

    setPresent: (newPresent) => {
      const { present, past } = get();
      if (newPresent === present) {
        return;
      }
      set({
        past: [...past, present!].slice(-30), // Limit history size
        present: newPresent,
        future: [],
      });
    },

    undo: () => {
      const { past, present, future } = get();
      if (past.length === 0) {
        return;
      }
      const newPresent = past[past.length - 1];
      set({
        past: past.slice(0, past.length - 1),
        present: newPresent,
        future: [present!, ...future],
      });
    },

    redo: () => {
      const { future, present, past } = get();
      if (future.length === 0) {
        return;
      }
      const newPresent = future[0];
      set({
        past: [...past, present!],
        present: newPresent,
        future: future.slice(1),
      });
    },

    clear: () => {
        set({
            past: [],
            present: initialPresent,
            future: [],
        })
    }
  }));
};

// We would then create a specific instance for our canvas state:
// e.g., export const useCanvasHistory = createHistoryStore(initialCanvasState);
