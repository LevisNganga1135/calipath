import { useState, useEffect } from 'react'

const STORAGE_KEY = 'feelTheBurn.trainedDates'

// Formats a Date object as YYYY-MM-DD in LOCAL time (not UTC), so "today"
// always matches what the user's calendar actually shows them, regardless of timezone.
function formatDateLocal(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function Streak() {
  // Array of date strings like ["2026-08-18", "2026-08-19", ...]
  const [trainedDates, setTrainedDates] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trainedDates))
  }, [trainedDates])

  const today = formatDateLocal(new Date())
  const isTodayLogged = trainedDates.includes(today)

  function markTodayTrained() {
    if (isTodayLogged) return // guard against double-adding
    setTrainedDates((prev) => [...prev, today].sort())
  }

  function unmarkToday() {
    setTrainedDates((prev) => prev.filter((date) => date !== today))
  }

  // ----- Streak calculation -----
  // Walks backward day-by-day from today. As soon as we hit a day that's
  // NOT in trainedDates, the current streak is broken and we stop counting.
  function calculateCurrentStreak() {
    let streak = 0
    let cursor = new Date() // start from today and step backward

    while (true) {
      const dateStr = formatDateLocal(cursor)
      if (trainedDates.includes(dateStr)) {
        streak++
        cursor.setDate(cursor.getDate() - 1) // move one day earlier
      } else {
        break
      }
    }

    return streak
  }

  // Longest streak ever achieved, scanning the full sorted history —
  // finds the longest run of consecutive calendar dates in trainedDates.
  function calculateLongestStreak() {
    if (trainedDates.length === 0) return 0

    const sortedDates = [...trainedDates].sort()
    let longest = 1
    let current = 1

    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1])
      const currDate = new Date(sortedDates[i])
      const dayDiff = (currDate - prevDate) / (1000 * 60 * 60 * 24)

      if (dayDiff === 1) {
        current++
        longest = Math.max(longest, current)
      } else if (dayDiff > 1) {
        current = 1 // streak broken, reset
      }
      // dayDiff === 0 shouldn't happen since dates are unique, but harmless if it does
    }

    return longest
  }

  const currentStreak = calculateCurrentStreak()
  const longestStreak = calculateLongestStreak()

  // Last 7 days, for a simple visual calendar strip (oldest to newest, left to right)
  function getLast7Days() {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      days.push(formatDateLocal(d))
    }
    return days
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Streak Monitor</h1>

        {/* Streak stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-800 rounded-xl p-6 text-center">
            <p className="text-slate-400 text-sm mb-1">Current Streak</p>
            <p className="text-4xl font-bold text-orange-400">{currentStreak}</p>
            <p className="text-slate-500 text-xs mt-1">
              {currentStreak === 1 ? 'day' : 'days'}
            </p>
          </div>
          <div className="bg-slate-800 rounded-xl p-6 text-center">
            <p className="text-slate-400 text-sm mb-1">Longest Streak</p>
            <p className="text-4xl font-bold text-blue-400">{longestStreak}</p>
            <p className="text-slate-500 text-xs mt-1">
              {longestStreak === 1 ? 'day' : 'days'}
            </p>
          </div>
        </div>

        {/* Today's action button */}
        <div className="bg-slate-800 rounded-xl p-6 mb-6 text-center">
          {isTodayLogged ? (
            <>
              <p className="text-green-400 font-medium mb-3">
                ✓ You've trained today — keep it up!
              </p>
              <button
                onClick={unmarkToday}
                className="text-slate-400 hover:text-slate-300 text-sm underline"
              >
                Undo
              </button>
            </>
          ) : (
            <button
              onClick={markTodayTrained}
              className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-lg font-medium"
            >
              Mark Today as Trained
            </button>
          )}
        </div>

        {/* Last 7 days visual strip */}
        <div className="bg-slate-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Last 7 Days</h2>
          <div className="flex justify-between gap-2">
            {getLast7Days().map((dateStr) => {
              const trained = trainedDates.includes(dateStr)
              const dayLabel = new Date(dateStr).toLocaleDateString('en-US', {
                weekday: 'short',
              })
              return (
                <div key={dateStr} className="flex flex-col items-center gap-1">
                  <span className="text-slate-500 text-xs">{dayLabel}</span>
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm ${
                      trained
                        ? 'bg-orange-500 text-white'
                        : 'bg-slate-700 text-slate-500'
                    }`}
                  >
                    {trained ? '✓' : ''}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Streak
