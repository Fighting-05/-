const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { getPool } = require('../db')
const router = express.Router()

const JWT_SECRET = process.env.JWT_SECRET || 'kds_secret_key_2026'
const nowStr = () => new Date().toISOString().replace('T', ' ').slice(0, 19)

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ code: -1, msg: '邮箱和密码不能为空' })
    }
    if (password.length < 4) {
      return res.status(400).json({ code: -1, msg: '密码至少 4 位' })
    }

    const [existing] = await getPool().query('SELECT id FROM users WHERE email = ?', [email])
    if (existing.length > 0) {
      return res.status(409).json({ code: -1, msg: '该邮箱已被注册' })
    }

    const hash = await bcrypt.hash(password, 10)
    const [result] = await getPool().query(
      'INSERT INTO users (email, password, created_at) VALUES (?, ?, ?)',
      [email, hash, nowStr()]
    )

    const token = jwt.sign({ id: result.insertId, email }, JWT_SECRET, { expiresIn: '7d' })
    res.json({ code: 0, data: { id: result.insertId, email, token } })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误，请稍后重试' })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ code: -1, msg: '邮箱和密码不能为空' })
    }

    const [rows] = await getPool().query('SELECT * FROM users WHERE email = ?', [email])
    if (rows.length === 0) {
      return res.status(401).json({ code: -1, msg: '邮箱或密码错误' })
    }

    const user = rows[0]
    const match = await bcrypt.compare(password, user.password)
    if (!match) {
      return res.status(401).json({ code: -1, msg: '邮箱或密码错误' })
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' })
    res.json({ code: 0, data: { id: user.id, email: user.email, token } })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误，请稍后重试' })
  }
})

// GET /api/auth/verify — 验证 token 有效性
router.get('/verify', (req, res) => {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ code: -1, msg: '未提供 Token' })
  }
  try {
    const decoded = jwt.verify(auth.slice(7), JWT_SECRET)
    res.json({ code: 0, data: { id: decoded.id, email: decoded.email } })
  } catch {
    res.status(401).json({ code: -1, msg: 'Token 无效或已过期' })
  }
})

module.exports = router
