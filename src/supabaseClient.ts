import { createClient } from '@supabase/supabase-js'

// Cấp đường link ảo tạm thời để tránh lỗi trắng trang khi chưa làm Database
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tamthoi.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'ma-khoa-tam-thoi'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)