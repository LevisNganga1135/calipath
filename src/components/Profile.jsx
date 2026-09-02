import { useState, useEffect } from 'react'

const STORAGE_KEY = 'feelTheBurn.profile'

const ACTIVITY_LEVELS = {
  sedentary: { label: 'Sedentary (little/no exercise)', multiplier: 1.2 },
  light: { label: 'Lightly active (1-3 days/week)', multiplier: 1.375 },
  moderate: { label: 'Moderately active (3-5 days/week)', multiplier: 1.55 },
  active: { label: 'Very active (6-7 days/week)', multiplier: 1.725 },
}

// currentUser is optional so this page still works for a signed-out visitor
// exploring the diet calculator — the header just falls back to a generic
// greeting when there's no logged-in user yet.
function Profile({ currentUser }) {
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved
      ? JSON.parse(saved)
      : {
          unitSystem: 'metric',
          age: '',
          sex: 'male',
          heightCm: '',
          heightFt: '',
          heightIn: '',
          weightKg: '',
          weightLbs: '',
          activityLevel: 'moderate',
        }
  })

  const [mealPlanGoal, setMealPlanGoal] = useState('maintenance')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
  }, [profile])

  function handleChange(e) {
    const { name, value } = e.target
    setProfile((prev) => ({ ...prev, [name]: value }))
  }

  function getHeightInCm() {
    if (profile.unitSystem === 'metric') {
      return Number(profile.heightCm)
    }
    const feet = Number(profile.heightFt) || 0
    const inches = Number(profile.heightIn) || 0
    const totalInches = feet * 12 + inches
    return totalInches * 2.54
  }

  function getWeightInKg() {
    if (profile.unitSystem === 'metric') {
      return Number(profile.weightKg)
    }
    return Number(profile.weightLbs) * 0.453592
  }

  function calculateDietEstimate() {
    const age = Number(profile.age)
    const heightCm = getHeightInCm()
    const weightKg = getWeightInKg()

    if (!age || !heightCm || !weightKg) return null

    const bmr =
      profile.sex === 'male'
        ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
        : 10 * weightKg + 6.25 * heightCm - 5 * age - 161

    const multiplier = ACTIVITY_LEVELS[profile.activityLevel].multiplier
    const maintenanceCalories = Math.round(bmr * multiplier)

    return {
      bmr: Math.round(bmr),
      maintenance: maintenanceCalories,
      cutting: maintenanceCalories - 500,
      bulking: maintenanceCalories + 500,
    }
  }

  function calculateMealPlan(calorieTarget, goal) {
    if (!calorieTarget) return null

    const macroSplits = {
      cutting: { protein: 0.4, carbs: 0.35, fat: 0.25 },
      maintenance: { protein: 0.3, carbs: 0.4, fat: 0.3 },
      bulking: { protein: 0.3, carbs: 0.45, fat: 0.25 },
    }
    const split = macroSplits[goal]

    const proteinGrams = Math.round((calorieTarget * split.protein) / 4)
    const carbGrams = Math.round((calorieTarget * split.carbs) / 4)
    const fatGrams = Math.round((calorieTarget * split.fat) / 9)

    const mealSlots = [
      { name: 'Breakfast', portion: 0.25, suggestion: 'Protein + complex carbs (e.g. eggs, oats, fruit)' },
      { name: 'Lunch', portion: 0.3, suggestion: 'Lean protein + whole grains + vegetables' },
      { name: 'Dinner', portion: 0.3, suggestion: 'Lean protein + healthy fats + vegetables' },
      { name: 'Snack', portion: 0.15, suggestion: 'Protein or healthy fat source (e.g. nuts, yogurt)' },
    ]

    const meals = mealSlots.map((slot) => ({
      name: slot.name,
      calories: Math.round(calorieTarget * slot.portion),
      suggestion: slot.suggestion,
    }))

    return {
      totalCalories: calorieTarget,
      macros: { protein: proteinGrams, carbs: carbGrams, fat: fatGrams },
      meals,
    }
  }

  const dietEstimate = calculateDietEstimate()
  const mealPlan = dietEstimate
    ? calculateMealPlan(dietEstimate[mealPlanGoal], mealPlanGoal)
    : null

  const initials = currentUser?.name
    ? currentUser.name
        .trim()
        .split(/\s+/)
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?'

  return (
    <div className="min-h-screen bg-char p-8">
      <div className="max-w-4xl mx-auto">
        {/* Profile header — avatar + the actual logged-in user's name/email.
            Falls back gracefully when signed out (currentUser is null). */}
        <div className="bg-charcoal rounded-xl p-6 mb-6 flex items-center gap-5">
          <div className="w-20 h-20 shrink-0 rounded-full bg-ember flex items-center justify-center">
            <span className="font-display text-3xl text-chalk tracking-wide">
              {initials}
            </span>
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-4xl tracking-wide text-chalk truncate">
              {currentUser?.name ?? 'YOUR PROFILE'}
            </h1>
            <p className="text-steel text-sm truncate">
              {currentUser?.email ?? 'Sign in to save your profile to your account.'}
            </p>
          </div>
        </div>

        {/* Two-column split keeps the form and the results visually
            separate instead of one long stacked page. */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column: personal info form */}
          <div>
            <h2 className="font-display text-2xl tracking-wide text-chalk mb-3">
              PERSONAL INFO
            </h2>
            <div className="ember-bar mb-4"></div>

            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setProfile((prev) => ({ ...prev, unitSystem: 'metric' }))}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  profile.unitSystem === 'metric'
                    ? 'bg-ember text-chalk'
                    : 'bg-charcoal text-steel'
                }`}
              >
                Metric (cm/kg)
              </button>
              <button
                onClick={() => setProfile((prev) => ({ ...prev, unitSystem: 'imperial' }))}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  profile.unitSystem === 'imperial'
                    ? 'bg-ember text-chalk'
                    : 'bg-charcoal text-steel'
                }`}
              >
                Imperial (ft-in/lbs)
              </button>
            </div>

            <div className="bg-charcoal rounded-xl p-6 space-y-4">
              <div>
                <label className="block text-steel text-sm mb-1">Age</label>
                <input
                  type="number"
                  name="age"
                  value={profile.age}
                  onChange={handleChange}
                  className="w-full bg-charcoal-light text-chalk px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-ember"
                  placeholder="e.g. 25"
                />
              </div>

              <div>
                <label className="block text-steel text-sm mb-1">Sex</label>
                <select
                  name="sex"
                  value={profile.sex}
                  onChange={handleChange}
                  className="w-full bg-charcoal-light text-chalk px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-ember"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-steel text-sm mb-1">Height</label>
                {profile.unitSystem === 'metric' ? (
                  <input
                    type="number"
                    name="heightCm"
                    value={profile.heightCm}
                    onChange={handleChange}
                    className="w-full bg-charcoal-light text-chalk px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-ember"
                    placeholder="cm, e.g. 175"
                  />
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      name="heightFt"
                      value={profile.heightFt}
                      onChange={handleChange}
                      className="w-1/2 bg-charcoal-light text-chalk px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-ember"
                      placeholder="feet"
                    />
                    <input
                      type="number"
                      name="heightIn"
                      value={profile.heightIn}
                      onChange={handleChange}
                      className="w-1/2 bg-charcoal-light text-chalk px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-ember"
                      placeholder="inches"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-steel text-sm mb-1">Weight</label>
                {profile.unitSystem === 'metric' ? (
                  <input
                    type="number"
                    name="weightKg"
                    value={profile.weightKg}
                    onChange={handleChange}
                    className="w-full bg-charcoal-light text-chalk px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-ember"
                    placeholder="kg, e.g. 70"
                  />
                ) : (
                  <input
                    type="number"
                    name="weightLbs"
                    value={profile.weightLbs}
                    onChange={handleChange}
                    className="w-full bg-charcoal-light text-chalk px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-ember"
                    placeholder="lbs, e.g. 154"
                  />
                )}
              </div>

              <div>
                <label className="block text-steel text-sm mb-1">Activity Level</label>
                <select
                  name="activityLevel"
                  value={profile.activityLevel}
                  onChange={handleChange}
                  className="w-full bg-charcoal-light text-chalk px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-ember"
                >
                  {Object.entries(ACTIVITY_LEVELS).map(([key, { label }]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {!dietEstimate && (
              <p className="text-steel text-sm mt-4 text-center lg:text-left">
                Fill in your age, height, and weight to see your estimated
                daily calorie needs.
              </p>
            )}
          </div>

          {/* Right column: calculated results — only appears once there's
              something to show, so the page doesn't open on a wall of
              empty cards. */}
          <div>
            {dietEstimate ? (
              <>
                <h2 className="font-display text-2xl tracking-wide text-chalk mb-3">
                  ESTIMATED DAILY CALORIES
                </h2>
                <div className="ember-bar mb-4"></div>

                <div className="bg-charcoal rounded-xl p-6">
                  <div className="grid grid-cols-3 gap-4 text-center font-mono">
                    <div>
                      <p className="text-steel text-sm mb-1 font-body">Cutting</p>
                      <p className="text-2xl font-bold text-ember">
                        {dietEstimate.cutting}
                      </p>
                      <p className="text-steel/60 text-xs font-body">kcal/day</p>
                    </div>
                    <div>
                      <p className="text-steel text-sm mb-1 font-body">Maintenance</p>
                      <p className="text-2xl font-bold text-chalk">
                        {dietEstimate.maintenance}
                      </p>
                      <p className="text-steel/60 text-xs font-body">kcal/day</p>
                    </div>
                    <div>
                      <p className="text-steel text-sm mb-1 font-body">Bulking</p>
                      <p className="text-2xl font-bold text-gold">
                        {dietEstimate.bulking}
                      </p>
                      <p className="text-steel/60 text-xs font-body">kcal/day</p>
                    </div>
                  </div>
                  <p className="text-steel/60 text-xs mt-4">
                    General estimates based on the Mifflin-St Jeor formula, not
                    personalized medical advice. Consult a healthcare
                    professional or registered dietitian for guidance specific
                    to you.
                  </p>
                </div>

                {mealPlan && (
                  <div className="bg-charcoal rounded-xl p-6 mt-6">
                    <h2 className="font-display text-2xl tracking-wide text-chalk mb-4">
                      SAMPLE MEAL PLAN
                    </h2>

                    <div className="flex gap-2 mb-4">
                      {['cutting', 'maintenance', 'bulking'].map((goal) => (
                        <button
                          key={goal}
                          onClick={() => setMealPlanGoal(goal)}
                          className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-colors ${
                            mealPlanGoal === goal
                              ? 'bg-ember text-chalk'
                              : 'bg-charcoal-light text-steel'
                          }`}
                        >
                          {goal}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center mb-6 bg-char rounded-lg p-4 font-mono">
                      <div>
                        <p className="text-steel text-xs mb-1 font-body">Protein</p>
                        <p className="text-lg font-bold text-ember">{mealPlan.macros.protein}g</p>
                      </div>
                      <div>
                        <p className="text-steel text-xs mb-1 font-body">Carbs</p>
                        <p className="text-lg font-bold text-gold">{mealPlan.macros.carbs}g</p>
                      </div>
                      <div>
                        <p className="text-steel text-xs mb-1 font-body">Fat</p>
                        <p className="text-lg font-bold text-chalk">{mealPlan.macros.fat}g</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {mealPlan.meals.map((meal) => (
                        <div key={meal.name} className="flex justify-between items-start bg-char rounded-lg p-3">
                          <div>
                            <p className="text-chalk font-medium">{meal.name}</p>
                            <p className="text-steel text-sm">{meal.suggestion}</p>
                          </div>
                          <p className="text-steel text-sm whitespace-nowrap ml-4 font-mono">
                            ~{meal.calories} kcal
                          </p>
                        </div>
                      ))}
                    </div>

                    <p className="text-steel/60 text-xs mt-4">
                      General food-category suggestions, not specific recipes.
                      This is a starting structure, not a prescribed diet plan.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-charcoal rounded-xl p-6 h-full flex items-center justify-center text-center">
                <p className="text-steel/60 text-sm">
                  Your estimated calories and sample meal plan will show up
                  here once your info is filled in.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
