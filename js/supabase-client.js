
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const SUPABASE_URL = 'https://rbmajbplwfyvrwtkczzn.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJibWFqYnBsd2Z5dnJ3dGtjenpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3OTY4MjksImV4cCI6MjA4MTM3MjgyOX0.QyqRAyBXe_ywsLRARu0NMnLHeN86AYAyl1C9Um9RTSE'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
