import type {
  Candidate,
  Job,
  Application,
  Interviewer,
  InterviewEvent,
  Scorecard,
  ScorecardResponse,
  ScorecardTemplate,
  ScorecardTemplateSection,
  ScorecardTemplateQuestion,
  Question,
  ActivityLog,
  JobInterviewer,
  User,
  Invitation,
  CandidateNote,
  MessageTemplate,
  MessageLog,
} from '@prisma/client'

// Re-export Prisma model types
export type {
  Candidate,
  Job,
  Application,
  Interviewer,
  InterviewEvent,
  Scorecard,
  ScorecardResponse,
  ScorecardTemplate,
  ScorecardTemplateSection,
  ScorecardTemplateQuestion,
  Question,
  ActivityLog,
  JobInterviewer,
  User,
  Invitation,
  CandidateNote,
  MessageTemplate,
  MessageLog,
}

// String-literal union types (replaces Prisma enums for SQLite)
export type CandidateStage = 'APPLIED' | 'PHONE_SCREEN' | 'ONSITE' | 'OFFER' | 'HIRED' | 'REJECTED'
export type JobStatus = 'DRAFT' | 'OPEN' | 'CLOSED' | 'ARCHIVED'
export type InterviewType = 'PHONE_SCREEN' | 'TECHNICAL' | 'BEHAVIORAL' | 'ONSITE' | 'PANEL' | 'HIRING_MANAGER'
export type Rating = 'STRONG_NO' | 'NO' | 'NEUTRAL' | 'YES' | 'STRONG_YES'
export type CompetencyCategory = 'TECHNICAL' | 'BEHAVIORAL' | 'CULTURE_FIT' | 'LEADERSHIP' | 'COMMUNICATION' | 'PROBLEM_SOLVING' | 'ROLE_SPECIFIC'
export type UserRole = 'ADMIN' | 'RECRUITER' | 'INTERVIEWER'

// Augmented types with relations
export type ApplicationWithRelations = Application & {
  candidate: Candidate
  job: Job
  scorecards?: ScorecardWithRelations[]
  events?: InterviewEventWithRelations[]
  activityLog?: ActivityLog[]
}

export type ScorecardWithRelations = Scorecard & {
  interviewer: Interviewer
  responses: ScorecardResponseWithQuestion[]
  interviewEvent?: InterviewEvent | null
}

export type ScorecardResponseWithQuestion = ScorecardResponse & {
  question: Question
}

export type InterviewEventWithRelations = InterviewEvent & {
  interviewer: Interviewer
  scorecard?: Scorecard | null
}

export type JobWithRelations = Job & {
  interviewers?: JobInterviewerWithInterviewer[]
  scorecardTemplate?: ScorecardTemplateWithRelations | null
  applications?: ApplicationWithRelations[]
  _count?: {
    applications: number
    interviewers?: number
  }
}

export type JobInterviewerWithInterviewer = JobInterviewer & {
  interviewer: Interviewer
}

export type ScorecardTemplateWithRelations = ScorecardTemplate & {
  sections: ScorecardTemplateSectionWithQuestions[]
}

export type ScorecardTemplateSectionWithQuestions = ScorecardTemplateSection & {
  questions: ScorecardTemplateQuestionWithQuestion[]
}

export type ScorecardTemplateQuestionWithQuestion = ScorecardTemplateQuestion & {
  question: Question
}

export type CandidateWithRelations = Candidate & {
  applications: ApplicationWithJobRelation[]
  candidateNotes?: CandidateNote[]
  messageLogs?: MessageLog[]
  _count?: {
    applications: number
  }
}

export type ApplicationWithJobRelation = Application & {
  job: Job
}

export type InterviewerWithRelations = Interviewer & {
  jobAssignments?: JobInterviewerWithJob[]
  _count?: {
    jobAssignments: number
    scorecards: number
  }
}

export type JobInterviewerWithJob = JobInterviewer & {
  job: Job
}

export type MessageTemplateWithLogs = MessageTemplate & {
  messageLogs?: MessageLog[]
}

export type InvitationWithInviter = Invitation & {
  invitedBy: Pick<User, 'name' | 'email'>
}

export type SessionUser = {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  role: UserRole
}
