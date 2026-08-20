import { Link } from 'react-router-dom'

// This component receives its data as props from App.jsx, rather than
// fetching anything itself — it's purely a "display what I'm given" view.
function MyWorkout({ myWorkout, removeFromWorkout }) {
  if (myWorkout.length === 0) {
    return (
      <div className="min-h-screen bg-slate-900 p-8">
        <div className="max-w-3xl mx-auto text-center mt-16">
          <h1 className="text-3xl font-bold text-white mb-4">My Workout</h1>
          <p className="text-slate-400 mb-6">
            You haven't added any exercises yet.
          </p>
          <Link
            to="/exercises"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-500"
          >
            Browse Exercises
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">
          My Workout ({myWorkout.length})
        </h1>

        <div className="space-y-4">
          {myWorkout.map((exercise) => (
            <div
              key={exercise.id}
              className="bg-slate-800 rounded-xl p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                {exercise.thumbnail ? (
                  <img
                    src={exercise.thumbnail}
                    alt={exercise.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-16 h-16 bg-slate-700 rounded-lg flex items-center justify-center text-slate-500 text-xs">
                    No image
                  </div>
                )}
                <div>
                  <h2 className="text-white font-semibold">{exercise.name}</h2>
                  <span className="text-slate-400 text-sm">{exercise.category}</span>
                </div>
              </div>

              <button
                onClick={() => removeFromWorkout(exercise.id)}
                className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-red-500"
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
