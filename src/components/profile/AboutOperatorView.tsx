import React from 'react';
import { 
  User, 
  ShieldCheck, 
  Award, 
  Code2, 
  Terminal, 
  Cpu, 
  Flame, 
  Layers, 
  ExternalLink, 
  Mail, 
  Sparkles, 
  Activity,
  Globe,
  Database,
  FolderGit2
} from 'lucide-react';
import { TelemetryStats } from '../../types';

interface AboutOperatorViewProps {
  stats: TelemetryStats | null;
  onOpenVaultNote?: (path: string) => void;
}

export const AboutOperatorView: React.FC<AboutOperatorViewProps> = ({
  stats,
  onOpenVaultNote,
}) => {
  const certifications = [
    { name: 'eJPTv2 (eLearnSecurity Junior Penetration Tester)', status: 'In Progress (88%)', issuer: 'INE Security', year: '2026', color: '#D4FF00' },
    { name: 'Fullstack Web & Systems Engineering', status: 'Active Practitioner', issuer: 'React / Node / TS', year: '2025', color: '#3B82F6' },
    { name: 'Autonomous Multi-Agent AI Architecture', status: 'Specialist', issuer: 'Local Ollama & LLMs', year: '2026', color: '#A855F7' },
    { name: 'Obsidian Second Brain PKM Mastery', status: 'Master Nucleus', issuer: '115+ Linked Notes', year: '2025', color: '#FFD700' },
  ];

  const skillMatrix = [
    { category: 'Offensive Cybersecurity', skills: ['Nmap', 'Metasploit', 'Gobuster', 'Hydra', 'SQLmap', 'Burp Suite', 'LinPEAS', 'WinPEAS', 'Wireshark', 'Pivoting (Chisel/Socat)'] },
    { category: 'Fullstack & Systems', skills: ['TypeScript', 'React', 'Vite', 'Tailwind CSS', 'Node.js', 'Express', 'Python (Asyncio)', 'Docker', 'WebSockets', 'Git'] },
    { category: 'AI & Machine Intelligence', skills: ['DeepSeek-Coder', 'Llama 3.3', 'Qwen 2.5', 'Ollama Local API', 'Gemini 3.7 Flash', 'Multi-Agent Prompt Engineering', 'RAG & Vector Workflows'] },
    { category: 'Knowledge Engineering', skills: ['Obsidian PKM', 'Zettelkasten Method', 'Markdown Studio', 'Mermaid.js', 'KaTeX Math', 'Backlink Constellation Graphs'] },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 animate-fadeIn">
      {/* Hero Profile Bento Card */}
      <div className="relative bg-white dark:bg-[#181B22] border border-black/[0.08] dark:border-white/[0.08] p-8 rounded-3xl shadow-xl overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#D4FF00]/15 blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          {/* Avatar & Title */}
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#D4FF00] to-emerald-400 p-0.5 shadow-[0_0_25px_rgba(212,255,0,0.35)]">
                <div className="w-full h-full rounded-full bg-[#0E1116] flex items-center justify-center text-white font-black text-2xl tracking-tight">
                  ZO
                </div>
              </div>
              <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-[#D4FF00] border-2 border-white dark:border-[#181B22] flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                  Zakarya Oukil
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#D4FF00] text-black">
                  OPERATOR
                </span>
              </div>
              <p className="text-xs font-mono text-gray-500 dark:text-gray-400">
                Offensive Pentester & Fullstack Multi-Agent Architect
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[11px] font-mono text-[#D4FF00] font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> eJPTv2 Candidate
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-[11px] font-mono text-gray-400">Algiers / Remote</span>
              </div>
            </div>
          </div>

          {/* Social Links & Bio CTA */}
          <div className="flex items-center gap-2">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="p-2.5 rounded-2xl bg-black/[0.04] dark:bg-white/[0.05] hover:bg-[#D4FF00] hover:text-black text-gray-700 dark:text-gray-300 transition-all flex items-center gap-1.5 text-xs font-mono font-bold"
              title="GitHub"
            >
              <FolderGit2 className="w-4 h-4" />
              <span>GitHub</span>
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer"
              className="p-2.5 rounded-2xl bg-black/[0.04] dark:bg-white/[0.05] hover:bg-[#D4FF00] hover:text-black text-gray-700 dark:text-gray-300 transition-all flex items-center gap-1.5 text-xs font-mono font-bold"
              title="Network"
            >
              <Globe className="w-4 h-4" />
              <span>Network</span>
            </a>
            {onOpenVaultNote && (
              <button
                onClick={() => onOpenVaultNote('🏛 Zakarya Oukil — Master Root.md')}
                className="px-4 py-2.5 bg-[#D4FF00] hover:bg-[#C6F500] text-black font-bold text-xs rounded-2xl flex items-center gap-1.5 shadow-[0_0_20px_rgba(212,255,0,0.3)] transition-all hover:scale-105"
              >
                <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
                Master Root Note
              </button>
            )}
          </div>
        </div>

        {/* Bio Text */}
        <div className="mt-6 pt-6 border-t border-black/[0.06] dark:border-white/[0.08] text-xs text-gray-600 dark:text-gray-300 leading-relaxed max-w-3xl">
          Passionate cybersecurity practitioner and software engineer specializing in offensive penetration testing methodologies (eJPTv2), high-concurrency systems, and local autonomous multi-agent operating systems. Creator of <span className="font-bold text-[#D4FF00]">Zak_OS</span> and an interconnected 115-note Obsidian Second Brain knowledge vault.
        </div>
      </div>

      {/* Certifications & Milestones */}
      <div className="bg-white dark:bg-[#181B22] border border-black/[0.08] dark:border-white/[0.08] p-6 rounded-3xl shadow-sm space-y-4">
        <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-[#D4FF00]" />
          Certifications & Learning Trajectory
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {certifications.map((cert) => (
            <div
              key={cert.name}
              className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.06] flex items-center justify-between"
            >
              <div>
                <h3 className="font-bold text-xs text-gray-900 dark:text-white">{cert.name}</h3>
                <p className="text-[11px] text-gray-500">{cert.issuer} • {cert.year}</p>
              </div>
              <span 
                className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full text-black"
                style={{ backgroundColor: cert.color }}
              >
                {cert.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Technical Skill Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {skillMatrix.map((item) => (
          <div
            key={item.category}
            className="bg-white dark:bg-[#181B22] border border-black/[0.08] dark:border-white/[0.08] p-6 rounded-3xl shadow-sm space-y-3"
          >
            <h3 className="font-bold text-xs font-mono text-gray-500 uppercase tracking-wider">
              {item.category}
            </h3>
            <div className="flex flex-wrap gap-2">
              {item.skills.map((skill) => (
                <span
                  key={skill}
                  className="text-xs font-medium px-3 py-1.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.05] text-gray-800 dark:text-gray-200 border border-black/[0.04] dark:border-white/[0.06]"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
