const jwt = require('jsonwebtoken')
const JWT_SECRET = process.env.JWT_SECRET || 'kds_secret_key_2026'

module.exports = (req, res, next) => {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ code: -1, msg: '请先登录' })
  }
  try {
    req.user = jwt.verify(auth.slice(7), JWT_SECRET)
    req.userId = req.user.id
    next()
  } catch {
    res.status(401).json({ code: -1, msg: '登录已过期，请重新登录' })
  }
}
