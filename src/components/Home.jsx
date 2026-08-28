import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

// Separate from Profile.sex (which drives BMR/calorie math) — this is purely
// a lightweight, anonymous landing-page preference so we can personalize
// the hero video before anyone logs in or fills out a profile.
const GENDER_PREF_KEY = 'feelTheBurn.landingPref' // 'male' | 'female' | null

function Home() {
  // Read streak data directly for a quick "welcome back" stat — same storage
  // key/logic as Streak.jsx. Duplicated here since it's a tiny read-only calc;
  // Phase 2/3 would fetch this from a real API instead.
  function getCurrentStreak() {
    const saved = localStorage.getItem('feelTheBurn.trainedDates')
    const trainedDates = saved ? JSON.parse(saved) : []
    let streak = 0
    let cursor = new Date()
    while (true) {
      const y = cursor.getFullYear()
      const m = String(cursor.getMonth() + 1).padStart(2, '0')
      const d = String(cursor.getDate()).padStart(2, '0')
      const dateStr = `${y}-${m}-${d}`
      if (trainedDates.includes(dateStr)) {
        streak++
        cursor.setDate(cursor.getDate() - 1)
      } else break
    }
    return streak
  }

  const savedWorkout = localStorage.getItem('feelTheBurn.myWorkout')
  const workoutCount = savedWorkout ? JSON.parse(savedWorkout).length : 0
  const currentStreak = getCurrentStreak()

  // Landing-page gender preference — null until the visitor picks one (or skips).
  const [genderPref, setGenderPref] = useState(() =>
    localStorage.getItem(GENDER_PREF_KEY)
  )

  // Whether to show the one-time toggle prompt. Only shown if no preference
  // (including "skip") has been recorded yet.
  const [showPrefPrompt, setShowPrefPrompt] = useState(
    () => localStorage.getItem(GENDER_PREF_KEY) === null
  )

  function handleSelectPref(pref) {
    // pref is 'male', 'female', or null (skip). We store even "skip" as an
    // empty string so we can distinguish "explicitly skipped" from "never asked"
    // — otherwise the prompt would keep reappearing on every visit.
    localStorage.setItem(GENDER_PREF_KEY, pref ?? '')
    setGenderPref(pref)
    setShowPrefPrompt(false)
  }

  // Video selection:
  // - 'male'   -> the original hero video
  // - 'female' -> the female-personalized video
  // - anything else (unset, or explicitly skipped) -> the neutral default video
  const heroVideoSrc =
    genderPref === 'male'
      ? '/videos/hero-workout.mp4'
      : genderPref === 'female'
      ? '/videos/hero-workout-female.mp4'
      : '/videos/hero-workout-default.mp4'

  const features = [
    {
      to: '/exercises',
      title: 'Exercise Library',
      description: 'Browse and filter bodyweight exercises by category and muscle.',
    },
    {
      to: '/goals',
      title: 'Body Goals',
      description: 'Curated exercise sets for Bulk, Athletic, Lean, or Muscular goals.',
    },
    {
      to: '/profile',
      title: 'Profile & Diet',
      description: 'Get an estimated daily calorie target and a sample meal plan.',
    },
    {
      to: '/progress',
      title: 'Progress Tracker',
      description: 'Log your weight and measurements, and see your trend over time.',
    },
    {
      to: '/streak',
      title: 'Streak Monitor',
      description: 'Track consecutive training days to stay motivated.',
    },
    {
      to: '/my-workout',
      title: 'My Workout',
      description: 'Build and save your own custom workout from the exercise library.',
    },
  ]

  return (
    <div className="min-h-screen bg-char">
      {/* Hero section — background video with a dark overlay so text stays readable */}
      <div className="relative px-8 py-24 text-center border-b border-charcoal-light overflow-hidden">
        <video
          key={heroVideoSrc}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-90 brightness-125 contrast-110"
>
          <source src={heroVideoSrc} type="video/mp4" />
        </video>
        {/* Dark gradient overlay — lighter than before so the video reads more clearly,
            but still strong enough at the bottom to keep the headline/button legible */}
        <div className="absolute inset-0 bg-gradient-to-b from-char/40 via-char/50 to-char"></div>

        <div className="relative z-10">
          <h1 className="font-display text-7xl sm:text-8xl tracking-wide text-chalk mb-4">
            FEEL THE BURN
          </h1>
          <div className="ember-bar mx-auto mb-6"></div>
          <p className="text-steel text-lg max-w-xl mx-auto mb-8">
            Your all-in-one calisthenics companion — browse exercises, plan your diet,
            track your progress, and build a training streak.
          </p>

          {/* One-time landing-page personalization prompt. Independent of
              Profile.sex — this only affects which hero video is shown,
              nothing account- or medical-data-related. */}
          {showPrefPrompt && (
            <div className="flex flex-wrap gap-3 justify-center mb-8">
              <span className="text-steel text-sm w-full mb-1">
                Personalize your experience:
              </span>
              <button
                onClick={() => handleSelectPref('male')}
                className="bg-charcoal hover:bg-charcoal-light text-chalk px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Male
              </button>
              <button
                onClick={() => handleSelectPref('female')}
                className="bg-charcoal hover:bg-charcoal-light text-chalk px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Female
              </button>
              <button
                onClick={() => handleSelectPref(null)}
                className="text-steel hover:text-chalk text-sm underline transition-colors"
              >
                Skip
              </button>
            </div>
          )}

          <Link
            to="/exercises"
            className="inline-block bg-ember hover:bg-ember-dark text-chalk px-8 py-3 rounded-lg font-semibold text-lg transition-colors"
          >
            Browse Exercises
          </Link>

          {(currentStreak > 0 || workoutCount > 0) && (
            <div className="flex gap-6 justify-center mt-8 font-mono">
              <div className="text-center">
                <p className="text-2xl font-bold text-ember">{currentStreak}</p>
                <p className="text-steel text-xs">day streak</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gold">{workoutCount}</p>
                <p className="text-steel text-xs">exercises saved</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Feature grid */}
      <div className="max-w-5xl mx-auto px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Link
              key={feature.to}
              to={feature.to}
              className="bg-charcoal rounded-xl p-6 hover:bg-charcoal-light transition-colors block border border-transparent hover:border-ember/30"
            >
              <div className="ember-bar mb-4"></div>
              <h2 className="text-chalk font-semibold text-lg mb-2">
                {feature.title}
              </h2>
              <p className="text-steel text-sm">{feature.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Home
