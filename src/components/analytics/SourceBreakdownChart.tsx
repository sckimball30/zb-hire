'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface Props {
  data: { name: string; value: number }[]
}

const COLORS = ['#4AFFD2', '#F26D77', '#F5D020', '#3AADE0', '#a78bfa', '#fb923c', '#34d399', '#f472b6']

export function SourceBreakdownChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[220px] text-sm text-gray-400">
        No application data yet.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
          formatter={(val: number, name: string) => [val, name]}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span style={{ fontSize: 11, color: '#6b7280' }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
