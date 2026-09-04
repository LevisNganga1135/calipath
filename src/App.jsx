import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './components/Home'
import ExerciseList from './components/ExerciseList'
import ExerciseDetail from './components/ExerciseDetail'
import MyWorkout from './components/MyWorkout'
import LogWorkout from './components/LogWorkout'
import Profile from './components/Profile'
import Progress from './components/Progress'
import Streak from './components/Streak'
import BodyGoals from './components/BodyGoals'
import Footer from './components/Footer'
import Community from './components/Community'
import AuthModal from './components/AuthModal'
import Sidebar from './components/Sidebar'
import CoachChat from './components/CoachChat'

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
    if (!token) return


   
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
  
  
  // Called by AuthModal once a passkey sign-in completes successfully.
  // completeData shape matches handleLogin/handleSignup's success case:
  // { token, user }.
  function handleAuthSuccess({ token, user }) {
    localStorage.setItem(TOKEN_KEY, token)
    setCurrentUser(user)
    fetchRoutines(token)
  }


  return (
    <BrowserRouter>
      <Sidebar
        myWorkout={myWorkout}
        currentUser={currentUser}
        isCheckingAuth={isCheckingAuth}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        onRequestLogin={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={handleLogin}
        onSignup={handleSignup}
        onAuthSuccess={handleAuthSuccess} 
      />

    <CoachChat />

    

      {/* lg:pl-64 pushes all page content right of the sidebar on desktop.
          Home.jsx cancels this specifically for its hero video so the video
          can bleed full-width behind the translucent sidebar. */}
      <main className="lg:pl-64">
        <Routes>
         <Route
  path="/"
  element={<Home currentUser={currentUser} onRequestLogin={() => setIsAuthModalOpen(true)} />}
/>
          <Route path="/exercises" element={<ExerciseList />} />
          <Route
            path="/exercise/:id"
            element={<ExerciseDetail myWorkout={myWorkout} addToWorkout={addToWorkout} />}
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
          <Route
  path="/profile"
  element={<Profile currentUser={currentUser} onUpdateUser={setCurrentUser} />}
/>
          <Route
            path="/progress"
            element={<Progress currentUser={currentUser} onRequestLogin={() => setIsAuthModalOpen(true)} />}
          />
          <Route path="/streak" element={<Streak />} />
          <Route path="/goals" element={<BodyGoals />} />
                    <Route
            path="/community"
            element={<Community currentUser={currentUser} onRequestLogin={() => setIsAuthModalOpen(true)} />}
          />
        </Routes>
        <Footer />
      </main>
    </BrowserRouter>
  )
}

export default App
