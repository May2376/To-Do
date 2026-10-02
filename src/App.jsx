import { useEffect, useRef, useState } from 'react'
import {
  Briefcase, CalendarDays, Check, HeartPulse, ListChecks, Plus, Search, ShoppingCart, Trash2, User,
} from 'lucide-react'

const PRIORITIES = { low: 'ต่ำ', medium: 'กลาง', high: 'สูง' }
const NEXT = { low: 'medium', medium: 'high', high: 'low' }
const TABS = [
  ['all', 'ทั้งหมด'],
  ['active', 'ยังไม่เสร็จ'],
  ['done', 'เสร็จแล้ว'],
]
const CATS = [
  ['work', 'งาน', Briefcase],
  ['personal', 'ส่วนตัว', User],
  ['shopping', 'ช็อปปิง', ShoppingCart],
  ['health', 'สุขภาพ', HeartPulse],
]
const CAT_NAME = Object.fromEntries(CATS.map(([id, name]) => [id, name]))
const CAT_ICON = Object.fromEntries(CATS.map(([id, , Icon]) => [id, Icon]))
const EMPTY = {
  all: ['ยังไม่มีรายการงาน', 'พิมพ์งานแรกของคุณด้านบน แล้วกด Enter'],
  active: ['ไม่มีงานค้างแล้ว', 'เยี่ยมมาก งานทั้งหมดเสร็จเรียบร้อย'],
  done: ['ยังไม่มีงานที่เสร็จ', 'ติ๊กช่องหน้างานเพื่อทำเครื่องหมายว่าเสร็จ'],
}

// Dates are plain YYYY-MM-DD strings in local time, so they compare correctly as strings.
const pad = (n) => String(n).padStart(2, '0')
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const dayOffset = (n) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return ymd(d)
}
const fmtDate = (s) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
}
function dueState(t, today) {
  if (!t.due) return null
  if (t.done) return 'plain'
  if (t.due < today) return 'overdue'
  if (t.due === today) return 'today'
  return 'plain'
}

const SEED = [
  { id: 1, text: 'ส่งรายงานแล็บวิศวกรรมคอมพิวเตอร์', done: false, priority: 'high', cat: 'work', due: dayOffset(-2) },
  { id: 2, text: 'ทบทวนบทที่ 4 โครงสร้างข้อมูลก่อนสอบกลางภาค', done: false, priority: 'medium', cat: 'work', due: dayOffset(0) },
  { id: 3, text: 'อัปเดตพอร์ตโฟลิโอบน GitHub', done: false, priority: 'low', cat: 'personal', due: dayOffset(5) },
  { id: 4, text: 'นัดประชุมกลุ่มโปรเจกต์วันศุกร์', done: true, priority: 'medium', cat: 'work', due: dayOffset(-1) },
  { id: 5, text: 'ซื้อของใช้เข้าหอพัก', done: false, priority: 'low', cat: 'shopping', due: dayOffset(1) },
  { id: 6, text: 'วิ่งออกกำลังกายตอนเย็น', done: false, priority: 'medium', cat: 'health', due: dayOffset(0) },
  { id: 7, text: 'นัดตรวจสุขภาพประจำปี', done: false, priority: 'low', cat: 'health', due: '' },
]

let nextId = 100

