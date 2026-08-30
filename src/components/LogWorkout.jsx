import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:5555/api'
const TOKEN_KEY = 'feelTheBurn.token'

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function LogWorkout({ myWorkout, currentUser, onRequestLogin }) {
  const [session, setSession] = useState(null)
  const [isCreatingSession, setIsCreatingSession] = useState(true)

  const [selectedExerciseId, setSelectedExerciseId] = useState('')
  const [lastLogged, setLastLogged] = useState(null)
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')

  // On load, immediately start a session for today — sets save incrementally
  // as they're logged, so nothing is lost if the user leaves mid-workout.
  useEffect(() => {
    if (!currentUser) {
      setIsCreatingSession(false)
      return
    }

    const token = localStorage.getItem(TOKEN_KEY)
    fetch(`${API_BASE}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: 'Workout', date: todayISO() }),
    })
      .then((res) => res.json())
      .then((data) => setSession(data))
      .finally(() => setIsCreatingSession(false))
  }, [currentUser])

  // Whenever the selected exercise changes, fetch the "last logged" hint for it
  useEffect(() => {
    if (!selectedExerciseId) {
      setLastLogged(null)
      return
    }
    const token = localStorage.getItem(TOKEN_KEY)
    fetch(`${API_BASE}/sessions/last-logged/${selectedExerciseId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setLastLogged(data))
      .catch(() => setLastLogged(null))
  }, [selectedExerciseId])

  const selectedExercise = myWorkout.find(
    (r) => String(r.exercise_id) === String(selectedExerciseId)
  )

  async function handleAddSet(e) {
    e.preventDefault()
    if (!session || !selectedExercise || !weight || !reps) return

    const token = localStorage.getItem(TOKEN_KEY)

    try {
      const response = await fetch(`${API_BASE}/sessions/${session.id}/sets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          exercise_id: selectedExercise.exercise_id,
          exercise_name: selectedExercise.exercise_name,
          weight_kg: Number(weight),
          reps: Number(reps),
        }),
      })
      if (!response.ok) return
      const newSet = await response.json()

      setSession((prev) => ({ ...prev, sets: [...prev.sets, newSet] }))
      setReps('') // keep weight filled in — usually the same across sets
    } catch (err) {
      console.error('Failed to add set:', err)
    }
  }

  async function handleDeleteSet(setId) {
    const token = localStorage.getItem(TOKEN_KEY)
    try {
      const response = await fetch(`${API_BASE}/sessions/sets/${setId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) return
      setSession((prev) => ({
        ...prev,
        sets: prev.sets.filter((s) => s.id !== setId),
      }))
    } catch (err) {
      console.error('Failed to delete set:', err)
    }
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-char p-8">
        <div className="max-w-md mx-auto text-center mt-24">
          <h1 className="font-display text-4xl tracking-wide text-chalk mb-4">
            LOG IN REQUIRED
          </h1>
          <div className="ember-bar mx-auto mb-6"></div>
          <p className="text-steel mb-6">Sign in to log a workout session.</p>
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

  if (isCreatingSession) {
    return (
      <div className="min-h-screen bg-char flex items-center justify-center">
        <p className="text-chalk text-xl font-display tracking-wide animate-pulse">
          Starting workout...
        </p>
      </div>
    )
  }

  if (myWorkout.length === 0) {
    return (
      <div className="min-h-screen bg-char p-8">
        <div className="max-w-md mx-auto text-center mt-24">
          <h1 className="font-display text-4xl tracking-wide text-chalk mb-4">
            NO SAVED EXERCISES
          </h1>
          <div className="ember-bar mx-auto mb-6"></div>
          <p className="text-steel mb-6">
            Add exercises to My Workout before starting a logging session.
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

  // Group logged sets by exercise for display
  const setsByExercise = {}
  for (const set of session?.sets ?? []) {
    if (!setsByExercise[set.exercise_name]) setsByExercise[set.exercise_name] = []
    setsByExercise[set.exercise_name].push(set)
  }

  return (
    <div className="min-h-screen bg-char p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-2">
          <h1 className="font-display text-5xl tracking-wide text-chalk">
            LOG WORKOUT
          </h1>
          <Link
            to="/my-workout"
            className="bg-charcoal hover:bg-charcoal-light text-chalk px-5 py-2.5 rounded-lg font-medium transition-colors"
          >
            Finish Workout
          </Link>
        </div>
        <div className="ember-bar mb-6"></div>

        <form onSubmit={handleAddSet} className="bg-charcoal rounded-xl p-6 mb-6">
          <label className="block text-steel text-sm mb-1">Exercise</label>
          <select
            value={selectedExerciseId}
            onChange={(e) => setSelectedExerciseId(e.target.value)}
            className="w-full bg-charcoal-light text-chalk px-3 py-2 rounded-lg mb-3 focus:outline-none focus:ring-1 focus:ring-ember"
          >
            <option value="">Select an exercise...</option>
            {myWorkout.map((r) => (
              <option key={r.exercise_id} value={r.exercise_id}>
                {r.exercise_name}
              </option>
            ))}
          </select>

          {lastLogged && (
            <p className="text-steel text-xs mb-3">
              Last logged: <span className="text-gold">{lastLogged.weight_kg}kg × {lastLogged.reps} reps</span>
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-steel text-sm mb-1">Weight (kg)</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full bg-charcoal-light text-chalk px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-ember"
                placeholder="e.g. 40"
              />
            </div>
            <div>
              <label className="block text-steel text-sm mb-1">Reps</label>
              <input
                type="number"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                className="w-full bg-charcoal-light text-chalk px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-ember"
                placeholder="e.g. 10"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!selectedExerciseId || !weight || !reps}
            className="w-full bg-gold hover:bg-gold/90 text-char py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            + Add Set
          </button>
        </form>

        {Object.keys(setsByExercise).length === 0 ? (
          <p className="text-steel text-center">No sets logged yet — add your first one above.</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(setsByExercise).map(([exerciseName, sets]) => (
              <div key={exerciseName} className="bg-charcoal rounded-xl p-4">
                <h2 className="text-chalk font-semibold mb-3">{exerciseName}</h2>
                <div className="space-y-2">
                  {sets.map((set) => (
                    <div key={set.id} className="flex justify-between items-center bg-char rounded-lg p-2.5 font-mono text-sm">
                      <span className="text-steel">Set {set.set_number}</span>
                      <span className="text-ember">{set.weight_kg}kg × {set.reps} reps</span>
                      <button
                        onClick={() => handleDeleteSet(set.id)}
                        className="text-steel hover:text-ember transition-colors font-body"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default LogWorkout
