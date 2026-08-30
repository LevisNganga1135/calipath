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
import LogWorkout from './components/LogWorkout'

// Points at the local Flask dev server for now — this becomes the deployed
// Render URL once the backend goes live (Day 7).
const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:5555/api'

const TOKEN_KEY = 'feelTheBurn.token' // the ONLY auth-related thing we keep in localStorage now

function App() {
  // myWorkout now comes from the backend, not localStorage — it's fetched
  // whenever we have a confirmed logged-in user (see the effect below).
  const [myWorkout, setMyWorkout] = useState([])

  // currentUser is null until we've confirmed a valid token with the backend
  const [currentUser, setCurrentUser] = useState(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // On first load, if a token exists, ask the backend "who am I?" via /auth/me.
  // This is how login survives a page refresh now — the token persists,
  // and we re-verify it's still valid rather than trusting stale local data.
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      setIsCheckingAuth(false)
      return
    }

    fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => {
        if (!response.ok) throw new Error('Invalid or expired token')
        return response.json()
      })
      .then((user) => {
        setCurrentUser(user)
        fetchRoutines(token)
      })
      .catch(() => {
        // Token is invalid/expired — clear it so we don't keep retrying
        localStorage.removeItem(TOKEN_KEY)
        setCurrentUser(null)
      })
      .finally(() => {
        setIsCheckingAuth(false)
      })
  }, [])

  function fetchRoutines(token) {
    fetch(`${API_BASE}/routines`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setMyWorkout(data))
      .catch(() => setMyWorkout([]))
  }

  async function addToWorkout(exercise) {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return // shouldn't happen — button is only shown to logged-in users

    // Guard against adding the same exercise twice
    const alreadyAdded = myWorkout.some((item) => item.exercise_id === exercise.id)
    if (alreadyAdded) return

    try {
      const response = await fetch(`${API_BASE}/routines`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          exercise_id: exercise.id,
          exercise_name: exercise.name,
          category: exercise.category,
          thumbnail: exercise.thumbnail,
        }),
      })
      if (!response.ok) return
      const newRoutine = await response.json()
      setMyWorkout((prev) => [...prev, newRoutine])
    } catch (err) {
      console.error('Failed to add routine:', err)
    }
  }

  async function removeFromWorkout(routineId) {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return

    try {
      const response = await fetch(`${API_BASE}/routines/${routineId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) return
      setMyWorkout((prev) => prev.filter((item) => item.id !== routineId))
    } catch (err) {
      console.error('Failed to remove routine:', err)
    }
  }

  // ----- Real auth functions -----

  async function handleSignup({ name, email, password }) {
    try {
      const response = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await response.json()

      if (!response.ok) {
        return { success: false, message: data.error || 'Signup failed' }
      }

      localStorage.setItem(TOKEN_KEY, data.token)
      setCurrentUser(data.user)
      fetchRoutines(data.token)
      return { success: true }
    } catch (err) {
      return { success: false, message: 'Network error — is the server running?' }
    }
  }

  async function handleLogin({ email, password }) {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await response.json()

      if (!response.ok) {
        return { success: false, message: data.error || 'Login failed' }
      }

      localStorage.setItem(TOKEN_KEY, data.token)
      setCurrentUser(data.user)
      fetchRoutines(data.token)
      return { success: true }
    } catch (err) {
      return { success: false, message: 'Network error — is the server running?' }
    }
  }

  function handleLogout() {
    localStorage.removeItem(TOKEN_KEY)
    setCurrentUser(null)
    setMyWorkout([])
  }

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

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden text-chalk text-2xl"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? '✕' : '☰'}
          </button>

          <div className="hidden lg:flex gap-6 items-center">
            <NavLink to="/exercises" className={navLinkClass}>Exercises</NavLink>
            <NavLink to="/my-workout" className={navLinkClass}>My Workout ({myWorkout.length})</NavLink>
            <NavLink to="/profile" className={navLinkClass}>Profile</NavLink>
            <NavLink to="/progress" className={navLinkClass}>Progress</NavLink>
            <NavLink to="/streak" className={navLinkClass}>🔥 Streak</NavLink>
            <NavLink to="/goals" className={navLinkClass}>Body Goals</NavLink>
            <NavLink to="/community" className={navLinkClass}>Community</NavLink>

            {isCheckingAuth ? null : currentUser ? (
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
            <MyWorkout
              myWorkout={myWorkout}
              removeFromWorkout={removeFromWorkout}
              currentUser={currentUser}
              onRequestLogin={() => setIsAuthModalOpen(true)}
            />

          }
        />
        
         <Route
          path="/log-workout"
          element={
            <LogWorkout
              myWorkout={myWorkout}
              currentUser={currentUser}
              onRequestLogin={() => setIsAuthModalOpen(true)}
            />
          }
        />
        <Route path="/profile" element={<Profile />} />
                <Route
          path="/progress"
          element={<Progress currentUser={currentUser} onRequestLogin={() => setIsAuthModalOpen(true)} />}
        />
        <Route path="/streak" element={<Streak />} />
        <Route path="/goals" element={<BodyGoals />} />
        <Route path="/community" element={<Community />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}

export default App
