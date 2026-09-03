export interface NoteFrontmatter {
  title?: string;
  type?: 'root' | 'hub' | 'leaf' | 'template' | string;
  category?: string;
  tier?: number;
  status?: string;
  tags?: string[];
  created?: string;
  updated?: string;
  parent?: string;
  difficulty?: string;
  target_ip?: string;
  tool?: string;
  [key: string]: any;
}

export interface NoteItem {
  id: string;
  title: string;
  path: string;
  relativePath: string;
  branch: 'nucleus' | 'certs' | 'coding' | 'aios' | 'kb' | 'templates' | 'other';
  branchLabel: string;
  branchColor: string;
  tier: number;
  category: string;
  type: string;
  status: string;
  tags: string[];
  created: string;
  updated: string;
  parent: string | null;
  content: string;
  rawContent: string;
  frontmatter: NoteFrontmatter;
  links: string[]; // outgoing wikilinks
  backlinks: string[]; // incoming links from other notes
  wordCount: number;
  size: number;
  headings: { level: number; text: string }[];
}

export interface GraphNode {
  id: string;
  label: string;
  path: string;
  branch: string;
  branchColor: string;
  tier: number;
  category: string;
  tags: string[];
  val: number; // size for force-graph
  linkCount: number;
}

export interface GraphLink {
  source: string;
  target: string;
  type: 'parent' | 'wikilink' | 'reference';
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface CommandItem {
  id: string;
  title: string;
  tool: string;
  category: string;
  command: string;
  description: string;
  flags?: string[];
  parameters: {
    name: string;
    placeholder: string;
    defaultValue?: string;
    description?: string;
  }[];
  sourceNote?: string;
  branch: string;
  tags: string[];
}

export interface ProjectKanbanItem {
  id: string;
  title: string;
  category: string;
  status: 'Planning' | 'In-Progress' | 'Testing' | 'Completed';
  tier: number;
  path: string;
  description: string;
  progress: number;
  tags: string[];
}

export interface TelemetryStats {
  totalNotes: number;
  totalLinks: number;
  totalTags: number;
  totalCommands: number;
  branchCounts: Record<string, number>;
  tierCounts: Record<number, number>;
  ejptReadiness: {
    percentage: number;
    currentCourse?: string;
    completedModules: number;
    totalModules: number;
    completedLabs: number;
    totalLabs: number;
    indexedCommands: number;
    currentStage?: {
      courseName: string;
      subModule: string;
      progress: number;
      remainingTasks: string[];
    };
    categories: {
      name: string;
      progress: number;
      status: string;
    }[];
  };
  vaultHealth: {
    orphanCount: number;
    brokenLinksCount: number;
    healthScore: number;
  };
}
