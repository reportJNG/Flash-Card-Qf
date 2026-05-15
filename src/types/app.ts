export type DifficultyRating = 'none' | 'easy' | 'good' | 'hard' | 'super_hard';
export type PlayMode = 'normal' | 'hard';
export type SessionStatus = 'active' | 'completed' | 'quit';
export type ActionResult<T = unknown> = { success: boolean; data?: T; error?: string };
export type ParsedQAPair = { question: string; answer: string; valid: boolean; warning?: string };

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_color: string;
  pin: string | null;
  total_points: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  profile_id: string;
  name: string;
  type: string | null;
  description: string | null;
  color: string;
  icon: string;
  is_special: boolean;
  question_count: number;
  created_at: string;
  updated_at: string;
}

export interface CategoryOverview extends Category {
  none_count: number;
  easy_count: number;
  good_count: number;
  hard_count: number;
  super_hard_count: number;
  mastery_pct: number;
}

export interface Question {
  id: string;
  profile_id: string;
  category_id: string;
  question: string;
  answer: string;
  difficulty_stat: DifficultyRating;
  times_seen: number;
  times_easy: number;
  times_good: number;
  times_hard: number;
  times_super_hard: number;
  last_played_at: string | null;
  is_saved_special: boolean;
  source: 'manual' | 'file';
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface PlaySession {
  id: string;
  profile_id: string;
  mode: PlayMode;
  is_all_categories: boolean;
  is_infinity: boolean;
  question_limit: number | null;
  category_ids: string[];
  category_names_snapshot: string[];
  question_queue: string[];
  current_index: number;
  total_answered: number;
  points_earned: number;
  status: SessionStatus;
  started_at: string;
  ended_at: string | null;
}

export interface SessionAnswer {
  id: string;
  session_id: string;
  profile_id: string;
  question_id: string;
  result: DifficultyRating;
  points_awarded: number;
  answered_at: string;
}

export interface ProfileStats {
  profile_id: string;
  username: string;
  display_name: string;
  avatar_color: string;
  total_points: number;
  total_questions: number;
  none_count: number;
  easy_count: number;
  good_count: number;
  hard_count: number;
  super_hard_count: number;
  total_categories: number;
  total_sessions: number;
  total_answers: number;
  smart_rate: number;
}

export interface LeaderboardEntry {
  profile_id: string;
  username: string;
  display_name: string;
  avatar_color: string;
  total_points: number;
  total_questions: number;
  total_answers: number;
  accuracy_rate: number;
  smart_rate: number;
  rank: number;
}

export interface SessionHistory {
  session_id: string;
  profile_id: string;
  mode: PlayMode;
  status: SessionStatus;
  is_infinity: boolean;
  is_all_categories: boolean;
  question_limit: number | null;
  category_names_snapshot: string[];
  total_answered: number;
  points_earned: number;
  started_at: string;
  ended_at: string | null;
  easy_count: number;
  good_count: number;
  hard_count: number;
  super_hard_count: number;
  duration_seconds: number;
}

export const AVATAR_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#f43f5e',
  '#0ea5e9', '#8b5cf6', '#14b8a6', '#ec4899',
] as const;

export const DIFFICULTY_COLORS: Record<DifficultyRating, string> = {
  none: '#94a3b8',
  easy: '#22c55e',
  good: '#14b8a6',
  hard: '#f97316',
  super_hard: '#ef4444',
};

export const POINTS_MAP: Record<DifficultyRating, number> = {
  none: 0,
  easy: 10,
  good: 7,
  hard: 3,
  super_hard: 0,
};
