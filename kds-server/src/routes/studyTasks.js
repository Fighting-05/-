const express = require('express')
const { getPool } = require('../db')
const router = express.Router()

/* ==================== 阶段 ==================== */
router.get('/stages', async (req, res) => {
  try {
    const { subject_id } = req.query
    let sql = 'SELECT s.*, sub.name as subject_name, sub.color as subject_color FROM stages s JOIN subjects sub ON s.subject_id = sub.id WHERE s.user_id = ?'
    const params = [req.userId]
    if (subject_id) { sql += ' AND s.subject_id = ?'; params.push(subject_id) }
    sql += ' ORDER BY s.sort_order'
    const [rows] = await getPool().query(sql, params)
    res.json({ code: 0, data: rows })
  } catch (err) { res.status(500).json({ code: -1, msg: err.message }) }
})

router.post('/stages', async (req, res) => {
  try {
    const { subject_id, name } = req.body
    if (!subject_id || !name) return res.status(400).json({ code: -1, msg: '缺少参数' })
    const [r] = await getPool().query('SELECT COALESCE(MAX(sort_order),-1)+1 as n FROM stages WHERE subject_id = ? AND user_id = ?', [subject_id, req.userId])
    const [ins] = await getPool().query('INSERT INTO stages (subject_id, name, sort_order, user_id) VALUES (?,?,?,?)', [subject_id, name, r[0].n, req.userId])
    res.json({ code: 0, data: { id: ins.insertId, name } })
  } catch (err) { res.status(500).json({ code: -1, msg: err.message }) }
})

/* ==================== 父任务 ==================== */
router.get('/parent-tasks', async (req, res) => {
  try {
    const { stage_id } = req.query
    if (!stage_id) return res.status(400).json({ code: -1, msg: '缺少 stage_id' })
    const [rows] = await getPool().query(
      'SELECT * FROM parent_tasks WHERE stage_id = ? AND user_id = ? ORDER BY sort_order',
      [stage_id, req.userId]
    )
    res.json({ code: 0, data: rows })
  } catch (err) { res.status(500).json({ code: -1, msg: err.message }) }
})

router.post('/parent-tasks', async (req, res) => {
  try {
    const { stage_id, name } = req.body
    const [r] = await getPool().query('SELECT COALESCE(MAX(sort_order),-1)+1 as n FROM parent_tasks WHERE stage_id = ? AND user_id = ?', [stage_id, req.userId])
    await getPool().query('INSERT INTO parent_tasks (stage_id, name, sort_order, active, user_id) VALUES (?,?,?,TRUE,?)', [stage_id, name, r[0].n, req.userId])
    res.json({ code: 0, msg: '已创建' })
  } catch (err) { res.status(500).json({ code: -1, msg: err.message }) }
})

router.patch('/parent-tasks/:id', async (req, res) => {
  try {
    const { name, active, sort_order } = req.body
    const sets = []; const vals = []
    if (name !== undefined) { sets.push('name=?'); vals.push(name) }
    if (active !== undefined) { sets.push('active=?'); vals.push(active) }
    if (sort_order !== undefined) { sets.push('sort_order=?'); vals.push(sort_order) }
    if (sets.length === 0) return res.status(400).json({ code: -1, msg: '无更新字段' })
    vals.push(req.params.id, req.userId)
    await getPool().query(`UPDATE parent_tasks SET ${sets.join(',')} WHERE id=? AND user_id=?`, vals)
    res.json({ code: 0, msg: '已更新' })
  } catch (err) { res.status(500).json({ code: -1, msg: err.message }) }
})

router.patch('/parent-tasks/reorder', async (req, res) => {
  try {
    const { ids } = req.body  // 按新顺序排列的 id 数组
    for (let i = 0; i < ids.length; i++) {
      await getPool().query('UPDATE parent_tasks SET sort_order=? WHERE id=? AND user_id=?', [i, ids[i], req.userId])
    }
    res.json({ code: 0, msg: '已排序' })
  } catch (err) { res.status(500).json({ code: -1, msg: err.message }) }
})

router.delete('/parent-tasks/:id', async (req, res) => {
  try {
    await getPool().query('DELETE FROM parent_tasks WHERE id=? AND user_id=?', [req.params.id, req.userId])
    res.json({ code: 0, msg: '已删除' })
  } catch (err) { res.status(500).json({ code: -1, msg: err.message }) }
})

