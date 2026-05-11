import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()

        const { error } = await supabase
            .from('triage_cases')
            .insert({
                phone: body.phone,
                urgency_score: body.urgency_score,
                priority_label: body.priority_label,
                triage_status: body.triage_status,
                patient_intent: body.patient_intent,
                summary: body.summary,
                soap_note: body.soap_note,
                media_url: body.media_url || '',
                message_type: body.message_type,
                raw_message: body.raw_message,
                triaged_at: body.triaged_at
            })

        if (error) {
            console.error('Supabase error:', error)
            return NextResponse.json({ success: false, error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true }, { status: 200 })

    } catch (err) {
        console.error('API error:', err)
        return NextResponse.json({ success: false }, { status: 500 })
    }
}

export async function GET(req: NextRequest) {
    try {
        const { data, error } = await supabase
            .from('triage_cases')
            .select('*')
            .order('triaged_at', { ascending: false })
            .limit(100)

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, data }, { status: 200 })

    } catch (err) {
        console.error('API error:', err)
        return NextResponse.json({ success: false }, { status: 500 })
    }
}