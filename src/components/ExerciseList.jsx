import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const ENGLISH_LANGUAGE_ID = 2

function ExerciseList() {
  const [exercises, setExercises] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedMuscle, setSelectedMuscle] = useState('All')

  useEffect(() => {
    fetch('https://wger.de/api/v2/exerciseinfo/?language=2&limit=20')
      .then((response) => {
        if (!response.ok) {
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
  }, [])

  function getEnglishTranslation(exercise) {
    return exercise.translations.find(
      (translation) => translation.language === ENGLISH_LANGUAGE_ID
    )
  }

  function getUniqueCategories() {
    const names = exercises.map((exercise) => exercise.category.name)
    return ['All', ...new Set(names)].sort()
  }

  function getUniqueMuscles() {
    const allMuscleNames = exercises.flatMap((exercise) =>
      exercise.muscles.map((muscle) => muscle.name)
    )
    return ['All', ...new Set(allMuscleNames)].sort()
  }

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-char flex items-center justify-center">
        <p className="text-chalk text-xl font-display tracking-wide">Loading exercises...</p>
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

  return (
    <div className="min-h-screen bg-char p-8">
      <h1 className="font-display text-5xl tracking-wide text-chalk mb-2 text-center">
        EXERCISE LIBRARY
      </h1>
      <div className="ember-bar mx-auto mb-8"></div>

      {/* Filter controls */}
      <div className="flex flex-wrap gap-4 justify-center mb-8 max-w-6xl mx-auto">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-charcoal text-chalk px-4 py-2 rounded-lg border border-charcoal-light focus:outline-none focus:border-ember"
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
          className="bg-charcoal text-chalk px-4 py-2 rounded-lg border border-charcoal-light focus:outline-none focus:border-ember"
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
          if (!translation) return null

          const thumbnail =
            exercise.images[0]?.thumbnails?.medium ?? exercise.images[0]?.image

          return (
            <Link
              to={`/exercise/${exercise.id}`}
              key={exercise.id}
              className="bg-charcoal rounded-xl overflow-hidden shadow-lg hover:scale-105 transition-transform block border border-transparent hover:border-ember/30"
            >
              {thumbnail ? (
                <img
                  src={thumbnail}
                  alt={translation.name}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-charcoal-light flex items-center justify-center">
                  <span className="text-steel">No image</span>
                </div>
              )}

              <div className="p-4">
                <h2 className="text-xl font-semibold text-chalk mb-1">
                  {translation.name}
                </h2>
                <span className="inline-block bg-ember text-chalk text-xs px-2 py-1 rounded-full">
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