// 一键恢复默认父任务
router.post('/parent-tasks/reset', async (req, res) => {
  try {
    const { stage_id } = req.body
    // 删除该阶段所有自定义父任务，保留 seed 模板中的数据
    await getPool().query('DELETE FROM parent_tasks WHERE stage_id=? AND user_id=?', [stage_id, req.userId])

    const defaults = [
      { name: '李林880题', chapters: [
        ['函数极限连续 - 基础题（选择填空）','函数极限连续 - 综合解答题','函数极限连续 - 错题回顾'],
      ]},
    ]
    res.json({ code: 0, msg: '功能开发中，请删除数据库后重启以重置模板' })
  } catch (err) { res.status(500).json({ code: -1, msg: err.message }) }
})

/* ==================== 子任务 ==================== */
router.get('/child-tasks', async (req, res) => {
  try {
    const { parent_task_id } = req.query
    if (!parent_task_id) return res.status(400).json({ code: -1, msg: '缺少 parent_task_id' })
    const [rows] = await getPool().query(
      'SELECT * FROM child_tasks WHERE parent_task_id = ? AND user_id = ? ORDER BY sort_order',
      [parent_task_id, req.userId]
    )
    res.json({ code: 0, data: rows })
  } catch (err) { res.status(500).json({ code: -1, msg: err.message }) }
})

router.post('/child-tasks', async (req, res) => {
  try {
    const { parent_task_id, name, description, default_hours } = req.body
    const [r] = await getPool().query('SELECT COALESCE(MAX(sort_order),-1)+1 as n FROM child_tasks WHERE parent_task_id = ? AND user_id = ?', [parent_task_id, req.userId])
    const [ins] = await getPool().query(
      'INSERT INTO child_tasks (parent_task_id, name, description, default_hours, sort_order, user_id) VALUES (?,?,?,?,?,?)',
      [parent_task_id, name, description || '', default_hours || 0.5, r[0].n, req.userId]
    )
    res.json({ code: 0, data: { id: ins.insertId } })
  } catch (err) { res.status(500).json({ code: -1, msg: err.message }) }
})

router.patch('/child-tasks/:id', async (req, res) => {
  try {
    const { name, description, custom_hours, sort_order, completed, actual_hours, study_date } = req.body
    const sets = []; const vals = []
    if (name !== undefined) { sets.push('name=?'); vals.push(name) }
    if (description !== undefined) { sets.push('description=?'); vals.push(description) }
    if (custom_hours !== undefined) { sets.push('custom_hours=?'); vals.push(custom_hours) }
    if (sort_order !== undefined) { sets.push('sort_order=?'); vals.push(sort_order) }
    if (completed !== undefined) { sets.push('completed=?'); vals.push(completed) }
    if (actual_hours !== undefined) { sets.push('actual_hours=?'); vals.push(actual_hours) }
    if (study_date !== undefined) { sets.push('study_date=?'); vals.push(study_date) }
    if (sets.length === 0) return res.status(400).json({ code: -1, msg: '无更新字段' })
    vals.push(req.params.id, req.userId)
    await getPool().query(`UPDATE child_tasks SET ${sets.join(',')} WHERE id=? AND user_id=?`, vals)
    res.json({ code: 0, msg: '已更新' })
  } catch (err) { res.status(500).json({ code: -1, msg: err.message }) }
})

router.patch('/child-tasks/reorder', async (req, res) => {
  try {
    const { ids } = req.body
    for (let i = 0; i < ids.length; i++) {
      await getPool().query('UPDATE child_tasks SET sort_order=? WHERE id=? AND user_id=?', [i, ids[i], req.userId])
    }
    res.json({ code: 0, msg: '已排序' })
  } catch (err) { res.status(500).json({ code: -1, msg: err.message }) }
})

router.delete('/child-tasks/:id', async (req, res) => {
  try {
    await getPool().query('DELETE FROM child_tasks WHERE id=? AND user_id=?', [req.params.id, req.userId])
    res.json({ code: 0, msg: '已删除' })
  } catch (err) { res.status(500).json({ code: -1, msg: err.message }) }
})

