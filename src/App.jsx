
import { useState, useEffect } from 'react'
import './App.css'
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  CalendarDays,
  ChartColumn,
  UserRound,
  Menu,
  X
} from 'lucide-react'
const initialTasks = [
  {
    id: 1,
    title: 'Введение в проектирование ПО на основе паттернов',
    subject: 'Проектирование ПО на основе паттернов',
    deadline: '31.10.2026',
    done: false
  },
  {
    id: 2,
    title: 'Лабораторная работа №2',
    subject: 'Научные вычисления с использованием ПО (Python; MathLab)',
    deadline: '23.10.2026',
    done: false
  },
  {
    id: 3,
    title: 'Лабораторная работа №3',
    subject: 'Основы формальных спецификаций ПО 1',
    deadline: '20.10.2026',
    done: true
  }
]

function formatDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getDeadlineText(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number)
  const today = new Date()

  const deadlineUTC = Date.UTC(year, month - 1, day)
  const todayUTC = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  )

  const days = Math.round(
    (deadlineUTC - todayUTC) / 86400000
  )

  if (days < 0) return `Просрочено на ${Math.abs(days)} дн.`
  if (days === 0) return 'Срок сдачи сегодня'

  return `Осталось ${days} дн.`
}

function getDaysUntilDeadline(deadline) {
  const [day, month, year] = deadline.split('.').map(Number)

  const today = new Date()

  const todayUTC = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  )

  const deadlineUTC = Date.UTC(year, month - 1, day)

  return Math.round(
    (deadlineUTC - todayUTC) / 86400000
  )
}

