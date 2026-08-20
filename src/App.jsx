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

const STORAGE_KEY = 'feelTheBurn.myWorkout'

function App() {
  const [myWorkout, setMyWorkout] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(myWorkout))
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
           <nav className="bg-charcoal px-6 py-4 flex gap-6 items-center flex-wrap border-b border-charcoal-light">
        <NavLink
          to="/"
          end
          className="font-display text-2xl tracking-wide text-chalk mr-2"
        >
          FEEL THE BURN
        </NavLink>
        <NavLink to="/exercises" className={navLinkClass}>
          Exercises
        </NavLink>
        <NavLink to="/my-workout" className={navLinkClass}>
          My Workout ({myWorkout.length})
        </NavLink>
        <NavLink to="/profile" className={navLinkClass}>
          Profile
        </NavLink>
        <NavLink to="/progress" className={navLinkClass}>
          Progress
        </NavLink>
        <NavLink to="/streak" className={navLinkClass}>
          🔥 Streak
        </NavLink>
        <NavLink to="/goals" className={navLinkClass}>
          Body Goals
        </NavLink>
      </nav>

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
      </Routes>
    </BrowserRouter>
  )
}

export default App
