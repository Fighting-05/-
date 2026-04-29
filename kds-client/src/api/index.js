import axios from 'axios'
const api = axios.create({ baseURL: '/api', timeout: 10000 })

// Auth token 拦截器
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kds_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auth
export const register = (email, password) => api.post('/auth/register', { email, password })
export const login = (email, password) => api.post('/auth/login', { email, password })
export const verifyToken = () => api.get('/auth/verify')

// Subjects
export const getSubjects = () => api.get('/subjects')
export const createSubject = (data) => api.post('/subjects', data)
export const deleteSubject = (id) => api.delete(`/subjects/${id}`)

// Month Plans
export const getMonthPlans = (year, month) => api.get('/month-plans', { params: { year, month } })
export const createMonthPlan = (data) => api.post('/month-plans', data)
export const deleteMonthPlan = (id) => api.delete(`/month-plans/${id}`)

// Week Plans
export const getWeekPlans = (month_plan_id) => api.get('/week-plans', { params: { month_plan_id } })
export const updateWeekPlan = (id, planned_hours) => api.patch(`/week-plans/${id}`, { planned_hours })

// Daily Logs
export const getDailyLogs = (params) => api.get('/daily-logs', { params })
export const createDailyLog = (data) => api.post('/daily-logs', data)

// Stats
export const getMonthlyStats = (year, month) => api.get('/stats/monthly', { params: { year, month } })
export const getWeeklyCurve = (month_plan_id) => api.get('/stats/weekly-curve', { params: { month_plan_id } })
export const getMonthHeatmap = (year, month) => api.get('/stats/heatmap', { params: { year, month } })

// Study Tasks
export const getStages = (subject_id) => api.get('/study/stages', { params: subject_id ? { subject_id } : {} })
export const getParentTasks = (stage_id) => api.get('/study/parent-tasks', { params: { stage_id } })
export const createParentTask = (data) => api.post('/study/parent-tasks', data)
export const updateParentTask = (id, data) => api.patch(`/study/parent-tasks/${id}`, data)
export const reorderParentTasks = (ids) => api.patch('/study/parent-tasks/reorder', { ids })
export const deleteParentTask = (id) => api.delete(`/study/parent-tasks/${id}`)
export const getChildTasks = (parent_task_id) => api.get('/study/child-tasks', { params: { parent_task_id } })
export const createChildTask = (data) => api.post('/study/child-tasks', data)
export const updateChildTask = (id, data) => api.patch(`/study/child-tasks/${id}`, data)
export const reorderChildTasks = (ids) => api.patch('/study/child-tasks/reorder', { ids })
export const deleteChildTask = (id) => api.delete(`/study/child-tasks/${id}`)
export const resetChildTaskHours = (id) => api.patch(`/study/child-tasks/${id}/reset-hours`)
export const getDailyTasks = () => api.get('/study/daily')
export const checkinTask = (child_task_id, hours) => api.post('/study/checkin', { child_task_id, hours })
export const uncheckTask = (child_task_id) => api.post('/study/uncheck', { child_task_id })
export const getStudyProgress = (stage_id) => api.get('/study/progress', { params: { stage_id } })
export const resetAllTasks = (stage_id) => api.post('/study/reset-all', { stage_id })
