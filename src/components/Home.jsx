import { Link } from 'react-router-dom'

function Home() {
  const features = [
    {
      to: '/exercises',
      title: 'Exercise Library',
      description: 'Browse and filter bodyweight exercises by category and muscle.',
    },
    {
      to: '/goals',
      title: 'Body Goals',
      description: 'Curated exercise sets for Bulk, Athletic, Lean, or Muscular goals.',
    },
    {
      to: '/profile',
      title: 'Profile & Diet',
      description: 'Get an estimated daily calorie target and a sample meal plan.',
    },
    {
      to: '/progress',
      title: 'Progress Tracker',
      description: 'Log your weight and measurements, and see your trend over time.',
    },
    {
      to: '/streak',
      title: 'Streak Monitor',
      description: 'Track consecutive training days to stay motivated.',
    },
    {
      to: '/my-workout',
      title: 'My Workout',
      description: 'Build and save your own custom workout from the exercise library.',
    },
  ]

  return (
    <div className="min-h-screen bg-char">
      {/* Hero section */}
      <div className="px-8 py-24 text-center border-b border-charcoal-light">
        <h1 className="font-display text-7xl sm:text-8xl tracking-wide text-chalk mb-4">
          FEEL THE BURN
        </h1>
        <div className="ember-bar mx-auto mb-6"></div>
        <p className="text-steel text-lg max-w-xl mx-auto mb-8">
          Your all-in-one calisthenics companion — browse exercises, plan your diet,
          track your progress, and build a training streak.
        </p>
        <Link
          to="/exercises"
          className="inline-block bg-ember hover:bg-ember-dark text-chalk px-8 py-3 rounded-lg font-semibold text-lg transition-colors"
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
              className="bg-charcoal rounded-xl p-6 hover:bg-charcoal-light transition-colors block border border-transparent hover:border-ember/30"
            >
              <div className="ember-bar mb-4"></div>
              <h2 className="text-chalk font-semibold text-lg mb-2">
                {feature.title}
              </h2>
              <p className="text-steel text-sm">{feature.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Home
