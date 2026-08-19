import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ExerciseList from './components/ExerciseList'
import ExerciseDetail from './components/ExerciseDetail'

function App() {
  return (
    // BrowserRouter enables URL-based navigation for everything inside it
    <BrowserRouter>
      <Routes>
        {/* The homepage: shows the full exercise list */}
        <Route path="/" element={<ExerciseList />} />

        {/* :id is a URL parameter — e.g. /exercise/1962 — ExerciseDetail
            will read this value to know which exercise to fetch and show */}
        <Route path="/exercise/:id" element={<ExerciseDetail />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
