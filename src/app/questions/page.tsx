import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Plus } from 'lucide-react'
import { CATEGORY_LABELS, CATEGORY_COLORS } from '@/lib/constants'
import type { CompetencyCategory } from '@/types'

const CATEGORIES: CompetencyCategory[] = [
  'TECHNICAL', 'BEHAVIORAL', 'CULTURE_FIT', 'LEADERSHIP',
  'COMMUNICATION', 'PROBLEM_SOLVING', 'ROLE_SPECIFIC'
]

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: { category?: string }
}) {
  const categoryFilter = searchParams.category as CompetencyCategory | undefined

  const questions = await prisma.question.findMany({
    where: {
      isArchived: false,
      ...(categoryFilter && CATEGORIES.includes(categoryFilter)
        ? { category: categoryFilter }
        : {}),
    },
    orderBy: [{ category: 'asc' }, { createdAt: 'desc' }],
  })

  return (
    <div className="p-8">
      <div className="page-header">
        <div>
          <h1 className="page-title">Question Bank</h1>
          <p className="text-sm text-gray-500 mt-1">{questions.length} question{questions.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/questions/new" className="btn-primary">
            <Plus className="w-4 h-4" />
            New Question
          </Link>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link
          href="/questions"
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !categoryFilter
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All
        </Link>
        {CATEGORIES.map((cat) => (
          <Link
            key={cat}
            href={`/questions?category=${cat}`}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              categoryFilter === cat
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {CATEGORY_LABELS[cat]}
          </Link>
        ))}
      </div>

      <div className="card overflow-hidden">
        {questions.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-500">No questions found.</p>
            <Link href="/questions/new" className="btn-primary mt-4 inline-flex">
              <Plus className="w-4 h-4" />
              Add Question
            </Link>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Question</th>
                <th>Category</th>
                <th>Tags</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q) => (
                <tr key={q.id}>
                  <td>
                    <div className="max-w-lg">
                      <p className="text-gray-900 font-medium">{q.text}</p>
                      {q.guidance && (
                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{q.guidance}</p>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[q.category]}`}>
                      {CATEGORY_LABELS[q.category]}
                    </span>
                  </td>
                  <td>
                    {q.tags ? (
                      <div className="flex flex-wrap gap-1">
                        {q.tags.split(',').map((tag) => (
                          <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
