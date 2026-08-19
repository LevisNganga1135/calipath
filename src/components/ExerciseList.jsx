import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

// English language ID in the wger API — we filter translations to this manually,
// since the API's language param doesn't actually restrict the translations array.
const ENGLISH_LANGUAGE_ID = 2

function ExerciseList() {
  // Three pieces of state the rubric requires us to handle explicitly:
  const [exercises, setExercises] = useState([])   // the data itself
  const [isLoading, setIsLoading] = useState(true)  // are we still waiting on the fetch?
  const [error, setError] = useState(null)          // did something go wrong?
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedMuscle, setSelectedMuscle] = useState('All') // State for selected filters muscle and category

  useEffect(() => {
    fetch('https://wger.de/api/v2/exerciseinfo/?language=2&limit=20')
      .then((response) => {
        if (!response.ok) {
          // fetch() only rejects on network failure, not on HTTP errors like 404/500
          // so we have to check response.ok ourselves and throw manually
          throw new Error(`API responded with status ${response.status}`)
        }
        return response.json()
      })
      .then((data) => {
        setExercises(data.results)
        setIsLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setIsLoading(false)
      })
  }, []) // run once on mount

  // Helper: pull the English translation out of an exercise's translations array.
  // Some exercises may not have an English translation at all, so this can return undefined —
  // every place we use it has to handle that.
  function getEnglishTranslation(exercise) {
    return exercise.translations.find(
      (translation) => translation.language === ENGLISH_LANGUAGE_ID
    )
  }
    // Build a de-duplicated, sorted list of category names from the fetched exercises.
  // We derive this from the data itself instead of hardcoding categories,
  // so the filter always matches what's actually available.
  function getUniqueCategories() {
    const names = exercises.map((exercise) => exercise.category.name)
    return ['All', ...new Set(names)].sort()
  }

  // Same idea for muscles, but each exercise can have MULTIPLE muscles (primary array),
  // so we flatten all of them into one list before de-duplicating.
  function getUniqueMuscles() {
    const allMuscleNames = exercises.flatMap((exercise) =>
      exercise.muscles.map((muscle) => muscle.name)
    )
    return ['All', ...new Set(allMuscleNames)].sort()
  }

  // The actual filtering logic: an exercise passes through if it matches
  // BOTH the selected category AND the selected muscle (when not set to "All").
  function getFilteredExercises() {
    return exercises.filter((exercise) => {
      const matchesCategory =
        selectedCategory === 'All' || exercise.category.name === selectedCategory

      const matchesMuscle =
        selectedMuscle === 'All' ||
        exercise.muscles.some((muscle) => muscle.name === selectedMuscle)

      return matchesCategory && matchesMuscle
    })
  }

  // ----- Render logic: handle each state explicitly -----

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-white text-xl">Loading exercises...</p>
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

  return (
    <div className="min-h-screen bg-slate-900 p-8">
            <h1 className="text-4xl font-bold text-white mb-8 text-center">
        Feel The Burn — Exercise Library
      </h1>
      {/* Filter controls */}
      <div className="flex flex-wrap gap-4 justify-center mb-8 max-w-6xl mx-auto">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-600 focus:outline-none focus:border-blue-500"
        >
          {getUniqueCategories().map((category) => (
            <option key={category} value={category}>
              {category === 'All' ? 'All Categories' : category}
            </option>
          ))}
        </select>

        <select
          value={selectedMuscle}
          onChange={(e) => setSelectedMuscle(e.target.value)}
          className="bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-600 focus:outline-none focus:border-blue-500"
        >
          {getUniqueMuscles().map((muscle) => (
            <option key={muscle} value={muscle}>
              {muscle === 'All' ? 'All Muscles' : muscle}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {getFilteredExercises().map((exercise) => {
          const translation = getEnglishTranslation(exercise)

          // Skip rendering a card if there's no English name to show —
          // keeps the UI from displaying blank/broken cards
          if (!translation) return null

          // Some exercises have no images at all — fall back gracefully
          const thumbnail = exercise.images[0]?.thumbnails?.medium

          return (
                       <Link
              to={`/exercise/${exercise.id}`}
              key={exercise.id}
              className="bg-slate-800 rounded-xl overflow-hidden shadow-lg hover:scale-105 transition-transform block"
            >
              {thumbnail ? (
                <img
                  src={thumbnail}
                  alt={translation.name}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-slate-700 flex items-center justify-center">
                  <span className="text-slate-400">No image</span>
                </div>
              )}

              <div className="p-4">
                <h2 className="text-xl font-semibold text-white mb-1">
                  {translation.name}
                </h2>
                <span className="inline-block bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                  {exercise.category.name}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default ExerciseList
