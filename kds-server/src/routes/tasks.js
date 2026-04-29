const express = require('express')
const { v4: uuidv4 } = require('uuid')
const { getPool } = require('../db')

const router = express.Router()

// ============ 工具函数 ============

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function nowStr() {
  const d = new Date()
  return d.toISOString().replace('T', ' ').slice(0, 19)
}

function calcPriority(remainingHours, deadline) {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const dl = new Date(deadline)
  dl.setHours(0, 0, 0, 0)
  const msPerDay = 24 * 60 * 60 * 1000
  let daysLeft = Math.ceil((dl - now) / msPerDay)
  if (daysLeft < 1) daysLeft = 1
  return remainingHours / daysLeft
}

function formatTask(row) {
  return {
    id: row.id,
    title: row.title,
    totalHours: row.totalHours,
    remainingHours: row.remainingHours,
    deadline: row.deadline,
    completed: row.completed,
    createdAt: row.createdAt,
    priority: calcPriority(row.remainingHours, row.deadline)
  }
}

// ============ 任务 CRUD ============

// GET /api/tasks
router.get('/', async (req, res) => {
  try {
    const [rows] = await getPool().query(
      'SELECT * FROM tasks WHERE completed = FALSE AND user_id = ? ORDER BY remainingHours DESC',
      [req.userId]
    )
    const tasks = rows.map(formatTask).sort((a, b) => b.priority - a.priority)
    res.json({ code: 0, data: tasks })
  } catch (err) {
    res.status(500).json({ code: -1, msg: err.message })
  }
})

// GET /api/tasks/completed
router.get('/completed', async (req, res) => {
  try {
    const [rows] = await getPool().query(
      'SELECT * FROM tasks WHERE completed = TRUE AND user_id = ?',
      [req.userId]
    )
    res.json({ code: 0, data: rows.map(formatTask) })
  } catch (err) {
    res.status(500).json({ code: -1, msg: err.message })
  }
})

// POST /api/tasks
router.post('/', async (req, res) => {
  try {
    const { title, totalHours, deadline } = req.body
    if (!title || !totalHours || !deadline) {
      return res.status(400).json({ code: -1, msg: '缺少必要参数' })
    }
    const id = uuidv4()
    await getPool().query(
      'INSERT INTO tasks (id, title, totalHours, remainingHours, deadline, completed, user_id, createdAt) VALUES (?, ?, ?, ?, ?, FALSE, ?, ?)',
      [id, title, totalHours, totalHours, deadline, req.userId, nowStr()]
    )
    res.json({
      code: 0,
      data: { id, title, totalHours, remainingHours: totalHours, deadline, completed: false, createdAt: nowStr() }
    })
  } catch (err) {
    res.status(500).json({ code: -1, msg: err.message })
  }
})

// PATCH /api/tasks/:id/complete
router.patch('/:id/complete', async (req, res) => {
  try {
    const { hours } = req.body
    const [rows] = await getPool().query(
      'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
      [req.params.id, req.userId]
    )
    if (rows.length === 0) return res.status(404).json({ code: -1, msg: '任务不存在' })

    const task = rows[0]
    const completedHours = hours || task.remainingHours
    const newRemaining = Math.max(0, task.remainingHours - completedHours)
    const completed = newRemaining <= 0

    await getPool().query(
      'UPDATE tasks SET remainingHours = ?, completed = ? WHERE id = ? AND user_id = ?',
      [newRemaining, completed, req.params.id, req.userId]
    )

    await getPool().query(
      'INSERT INTO study_logs (task_id, task_title, hours, study_date, user_id, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [task.id, task.title, completedHours, todayStr(), req.userId, nowStr()]
    )

    res.json({ code: 0, msg: '操作成功', data: { remainingHours: newRemaining, completed } })
  } catch (err) {
    res.status(500).json({ code: -1, msg: err.message })
  }
})

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await getPool().query(
      'DELETE FROM tasks WHERE id = ? AND user_id = ?',
      [req.params.id, req.userId]
    )
    if (result.affectedRows === 0) return res.status(404).json({ code: -1, msg: '任务不存在' })
    res.json({ code: 0, msg: '删除成功' })
  } catch (err) {
    res.status(500).json({ code: -1, msg: err.message })
  }
})

// ============ 热力图 API ============

// GET /api/tasks/heatmap — 近 30 天每日学习时长
router.get('/heatmap', async (req, res) => {
  try {
    const dates = []
    const now = new Date()
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      dates.push(d.toISOString().slice(0, 10))
    }

    const [rows] = await getPool().query(
      'SELECT study_date, SUM(hours) as total_hours, COUNT(*) as sessions FROM study_logs WHERE study_date >= ? AND study_date <= ? AND user_id = ? GROUP BY study_date',
      [dates[0], dates[29], req.userId]
    )

    const dateMap = {}
    rows.forEach(r => { dateMap[r.study_date] = { hours: Math.round(r.total_hours * 100) / 100, sessions: r.sessions } })

    const heatmap = dates.map(date => ({
      date,
      hours: dateMap[date]?.hours || 0,
      sessions: dateMap[date]?.sessions || 0
    }))

    let streak = 0
    for (let i = heatmap.length - 1; i >= 0; i--) {
      if (heatmap[i].hours > 0) streak++
      else break
    }

    res.json({ code: 0, data: { heatmap, streak } })
  } catch (err) {
    res.status(500).json({ code: -1, msg: err.message })
  }
})

