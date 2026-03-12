import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendText } from '@/lib/utils/sms';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Normalize to recipients array
    const recipients: { userId: string; name: string }[] = body.recipients
      ? body.recipients
      : [{ userId: body.userId, name: body.name || 'User' }];

    const { message } = body;
    if (!message || recipients.length === 0) {
      return NextResponse.json({ error: 'Missing message or recipients' }, { status: 400 });
    }

    // Get family notification config from first recipient's family
    const { data: firstUser } = await supabase
      .from('users')
      .select('family_id')
      .eq('id', recipients[0].userId)
      .single();

    if (!firstUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { data: family } = await supabase
      .from('families')
      .select('notification_email, notification_app_password')
      .eq('id', firstUser.family_id)
      .single();

    if (!family?.notification_email || !family?.notification_app_password) {
      return NextResponse.json({ error: 'Family notification email not configured' }, { status: 400 });
    }

    const config = {
      gmail_address: family.notification_email,
      gmail_app_password: family.notification_app_password,
    };

    // Fetch phone/carrier for all recipients
    const userIds = recipients.map((r) => r.userId);
    const { data: usersData } = await supabase
      .from('users')
      .select('id, name, phone_number, carrier')
      .in('id', userIds);

    const sent: string[] = [];
    const failed: string[] = [];
    const errors: string[] = [];

    for (const user of usersData || []) {
      if (!user.phone_number || !user.carrier) {
        failed.push(user.name);
        errors.push(`${user.name}: missing phone or carrier`);
        continue;
      }

      try {
        await sendText(config, user.phone_number, user.carrier, message);
        sent.push(user.name);
      } catch (err: unknown) {
        failed.push(user.name);
        errors.push(`${user.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({ sent, failed, errors });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send notifications' }, { status: 500 });
  }
}
