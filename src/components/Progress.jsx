import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const PROGRESS_STORAGE_KEY = 'feelTheBurn.progressLogs'
const PROFILE_STORAGE_KEY = 'feelTheBurn.profile' // read-only here, owned by Profile.jsx

// Roughly 7,700 kcal ≈ 1 kg of body weight — a widely-used, well-established
// approximation (not exact science, but the standard rough conversion used
// across fitness apps and nutrition guidance).
const KCAL_PER_KG = 7700
const DAILY_CALORIE_OFFSET = 500 // matches the +/-500 kcal used in Profile.jsx's diet estimate

function Progress() {
  // Each entry: { id, date, weightKg, measurementCm }
  const [logs, setLogs] = useState(() => {
    const saved = localStorage.getItem(PROGRESS_STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  })

  const [form, setForm] = useState({
    date: '',
    weightKg: '',
    measurementCm: '',
  })

  // Which goal to project against — independent of whatever is currently
  // selected on the Profile page, since someone might want to compare
  // logged reality against a specific goal regardless of their current setting.
  const [projectionGoal, setProjectionGoal] = useState('maintenance')

  useEffect(() => {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(logs))
  }, [logs])

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault() // stop the browser's default full-page-reload form submit

    // Require at least a date and one of the two measurements
    if (!form.date || (!form.weightKg && !form.measurementCm)) return

    const newLog = {
      id: crypto.randomUUID(), // built-in browser API for generating unique IDs
      date: form.date,
      weightKg: form.weightKg ? Number(form.weightKg) : null,
      measurementCm: form.measurementCm ? Number(form.measurementCm) : null,
    }

    setLogs((prev) => {
      // Keep entries sorted chronologically so the graph always draws left-to-right correctly,
      // regardless of the order entries were added in
      const updated = [...prev, newLog]
      return updated.sort((a, b) => new Date(a.date) - new Date(b.date))
    })

    // Reset the form after a successful add
    setForm({ date: '', weightKg: '', measurementCm: '' })
  }

  function handleDelete(id) {
    setLogs((prev) => prev.filter((log) => log.id !== id))
  }

  // ----- Projection math -----
  // Builds a straight-line projection of expected weight over time, based on
  // the calorie surplus/deficit implied by the selected goal. This is real,
  // well-established math (calories -> weight change), NOT a prediction based
  // on which exercises were logged — we're explicit about that limitation in the UI.
  function getDailyRateKgPerDay(goal) {
    if (goal === 'cutting') return -DAILY_CALORIE_OFFSET / KCAL_PER_KG
    if (goal === 'bulking') return DAILY_CALORIE_OFFSET / KCAL_PER_KG
    return 0 // maintenance: no expected change
  }

  // Merges actual logged data with a computed "projectedWeightKg" value per point,
  // so a single Recharts <LineChart> can plot both lines against the same date axis.
  function getChartData() {
    const weightLogs = logs.filter((log) => log.weightKg !== null)
    if (weightLogs.length === 0) return logs // no weight data at all — nothing to project from

    const startWeight = weightLogs[0].weightKg
    const startDate = new Date(weightLogs[0].date)
    const dailyRate = getDailyRateKgPerDay(projectionGoal)

    return logs.map((log) => {
      const daysSinceStart = (new Date(log.date) - startDate) / (1000 * 60 * 60 * 24)
      const projectedWeightKg = Math.round(
        (startWeight + dailyRate * daysSinceStart) * 10
      ) / 10 // round to 1 decimal place

      return { ...log, projectedWeightKg }
    })
  }

  const hasWeightData = logs.some((log) => log.weightKg !== null)
  const chartData = getChartData()

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Progress Tracker</h1>

        {/* Entry form */}
        <form
          onSubmit={handleSubmit}
          className="bg-slate-800 rounded-xl p-6 mb-6 grid grid-cols-1 sm:grid-cols-4 gap-4 items-end"
        >
          <div>
            <label className="block text-slate-300 text-sm mb-1">Date</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-slate-300 text-sm mb-1">Weight (kg)</label>
            <input
              type="number"
              name="weightKg"
              value={form.weightKg}
              onChange={handleChange}
              className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg"
              placeholder="e.g. 70"
            />
          </div>
          <div>
            <label className="block text-slate-300 text-sm mb-1">
              Measurement (cm)
            </label>
            <input
              type="number"
              name="measurementCm"
              value={form.measurementCm}
              onChange={handleChange}
              className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg"
              placeholder="e.g. waist, 80"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium"
          >
            Add Entry
          </button>
        </form>

        {/* Goal selector for the projection line — only meaningful once we have weight data */}
        {hasWeightData && (
          <div className="bg-slate-800 rounded-xl p-4 mb-6 flex items-center gap-4">
            <span className="text-slate-300 text-sm">Project against goal:</span>
            <div className="flex gap-2">
              {['cutting', 'maintenance', 'bulking'].map((goal) => (
                <button
                  key={goal}
                  onClick={() => setProjectionGoal(goal)}
                  className={`px-3 py-1.5 rounded-lg text-sm capitalize ${
                    projectionGoal === goal
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {goal}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chart — only render once we have at least 2 points, otherwise a line chart looks empty/broken */}
        {logs.length >= 2 ? (
          <div className="bg-slate-800 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="weightKg"
                  name="Actual Weight (kg)"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="measurementCm"
                  name="Measurement (cm)"
                  stroke="#22c55e"
                  strokeWidth={2}
                  connectNulls
                />
                {hasWeightData && (
                  <Line
                    type="monotone"
                    dataKey="projectedWeightKg"
                    name={`Projected (${projectionGoal})`}
                    stroke="#f97316"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
            {hasWeightData && (
              <p className="text-slate-500 text-xs mt-4">
                The projected line is a rough estimate based on the calorie
                surplus/deficit for your selected goal (using the standard ~7,700
                kcal ≈ 1kg approximation). It is not based on which exercises you've
                logged — actual results depend on many individual factors.
              </p>
            )}
          </div>
        ) : (
          <p className="text-slate-400 text-sm mb-6 text-center">
            Add at least 2 entries to see your progress graph.
          </p>
        )}

        {/* Raw entries list */}
        {logs.length > 0 && (
          <div className="bg-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Entries</h2>
            <div className="space-y-2">
              {/* Show most recent first in the list, even though the chart data stays chronological */}
              {[...logs].reverse().map((log) => (
                <div
                  key={log.id}
                  className="flex justify-between items-center bg-slate-900 rounded-lg p-3"
                >
                  <div className="flex gap-6">
                    <span className="text-white">{log.date}</span>
                    {log.weightKg && (
                      <span className="text-blue-400">{log.weightKg} kg</span>
                    )}
                    {log.measurementCm && (
                      <span className="text-green-400">{log.measurementCm} cm</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(log.id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Progress
