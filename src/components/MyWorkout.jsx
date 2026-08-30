import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

function MyWorkout({ myWorkout, removeFromWorkout, currentUser, onRequestLogin }) {
  // Gate this page behind login — a saved workout is meaningless without an
  // account to attach it to.
  // Counts how many saved exercises fall into each category, for the
  // muscle-group breakdown chart. Colors cycle through the brand palette.
  const CHART_COLORS = ['#ff5a1f', '#ffd23f', '#8a8a93', '#d9431a', '#f5f3ef']

  function getCategoryBreakdown() {
    const counts = {}
    for (const exercise of myWorkout) {
      const category = exercise.category || 'Uncategorized'
      counts[category] = (counts[category] || 0) + 1
    }
    return Object.entries(counts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-char p-8">
        <div className="max-w-md mx-auto text-center mt-24">
          <h1 className="font-display text-4xl tracking-wide text-chalk mb-4">
            LOG IN REQUIRED
          </h1>
          <div className="ember-bar mx-auto mb-6"></div>
          <p className="text-steel mb-6">
            Sign in to build and save your own workout from the exercise library.
          </p>
          <button
            onClick={onRequestLogin}
            className="bg-ember hover:bg-ember-dark text-chalk px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Log In / Sign Up
          </button>
        </div>
      </div>
    )
  }

  if (myWorkout.length === 0) {
    return (
      <div className="min-h-screen bg-char p-8">
        <div className="max-w-3xl mx-auto text-center mt-16">
          <h1 className="font-display text-5xl tracking-wide text-chalk mb-4">
            MY WORKOUT
          </h1>
          <div className="ember-bar mx-auto mb-6"></div>
          <p className="text-steel mb-6">
            You haven't added any exercises yet.
          </p>
          <Link
            to="/exercises"
            className="inline-block bg-ember hover:bg-ember-dark text-chalk px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Browse Exercises
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-char p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-2">
          <h1 className="font-display text-5xl tracking-wide text-chalk">
            MY WORKOUT ({myWorkout.length})
          </h1>
          <Link
            to="/log-workout"
            className="bg-gold hover:bg-gold/90 text-char px-5 py-2.5 rounded-lg font-semibold transition-colors"
          >
            ▶ Start Workout
          </Link>
        </div>
        <div className="ember-bar mb-6"></div>
        
        {myWorkout.length > 0 && (
          <div className="bg-charcoal rounded-xl p-6 mb-6 border border-charcoal-light">
            <h2 className="font-display text-2xl tracking-wide text-chalk mb-4">
              MUSCLE GROUP BREAKDOWN
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={getCategoryBreakdown()} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#26262b" vertical={false} />
                <XAxis
                  dataKey="category"
                  stroke="#8a8a93"
                  tick={{ fontSize: 11, fontFamily: 'Space Grotesk' }}
                  tickLine={false}
                  axisLine={{ stroke: '#26262b' }}
                />
                <YAxis
                  allowDecimals={false}
                  stroke="#8a8a93"
                  tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1c1c1f',
                    border: '1px solid #26262b',
                    borderRadius: '8px',
                    fontFamily: 'Space Grotesk',
                  }}
                  labelStyle={{ color: '#f5f3ef', fontWeight: 600 }}
                  itemStyle={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: '#ff5a1f' }}
                  cursor={{ fill: '#26262b' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {getCategoryBreakdown().map((entry, index) => (
                    <Cell key={entry.category} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="space-y-4">
          {myWorkout.map((exercise) => (
            <div
              key={exercise.id}
              className="bg-charcoal rounded-xl p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                {exercise.thumbnail ? (
                  <img
                    src={exercise.thumbnail}
                    alt={exercise.exercise_name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-charcoal-light to-char rounded-lg flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 text-steel/40">
                      <path d="M2 12h2M4 8v8M6 6v12M8 10v4M16 10v4M18 6v12M20 8v8M22 12h-2" strokeLinecap="round" />
                    </svg>
                  </div>
                )}
                <div>
                  <h2 className="text-chalk font-semibold">{exercise.exercise_name}</h2>
                  <span className="text-steel text-sm">{exercise.category}</span>
                </div>
              </div>

              <button
                onClick={() => removeFromWorkout(exercise.id)}
                className="bg-ember/20 text-ember px-3 py-1.5 rounded-lg text-sm hover:bg-ember/30 transition-colors"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MyWorkout
