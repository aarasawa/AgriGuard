import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { motion } from 'motion/react'
import { CheckCircle2, Circle, ListTodo } from 'lucide-react'

export const Todos = () => {
  const [todos, setTodos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function getTodos() {
      setLoading(true)
      try {
        const { data: todos, error } = await supabase.from('todos').select()
        if (error) throw error
        if (todos) {
          setTodos(todos)
        }
      } catch (error) {
        console.error('Error fetching todos:', error)
      } finally {
        setLoading(false)
      }
    }

    getTodos()
  }, [])

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center">
          <ListTodo className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Supabase Todos</h1>
          <p className="opacity-70">A simple task list powered by Supabase.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
          <span className="text-sm font-medium opacity-60">
            {loading ? 'Loading tasks...' : `${todos.length} tasks found`}
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-4">
              <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <p className="text-sm opacity-50">Connecting to Supabase...</p>
            </div>
          ) : todos.length > 0 ? (
            todos.map((todo, index) => (
              <motion.div
                key={todo.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-6 flex items-center gap-4 group hover:bg-primary/5 transition-colors"
              >
                {todo.completed ? (
                  <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
                ) : (
                  <Circle className="w-6 h-6 opacity-20 shrink-0" />
                )}
                <span className={todo.completed ? "line-through opacity-40" : "font-medium"}>
                  {todo.name}
                </span>
              </motion.div>
            ))
          ) : (
            <div className="p-12 text-center space-y-2">
              <p className="font-semibold">No todos found</p>
              <p className="text-sm opacity-50">Make sure your Supabase 'todos' table has data.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
