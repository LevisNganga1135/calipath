import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import ExerciseList from './components/ExerciseList'
import ExerciseDetail from './components/ExerciseDetail'
import MyWorkout from './components/MyWorkout'
import Profile from './components/Profile'
import Progress from './components/Progress'

// A single, namespaced key for localStorage — prefixing with the app name
// avoids collisions if this browser ever stores data for other local apps too
const STORAGE_KEY = 'feelTheBurn.myWorkout'

function App() {
  // Lazy initializer: this function only runs ONCE, on the very first render,
  // instead of on every re-render — important since reading localStorage
  // is a side-effect-ish operation we don't want repeating unnecessarily.
  const [myWorkout, setMyWorkout] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  })

  // Whenever myWorkout changes (add or remove), write the updated list
  // back to localStorage so it survives a page refresh.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(myWorkout))
  }, [myWorkout])

  function addToWorkout(exercise) {
    setMyWorkout((prev) => {
      // Guard against adding the same exercise twice
      const alreadyAdded = prev.some((item) => item.id === exercise.id)
      if (alreadyAdded) return prev
      return [...prev, exercise]
    })
  }

  function removeFromWorkout(exerciseId) {
    setMyWorkout((prev) => prev.filter((item) => item.id !== exerciseId))
  }

  return (
    <BrowserRouter>
      <nav className="bg-slate-800 px-6 py-4 flex gap-6 items-center">
        <Link to="/" className="text-white font-bold text-lg">
          Feel The Burn
        </Link>
        <Link to="/" className="text-slate-300 hover:text-white">
          Exercises
        </Link>
        <Link to="/my-workout" className="text-slate-300 hover:text-white">
          My Workout ({myWorkout.length})
        </Link>
        <Link to="/profile" className="text-slate-300 hover:text-white">
          Profile
        </Link>
                <Link to="/progress" className="text-slate-300 hover:text-white">
          Progress
        </Link>
      </nav>

      <Routes>
        <Route path="/" element={<ExerciseList />} />
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
      </Routes>
    </BrowserRouter>
  )
}

export default App
