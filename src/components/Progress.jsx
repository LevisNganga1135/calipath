import { useState, useEffect } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:5555/api'
const TOKEN_KEY = 'feelTheBurn.token'

const KCAL_PER_KG = 7700
const DAILY_CALORIE_OFFSET = 500

function Progress({ currentUser, onRequestLogin }) {
  const [logs, setLogs] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const [form, setForm] = useState({
    date: '',
    weightKg: '',
    measurementCm: '',
  })

  const [projectionGoal, setProjectionGoal] = useState('maintenance')

  // Tracks which log entry (by id) is currently being edited, if any.
  // Null means no entry is in edit mode.
  const [editingLogId, setEditingLogId] = useState(null)
  const [editForm, setEditForm] = useState({
    date: '',
    weightKg: '',
    measurementCm: '',
  })

  // Fetch logs from the backend once we know a user is logged in
  useEffect(() => {
    if (!currentUser) {
      setIsLoading(false)
      return
    }

    const token = localStorage.getItem(TOKEN_KEY)
    fetch(`${API_BASE}/workout-logs`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setLogs(data))
      .catch(() => setLogs([]))
      .finally(() => setIsLoading(false))
  }, [currentUser])

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!form.date || (!form.weightKg && !form.measurementCm)) return

    const token = localStorage.getItem(TOKEN_KEY)

    try {
      const response = await fetch(`${API_BASE}/workout-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: form.date,
          weight_kg: form.weightKg ? Number(form.weightKg) : null,
          measurement_cm: form.measurementCm ? Number(form.measurementCm) : null,
        }),
      })

      if (!response.ok) return
      const newLog = await response.json()

      setLogs((prev) => {
        const updated = [...prev, newLog]
        return updated.sort((a, b) => new Date(a.date) - new Date(b.date))
      })

      setForm({ date: '', weightKg: '', measurementCm: '' })
    } catch (err) {
      console.error('Failed to add log:', err)
    }
  }

  async function handleDelete(id) {
    const token = localStorage.getItem(TOKEN_KEY)
    try {
      const response = await fetch(`${API_BASE}/workout-logs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) return
      setLogs((prev) => prev.filter((log) => log.id !== id))
    } catch (err) {
      console.error('Failed to delete log:', err)
    }
  }

  // Enter edit mode for a specific log — pre-fills the edit form with its
  // current values so the user is editing from the existing state, not blank fields.
  function startEditing(log) {
    setEditingLogId(log.id)
    setEditForm({
      date: log.date,
      weightKg: log.weight_kg ?? '',
      measurementCm: log.measurement_cm ?? '',
    })
  }

  function cancelEditing() {
    setEditingLogId(null)
    setEditForm({ date: '', weightKg: '', measurementCm: '' })
  }

  function handleEditChange(e) {
    const { name, value } = e.target
    setEditForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleUpdate(id) {
    if (!editForm.date || (!editForm.weightKg && !editForm.measurementCm)) return

    const token = localStorage.getItem(TOKEN_KEY)

    try {
      const response = await fetch(`${API_BASE}/workout-logs/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: editForm.date,
          weight_kg: editForm.weightKg ? Number(editForm.weightKg) : null,
          measurement_cm: editForm.measurementCm ? Number(editForm.measurementCm) : null,
        }),
      })

      if (!response.ok) return
      const updatedLog = await response.json()

      setLogs((prev) => {
        const updated = prev.map((log) => (log.id === id ? updatedLog : log))
        return updated.sort((a, b) => new Date(a.date) - new Date(b.date))
      })

      cancelEditing()
    } catch (err) {
      console.error('Failed to update log:', err)
    }
  }

  function getDailyRateKgPerDay(goal) {
    if (goal === 'cutting') return -DAILY_CALORIE_OFFSET / KCAL_PER_KG
    if (goal === 'bulking') return DAILY_CALORIE_OFFSET / KCAL_PER_KG
    return 0
  }

  function getChartData() {
    const weightLogs = logs.filter((log) => log.weight_kg !== null)
    if (weightLogs.length === 0) return logs

    const startWeight = weightLogs[0].weight_kg
    const startDate = new Date(weightLogs[0].date)
    const dailyRate = getDailyRateKgPerDay(projectionGoal)

    return logs.map((log) => {
      const daysSinceStart = (new Date(log.date) - startDate) / (1000 * 60 * 60 * 24)
      const projectedWeightKg = Math.round(
        (startWeight + dailyRate * daysSinceStart) * 10
      ) / 10

      return { ...log, projectedWeightKg }
    })
  }

  const hasWeightData = logs.some((log) => log.weight_kg !== null)
  const chartData = getChartData()

  // ----- Gate behind login, same pattern as My Workout -----
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-char p-8">
        <div className="max-w-md mx-auto text-center mt-24">
          <h1 className="font-display text-4xl tracking-wide text-chalk mb-4">
            LOG IN REQUIRED
          </h1>
          <div className="ember-bar mx-auto mb-6"></div>
          <p className="text-steel mb-6">
            Sign in to log your weight and measurements and track progress over time.
          </p>
          <button
            onClick={onRequestLogin}
            className="bg-ember hover:bg-ember-dark text-chalk px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Log In / Sign Up
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-char flex items-center justify-center">
        <p className="text-chalk text-xl font-display tracking-wide animate-pulse">Loading progress...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-char p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-display text-5xl tracking-wide text-chalk mb-2">
          PROGRESS TRACKER
        </h1>
        <div className="ember-bar mb-6"></div>

        <form
          onSubmit={handleSubmit}
          className="bg-charcoal rounded-xl p-6 mb-6 grid grid-cols-1 sm:grid-cols-4 gap-4 items-end"
        >
          <div>
            <label className="block text-steel text-sm mb-1">Date</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              className="w-full bg-charcoal-light text-chalk px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-ember"
            />
          </div>
          <div>
            <label className="block text-steel text-sm mb-1">Weight (kg)</label>
            <input
              type="number"
              name="weightKg"
              value={form.weightKg}
              onChange={handleChange}
              className="w-full bg-charcoal-light text-chalk px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-ember"
              placeholder="e.g. 70"
            />
          </div>
          <div>
            <label className="block text-steel text-sm mb-1">
              Measurement (cm)
            </label>
            <input
              type="number"
              name="measurementCm"
              value={form.measurementCm}
              onChange={handleChange}
              className="w-full bg-charcoal-light text-chalk px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-ember"
              placeholder="e.g. waist, 80"
            />
          </div>
          <button
            type="submit"
            className="bg-ember hover:bg-ember-dark text-chalk px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Add Entry
          </button>
        </form>

        {hasWeightData && (
          <div className="bg-charcoal rounded-xl p-4 mb-6 flex items-center gap-4 flex-wrap">
            <span className="text-steel text-sm">Project against goal:</span>
            <div className="flex gap-2">
              {['cutting', 'maintenance', 'bulking'].map((goal) => (
                <button
                  key={goal}
                  onClick={() => setProjectionGoal(goal)}
                  className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-colors ${
                    projectionGoal === goal
                      ? 'bg-ember text-chalk'
                      : 'bg-charcoal-light text-steel'
                  }`}
                >
                  {goal}
                </button>
              ))}
            </div>
          </div>
        )}

        {logs.length >= 2 ? (
          <div className="bg-charcoal rounded-xl p-6 mb-6 border border-charcoal-light">
            <h2 className="font-display text-2xl tracking-wide text-chalk mb-4">
              TREND
            </h2>
            <ResponsiveContainer width="100%" height={340}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff5a1f" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ff5a1f" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="measurementGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffd23f" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#ffd23f" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#26262b" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#8a8a93"
                  tick={{ fontSize: 12, fontFamily: 'Space Grotesk' }}
                  tickLine={false}
                  axisLine={{ stroke: '#26262b' }}
                />
                <YAxis
                  stroke="#8a8a93"
                  tick={{ fontSize: 12, fontFamily: 'JetBrains Mono' }}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1c1c1f',
                    border: '1px solid #26262b',
                    borderRadius: '8px',
                    fontFamily: 'Space Grotesk',
                  }}
                  labelStyle={{ color: '#f5f3ef', fontWeight: 600, marginBottom: 4 }}
                  itemStyle={{ fontFamily: 'JetBrains Mono', fontSize: 13 }}
                  cursor={{ stroke: '#8a8a93', strokeDasharray: '3 3' }}
                />
                <Legend
                  wrapperStyle={{ fontFamily: 'Space Grotesk', fontSize: 13, paddingTop: 12 }}
                  iconType="circle"
                />

                <Area
                  type="monotone"
                  dataKey="weight_kg"
                  name="Actual Weight (kg)"
                  stroke="#ff5a1f"
                  strokeWidth={2.5}
                  fill="url(#weightGradient)"
                  connectNulls
                  dot={{ r: 3, fill: '#ff5a1f', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#ff5a1f', stroke: '#1c1c1f', strokeWidth: 2 }}
                />
                <Area
                  type="monotone"
                  dataKey="measurement_cm"
                  name="Measurement (cm)"
                  stroke="#ffd23f"
                  strokeWidth={2.5}
                  fill="url(#measurementGradient)"
                  connectNulls
                  dot={{ r: 3, fill: '#ffd23f', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#ffd23f', stroke: '#1c1c1f', strokeWidth: 2 }}
                />
                {hasWeightData && (
                  <Area
                    type="monotone"
                    dataKey="projectedWeightKg"
                    name={`Projected (${projectionGoal})`}
                    stroke="#8a8a93"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    fill="none"
                    dot={false}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
            {hasWeightData && (
              <p className="text-steel/60 text-xs mt-4">
                The projected line is a rough estimate based on the calorie
                surplus/deficit for your selected goal (using the standard ~7,700
                kcal ≈ 1kg approximation). It is not based on which exercises you've
                logged — actual results depend on many individual factors.
              </p>
            )}
          </div>
        ) : (
          <p className="text-steel text-sm mb-6 text-center">
            Add at least 2 entries to see your progress graph.
          </p>
        )}

        {logs.length > 0 && (
          <div className="bg-charcoal rounded-xl p-6">
            <h2 className="font-display text-2xl tracking-wide text-chalk mb-4">
              ENTRIES
            </h2>
            <div className="space-y-2">
              {[...logs].reverse().map((log) => (
                <div
                  key={log.id}
                  className="bg-char rounded-lg p-3"
                >
                  {editingLogId === log.id ? (
                    // ----- Edit mode: inline form replacing the normal row -----
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                      <div>
                        <label className="block text-steel text-xs mb-1">Date</label>
                        <input
                          type="date"
                          name="date"
                          value={editForm.date}
                          onChange={handleEditChange}
                          className="w-full bg-charcoal-light text-chalk px-2 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ember"
                        />
                      </div>
                      <div>
                        <label className="block text-steel text-xs mb-1">Weight (kg)</label>
                        <input
                          type="number"
                          name="weightKg"
                          value={editForm.weightKg}
                          onChange={handleEditChange}
                          className="w-full bg-charcoal-light text-chalk px-2 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ember"
                        />
                      </div>
                      <div>
                        <label className="block text-steel text-xs mb-1">Measurement (cm)</label>
                        <input
                          type="number"
                          name="measurementCm"
                          value={editForm.measurementCm}
                          onChange={handleEditChange}
                          className="w-full bg-charcoal-light text-chalk px-2 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ember"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdate(log.id)}
                          className="bg-ember hover:bg-ember-dark text-chalk px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex-1"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="bg-charcoal-light text-steel px-3 py-1.5 rounded-lg text-sm transition-colors flex-1"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // ----- Normal display mode -----
                    <div className="flex justify-between items-center">
                      <div className="flex gap-6 font-mono">
                        <span className="text-chalk">{log.date}</span>
                        {log.weight_kg && (
                          <span className="text-ember">{log.weight_kg} kg</span>
                        )}
                        {log.measurement_cm && (
                          <span className="text-gold">{log.measurement_cm} cm</span>
                        )}
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => startEditing(log)}
                          className="text-steel hover:text-gold text-sm transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(log.id)}
                          className="text-steel hover:text-ember text-sm transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
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
