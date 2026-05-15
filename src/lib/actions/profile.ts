'use server';

import { createClient } from '@/lib/supabase/server';
import { getSession, signSession, setSessionCookie, clearSessionCookie } from '@/lib/utils/session';
import { createProfileSchema, loginSchema, updateProfileSchema } from '@/lib/validations/schemas';
import { ActionResult, Profile } from '@/types/app';
import { revalidatePath } from 'next/cache';

export async function getProfiles(): Promise<ActionResult<Profile[]>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as Profile[] };
}

export async function getProfileByUsername(username: string): Promise<ActionResult<Profile>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (error) return { success: false, error: 'Profile not found' };
  return { success: true, data: data as Profile };
}

export async function createProfile(formData: unknown): Promise<ActionResult<Profile>> {
  const parsed = createProfileSchema.safeParse(formData);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      username: parsed.data.username.toLowerCase(),
      display_name: parsed.data.display_name,
      avatar_color: parsed.data.avatar_color,
      pin: parsed.data.pin || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') return { success: false, error: 'Username already taken' };
    return { success: false, error: error.message };
  }

  return { success: true, data: data as Profile };
}

export async function loginProfile(formData: unknown): Promise<ActionResult<{ token: string }>> {
  const parsed = loginSchema.safeParse(formData);
  if (!parsed.success) return { success: false, error: 'Invalid input' };

  const supabase = createClient();
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', parsed.data.username.toLowerCase())
    .single();

  if (error || !profile) return { success: false, error: 'Profile not found' };

  // Check PIN if set
  if (profile.pin && profile.pin !== parsed.data.pin) {
    return { success: false, error: 'Invalid PIN' };
  }

  const token = await signSession({
    profile_id: profile.id,
    username: profile.username,
    display_name: profile.display_name,
    avatar_color: profile.avatar_color,
  });

  await setSessionCookie(token);
  return { success: true, data: { token } };
}

export async function logoutProfile(): Promise<ActionResult<void>> {
  await clearSessionCookie();
  return { success: true };
}

export async function updateProfile(id: string, formData: unknown): Promise<ActionResult<Profile>> {
  const session = await getSession();
  if (!session || session.profile_id !== id) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = updateProfileSchema.safeParse(formData);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const supabase = createClient();
  const updateData: Record<string, unknown> = {};
  if (parsed.data.display_name !== undefined) updateData.display_name = parsed.data.display_name;
  if (parsed.data.avatar_color !== undefined) updateData.avatar_color = parsed.data.avatar_color;
  if (parsed.data.pin !== undefined) updateData.pin = parsed.data.pin;

  const { data, error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  // Update session cookie if display_name or avatar_color changed
  if (parsed.data.display_name || parsed.data.avatar_color) {
    const newToken = await signSession({
      profile_id: session.profile_id,
      username: session.username,
      display_name: parsed.data.display_name || session.display_name,
      avatar_color: parsed.data.avatar_color || session.avatar_color,
    });
    await setSessionCookie(newToken);
  }

  revalidatePath('/settings');
  return { success: true, data: data as Profile };
}

export async function deleteProfile(id: string): Promise<ActionResult<void>> {
  const session = await getSession();
  if (!session || session.profile_id !== id) {
    return { success: false, error: 'Unauthorized' };
  }

  const supabase = createClient();
  const { error } = await supabase.from('profiles').delete().eq('id', id);
  if (error) return { success: false, error: error.message };

  await clearSessionCookie();
  return { success: true };
}

export async function deleteAllQuestions(profileId: string): Promise<ActionResult<void>> {
  const session = await getSession();
  if (!session || session.profile_id !== profileId) {
    return { success: false, error: 'Unauthorized' };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('profile_id', profileId);

  if (error) return { success: false, error: error.message };
  revalidatePath('/categories');
  return { success: true };
}
