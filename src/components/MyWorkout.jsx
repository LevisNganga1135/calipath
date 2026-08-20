import { Link } from 'react-router-dom'

function MyWorkout({ myWorkout, removeFromWorkout }) {
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
        <h1 className="font-display text-5xl tracking-wide text-chalk mb-2">
          MY WORKOUT ({myWorkout.length})
        </h1>
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
                    alt={exercise.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-16 h-16 bg-charcoal-light rounded-lg flex items-center justify-center text-steel text-xs">
                    No image
                  </div>
                )}
                <div>
                  <h2 className="text-chalk font-semibold">{exercise.name}</h2>
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
