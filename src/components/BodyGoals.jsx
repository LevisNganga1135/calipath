import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const ENGLISH_LANGUAGE_ID = 2

// Our own curated mapping from a body-type goal to relevant wger categories.
// This is a training-principle-based mapping we define ourselves — wger's API
// has no native "goal" concept, so we're building this logic on top of its
// existing category data rather than fabricating per-exercise goal tags.
const BODY_GOALS = {
  bulk: {
    label: 'Bulk',
    description: 'Compound, high-load movements for building overall mass.',
    categories: ['Chest', 'Back', 'Legs', 'Shoulders'],
  },
  athletic: {
    label: 'Athletic',
    description: 'Balanced full-body training for performance and conditioning.',
    categories: ['Cardio', 'Abs', 'Legs'],
  },
  lean: {
    label: 'Lean',
    description: 'Higher-rep, cardio-leaning movements to support fat loss.',
    categories: ['Cardio', 'Abs'],
  },
  muscular: {
    label: 'Muscular',
    description: 'Isolation-focused work for visible muscle definition.',
    categories: ['Arms', 'Chest', 'Back', 'Shoulders'],
  },
}

function BodyGoals() {
  const [exercises, setExercises] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedGoal, setSelectedGoal] = useState('bulk')

  useEffect(() => {
    // Pull a larger batch than the main list view since we're filtering down
    // to a subset per goal — more source data means a better-populated result
    fetch('https://wger.de/api/v2/exerciseinfo/?language=2&limit=60')
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

  // Filters the full exercise list down to just the categories relevant
  // to the currently selected body-type goal
  function getCuratedExercises() {
    const relevantCategories = BODY_GOALS[selectedGoal].categories
    return exercises.filter((exercise) =>
      relevantCategories.includes(exercise.category.name)
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-char flex items-center justify-center">
        <p className="text-chalk text-xl">Loading exercises...</p>
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

  const curatedExercises = getCuratedExercises()

  return (
    <div className="min-h-screen bg-char p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="font-display text-5xl tracking-wide text-chalk mb-2 text-center">
          TRAIN FOR YOUR GOAL
        </h1>
        <div className="ember-bar mb-6 mx-auto"></div>
        <p className="text-steel text-center mb-8">
          Curated exercise sets based on common training-split principles.
        </p>

        {/* Goal selector cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {Object.entries(BODY_GOALS).map(([key, goal]) => (
            <button
              key={key}
              onClick={() => setSelectedGoal(key)}
              className={`rounded-xl p-4 text-left transition-colors ${
                selectedGoal === key
                  ? 'bg-ember text-chalk'
                  : 'bg-charcoal text-steel hover:bg-charcoal-light'
              }`}
            >
              <p className="font-display text-lg tracking-wide mb-1">{goal.label}</p>
              <p className="text-xs opacity-90">{goal.description}</p>
            </button>
          ))}
        </div>

        <p className="text-steel/60 text-xs mb-6 text-center">
          This mapping is based on general training-split principles (which
          exercise categories suit which goal), not a personalized AI
          recommendation.
        </p>

        {/* Curated exercise grid */}
        {curatedExercises.length === 0 ? (
          <p className="text-steel text-center">
            No exercises found for this goal in the current data set.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {curatedExercises.map((exercise) => {
              const translation = getEnglishTranslation(exercise)
              if (!translation) return null

              const thumbnail =
                exercise.images[0]?.thumbnails?.medium ?? exercise.images[0]?.image

              return (
                <Link
                  to={`/exercise/${exercise.id}`}
                  key={exercise.id}
                  className="bg-charcoal rounded-xl overflow-hidden shadow-lg hover:scale-105 transition-transform block"
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
                    <span className="inline-block bg-gold text-char text-xs px-2 py-1 rounded-full font-medium">
                      {exercise.category.name}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default BodyGoals
