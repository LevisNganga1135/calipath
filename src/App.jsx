import { useEffect } from 'react'

function App() {
  useEffect(() => {
    // useEffect runs this code once, after the component first renders.
    // We use it here because fetching data is a "side effect" —
    // it happens outside of React's normal render flow.
    fetch('https://wger.de/api/v2/exercise/?language=2&limit=5')
      .then((response) => response.json()) // convert the raw response into usable JSON
      .then((data) => {
        console.log(data) // log it so we can see the shape of the data in DevTools
      })
      .catch((error) => {
        console.error('Fetch failed:', error)
      })
  }, []) // empty array = run this effect only once, when the component mounts

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <h1 className="text-4xl font-bold text-white">
        Check your console for API data
      </h1>
    </div>
  )
}

export default App
