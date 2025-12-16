
// import { createClient } from './supabase-sdk.js'
console.log('Checking window.supabase:', window.supabase);
const createClient = window.supabase ? window.supabase.createClient : null;
if (!createClient) console.error('Supabase SDK not loaded!');

const SUPABASE_URL = 'https://rbmajbplwfyvrwtkczzn.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJibWFqYnBsd2Z5dnJ3dGtjenpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3OTY4MjksImV4cCI6MjA4MTM3MjgyOX0.QyqRAyBXe_ywsLRARu0NMnLHeN86AYAyl1C9Um9RTSE'

export const supabase = createClient ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;
