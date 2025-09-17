// pages/api/delete-teacher.ts
import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { user_id_to_delete } = req.body;
        
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || '',
            process.env.SUPABASE_SERVICE_ROLE_KEY || ''
        );

        const token = req.headers.authorization?.split(' ')[1];
        if (!token) throw new Error("Authentication token not found.");
        
        const { data: { user: requestingUser } } = await supabaseAdmin.auth.getUser(token);
        if (!requestingUser) throw new Error("Authentication failed.");

        const { data: roleData } = await supabaseAdmin.from('user_roles').select('role').eq('user_id', requestingUser.id).single();
        if (roleData?.role !== 'admin') throw new Error("Permission denied: Not an admin.");

        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id_to_delete);
        if (deleteError) throw new Error(`Supabase delete error: ${deleteError.message}`);

        res.status(200).json({ message: 'Teacher deleted successfully.' });

    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}