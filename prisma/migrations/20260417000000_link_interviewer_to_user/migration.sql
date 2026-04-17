-- Add optional userId link from Interviewer to User
ALTER TABLE "Interviewer" ADD COLUMN "userId" TEXT;

-- Backfill: link existing Interviewer records to Users by matching email
UPDATE "Interviewer" i
SET "userId" = u.id
FROM "User" u
WHERE LOWER(u.email) = LOWER(i.email)
  AND i."userId" IS NULL;

-- Add unique constraint (after backfill to avoid conflicts)
ALTER TABLE "Interviewer" ADD CONSTRAINT "Interviewer_userId_key" UNIQUE ("userId");

-- Add foreign key
ALTER TABLE "Interviewer" ADD CONSTRAINT "Interviewer_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
