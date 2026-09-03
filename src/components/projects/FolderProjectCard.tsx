import React from 'react';
import { 
  ArrowUpRight, 
  Bell, 
  ChevronDown, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileText, 
  MoreHorizontal, 
  Layers,
  Sparkles,
  Calendar,
  BookOpen,
  Kanban
} from 'lucide-react';
import { DetailedProjectItem } from '../../types';

interface FolderProjectCardProps {
  project: DetailedProjectItem;
  variant?: 'lime' | 'blue' | 'dark' | 'red';
  onOpenProject: (project: DetailedProjectItem) => void;
  onOpenNote?: (path: string) => void;
}

export const FolderProjectCard: React.FC<FolderProjectCardProps> = ({
  project,
  variant = 'lime',
  onOpenProject,
  onOpenNote,
}) => {
  const totalTasks = project.tasks.length;
  const completedTasks = project.tasks.filter((t) => t.status === 'completed').length;
  const inProgressTasks = project.tasks.filter((t) => t.status === 'in-progress').length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : project.progress;
  const isCompleted = progressPercent === 100;

  // Variant gradient backplate styles
  const gradientStyles = {
    lime: 'from-[#D4FF00]/40 via-[#A3E635]/20 to-emerald-950/40',
    blue: 'from-blue-500/40 via-cyan-500/25 to-slate-950/40',
    red: 'from-rose-500/40 via-orange-500/25 to-neutral-950/40',
    dark: 'from-zinc-600/30 via-slate-800/20 to-neutral-950/50',
  };

  const accentPills = {
    lime: 'bg-[#D4FF00] text-black shadow-[0_0_15px_rgba(212,255,0,0.35)]',
    blue: 'bg-cyan-400 text-black shadow-[0_0_15px_rgba(34,211,238,0.35)]',
    red: 'from-rose-400 text-white shadow-[0_0_15px_rgba(244,63,94,0.35)]',
    dark: 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.2)]',
  };

  return (
    <div
      onClick={() => onOpenProject(project)}
      className="group relative cursor-pointer select-none transition-all duration-300 hover:-translate-y-2 focus:outline-none"
    >
      {/* 3D Real Folder Outer Card */}
      <div 
        className="relative overflow-hidden bg-white dark:bg-[#12151B] border border-black/[0.08] dark:border-white/[0.1] shadow-[0_16px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.7)] transition-all duration-300"
        style={{ borderRadius: '32px' }}
      >
        {/* Top Floating Action Buttons (Bell & Arrow) */}
        <div className="absolute top-3.5 right-4 z-30 flex items-center gap-2">
          {inProgressTasks > 0 && (
            <div
              className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white flex items-center justify-center shadow-sm"
              title={`${inProgressTasks} Tasks in Progress`}
            >
              <div className="relative">
                <Bell className="w-3.5 h-3.5" />
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              </div>
            </div>
          )}

          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${accentPills[variant]}`}
          >
            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>

        {/* 🎨 1. Top Colorful Gradient Backplate with Real Document Sheets */}
        <div className={`relative h-44 w-full overflow-hidden bg-gradient-to-b ${gradientStyles[variant]} p-4 flex items-end justify-center`}>
          {/* Subtle ambient light glow */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

          {/* 📄 Layered Paper Document Sheets Tucked Behind Front Pocket */}
          <div className="relative w-full max-w-[240px] h-32 flex items-end justify-center z-10">
            {/* Sheet 1: Left Tilted Paper */}
            <div className="absolute w-40 h-28 bg-white/90 dark:bg-[#E5E7EB] rounded-2xl shadow-md -rotate-6 -translate-x-6 translate-y-3 p-3 border border-black/10 transition-all duration-300 group-hover:-translate-y-2 group-hover:-rotate-12">
              <div className="w-10 h-1.5 bg-gray-300 rounded mb-2" />
              <div className="space-y-1">
                <div className="w-full h-1 bg-gray-200 rounded" />
                <div className="w-3/4 h-1 bg-gray-200 rounded" />
                <div className="w-5/6 h-1 bg-gray-200 rounded" />
              </div>
            </div>

            {/* Sheet 2: Right Tilted Paper */}
            <div className="absolute w-40 h-28 bg-white/90 dark:bg-[#E5E7EB] rounded-2xl shadow-md rotate-6 translate-x-6 translate-y-3 p-3 border border-black/10 transition-all duration-300 group-hover:-translate-y-2 group-hover:rotate-12">
              <div className="w-12 h-1.5 bg-gray-300 rounded mb-2" />
              <div className="space-y-1">
                <div className="w-full h-1 bg-gray-200 rounded" />
                <div className="w-4/5 h-1 bg-gray-200 rounded" />
                <div className="w-2/3 h-1 bg-gray-200 rounded" />
              </div>
            </div>

            {/* Sheet 3: Center Front Active Paper with Project Content */}
            <div className="relative z-10 w-44 h-28 bg-white rounded-2xl shadow-xl p-3.5 border border-black/15 transition-all duration-300 group-hover:-translate-y-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-mono font-bold text-gray-700 truncate max-w-[100px]">
                  {project.tasks[0]?.title || 'Task Blueprint'}
                </span>
                <span className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-[#D4FF00]'}`} />
              </div>
              <div className="space-y-1.5">
                <div className="w-full h-1.5 bg-gray-200 rounded" />
                <div className="w-4/5 h-1.5 bg-gray-200 rounded" />
                <div className="w-3/5 h-1.5 bg-gray-200 rounded" />
                <div className="w-2/3 h-1.5 bg-gray-100 rounded" />
              </div>
            </div>
          </div>
        </div>

        {/* 🗂️ 2. Front Pocket of the Folder (Authentic Folder Tab Silhouette) */}
        <div className="relative z-20 -mt-7">
          {/* Authentic SVG Tab Contour on Top of the Pocket */}
          <div className="relative">
            <svg
              className="w-full h-8 text-[#0F1217] dark:text-[#161922] fill-current drop-shadow-[0_-4px_6px_rgba(0,0,0,0.15)]"
              viewBox="0 0 400 40"
              preserveAspectRatio="none"
            >
              {/* Folder Tab Path: Elevated left tab with smooth curve sloping down to right */}
              <path d="M 0,40 L 0,16 Q 0,0 16,0 L 140,0 Q 160,0 175,16 Q 190,32 210,32 L 384,32 Q 400,32 400,40 Z" />
            </svg>
          </div>

          {/* Main Pocket Body */}
          <div className="bg-[#0F1217] dark:bg-[#161922] px-6 pt-1 pb-6 rounded-b-[32px] text-white space-y-4 border-b border-white/[0.06]">
            {/* Title & Organization */}
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-0.5">
                <h3 className="text-lg font-black tracking-tight text-white line-clamp-1 group-hover:text-[#D4FF00] transition-colors">
                  {project.title}
                </h3>
                <p className="text-xs text-gray-400 font-mono">
                  {project.category} • {project.clientOrOrg || 'Zakarya Oukil'}
                </p>
              </div>

              {/* Three dots / Open Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenProject(project);
                }}
                className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                title="View Kanban & Tasks"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            {/* Description Snippet */}
            <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
              {project.description}
            </p>

            {/* Dynamic Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-gray-400">Progress</span>
                <span className="font-bold text-[#D4FF00]">{progressPercent}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isCompleted ? 'bg-emerald-400' : 'bg-[#D4FF00]'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Bottom Row: File/Task Count & Status Indicator */}
            <div className="flex items-center justify-between pt-2 border-t border-white/[0.08] text-xs">
              <div className="flex items-center gap-1.5 font-mono text-gray-300">
                <FileText className="w-3.5 h-3.5 text-[#D4FF00]" />
                <span className="font-semibold">{totalTasks} Tasks</span>
              </div>

              <div className="flex items-center gap-2">
                {project.dueDate && (
                  <span className="text-[11px] font-mono text-gray-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {project.dueDate}
                  </span>
                )}

                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold capitalize ${
                    isCompleted
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : project.status === 'in-progress'
                      ? 'bg-[#D4FF00]/20 text-[#D4FF00] border border-[#D4FF00]/30'
                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}
                >
                  {isCompleted ? 'Completed' : project.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FolderProjectCard;
