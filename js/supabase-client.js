import { API_BASE_URL } from './api-config.js';

console.warn('⚠️ js/supabase-client.js is deprecated. Please use js/api-config.js and standard fetch API instead.');

// Export API_BASE_URL for backward compatibility if needed
export { API_BASE_URL };

// Export a dummy supabase object to prevent crash if something still imports it
export const supabase = {
    from: () => {
        console.error('❌ Supabase SDK is removed. Use fetch API with API_BASE_URL.');
        return { select: () => ({ data: [], error: 'Supabase SDK removed' }) };
    },
    auth: {
        getUser: async () => ({ data: { user: null } }),
        onAuthStateChange: () => { }
    }
};
