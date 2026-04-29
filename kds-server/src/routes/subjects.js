const express = require('express')
const { getPool } = require('../db')
const router = express.Router()

const nowStr = () => new Date().toISOString().replace('T', ' ').slice(0, 19)

router.get('/', async (req, res) => {
  try {
    const [rows] = await getPool().query('SELECT * FROM subjects WHERE user_id = ? ORDER BY id', [req.userId])
    res.json({ code: 0, data: rows })
  } catch (err) { res.status(500).json({ code: -1, msg: err.message }) }
})

router.post('/', async (req, res) => {
  try {
    const { name, color } = req.body
    if (!name) return res.status(400).json({ code: -1, msg: '缺少科目名称' })
    const [result] = await getPool().query(
      'INSERT INTO subjects (name, color, user_id, created_at) VALUES (?, ?, ?, ?)',
      [name, color || '#6366f1', req.userId, nowStr()]
    )
    res.json({ code: 0, data: { id: result.insertId, name, color: color || '#6366f1' } })
  } catch (err) { res.status(500).json({ code: -1, msg: err.message }) }
})

router.delete('/:id', async (req, res) => {
  try {
    const [result] = await getPool().query('DELETE FROM subjects WHERE id = ? AND user_id = ?', [req.params.id, req.userId])
    if (result.affectedRows === 0) return res.status(404).json({ code: -1, msg: '科目不存在' })
    res.json({ code: 0, msg: '删除成功' })
  } catch (err) { res.status(500).json({ code: -1, msg: err.message }) }
})

module.exports = router
