import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ktcadtrsjzfmidtsyeyp.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_kiNVIP_UEIOu5rIT5ENwLw_G119RzPk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
