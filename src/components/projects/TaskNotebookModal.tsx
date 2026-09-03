import React, { useState } from 'react';
import { 
  X, 
  Video, 
  Image as ImageIcon, 
  FileText, 
  Link as LinkIcon, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Columns, 
  Rows, 
  Play, 
  Pause, 
  Maximize2, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Sparkles,
  Save,
  Globe,
  Film
} from 'lucide-react';
import { ProjectTaskItem, TaskAttachment } from '../../types';

interface TaskNotebookModalProps {
  task: ProjectTaskItem;
  projectTitle: string;
  onClose: () => void;
  onUpdateTask: (updatedTask: ProjectTaskItem) => void;
}

export const TaskNotebookModal: React.FC<TaskNotebookModalProps> = ({
  task,
  projectTitle,
  onClose,
  onUpdateTask,
}) => {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [notes, setNotes] = useState(task.notes || '');
  const [status, setStatus] = useState(task.status);
  const [priority, setPriority] = useState(task.priority);
  const [attachments, setAttachments] = useState<TaskAttachment[]>(task.attachments || []);
  const [imageLayout, setImageLayout] = useState<'horizontal' | 'vertical'>(task.imageLayout || 'horizontal');

  // Media Attachment Form State
  const [isAddingMedia, setIsAddingMedia] = useState(false);
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'pdf' | 'link'>('image');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaTitle, setMediaTitle] = useState('');
  const [mediaDescription, setMediaDescription] = useState('');

  // Video player custom state
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  // Link viewer preview modal state
  const [previewLinkUrl, setPreviewLinkUrl] = useState<string | null>(null);

  const handleSave = () => {
    const updated: ProjectTaskItem = {
      ...task,
      title,
      description,
      notes,
      status,
      priority,
      attachments,
      imageLayout,
      updatedAt: new Date().toISOString(),
    };
    onUpdateTask(updated);
    onClose();
  };

  const handleAddAttachment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaUrl.trim()) return;

    const newAtt: TaskAttachment = {
      id: `att-${Date.now()}`,
      type: mediaType,
      url: mediaUrl.trim(),
      title: mediaTitle.trim() || undefined,
      description: mediaDescription.trim() || undefined,
    };

    setAttachments((prev) => [...prev, newAtt]);
    setMediaUrl('');
    setMediaTitle('');
    setMediaDescription('');
    setIsAddingMedia(false);
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const images = attachments.filter((a) => a.type === 'image');
  const videos = attachments.filter((a) => a.type === 'video');
  const links = attachments.filter((a) => a.type === 'link');
  const pdfs = attachments.filter((a) => a.type === 'pdf');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="bg-white dark:bg-[#15181F] border border-black/[0.08] dark:border-white/[0.1] rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header Bar */}
        <div className="p-6 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between gap-4 bg-black/[0.02] dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#D4FF00] text-black">
              TASK NOTEBOOK
            </span>
            <span className="text-xs text-gray-500 font-mono truncate max-w-xs">
              📁 {projectTitle}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-[#D4FF00] hover:bg-[#C6F500] text-black font-bold text-xs rounded-full flex items-center gap-1.5 shadow-[0_0_15px_rgba(212,255,0,0.3)] transition-all hover:scale-105"
            >
              <Save className="w-3.5 h-3.5" />
              Save & Close
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-black/[0.05] dark:bg-white/[0.06] text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body: Scrollable Workspace */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-7">
          {/* Title & Status Row */}
          <div className="space-y-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task Title..."
              className="w-full text-2xl sm:text-3xl font-black bg-transparent text-gray-900 dark:text-white focus:outline-none border-b border-transparent focus:border-[#D4FF00] pb-1 transition-all"
            />

            <div className="flex flex-wrap items-center gap-3">
              {/* Status Selector */}
              <div className="flex items-center gap-1.5 p-1 bg-black/[0.04] dark:bg-white/[0.05] rounded-full border border-black/[0.06] dark:border-white/[0.08]">
                {(['planning', 'in-progress', 'completed'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      status === s
                        ? s === 'completed'
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : s === 'in-progress'
                          ? 'bg-[#D4FF00] text-black shadow-sm'
                          : 'bg-blue-500 text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    {s === 'completed' && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                    {s === 'in-progress' && <Clock className="w-3 h-3 inline mr-1" />}
                    {s === 'planning' && <AlertCircle className="w-3 h-3 inline mr-1" />}
                    {s === 'planning' ? 'Planning' : s === 'in-progress' ? 'In Progress' : 'Completed'}
                  </button>
                ))}
              </div>

              {/* Priority Selector */}
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="px-3 py-1.5 text-xs font-mono bg-black/[0.04] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] rounded-full text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#D4FF00]"
              >
                <option value="low">Priority: Low</option>
                <option value="medium">Priority: Medium</option>
                <option value="high">Priority: High</option>
                <option value="urgent">Priority: Urgent 🔥</option>
              </select>

              {task.assignee && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] text-xs">
                  {task.assignee.avatar ? (
                    <img src={task.assignee.avatar} alt={task.assignee.name} className="w-4 h-4 rounded-full object-cover" />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-[#D4FF00] text-black font-bold text-[9px] flex items-center justify-center">
                      {task.assignee.name.charAt(0)}
                    </div>
                  )}
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{task.assignee.name}</span>
                </div>
              )}
            </div>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add brief task summary or objectives..."
              rows={2}
              className="w-full text-xs sm:text-sm bg-black/[0.02] dark:bg-white/[0.03] p-3 rounded-2xl border border-black/[0.06] dark:border-white/[0.06] text-gray-700 dark:text-gray-300 focus:outline-none focus:border-[#D4FF00] transition-colors"
            />
          </div>

          {/* Rich Notes Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold text-gray-500 uppercase flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#D4FF00]" />
                Task Notes & Documentation
              </label>
              <span className="text-[11px] font-mono text-gray-400">Markdown enabled</span>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Write detailed walkthrough notes, command outputs, checklists, code snippets, or attack vectors..."
              rows={7}
              className="w-full font-mono text-xs sm:text-sm bg-black/[0.03] dark:bg-black/40 p-4 rounded-2xl border border-black/[0.08] dark:border-white/[0.08] text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#D4FF00] leading-relaxed transition-all"
            />
          </div>

          {/* Media Attachments Hub */}
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
              <div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#D4FF00]" />
                  Media, Video, PDF & Link Embeds ({attachments.length})
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Attach rich multimedia directly inside this task note
                </p>
              </div>

              <div className="flex items-center gap-2">
                {images.length > 1 && (
                  <div className="flex items-center p-1 bg-black/[0.04] dark:bg-white/[0.05] rounded-xl border border-black/[0.06] dark:border-white/[0.08]">
                    <button
                      type="button"
                      onClick={() => setImageLayout('horizontal')}
                      className={`p-1.5 rounded-lg text-xs transition-all ${
                        imageLayout === 'horizontal' ? 'bg-[#D4FF00] text-black shadow-sm' : 'text-gray-500'
                      }`}
                      title="Horizontal Side-by-Side View"
                    >
                      <Columns className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageLayout('vertical')}
                      className={`p-1.5 rounded-lg text-xs transition-all ${
                        imageLayout === 'vertical' ? 'bg-[#D4FF00] text-black shadow-sm' : 'text-gray-500'
                      }`}
                      title="Vertical Stacked View"
                    >
                      <Rows className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setIsAddingMedia(true)}
                  className="px-3 py-1.5 bg-black/[0.05] dark:bg-white/[0.08] hover:bg-[#D4FF00] hover:text-black text-gray-800 dark:text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Attach Media</span>
                </button>
              </div>
            </div>

            {/* Add Media Inline Form */}
            {isAddingMedia && (
              <form onSubmit={handleAddAttachment} className="p-5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] space-y-3.5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900 dark:text-white">Add New Attachment</span>
                  <button
                    type="button"
                    onClick={() => setIsAddingMedia(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-xs"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { type: 'image', label: '🖼️ Image', icon: ImageIcon },
                    { type: 'video', label: '🎬 Video', icon: Video },
                    { type: 'pdf', label: '📄 PDF Doc', icon: FileText },
                    { type: 'link', label: '🌐 Web Link', icon: LinkIcon },
                  ].map((m) => (
                    <button
                      key={m.type}
                      type="button"
                      onClick={() => setMediaType(m.type as any)}
                      className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                        mediaType === m.type
                          ? 'bg-[#D4FF00] text-black border-[#D4FF00] shadow-sm'
                          : 'bg-black/[0.02] dark:bg-white/[0.04] text-gray-600 dark:text-gray-400 border-black/[0.06] dark:border-white/[0.08]'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    required
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder={
                      mediaType === 'image' ? 'Image URL (https://... or .png/.jpg)' :
                      mediaType === 'video' ? 'Video URL (.mp4, .webm, or YouTube link)' :
                      mediaType === 'pdf' ? 'PDF document URL (https://... or file.pdf)' :
                      'Web Link URL (https://...)'
                    }
                    className="w-full px-3.5 py-2 text-xs font-mono bg-white dark:bg-black/50 border border-black/[0.08] dark:border-white/[0.08] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-[#D4FF00]"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={mediaTitle}
                      onChange={(e) => setMediaTitle(e.target.value)}
                      placeholder="Title or Caption (optional)..."
                      className="w-full px-3.5 py-2 text-xs bg-white dark:bg-black/50 border border-black/[0.08] dark:border-white/[0.08] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-[#D4FF00]"
                    />
                    <input
                      type="text"
                      value={mediaDescription}
                      onChange={(e) => setMediaDescription(e.target.value)}
                      placeholder="Description / Context (optional)..."
                      className="w-full px-3.5 py-2 text-xs bg-white dark:bg-black/50 border border-black/[0.08] dark:border-white/[0.08] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-[#D4FF00]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#D4FF00] hover:bg-[#C6F500] text-black font-bold text-xs rounded-xl transition-transform hover:scale-105"
                  >
                    Add Attachment
                  </button>
                </div>
              </form>
            )}

            {/* 🎬 1. Pretty Web Video Players */}
            {videos.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-bold text-gray-500 uppercase flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-[#D4FF00]" />
                  Embedded Video Players
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {videos.map((vid) => {
                    const isYouTube = vid.url.includes('youtube.com') || vid.url.includes('youtu.be');
                    let embedUrl = vid.url;
                    if (isYouTube) {
                      const videoIdMatch = vid.url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
                      if (videoIdMatch) {
                        embedUrl = `https://www.youtube-nocookie.com/embed/${videoIdMatch[1]}`;
                      }
                    }

                    return (
                      <div
                        key={vid.id}
                        className="p-4 rounded-3xl bg-black/90 dark:bg-black border border-white/10 space-y-3 shadow-lg"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white truncate max-w-xs">
                            {vid.title || 'Attached Video'}
                          </span>
                          <button
                            onClick={() => handleRemoveAttachment(vid.id)}
                            className="text-gray-400 hover:text-red-400 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Video Player Box */}
                        <div className="relative aspect-video rounded-2xl overflow-hidden bg-black/80 border border-white/10 flex items-center justify-center">
                          {isYouTube ? (
                            <iframe
                              src={embedUrl}
                              title={vid.title || 'YouTube Video'}
                              className="w-full h-full border-0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          ) : (
                            <video
                              src={vid.url}
                              controls
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>

                        {vid.description && (
                          <p className="text-[11px] text-gray-400 leading-relaxed">
                            {vid.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 🖼️ 2. Images with Horizontal / Vertical Layout Switcher */}
            {images.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono font-bold text-gray-500 uppercase flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-[#D4FF00]" />
                    Image Gallery ({imageLayout === 'horizontal' ? '↔️ Horizontal Side-by-Side' : '↕️ Vertical Stacked'})
                  </h4>
                </div>

                <div className={`
                  ${imageLayout === 'horizontal' 
                    ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4' 
                    : 'flex flex-col space-y-4'
                  }
                `}>
                  {images.map((img) => (
                    <div
                      key={img.id}
                      className="group relative rounded-2xl overflow-hidden bg-black/5 dark:bg-white/5 border border-black/[0.08] dark:border-white/[0.08] shadow-sm hover:border-[#D4FF00]/60 transition-all"
                    >
                      <img
                        src={img.url}
                        alt={img.title || 'Task Attachment'}
                        className={`w-full ${imageLayout === 'horizontal' ? 'h-48 object-cover' : 'max-h-[500px] object-contain bg-black/40'} transition-transform group-hover:scale-[1.02] duration-300`}
                        loading="lazy"
                      />

                      <div className="p-3 bg-white/90 dark:bg-[#181B22]/90 backdrop-blur-md flex items-center justify-between gap-2 border-t border-black/[0.06] dark:border-white/[0.06]">
                        <div className="truncate">
                          <span className="text-xs font-bold text-gray-900 dark:text-white truncate block">
                            {img.title || 'Screenshot / Diagram'}
                          </span>
                          {img.description && (
                            <span className="text-[10px] text-gray-500 truncate block">
                              {img.description}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <a
                            href={img.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-gray-400 hover:text-[#D4FF00] transition-colors"
                            title="Open Full Image"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => handleRemoveAttachment(img.id)}
                            className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                            title="Remove Image"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 🌐 3. Interactive Web Viewer / Links */}
            {links.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-bold text-gray-500 uppercase flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#D4FF00]" />
                  Web Links & Documentation
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {links.map((lnk) => (
                    <div
                      key={lnk.id}
                      className="p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between gap-3 hover:border-[#D4FF00]/50 transition-all"
                    >
                      <div className="truncate space-y-0.5">
                        <span className="text-xs font-bold text-gray-900 dark:text-white truncate block">
                          {lnk.title || lnk.url}
                        </span>
                        <span className="text-[11px] font-mono text-gray-400 truncate block">
                          {lnk.url}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setPreviewLinkUrl(lnk.url)}
                          className="px-2.5 py-1 rounded-lg bg-black/[0.05] dark:bg-white/[0.08] hover:bg-[#D4FF00] hover:text-black text-xs font-bold transition-all"
                        >
                          Preview
                        </button>
                        <a
                          href={lnk.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-gray-400 hover:text-[#D4FF00]"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => handleRemoveAttachment(lnk.id)}
                          className="p-1.5 text-gray-400 hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 📄 4. PDF File Embeds */}
            {pdfs.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-bold text-gray-500 uppercase flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#D4FF00]" />
                  Attached PDF Documents
                </h4>
                <div className="space-y-3">
                  {pdfs.map((pdf) => (
                    <div
                      key={pdf.id}
                      className="p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <FileText className="w-4 h-4 text-red-400" />
                          {pdf.title || 'PDF Document'}
                        </span>
                        <div className="flex items-center gap-2">
                          <a
                            href={pdf.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-[#D4FF00] hover:underline flex items-center gap-1"
                          >
                            Open PDF <ExternalLink className="w-3 h-3" />
                          </a>
                          <button
                            onClick={() => handleRemoveAttachment(pdf.id)}
                            className="text-gray-400 hover:text-red-400 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <iframe
                        src={pdf.url}
                        title={pdf.title || 'PDF Viewer'}
                        className="w-full h-80 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live Web Link Previewer Modal */}
        {previewLinkUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
            <div className="bg-white dark:bg-[#181B22] border border-white/10 rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">
              <div className="p-4 bg-black/90 text-white flex items-center justify-between gap-4 border-b border-white/10">
                <div className="flex items-center gap-2 font-mono text-xs truncate max-w-xl">
                  <Globe className="w-4 h-4 text-[#D4FF00]" />
                  <span>{previewLinkUrl}</span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={previewLinkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-white/10 hover:bg-[#D4FF00] hover:text-black rounded-lg text-xs font-bold transition-all"
                  >
                    Open in Tab
                  </a>
                  <button
                    onClick={() => setPreviewLinkUrl(null)}
                    className="p-1.5 text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <iframe
                src={previewLinkUrl}
                title="Live Web Preview"
                className="w-full flex-1 border-0 bg-white"
                sandbox="allow-scripts allow-same-origin allow-popups"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskNotebookModal;
