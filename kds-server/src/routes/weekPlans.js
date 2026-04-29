const express = require('express')
const { getPool } = require('../db')
const router = express.Router()

// GET 某月计划的所有周
router.get('/', async (req, res) => {
  try {
    const { month_plan_id } = req.query
    if (!month_plan_id) return res.status(400).json({ code: -1, msg: '缺少 month_plan_id' })

    const [weeks] = await getPool().query(
      `SELECT wp.*,
        (SELECT COALESCE(SUM(dl.hours), 0) FROM daily_logs dl WHERE dl.week_plan_id = wp.id) as actual_hours
       FROM week_plans wp WHERE wp.month_plan_id = ? AND wp.user_id = ? ORDER BY wp.week_number`,
      [month_plan_id, req.userId]
    )

    // 动态缓冲算法
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const currentWeek = getCurrentWeekOfMonth(today)
    const currentMonth = today.getMonth() + 1

    // 取 month_plan 的 year/month
    const [mpRow] = await getPool().query(
      'SELECT year, month FROM month_plans WHERE id = ? AND user_id = ?',
      [month_plan_id, req.userId]
    )
    if (!mpRow.length) return res.json({ code: 0, data: [] })

    const planMonth = mpRow[0].month

    // 只对当月进行计算
    if (planMonth === currentMonth) {
      for (let i = 0; i < weeks.length; i++) {
        const w = weeks[i]
        if (w.week_number < currentWeek) {
          const delta = w.planned_hours - w.actual_hours
          if (delta > 0 && i + 1 < weeks.length) {
            const remainingWeeks = weeks.length - (i + 1)
            const perWeek = Math.round((delta / remainingWeeks) * 10) / 10
            for (let j = i + 1; j < weeks.length; j++) {
              weeks[j].planned_hours += perWeek
              weeks[j].buffered = true
              weeks[j].buffer_amount = (weeks[j].buffer_amount || 0) + perWeek
            }
          }
        }
      }
    }

    for (const w of weeks) {
      const daysInWeek = 7
      const perDay = w.planned_hours / daysInWeek
      w.overloaded = perDay > 8
      w.per_day = Math.round(perDay * 10) / 10
      w.completion_pct = w.planned_hours > 0 ? Math.min(100, Math.round((w.actual_hours / w.planned_hours) * 100)) : 0
    }

    // 更新 actual_hours
    for (const w of weeks) {
      await getPool().query('UPDATE week_plans SET actual_hours = ? WHERE id = ? AND user_id = ?',
        [w.actual_hours, w.id, req.userId])
    }

    res.json({ code: 0, data: weeks })
  } catch (err) { res.status(500).json({ code: -1, msg: err.message }) }
})

// PATCH 调整周计划工时
router.patch('/:id', async (req, res) => {
  try {
    const { planned_hours } = req.body
    const [result] = await getPool().query(
      'UPDATE week_plans SET planned_hours = ?, is_adjusted = TRUE WHERE id = ? AND user_id = ?',
      [planned_hours, req.params.id, req.userId])
    if (result.affectedRows === 0) return res.status(404).json({ code: -1, msg: '周计划不存在' })
    res.json({ code: 0, msg: '已调整' })
  } catch (err) { res.status(500).json({ code: -1, msg: err.message }) }
})

function getCurrentWeekOfMonth(date) { return Math.ceil(date.getDate() / 7) }

module.exports = router
