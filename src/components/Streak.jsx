import { useState, useEffect } from 'react'
import confetti from 'canvas-confetti'
import flexLogo from '../assets/flex-logo.svg'

const STORAGE_KEY = 'feelTheBurn.trainedDates'

function formatDateLocal(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function Streak() {
  const [trainedDates, setTrainedDates] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  })

  // Controls whether the celebratory flex animation is currently showing.
  // Set true on a successful "mark today" action, then auto-cleared after
  // the animation finishes playing (see the setTimeout in markTodayTrained).
  const [showFlex, setShowFlex] = useState(false)
  const [calendarDate, setCalendarDate] = useState(new Date())

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trainedDates))
  }, [trainedDates])

  const today = formatDateLocal(new Date())
  const isTodayLogged = trainedDates.includes(today)

  function markTodayTrained() {
  if (isTodayLogged) return
  setTrainedDates((prev) => [...prev, today].sort())
  

  confetti({
    particleCount: 120,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#ff5a1f', '#ffd23f', '#f5f3ef'],
  })


  // Celebration sound — fire-and-forget; if the browser blocks autoplay
  // audio (rare here since it's triggered by a real user click) this
  // fails silently rather than throwing.
  const cheerSound = new Audio('/sounds/streak-cheer.mp3')
  cheerSound.play().catch(() => {})

  // Trigger the flex logo pop-up animation, then hide it again once the
  // CSS animation (1.8s) has finished playing.
  setShowFlex(true)
  setTimeout(() => setShowFlex(false), 1800)
}

  function unmarkToday() {
    setTrainedDates((prev) => prev.filter((date) => date !== today))
  }

  function calculateCurrentStreak() {
    let streak = 0
    let cursor = new Date()

    while (true) {
      const dateStr = formatDateLocal(cursor)
      if (trainedDates.includes(dateStr)) {
        streak++
        cursor.setDate(cursor.getDate() - 1)
      } else {
        break
      }
    }

    return streak
  }

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
        current = 1
      }
    }

    return longest
  }

  const currentStreak = calculateCurrentStreak()
  const longestStreak = calculateLongestStreak()

  function getLast7Days() {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      days.push(formatDateLocal(d))
      
    }
    return days
  }
    // Returns all days in a given month as an array of date strings (or null
  // for empty leading/trailing grid cells), laid out Sunday-first like
  // a standard calendar grid.
  function getMonthGrid(year, month) {
    const firstDay = new Date(year, month, 1)
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const startWeekday = firstDay.getDay() // 0 = Sunday

    const days = []
    for (let i = 0; i < startWeekday; i++) days.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      days.push(dateStr)
    }
    return days
  }

  return (
    <div className="min-h-screen bg-char p-8">
      {/* Celebration overlay — only rendered while showFlex is true.
          pointer-events: none (set in CSS) so it never blocks clicks underneath. */}
      {showFlex && (
        <img
          src={flexLogo}
          alt="Flexing logo"
          className="flex-pop"
        />
      )}

      <div className="max-w-2xl mx-auto">
        <h1 className="font-display text-5xl tracking-wide text-chalk mb-2">
          STREAK MONITOR
        </h1>
        <div className="ember-bar mb-6"></div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-charcoal rounded-xl p-6 text-center">
            <p className="text-steel text-sm mb-1">Current Streak</p>
            <p className="text-5xl font-bold text-ember font-mono">{currentStreak}</p>
            <p className="text-steel/60 text-xs mt-1">
              {currentStreak === 1 ? 'day' : 'days'}
            </p>
          </div>
          <div className="bg-charcoal rounded-xl p-6 text-center">
            <p className="text-steel text-sm mb-1">Longest Streak</p>
            <p className="text-5xl font-bold text-gold font-mono">{longestStreak}</p>
            <p className="text-steel/60 text-xs mt-1">
              {longestStreak === 1 ? 'day' : 'days'}
            </p>
          </div>
        </div>
          
        {trainedDates.length === 0 && (
          <div className="bg-charcoal rounded-xl p-6 mb-6 text-center">
            <p className="text-steel">No training days logged yet.</p>
            <p className="text-steel/60 text-sm mt-1">Mark today as trained to start your streak.</p>
          </div>
        )}
        <div className="bg-charcoal rounded-xl p-6 mb-6 text-center">
          {isTodayLogged ? (
            <>
              <p className="text-gold font-medium mb-3">
                ✓ You've trained today — keep it up!
              </p>
              <button
                onClick={unmarkToday}
                className="text-steel hover:text-chalk text-sm underline transition-colors"
              >
                Undo
              </button>
            </>
          ) : (
            <button
              onClick={markTodayTrained}
              className="bg-ember hover:bg-ember-dark text-chalk px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Mark Today as Trained
            </button>
          )}
        </div>
        
        <div className="bg-charcoal rounded-xl p-6">
          <h2 className="font-display text-2xl tracking-wide text-chalk mb-4">
            LAST 7 DAYS
          </h2>
          <div className="flex justify-between gap-2">
            {getLast7Days().map((dateStr) => {
              const trained = trainedDates.includes(dateStr)
              const dayLabel = new Date(dateStr).toLocaleDateString('en-US', {
                weekday: 'short',
              })
              return (
                <div key={dateStr} className="flex flex-col items-center gap-1">
                  <span className="text-steel/60 text-xs">{dayLabel}</span>
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm transition-colors ${
                      trained
                        ? 'bg-ember text-chalk'
                        : 'bg-charcoal-light text-steel/40'
                    }`}
                  >
                    {trained ? '✓' : ''}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-charcoal rounded-xl p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}
              className="text-steel hover:text-chalk transition-colors px-2"
            >
              ←
            </button>
            <h2 className="font-display text-2xl tracking-wide text-chalk">
              {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()}
            </h2>
            <button
              onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}
              className="text-steel hover:text-chalk transition-colors px-2"
            >
              →
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1.5 mb-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <span key={i} className="text-steel/50 text-xs text-center">{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {getMonthGrid(calendarDate.getFullYear(), calendarDate.getMonth()).map((dateStr, i) => {
              if (!dateStr) return <div key={`empty-${i}`} />
              const trained = trainedDates.includes(dateStr)
              const isToday = dateStr === today
              return (
                <div
                  key={dateStr}
                  title={dateStr}
                  className={`aspect-square rounded flex items-center justify-center text-[10px] font-mono ${
                    trained
                      ? 'bg-ember text-chalk'
                      : 'bg-charcoal-light text-steel/40'
                  } ${isToday ? 'ring-1 ring-gold' : ''}`}
                >
                  {Number(dateStr.split('-')[2])}
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
