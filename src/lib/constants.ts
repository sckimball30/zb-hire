import type { CandidateStage, Rating, CompetencyCategory, InterviewType, JobStatus } from '@/types'

export const STAGE_ORDER: Record<string, number> = {
  APPLIED: 0,
  PHONE_SCREEN: 1,
  ONSITE: 2,
  OFFER: 3,
  HIRED: 4,
  REJECTED: 5,
}

export const STAGE_LABELS: Record<string, string> = {
  APPLIED: 'Applied',
  PHONE_SCREEN: 'Phone Screen',
  ONSITE: 'Onsite',
  OFFER: 'Offer',
  HIRED: 'Hired',
  REJECTED: 'Rejected',
}

export const STAGE_COLORS: Record<string, string> = {
  APPLIED: 'bg-slate-100 text-slate-700',
  PHONE_SCREEN: 'bg-blue-100 text-blue-700',
  ONSITE: 'bg-purple-100 text-purple-700',
  OFFER: 'bg-yellow-100 text-yellow-700',
  HIRED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
}

export const STAGE_COLUMN_COLORS: Record<string, string> = {
  APPLIED: 'border-t-slate-400',
  PHONE_SCREEN: 'border-t-blue-400',
  ONSITE: 'border-t-purple-400',
  OFFER: 'border-t-yellow-400',
  HIRED: 'border-t-green-400',
  REJECTED: 'border-t-red-400',
}

export const RATING_LABELS: Record<string, string> = {
  // A/B/C player ratings (current)
  A: 'A Player',
  B: 'B Player',
  C: 'C Player',
  // Legacy full-scale ratings
  STRONG_NO: 'Strong No',
  NO: 'No',
  NEUTRAL: 'Neutral',
  YES: 'Yes',
  STRONG_YES: 'Strong Yes',
}

export const RATING_COLORS: Record<string, string> = {
  // A/B/C player ratings (current)
  A: 'bg-green-600 text-white',
  B: 'bg-amber-400 text-white',
  C: 'bg-red-600 text-white',
  // Legacy full-scale ratings
  STRONG_NO: 'bg-red-600 text-white',
  NO: 'bg-red-200 text-red-800',
  NEUTRAL: 'bg-gray-200 text-gray-800',
  YES: 'bg-green-200 text-green-800',
  STRONG_YES: 'bg-green-600 text-white',
}

export const CATEGORY_LABELS: Record<string, string> = {
  TECHNICAL: 'Technical',
  BEHAVIORAL: 'Behavioral',
  CULTURE_FIT: 'Culture Fit',
  LEADERSHIP: 'Leadership',
  COMMUNICATION: 'Communication',
  PROBLEM_SOLVING: 'Problem Solving',
  ROLE_SPECIFIC: 'Role Specific',
}

export const CATEGORY_COLORS: Record<string, string> = {
  TECHNICAL: 'bg-blue-100 text-blue-800',
  BEHAVIORAL: 'bg-purple-100 text-purple-800',
  CULTURE_FIT: 'bg-pink-100 text-pink-800',
  LEADERSHIP: 'bg-orange-100 text-orange-800',
  COMMUNICATION: 'bg-teal-100 text-teal-800',
  PROBLEM_SOLVING: 'bg-indigo-100 text-indigo-800',
  ROLE_SPECIFIC: 'bg-yellow-100 text-yellow-800',
}

export const INTERVIEW_TYPE_LABELS: Record<string, string> = {
  PHONE_SCREEN: 'Phone Screen',
  TECHNICAL: 'Technical',
  BEHAVIORAL: 'Behavioral',
  ONSITE: 'Onsite',
  PANEL: 'Panel',
  HIRING_MANAGER: 'Hiring Manager',
}

export const JOB_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  OPEN: 'Open',
  CLOSED: 'Closed',
  ARCHIVED: 'Archived',
}

export const JOB_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  OPEN: 'bg-green-100 text-green-700',
  CLOSED: 'bg-red-100 text-red-700',
  ARCHIVED: 'bg-slate-100 text-slate-600',
}

export const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
  TEMPORARY: 'Temporary',
}

export const ALL_STAGES: CandidateStage[] = [
  'APPLIED',
  'PHONE_SCREEN',
  'ONSITE',
  'OFFER',
  'HIRED',
  'REJECTED',
]
