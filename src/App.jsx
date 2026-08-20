import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Home from './components/Home'
import ExerciseList from './components/ExerciseList'
import ExerciseDetail from './components/ExerciseDetail'
import MyWorkout from './components/MyWorkout'
import Profile from './components/Profile'
import Progress from './components/Progress'
import Streak from './components/Streak'
import BodyGoals from './components/BodyGoals'
import Footer from './components/Footer'
import Community from './components/Community'
import AuthModal from './components/AuthModal'

const WORKOUT_STORAGE_KEY = 'feelTheBurn.myWorkout'
const USERS_STORAGE_KEY = 'feelTheBurn.users' // MOCK user "database" — Phase 2/3 replaces this
const CURRENT_USER_KEY = 'feelTheBurn.currentUserEmail'

function App() {
  const [myWorkout, setMyWorkout] = useState(() => {
    const saved = localStorage.getItem(WORKOUT_STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  })

  // currentUser is either null (logged out) or { name, email }
  const [currentUser, setCurrentUser] = useState(() => {
    const savedEmail = localStorage.getItem(CURRENT_USER_KEY)
    if (!savedEmail) return null
    const users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]')
    const user = users.find((u) => u.email === savedEmail)
    return user ? { name: user.name, email: user.email } : null
  })

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem(WORKOUT_STORAGE_KEY, JSON.stringify(myWorkout))
  }, [myWorkout])

  function addToWorkout(exercise) {
    setMyWorkout((prev) => {
      const alreadyAdded = prev.some((item) => item.id === exercise.id)
      if (alreadyAdded) return prev
      return [...prev, exercise]
    })
  }

  function removeFromWorkout(exerciseId) {
    setMyWorkout((prev) => prev.filter((item) => item.id !== exerciseId))
  }

  // ----- MOCK AUTH functions -----
  // These read/write a plain-text "users" array in localStorage. This is NOT
  // secure and is only meant to establish the UI flow. In Phase 2/3, these
  // functions get replaced with real fetch() calls to a Flask backend that
  // hashes passwords and returns a proper session/JWT token.

  function handleSignup({ name, email, password }) {
    const users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]')

    if (users.some((u) => u.email === email)) {
      return { success: false, message: 'An account with this email already exists.' }
    }

    const newUser = { name, email, password }
    const updatedUsers = [...users, newUser]
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers))
    localStorage.setItem(CURRENT_USER_KEY, email)
    setCurrentUser({ name, email })

    return { success: true }
  }

  function handleLogin({ email, password }) {
    const users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]')
    const user = users.find((u) => u.email === email && u.password === password)

    if (!user) {
      return { success: false, message: 'Incorrect email or password.' }
    }

    localStorage.setItem(CURRENT_USER_KEY, user.email)
    setCurrentUser({ name: user.name, email: user.email })

    return { success: true }
  }

  function handleLogout() {
    localStorage.removeItem(CURRENT_USER_KEY)
    setCurrentUser(null)
  }

  // NavLink calls this function automatically with { isActive } for each link,
  // letting us style the currently active page differently from the rest —
  // this is the built-in React Router way to do "active nav" highlighting.
  function navLinkClass({ isActive }) {
    return isActive
      ? 'text-chalk font-semibold border-b-2 border-ember pb-1'
      : 'text-steel hover:text-chalk pb-1 transition-colors'
  }

  return (
    <BrowserRouter>
      <nav className="bg-charcoal px-6 py-4 border-b border-charcoal-light">
        <div className="flex items-center justify-between">
          <NavLink to="/" end className="font-display text-2xl tracking-wide text-chalk">
            FEEL THE BURN
          </NavLink>

          {/* Hamburger toggle — only visible below lg breakpoint */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden text-chalk text-2xl"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? '✕' : '☰'}
          </button>

          {/* Full nav — hidden on small screens, shown as flex row on lg+ */}
          <div className="hidden lg:flex gap-6 items-center">
            <NavLink to="/exercises" className={navLinkClass}>Exercises</NavLink>
            <NavLink to="/my-workout" className={navLinkClass}>My Workout ({myWorkout.length})</NavLink>
            <NavLink to="/profile" className={navLinkClass}>Profile</NavLink>
            <NavLink to="/progress" className={navLinkClass}>Progress</NavLink>
            <NavLink to="/streak" className={navLinkClass}>🔥 Streak</NavLink>
            <NavLink to="/goals" className={navLinkClass}>Body Goals</NavLink>
            <NavLink to="/community" className={navLinkClass}>Community</NavLink>
            {currentUser ? (
              <>
                <span className="text-steel text-sm">Hi, {currentUser.name}</span>
                <button onClick={handleLogout} className="text-steel hover:text-ember text-sm transition-colors">
                  Log Out
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-ember hover:bg-ember-dark text-chalk px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                Log In
              </button>
            )}
          </div>
        </div>

        {/* Mobile dropdown menu — only rendered when open, only visible below lg */}
        {isMenuOpen && (
          <div className="lg:hidden flex flex-col gap-4 mt-4 pb-2">
            <NavLink to="/exercises" className={navLinkClass} onClick={() => setIsMenuOpen(false)}>Exercises</NavLink>
            <NavLink to="/my-workout" className={navLinkClass} onClick={() => setIsMenuOpen(false)}>My Workout ({myWorkout.length})</NavLink>
            <NavLink to="/profile" className={navLinkClass} onClick={() => setIsMenuOpen(false)}>Profile</NavLink>
            <NavLink to="/progress" className={navLinkClass} onClick={() => setIsMenuOpen(false)}>Progress</NavLink>
            <NavLink to="/streak" className={navLinkClass} onClick={() => setIsMenuOpen(false)}>🔥 Streak</NavLink>
            <NavLink to="/goals" className={navLinkClass} onClick={() => setIsMenuOpen(false)}>Body Goals</NavLink>
            <NavLink to="/community" className={navLinkClass} onClick={() => setIsMenuOpen(false)}>Community</NavLink>
            {currentUser ? (
              <>
                <span className="text-steel text-sm">Hi, {currentUser.name}</span>
                <button onClick={() => { handleLogout(); setIsMenuOpen(false) }} className="text-steel hover:text-ember text-sm text-left">
                  Log Out
                </button>
              </>
            ) : (
              <button
                onClick={() => { setIsAuthModalOpen(true); setIsMenuOpen(false) }}
                className="bg-ember text-chalk px-4 py-1.5 rounded-lg text-sm font-medium w-fit"
              >
                Log In
              </button>
            )}
          </div>
        )}
      </nav>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={handleLogin}
        onSignup={handleSignup}
      />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/exercises" element={<ExerciseList />} />
        <Route
          path="/exercise/:id"
          element={
            <ExerciseDetail myWorkout={myWorkout} addToWorkout={addToWorkout} />
          }
        />
        <Route
          path="/my-workout"
          element={
            <MyWorkout myWorkout={myWorkout} removeFromWorkout={removeFromWorkout} />
          }
        />
        <Route path="/profile" element={<Profile />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/streak" element={<Streak />} />
        <Route path="/goals" element={<BodyGoals />} />
        <Route path="/community" element={<Community />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}

export default App
