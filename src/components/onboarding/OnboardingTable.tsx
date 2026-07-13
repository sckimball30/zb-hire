'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Plus, MapPin, Calendar, FileText, Trash2, CheckCircle2 } from 'lucide-react'
import { AddPersonModal, LOCATIONS } from './AddPersonModal'
import type { OnboardingRecord } from '@prisma/client'

const CHECKLIST: { key: keyof OnboardingRecord; label: string }[] = [
  { key: 'i9',               label: 'I-9' },
  { key: 'bankInfo',         label: 'Bank info' },
  { key: 'employeeHandbook', label: 'Employee handbook' },
  { key: 'i9Verification',   label: 'I-9 verification' },
]

function isComplete(r: OnboardingRecord) {
  return r.i9 && r.bankInfo && r.employeeHandbook && r.i9Verification
}

function checkedCount(r: OnboardingRecord) {
  return [r.i9, r.bankInfo, r.employeeHandbook, r.i9Verification].filter(Boolean).length
}

function getStatus(r: OnboardingRecord) {
  const n = checkedCount(r)
  if (n === 4) return 'done'
  if (n > 0) return 'inprog'
  return 'pending'
}

function formatStart(d: Date | null | string) {
  if (!d) return null
  const dt = new Date(d)
  return {
    date: dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    time: dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase(),
  }
}

function initials(r: OnboardingRecord) {
  return (r.firstName[0] + r.lastName[0]).toUpperCase()
}

function shortLocation(loc: string) {
  return loc.startsWith('HQ') ? 'HQ' : 'Shed'
}

interface TableState {
  expandedId: string | null
  editingNotes: string | null
  notesValue: string
  editingLocation: string | null
  editingStart: string | null
  startDate: string
  startTime: string
}

interface RowProps {
  r: OnboardingRecord
  state: TableState
  setState: React.Dispatch<React.SetStateAction<TableState>>
  onToggleCheck: (id: string, key: string, current: boolean) => void
  onSaveNotes: (id: string) => void
  onSaveLocation: (id: string, location: string) => void
  onSaveStart: (id: string) => void
  onDelete: (id: string) => void
}

