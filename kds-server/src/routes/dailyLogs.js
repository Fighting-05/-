const express = require('express')
const { getPool } = require('../db')
const router = express.Router()
const nowStr = () => new Date().toISOString().replace('T', ' ').slice(0, 19)

// GET 某周的所有日记录
router.get('/', async (req, res) => {
  try {
    const { week_plan_id, date } = req.query
    let sql = 'SELECT * FROM daily_logs WHERE user_id = ?'
    const params = [req.userId]
    if (week_plan_id) { sql += ' AND week_plan_id = ?'; params.push(week_plan_id) }
    if (date) { sql += ' AND study_date = ?'; params.push(date) }
    sql += ' ORDER BY study_date'
    const [rows] = await getPool().query(sql, params)
    res.json({ code: 0, data: rows })
  } catch (err) { res.status(500).json({ code: -1, msg: err.message }) }
})

// POST 记录今日工时
router.post('/', async (req, res) => {
  try {
    const { week_plan_id, subject_id, hours, note } = req.body
    if (!week_plan_id || !subject_id || !hours) return res.status(400).json({ code: -1, msg: '缺少参数' })
    const today = new Date().toISOString().slice(0, 10)
    await getPool().query(
      'INSERT INTO daily_logs (week_plan_id, subject_id, study_date, hours, note, user_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [week_plan_id, subject_id, today, hours, note || '', req.userId, nowStr()]
    )
    // 更新周 actual_hours
    const [sum] = await getPool().query(
      'SELECT COALESCE(SUM(hours),0) as total FROM daily_logs WHERE week_plan_id = ? AND user_id = ?',
      [week_plan_id, req.userId])
    await getPool().query(
      'UPDATE week_plans SET actual_hours = ? WHERE id = ? AND user_id = ?',
      [sum[0].total, week_plan_id, req.userId])
    res.json({ code: 0, msg: '已记录' })
  } catch (err) { res.status(500).json({ code: -1, msg: err.message }) }
})

module.exports = router