// ============ 趋势预测 API ============

// GET /api/tasks/predict — 基于近 7 天效率预测
router.get('/predict', async (req, res) => {
  try {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const [rows] = await getPool().query(
      'SELECT study_date, SUM(hours) as total_hours FROM study_logs WHERE study_date >= ? AND user_id = ? GROUP BY study_date',
      [sevenDaysAgo.toISOString().slice(0, 10), req.userId]
    )
    const totalHours7d = rows.reduce((sum, r) => sum + r.total_hours, 0)
    const avgDaily = rows.length > 0 ? totalHours7d / 7 : 0

    const [taskRows] = await getPool().query(
      'SELECT SUM(remainingHours) as totalRemaining, MAX(deadline) as latestDeadline FROM tasks WHERE completed = FALSE AND user_id = ?',
      [req.userId]
    )
    const totalRemaining = taskRows[0]?.totalRemaining || 0

    let predictDays = null
    let predictMsg = ''
    let verb = ''
    if (totalRemaining > 0 && avgDaily > 0) {
      predictDays = Math.ceil(totalRemaining / avgDaily)

      const [earliest] = await getPool().query(
        'SELECT MIN(deadline) as earliestDeadline FROM tasks WHERE completed = FALSE AND user_id = ?',
        [req.userId]
      )
      const earliestDL = earliest[0]?.earliestDeadline
      if (earliestDL) {
        const dl = new Date(earliestDL)
        dl.setHours(0, 0, 0, 0)
        const now = new Date()
        now.setHours(0, 0, 0, 0)
        const daysUntilDL = Math.ceil((dl - now) / (24 * 60 * 60 * 1000))

        if (predictDays <= daysUntilDL) {
          verb = 'ahead'
          predictMsg = `按当前速度，你将提前 ${daysUntilDL - predictDays} 天完成`
        } else {
          verb = 'behind'
          predictMsg = `按当前速度，你将延期 ${predictDays - daysUntilDL} 天完成`
        }
      } else {
        predictMsg = `按当前速度，预计 ${predictDays} 天后完成所有任务`
      }
    } else if (totalRemaining === 0) {
      predictMsg = '所有任务已完成'
      predictDays = 0
    } else {
      predictMsg = '暂无学习记录，开始学习吧'
    }

    res.json({
      code: 0,
      data: { avgDaily: Math.round(avgDaily * 100) / 100, totalRemaining, predictDays, verb, predictMsg }
    })
  } catch (err) {
    res.status(500).json({ code: -1, msg: err.message })
  }
})

// ============ 统计 API (增强版) ============

// GET /api/tasks/stats
router.get('/stats', async (req, res) => {
  try {
    const [allRows] = await getPool().query('SELECT * FROM tasks WHERE user_id = ?', [req.userId])
    const completedCount = allRows.filter(r => r.completed).length
    const totalCount = allRows.length

    const [todayLog] = await getPool().query(
      'SELECT SUM(hours) as todayHours FROM study_logs WHERE study_date = ? AND user_id = ?',
      [todayStr(), req.userId]
    )
    const todayHours = todayLog[0]?.todayHours || 0

    const now = new Date()
    now.setHours(0, 0, 0, 0)
    let totalIdealDaily = 0
    const activeTasks = allRows.filter(r => !r.completed)
    for (const t of activeTasks) {
      const dl = new Date(t.deadline)
      dl.setHours(0, 0, 0, 0)
      const daysLeft = Math.max(1, Math.ceil((dl - now) / (24 * 60 * 60 * 1000)))
      totalIdealDaily += t.remainingHours / daysLeft
    }
    const todayPercent = totalIdealDaily > 0 ? Math.min(100, Math.round((todayHours / totalIdealDaily) * 100)) : 0

    const [streakRows] = await getPool().query(
      'SELECT DISTINCT study_date FROM study_logs WHERE user_id = ? ORDER BY study_date DESC',
      [req.userId]
    )
    let streak = 0
    const checkDate = new Date()
    for (let i = 0; i < 365; i++) {
      const dateStr = checkDate.toISOString().slice(0, 10)
      if (streakRows.find(r => r.study_date === dateStr)) {
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }

    const [totalStudy] = await getPool().query(
      'SELECT SUM(hours) as total FROM study_logs WHERE user_id = ?',
      [req.userId]
    )
    const totalStudyHours = Math.round((totalStudy[0]?.total || 0) * 100) / 100

    res.json({
      code: 0,
      data: { totalTasks: totalCount, completedTasks: completedCount, activeTasks: totalCount - completedCount, todayPercent, todayHours, streak, totalStudyHours }
    })
  } catch (err) {
    res.status(500).json({ code: -1, msg: err.message })
  }
})

module.exports = router
