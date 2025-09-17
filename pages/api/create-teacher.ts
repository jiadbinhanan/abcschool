// pages/api/create-teacher.ts
import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { user_email, user_password, user_name } = req.body;

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || '',
            process.env.SUPABASE_SERVICE_ROLE_KEY || ''
        );

        const token = req.headers.authorization?.split(' ')[1];
        if (!token) throw new Error("Authentication token not found.");

        const { data: { user: requestingUser } } = await supabaseAdmin.auth.getUser(token);
        if (!requestingUser) throw new Error("Authentication failed");

        const { data: roleData } = await supabaseAdmin.from('user_roles').select('role').eq('user_id', requestingUser.id).single();
        if (roleData?.role !== 'admin') throw new Error("Permission denied: Not an admin.");

        const { data: newUserData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
            email: user_email,
            password: user_password,
            user_metadata: { name: user_name },
            email_confirm: true,
        });

        if (createUserError) throw new Error(`Supabase Auth Error: ${createUserError.message}`);
        
        const new_user_id = newUserData.user.id;

        await supabaseAdmin.from('user_roles').insert({ user_id: new_user_id, role: 'teacher' });
        await supabaseAdmin.from('teachers').insert({ id: new_user_id, name: user_name });

        res.status(200).json({ message: 'Teacher created successfully' });

    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}