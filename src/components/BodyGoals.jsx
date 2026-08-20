import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const ENGLISH_LANGUAGE_ID = 2


const BODY_GOALS = {
  bulk: {
    label: 'Bulk',
    description: 'Compound, high-load movements for building overall mass.',
    categories: ['Chest', 'Back', 'Legs', 'Shoulders'],
    color: 'bg-red-600',
    skills: ['Weighted Dips', 'Heavy Rows', 'Deep Push-Ups'],
  },
  athletic: {
    label: 'Athletic',
    description: 'Balanced full-body training for performance and conditioning.',
    categories: ['Cardio', 'Abs', 'Legs'],
    color: 'bg-blue-600',
    skills: ['Muscle-Up', 'Pistol Squat', 'Broad Jump'],
  },
  lean: {
    label: 'Lean',
    description: 'Higher-rep, cardio-leaning movements to support fat loss.',
    categories: ['Cardio', 'Abs'],
    color: 'bg-green-600',
    skills: ['High-Rep Circuits', 'Mountain Climbers', 'Burpees'],
  },
  muscular: {
    label: 'Muscular',
    description: 'Isolation-focused work for visible muscle definition.',
    categories: ['Arms', 'Chest', 'Back', 'Shoulders'],
    color: 'bg-purple-600',
    skills: ['Planche Progression', 'Front Lever', 'Archer Push-Ups'],
  },
}

function BodyGoals() {
  const [exercises, setExercises] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedGoal, setSelectedGoal] = useState('bulk')

  useEffect(() => {
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

  function getCuratedExercises() {
    const relevantCategories = BODY_GOALS[selectedGoal].categories
    return exercises.filter((exercise) =>
      relevantCategories.includes(exercise.category.name)
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-char flex items-center justify-center">
        <p className="text-chalk text-xl font-display tracking-wide animate-pulse">Loading exercises...</p>
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
              <div className="flex flex-wrap gap-1 mt-2">
                {goal.skills.map((skill) => (
                  <span key={skill} className="text-[10px] bg-black/20 px-2 py-0.5 rounded-full">
                    {skill}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>

        <p className="text-steel/60 text-xs mb-6 text-center">
          This mapping is based on general training-split principles (which
          exercise categories suit which goal), not a personalized AI
          recommendation.
        </p>

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
                    <div className="w-full h-48 bg-gradient-to-br from-charcoal-light to-char flex flex-col items-center justify-center gap-2">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 text-steel/40">
                        <path d="M2 12h2M4 8v8M6 6v12M8 10v4M16 10v4M18 6v12M20 8v8M22 12h-2" strokeLinecap="round" />
                      </svg>
                      <span className="text-steel/60 text-xs">No image available</span>
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
