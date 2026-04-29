const express = require('express')
const { getPool } = require('../db')
const router = express.Router()
const nowStr = () => new Date().toISOString().replace('T', ' ').slice(0, 19)

// GET 某年某月的所有计划
router.get('/', async (req, res) => {
  try {
    const { year, month } = req.query
    if (!year || !month) return res.status(400).json({ code: -1, msg: '缺少 year/month 参数' })
    const [rows] = await getPool().query(
      `SELECT mp.*, s.name as subject_name, s.color as subject_color
       FROM month_plans mp JOIN subjects s ON mp.subject_id = s.id
       WHERE mp.year = ? AND mp.month = ? AND mp.user_id = ?
       ORDER BY mp.id`,
      [year, month, req.userId]
    )
    res.json({ code: 0, data: rows })
  } catch (err) { res.status(500).json({ code: -1, msg: err.message }) }
})

// POST 创建月计划 + 自动生成 4 个周计划
router.post('/', async (req, res) => {
  try {
    const { subject_id, year, month, total_hours } = req.body
    if (!subject_id || !year || !month || !total_hours) return res.status(400).json({ code: -1, msg: '缺少参数' })

    const [result] = await getPool().query(
      'INSERT INTO month_plans (subject_id, year, month, total_hours, user_id, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [subject_id, year, month, total_hours, req.userId, nowStr()]
    )
    const monthPlanId = result.insertId

    // 自动均分 4 周
    const weekly = Math.round((total_hours / 4) * 10) / 10
    for (let w = 1; w <= 4; w++) {
      await getPool().query(
        'INSERT INTO week_plans (month_plan_id, week_number, planned_hours, user_id, created_at) VALUES (?, ?, ?, ?, ?)',
        [monthPlanId, w, weekly, req.userId, nowStr()]
      )
    }

    res.json({ code: 0, data: { id: monthPlanId, week_hours: weekly } })
  } catch (err) { res.status(500).json({ code: -1, msg: err.message }) }
})

router.delete('/:id', async (req, res) => {
  try {
    const [result] = await getPool().query('DELETE FROM month_plans WHERE id = ? AND user_id = ?', [req.params.id, req.userId])
    if (result.affectedRows === 0) return res.status(404).json({ code: -1, msg: '计划不存在' })
    res.json({ code: 0, msg: '删除成功' })
  } catch (err) { res.status(500).json({ code: -1, msg: err.message }) }
})

module.exports = router