function RecordRow({ r, state, setState, onToggleCheck, onSaveNotes, onSaveLocation, onSaveStart, onDelete }: RowProps) {
  const expanded = state.expandedId === r.id
  const st = getStatus(r)
  const startFmt = formatStart(r.startDate)

  function toggleExpand() {
    setState(s => ({ ...s, expandedId: s.expandedId === r.id ? null : r.id }))
  }

  function startEditingStart() {
    if (r.startDate) {
      const d = new Date(r.startDate)
      setState(s => ({ ...s, editingStart: r.id, startDate: d.toISOString().slice(0, 10), startTime: d.toTimeString().slice(0, 5) }))
    } else {
      setState(s => ({ ...s, editingStart: r.id, startDate: '', startTime: '09:00' }))
    }
  }

  return (
    <div className={`border-b border-gray-100 last:border-0 ${isComplete(r) ? 'opacity-60' : ''}`}>
      <div
        className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 cursor-pointer select-none"
        onClick={toggleExpand}
      >
        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center flex-shrink-0">
          {initials(r)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">{r.firstName} {r.lastName}</span>
            {r.source === 'ATS' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">ATS</span>
            )}
          </div>
          <span className="text-xs text-gray-400">{r.role}</span>
        </div>
        <div className="hidden sm:flex items-center gap-1 text-xs text-gray-500 w-16">
          <MapPin className="w-3 h-3 text-gray-300 flex-shrink-0" />
          {shortLocation(r.location)}
        </div>
        <div className="hidden md:block text-xs text-gray-500 w-28">
          {startFmt
            ? <span>{startFmt.date}, {startFmt.time}</span>
            : <span className="text-gray-300">No date set</span>
          }
        </div>
        <div className="flex items-center gap-1.5">
          {CHECKLIST.map(c => (
            <div key={String(c.key)} className={`w-2 h-2 rounded-full ${(r[c.key] as boolean) ? 'bg-green-400' : 'bg-gray-200'}`} />
          ))}
        </div>
        <span className={`hidden sm:inline-flex text-xs font-medium px-2 py-1 rounded-full w-24 justify-center ${
          st === 'done'   ? 'bg-green-50 text-green-700' :
          st === 'inprog' ? 'bg-blue-50 text-blue-700' :
                            'bg-amber-50 text-amber-700'
        }`}>
          {st === 'done' ? 'Completed' : st === 'inprog' ? 'In progress' : 'Pending'}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-300 flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </div>

      {expanded && (
        <div className="px-5 pb-5 pt-2 bg-gray-50 border-t border-gray-100">
          {/* Checklist */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {CHECKLIST.map(c => {
              const checked = r[c.key] as boolean
              return (
                <button
                  key={String(c.key)}
                  onClick={() => onToggleCheck(r.id, String(c.key), checked)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-all ${
                    checked
                      ? 'bg-green-50 border-green-200 text-green-800'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border ${
                    checked ? 'bg-green-500 border-green-500' : 'border-gray-300'
                  }`}>
                    {checked && <CheckCircle2 className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                  </div>
                  <span className="text-sm font-medium">{c.label}</span>
                </button>
              )
            })}
          </div>

          {/* Meta */}
          <div className="flex flex-wrap gap-6 mb-3">
            {/* Location */}
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Location</p>
              {state.editingLocation === r.id ? (
                <select
                  autoFocus
                  defaultValue={r.location}
                  onChange={e => onSaveLocation(r.id, e.target.value)}
                  onBlur={e => onSaveLocation(r.id, e.target.value)}
                  className="text-sm border border-gray-200 rounded px-2 py-1 bg-white"
                >
                  {LOCATIONS.map(l => <option key={l}>{l}</option>)}
                </select>
              ) : (
                <button
                  onClick={() => setState(s => ({ ...s, editingLocation: r.id }))}
                  className="flex items-center gap-1.5 text-sm text-gray-700 hover:text-blue-600 group"
                >
                  <MapPin className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-400" />
                  {r.location}
                </button>
              )}
            </div>

            {/* Start date */}
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Start date & time</p>
              {state.editingStart === r.id ? (
                <div className="flex items-center gap-2">
                  <input type="date" value={state.startDate} onChange={e => setState(s => ({ ...s, startDate: e.target.value }))} className="text-sm border border-gray-200 rounded px-2 py-1" />
                  <input type="time" value={state.startTime} onChange={e => setState(s => ({ ...s, startTime: e.target.value }))} className="text-sm border border-gray-200 rounded px-2 py-1" />
                  <button onClick={() => onSaveStart(r.id)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Save</button>
                  <button onClick={() => setState(s => ({ ...s, editingStart: null }))} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                </div>
              ) : (
                <button onClick={startEditingStart} className="flex items-center gap-1.5 text-sm text-gray-700 hover:text-blue-600 group">
                  <Calendar className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-400" />
                  {startFmt ? `${startFmt.date} at ${startFmt.time}` : <span className="text-gray-400">Set start date</span>}
                </button>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="mb-3">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Notes</p>
            {state.editingNotes === r.id ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={state.notesValue}
                  onChange={e => setState(s => ({ ...s, notesValue: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') onSaveNotes(r.id); if (e.key === 'Escape') setState(s => ({ ...s, editingNotes: null })) }}
                  className="flex-1 text-sm border border-gray-200 rounded px-2 py-1"
                  placeholder="Add a note…"
                />
                <button onClick={() => onSaveNotes(r.id)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Save</button>
                <button onClick={() => setState(s => ({ ...s, editingNotes: null }))} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
              </div>
            ) : (
              <button
                onClick={() => setState(s => ({ ...s, editingNotes: r.id, notesValue: r.notes ?? '' }))}
                className="flex items-center gap-1.5 text-sm text-gray-700 hover:text-blue-600 group"
              >
                <FileText className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-400" />
                {r.notes ? r.notes : <span className="text-gray-400">Add note</span>}
              </button>
            )}
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => onDelete(r.id)}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function OnboardingTable({ initialRecords }: { initialRecords: OnboardingRecord[] }) {
  const [records, setRecords] = useState(initialRecords)
  const [showCompleted, setShowCompleted] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [tableState, setTableState] = useState<TableState>({
    expandedId: null,
    editingNotes: null,
    notesValue: '',
    editingLocation: null,
    editingStart: null,
    startDate: '',
    startTime: '09:00',
  })

  const active = records.filter(r => !isComplete(r))
  const completed = records.filter(r => isComplete(r))
  const pending = active.filter(r => checkedCount(r) === 0).length
  const inProgress = active.filter(r => checkedCount(r) > 0).length

  const now = new Date()
  const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const upcoming = active.filter(r => {
    if (!r.startDate) return false
    const d = new Date(r.startDate)
    return d >= now && d <= sevenDays
  })

  async function toggleCheck(id: string, key: string, current: boolean) {
    setRecords(prev => prev.map(r => r.id === id ? { ...r, [key]: !current } : r))
    await fetch(`/api/onboarding/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: !current }),
    })
  }

  async function saveNotes(id: string) {
    const val = tableState.notesValue
    setRecords(prev => prev.map(r => r.id === id ? { ...r, notes: val || null } : r))
    setTableState(s => ({ ...s, editingNotes: null }))
    await fetch(`/api/onboarding/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: val }),
    })
  }

  async function saveLocation(id: string, location: string) {
    setRecords(prev => prev.map(r => r.id === id ? { ...r, location } : r))
    setTableState(s => ({ ...s, editingLocation: null }))
    await fetch(`/api/onboarding/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location }),
    })
  }

  async function saveStart(id: string) {
    const iso = tableState.startDate
      ? new Date(`${tableState.startDate}T${tableState.startTime || '09:00'}`).toISOString()
      : null
    setRecords(prev => prev.map(r => r.id === id ? { ...r, startDate: iso ? new Date(iso) : null } : r))
    setTableState(s => ({ ...s, editingStart: null }))
    await fetch(`/api/onboarding/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: iso }),
    })
  }

  async function deleteRecord(id: string) {
    if (!confirm('Remove this person from onboarding?')) return
    setRecords(prev => prev.filter(r => r.id !== id))
    await fetch(`/api/onboarding/${id}`, { method: 'DELETE' })
  }

  const rowProps = {
    state: tableState,
    setState: setTableState,
    onToggleCheck: toggleCheck,
    onSaveNotes: saveNotes,
    onSaveLocation: saveLocation,
    onSaveStart: saveStart,
    onDelete: deleteRecord,
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Onboarding</h1>
          <p className="text-sm text-gray-400 mt-0.5">Track paperwork and start dates for new hires</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add person
        </button>
      </div>

      {/* Upcoming starts banner */}
      {upcoming.length > 0 && (
        <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl px-5 py-3.5">
          <p className="text-sm font-semibold text-amber-800 mb-1.5">
            Starting within 7 days — checklist incomplete
          </p>
          <div className="space-y-1">
            {upcoming.map(r => {
              const fmt = formatStart(r.startDate)
              const missing = CHECKLIST.filter(c => !(r[c.key] as boolean)).map(c => c.label)
              return (
                <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="text-amber-900 font-medium">{r.firstName} {r.lastName}</span>
                  <div className="flex items-center gap-3">
                    {fmt && <span className="text-amber-700">{fmt.date} at {fmt.time}</span>}
                    <span className="text-amber-600 text-xs">Missing: {missing.join(', ')}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Pending',     value: pending,          color: 'text-amber-600' },
          { label: 'In progress', value: inProgress,       color: 'text-blue-600' },
          { label: 'Completed',   value: completed.length, color: 'text-green-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card px-5 py-4">
            <div className={`text-2xl font-semibold ${color}`}>{value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Active table */}
      <div className="card overflow-hidden mb-4">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Active ({active.length})</h2>
          <div className="hidden sm:flex items-center gap-4 text-xs text-gray-400 pr-10">
            <span className="w-16">Location</span>
            <span className="w-28">Start date</span>
            <span>Checklist</span>
          </div>
        </div>
        {active.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            No active onboarding. Add a person or move a candidate to Hired in the pipeline.
          </div>
        ) : (
          active.map(r => <RecordRow key={r.id} r={r} {...rowProps} />)
        )}
      </div>

      {/* Completed section */}
      {completed.length > 0 && (
        <div className="card overflow-hidden">
          <button
            onClick={() => setShowCompleted(s => !s)}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
          >
            <h2 className="text-sm font-semibold text-gray-500">Completed ({completed.length})</h2>
            <ChevronRight className={`w-4 h-4 text-gray-300 transition-transform ${showCompleted ? 'rotate-90' : ''}`} />
          </button>
          {showCompleted && completed.map(r => <RecordRow key={r.id} r={r} {...rowProps} />)}
        </div>
      )}

      {addOpen && (
        <AddPersonModal
          onClose={() => setAddOpen(false)}
          onAdded={record => {
            setRecords(prev => [record, ...prev])
            setAddOpen(false)
          }}
        />
      )}
    </>
  )
}
