import { Link } from 'react-router-dom'

function MyWorkout({ myWorkout, removeFromWorkout, currentUser, onRequestLogin }) {
  // Gate this page behind login — a saved workout is meaningless without an
  // account to attach it to.
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
