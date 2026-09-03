import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft as ArrowLeftIcon, 
  BookOpen, 
  Sparkles, 
  Video, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  FileText, 
  Trash2,
  Check,
  ChevronDown,
  Mail,
  Bell,
  ArrowUpRight,
  Calendar
} from 'lucide-react';
import { DetailedProjectItem, ProjectTaskItem } from '../../types';
import TaskNotebookModal from './TaskNotebookModal';

interface ProjectDetailWorkspaceProps {
  project: DetailedProjectItem;
  onBack: () => void;
  onUpdateProject: (updatedProject: DetailedProjectItem) => void;
  onOpenNote?: (path: string) => void;
}

export const ProjectDetailWorkspace: React.FC<ProjectDetailWorkspaceProps> = ({
  project,
  onBack,
  onUpdateProject,
  onOpenNote,
}) => {
  const [selectedTask, setSelectedTask] = useState<ProjectTaskItem | null>(null);
  const [isAddingTask, setIsAddingTask] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');

  const totalTasks = project.tasks.length;
  const completedTasks = project.tasks.filter((t) => t.status === 'completed').length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const isFullyCompleted = totalTasks > 0 && completedTasks === totalTasks;

  const handleUpdateTask = (updatedTask: ProjectTaskItem) => {
    const newTasks = project.tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t));
    const allDone = newTasks.length > 0 && newTasks.every((t) => t.status === 'completed');
    const newProgress = Math.round((newTasks.filter((t) => t.status === 'completed').length / newTasks.length) * 100);

    const updatedProj: DetailedProjectItem = {
      ...project,
      tasks: newTasks,
      progress: newProgress,
      status: allDone ? 'completed' : newProgress > 0 ? 'in-progress' : 'planning',
    };

    onUpdateProject(updatedProj);
    setSelectedTask(updatedTask);
  };

  const handleMoveTask = (taskId: string, targetStatus: 'planning' | 'in-progress' | 'completed') => {
    const newTasks = project.tasks.map((t) => (t.id === taskId ? { ...t, status: targetStatus } : t));
    const allDone = newTasks.length > 0 && newTasks.every((t) => t.status === 'completed');
    const newProgress = Math.round((newTasks.filter((t) => t.status === 'completed').length / newTasks.length) * 100);

    const updatedProj: DetailedProjectItem = {
      ...project,
      tasks: newTasks,
      progress: newProgress,
      status: allDone ? 'completed' : newProgress > 0 ? 'in-progress' : 'planning',
    };

    onUpdateProject(updatedProj);
  };

  const handleCreateTask = (status: 'planning' | 'in-progress' | 'completed') => {
    if (!newTaskTitle.trim()) return;

    const newTask: ProjectTaskItem = {
      id: `task-${Date.now()}`,
      projectId: project.id,
      title: newTaskTitle.trim(),
      description: newTaskDesc.trim(),
      status,
      priority: newTaskPriority,
      attachments: [],
      imageLayout: 'horizontal',
      assignee: { name: 'Zakarya Oukil', role: 'Operator' },
      createdAt: new Date().toISOString(),
    };

    const newTasks = [...project.tasks, newTask];
    const newProgress = Math.round((newTasks.filter((t) => t.status === 'completed').length / newTasks.length) * 100);

    onUpdateProject({
      ...project,
      tasks: newTasks,
      progress: newProgress,
      status: newProgress > 0 ? 'in-progress' : 'planning',
    });

    setNewTaskTitle('');
    setNewTaskDesc('');
    setIsAddingTask(null);
  };

  const handleDeleteTask = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTasks = project.tasks.filter((t) => t.id !== taskId);
    const allDone = newTasks.length > 0 && newTasks.every((t) => t.status === 'completed');
    const newProgress = newTasks.length > 0 
      ? Math.round((newTasks.filter((t) => t.status === 'completed').length / newTasks.length) * 100) 
      : 0;

    onUpdateProject({
      ...project,
      tasks: newTasks,
      progress: newProgress,
      status: allDone ? 'completed' : 'in-progress',
    });
  };

  const planningTasks = project.tasks.filter((t) => t.status === 'planning');
  const inProgressTasks = project.tasks.filter((t) => t.status === 'in-progress');
  const completedTasksList = project.tasks.filter((t) => t.status === 'completed');

  const columns = [
    { id: 'planning' as const, label: 'Planning', icon: AlertCircle, color: 'text-blue-400', tasks: planningTasks },
    { id: 'in-progress' as const, label: 'In Progress', icon: Clock, color: 'text-[#D4FF00]', tasks: inProgressTasks },
    { id: 'completed' as const, label: 'Completed', icon: CheckCircle2, color: 'text-emerald-400', tasks: completedTasksList },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20 animate-fadeIn">
      {/* Top Navigation & Project Info Banner */}
      <div className="bg-white dark:bg-[#12151B] border border-black/[0.07] dark:border-white/[0.08] p-7 rounded-[32px] backdrop-blur-xl shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="px-4 py-2.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] hover:bg-[#D4FF00] hover:text-black text-gray-700 dark:text-gray-200 transition-all flex items-center gap-2 text-xs font-extrabold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Folders</span>
            </button>

            <span className="px-3.5 py-1 rounded-full text-xs font-mono font-bold bg-[#D4FF00] text-black">
              📁 {project.category}
            </span>

            {isFullyCompleted && (
              <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white flex items-center gap-1.5 shadow-[0_0_20px_rgba(16,185,129,0.4)] animate-bounce">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                PROJECT 100% COMPLETED
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {project.sourceNote && onOpenNote && (
              <button
                onClick={() => onOpenNote(project.sourceNote!)}
                className="px-4 py-2 rounded-full bg-black/[0.04] dark:bg-white/[0.06] hover:bg-[#D4FF00] hover:text-black text-gray-800 dark:text-gray-200 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Obsidian Note</span>
              </button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            {project.title}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-3xl">
            {project.description}
          </p>
        </div>

        {/* Dynamic Project Progress Bar */}
        <div className="space-y-2 pt-2 border-t border-black/[0.05] dark:border-white/[0.06]">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-gray-500">Task Completion ({completedTasks}/{totalTasks} Tasks)</span>
            <span className="font-bold text-[#D4FF00]">{progressPercent}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isFullyCompleted ? 'bg-emerald-500' : 'bg-[#D4FF00]'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3-Column Kanban Board with Asymmetric Folder Cards (Matching Image 2) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((col) => {
          const Icon = col.icon;
          const isAddingThisCol = isAddingTask === col.id;

          return (
            <div
              key={col.id}
              className="bg-white/60 dark:bg-[#12151B]/70 border border-black/[0.07] dark:border-white/[0.08] p-5 rounded-[32px] backdrop-blur-xl flex flex-col justify-between space-y-4 shadow-sm"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${col.color}`} />
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-gray-900 dark:text-white">
                    {col.label}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-black/[0.05] dark:bg-white/[0.08] text-gray-600 dark:text-gray-300">
                    {col.tasks.length}
                  </span>
                </div>

                <button
                  onClick={() => setIsAddingTask(col.id)}
                  className="p-1.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] hover:bg-[#D4FF00] hover:text-black text-gray-500 transition-all"
                  title="Add Task"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Add Task Inline Card Form */}
              {isAddingThisCol && (
                <div className="p-5 rounded-2xl bg-white dark:bg-[#1C202A] border border-[#D4FF00]/50 space-y-3 shadow-md animate-fadeIn">
                  <input
                    type="text"
                    required
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Task Title (e.g. Google Meet Call, SQLi Audit)..."
                    className="w-full text-xs font-bold bg-transparent text-gray-900 dark:text-white focus:outline-none border-b border-black/[0.1] dark:border-white/[0.1] pb-1"
                    autoFocus
                  />
                  <textarea
                    value={newTaskDesc}
                    onChange={(e) => setNewTaskDesc(e.target.value)}
                    placeholder="Task notes / summary..."
                    rows={2}
                    className="w-full text-[11px] bg-black/[0.02] dark:bg-white/[0.04] p-2 rounded-xl border border-black/[0.06] dark:border-white/[0.06] text-gray-700 dark:text-gray-300 focus:outline-none"
                  />
                  <div className="flex items-center justify-between pt-1">
                    <select
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value as any)}
                      className="px-2 py-1 text-[10px] font-mono bg-black/[0.04] dark:bg-white/[0.06] rounded-lg text-gray-700 dark:text-gray-300"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsAddingTask(null)}
                        className="px-2.5 py-1 text-[11px] text-gray-500 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCreateTask(col.id)}
                        className="px-3 py-1 bg-[#D4FF00] text-black font-bold text-[11px] rounded-lg shadow-sm"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tasks List with Asymmetric Folder Silhouette (Matching Image 2) */}
              <div className="space-y-4 flex-1 min-h-[300px]">
                {col.tasks.map((task, idx) => {
                  const mediaCount = task.attachments ? task.attachments.length : 0;
                  const hasVideos = task.attachments?.some((a) => a.type === 'video');
                  const hasImages = task.attachments?.some((a) => a.type === 'image');
                  const hasLinks = task.attachments?.some((a) => a.type === 'link');
                  const isLimeCard = col.id === 'in-progress' && idx === 0;

                  return (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className={`
                        group relative p-5 rounded-[28px] cursor-pointer transition-all duration-300 hover:-translate-y-1 shadow-md space-y-4
                        ${isLimeCard
                          ? 'bg-[#D4FF00] text-black shadow-[0_12px_35px_rgba(212,255,0,0.25)]'
                          : 'bg-white dark:bg-[#161922] text-gray-900 dark:text-white border border-black/[0.06] dark:border-white/[0.08]'
                        }
                      `}
                    >
                      {/* Top Row: Assignee Avatar + Shoulder & Notch Action Buttons */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm ${
                            isLimeCard ? 'bg-black text-[#D4FF00]' : 'bg-[#D4FF00] text-black'
                          }`}>
                            {task.assignee?.name.charAt(0) || 'Z'}
                          </div>
                          <div>
                            <span className={`text-xs font-extrabold block leading-tight ${isLimeCard ? 'text-black' : 'text-white'}`}>
                              {task.assignee?.name || 'Zakarya Oukil'}
                            </span>
                            <span className={`text-[10px] font-mono block ${isLimeCard ? 'text-black/70' : 'text-gray-400'}`}>
                              {task.assignee?.role || 'Operator'}
                            </span>
                          </div>
                        </div>

                        {/* Top Notch Action Badges */}
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                            isLimeCard ? 'bg-black/10 text-black' : 'bg-white/10 text-white'
                          }`}>
                            <Bell className="w-3.5 h-3.5" />
                          </div>

                          <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                            isLimeCard ? 'bg-black text-[#D4FF00]' : 'bg-[#D4FF00] text-black'
                          }`}>
                            <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                          </div>

                          <button
                            onClick={(e) => handleDeleteTask(task.id, e)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-400 transition-opacity ml-1"
                            title="Delete Task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Main Task Title & Date/Metadata */}
                      <div className="space-y-2">
                        <h4 className={`font-black text-base leading-snug tracking-tight ${
                          isLimeCard ? 'text-black' : 'text-white'
                        }`}>
                          {task.title}
                        </h4>

                        {task.description && (
                          <p className={`text-xs line-clamp-2 leading-relaxed ${
                            isLimeCard ? 'text-black/80' : 'text-gray-400'
                          }`}>
                            {task.description}
                          </p>
                        )}

                        {task.dueDate && (
                          <div className={`flex items-center gap-1.5 text-[11px] font-mono ${
                            isLimeCard ? 'text-black/80' : 'text-gray-400'
                          }`}>
                            <Calendar className="w-3 h-3" />
                            <span>{task.dueDate}</span>
                          </div>
                        )}
                      </div>

                      {/* Bottom Row: Status Pill Selector & Quick Action Buttons (Mail, Video, Left/Right Move) */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-black/[0.08] dark:border-white/[0.08]">
                        {/* Status Pill */}
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                            isLimeCard ? 'bg-black/10 text-black' : 'bg-white/10 text-white'
                          }`}
                        >
                          <span className="capitalize">
                            {task.status === 'in-progress' ? 'In Progress' : task.status}
                          </span>
                          <ChevronDown className="w-3 h-3 opacity-60" />
                        </div>

                        {/* Action Icons (Media Indicators & Move Arrows) */}
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          {hasVideos && (
                            <div className={`p-1.5 rounded-full ${isLimeCard ? 'bg-black text-[#D4FF00]' : 'bg-black/40 text-[#D4FF00]'}`}>
                              <Video className="w-3 h-3" />
                            </div>
                          )}
                          {hasImages && (
                            <div className={`p-1.5 rounded-full ${isLimeCard ? 'bg-black/10 text-black' : 'bg-white/10 text-cyan-400'}`}>
                              <ImageIcon className="w-3 h-3" />
                            </div>
                          )}

                          {col.id !== 'planning' && (
                            <button
                              onClick={() => handleMoveTask(task.id, col.id === 'completed' ? 'in-progress' : 'planning')}
                              className={`p-1.5 rounded-full transition-all ${
                                isLimeCard ? 'bg-black/10 hover:bg-black text-black hover:text-white' : 'bg-white/10 hover:bg-[#D4FF00] hover:text-black text-gray-300'
                              }`}
                              title="Move Left"
                            >
                              <ArrowLeftIcon className="w-3 h-3" />
                            </button>
                          )}
                          {col.id !== 'completed' && (
                            <button
                              onClick={() => handleMoveTask(task.id, col.id === 'planning' ? 'in-progress' : 'completed')}
                              className={`p-1.5 rounded-full transition-all ${
                                isLimeCard ? 'bg-black/10 hover:bg-black text-black hover:text-white' : 'bg-white/10 hover:bg-[#D4FF00] hover:text-black text-gray-300'
                              }`}
                              title="Move Right"
                            >
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {col.tasks.length === 0 && !isAddingThisCol && (
                  <div className="h-36 border-2 border-dashed border-black/[0.06] dark:border-white/[0.06] rounded-[24px] flex flex-col items-center justify-center text-gray-400 text-xs gap-1.5">
                    <span>No tasks</span>
                    <button
                      onClick={() => setIsAddingTask(col.id)}
                      className="text-xs text-[#D4FF00] hover:underline font-bold"
                    >
                      + Add a task
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Notebook Modal */}
      {selectedTask && (
        <TaskNotebookModal
          task={selectedTask}
          projectTitle={project.title}
          onClose={() => setSelectedTask(null)}
          onUpdateTask={handleUpdateTask}
        />
      )}
    </div>
  );
};

export default ProjectDetailWorkspace;