// 重置单个子任务为默认时长
router.patch('/child-tasks/:id/reset-hours', async (req, res) => {
  try {
    await getPool().query('UPDATE child_tasks SET custom_hours = NULL WHERE id=? AND user_id=?', [req.params.id, req.userId])
    res.json({ code: 0, msg: '已恢复默认时长' })
  } catch (err) { res.status(500).json({ code: -1, msg: err.message }) }
})

/* ==================== 每日推送 ==================== */
router.get('/daily', async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10)

    // 今天已打的卡
    const [checked] = await getPool().query(
      'SELECT * FROM child_tasks WHERE study_date = ? AND user_id = ? ORDER BY sort_order',
      [today, req.userId]
    )
    if (checked.length > 0) {
      return res.json({ code: 0, data: { tasks: checked, source: 'today' } })
    }

    // 未完成的子任务（排除已完成的）
    const [pending] = await getPool().query(
      `SELECT ct.*, pt.name as parent_name, pt.active
       FROM child_tasks ct
       JOIN parent_tasks pt ON ct.parent_task_id = pt.id
       WHERE ct.completed = FALSE AND ct.user_id = ? AND pt.active = TRUE
       ORDER BY pt.sort_order, ct.sort_order
       LIMIT 8`,
      [req.userId]
    )
    res.json({ code: 0, data: { tasks: pending, source: 'pending' } })
  } catch (err) { res.status(500).json({ code: -1, msg: err.message }) }
})

/* ==================== 打卡 ==================== */
router.post('/checkin', async (req, res) => {
  try {
    const { child_task_id, hours } = req.body
    const today = new Date().toISOString().slice(0, 10)
    await getPool().query(
      'UPDATE child_tasks SET completed = TRUE, actual_hours = ?, study_date = ? WHERE id = ? AND user_id = ?',
      [hours || 0, today, child_task_id, req.userId]
    )
    res.json({ code: 0, msg: '打卡成功' })
  } catch (err) { res.status(500).json({ code: -1, msg: err.message }) }
})

// 取消打卡
router.post('/uncheck', async (req, res) => {
  try {
    const { child_task_id } = req.body
    await getPool().query(
      'UPDATE child_tasks SET completed = FALSE, actual_hours = 0, study_date = NULL WHERE id = ? AND user_id = ?',
      [child_task_id, req.userId]
    )
    res.json({ code: 0, msg: '已取消' })
  } catch (err) { res.status(500).json({ code: -1, msg: err.message }) }
})

/* ==================== 进度统计 ==================== */
router.get('/progress', async (req, res) => {
  try {
    const { stage_id } = req.query
    let where = 'ct.user_id = ?'
    const params = [req.userId]
    if (stage_id) {
      where += ' AND pt.stage_id = ?'
      params.push(stage_id)
    }

    const [rows] = await getPool().query(
      `SELECT pt.id as parent_id, pt.name as parent_name, pt.active,
        COUNT(ct.id) as total,
        SUM(CASE WHEN ct.completed THEN 1 ELSE 0 END) as done,
        SUM(COALESCE(ct.custom_hours, ct.default_hours)) as total_hours,
        SUM(CASE WHEN ct.completed THEN COALESCE(ct.custom_hours, ct.default_hours) ELSE 0 END) as done_hours
       FROM parent_tasks pt
       LEFT JOIN child_tasks ct ON ct.parent_task_id = pt.id AND ct.user_id = ?
       WHERE ${where}
       GROUP BY pt.id, pt.name, pt.active
       ORDER BY pt.sort_order`,
      [req.userId, ...params]
    )
    res.json({ code: 0, data: rows })
  } catch (err) { res.status(500).json({ code: -1, msg: err.message }) }
})

/* ==================== 整体重置 ==================== */
router.post('/reset-all', async (req, res) => {
  try {
    const { stage_id } = req.body
    await getPool().query('DELETE FROM child_tasks WHERE parent_task_id IN (SELECT id FROM parent_tasks WHERE stage_id = ? AND user_id = ?)', [stage_id, req.userId])
    await getPool().query('DELETE FROM parent_tasks WHERE stage_id = ? AND user_id = ?', [stage_id, req.userId])
    res.json({ code: 0, msg: '已清空，请重新创建或重启服务器恢复模板' })
  } catch (err) { res.status(500).json({ code: -1, msg: err.message }) }
})

module.exports = router
