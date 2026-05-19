export default function ApplicationLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 animate-pulse">
      {/* Nav bar skeleton */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-8 w-24 bg-gray-200 rounded-lg" />
        <div className="h-4 w-px bg-gray-200" />
        <div className="h-4 w-32 bg-gray-200 rounded" />
        <div className="ml-auto flex items-center gap-2">
          <div className="h-8 w-8 bg-gray-200 rounded-md" />
          <div className="h-4 w-16 bg-gray-200 rounded" />
          <div className="h-8 w-8 bg-gray-200 rounded-md" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Candidate header */}
          <div className="card p-5">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-gray-200 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-6 w-48 bg-gray-200 rounded" />
                <div className="h-4 w-32 bg-gray-200 rounded" />
                <div className="h-4 w-24 bg-gray-200 rounded" />
              </div>
            </div>
          </div>

          {/* Stage selector */}
          <div className="card p-4">
            <div className="h-4 w-24 bg-gray-200 rounded mb-3" />
            <div className="flex gap-2 flex-wrap">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-8 w-24 bg-gray-200 rounded-full" />
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="card p-4 space-y-3">
            <div className="h-4 w-20 bg-gray-200 rounded" />
            {[1, 2].map(i => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-full bg-gray-200 rounded" />
                  <div className="h-3 w-4/5 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>

          {/* Scorecard */}
          <div className="card p-4 space-y-3">
            <div className="h-4 w-28 bg-gray-200 rounded" />
            <div className="h-3 w-full bg-gray-200 rounded" />
            <div className="h-3 w-3/4 bg-gray-200 rounded" />
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          <div className="card p-4 space-y-2">
            <div className="h-4 w-20 bg-gray-200 rounded" />
            <div className="h-3 w-full bg-gray-200 rounded" />
            <div className="h-3 w-2/3 bg-gray-200 rounded" />
          </div>
          <div className="card p-4 space-y-2">
            <div className="h-4 w-24 bg-gray-200 rounded" />
            <div className="h-16 w-full bg-gray-200 rounded" />
          </div>
          <div className="card p-4 space-y-2">
            <div className="h-4 w-20 bg-gray-200 rounded" />
            <div className="h-3 w-full bg-gray-200 rounded" />
            <div className="h-3 w-4/5 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}
