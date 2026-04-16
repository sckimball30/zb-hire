import { NextResponse } from 'next/server'

// Sandbox no-op PATCH — echoes back the updated entry without touching the database
export async function PATCH(req: Request) {
  const body = await req.json()
  const now = new Date().toISOString()
  const fakeEntry = {
    id: `sandbox-${Date.now()}`,
    applicationId: 'sandbox',
    sectionTitle: body.sectionTitle ?? 'Section',
    interviewerName: body.interviewerName ?? 'Demo Interviewer',
    interviewerId: null,
    responses: JSON.stringify(body.responses ?? {}),
    status: body.status ?? 'DRAFT',
    submittedAt: body.status === 'SUBMITTED' ? now : null,
    createdAt: now,
    updatedAt: now,
  }
  return NextResponse.json(fakeEntry)
}
