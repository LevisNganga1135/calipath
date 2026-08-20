import { useState, useEffect } from 'react'

const STORAGE_KEY = 'feelTheBurn.profile'

// Activity level multipliers used in the Mifflin-St Jeor / TDEE formula.
// These are standard, widely-used estimates — not medical-grade, just a reasonable starting point.
const ACTIVITY_LEVELS = {
  sedentary: { label: 'Sedentary (little/no exercise)', multiplier: 1.2 },
  light: { label: 'Lightly active (1-3 days/week)', multiplier: 1.375 },
  moderate: { label: 'Moderately active (3-5 days/week)', multiplier: 1.55 },
  active: { label: 'Very active (6-7 days/week)', multiplier: 1.725 },
}

function Profile() {
  // Lazy-init from localStorage, same pattern as My Workout
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved
      ? JSON.parse(saved)
      : {
          unitSystem: 'metric', // 'metric' or 'imperial'
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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
  }, [profile])

  // Generic handler: works for any text/number/select input since we just
  // read the input's "name" attribute to know which field to update.
  function handleChange(e) {
    const { name, value } = e.target
    setProfile((prev) => ({ ...prev, [name]: value }))
  }

  // ----- Unit conversion helpers -----
  // The formula always needs metric internally, so we convert imperial inputs
  // at calculation time rather than storing two versions of "truth".

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

  // ----- Diet calculation -----
  // Mifflin-St Jeor equation: the standard formula for estimating
  // Basal Metabolic Rate (BMR), then scaled by activity level to get
  // Total Daily Energy Expenditure (TDEE) — a maintenance-calorie estimate.
  function calculateDietEstimate() {
    const age = Number(profile.age)
    const heightCm = getHeightInCm()
    const weightKg = getWeightInKg()

    // Guard: don't calculate on incomplete/invalid data
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
      // Rough, commonly-used offsets for cutting/bulking goals —
      // ~500 kcal deficit/surplus is a standard, moderate starting point
      cutting: maintenanceCalories - 500,
      bulking: maintenanceCalories + 500,
    }
  }

  const dietEstimate = calculateDietEstimate()

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Your Profile</h1>

        {/* Unit system toggle */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setProfile((prev) => ({ ...prev, unitSystem: 'metric' }))}
            className={`px-4 py-2 rounded-lg ${
              profile.unitSystem === 'metric'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-300'
            }`}
          >
            Metric (cm/kg)
          </button>
          <button
            onClick={() => setProfile((prev) => ({ ...prev, unitSystem: 'imperial' }))}
            className={`px-4 py-2 rounded-lg ${
              profile.unitSystem === 'imperial'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-300'
            }`}
          >
            Imperial (ft-in/lbs)
          </button>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 space-y-4">
          {/* Age */}
          <div>
            <label className="block text-slate-300 text-sm mb-1">Age</label>
            <input
              type="number"
              name="age"
              value={profile.age}
              onChange={handleChange}
              className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg"
              placeholder="e.g. 25"
            />
          </div>

          {/* Sex — needed for the BMR formula, which uses different constants */}
          <div>
            <label className="block text-slate-300 text-sm mb-1">Sex</label>
            <select
              name="sex"
              value={profile.sex}
              onChange={handleChange}
              className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          {/* Height — conditionally shows metric or imperial fields */}
          <div>
            <label className="block text-slate-300 text-sm mb-1">Height</label>
            {profile.unitSystem === 'metric' ? (
              <input
                type="number"
                name="heightCm"
                value={profile.heightCm}
                onChange={handleChange}
                className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg"
                placeholder="cm, e.g. 175"
              />
            ) : (
              <div className="flex gap-2">
                <input
                  type="number"
                  name="heightFt"
                  value={profile.heightFt}
                  onChange={handleChange}
                  className="w-1/2 bg-slate-700 text-white px-3 py-2 rounded-lg"
                  placeholder="feet"
                />
                <input
                  type="number"
                  name="heightIn"
                  value={profile.heightIn}
                  onChange={handleChange}
                  className="w-1/2 bg-slate-700 text-white px-3 py-2 rounded-lg"
                  placeholder="inches"
                />
              </div>
            )}
          </div>

          {/* Weight */}
          <div>
            <label className="block text-slate-300 text-sm mb-1">Weight</label>
            {profile.unitSystem === 'metric' ? (
              <input
                type="number"
                name="weightKg"
                value={profile.weightKg}
                onChange={handleChange}
                className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg"
                placeholder="kg, e.g. 70"
              />
            ) : (
              <input
                type="number"
                name="weightLbs"
                value={profile.weightLbs}
                onChange={handleChange}
                className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg"
                placeholder="lbs, e.g. 154"
              />
            )}
          </div>

          {/* Activity level */}
          <div>
            <label className="block text-slate-300 text-sm mb-1">Activity Level</label>
            <select
              name="activityLevel"
              value={profile.activityLevel}
              onChange={handleChange}
              className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg"
            >
              {Object.entries(ACTIVITY_LEVELS).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Diet estimate results — only shown once we have enough data to calculate */}
        {dietEstimate ? (
          <div className="bg-slate-800 rounded-xl p-6 mt-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Estimated Daily Calories
            </h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-slate-400 text-sm mb-1">Cutting</p>
                <p className="text-2xl font-bold text-red-400">
                  {dietEstimate.cutting}
                </p>
                <p className="text-slate-500 text-xs">kcal/day</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Maintenance</p>
                <p className="text-2xl font-bold text-blue-400">
                  {dietEstimate.maintenance}
                </p>
                <p className="text-slate-500 text-xs">kcal/day</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Bulking</p>
                <p className="text-2xl font-bold text-green-400">
                  {dietEstimate.bulking}
                </p>
                <p className="text-slate-500 text-xs">kcal/day</p>
              </div>
            </div>
            <p className="text-slate-500 text-xs mt-4">
              These are general estimates based on the Mifflin-St Jeor formula, not
              personalized medical advice. Consult a healthcare professional or
              registered dietitian for guidance specific to you.
            </p>
          </div>
        ) : (
          <p className="text-slate-400 text-sm mt-6 text-center">
            Fill in your age, height, and weight above to see your estimated daily
            calorie needs.
          </p>
        )}
      </div>
    </div>
  )
}

export default Profile
