-- Add scorecardSections column to InterviewEvent
-- Stores a JSON array of ScorecardTemplateSection IDs assigned to this specific interview event
ALTER TABLE "InterviewEvent" ADD COLUMN "scorecardSections" TEXT;
