import { FormEvent, useEffect, useMemo, useState } from 'react'

type Habit = {
  id: string
  name: string
  description: string
  category: string
  targetDays: number[]
  completions: string[]
  createdAt: string
}

const STORAGE_KEY = 'habit-tracker:v1'
const categories = ['Health', 'Fitness', 'Mindfulness', 'Learning', 'Work', 'Personal']

const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const dateKey = (date: Date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return y + '-' + m + '-' + d
}

const today = () => new Date()

function isScheduled(habit: Habit, date: Date) {
  return habit.targetDays.includes(date.getDay())
}

function streakFor(habit: Habit) {
  let streak = 0
  const cursor = today()
  if (!habit.completions.includes(dateKey(cursor)) && isScheduled(habit, cursor)) {
    cursor.setDate(cursor.getDate() - 1)
  }
  for (let i = 0; i < 365; i++) {
    if (isScheduled(habit, cursor)) {
      if (!habit.completions.includes(dateKey(cursor))) break
      streak++
    }
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

function App() {
  const [habits, setHabits] = useState<Habit[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    } catch {
      return []
    }
  })
  const [dark, setDark] = useState(() => localStorage.getItem('habit-theme') === 'dark')
  const [editing, setEditing] = useState<Habit | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('All')

  const todayKey = dateKey(today())

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits))
  }, [habits])

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    localStorage.setItem('habit-theme', dark ? 'dark' : 'light')
  }, [dark])

  const visibleHabits = useMemo(
    () => filter === 'All' ? habits : habits.filter(h => h.category === filter),
    [habits, filter],
  )

  const completedToday = habits.filter(h => h.completions.includes(todayKey)).length
  const progress = habits.length ? Math.round((completedToday / habits.length) * 100) : 0

  const toggleComplete = (id: string) => {
    setHabits(current => current.map(h => h.id !== id ? h : {
      ...h,
      completions: h.completions.includes(todayKey)
        ? h.completions.filter(d => d !== todayKey)
        : [...h.completions, todayKey],
    }))
  }

  const removeHabit = (id: string) => {
    const habit = habits.find(h => h.id === id)
    if (habit && window.confirm('Delete "' + habit.name + '"? This cannot be undone.')) {
      setHabits(current => current.filter(h => h.id !== id))
    }
  }

  const saveHabit = (data: Omit<Habit, 'id' | 'createdAt' | 'completions'>) => {
    if (editing) {
      setHabits(current => current.map(h => h.id === editing.id ? { ...h, ...data } : h))
    } else {
      setHabits(current => [...current, {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        completions: [],
      }])
    }
    setEditing(null)
    setShowForm(false)
  }

  const openEdit = (habit: Habit) => {
    setEditing(habit)
    setShowForm(true)
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">DAILY CONSISTENCY</p>
          <h1>Habit Tracker</h1>
        </div>
        <button className="theme-btn" onClick={() => setDark(v => !v)} aria-label="Toggle theme">
          {dark ? 'Light' : 'Dark'}
        </button>
      </header>

      <main>
        <section className="hero">
          <div>
            <p className="muted">{today().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            <h2>Build habits that last.</h2>
            <p className="muted">Track your progress, protect your streaks, and keep moving forward.</p>
          </div>
          <button className="primary" onClick={() => { setEditing(null); setShowForm(true) }}>+ Add Habit</button>
        </section>

        <section className="stats">
          <div className="stat-card"><span>Today</span><strong>{completedToday}/{habits.length}</strong></div>
          <div className="stat-card"><span>Progress</span><strong>{progress}%</strong></div>
          <div className="stat-card"><span>Active habits</span><strong>{habits.length}</strong></div>
          <div className="progress-card"><span>Daily progress</span><div className="progress-track"><div style={{ width: progress + '%' }} /></div></div>
        </section>

        <div className="toolbar">
          <div className="filters">
            {['All', ...categories].map(category => (
              <button key={category} className={filter === category ? 'filter active' : 'filter'} onClick={() => setFilter(category)}>{category}</button>
            ))}
          </div>
        </div>

        <section className="habit-grid">
          {visibleHabits.map(habit => {
            const done = habit.completions.includes(todayKey)
            return (
              <article className={done ? 'habit-card done' : 'habit-card'} key={habit.id}>
                <div className="habit-head">
                  <button className={done ? 'check checked' : 'check'} onClick={() => toggleComplete(habit.id)} aria-label={done ? 'Mark incomplete' : 'Mark complete'}>
                    {done ? '✓' : ''}
                  </button>
                  <div className="habit-title">
                    <h3>{habit.name}</h3>
                    <span className="tag">{habit.category}</span>
                  </div>
                  <div className="actions">
                    <button onClick={() => openEdit(habit)} aria-label={'Edit ' + habit.name}>Edit</button>
                    <button className="danger" onClick={() => removeHabit(habit.id)} aria-label={'Delete ' + habit.name}>Delete</button>
                  </div>
                </div>
                {habit.description && <p className="description">{habit.description}</p>}
                <div className="habit-foot">
                  <span>{habit.targetDays.map(d => dayLabels[d]).join(' · ')}</span>
                  <span><b>{streakFor(habit)}</b> day streak</span>
                </div>
              </article>
            )
          })}
          {!visibleHabits.length && (
            <div className="empty">
              <div className="empty-icon">+</div>
              <h3>{habits.length ? 'No habits in this category' : 'Start your first habit'}</h3>
              <p className="muted">Add a habit and make today count.</p>
              {!habits.length && <button className="primary" onClick={() => setShowForm(true)}>Create Habit</button>}
            </div>
          )}
        </section>
      </main>

      {showForm && <HabitForm initial={editing} onSave={saveHabit} onClose={() => { setEditing(null); setShowForm(false) }} />}
    </div>
  )
}

