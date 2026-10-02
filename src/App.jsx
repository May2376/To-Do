import { useEffect, useRef, useState } from 'react'
import { ListChecks, Check, Plus, Trash2 } from 'lucide-react'

const PRIORITIES = { low: 'ต่ำ', medium: 'กลาง', high: 'สูง' }
const NEXT = { low: 'medium', medium: 'high', high: 'low' }
const TABS = [
  ['all', 'ทั้งหมด'],
  ['active', 'ยังไม่เสร็จ'],
  ['done', 'เสร็จแล้ว'],
]
const EMPTY = {
  all: ['ยังไม่มีรายการงาน', 'พิมพ์งานแรกของคุณด้านบน แล้วกด Enter'],
  active: ['ไม่มีงานค้างแล้ว', 'เยี่ยมมาก งานทั้งหมดเสร็จเรียบร้อย'],
  done: ['ยังไม่มีงานที่เสร็จ', 'ติ๊กช่องหน้างานเพื่อทำเครื่องหมายว่าเสร็จ'],
}
const SEED = [
  { id: 1, text: 'ส่งรายงานแล็บวิศวกรรมคอมพิวเตอร์', done: false, priority: 'high' },
  { id: 2, text: 'ทบทวนบทที่ 4 โครงสร้างข้อมูลก่อนสอบกลางภาค', done: false, priority: 'medium' },
  { id: 3, text: 'อัปเดตพอร์ตโฟลิโอบน GitHub', done: false, priority: 'low' },
  { id: 4, text: 'นัดประชุมกลุ่มโปรเจกต์วันศุกร์', done: true, priority: 'medium' },
]

let nextId = 100

function TodoItem({ todo, removing, onToggle, onEdit, onPriority, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(todo.text)
  const inputRef = useRef(null)

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
            <button
              type="button"
              className={'badge ' + todo.priority}
              title="คลิกเพื่อเปลี่ยนระดับความสำคัญ"
              onClick={() => onPriority(todo.id)}
            >
              ความสำคัญ{PRIORITIES[todo.priority]}
            </button>
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

export default function App() {
  const [todos, setTodos] = useState(SEED)
  const [text, setText] = useState('')
  const [priority, setPriority] = useState('medium')
  const [filter, setFilter] = useState('all')
  const [removing, setRemoving] = useState([])

  const update = (id, patch) =>
    setTodos((l) => l.map((t) => (t.id === id ? { ...t, ...patch } : t)))

  const add = () => {
    const v = text.trim()
    if (!v) return
    setTodos((l) => [{ id: nextId++, text: v, done: false, priority }, ...l])
    setText('')
  }
  const toggle = (id) => setTodos((l) => l.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
  const cyclePriority = (id) =>
    setTodos((l) => l.map((t) => (t.id === id ? { ...t, priority: NEXT[t.priority] } : t)))

  // Play the collapse animation first, then remove from state.
  const removeIds = (ids) => {
    setRemoving((r) => [...r, ...ids])
    setTimeout(() => {
      setTodos((l) => l.filter((t) => !ids.includes(t.id)))
      setRemoving((r) => r.filter((i) => !ids.includes(i)))
    }, 260)
  }

  const remaining = todos.filter((t) => !t.done).length
  const doneCount = todos.length - remaining
  const counts = { all: todos.length, active: remaining, done: doneCount }
  const shown = todos.filter((t) =>
    filter === 'all' ? true : filter === 'active' ? !t.done : t.done,
  )
  const [emptyTitle, emptyHint] = EMPTY[filter]

  return (
    <div className="wrap">
      <header className="flex flex-col gap-1">
        <h1>รายการงานของฉัน</h1>
        <p className="sub">จัดการงานประจำวัน เรียงตามความสำคัญที่คุณกำหนด</p>
      </header>

      <main className="card" style={{ overflow: 'hidden' }}>
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
            <option value="low">ต่ำ</option>
            <option value="medium">กลาง</option>
            <option value="high">สูง</option>
          </select>
          <button type="button" className="btn" onClick={add}>
            <Plus size={18} />
            เพิ่ม
          </button>
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
                removing={removing.includes(t.id)}
                onToggle={toggle}
                onEdit={(id, v) => update(id, { text: v })}
                onPriority={cyclePriority}
                onDelete={(id) => removeIds([id])}
              />
            ))}
          </ul>
        ) : (
          <div className="empty">
            <ListChecks size={36} strokeWidth={1.5} />
            <strong style={{ color: 'var(--fg)' }}>{emptyTitle}</strong>
            <span>{emptyHint}</span>
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

      <p className="hint">ดับเบิลคลิกที่ชื่องานเพื่อแก้ไข · คลิกป้ายความสำคัญเพื่อเปลี่ยนระดับ</p>
    </div>
  )
}
