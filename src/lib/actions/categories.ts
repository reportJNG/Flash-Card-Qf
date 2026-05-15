'use server';

import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/utils/session';
import { createCategorySchema } from '@/lib/validations/schemas';
import { ActionResult, Category, CategoryOverview } from '@/types/app';
import { revalidatePath } from 'next/cache';

export async function getCategories(profileId: string): Promise<ActionResult<CategoryOverview[]>> {
  const session = await getSession();
  if (!session || session.profile_id !== profileId) {
    return { success: false, error: 'Unauthorized' };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('category_overview')
    .select('*')
    .eq('profile_id', profileId)
    .order('is_special', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as CategoryOverview[] };
}

export async function getCategoryById(id: string): Promise<ActionResult<Category>> {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized' };

  const supabase = createClient();
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return { success: false, error: error.message };
  if (data.profile_id !== session.profile_id) {
    return { success: false, error: 'Not found' };
  }

  return { success: true, data: data as Category };
}

export async function createCategory(profileId: string, formData: unknown): Promise<ActionResult<Category>> {
  const session = await getSession();
  if (!session || session.profile_id !== profileId) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = createCategorySchema.safeParse(formData);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const supabase = createClient();
  const { data, error } = await supabase
    .from('categories')
    .insert({
      profile_id: profileId,
      name: parsed.data.name,
      type: parsed.data.type || null,
      icon: parsed.data.icon,
      color: parsed.data.color,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') return { success: false, error: 'Category name already exists' };
    return { success: false, error: error.message };
  }

  revalidatePath('/categories');
  return { success: true, data: data as Category };
}

export async function updateCategory(id: string, formData: { name?: string; type?: string; icon?: string; color?: string }): Promise<ActionResult<Category>> {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized' };

  const supabase = createClient();
  
  // Verify ownership
  const { data: existing } = await supabase.from('categories').select('profile_id').eq('id', id).single();
  if (!existing || existing.profile_id !== session.profile_id) {
    return { success: false, error: 'Not found' };
  }

  const updateData: Record<string, unknown> = {};
  if (formData.name !== undefined) updateData.name = formData.name;
  if (formData.type !== undefined) updateData.type = formData.type;
  if (formData.icon !== undefined) updateData.icon = formData.icon;
  if (formData.color !== undefined) updateData.color = formData.color;

  const { data, error } = await supabase
    .from('categories')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') return { success: false, error: 'Category name already exists' };
    return { success: false, error: error.message };
  }

  revalidatePath('/categories');
  revalidatePath(`/categories/${id}`);
  return { success: true, data: data as Category };
}

export async function deleteCategory(id: string): Promise<ActionResult<void>> {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized' };

  const supabase = createClient();
  
  // Verify ownership and not special
  const { data: existing } = await supabase.from('categories').select('profile_id, is_special').eq('id', id).single();
  if (!existing || existing.profile_id !== session.profile_id) {
    return { success: false, error: 'Not found' };
  }
  if (existing.is_special) {
    return { success: false, error: 'Cannot delete the Special category' };
  }

  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) return { success: false, error: error.message };

  revalidatePath('/categories');
  return { success: true };
}
