import { supabase } from "../lib/supabase";
import { requireAuthUserId } from "../lib/requireAuth";

export async function uploadAvatar(file: File) {
    const userId = await requireAuthUserId();

    const fileExt = file.name.split(".").pop();
    const filePath = `${userId}.${fileExt}`;

    const { error } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
            upsert: true,
        });

    if (error) throw error;

    return filePath;
}