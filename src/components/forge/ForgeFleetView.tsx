import React, { useState } from 'react';
import { 
  Zap, 
  Target, 
  Briefcase, 
  Search, 
  Send, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Sparkles, 
  ArrowUpRight, 
  ShieldCheck, 
  ExternalLink,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

export interface FleetJobItem {
  id: string;
  role: string;
  company: string;
  location: string;
  matchScore: number;
  salary: string;
  category: 'Cybersecurity' | 'Full-Stack' | 'AI / Systems';
  stage: 'Discovered' | 'Scored' | 'Tailoring' | 'Applied' | 'Interview';
  detectedAt: string;
  tags: string[];
}

const FLEET_JOBS: FleetJobItem[] = [
  {
    id: '1',
    role: 'Cybersecurity Penetration Testing Specialist',
    company: 'Nexus Cyber Defense Labs',
    location: 'Remote / Europe / MENA',
    matchScore: 98,
    salary: '€75k - €95k',
    category: 'Cybersecurity',
    stage: 'Tailoring',
    detectedAt: '18m ago',
    tags: ['WebDAV', 'IIS', 'Nmap', 'eJPT', 'OWASP'],
  },
  {
    id: '2',
    role: 'Full-Stack Systems Architect (React / TypeScript)',
    company: 'Vanguard Autonomous Systems',
    location: 'Remote',
    matchScore: 96,
    salary: '$110k - $140k',
    category: 'Full-Stack',
    stage: 'Applied',
    detectedAt: '1h ago',
    tags: ['TypeScript', 'React', 'Monaco', 'Tailwind', 'Node.js'],
  },
  {
    id: '3',
    role: 'DevSecOps & Cloud Security Engineer',
    company: 'CipherCloud Infrastructure',
    location: 'Hybrid',
    matchScore: 92,
    salary: '€65k - €85k',
    category: 'Cybersecurity',
    stage: 'Scored',
    detectedAt: '3h ago',
    tags: ['Docker', 'CI/CD', 'Secret Scanning', 'Linux'],
  },
  {
    id: '4',
    role: 'Autonomous AI Agent Software Engineer',
    company: 'Aura Intelligence Research',
    location: 'Remote',
    matchScore: 95,
    salary: '$120k - $150k',
    category: 'AI / Systems',
    stage: 'Interview',
    detectedAt: '1d ago',
    tags: ['Gemini', 'Multi-Agent', 'Obsidian', 'Python', 'FastAPI'],
  },
];

export const ForgeFleetView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const filteredJobs = selectedCategory === 'All'
    ? FLEET_JOBS
    : FLEET_JOBS.filter((j) => j.category === selectedCategory);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-[#D4FF00] uppercase mb-1">
            <Zap className="w-4 h-4" />
            <span>AUTONOMOUS FLEET COCKPIT</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
            Forge JobHunter Fleet.
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Autonomous background fleet scanning European and global cybersecurity bounties, full-stack contracts, and AI developer roles.
          </p>
        </div>

        {/* LED Live Indicator */}
        <div className="flex items-center gap-2 p-2 px-4 rounded-full bg-[#D4FF00]/10 border border-[#D4FF00]/30 text-gray-900 dark:text-[#D4FF00] text-xs font-mono font-bold">
          <span className="w-2 h-2 rounded-full bg-[#D4FF00] shadow-[0_0_8px_#D4FF00] animate-ping" />
          <span>FLEET CRAWLER ACTIVE · 4 AGENTS SCANNING</span>
        </div>
      </div>

      {/* Funnel Telemetry Strips */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-3xl bg-white dark:bg-[#12151B] border border-black/[0.08] dark:border-white/[0.08]">
          <span className="text-[10px] font-mono text-gray-400 uppercase font-bold">Discovered</span>
          <div className="text-2xl font-black text-gray-900 dark:text-white mt-1">128</div>
          <span className="text-[9px] font-mono text-gray-400">Scraped past 24h</span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-[#12151B] border border-black/[0.08] dark:border-white/[0.08]">
          <span className="text-[10px] font-mono text-gray-400 uppercase font-bold">Match &gt; 90%</span>
          <div className="text-2xl font-black text-[#7DD3FC] mt-1">19</div>
          <span className="text-[9px] font-mono text-gray-400">High compatibility</span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-[#12151B] border border-black/[0.08] dark:border-white/[0.08]">
          <span className="text-[10px] font-mono text-gray-400 uppercase font-bold">CVs Tailored</span>
          <div className="text-2xl font-black text-[#A78BFA] mt-1">8</div>
          <span className="text-[9px] font-mono text-gray-400">Targeted snapshots</span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-[#12151B] border border-black/[0.08] dark:border-white/[0.08]">
          <span className="text-[10px] font-mono text-gray-400 uppercase font-bold">Applied</span>
          <div className="text-2xl font-black text-[#F5B544] mt-1">5</div>
          <span className="text-[9px] font-mono text-gray-400">Dispatched packages</span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-[#12151B] border border-black/[0.08] dark:border-white/[0.08]">
          <span className="text-[10px] font-mono text-gray-400 uppercase font-bold">Interviews</span>
          <div className="text-2xl font-black text-[#5EE2B5] mt-1">2</div>
          <span className="text-[9px] font-mono text-[#5EE2B5] font-bold">Aura & Nexus</span>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2">
        {['All', 'Cybersecurity', 'Full-Stack', 'AI / Systems'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-mono font-bold uppercase transition ${
              selectedCategory === cat
                ? 'bg-black dark:bg-white text-white dark:text-black shadow-md'
                : 'bg-black/[0.04] dark:bg-white/[0.04] text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Pipeline Opportunity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredJobs.map((job) => (
          <div
            key={job.id}
            className="p-6 rounded-3xl bg-white dark:bg-[#12151B] border border-black/[0.08] dark:border-white/[0.08] shadow-lg hover:shadow-2xl transition-all flex flex-col justify-between relative group"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/[0.04] dark:bg-white/[0.04] text-gray-500 dark:text-gray-400 uppercase font-bold">
                    {job.category}
                  </span>
                  <h3 className="font-extrabold text-base sm:text-lg text-gray-900 dark:text-white mt-1">
                    {job.role}
                  </h3>
                  <div className="text-xs font-mono text-gray-500 dark:text-gray-400 mt-0.5">
                    {job.company} • {job.location}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xl font-mono font-black text-[#D4FF00]">
                    {job.matchScore}%
                  </div>
                  <div className="text-[9px] font-mono text-gray-400 uppercase">Match Score</div>
                </div>
              </div>

              {/* Tags */}
              <div className="flex items-center gap-1.5 flex-wrap my-4">
                {job.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.05] text-gray-600 dark:text-gray-300"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-black/[0.05] dark:border-white/[0.05] flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-gray-700 dark:text-gray-300">{job.salary}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400">{job.detectedAt}</span>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-[#7DD3FC]/10 border border-[#7DD3FC]/30 text-[#7DD3FC]">
                  {job.stage}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ForgeFleetView;
