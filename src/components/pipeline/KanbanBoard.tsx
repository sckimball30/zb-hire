'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { toast } from 'sonner'
import { CandidateCard } from './CandidateCard'
import { RejectionModal } from '@/components/applications/RejectionModal'
import { STAGE_LABELS, STAGE_COLORS, STAGE_COLUMN_COLORS, ALL_STAGES } from '@/lib/constants'
import type { CandidateStage } from '@/types'
import type { ApplicationWithRelations } from '@/types'

interface KanbanBoardProps {
  groupedApplications: Record<CandidateStage, ApplicationWithRelations[]>
  jobId: string
}

interface PendingRejection {
  applicationId: string
  fromStage: CandidateStage
  candidateId: string
  candidateFirstName: string
  jobTitle: string
  currentStage: CandidateStage
}

export function KanbanBoard({ groupedApplications, jobId }: KanbanBoardProps) {
  const [groups, setGroups] = useState(groupedApplications)
  const [activeApp, setActiveApp] = useState<ApplicationWithRelations | null>(null)
  const [pendingRejection, setPendingRejection] = useState<PendingRejection | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const findStage = useCallback(
    (id: string): CandidateStage | null => {
      if (ALL_STAGES.includes(id as CandidateStage)) return id as CandidateStage
      for (const stage of ALL_STAGES) {
        if (groups[stage].some((a) => a.id === id)) return stage
      }
      return null
    },
    [groups]
  )

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const stage = findStage(event.active.id as string)
      if (stage) {
        const app = groups[stage].find((a) => a.id === event.active.id) || null
        setActiveApp(app)
      }
    },
    [findStage, groups]
  )

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event
      if (!over) return

      const activeId = active.id as string
      const overId   = over.id  as string

      const fromStage = findStage(activeId)
      const toStage   = findStage(overId)

      if (!fromStage || !toStage || fromStage === toStage) return

      setGroups((prev) => {
        const movedApp = prev[fromStage].find((a) => a.id === activeId)
        if (!movedApp) return prev
        return {
          ...prev,
          [fromStage]: prev[fromStage].filter((a) => a.id !== activeId),
          [toStage]:   [...prev[toStage], { ...movedApp, stage: toStage }],
        }
      })
    },
    [findStage]
  )

  const commitStageChange = async (applicationId: string, newStage: CandidateStage) => {
    const res = await fetch(`/api/applications/${applicationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: newStage }),
    })
    if (!res.ok) throw new Error('Failed to update stage')
    toast.success(`Moved to ${STAGE_LABELS[newStage]}`)
  }

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event
      setActiveApp(null)

      if (!over) { setGroups(groupedApplications); return }

      const activeId = active.id as string
      const overId   = over.id  as string

      const originalStage = (() => {
        for (const stage of ALL_STAGES) {
          if (groupedApplications[stage].some((a) => a.id === activeId)) return stage
        }
        return null
      })()

      const toStage = findStage(overId)
      if (!originalStage || !toStage || originalStage === toStage) return

      // Intercept drops onto REJECTED — revert visual + show confirmation
      if (toStage === 'REJECTED') {
        setGroups(groupedApplications) // revert card to original column

        // Find the application to get candidate info
        const app = groupedApplications[originalStage].find(a => a.id === activeId)
        if (app) {
          setPendingRejection({
            applicationId: activeId,
            fromStage: originalStage,
            candidateId: (app.candidate as any).id,
            candidateFirstName: (app.candidate as any).firstName ?? '',
            jobTitle: (app as any).job?.title ?? '',
            currentStage: originalStage,
          })
        }
        return
      }

      // All other stage changes — commit immediately
      try {
        await commitStageChange(activeId, toStage)
      } catch {
        setGroups(groupedApplications)
        toast.error('Failed to move candidate — please try again.')
      }
    },
    [findStage, groupedApplications]
  )

  const handleRejectionConfirmed = async () => {
    if (!pendingRejection) return
    await commitStageChange(pendingRejection.applicationId, 'REJECTED')
    // Update local state to show them in REJECTED
    setGroups(prev => {
      const app = prev[pendingRejection.fromStage]?.find(a => a.id === pendingRejection.applicationId)
        ?? groupedApplications[pendingRejection.fromStage]?.find(a => a.id === pendingRejection.applicationId)
      if (!app) return prev
      return {
        ...prev,
        [pendingRejection.fromStage]: prev[pendingRejection.fromStage].filter(a => a.id !== pendingRejection.applicationId),
        REJECTED: [...prev.REJECTED, { ...app, stage: 'REJECTED' as CandidateStage }],
      }
    })
    setPendingRejection(null)
  }

  const handleRejectionCancelled = () => {
    setGroups(groupedApplications)
    setPendingRejection(null)
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 h-full">
          {ALL_STAGES.map((stage) => (
            <KanbanColumn
              key={stage}
              stage={stage}
              applications={groups[stage]}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
          {activeApp && (
            <div className="opacity-90 rotate-1 scale-105">
              <CandidateCard application={activeApp} isDragging />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {pendingRejection && (
        <RejectionModal
          candidateFirstName={pendingRejection.candidateFirstName}
          candidateId={pendingRejection.candidateId}
          jobTitle={pendingRejection.jobTitle}
          currentStage={pendingRejection.currentStage}
          onConfirm={handleRejectionConfirmed}
          onCancel={handleRejectionCancelled}
        />
      )}
    </>
  )
}

function KanbanColumn({
  stage,
  applications,
}: {
  stage: CandidateStage
  applications: ApplicationWithRelations[]
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  const ids = applications.map((a) => a.id)

  return (
    <div
      className={`flex flex-col w-56 flex-shrink-0 rounded-xl border-t-4 transition-colors ${STAGE_COLUMN_COLORS[stage]} ${
        isOver ? 'bg-blue-50' : 'bg-gray-50'
      }`}
    >
      <div className="px-3 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">{STAGE_LABELS[stage]}</span>
          <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${STAGE_COLORS[stage]}`}>
            {applications.length}
          </span>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto p-2 space-y-2 min-h-24 rounded-b-xl transition-colors ${
          isOver ? 'bg-blue-50' : ''
        }`}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {applications.map((app) => (
            <CandidateCard key={app.id} application={app} />
          ))}
        </SortableContext>

        {applications.length === 0 && (
          <div className={`flex items-center justify-center h-16 text-xs rounded-lg border-2 border-dashed transition-colors ${
            isOver
              ? 'border-blue-400 bg-blue-100 text-blue-500'
              : 'border-gray-200 text-gray-400'
          }`}>
            {isOver ? 'Release to drop' : 'Drop here'}
          </div>
        )}
      </div>
    </div>
  )
}
