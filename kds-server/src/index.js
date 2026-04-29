const express = require('express')
const cors = require('cors')
const { initDB } = require('./db')

const app = express()
const PORT = 3000

app.use(cors())
app.use(express.json())

// 公开路由
app.use('/api/auth', require('./routes/auth'))

// 需要登录
const auth = require('./middleware/auth')
app.use('/api/subjects', auth, require('./routes/subjects'))
app.use('/api/month-plans', auth, require('./routes/monthPlans'))
app.use('/api/week-plans', auth, require('./routes/weekPlans'))
app.use('/api/daily-logs', auth, require('./routes/dailyLogs'))
app.use('/api/stats', auth, require('./routes/stats'))
app.use('/api/tasks', auth, require('./routes/tasks'))
app.use('/api/study', auth, require('./routes/studyTasks'))

app.get('/', (req, res) => res.json({ msg: 'KDS v2 Server Running' }))

async function start() {
  await initDB()
  app.listen(PORT, () => console.log(`KDS 后端已启动: http://localhost:${PORT}`))
}

start()