function HabitForm({ initial, onSave, onClose }: {
  initial: Habit | null
  onSave: (data: Omit<Habit, 'id' | 'createdAt' | 'completions'>) => void
  onClose: () => void
}) {
  const [name, setName] = useState(initial?.name || '')
  const [description, setDescription] = useState(initial?.description || '')
  const [category, setCategory] = useState(initial?.category || 'Personal')
  const [targetDays, setTargetDays] = useState<number[]>(initial?.targetDays || [1,2,3,4,5])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !targetDays.length) return
    onSave({ name: name.trim(), description: description.trim(), category, targetDays })
  }

  const toggleDay = (day: number) => {
    setTargetDays(days => days.includes(day) ? days.filter(d => d !== day) : [...days, day].sort())
  }

  return (
    <div className="modal-backdrop" onMouseDown={e => e.currentTarget === e.target && onClose()}>
      <form className="modal" onSubmit={submit}>
        <div className="modal-head"><div><p className="eyebrow">{initial ? 'UPDATE' : 'CREATE'}</p><h2>{initial ? 'Edit habit' : 'New habit'}</h2></div><button type="button" className="close" onClick={onClose}>×</button></div>
        <label>Habit name<input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Walk 30 minutes" maxLength={60} /></label>
        <label>Description<span className="optional">Optional</span><textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What does success look like?" rows={3} maxLength={160} /></label>
        <label>Category<select value={category} onChange={e => setCategory(e.target.value)}>{categories.map(c => <option key={c}>{c}</option>)}</select></label>
        <label>Schedule</label>
        <div className="days">{dayLabels.map((day, i) => <button type="button" key={day} className={targetDays.includes(i) ? 'day selected' : 'day'} onClick={() => toggleDay(i)}>{day.slice(0,1)}</button>)}</div>
        <p className="helper">Choose at least one day.</p>
        <div className="modal-actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={!name.trim() || !targetDays.length}>{initial ? 'Save changes' : 'Add habit'}</button></div>
      </form>
    </div>
  )
}

export default App