function TodoItem({ todo, today, removing, onToggle, onEdit, onPriority, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(todo.text)
  const inputRef = useRef(null)
  const ds = dueState(todo, today)
  const CatIcon = CAT_ICON[todo.cat]

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const startEdit = () => {
    setDraft(todo.text)
    setEditing(true)
  }
  const save = () => {
    const v = draft.trim()
    if (v && v !== todo.text) onEdit(todo.id, v)
    setEditing(false)
  }
  const onKey = (e) => {
    if (e.key === 'Enter') save()
    else if (e.key === 'Escape') {
      setDraft(todo.text)
      setEditing(false)
    }
  }
  const dueLabel =
    ds === 'overdue' ? `เลยกำหนด ${fmtDate(todo.due)}`
    : ds === 'today' ? 'ครบกำหนดวันนี้'
    : ds ? `กำหนด ${fmtDate(todo.due)}`
    : null

  return (
    <li className={'item-wrap' + (removing ? ' removing' : '')}>
      <div>
        <div className={'item' + (todo.done ? ' done' : '')}>
          <button
            type="button"
            className="check"
            role="checkbox"
            aria-checked={todo.done}
            aria-label={'ทำเครื่องหมายว่าเสร็จ: ' + todo.text}
            onClick={() => onToggle(todo.id)}
          >
            {todo.done && <Check size={14} strokeWidth={3} />}
          </button>
          <div className="body">
            {editing ? (
              <input
                ref={inputRef}
                className="edit"
                value={draft}
                maxLength={200}
                aria-label="แก้ไขงาน"
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={onKey}
                onBlur={save}
              />
            ) : (
              <span className="text" onDoubleClick={startEdit} title="ดับเบิลคลิกเพื่อแก้ไข">
                {todo.text}
              </span>
            )}
            <div className="meta">
              <button
                type="button"
                className={'badge ' + todo.priority}
                title="คลิกเพื่อเปลี่ยนระดับความสำคัญ"
                onClick={() => onPriority(todo.id)}
              >
                ความสำคัญ{PRIORITIES[todo.priority]}
              </button>
              <span className="chip">
                <CatIcon size={12} />
                {CAT_NAME[todo.cat]}
              </span>
              {dueLabel && (
                <span className={'chip ' + ds}>
                  <CalendarDays size={12} />
                  {dueLabel}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            className="icon-btn"
            aria-label={'ลบ: ' + todo.text}
            title="ลบ"
            onClick={() => onDelete(todo.id)}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </li>
  )
}

// One ring, three status segments in fixed order, 2px gaps between segments.
function Donut({ total, done, active, over }) {
  const R = 40
  const C = 2 * Math.PI * R
  const segs = [
    { k: 'done', label: 'เสร็จแล้ว', n: done, c: 'var(--low-fg)' },
    { k: 'active', label: 'ค้างอยู่', n: active, c: 'var(--accent)' },
    { k: 'over', label: 'เลยกำหนด', n: over, c: 'var(--danger)' },
  ]
  const gap = segs.filter((s) => s.n > 0).length > 1 ? 2 : 0
  let offset = 0
  const summary = `เสร็จแล้ว ${done} ค้างอยู่ ${active} เลยกำหนด ${over} จากทั้งหมด ${total} งาน`

  return (
    <div className="donut-row">
      <svg className="donut" viewBox="0 0 120 120" role="img" aria-label={summary}>
        <circle cx="60" cy="60" r={R} fill="none" strokeWidth="14" style={{ stroke: 'var(--line)' }} />
        {segs.map((s) => {
          if (!s.n) return null
          const len = (s.n / total) * C
          const dash = Math.max(len - gap, 0.5)
          const el = (
            <circle
              key={s.k}
              cx="60"
              cy="60"
              r={R}
              fill="none"
              strokeWidth="14"
              transform="rotate(-90 60 60)"
              style={{ stroke: s.c }}
              strokeDasharray={`${dash} ${C - dash}`}
              strokeDashoffset={-offset}
            >
              <title>{`${s.label} ${s.n} งาน`}</title>
            </circle>
          )
          offset += len
          return el
        })}
        <text className="dn" x="60" y="62" textAnchor="middle">{done}/{total}</text>
        <text className="dl" x="60" y="78" textAnchor="middle">เสร็จแล้ว</text>
      </svg>
      <ul className="legend">
        {segs.map((s) => (
          <li key={s.k}>
            <span className="sw" style={{ background: s.c }} />
            <span className="lb">{s.label}</span>
            <span className="ct">{s.n}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function App() {
  const [todos, setTodos] = useState(SEED)
  const [text, setText] = useState('')
  const [priority, setPriority] = useState('medium')
  const [cat, setCat] = useState('work')
  const [due, setDue] = useState('')
  const [filter, setFilter] = useState('all')
  const [catFilter, setCatFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [removing, setRemoving] = useState([])
  const today = ymd(new Date())

  const add = () => {
    const v = text.trim()
    if (!v) return
    setTodos((l) => [{ id: nextId++, text: v, done: false, priority, cat, due }, ...l])
    setText('')
    setDue('')
  }
  const patch = (id, fn) =>
    setTodos((l) => l.map((t) => (t.id === id ? { ...t, ...fn(t) } : t)))
  const toggle = (id) => patch(id, (t) => ({ done: !t.done }))
  const edit = (id, v) => patch(id, () => ({ text: v }))
  const cyclePriority = (id) => patch(id, (t) => ({ priority: NEXT[t.priority] }))
  const pickCat = (id) => {
    setCatFilter(id)
    if (id !== 'all') setCat(id) // new todos land in the category being viewed
  }

  // Play the collapse animation first, then remove from state.
  const removeIds = (ids) => {
    setRemoving((r) => [...r, ...ids])
    setTimeout(() => {
      setTodos((l) => l.filter((t) => !ids.includes(t.id)))
      setRemoving((r) => r.filter((i) => !ids.includes(i)))
    }, 260)
  }

  const q = query.trim().toLowerCase()
  const base = todos.filter(
    (t) => (catFilter === 'all' || t.cat === catFilter) && (!q || t.text.toLowerCase().includes(q)),
  )
  const counts = {
    all: base.length,
    active: base.filter((t) => !t.done).length,
    done: base.filter((t) => t.done).length,
  }
  const shown = base.filter((t) => (filter === 'all' ? true : filter === 'active' ? !t.done : t.done))
  const empty =
    (q || catFilter !== 'all') && base.length === 0
      ? ['ไม่พบงานที่ตรงกัน', 'ลองเปลี่ยนคำค้นหาหรือหมวดหมู่']
      : EMPTY[filter]

  const total = todos.length
  const remaining = todos.filter((t) => !t.done).length
  const doneCount = total - remaining
  const overdueCount = todos.filter((t) => dueState(t, today) === 'overdue').length
  const activeCount = remaining - overdueCount
  const pct = total ? Math.round((doneCount / total) * 100) : 0
  const catCount = (id) => todos.filter((t) => t.cat === id).length

  return (
    <div className="wrap">
      <header className="flex flex-col gap-1">
        <h1>รายการงานของฉัน</h1>
        <p className="sub">จัดการงานประจำวัน เรียงตามความสำคัญและวันครบกำหนด</p>
      </header>

      <div className="layout">
        <nav className="card panel area-cats" aria-label="หมวดหมู่">
          <h2>หมวดหมู่</h2>
          <ul className="cat-list">
            {[['all', 'ทั้งหมด', ListChecks], ...CATS].map(([id, label, Icon]) => (
              <li key={id}>
                <button
                  type="button"
                  className="cat-btn"
                  aria-pressed={catFilter === id}
                  onClick={() => pickCat(id)}
                >
                  <Icon size={18} />
                  <span className="lbl">{label}</span>
                  <span className="n">{id === 'all' ? total : catCount(id)}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <main className="card area-main" style={{ overflow: 'hidden' }}>
          <div className="composer">
            <input
              id="new-todo"
              className="field"
              type="text"
              value={text}
              maxLength={200}
              placeholder="เพิ่มงานใหม่…"
              aria-label="เพิ่มงานใหม่"
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && add()}
            />
            <select
              id="new-priority"
              className="select"
              value={priority}
              aria-label="ระดับความสำคัญ"
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="low">ความสำคัญ: ต่ำ</option>
              <option value="medium">ความสำคัญ: กลาง</option>
              <option value="high">ความสำคัญ: สูง</option>
            </select>
            <select
              id="new-cat"
              className="select"
              value={cat}
              aria-label="หมวดหมู่"
              onChange={(e) => setCat(e.target.value)}
            >
              {CATS.map(([id, label]) => (
                <option key={id} value={id}>หมวด: {label}</option>
              ))}
            </select>
            <input
              id="new-due"
              className="field date"
              type="date"
              value={due}
              aria-label="วันครบกำหนด"
              title="วันครบกำหนด (ไม่บังคับ)"
              onChange={(e) => setDue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && add()}
            />
            <button type="button" className="btn" onClick={add}>
              <Plus size={18} />
              เพิ่ม
            </button>
          </div>

          <div className="searchbar">
            <Search size={18} />
            <input
              id="search"
              className="field"
              type="search"
              value={query}
              placeholder="ค้นหางาน…"
              aria-label="ค้นหางาน"
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="tabs" role="tablist" aria-label="กรองรายการ">
            {TABS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                className="tab"
                aria-selected={filter === key}
                onClick={() => setFilter(key)}
              >
                {label}
                <span className="n">{counts[key]}</span>
              </button>
            ))}
          </div>

          {shown.length ? (
            <ul className="list">
              {shown.map((t) => (
                <TodoItem
                  key={t.id}
                  todo={t}
                  today={today}
                  removing={removing.includes(t.id)}
                  onToggle={toggle}
                  onEdit={edit}
                  onPriority={cyclePriority}
                  onDelete={(id) => removeIds([id])}
                />
              ))}
            </ul>
          ) : (
            <div className="empty">
              <ListChecks size={36} strokeWidth={1.5} />
              <strong style={{ color: 'var(--fg)' }}>{empty[0]}</strong>
              <span>{empty[1]}</span>
            </div>
          )}

          <div className="foot">
            <span>
              เหลืออีก <b>{remaining}</b> งานที่ต้องทำ
            </span>
            <button
              type="button"
              className="link-btn"
              disabled={doneCount === 0}
              onClick={() => removeIds(todos.filter((t) => t.done).map((t) => t.id))}
            >
              ล้างงานที่เสร็จแล้ว{doneCount ? ` (${doneCount})` : ''}
            </button>
          </div>
        </main>

        <section className="card panel area-stats" aria-label="สถิติ">
          <h2>สถิติ</h2>
          <div className="tiles">
            <div className="tile">
              <div className="v">{total}</div>
              <div className="l">งานทั้งหมด</div>
            </div>
            <div className="tile">
              <div className="v">{pct}%</div>
              <div className="l">เสร็จแล้ว</div>
            </div>
          </div>
          <Donut total={total} done={doneCount} active={activeCount} over={overdueCount} />
        </section>
      </div>

      <p className="hint">ดับเบิลคลิกที่ชื่องานเพื่อแก้ไข · คลิกป้ายความสำคัญเพื่อเปลี่ยนระดับ</p>
    </div>
  )
}
