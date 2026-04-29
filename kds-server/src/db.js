const mysql = require('mysql2/promise')
const DB_HOST = 'localhost'; const DB_USER = 'root'; const DB_PASS = '123456'; const DB_NAME = 'kds'
let pool

async function initDB() {
  const tempPool = mysql.createPool({ host: DB_HOST, user: DB_USER, password: DB_PASS })
  const conn = await tempPool.getConnection()
  try {
    console.log('MySQL 连接成功')
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``)
    await conn.query(`USE \`${DB_NAME}\``)

    // 科目表
    await conn.query(`CREATE TABLE IF NOT EXISTS subjects (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(50) NOT NULL,
      color VARCHAR(20) NOT NULL DEFAULT '#6366f1',
      created_at VARCHAR(19) NOT NULL
    )`)

    // 月计划
    await conn.query(`CREATE TABLE IF NOT EXISTS month_plans (
      id INT AUTO_INCREMENT PRIMARY KEY,
      subject_id INT NOT NULL,
      year INT NOT NULL,
      month INT NOT NULL,
      total_hours DOUBLE NOT NULL,
      created_at VARCHAR(19) NOT NULL,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    )`)

    // 周计划
    await conn.query(`CREATE TABLE IF NOT EXISTS week_plans (
      id INT AUTO_INCREMENT PRIMARY KEY,
      month_plan_id INT NOT NULL,
      week_number INT NOT NULL,
      planned_hours DOUBLE NOT NULL,
      actual_hours DOUBLE DEFAULT 0,
      is_adjusted BOOLEAN DEFAULT FALSE,
      created_at VARCHAR(19) NOT NULL,
      FOREIGN KEY (month_plan_id) REFERENCES month_plans(id) ON DELETE CASCADE
    )`)

    // 日记录
    await conn.query(`CREATE TABLE IF NOT EXISTS daily_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      week_plan_id INT NOT NULL,
      subject_id INT NOT NULL,
      study_date VARCHAR(10) NOT NULL,
      hours DOUBLE NOT NULL,
      note VARCHAR(255) DEFAULT '',
      created_at VARCHAR(19) NOT NULL,
      INDEX idx_date (study_date),
      FOREIGN KEY (week_plan_id) REFERENCES week_plans(id) ON DELETE CASCADE
    )`)

    // 用户表
    await conn.query(`CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      created_at VARCHAR(19) NOT NULL
    )`)

    // 任务表
    await conn.query(`CREATE TABLE IF NOT EXISTS tasks (
      id VARCHAR(36) PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      totalHours DOUBLE NOT NULL,
      remainingHours DOUBLE NOT NULL,
      deadline VARCHAR(10) NOT NULL,
      completed BOOLEAN DEFAULT FALSE,
      createdAt VARCHAR(19) NOT NULL
    )`)

    // 学习日志表（任务系统）
    await conn.query(`CREATE TABLE IF NOT EXISTS study_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      task_id VARCHAR(36) NOT NULL,
      task_title VARCHAR(200) NOT NULL,
      hours DOUBLE NOT NULL,
      study_date VARCHAR(10) NOT NULL,
      created_at VARCHAR(19) NOT NULL,
      INDEX idx_task (task_id),
      INDEX idx_date (study_date)
    )`)

    // 阶段表
    await conn.query(`CREATE TABLE IF NOT EXISTS stages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      subject_id INT NOT NULL,
      name VARCHAR(50) NOT NULL,
      sort_order INT DEFAULT 0,
      user_id INT NOT NULL,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    )`)

    // 父任务表
    await conn.query(`CREATE TABLE IF NOT EXISTS parent_tasks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      stage_id INT NOT NULL,
      name VARCHAR(100) NOT NULL,
      sort_order INT DEFAULT 0,
      active BOOLEAN DEFAULT TRUE,
      user_id INT NOT NULL,
      FOREIGN KEY (stage_id) REFERENCES stages(id) ON DELETE CASCADE
    )`)

    // 子任务表
    await conn.query(`CREATE TABLE IF NOT EXISTS child_tasks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      parent_task_id INT NOT NULL,
      name VARCHAR(200) NOT NULL,
      description VARCHAR(500) DEFAULT '',
      default_hours DOUBLE DEFAULT 0.5,
      custom_hours DOUBLE NULL,
      sort_order INT DEFAULT 0,
      completed BOOLEAN DEFAULT FALSE,
      actual_hours DOUBLE DEFAULT 0,
      study_date VARCHAR(10) NULL,
      user_id INT NOT NULL,
      FOREIGN KEY (parent_task_id) REFERENCES parent_tasks(id) ON DELETE CASCADE
    )`)

    console.log('全部表已就绪: subjects, month_plans, week_plans, daily_logs, users, tasks, study_logs, stages, parent_tasks, child_tasks')

    // 迁移：为现有表添加 user_id 列
    const tables = ['subjects', 'month_plans', 'week_plans', 'daily_logs', 'tasks', 'study_logs', 'stages', 'parent_tasks', 'child_tasks']
    for (const table of tables) {
      try {
        await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN user_id INT NOT NULL DEFAULT 1`)
      } catch (err) {
        if (err.code !== 'ER_DUP_FIELDNAME') console.log(`  ⚠ ${table}.user_id: ${err.message}`)
      }
    }
    console.log('user_id 迁移完成')

    // 种子：默认科目"数学" + 高数强化阶段模板
    const [subjRows] = await conn.query("SELECT id FROM subjects WHERE name = '数学' AND user_id = 1")
    let mathSubjectId
    if (subjRows.length === 0) {
      const [r] = await conn.query("INSERT INTO subjects (name, color, user_id, created_at) VALUES ('数学', '#6366f1', 1, '2026-01-01 00:00:00')")
      mathSubjectId = r.insertId
    } else {
      mathSubjectId = subjRows[0].id
    }

    const [stRows] = await conn.query("SELECT id FROM stages WHERE name = '高数强化阶段' AND user_id = 1")
    if (stRows.length === 0) {
      const [sr] = await conn.query("INSERT INTO stages (subject_id, name, sort_order, user_id) VALUES (?, '高数强化阶段', 1, 1)", [mathSubjectId])
      const stageId = sr.insertId

      const parents = [
        { name: '李林880题', chapters: [
          { name: '函数极限连续', tasks: ['基础题（选择填空）','综合解答题','错题回顾'] },
          { name: '导数与微分', tasks: ['基础题（选择填空）','综合解答题','错题回顾'] },
          { name: '微分中值定理', tasks: ['基础题（选择填空）','综合解答题','错题回顾'] },
          { name: '不定积分', tasks: ['基础题（选择填空）','综合解答题','错题回顾'] },
          { name: '定积分', tasks: ['基础题（选择填空）','综合解答题','错题回顾'] },
          { name: '微分方程', tasks: ['基础题（选择填空）','综合解答题','错题回顾'] },
          { name: '多元函数微分', tasks: ['基础题（选择填空）','综合解答题','错题回顾'] },
          { name: '二重积分', tasks: ['基础题（选择填空）','综合解答题','错题回顾'] },
        ]},
        { name: '张宇1000题', chapters: [
          { name: '函数极限连续', tasks: ['基础篇','强化篇','错题整理'] },
          { name: '导数与微分', tasks: ['基础篇','强化篇','错题整理'] },
          { name: '微分中值定理', tasks: ['基础篇','强化篇','错题整理'] },
          { name: '不定积分', tasks: ['基础篇','强化篇','错题整理'] },
        ]},
        { name: '武忠祥严选题', chapters: [
          { name: '函数极限连续', tasks: ['严选题练习','视频讲解笔记'] },
          { name: '导数微分应用', tasks: ['严选题练习','视频讲解笔记'] },
          { name: '中值定理证明', tasks: ['严选题练习','视频讲解笔记'] },
        ]},
        { name: '专题强化', chapters: [
          { name: '极限计算专题', tasks: ['洛必达专题','泰勒展开专题','夹逼准则专题'] },
          { name: '积分计算专题', tasks: ['换元法专题','分部积分专题','有理函数积分'] },
          { name: '证明题专题', tasks: ['中值定理证明','不等式证明','数列极限证明'] },
        ]},
      ]

      let ptOrder = 0
      for (const pt of parents) {
        const [pr] = await conn.query(
          "INSERT INTO parent_tasks (stage_id, name, sort_order, active, user_id) VALUES (?, ?, ?, TRUE, 1)",
          [stageId, pt.name, ptOrder++]
        )
        let ctOrder = 0
        for (const ch of pt.chapters) {
          for (const t of ch.tasks) {
            await conn.query(
              "INSERT INTO child_tasks (parent_task_id, name, description, default_hours, sort_order, user_id) VALUES (?, ?, ?, 0.5, ?, 1)",
              [pr.insertId, ch.name + ' - ' + t, '', ctOrder++]
            )
          }
        }
      }
      console.log('  高数强化阶段种子数据已创建')
    } else {
      console.log('  高数强化阶段已存在，跳过种子')
    }

    await tempPool.end()
  } catch (err) {
    console.error('数据库初始化失败:', err.message)
    process.exit(1)
  } finally { conn.release() }

  pool = mysql.createPool({
    host: DB_HOST, user: DB_USER, password: DB_PASS, database: DB_NAME,
    waitForConnections: true, connectionLimit: 10
  })
}

function getPool() { if (!pool) throw new Error('数据库未初始化'); return pool }
module.exports = { initDB, getPool }
