import { Link } from 'react-router-dom'

// Simple landing page — introduces the app and links out to its main features.
// Kept as static content (no fetching) since its only job is orientation.
function Home() {
  const features = [
    {
      to: '/exercises',
      title: 'Exercise Library',
      description: 'Browse and filter bodyweight exercises by category and muscle.',
      color: 'bg-blue-600',
    },
    {
      to: '/goals',
      title: 'Body Goals',
      description: 'Curated exercise sets for Bulk, Athletic, Lean, or Muscular goals.',
      color: 'bg-purple-600',
    },
    {
      to: '/profile',
      title: 'Profile & Diet',
      description: 'Get an estimated daily calorie target and a sample meal plan.',
      color: 'bg-green-600',
    },
    {
      to: '/progress',
      title: 'Progress Tracker',
      description: 'Log your weight and measurements, and see your trend over time.',
      color: 'bg-orange-600',
    },
    {
      to: '/streak',
      title: 'Streak Monitor',
      description: 'Track consecutive training days to stay motivated.',
      color: 'bg-red-600',
    },
    {
      to: '/my-workout',
      title: 'My Workout',
      description: 'Build and save your own custom workout from the exercise library.',
      color: 'bg-cyan-600',
    },
  ]

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Hero section */}
      <div className="px-8 py-20 text-center border-b border-slate-800">
        <h1 className="text-5xl sm:text-6xl font-extrabold text-white mb-4">
          Feel The Burn 🔥
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto mb-8">
          Your all-in-one calisthenics companion — browse exercises, plan your diet,
          track your progress, and build a training streak.
        </p>
        <Link
          to="/exercises"
          className="inline-block bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-lg font-semibold text-lg"
        >
          Browse Exercises
        </Link>
      </div>

      {/* Feature grid */}
      <div className="max-w-5xl mx-auto px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Link
              key={feature.to}
              to={feature.to}
              className="bg-slate-800 rounded-xl p-6 hover:scale-105 transition-transform block"
            >
              <div
                className={`w-10 h-10 rounded-lg ${feature.color} mb-4`}
              ></div>
              <h2 className="text-white font-semibold text-lg mb-2">
                {feature.title}
              </h2>
              <p className="text-slate-400 text-sm">{feature.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Home
