'use server';

import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/utils/session';
import { ActionResult, PlaySession, SessionHistory } from '@/types/app';

export async function createSession(
  profileId: string,
  config: {
    mode: 'normal' | 'hard';
    categoryIds: string[];
    isAllCategories: boolean;
    isInfinity: boolean;
    questionLimit: number | null;
  }
): Promise<ActionResult<PlaySession>> {
  const session = await getSession();
  if (!session || session.profile_id !== profileId) {
    return { success: false, error: 'Unauthorized' };
  }

  const supabase = createClient();

  // Get category names for snapshot
  let categoryNames: string[] = [];
  if (config.categoryIds.length > 0) {
    const { data: cats } = await supabase
      .from('categories')
      .select('name')
      .in('id', config.categoryIds);
    categoryNames = cats?.map(c => c.name) || [];
  } else {
    const { data: allCats } = await supabase
      .from('categories')
      .select('name')
      .eq('profile_id', profileId);
    categoryNames = allCats?.map(c => c.name) || [];
  }

  // Call get_play_queue function
  const { data: queueData, error: queueError } = await supabase.rpc('get_play_queue', {
    p_profile_id: profileId,
    p_category_ids: config.categoryIds.length > 0 ? config.categoryIds : [],
    p_mode: config.mode,
    p_limit: config.questionLimit,
  });

  if (queueError) return { success: false, error: queueError.message };

  const queue = (queueData as { question_id: string; question_order: number }[]) || [];
  const questionQueue = queue.map(q => q.question_id);

  if (questionQueue.length === 0) {
    return { success: false, error: 'No questions found for selected categories' };
  }

  const { data, error } = await supabase
    .from('play_sessions')
    .insert({
      profile_id: profileId,
      mode: config.mode,
      is_all_categories: config.isAllCategories,
      is_infinity: config.isInfinity,
      question_limit: config.questionLimit,
      category_ids: config.categoryIds,
      category_names_snapshot: categoryNames,
      question_queue: questionQueue,
      current_index: 0,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as PlaySession };
}

export async function getSessionById(sessionId: string): Promise<ActionResult<PlaySession>> {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized' };

  const supabase = createClient();
  const { data, error } = await supabase
    .from('play_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error) return { success: false, error: 'Session not found' };
  if (data.profile_id !== session.profile_id) {
    return { success: false, error: 'Not found' };
  }

  return { success: true, data: data as PlaySession };
}

export async function closeSession(sessionId: string, status: 'completed' | 'quit'): Promise<ActionResult<void>> {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized' };

  const supabase = createClient();
  
  // Verify ownership
  const { data: existing } = await supabase
    .from('play_sessions')
    .select('profile_id')
    .eq('id', sessionId)
    .single();
  
  if (!existing || existing.profile_id !== session.profile_id) {
    return { success: false, error: 'Not found' };
  }

  const { error } = await supabase.rpc('fn_close_session', {
    p_session_id: sessionId,
    p_status: status,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function recordAnswer(
  sessionId: string,
  profileId: string,
  questionId: string,
  result: 'easy' | 'good' | 'hard' | 'super_hard'
): Promise<ActionResult<void>> {
  const session = await getSession();
  if (!session || session.profile_id !== profileId) {
    return { success: false, error: 'Unauthorized' };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from('session_answers')
    .insert({
      session_id: sessionId,
      profile_id: profileId,
      question_id: questionId,
      result,
    });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function refreshQueue(
  sessionId: string,
  profileId: string,
  mode: 'normal' | 'hard',
  categoryIds: string[]
): Promise<ActionResult<string[]>> {
  const session = await getSession();
  if (!session || session.profile_id !== profileId) {
    return { success: false, error: 'Unauthorized' };
  }

  const supabase = createClient();

  const { data: queueData, error: queueError } = await supabase.rpc('get_play_queue', {
    p_profile_id: profileId,
    p_category_ids: categoryIds.length > 0 ? categoryIds : [],
    p_mode: mode,
    p_limit: null,
  });

  if (queueError) return { success: false, error: queueError.message };

  const queue = (queueData as { question_id: string; question_order: number }[]) || [];
  const questionQueue = queue.map(q => q.question_id);

  // Update session with new queue and reset index
  const { error } = await supabase
    .from('play_sessions')
    .update({
      question_queue: questionQueue,
      current_index: 0,
    })
    .eq('id', sessionId);

  if (error) return { success: false, error: error.message };
  return { success: true, data: questionQueue };
}

export async function getSessionHistory(profileId: string): Promise<ActionResult<SessionHistory[]>> {
  const session = await getSession();
  if (!session || session.profile_id !== profileId) {
    return { success: false, error: 'Unauthorized' };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('session_history')
    .select('*')
    .eq('profile_id', profileId)
    .order('started_at', { ascending: false })
    .limit(50);

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as SessionHistory[] };
}

export async function getRecentSessions(profileId: string, limit = 5): Promise<ActionResult<SessionHistory[]>> {
  const session = await getSession();
  if (!session || session.profile_id !== profileId) {
    return { success: false, error: 'Unauthorized' };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('session_history')
    .select('*')
    .eq('profile_id', profileId)
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as SessionHistory[] };
}

export async function getSessionAnswers(sessionId: string): Promise<ActionResult<Array<{ question: string; result: string; points_awarded: number }>>> {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized' };

  const supabase = createClient();
  const { data, error } = await supabase
    .from('session_answers')
    .select('result, points_awarded, questions(question)')
    .eq('session_id', sessionId)
    .order('answered_at', { ascending: true });

  if (error) return { success: false, error: error.message };

  const formatted = data.map((row: Record<string, unknown>) => ({
    question: (row.questions as Record<string, unknown>)?.question as string || '',
    result: row.result as string,
    points_awarded: row.points_awarded as number,
  }));

  return { success: true, data: formatted };
}
