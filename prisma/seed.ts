import { PrismaClient, JobStatus, CandidateStage, InterviewType, Rating, CompetencyCategory } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Clean up existing data
  await prisma.activityLog.deleteMany()
  await prisma.scorecardResponse.deleteMany()
  await prisma.scorecard.deleteMany()
  await prisma.interviewEvent.deleteMany()
  await prisma.scorecardTemplateQuestion.deleteMany()
  await prisma.scorecardTemplateSection.deleteMany()
  await prisma.scorecardTemplate.deleteMany()
  await prisma.application.deleteMany()
  await prisma.jobInterviewer.deleteMany()
  await prisma.job.deleteMany()
  await prisma.candidate.deleteMany()
  await prisma.question.deleteMany()
  await prisma.interviewer.deleteMany()

  // Create Interviewers
  const interviewers = await Promise.all([
    prisma.interviewer.create({
      data: {
        name: 'Alice Johnson',
        email: 'alice@company.com',
        title: 'Senior Software Engineer',
      },
    }),
    prisma.interviewer.create({
      data: {
        name: 'Bob Martinez',
        email: 'bob@company.com',
        title: 'Engineering Manager',
      },
    }),
    prisma.interviewer.create({
      data: {
        name: 'Carol Chen',
        email: 'carol@company.com',
        title: 'Product Manager',
      },
    }),
    prisma.interviewer.create({
      data: {
        name: 'David Park',
        email: 'david@company.com',
        title: 'HR Business Partner',
      },
    }),
    prisma.interviewer.create({
      data: {
        name: 'Emma Wilson',
        email: 'emma@company.com',
        title: 'Staff Engineer',
      },
    }),
    prisma.interviewer.create({
      data: {
        name: 'Frank Torres',
        email: 'frank@company.com',
        title: 'VP of Engineering',
      },
    }),
  ])

  console.log(`Created ${interviewers.length} interviewers`)

  // Create Jobs
  const jobs = await Promise.all([
    prisma.job.create({
      data: {
        title: 'Senior Frontend Engineer',
        department: 'Engineering',
        location: 'San Francisco, CA (Hybrid)',
        description: 'We are looking for a Senior Frontend Engineer to join our product team. You will work on building scalable, performant web applications using React and TypeScript.',
        status: JobStatus.OPEN,
        hiringGoal: 2,
      },
    }),
    prisma.job.create({
      data: {
        title: 'Product Manager',
        department: 'Product',
        location: 'Remote',
        description: 'Join our product team as a Product Manager. You will define product strategy, work closely with engineering, and deliver features that delight our users.',
        status: JobStatus.OPEN,
        hiringGoal: 1,
      },
    }),
    prisma.job.create({
      data: {
        title: 'Backend Engineer',
        department: 'Engineering',
        location: 'New York, NY',
        description: 'We are hiring a Backend Engineer to help build our data platform and APIs.',
        status: JobStatus.DRAFT,
        hiringGoal: 3,
      },
    }),
  ])

  console.log(`Created ${jobs.length} jobs`)

  // Assign interview teams
  await Promise.all([
    // Frontend Engineer team
    prisma.jobInterviewer.create({ data: { jobId: jobs[0].id, interviewerId: interviewers[0].id, role: 'Technical Interviewer' } }),
    prisma.jobInterviewer.create({ data: { jobId: jobs[0].id, interviewerId: interviewers[1].id, role: 'Hiring Manager' } }),
    prisma.jobInterviewer.create({ data: { jobId: jobs[0].id, interviewerId: interviewers[3].id, role: 'HR Screen' } }),
    prisma.jobInterviewer.create({ data: { jobId: jobs[0].id, interviewerId: interviewers[4].id, role: 'Technical Interviewer' } }),
    // Product Manager team
    prisma.jobInterviewer.create({ data: { jobId: jobs[1].id, interviewerId: interviewers[2].id, role: 'Hiring Manager' } }),
    prisma.jobInterviewer.create({ data: { jobId: jobs[1].id, interviewerId: interviewers[3].id, role: 'HR Screen' } }),
    prisma.jobInterviewer.create({ data: { jobId: jobs[1].id, interviewerId: interviewers[5].id, role: 'Executive Interview' } }),
  ])

  console.log('Assigned interview teams')

  // Create Questions
  const questions = await Promise.all([
    // Technical
    prisma.question.create({ data: { text: 'Describe a complex technical problem you solved recently. What was your approach?', guidance: 'Look for systematic thinking and ability to break down complex problems.', category: CompetencyCategory.TECHNICAL, tags: 'problem-solving,engineering' } }),
    prisma.question.create({ data: { text: 'How do you approach performance optimization in a web application?', guidance: 'Look for knowledge of profiling tools, caching, lazy loading, and bundle optimization.', category: CompetencyCategory.TECHNICAL, tags: 'performance,frontend' } }),
    prisma.question.create({ data: { text: 'Explain the difference between SQL and NoSQL databases. When would you use each?', guidance: 'Assess understanding of data modeling trade-offs.', category: CompetencyCategory.TECHNICAL, tags: 'databases,architecture' } }),
    // Behavioral
    prisma.question.create({ data: { text: 'Tell me about a time you had a conflict with a teammate. How did you handle it?', guidance: 'Look for empathy, communication skills, and resolution focus.', category: CompetencyCategory.BEHAVIORAL, tags: 'conflict,teamwork' } }),
    prisma.question.create({ data: { text: 'Describe a situation where you had to deliver bad news to a stakeholder.', guidance: 'Assess communication style and accountability.', category: CompetencyCategory.BEHAVIORAL, tags: 'communication,stakeholder' } }),
    prisma.question.create({ data: { text: 'Tell me about a project that failed. What did you learn from it?', guidance: 'Look for self-awareness, growth mindset, and accountability.', category: CompetencyCategory.BEHAVIORAL, tags: 'failure,learning' } }),
    // Culture Fit
    prisma.question.create({ data: { text: 'What type of work environment do you thrive in?', guidance: 'Align with company culture - fast-paced, collaborative, remote-friendly.', category: CompetencyCategory.CULTURE_FIT, tags: 'culture,environment' } }),
    prisma.question.create({ data: { text: 'What motivates you in your work day-to-day?', guidance: 'Look for intrinsic motivation and alignment with company mission.', category: CompetencyCategory.CULTURE_FIT, tags: 'motivation,values' } }),
    // Leadership
    prisma.question.create({ data: { text: 'Describe your experience mentoring junior team members.', guidance: 'Look for specific examples and impact on others growth.', category: CompetencyCategory.LEADERSHIP, tags: 'mentorship,leadership' } }),
    prisma.question.create({ data: { text: 'Tell me about a time you drove a cross-functional initiative.', guidance: 'Assess ability to influence without authority.', category: CompetencyCategory.LEADERSHIP, tags: 'cross-functional,influence' } }),
    // Communication
    prisma.question.create({ data: { text: 'How do you communicate technical concepts to non-technical stakeholders?', guidance: 'Look for clarity, empathy, and ability to adapt communication style.', category: CompetencyCategory.COMMUNICATION, tags: 'communication,stakeholder' } }),
    prisma.question.create({ data: { text: 'Describe your approach to giving and receiving feedback.', guidance: 'Look for openness, specificity, and growth mindset.', category: CompetencyCategory.COMMUNICATION, tags: 'feedback,growth' } }),
    // Problem Solving
    prisma.question.create({ data: { text: 'Walk me through how you would debug a production issue affecting customers.', guidance: 'Assess systematic thinking, prioritization, and communication under pressure.', category: CompetencyCategory.PROBLEM_SOLVING, tags: 'debugging,production,incident' } }),
    prisma.question.create({ data: { text: 'How do you prioritize when you have multiple competing deadlines?', guidance: 'Look for frameworks, stakeholder communication, and trade-off analysis.', category: CompetencyCategory.PROBLEM_SOLVING, tags: 'prioritization,time-management' } }),
    // Role Specific
    prisma.question.create({ data: { text: 'Describe your experience with React hooks and state management libraries.', guidance: 'Assess depth of React knowledge including custom hooks, useContext, Redux/Zustand.', category: CompetencyCategory.ROLE_SPECIFIC, tags: 'react,frontend,hooks' } }),
    prisma.question.create({ data: { text: 'How do you approach product discovery and validation?', guidance: 'Look for user research methods, experimentation, and data-driven decision making.', category: CompetencyCategory.ROLE_SPECIFIC, tags: 'product,discovery,research' } }),
    prisma.question.create({ data: { text: 'What is your experience with A/B testing and feature flagging?', guidance: 'Assess knowledge of experimentation frameworks and statistical significance.', category: CompetencyCategory.ROLE_SPECIFIC, tags: 'experimentation,product' } }),
    prisma.question.create({ data: { text: 'How do you design RESTful APIs? What are your guiding principles?', guidance: 'Look for REST principles, versioning strategy, error handling, and documentation.', category: CompetencyCategory.ROLE_SPECIFIC, tags: 'api,backend,rest' } }),
    prisma.question.create({ data: { text: 'Describe your experience with CI/CD pipelines and deployment strategies.', guidance: 'Assess familiarity with modern DevOps practices.', category: CompetencyCategory.TECHNICAL, tags: 'devops,cicd,deployment' } }),
    prisma.question.create({ data: { text: 'How do you ensure code quality in your team?', guidance: 'Look for code review practices, testing culture, and tooling.', category: CompetencyCategory.TECHNICAL, tags: 'code-quality,testing,review' } }),
  ])

  console.log(`Created ${questions.length} questions`)

  // Create Scorecard Templates for OPEN jobs
  const frontendTemplate = await prisma.scorecardTemplate.create({
    data: {
      jobId: jobs[0].id,
      name: 'Senior Frontend Engineer Scorecard',
      sections: {
        create: [
          {
            title: 'Technical Skills',
            sortOrder: 0,
            questions: {
              create: [
                { questionId: questions[0].id, sortOrder: 0, required: true },
                { questionId: questions[1].id, sortOrder: 1, required: true },
                { questionId: questions[14].id, sortOrder: 2, required: true },
                { questionId: questions[18].id, sortOrder: 3, required: false },
              ],
            },
          },
          {
            title: 'Behavioral & Culture',
            sortOrder: 1,
            questions: {
              create: [
                { questionId: questions[3].id, sortOrder: 0, required: true },
                { questionId: questions[6].id, sortOrder: 1, required: true },
                { questionId: questions[10].id, sortOrder: 2, required: false },
              ],
            },
          },
        ],
      },
    },
  })

  const pmTemplate = await prisma.scorecardTemplate.create({
    data: {
      jobId: jobs[1].id,
      name: 'Product Manager Scorecard',
      sections: {
        create: [
          {
            title: 'Product Thinking',
            sortOrder: 0,
            questions: {
              create: [
                { questionId: questions[15].id, sortOrder: 0, required: true },
                { questionId: questions[16].id, sortOrder: 1, required: true },
                { questionId: questions[13].id, sortOrder: 2, required: true },
              ],
            },
          },
          {
            title: 'Leadership & Communication',
            sortOrder: 1,
            questions: {
              create: [
                { questionId: questions[8].id, sortOrder: 0, required: true },
                { questionId: questions[9].id, sortOrder: 1, required: true },
                { questionId: questions[10].id, sortOrder: 2, required: false },
                { questionId: questions[4].id, sortOrder: 3, required: false },
              ],
            },
          },
        ],
      },
    },
  })

  console.log('Created scorecard templates')

  // Create Candidates
  const candidates = await Promise.all([
    prisma.candidate.create({ data: { firstName: 'Sarah', lastName: 'Kim', email: 'sarah.kim@email.com', phone: '415-555-0101', source: 'LinkedIn', notes: 'Strong React background, referred by Alice.' } }),
    prisma.candidate.create({ data: { firstName: 'James', lastName: 'Okafor', email: 'james.okafor@email.com', phone: '415-555-0102', source: 'Referral', notes: 'Former colleague of Bob.' } }),
    prisma.candidate.create({ data: { firstName: 'Priya', lastName: 'Nair', email: 'priya.nair@email.com', phone: '415-555-0103', source: 'LinkedIn', linkedInUrl: 'https://linkedin.com/in/priyanair' } }),
    prisma.candidate.create({ data: { firstName: 'Michael', lastName: 'Stevens', email: 'michael.stevens@email.com', phone: '415-555-0104', source: 'Indeed' } }),
    prisma.candidate.create({ data: { firstName: 'Aisha', lastName: 'Patel', email: 'aisha.patel@email.com', phone: '415-555-0105', source: 'AngelList', linkedInUrl: 'https://linkedin.com/in/aishapatel' } }),
    prisma.candidate.create({ data: { firstName: 'Tom', lastName: 'Zhang', email: 'tom.zhang@email.com', phone: '415-555-0106', source: 'Greenhouse' } }),
    prisma.candidate.create({ data: { firstName: 'Nina', lastName: 'Rossi', email: 'nina.rossi@email.com', phone: '415-555-0107', source: 'LinkedIn' } }),
    prisma.candidate.create({ data: { firstName: 'Kevin', lastName: 'Brown', email: 'kevin.brown@email.com', phone: '415-555-0108', source: 'Referral' } }),
    prisma.candidate.create({ data: { firstName: 'Lena', lastName: 'Garcia', email: 'lena.garcia@email.com', phone: '415-555-0109', source: 'Job Board' } }),
    prisma.candidate.create({ data: { firstName: 'Omar', lastName: 'Hassan', email: 'omar.hassan@email.com', phone: '415-555-0110', source: 'LinkedIn' } }),
  ])

  console.log(`Created ${candidates.length} candidates`)

  // Create Applications with various stages
  const now = new Date()
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000)

  const applications = await Promise.all([
    // Frontend Engineer applications
    prisma.application.create({ data: { candidateId: candidates[0].id, jobId: jobs[0].id, stage: CandidateStage.ONSITE, stageOrder: 2, createdAt: daysAgo(14) } }),
    prisma.application.create({ data: { candidateId: candidates[1].id, jobId: jobs[0].id, stage: CandidateStage.PHONE_SCREEN, stageOrder: 1, createdAt: daysAgo(7) } }),
    prisma.application.create({ data: { candidateId: candidates[2].id, jobId: jobs[0].id, stage: CandidateStage.APPLIED, stageOrder: 0, createdAt: daysAgo(3) } }),
    prisma.application.create({ data: { candidateId: candidates[3].id, jobId: jobs[0].id, stage: CandidateStage.OFFER, stageOrder: 3, createdAt: daysAgo(21) } }),
    prisma.application.create({ data: { candidateId: candidates[4].id, jobId: jobs[0].id, stage: CandidateStage.REJECTED, stageOrder: 0, rejectedAt: daysAgo(5), createdAt: daysAgo(10) } }),
    prisma.application.create({ data: { candidateId: candidates[5].id, jobId: jobs[0].id, stage: CandidateStage.HIRED, stageOrder: 4, hiredAt: daysAgo(2), createdAt: daysAgo(30) } }),
    // Product Manager applications
    prisma.application.create({ data: { candidateId: candidates[6].id, jobId: jobs[1].id, stage: CandidateStage.APPLIED, stageOrder: 0, createdAt: daysAgo(2) } }),
    prisma.application.create({ data: { candidateId: candidates[7].id, jobId: jobs[1].id, stage: CandidateStage.PHONE_SCREEN, stageOrder: 1, createdAt: daysAgo(8) } }),
    prisma.application.create({ data: { candidateId: candidates[8].id, jobId: jobs[1].id, stage: CandidateStage.ONSITE, stageOrder: 2, createdAt: daysAgo(15) } }),
    prisma.application.create({ data: { candidateId: candidates[9].id, jobId: jobs[1].id, stage: CandidateStage.APPLIED, stageOrder: 0, createdAt: daysAgo(1) } }),
  ])

  console.log(`Created ${applications.length} applications`)

  // Activity logs for applications
  await Promise.all([
    prisma.activityLog.create({ data: { applicationId: applications[0].id, action: 'Application created', actorName: 'System', createdAt: daysAgo(14) } }),
    prisma.activityLog.create({ data: { applicationId: applications[0].id, action: 'Stage changed to PHONE_SCREEN', actorName: 'David Park', createdAt: daysAgo(12) } }),
    prisma.activityLog.create({ data: { applicationId: applications[0].id, action: 'Stage changed to ONSITE', actorName: 'Bob Martinez', createdAt: daysAgo(7) } }),
    prisma.activityLog.create({ data: { applicationId: applications[3].id, action: 'Application created', actorName: 'System', createdAt: daysAgo(21) } }),
    prisma.activityLog.create({ data: { applicationId: applications[3].id, action: 'Stage changed to PHONE_SCREEN', actorName: 'David Park', createdAt: daysAgo(18) } }),
    prisma.activityLog.create({ data: { applicationId: applications[3].id, action: 'Stage changed to ONSITE', actorName: 'Bob Martinez', createdAt: daysAgo(14) } }),
    prisma.activityLog.create({ data: { applicationId: applications[3].id, action: 'Stage changed to OFFER', actorName: 'Bob Martinez', createdAt: daysAgo(7) } }),
    prisma.activityLog.create({ data: { applicationId: applications[5].id, action: 'Stage changed to HIRED', actorName: 'Frank Torres', createdAt: daysAgo(2) } }),
  ])

  // Create Interview Events
  const events = await Promise.all([
    prisma.interviewEvent.create({
      data: {
        applicationId: applications[0].id,
        interviewerId: interviewers[3].id,
        type: InterviewType.PHONE_SCREEN,
        scheduledAt: daysAgo(12),
        durationMins: 30,
        location: 'Phone',
        notes: 'Initial HR screen',
      },
    }),
    prisma.interviewEvent.create({
      data: {
        applicationId: applications[0].id,
        interviewerId: interviewers[0].id,
        type: InterviewType.TECHNICAL,
        scheduledAt: daysAgo(7),
        durationMins: 60,
        location: 'Zoom',
        notes: 'Technical deep-dive on React and system design',
      },
    }),
    prisma.interviewEvent.create({
      data: {
        applicationId: applications[3].id,
        interviewerId: interviewers[1].id,
        type: InterviewType.HIRING_MANAGER,
        scheduledAt: daysAgo(10),
        durationMins: 45,
        location: 'Office - Conference Room A',
      },
    }),
    prisma.interviewEvent.create({
      data: {
        applicationId: applications[8].id,
        interviewerId: interviewers[2].id,
        type: InterviewType.BEHAVIORAL,
        scheduledAt: daysAgo(5),
        durationMins: 60,
        location: 'Zoom',
      },
    }),
  ])

  console.log(`Created ${events.length} interview events`)

  // Create Scorecards with Responses
  const scorecard1 = await prisma.scorecard.create({
    data: {
      applicationId: applications[0].id,
      interviewerId: interviewers[3].id,
      interviewEventId: events[0].id,
      overallRating: Rating.YES,
      summary: 'Strong candidate with clear communication skills. Good culture fit. Recommended to move to technical round.',
      recommendation: 'Move forward',
      submittedAt: daysAgo(12),
    },
  })

  await prisma.scorecardResponse.createMany({
    data: [
      { scorecardId: scorecard1.id, questionId: questions[3].id, rating: Rating.YES, notes: 'Gave a clear example of resolving conflict through direct conversation.' },
      { scorecardId: scorecard1.id, questionId: questions[6].id, rating: Rating.YES, notes: 'Mentioned preference for collaborative, fast-moving teams - good fit.' },
    ],
  })

  const scorecard2 = await prisma.scorecard.create({
    data: {
      applicationId: applications[0].id,
      interviewerId: interviewers[0].id,
      interviewEventId: events[1].id,
      overallRating: Rating.STRONG_YES,
      summary: 'Excellent technical skills. Strong React knowledge, good system design thinking. One of the best candidates we have seen.',
      recommendation: 'Strong hire',
      submittedAt: daysAgo(7),
    },
  })

  await prisma.scorecardResponse.createMany({
    data: [
      { scorecardId: scorecard2.id, questionId: questions[0].id, rating: Rating.STRONG_YES, notes: 'Walked through a complex state management problem with clarity. Used systematic approach.' },
      { scorecardId: scorecard2.id, questionId: questions[1].id, rating: Rating.YES, notes: 'Good understanding of performance optimization - code splitting, memoization, lazy loading.' },
      { scorecardId: scorecard2.id, questionId: questions[14].id, rating: Rating.STRONG_YES, notes: 'Deep knowledge of React hooks, custom hooks, and performance patterns. Built custom state management solution.' },
    ],
  })

  const scorecard3 = await prisma.scorecard.create({
    data: {
      applicationId: applications[3].id,
      interviewerId: interviewers[1].id,
      interviewEventId: events[2].id,
      overallRating: Rating.YES,
      summary: 'Solid candidate. Has the experience level we need. Team expressed interest in extending offer.',
      recommendation: 'Extend offer',
      submittedAt: daysAgo(10),
    },
  })

  await prisma.scorecardResponse.createMany({
    data: [
      { scorecardId: scorecard3.id, questionId: questions[8].id, rating: Rating.YES, notes: 'Mentored 2 junior engineers at previous company.' },
      { scorecardId: scorecard3.id, questionId: questions[10].id, rating: Rating.YES, notes: 'Good examples of technical communication to business stakeholders.' },
    ],
  })

  console.log('Created scorecards and responses')
  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
