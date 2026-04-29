const express = require('express')
const { getPool } = require('../db')
const router = express.Router()

// 月度统计
router.get('/monthly', async (req, res) => {
  try {
    const { year, month } = req.query
    if (!year || !month) return res.status(400).json({ code: -1, msg: '缺少 year/month' })

    const [rows] = await getPool().query(`
      SELECT s.id, s.name, s.color,
        mp.total_hours as planned,
        COALESCE(SUM(dl.hours), 0) as actual
      FROM subjects s
      LEFT JOIN month_plans mp ON s.id = mp.subject_id AND mp.year = ? AND mp.month = ?
      LEFT JOIN week_plans wp ON wp.month_plan_id = mp.id
      LEFT JOIN daily_logs dl ON dl.week_plan_id = wp.id
      WHERE mp.id IS NOT NULL AND s.user_id = ?
      GROUP BY s.id, s.name, s.color, mp.total_hours
      ORDER BY (COALESCE(SUM(dl.hours),0) / NULLIF(mp.total_hours,0)) ASC
    `, [year, month, req.userId])

    let worst = null
    for (const r of rows) {
      const pct = r.planned > 0 ? r.actual / r.planned : 1
      if (!worst || pct < worst.pct) worst = { ...r, pct }
    }

    res.json({ code: 0, data: { subjects: rows, worstSubject: worst } })
  } catch (err) { res.status(500).json({ code: -1, msg: err.message }) }
})

// 月度各周完成率曲线
router.get('/weekly-curve', async (req, res) => {
  try {
    const { month_plan_id } = req.query
    const [weeks] = await getPool().query(
      `SELECT wp.week_number, wp.planned_hours,
        COALESCE((SELECT SUM(hours) FROM daily_logs WHERE week_plan_id = wp.id), 0) as actual_hours
       FROM week_plans wp WHERE wp.month_plan_id = ? AND wp.user_id = ?
       ORDER BY wp.week_number`,
      [month_plan_id, req.userId]
    )
    res.json({ code: 0, data: weeks.map(w => ({
      week: w.week_number,
      planned: w.planned_hours,
      actual: w.actual_hours,
      rate: w.planned_hours > 0 ? Math.round((w.actual_hours / w.planned_hours) * 100) : 0
    })) })
  } catch (err) { res.status(500).json({ code: -1, msg: err.message }) }
})

// 热力图数据 (月视图用)
router.get('/heatmap', async (req, res) => {
  try {
    const { year, month } = req.query
    const daysInMonth = new Date(year, month, 0).getDate()

    const [logs] = await getPool().query(`
      SELECT dl.study_date, SUM(dl.hours) as total_hours, COUNT(*) as sessions,
        wp.month_plan_id, mp.total_hours
      FROM daily_logs dl
      JOIN week_plans wp ON dl.week_plan_id = wp.id
      JOIN month_plans mp ON wp.month_plan_id = mp.id
      WHERE mp.year = ? AND mp.month = ? AND dl.user_id = ?
      GROUP BY dl.study_date, wp.month_plan_id, mp.total_hours
    `, [year, month, req.userId])

    const heatmap = []
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const dayLogs = logs.filter(l => l.study_date === dateStr)
      const totalHours = dayLogs.reduce((s, l) => s + l.total_hours, 0)
      const dailyTarget = logs.length > 0
        ? logs.reduce((s, l) => s + l.total_hours, 0) / daysInMonth
        : 0
      const ratio = dailyTarget > 0 ? Math.min(totalHours / dailyTarget, 1.5) : 0

      heatmap.push({
        date: dateStr,
        day: d,
        hours: Math.round(totalHours * 10) / 10,
        sessions: dayLogs.reduce((s, l) => s + l.sessions, 0),
        ratio: Math.round(ratio * 100) / 100
      })
    }

    res.json({ code: 0, data: heatmap })
  } catch (err) { res.status(500).json({ code: -1, msg: err.message }) }
})

module.exports = router
