import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const STANDARD_QUESTIONS = [
  // Screening
  {
    text: "What are your 3 biggest professional strengths?",
    category: "Screening",
    isStandard: true,
    aPlayerAnswer: "Names 3 with real examples. Ties each to an actual outcome. Confident without being arrogant.",
    bPlayerAnswer: "Lists strengths but no proof. Vague ('I'm a hard worker'). Can't connect to results.",
    cPlayerAnswer: "Buzzwords only, zero examples. Caught off guard by the question. Can't name a specific thing.",
  },
  {
    text: "What would your last manager say is your biggest area for improvement?",
    category: "Screening",
    isStandard: true,
    aPlayerAnswer: "Names a real, honest weakness. Genuinely self-aware. Actively working on it.",
    bPlayerAnswer: "Strength disguised as a weakness. 'I just work too hard.' Shows little growth.",
    cPlayerAnswer: "Gets defensive or deflects. Blames others for their gaps. Zero self-awareness.",
  },
  {
    text: "If I called your last manager right now, what would they say about you?",
    category: "Screening",
    isStandard: true,
    aPlayerAnswer: "Specific and balanced. Names real strengths AND growth areas. Doesn't flinch at the question.",
    bPlayerAnswer: "Only positives, nothing balanced. Vague and rehearsed. Noticeable hesitation.",
    cPlayerAnswer: "Clearly nervous or evasive. 'We didn't get along' — no self-reflection. Refuses to answer.",
  },
  {
    text: "What do you know about Wigglitz, and why does this role interest you?",
    category: "Screening",
    isStandard: true,
    aPlayerAnswer: "Did their homework on the product. Specific, genuine reason for applying. Real energy, not performative.",
    bPlayerAnswer: "Surface-level research only. Generic 'growth opportunity' line. Excited but not specific.",
    cPlayerAnswer: "Knows nothing about us. 'I just need a job.' Couldn't say what we make.",
  },
  // WHO Interview
  {
    text: "What were you hired to do? (Ask for every job in their history)",
    category: "WHO Interview",
    isStandard: true,
    aPlayerAnswer: "States clear outcomes from Day 1. Knew what success looked like. Describes the mandate precisely.",
    bPlayerAnswer: "Describes tasks, not outcomes. Vague on expectations. 'Just figured it out as I went.'",
    cPlayerAnswer: "No idea what they were hired for. Only talks about the job title. Can't distinguish one role from another.",
  },
  {
    text: "What accomplishments are you most proud of?",
    category: "WHO Interview",
    isStandard: true,
    aPlayerAnswer: "Ties wins to specific outcomes. Uses real numbers where possible. Personally owns the result.",
    bPlayerAnswer: "Talks about what they enjoyed. Credits team without owning their part. No measurable outcomes.",
    cPlayerAnswer: "Can't name a real accomplishment. Always 'we,' never 'I'. Stories are vague and unmemorable.",
  },
  {
    text: "What were some low points during that job? (Keep reframing until you get a real answer)",
    category: "WHO Interview",
    isStandard: true,
    aPlayerAnswer: "Names a real, specific low point. Takes full accountability. Explains what changed after.",
    bPlayerAnswer: "Soft answer, minimizes the issue. Blames circumstances not themselves. Lesson was minor or vague.",
    cPlayerAnswer: "Refuses to name one. Blames others entirely. Gets defensive or emotional.",
  },
  {
    text: "What was your manager's name? What was it like working with them? What would they say about you?",
    category: "WHO Interview",
    isStandard: true,
    aPlayerAnswer: "Candid and fair about the manager. Knows exactly what feedback they'd get. Zero trash-talking.",
    bPlayerAnswer: "Mostly positive but vague. Mild bitter undertone. Can't articulate the feedback.",
    cPlayerAnswer: "Immediately bashes the manager. 'We didn't get along' with no self-reflection. Refuses to answer.",
  },
  {
    text: "How would you rate the team you inherited (A/B/C)? What changes did you make? How would you rate them when you left?",
    category: "WHO Interview",
    isStandard: true,
    aPlayerAnswer: "Made real changes — hired well, coached up, cut C players. Team rating improved. Owns the outcome.",
    bPlayerAnswer: "Tried to improve, minimal results. Avoided the hard calls. Rating basically flat.",
    cPlayerAnswer: "Made no changes. Blames the team without accountability. Can't rate them.",
  },
  {
    text: "Why did you leave that job?",
    category: "WHO Interview",
    isStandard: true,
    aPlayerAnswer: "Clear, honest, forward-looking. Driven by growth or bigger opportunity. No excessive negativity.",
    bPlayerAnswer: "Vague or rehearsed answer. Slightly negative undertone. Doesn't connect to growth.",
    cPlayerAnswer: "Bashes the company or manager. Evasive or contradictory. Story doesn't add up.",
  },
  // Core Values
  {
    text: "Tell me about a time you took full ownership of a problem that wasn't technically yours to fix.",
    category: "Core Values",
    isStandard: true,
    aPlayerAnswer: "Specific story. Stepped in without being asked. Drove it to resolution. Takes pride in the outcome.",
    bPlayerAnswer: "Helped but waited to be asked. Partial ownership. Outcome was OK but not fully driven.",
    cPlayerAnswer: "Can't think of an example. 'That wasn't my job.' Passes the buck in their stories.",
  },
  {
    text: "Describe a situation where you had to make a fast decision with incomplete information.",
    category: "Core Values",
    isStandard: true,
    aPlayerAnswer: "Made the call, owned it, adjusted if needed. Bias toward action with calculated risk.",
    bPlayerAnswer: "Waited longer than ideal. Over-analyzed. Made the call but with hesitation.",
    cPlayerAnswer: "Waited for permission. Got paralyzed. Passed the decision to someone else.",
  },
  {
    text: "Tell me about the hardest professional moment you've faced and how you handled it.",
    category: "Core Values",
    isStandard: true,
    aPlayerAnswer: "Named a genuinely hard moment. Stayed composed. Focused on solutions. Came out stronger.",
    bPlayerAnswer: "Moderate difficulty. Handled it OK but showed some cracks. Recovery was slow.",
    cPlayerAnswer: "Can't think of one. Downplays. Shows fragility or victim mentality in the story.",
  },
  {
    text: "What does being the best at your job mean to you, and how do you pursue it?",
    category: "Core Values",
    isStandard: true,
    aPlayerAnswer: "Specific standards. Constantly benchmarking. Hungry to improve. Talks about competition with pride.",
    bPlayerAnswer: "Values quality but in a general way. No clear system or benchmark. Comfortable being good.",
    cPlayerAnswer: "Vague or indifferent. 'I just do my job.' No drive to be exceptional. Hates the word competition.",
  },
]

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let created = 0
  for (const q of STANDARD_QUESTIONS) {
    const existing = await prisma.question.findFirst({ where: { text: q.text } })
    if (!existing) {
      await prisma.question.create({ data: q })
      created++
    }
  }
  return NextResponse.json({ ok: true, created, total: STANDARD_QUESTIONS.length })
}
