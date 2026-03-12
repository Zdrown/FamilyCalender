import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const FAMILY_ID = process.env.FAMILY_ID || 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

function parseICalDate(val: string): { date: string; time: string | null } {
  // YYYYMMDD or YYYYMMDDTHHmmssZ
  if (val.length === 8) {
    return { date: `${val.slice(0, 4)}-${val.slice(4, 6)}-${val.slice(6, 8)}`, time: null };
  }
  const d = val.replace(/[TZ]/g, '');
  return {
    date: `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`,
    time: `${d.slice(8, 10)}:${d.slice(10, 12)}`,
  };
}

function parseICalEvents(ical: string) {
  const events: Array<{
    uid: string;
    title: string;
    date: string;
    start_time: string | null;
    end_time: string | null;
    all_day: boolean;
    description: string | null;
  }> = [];

  const blocks = ical.split('BEGIN:VEVENT');
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i].split('END:VEVENT')[0];
    const lines = block.split(/\r?\n/);
    const props: Record<string, string> = {};

    let currentKey = '';
    for (const line of lines) {
      if (line.startsWith(' ') || line.startsWith('\t')) {
        props[currentKey] = (props[currentKey] || '') + line.trim();
      } else {
        const colonIdx = line.indexOf(':');
        if (colonIdx > 0) {
          currentKey = line.slice(0, colonIdx).split(';')[0];
          props[currentKey] = line.slice(colonIdx + 1).trim();
        }
      }
    }

    const uid = props['UID'] || `ical-${i}`;
    const title = (props['SUMMARY'] || 'Untitled').replace(/\\,/g, ',').replace(/\\n/g, ' ');
    const dtstart = props['DTSTART'] || '';
    const dtend = props['DTEND'] || '';
    const description = props['DESCRIPTION']?.replace(/\\n/g, '\n').replace(/\\,/g, ',') || null;

    if (!dtstart) continue;

    const start = parseICalDate(dtstart);
    const end = dtend ? parseICalDate(dtend) : { date: start.date, time: null };
    const allDay = !start.time;

    events.push({
      uid,
      title,
      date: start.date,
      start_time: start.time,
      end_time: end.time,
      all_day: allDay,
      description,
    });
  }
  return events;
}

export async function POST(request: Request) {
  try {
    // Fetch all users with ical_url set
    const { data: users } = await supabase
      .from('users')
      .select('id, ical_url')
      .eq('family_id', FAMILY_ID)
      .not('ical_url', 'is', null);

    if (!users?.length) {
      return NextResponse.json({ message: 'No users with iCal URLs', imported: 0 });
    }

    let totalImported = 0;

    for (const user of users) {
      if (!user.ical_url) continue;

      try {
        const res = await fetch(user.ical_url, { next: { revalidate: 0 } } as any);
        if (!res.ok) continue;
        const icalText = await res.text();
        const events = parseICalEvents(icalText);

        // Only import events from last 30 days to next 90 days
        const now = new Date();
        const minDate = new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0];
        const maxDate = new Date(now.getTime() + 90 * 86400000).toISOString().split('T')[0];
        const filtered = events.filter((e) => e.date >= minDate && e.date <= maxDate);

        for (const event of filtered) {
          const externalId = `ical:${user.id}:${event.uid}:${event.date}`;

          // Upsert: check if exists by description containing external ID marker
          const { data: existing } = await supabase
            .from('events')
            .select('id')
            .eq('family_id', FAMILY_ID)
            .like('description', `%[ical:${event.uid}]%`)
            .eq('date', event.date)
            .single();

          if (existing) {
            await supabase
              .from('events')
              .update({
                title: event.title,
                start_time: event.start_time,
                end_time: event.end_time,
                all_day: event.all_day,
              })
              .eq('id', existing.id);
          } else {
            const { data: newEvent } = await supabase
              .from('events')
              .insert({
                family_id: FAMILY_ID,
                title: `📅 ${event.title}`,
                description: `${event.description || ''}\n[ical:${event.uid}]`.trim(),
                date: event.date,
                start_time: event.start_time,
                end_time: event.end_time,
                all_day: event.all_day,
                color: '#4285F4', // Google blue
                notify: false,
                recurrence: 'none',
                created_by: user.id,
              })
              .select('id')
              .single();

            if (newEvent) {
              await supabase.from('event_users').insert({
                event_id: newEvent.id,
                user_id: user.id,
              });
            }
          }
          totalImported++;
        }
      } catch (err) {
        console.error(`Failed to fetch iCal for user ${user.id}:`, err);
      }
    }

    return NextResponse.json({ imported: totalImported });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to import iCal events' }, { status: 500 });
  }
}
