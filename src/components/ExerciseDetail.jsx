import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'

const ENGLISH_LANGUAGE_ID = 2

function ExerciseDetail({ myWorkout, addToWorkout }) {
  // useParams reads the dynamic part of the URL — the ":id" we defined in App.jsx.
  // If the URL is /exercise/1962, then id === "1962" (always a string, even though it's a number).
  const { id } = useParams()

  const [exercise, setExercise] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Fetch just this ONE exercise by id, rather than re-fetching the whole list.
    // wger's exerciseinfo endpoint supports fetching by id directly: /exerciseinfo/{id}/
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
  }, [id]) // re-run this fetch if the id in the URL ever changes

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-white text-xl">Loading exercise...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-red-400 text-xl">Something went wrong: {error}</p>
      </div>
    )
  }

  // Everything below this point can safely assume `exercise` is a real object,
  // since the loading/error checks above already returned early otherwise.

  const translation = exercise.translations.find(
    (t) => t.language === ENGLISH_LANGUAGE_ID
  )

    // wger sometimes returns thumbnails: null even when a full-size image exists,
  // so we fall back to the full image if the medium thumbnail isn't available
  const thumbnail = exercise.images[0]?.thumbnails?.medium ?? exercise.images[0]?.image
  
  const isAlreadyAdded = myWorkout.some((item) => item.id === exercise.id)

  // We only store the small subset of fields MyWorkout actually needs to display —
  // no need to save the entire API response (full translations, license info, etc.)
  function handleAddToWorkout() {
    addToWorkout({
      id: exercise.id,
      name: translation?.name ?? 'Unnamed Exercise',
      category: exercise.category.name,
      thumbnail: thumbnail ?? null,
    })
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-3xl mx-auto">
        {/* Link back to the list — this is a client-side navigation,
            no full page reload like a normal <a> tag would cause */}
        <Link to="/" className="text-blue-400 hover:underline mb-6 inline-block">
          ← Back to all exercises
        </Link>

        {thumbnail ? (
          <img
            src={thumbnail}
            alt={translation?.name}
            className="w-full max-h-96 object-contain bg-slate-800 rounded-xl mb-6"
          />
        ) : (
          <div className="w-full h-64 bg-slate-800 rounded-xl flex items-center justify-center mb-6">
            <span className="text-slate-400">No image available</span>
          </div>
        )}

        <h1 className="text-3xl font-bold text-white mb-2">
          {translation ? translation.name : 'Unnamed Exercise'}
        </h1>

        <span className="inline-block bg-blue-600 text-white text-sm px-3 py-1 rounded-full mb-4">
          {exercise.category.name}
        </span>

        <div className="mb-4">
          <button
            onClick={handleAddToWorkout}
            disabled={isAlreadyAdded}
            className={`px-4 py-2 rounded-lg text-white font-medium ${
              isAlreadyAdded
                ? 'bg-slate-600 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-500'
            }`}
          >
            {isAlreadyAdded ? '✓ Added to My Workout' : '+ Add to My Workout'}
          </button>
        </div>

        {/* Description comes as HTML from the API (it can include <p>, <ol>, etc.)
            dangerouslySetInnerHTML renders that HTML directly — safe here because
            wger is a trusted source we control the fetch to, not user-submitted content */}
        {translation?.description && (
          <div
            className="text-slate-300 mb-6 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: translation.description }}
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h2 className="text-white font-semibold mb-2">Primary Muscles</h2>
            <ul className="text-slate-300 text-sm space-y-1">
              {exercise.muscles.length > 0 ? (
                exercise.muscles.map((m) => <li key={m.id}>{m.name}</li>)
              ) : (
                <li className="text-slate-500">Not specified</li>
              )}
            </ul>
          </div>

          <div>
            <h2 className="text-white font-semibold mb-2">Equipment</h2>
            <ul className="text-slate-300 text-sm space-y-1">
              {exercise.equipment.length > 0 ? (
                exercise.equipment.map((eq) => <li key={eq.id}>{eq.name}</li>)
              ) : (
                <li className="text-slate-500">None required</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExerciseDetail
