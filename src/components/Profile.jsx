import { useState, useEffect, useRef } from 'react'
import { startRegistration } from '@simplewebauthn/browser'

const STORAGE_KEY = 'feelTheBurn.profile'
const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:5555/api'
const TOKEN_KEY = 'feelTheBurn.token'

const ACTIVITY_LEVELS = {
  sedentary: { label: 'Sedentary (little/no exercise)', multiplier: 1.2 },
  light: { label: 'Lightly active (1-3 days/week)', multiplier: 1.375 },
  moderate: { label: 'Moderately active (3-5 days/week)', multiplier: 1.55 },
  active: { label: 'Very active (6-7 days/week)', multiplier: 1.725 },
}

// currentUser is optional so this page still works for a signed-out visitor
// exploring the diet calculator. onUpdateUser lets this page push a fresh
// user object back up to App.jsx after a name/avatar change, so the rest of
// the app (e.g. the Sidebar greeting) stays in sync without a page reload.
function Profile({ currentUser, onUpdateUser }) {
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

  const [isEditingName, setIsEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(currentUser?.name ?? '')
  const [isSavingName, setIsSavingName] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [profileError, setProfileError] = useState('')
  const fileInputRef = useRef(null)
  const [passkeys, setPasskeys] = useState([])
  const [isLoadingPasskeys, setIsLoadingPasskeys] = useState(false)
  const [isAddingPasskey, setIsAddingPasskey] = useState(false)
  const [passkeyError, setPasskeyError] = useState('')


  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
  }, [profile])

  useEffect(() => {
    setNameInput(currentUser?.name ?? '')
  }, [currentUser?.name])

  useEffect(() => {
    if (currentUser) fetchPasskeys()
  }, [currentUser?.id])

  function fetchPasskeys() {
    const token = localStorage.getItem(TOKEN_KEY)
    setIsLoadingPasskeys(true)
    fetch(`${API_BASE}/auth/passkey`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setPasskeys(data))
      .catch(() => setPasskeys([]))
      .finally(() => setIsLoadingPasskeys(false))
  }

  async function handleAddPasskey() {
    const token = localStorage.getItem(TOKEN_KEY)
    setIsAddingPasskey(true)
    setPasskeyError('')

    try {
      // Step 1: ask the backend for registration options + a signed challenge
      const beginRes = await fetch(`${API_BASE}/auth/passkey/register/begin`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const beginData = await beginRes.json()
      if (!beginRes.ok) throw new Error(beginData.error || 'Could not start passkey registration')

      // Step 2: prompt the browser's passkey UI (Face ID, Windows Hello, etc.)
      const credential = await startRegistration(beginData.options)

      // Step 3: send the result back to verify and save it
      const deviceName =
        window.navigator.userAgentData?.platform || window.navigator.platform || 'This device'
      const completeRes = await fetch(`${API_BASE}/auth/passkey/register/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ credential, token: beginData.token, device_name: deviceName }),
      })
      const completeData = await completeRes.json()
      if (!completeRes.ok) throw new Error(completeData.error || 'Could not save passkey')

      setPasskeys((prev) => [...prev, completeData])
    } catch (err) {
      // Browser throws this if the user cancels the prompt — not a real error
      if (err.name !== 'NotAllowedError') {
        setPasskeyError(err.message || 'Failed to add passkey')
      }
    } finally {
      setIsAddingPasskey(false)
    }
  }

  async function handleDeletePasskey(passkeyId) {
    const token = localStorage.getItem(TOKEN_KEY)
    try {
      const res = await fetch(`${API_BASE}/auth/passkey/${passkeyId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      setPasskeys((prev) => prev.filter((pk) => pk.id !== passkeyId))
    } catch (err) {
      console.error('Failed to delete passkey:', err)
    }
  }

  function handleChange(e) {
    const { name, value } = e.target
    setProfile((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSaveName() {
    const trimmed = nameInput.trim()
    if (!trimmed || trimmed === currentUser?.name) {
      setIsEditingName(false)
      return
    }

    const token = localStorage.getItem(TOKEN_KEY)
    setIsSavingName(true)
    setProfileError('')

    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: trimmed }),
      })
      const data = await response.json()

      if (!response.ok) {
        setProfileError(data.error || 'Failed to update name')
        return
      }

      onUpdateUser?.(data)
      setIsEditingName(false)
    } catch (err) {
      setProfileError('Network error — is the server running?')
    } finally {
      setIsSavingName(false)
    }
  }

  async function handleAvatarSelected(e) {
    const file = e.target.files[0]
    if (!file) return

    const token = localStorage.getItem(TOKEN_KEY)
    const formData = new FormData()
    formData.append('avatar', file)

    setIsUploadingAvatar(true)
    setProfileError('')

    try {
      const response = await fetch(`${API_BASE}/auth/me/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const data = await response.json()

      if (!response.ok) {
        setProfileError(data.error || 'Failed to upload photo')
        return
      }

      onUpdateUser?.(data)
    } catch (err) {
      setProfileError('Network error — is the server running?')
    } finally {
      setIsUploadingAvatar(false)
      e.target.value = '' // allow re-selecting the same file later
    }
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
        {/* Profile header — clickable avatar (upload) + editable name */}
        <div className="bg-charcoal rounded-xl p-6 mb-6 flex items-center gap-5">
          <button
            type="button"
            onClick={() => currentUser && fileInputRef.current?.click()}
            disabled={!currentUser || isUploadingAvatar}
            className="relative w-20 h-20 shrink-0 rounded-full overflow-hidden group disabled:cursor-default"
            title={currentUser ? 'Change photo' : undefined}
          >
            {currentUser?.avatar_url ? (
              <img
                src={currentUser.avatar_url}
                alt={currentUser.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-ember flex items-center justify-center">
                <span className="font-display text-3xl text-chalk tracking-wide">
                  {initials}
                </span>
              </div>
            )}

            {currentUser && (
              <div
                className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity ${
                  isUploadingAvatar ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
              >
                <span className="text-chalk text-xs font-medium">
                  {isUploadingAvatar ? 'Uploading...' : 'Change'}
                </span>
              </div>
            )}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarSelected}
            className="hidden"
          />

          <div className="min-w-0 flex-1">
            {isEditingName ? (
              <div className="flex items-center gap-2 mb-1">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  autoFocus
                  className="font-display text-2xl tracking-wide text-chalk bg-charcoal-light px-3 py-1 rounded-lg focus:outline-none focus:ring-1 focus:ring-ember min-w-0"
                />
                <button
                  onClick={handleSaveName}
                  disabled={isSavingName}
                  className="bg-ember hover:bg-ember-dark text-chalk px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
                >
                  {isSavingName ? '...' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setNameInput(currentUser?.name ?? '')
                    setIsEditingName(false)
                    setProfileError('')
                  }}
                  className="text-steel hover:text-chalk text-sm"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-1">
                <h1 className="font-display text-4xl tracking-wide text-chalk truncate">
                  {currentUser?.name ?? 'YOUR PROFILE'}
                </h1>
                {currentUser && (
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="text-steel hover:text-ember text-sm shrink-0"
                    title="Edit name"
                  >
                    ✎
                  </button>
                )}
              </div>
            )}

            <p className="text-steel text-sm truncate">
              {currentUser?.email ?? 'Sign in to save your profile to your account.'}
            </p>

            {profileError && (
              <p className="text-ember text-xs mt-1">{profileError}</p>
            )}
          </div>
        </div>

        {currentUser && (
          <div className="bg-charcoal rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-display text-2xl tracking-wide text-chalk">
                PASSKEYS
              </h2>
              <button
                onClick={handleAddPasskey}
                disabled={isAddingPasskey}
                className="bg-ember hover:bg-ember-dark text-chalk px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
              >
                {isAddingPasskey ? 'Adding...' : '+ Add a Passkey'}
              </button>
            </div>
            <p className="text-steel text-xs mb-4">
              Sign in with Face ID, Windows Hello, or your device's fingerprint sensor instead of a password.
            </p>

            {passkeyError && <p className="text-ember text-xs mb-3">{passkeyError}</p>}

            {isLoadingPasskeys ? (
              <p className="text-steel text-sm">Loading...</p>
            ) : passkeys.length === 0 ? (
              <p className="text-steel/60 text-sm">No passkeys added yet.</p>
            ) : (
              <div className="space-y-2">
                {passkeys.map((pk) => (
                  <div key={pk.id} className="flex items-center justify-between bg-char rounded-lg p-3">
                    <div>
                      <p className="text-chalk text-sm">{pk.device_name || 'Unnamed device'}</p>
                      <p className="text-steel/60 text-xs">
                        Added {new Date(pk.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeletePasskey(pk.id)}
                      className="text-steel hover:text-ember text-sm transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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

          {/* Right column: calculated results */}
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
