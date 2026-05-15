import { create } from 'zustand';

interface PlaySessionState {
  isFlipped: boolean;
  setFlipped: (v: boolean) => void;
  showRatings: boolean;
  setShowRatings: (v: boolean) => void;
  direction: 'next' | 'prev';
  setDirection: (d: 'next' | 'prev') => void;
  isAnimating: boolean;
  setAnimating: (v: boolean) => void;
  reset: () => void;
}

export const usePlaySessionStore = create<PlaySessionState>((set) => ({
  isFlipped: false,
  setFlipped: (v) => set({ isFlipped: v }),
  showRatings: false,
  setShowRatings: (v) => set({ showRatings: v }),
  direction: 'next',
  setDirection: (d) => set({ direction: d }),
  isAnimating: false,
  setAnimating: (v) => set({ isAnimating: v }),
  reset: () => set({ isFlipped: false, showRatings: false, direction: 'next', isAnimating: false }),
}));
