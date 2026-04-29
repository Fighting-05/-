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

    // 种子：全部科目 + 各阶段模板
    const subjectStages = {
      '数学': { color: '#6366f1', stages: [
        { name: '高数基础', parents: ['教材精读', '基础题训练', '错题整理'] },
        { name: '线代基础', parents: ['教材精读', '基础题训练', '错题整理'] },
        { name: '高数强化', parents: ['李林880题', '张宇1000题', '武忠祥严选题', '专题强化'] },
        { name: '线代强化', parents: ['李永乐线代讲义', '线代习题集', '专题突破'] },
        { name: '真题阶段', parents: ['历年真题训练', '真题分类精讲', '真题模拟考试'] },
        { name: '模拟冲刺阶段', parents: ['模拟卷训练', '压轴题专项', '考前回顾'] },
      ]},
      '408': { color: '#10b981', stages: [
        { name: '数据结构基础', parents: ['教材精读', '算法题训练', '错题整理'] },
        { name: '计算机组成原理基础', parents: ['教材精读', '计算题训练', '错题整理'] },
        { name: '操作系统基础', parents: ['教材精读', 'PV操作专题', '错题整理'] },
        { name: '计算机网络基础', parents: ['教材精读', '计算题训练', '错题整理'] },
        { name: '强化刷题', parents: ['王道综合题', '天勤模拟题', '重难点突破'] },
        { name: '真题模拟阶段', parents: ['历年真题训练', '真题分类精讲', '全真模拟考试'] },
      ]},
      '英语': { color: '#f59e0b', stages: [
        { name: '词汇基础', parents: ['考研词汇5500', '核心词汇1500', '词组搭配'] },
        { name: '语法长难句', parents: ['语法系统学习', '长难句精析', '翻译练习'] },
        { name: '阅读强化', parents: ['阅读理解精练', '新题型训练', '完形填空'] },
        { name: '作文专项', parents: ['小作文模板', '大作文模板', '写作实战'] },
        { name: '真题刷题', parents: ['历年真题训练', '真题精讲', '真题模拟考试'] },
        { name: '模拟冲刺阶段', parents: ['模拟卷训练', '考前押题', '考前回顾'] },
      ]},
      '政治': { color: '#ef4444', stages: [
        { name: '基础知识点', parents: ['马原基础', '毛中特基础', '史纲基础', '思修基础'] },
        { name: '强化刷题', parents: ['肖1000题', '徐涛优题库', '腿姐30天'] },
        { name: '主观题专项', parents: ['马原主观题', '毛中特主观题', '时政热点'] },
        { name: '押题模拟阶段', parents: ['肖四肖八', '徐涛预测卷', '腿姐押题卷'] },
      ]},
    }

    for (const [subjName, subjData] of Object.entries(subjectStages)) {
      // 确保科目存在
      let [rows] = await conn.query("SELECT id FROM subjects WHERE name = ? AND user_id = 1", [subjName])
      let subjectId
      if (rows.length === 0) {
        const [r] = await conn.query("INSERT INTO subjects (name, color, user_id, created_at) VALUES (?, ?, 1, '2026-01-01 00:00:00')", [subjName, subjData.color])
        subjectId = r.insertId
      } else {
        subjectId = rows[0].id
      }

      // 创建阶段
      let stageOrder = 0
      for (const st of subjData.stages) {
        ;[rows] = await conn.query("SELECT id FROM stages WHERE name = ? AND subject_id = ? AND user_id = 1", [st.name, subjectId])
        let stageId
        if (rows.length === 0) {
          const [sr] = await conn.query("INSERT INTO stages (subject_id, name, sort_order, user_id) VALUES (?, ?, ?, 1)", [subjectId, st.name, stageOrder])
          stageId = sr.insertId

          // 创建父任务（高数强化有详细子任务模板，其他阶段有基础父任务）
          let ptOrder = 0
          for (const ptName of st.parents) {
            const [pr] = await conn.query("INSERT INTO parent_tasks (stage_id, name, sort_order, active, user_id) VALUES (?, ?, ?, TRUE, 1)", [stageId, ptName, ptOrder++])
            const parentId = pr.insertId

            // 高数强化阶段：详细子任务章节目录
            if (subjName === '数学' && st.name === '高数强化') {
              const detailed = {
                '李林880题': [
                  { ch: '函数极限连续', ts: ['基础题（选择填空）','综合解答题','错题回顾'] },
                  { ch: '导数与微分', ts: ['基础题（选择填空）','综合解答题','错题回顾'] },
                  { ch: '微分中值定理', ts: ['基础题（选择填空）','综合解答题','错题回顾'] },
                  { ch: '不定积分', ts: ['基础题（选择填空）','综合解答题','错题回顾'] },
                  { ch: '定积分', ts: ['基础题（选择填空）','综合解答题','错题回顾'] },
                  { ch: '微分方程', ts: ['基础题（选择填空）','综合解答题','错题回顾'] },
                  { ch: '多元函数微分', ts: ['基础题（选择填空）','综合解答题','错题回顾'] },
                  { ch: '二重积分', ts: ['基础题（选择填空）','综合解答题','错题回顾'] },
                ],
                '张宇1000题': [
                  { ch: '函数极限连续', ts: ['基础篇','强化篇','错题整理'] },
                  { ch: '导数与微分', ts: ['基础篇','强化篇','错题整理'] },
                  { ch: '微分中值定理', ts: ['基础篇','强化篇','错题整理'] },
                  { ch: '不定积分', ts: ['基础篇','强化篇','错题整理'] },
                ],
                '武忠祥严选题': [
                  { ch: '函数极限连续', ts: ['严选题练习','视频讲解笔记'] },
                  { ch: '导数微分应用', ts: ['严选题练习','视频讲解笔记'] },
                  { ch: '中值定理证明', ts: ['严选题练习','视频讲解笔记'] },
                ],
                '专题强化': [
                  { ch: '极限计算专题', ts: ['洛必达专题','泰勒展开专题','夹逼准则专题'] },
                  { ch: '积分计算专题', ts: ['换元法专题','分部积分专题','有理函数积分'] },
                  { ch: '证明题专题', ts: ['中值定理证明','不等式证明','数列极限证明'] },
                ],
              }
              const detail = detailed[ptName]
              if (detail) {
                let ctOrder = 0
                for (const d of detail) {
                  for (const t of d.ts) {
                    await conn.query("INSERT INTO child_tasks (parent_task_id, name, description, default_hours, sort_order, user_id) VALUES (?, ?, ?, 0.5, ?, 1)", [parentId, d.ch + ' - ' + t, '', ctOrder++])
                  }
                }
              } else {
                await conn.query("INSERT INTO child_tasks (parent_task_id, name, description, default_hours, sort_order, user_id) VALUES (?, ?, ?, 0.5, 0, 1)", [parentId, '默认任务', ''])
              }
            } else {
              // 其他阶段：简单子任务
              await conn.query("INSERT INTO child_tasks (parent_task_id, name, description, default_hours, sort_order, user_id) VALUES (?, ?, ?, 0.5, 0, 1)", [parentId, '默认任务', ''])
            }
          }
        }
        stageOrder++
      }
    }
    console.log('  全部科目阶段模板已就绪')

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
