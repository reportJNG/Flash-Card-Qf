'use server';

import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/utils/session';
import { createQuestionSchema, updateQuestionSchema } from '@/lib/validations/schemas';
import { ActionResult, Question, ParsedQAPair } from '@/types/app';
import { revalidatePath } from 'next/cache';

export async function getQuestions(
  categoryId: string,
  options?: { search?: string; sort?: string }
): Promise<ActionResult<Question[]>> {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized' };

  const supabase = createClient();
  let query = supabase
    .from('questions')
    .select('*')
    .eq('category_id', categoryId);

  // Verify ownership via category
  const { data: cat } = await supabase.from('categories').select('profile_id').eq('id', categoryId).single();
  if (!cat || cat.profile_id !== session.profile_id) {
    return { success: false, error: 'Not found' };
  }

  if (options?.search) {
    query = query.ilike('question', `%${options.search}%`);
  }

  switch (options?.sort) {
    case 'difficulty':
      query = query.order('difficulty_stat', { ascending: true });
      break;
    case 'times_seen':
      query = query.order('times_seen', { ascending: false });
      break;
    case 'last_played':
      query = query.order('last_played_at', { ascending: false, nullsFirst: false });
      break;
    default:
      query = query.order('created_at', { ascending: false });
  }

  const { data, error } = await query;
  if (error) return { success: false, error: error.message };
  return { success: true, data: data as Question[] };
}

export async function createQuestion(
  profileId: string,
  categoryId: string,
  formData: unknown
): Promise<ActionResult<Question>> {
  const session = await getSession();
  if (!session || session.profile_id !== profileId) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = createQuestionSchema.safeParse(formData);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const supabase = createClient();
  const { data, error } = await supabase
    .from('questions')
    .insert({
      profile_id: profileId,
      category_id: categoryId,
      question: parsed.data.question,
      answer: parsed.data.answer,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath(`/categories/${categoryId}`);
  return { success: true, data: data as Question };
}

export async function createQuestionsBulk(
  profileId: string,
  categoryId: string,
  pairs: ParsedQAPair[]
): Promise<ActionResult<{ count: number }>> {
  const session = await getSession();
  if (!session || session.profile_id !== profileId) {
    return { success: false, error: 'Unauthorized' };
  }

  const validPairs = pairs.filter(p => p.valid && p.question.trim() && p.answer.trim());
  if (validPairs.length === 0) return { success: false, error: 'No valid questions to import' };

  const supabase = createClient();
  const questions = validPairs.map((p, i) => ({
    profile_id: profileId,
    category_id: categoryId,
    question: p.question.trim(),
    answer: p.answer.trim(),
    source: 'file' as const,
    order_index: i,
  }));

  const { error } = await supabase.from('questions').insert(questions);
  if (error) return { success: false, error: error.message };

  revalidatePath(`/categories/${categoryId}`);
  return { success: true, data: { count: validPairs.length } };
}

export async function updateQuestion(id: string, formData: unknown): Promise<ActionResult<Question>> {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized' };

  const parsed = updateQuestionSchema.safeParse(formData);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const supabase = createClient();
  
  // Verify ownership
  const { data: existing } = await supabase.from('questions').select('profile_id, category_id').eq('id', id).single();
  if (!existing || existing.profile_id !== session.profile_id) {
    return { success: false, error: 'Not found' };
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.question !== undefined) updateData.question = parsed.data.question;
  if (parsed.data.answer !== undefined) updateData.answer = parsed.data.answer;

  const { data, error } = await supabase
    .from('questions')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath(`/categories/${existing.category_id}`);
  return { success: true, data: data as Question };
}

export async function moveQuestion(id: string, newCategoryId: string): Promise<ActionResult<void>> {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized' };

  const supabase = createClient();
  
  const { data: existing } = await supabase.from('questions').select('profile_id, category_id').eq('id', id).single();
  if (!existing || existing.profile_id !== session.profile_id) {
    return { success: false, error: 'Not found' };
  }

  const { error } = await supabase
    .from('questions')
    .update({ category_id: newCategoryId })
    .eq('id', id);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/categories/${existing.category_id}`);
  revalidatePath(`/categories/${newCategoryId}`);
  return { success: true };
}

export async function deleteQuestion(id: string): Promise<ActionResult<void>> {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized' };

  const supabase = createClient();
  
  const { data: existing } = await supabase.from('questions').select('profile_id, category_id').eq('id', id).single();
  if (!existing || existing.profile_id !== session.profile_id) {
    return { success: false, error: 'Not found' };
  }

  const { error } = await supabase.from('questions').delete().eq('id', id);
  if (error) return { success: false, error: error.message };

  revalidatePath(`/categories/${existing.category_id}`);
  return { success: true };
}

export async function toggleSaveToSpecial(
  questionId: string,
  profileId: string
): Promise<ActionResult<{ saved: boolean }>> {
  const session = await getSession();
  if (!session || session.profile_id !== profileId) {
    return { success: false, error: 'Unauthorized' };
  }

  const supabase = createClient();
  
  // Get the question
  const { data: question } = await supabase
    .from('questions')
    .select('*')
    .eq('id', questionId)
    .eq('profile_id', profileId)
    .single();

  if (!question) return { success: false, error: 'Question not found' };

  // Get special category
  const { data: specialCat } = await supabase
    .from('categories')
    .select('id')
    .eq('profile_id', profileId)
    .eq('is_special', true)
    .single();

  if (!specialCat) return { success: false, error: 'Special category not found' };

  if (question.is_saved_special) {
    // Remove from special
    await supabase.from('questions').delete().eq('profile_id', profileId).eq('category_id', specialCat.id).eq('question', question.question);
    await supabase.from('questions').update({ is_saved_special: false }).eq('id', questionId);
    return { success: true, data: { saved: false } };
  } else {
    // Add to special
    await supabase.from('questions').insert({
      profile_id: profileId,
      category_id: specialCat.id,
      question: question.question,
      answer: question.answer,
      source: question.source,
    });
    await supabase.from('questions').update({ is_saved_special: true }).eq('id', questionId);
    return { success: true, data: { saved: true } };
  }
}