function App() {

  const [tasks, setTasks] = useState(() => {
    try {
      const savedTasks = localStorage.getItem('studentflow-tasks')

      if (savedTasks) {
        const parsedTasks = JSON.parse(savedTasks)

        if (Array.isArray(parsedTasks)) {
          return parsedTasks
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки заданий:', error)
    }

    return initialTasks
  })
  const [activePage, setActivePage] = useState('dashboard')
  const [menuOpen, setMenuOpen] = useState(false)

  const [studentName, setStudentName] = useState(() => {
    try {
      return localStorage.getItem('studentflow-student-name') || 'Студент'
    } catch {
      return 'Студент'
    }
  })

  const [nameInput, setNameInput] = useState(studentName)

  useEffect(() => {
    localStorage.setItem('studentflow-student-name', studentName)
  }, [studentName])

  useEffect(() => {
    localStorage.setItem('studentflow-tasks', JSON.stringify(tasks))
  }, [tasks])

  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [deadline, setDeadline] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [subjects, setSubjects] = useState(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem('studentflow-subjects') || '[]'
      )

      return Array.isArray(saved) ? saved : []
    } catch {
      return []
    }
  })

  const [newSubject, setNewSubject] = useState('')
  const [openSubjectMenu, setOpenSubjectMenu] = useState(null)
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('studentflow-theme') === 'dark'
        ? 'dark'
        : 'light'
    } catch {
      return 'light'
    }
  })
  const [calendarMonth, setCalendarMonth] = useState(
    () => new Date()
  )

  const [selectedDate, setSelectedDate] = useState(
    () => formatDateKey(new Date())
  )
  useEffect(() => {
    localStorage.setItem(
      'studentflow-subjects',
      JSON.stringify(subjects)
    )
  }, [subjects])
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('studentflow-theme', theme)
  }, [theme])
  const total = tasks.length

  const completed = tasks.filter(task => task.done === true).length

  const remaining = total - completed

  const progress = total === 0
    ? 0
    : Math.round((completed / total) * 100)

  const upcomingTasks = tasks
    .filter(task => !task.done)
    .map(task => ({
      ...task,
      daysLeft: getDaysUntilDeadline(task.deadline)
    }))
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 5)
  const overdueCount = tasks.filter(task =>
    !task.done && getDaysUntilDeadline(task.deadline) < 0
  ).length
  const subjectNames = [
    ...new Set([
      ...subjects,
      ...tasks.map(task => task.subject)
    ])
  ]

  const subjectStats = subjectNames.map(subject => {
    const subjectTasks = tasks.filter(task => task.subject === subject)

    const completedTasks = subjectTasks.filter(task => task.done).length

    const subjectProgress = subjectTasks.length === 0
      ? 0
      : Math.round((completedTasks / subjectTasks.length) * 100)

    return {
      name: subject,
      total: subjectTasks.length,
      completed: completedTasks,
      progress: subjectProgress
    }
  })

  function addSubject(e) {
    e.preventDefault()

    const name = newSubject.trim()

    if (!name) return

    const exists = subjectNames.some(
      item => item.toLowerCase() === name.toLowerCase()
    )

    if (exists) {
      alert('Такой предмет уже существует!')
      return
    }

    setSubjects(prev => [...prev, name])
    setNewSubject('')

  }

  function deleteSubject(name) {
    const hasTasks = tasks.some(
      task => task.subject === name
    )

    if (hasTasks) {
      alert('Нельзя удалить предмет, пока в нём есть лабораторные работы!')
      return
    }

    const confirmed = window.confirm(
      `Вы действительно хотите удалить предмет "${name}"?`
    )

    if (!confirmed) return

    setSubjects(prev =>
      prev.filter(item => item !== name)
    )

    setSubject(prev => prev === name ? '' : prev)
  }

  function editSubject(oldName) {
    const newName = window.prompt(
      'Введите новое название предмета:',
      oldName
    )

    if (newName === null) return

    const name = newName.trim()

    if (!name) {
      alert('Название предмета не может быть пустым!')
      return
    }

    if (name === oldName) return

    const exists = subjectNames.some(
      item =>
        item !== oldName &&
        item.toLowerCase() === name.toLowerCase()
    )

    if (exists) {
      alert('Такой предмет уже существует!')
      return
    }

    setSubjects(prev =>
      prev.includes(oldName)
        ? prev.map(item => item === oldName ? name : item)
        : [...prev, name]
    )

    setTasks(prev =>
      prev.map(task =>
        task.subject === oldName
          ? { ...task, subject: name }
          : task
      )
    )

    setSubject(prev => prev === oldName ? name : prev)

    setOpenSubjectMenu(null)
  }

  const firstDay = new Date(
    calendarMonth.getFullYear(),
    calendarMonth.getMonth(),
    1
  )

  const startOffset = (firstDay.getDay() + 6) % 7

  const daysInMonth = new Date(
    calendarMonth.getFullYear(),
    calendarMonth.getMonth() + 1,
    0
  ).getDate()

  const calendarDays = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
  ]

  const todayKey = formatDateKey(new Date())

  const selectedTasks = tasks.filter(task =>
    task.deadline === selectedDate.split('-').reverse().join('.')
  )

  function changeCalendarMonth(direction) {
    const nextMonth = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth() + direction,
      1
    )

    setCalendarMonth(nextMonth)
    setSelectedDate(formatDateKey(nextMonth))
  }

  function toggleTask(id) {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === id
          ? { ...task, done: !task.done }
          : task
      )
    )
  }

  function editTask(task) {
    setEditingId(task.id)
    setTitle(task.title)
    setSubject(task.subject)
    setDeadline(task.deadline.split('.').reverse().join('-'))

    document.getElementById('task-editor')?.scrollIntoView({
      behavior: 'smooth'
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setTitle('')
    setSubject('')
    setDeadline('')
  }

  function deleteTask(id) {
    if (window.confirm('Вы действительно хотите удалить задание?')) {
      setTasks(prevTasks =>
        prevTasks.filter(task => task.id !== id)
      )

      if (editingId === id) {
        cancelEdit()
      }
    }
  }



  function addTask(e) {
    e.preventDefault()

    if (!title.trim() || !subject.trim() || !deadline) {
      alert('Заполните все поля!')
      return
    }

    const formattedDeadline = deadline.split('-').reverse().join('.')

    if (editingId !== null) {
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === editingId
            ? {
              ...task,
              title: title.trim(),
              subject: subject.trim(),
              deadline: formattedDeadline
            }
            : task
        )
      )
    } else {
      const newTask = {
        id: Date.now(),
        title: title.trim(),
        subject: subject.trim(),
        deadline: formattedDeadline,
        done: false
      }

      setTasks(prevTasks => [...prevTasks, newTask])
    }

    cancelEdit()
  }

  function saveProfile(e) {
    e.preventDefault()

    const name = nameInput.trim()

    if (!name) {
      alert('Введите имя студента!')
      return
    }

    setStudentName(name)
    alert('Профиль успешно сохранён!')
  }

  const initials = studentName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(word => word[0].toUpperCase())
    .join('')

  function exportBackup() {
    const backup = {
      version: 1,
      createdAt: new Date().toISOString(),
      tasks: tasks,
      subjects: subjects,
      studentName: studentName,
      theme: theme
    }

    const json = JSON.stringify(backup, null, 2)

    const blob = new Blob([json], {
      type: 'application/json'
    })

    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `studentflow-backup-${formatDateKey(new Date())}.json`

    document.body.appendChild(link)
    link.click()
    link.remove()

    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  async function importBackup(event) {
    const input = event.currentTarget
    const file = input.files?.[0]

    if (!file) return

    try {
      const text = await file.text()
      const backup = JSON.parse(text)

      const validTasks =
        Array.isArray(backup.tasks) &&
        backup.tasks.every(task =>
          task &&
          typeof task.id === 'number' &&
          typeof task.title === 'string' &&
          typeof task.subject === 'string' &&
          typeof task.deadline === 'string' &&
          typeof task.done === 'boolean'
        )

      const validSubjects =
        Array.isArray(backup.subjects) &&
        backup.subjects.every(name => typeof name === 'string')

      const validProfile =
        typeof backup.studentName === 'string' &&
        backup.studentName.trim() !== ''

      const validTheme =
        backup.theme === 'light' || backup.theme === 'dark'

      if (
        backup.version !== 1 ||
        !validTasks ||
        !validSubjects ||
        !validProfile ||
        !validTheme
      ) {
        throw new Error('Неверный формат резервной копии')
      }

      const confirmed = window.confirm(
        'Текущие данные будут заменены данными из файла. Продолжить?'
      )

      if (!confirmed) return

      setTasks(backup.tasks)
      setSubjects(backup.subjects)
      setStudentName(backup.studentName)
      setNameInput(backup.studentName)
      setTheme(backup.theme)

      cancelEdit()
      setOpenSubjectMenu(null)
      setActivePage('dashboard')

      alert('Данные успешно восстановлены!')
    } catch (error) {
      alert('Ошибка восстановления: ' + error.message)
    } finally {
      input.value = ''
    }
  }

  const pageTitles = {
    dashboard: 'Панель управления',
    subjects: 'Мои предметы',
    tasks: 'Лабораторные работы',
    calendar: 'Календарь дедлайнов',
    statistics: 'Статистика успеваемости',
    profile: 'Мой профиль'
  }
  const currentDate = new Date().toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
  return (
    <div className="app">

      <aside className="sidebar">
        <h2>🎓 StudentFlow</h2>
        <p>Твой учебный помощник</p>


        <button
          type="button"
          className="mobile-menu-toggle"
          onClick={() => setMenuOpen(prev => !prev)}
          aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
          aria-expanded={menuOpen}
          aria-controls="studentflow-navigation"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>



        <nav
          id="studentflow-navigation"
          className={`sidebar-nav ${menuOpen ? 'mobile-open' : ''}`}
          onClick={() => setMenuOpen(false)}
        >

          <button
            className={activePage === 'dashboard' ? 'active' : ''}
            onClick={() => setActivePage('dashboard')}
          >
            <LayoutDashboard />
            <span>Главная</span>
          </button>

          <button
            className={activePage === 'subjects' ? 'active' : ''}
            onClick={() => setActivePage('subjects')}
          >
            <BookOpen />
            <span>Мои предметы</span>
          </button>

          <button
            className={activePage === 'tasks' ? 'active' : ''}
            onClick={() => setActivePage('tasks')}
          >
            <ClipboardList />
            <span>Лабораторные</span>
          </button>

          <button
            className={activePage === 'calendar' ? 'active' : ''}
            onClick={() => setActivePage('calendar')}
          >
            <CalendarDays />
            <span>Календарь</span>
          </button>

          <button
            className={activePage === 'statistics' ? 'active' : ''}
            onClick={() => setActivePage('statistics')}
          >
            <ChartColumn />
            <span>Статистика</span>
          </button>
          <button
            className={activePage === 'profile' ? 'active' : ''}
            onClick={() => setActivePage('profile')}
          >
            <UserRound />
            <span>Мой профиль</span>
          </button>
        </nav>

        <button
          type="button"
          className="sidebar-profile"
          onClick={() => setActivePage('profile')}
        >
          <span className="sidebar-profile-avatar">
            {initials}
          </span>

          <span className="sidebar-profile-info">
            <strong>{studentName}</strong>
            <small>Мой профиль</small>
          </span>

          <UserRound size={18} />
        </button>


      </aside>

      <main className="main-content">



        <header id="dashboard" className="header">
          <h1>{pageTitles[activePage]}</h1>

          <p>
            Привет, {studentName}! Добро пожаловать в StudentFlow.
          </p>

          <p className="header-date">{currentDate}</p>

          {activePage === 'dashboard' && (
            <button
              type="button"
              className="dashboard-add-btn"
              onClick={() => {
                cancelEdit()
                setActivePage('tasks')
              }}
            >
              + Новое задание
            </button>
          )}

          <button
            type="button"
            className="theme-toggle"
            onClick={() =>
              setTheme(prev => prev === 'light' ? 'dark' : 'light')
            }
          >
            {theme === 'light'
              ? '🌙 Тёмная тема'
              : '☀️ Светлая тема'}
          </button>
        </header>


        <section
          className="profile-section"
          style={{ display: activePage === 'profile' ? undefined : 'none' }}
        >
          <div className="profile-card">

            <div className="profile-heading">
              <div className="profile-avatar">
                {initials}
              </div>

              <div>
                <h2>{studentName}</h2>
                <p>Студент</p>
              </div>
            </div>

            <form onSubmit={saveProfile} className="profile-form">
              <label htmlFor="student-name">
                Имя студента
              </label>

              <input
                id="student-name"
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Введите имя"
                required
              />

              <button type="submit">
                Сохранить изменения
              </button>
            </form>

            <div className="profile-summary">
              <div>
                <span>Предметов</span>
                <strong>{subjectStats.length}</strong>
              </div>

              <div>
                <span>Всего заданий</span>
                <strong>{total}</strong>
              </div>

              <div>
                <span>Выполнено</span>
                <strong>{completed}</strong>
              </div>
            </div>

            <div className="backup-section">
              <h3>Резервная копия данных</h3>

              <p>
                Сохрани свои предметы, лабораторные работы
                и настройки в отдельный файл.
              </p>

              <button
                type="button"
                className="backup-button"
                onClick={exportBackup}
              >
                Скачать резервную копию
              </button>

              <div className="backup-import">
                <label htmlFor="backup-file">
                  Восстановить данные из резервной копии
                </label>

                <input
                  id="backup-file"
                  type="file"
                  accept=".json,application/json"
                  onChange={importBackup}
                />
              </div>

            </div>


          </div>
        </section>

        <section
          className="statistics"
          style={{ display: activePage === 'dashboard' ? undefined : 'none' }}
        >
          <div className="stat-card">
            <h3>Всего заданий</h3>
            <h2>{tasks.length}</h2>
          </div>

          <div className="stat-card">
            <h3>Выполнено</h3>
            <h2>{completed}</h2>
          </div>

          <div className="stat-card">
            <h3>Осталось</h3>
            <h2>{remaining}</h2>
          </div>

          <div className="stat-card">
            <h3>Прогресс</h3>
            <h2>{progress}%</h2>
          </div>
        </section>

        <section
          className="deadlines-section"
          style={{ display: activePage === 'dashboard' ? undefined : 'none' }}
        >
          <div className="deadlines-header">
            <h2>Ближайшие дедлайны</h2>
            <span>Несданные задания</span>
          </div>

          {upcomingTasks.length === 0 ? (
            <div className="deadlines-empty">
              Все задания выполнены!
            </div>
          ) : (
            <div className="deadlines-list">
              {upcomingTasks.map(task => (
                <div className="deadline-card" key={task.id}>

                  <div className="deadline-info">
                    <h3>{task.title}</h3>
                    <p>{task.subject}</p>
                    <small>Срок сдачи: {task.deadline}</small>
                  </div>

                  <div className="deadline-actions">
                    <span className={
                      task.daysLeft < 0
                        ? 'deadline-badge overdue'
                        : task.daysLeft <= 3
                          ? 'deadline-badge urgent'
                          : 'deadline-badge normal'
                    }>
                      {task.daysLeft < 0
                        ? `Просрочено на ${Math.abs(task.daysLeft)} дн.`
                        : task.daysLeft === 0
                          ? 'Сдать сегодня!'
                          : `Осталось ${task.daysLeft} дн.`}
                    </span>

                    <button
                      type="button"
                      onClick={() => toggleTask(task.id)}
                    >
                      Отметить сданным
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </section>

        <section
          id="statistics"
          className="analytics-section"
          style={{ display: activePage === 'statistics' ? undefined : 'none' }}
        >

          <div className="analytics-header">
            <h2>Статистика успеваемости</h2>
            <p>Следи за своими учебными результатами</p>
          </div>

          <div className="analytics-overview">

            <div className="analytics-chart-card">
              <h3>Общий прогресс</h3>

              <div
                className="analytics-donut"
                style={{
                  background: `conic-gradient(
            #7357e8 0% ${progress}%,
            #eeeafd ${progress}% 100%
          )`
                }}
                role="img"
                aria-label={`Выполнено ${progress}% заданий`}
              >
                <div className="analytics-donut-center">
                  <strong>{progress}%</strong>
                  <span>Выполнено</span>
                </div>
              </div>

              <p>{completed} из {total} заданий сдано</p>
            </div>

            <div className="analytics-summary">

              <div className="analytics-item">
                <span>Всего заданий</span>
                <strong>{total}</strong>
              </div>

              <div className="analytics-item success">
                <span>Выполнено</span>
                <strong>{completed}</strong>
              </div>

              <div className="analytics-item warning">
                <span>Осталось</span>
                <strong>{remaining}</strong>
              </div>

              <div className="analytics-item danger">
                <span>Просрочено</span>
                <strong>{overdueCount}</strong>
              </div>

            </div>
          </div>

          <div className="analytics-subjects">
            <h3>Успеваемость по предметам</h3>

            {subjectStats.length === 0 ? (
              <p>Предметы пока не добавлены.</p>
            ) : (
              subjectStats.map(subject => (
                <div
                  className="analytics-subject-row"
                  key={subject.name}
                >
                  <div className="analytics-subject-info">
                    <span>{subject.name}</span>
                    <strong>{subject.progress}%</strong>
                  </div>

                  <div className="analytics-progress-track">
                    <div
                      className="analytics-progress-fill"
                      style={{
                        width: `${subject.progress}%`
                      }}
                    />
                  </div>

                  <small>
                    Сдано {subject.completed} из {subject.total}
                  </small>
                </div>
              ))
            )}
          </div>

        </section>

        <section
          id="subjects"
          className="subjects-section"
          style={{ display: activePage === 'subjects' ? undefined : 'none' }}
        >
          <div className="subjects-header">
            <h2>Мои предметы</h2>
            <span>{subjectStats.length} предметов</span>
          </div>
          <form className="subject-form" onSubmit={addSubject}>
            <input
              type="text"
              placeholder="Название нового предмета"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              required
            />

            <button type="submit">
              + Добавить предмет
            </button>
          </form>
          <div className="subjects-grid">
            {subjectStats.map(subject => (
              <div className="subject-card" key={subject.name}>

                <div className="subject-menu">

                  <button
                    type="button"
                    className="subject-menu-btn"
                    aria-label={`Действия с предметом ${subject.name}`}
                    aria-expanded={openSubjectMenu === subject.name}
                    onClick={() =>
                      setOpenSubjectMenu(
                        openSubjectMenu === subject.name
                          ? null
                          : subject.name
                      )
                    }
                  >
                    ⋯
                  </button>


                  {openSubjectMenu === subject.name && (
                    <div className="subject-dropdown">

                      <button
                        type="button"
                        className="subject-edit-option"
                        onClick={() => editSubject(subject.name)}
                      >
                        ✎ Редактировать
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setOpenSubjectMenu(null)
                          deleteSubject(subject.name)
                        }}
                      >
                        Удалить предмет
                      </button>

                    </div>
                  )}


                </div>


                <div className="subject-icon">📚</div>

                <h3>{subject.name}</h3>

                <p>Всего лабораторных: {subject.total}</p>
                <p>Сдано: {subject.completed}</p>

                <div className="subject-progress-info">
                  <span>Прогресс выполнения</span>
                  <strong>{subject.progress}%</strong>
                </div>

                <div className="subject-progress-bar">
                  <div
                    className="subject-progress-fill"
                    style={{ width: `${subject.progress}%` }}
                  ></div>
                </div>




              </div>
            ))}
          </div>

          {subjectStats.length === 0 && (
            <p>Пока нет предметов. Добавь первую лабораторную работу.</p>
          )}
        </section>

        <section
          id="calendar"
          className="calendar-section"
          style={{ display: activePage === 'calendar' ? undefined : 'none' }}
        >

          <div className="calendar-header">
            <div>
              <h2>Календарь дедлайнов</h2>
              <p>Выбирай даты и следи за заданиями</p>
            </div>

            <div className="calendar-navigation">
              <button
                type="button"
                onClick={() => changeCalendarMonth(-1)}
              >
                ‹
              </button>

              <strong>
                {calendarMonth.toLocaleDateString('ru-RU', {
                  month: 'long',
                  year: 'numeric'
                })}
              </strong>

              <button
                type="button"
                onClick={() => changeCalendarMonth(1)}
              >
                ›
              </button>
            </div>
          </div>

          <div className="calendar-grid">

            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
              <div className="calendar-weekday" key={day}>
                {day}
              </div>
            ))}

            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} />
              }

              const date = new Date(
                calendarMonth.getFullYear(),
                calendarMonth.getMonth(),
                day
              )

              const dateKey = formatDateKey(date)

              const count = tasks.filter(task =>
                task.deadline === dateKey.split('-').reverse().join('.')
              ).length

              return (
                <button
                  type="button"
                  key={dateKey}
                  className={`calendar-day
            ${dateKey === todayKey ? 'today' : ''}
            ${dateKey === selectedDate ? 'selected' : ''}
          `}
                  onClick={() => setSelectedDate(dateKey)}
                >
                  <span>{day}</span>

                  {count > 0 && (
                    <small>{count} заданий</small>
                  )}
                </button>
              )
            })}

          </div>

          <div className="calendar-details">
            <h3>
              Задания на {selectedDate.split('-').reverse().join('.')}
            </h3>

            {selectedTasks.length === 0 ? (
              <p>На этот день заданий нет.</p>
            ) : (
              selectedTasks.map(task => (
                <div className="calendar-task" key={task.id}>
                  <div>
                    <strong>{task.title}</strong>
                    <p>{task.subject}</p>
                  </div>

                  <span>
                    {task.done
                      ? 'Сдано'
                      : getDeadlineText(selectedDate)}
                  </span>
                </div>
              ))
            )}
          </div>

        </section>

        <section
          id="task-editor"
          className="add-task-section"
          style={{ display: activePage === 'tasks' ? undefined : 'none' }}
        >
          <h2>
            {editingId !== null
              ? 'Редактировать лабораторную'
              : 'Добавить лабораторную работу'}
          </h2>

          <form className="task-form" onSubmit={addTask}>
            <div className="form-group">
              <label>Название лабораторной</label>
              <input
                type="text"
                placeholder="Например: Лабораторная №5"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>


            <div className="form-group">
              <label>Предмет</label>

              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              >
                <option value="">Выберите предмет</option>

                {subjectNames.map(item => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>


            <div className="form-group">
              <label>Срок сдачи</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
              />
            </div>


            <div className="form-actions">
              <button className="add-task-btn" type="submit">
                {editingId !== null
                  ? 'Сохранить изменения'
                  : '+ Добавить задание'}
              </button>

              {editingId !== null && (
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={cancelEdit}
                >
                  Отмена
                </button>
              )}
            </div>

          </form>
        </section>

        <section
          id="tasks"
          className="tasks-section"
          style={{ display: activePage === 'tasks' ? undefined : 'none' }}
        >
          <h2>Мои лабораторные работы</h2>

          <div className="task-list">
            {tasks.map(task => (
              <div className="task-card" key={task.id}>
                <div>
                  <h3>{task.title}</h3>
                  <p>{task.subject}</p>
                  <small>Срок сдачи: {task.deadline}</small>
                </div>


                <div className="task-actions">
                  <button onClick={() => toggleTask(task.id)}>
                    {task.done ? 'Сдано ✓' : 'Отметить сданным'}
                  </button>

                  <button
                    className="edit-button"
                    onClick={() => editTask(task)}
                  >
                    Изменить
                  </button>

                  <button
                    className="delete-button"
                    onClick={() => deleteTask(task.id)}
                  >
                    Удалить
                  </button>
                </div>

              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  )
}

export default App
