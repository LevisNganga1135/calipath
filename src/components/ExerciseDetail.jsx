import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'

const ENGLISH_LANGUAGE_ID = 2

function ExerciseDetail({ myWorkout, addToWorkout }) {
  const { id } = useParams()

  const [exercise, setExercise] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`https://wger.de/api/v2/exerciseinfo/${id}/`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`API responded with status ${response.status}`)
        }
        return response.json()
      })
      .then((data) => {
        setExercise(data)
        setIsLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setIsLoading(false)
      })
  }, [id])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-char flex items-center justify-center">
        <p className="text-chalk text-xl font-display tracking-wide">Loading exercise...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-char flex items-center justify-center">
        <p className="text-ember text-xl">Something went wrong: {error}</p>
      </div>
    )
  }

  const translation = exercise.translations.find(
    (t) => t.language === ENGLISH_LANGUAGE_ID
  )

  const thumbnail = exercise.images[0]?.thumbnails?.medium ?? exercise.images[0]?.image

  const isAlreadyAdded = myWorkout.some((item) => item.id === exercise.id)

  function handleAddToWorkout() {
    addToWorkout({
      id: exercise.id,
      name: translation?.name ?? 'Unnamed Exercise',
      category: exercise.category.name,
      thumbnail: thumbnail ?? null,
    })
  }

  return (
    <div className="min-h-screen bg-char p-8">
      <div className="max-w-3xl mx-auto">
        <Link to="/exercises" className="text-ember hover:underline mb-6 inline-block">
          ← Back to all exercises
        </Link>

        {thumbnail ? (
          <img
            src={thumbnail}
            alt={translation?.name}
            className="w-full max-h-96 object-contain bg-charcoal rounded-xl mb-6"
          />
        ) : (
          <div className="w-full h-64 bg-charcoal rounded-xl flex items-center justify-center mb-6">
            <span className="text-steel">No image available</span>
          </div>
        )}

        <h1 className="font-display text-4xl tracking-wide text-chalk mb-2">
          {translation ? translation.name.toUpperCase() : 'UNNAMED EXERCISE'}
        </h1>

        <span className="inline-block bg-ember text-chalk text-sm px-3 py-1 rounded-full mb-4">
          {exercise.category.name}
        </span>

        <div className="mb-4">
          <button
            onClick={handleAddToWorkout}
            disabled={isAlreadyAdded}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isAlreadyAdded
                ? 'bg-charcoal-light text-steel cursor-not-allowed'
                : 'bg-gold text-char hover:bg-gold/90'
            }`}
          >
            {isAlreadyAdded ? '✓ Added to My Workout' : '+ Add to My Workout'}
          </button>
        </div>

        {translation?.description && (
          <div
            className="text-steel mb-6 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: translation.description }}
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h2 className="text-chalk font-semibold mb-2">Primary Muscles</h2>
            <ul className="text-steel text-sm space-y-1">
              {exercise.muscles.length > 0 ? (
                exercise.muscles.map((m) => <li key={m.id}>{m.name}</li>)
              ) : (
                <li className="text-steel/60">Not specified</li>
              )}
            </ul>
          </div>

          <div>
            <h2 className="text-chalk font-semibold mb-2">Equipment</h2>
            <ul className="text-steel text-sm space-y-1">
              {exercise.equipment.length > 0 ? (
                exercise.equipment.map((eq) => <li key={eq.id}>{eq.name}</li>)
              ) : (
                <li className="text-steel/60">None required</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExerciseDetail
