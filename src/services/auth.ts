import { supabase } from "../lib/supabase";

export type SignUpResult =
  | { needsEmailConfirmation: true; session: null }
  | { needsEmailConfirmation: false; session: NonNullable<Awaited<ReturnType<typeof supabase.auth.signUp>>["data"]["session"]> };

export async function signUp(params: { email: string; password: string }): Promise<SignUpResult> {
  const { data, error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
  });

  if (error) throw error;

  if (!data.session) {
    return { needsEmailConfirmation: true, session: null };
  }

  return { needsEmailConfirmation: false, session: data.session };
}

export async function signIn(params: { email: string; password: string }) {
  return supabase.auth.signInWithPassword(params);
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user ?? null;
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) throw error;
  return data;
}