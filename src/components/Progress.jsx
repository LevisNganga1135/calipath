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

const PROGRESS_STORAGE_KEY = 'feelTheBurn.progressLogs'

const KCAL_PER_KG = 7700
const DAILY_CALORIE_OFFSET = 500

function Progress() {
  const [logs, setLogs] = useState(() => {
    const saved = localStorage.getItem(PROGRESS_STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  })

  const [form, setForm] = useState({
    date: '',
    weightKg: '',
    measurementCm: '',
  })

  const [projectionGoal, setProjectionGoal] = useState('maintenance')

  useEffect(() => {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(logs))
  }, [logs])

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()

    if (!form.date || (!form.weightKg && !form.measurementCm)) return

    const newLog = {
      id: crypto.randomUUID(),
      date: form.date,
      weightKg: form.weightKg ? Number(form.weightKg) : null,
      measurementCm: form.measurementCm ? Number(form.measurementCm) : null,
    }

    setLogs((prev) => {
      const updated = [...prev, newLog]
      return updated.sort((a, b) => new Date(a.date) - new Date(b.date))
    })

    setForm({ date: '', weightKg: '', measurementCm: '' })
  }

  function handleDelete(id) {
    setLogs((prev) => prev.filter((log) => log.id !== id))
  }

  function getDailyRateKgPerDay(goal) {
    if (goal === 'cutting') return -DAILY_CALORIE_OFFSET / KCAL_PER_KG
    if (goal === 'bulking') return DAILY_CALORIE_OFFSET / KCAL_PER_KG
    return 0
  }

  function getChartData() {
    const weightLogs = logs.filter((log) => log.weightKg !== null)
    if (weightLogs.length === 0) return logs

    const startWeight = weightLogs[0].weightKg
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

  const hasWeightData = logs.some((log) => log.weightKg !== null)
  const chartData = getChartData()

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
                {/* Gradient fills — subtle color wash under each line for a more
                    premium, "dashboard" feel instead of flat line strokes */}
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
                  dataKey="weightKg"
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
                  dataKey="measurementCm"
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
                  className="flex justify-between items-center bg-char rounded-lg p-3"
                >
                  <div className="flex gap-6 font-mono">
                    <span className="text-chalk">{log.date}</span>
                    {log.weightKg && (
                      <span className="text-ember">{log.weightKg} kg</span>
                    )}
                    {log.measurementCm && (
                      <span className="text-gold">{log.measurementCm} cm</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(log.id)}
                    className="text-steel hover:text-ember text-sm transition-colors"
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
