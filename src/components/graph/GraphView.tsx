import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Share2, 
  Search, 
  Filter, 
  Crosshair, 
  Maximize2, 
  Layers, 
  Tag, 
  ExternalLink, 
  Sparkles, 
  RotateCcw,
  Zap,
  Info,
  ZoomIn,
  ZoomOut,
  Compass,
  Eye
} from 'lucide-react';
import { GraphData, GraphNode, GraphLink, NoteItem } from '../../types';

interface GraphViewProps {
  graphData: GraphData;
  notes: NoteItem[];
  onOpenNote: (path: string) => void;
}

interface SimNode {
  id: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  radius: number;
  branchColor: string;
  tier: number;
}

interface BackgroundStar {
  x: number;
  y: number;
  z: number;
  size: number;
  alpha: number;
}

export const GraphView: React.FC<GraphViewProps> = ({ graphData, notes, onOpenNote }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Viewport & 3D Orbit Camera state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState({ x: 0.25, y: 0 }); // 3D Pitch and Yaw
  const [is3DMode, setIs3DMode] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);

  // Selection & Hover
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranches, setSelectedBranches] = useState<Record<string, boolean>>({
    nucleus: true,
    certs: true,
    coding: true,
    aios: true,
    kb: true,
    templates: true,
  });

  // Physical simulation refs
  const simNodesRef = useRef<Map<string, SimNode>>(new Map());
  const starsRef = useRef<BackgroundStar[]>([]);
  const animationFrameId = useRef<number | null>(null);
  const frameCount = useRef<number>(0);

  // Filtered nodes & links
  const { visibleNodes, visibleLinks } = useMemo(() => {
    const nodeMap = new Map<string, GraphNode>();

    graphData.nodes.forEach((n) => {
      const branchOk = selectedBranches[n.branch] ?? true;
      const searchOk =
        searchQuery === '' ||
        n.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      if (branchOk && searchOk) {
        nodeMap.set(n.id, n);
      }
    });

    const links = graphData.links.filter((l) => {
      const sourceId = typeof l.source === 'string' ? l.source : (l.source as any).id;
      const targetId = typeof l.target === 'string' ? l.target : (l.target as any).id;
      return nodeMap.has(sourceId) && nodeMap.has(targetId);
    });

    return {
      visibleNodes: Array.from(nodeMap.values()),
      visibleLinks: links,
    };
  }, [graphData, selectedBranches, searchQuery]);

  // Generate background space stars once
  useEffect(() => {
    const stars: BackgroundStar[] = [];
    for (let i = 0; i < 150; i++) {
      stars.push({
        x: (Math.random() - 0.5) * 2000,
        y: (Math.random() - 0.5) * 2000,
        z: (Math.random() - 0.5) * 800,
        size: Math.random() * 1.8 + 0.5,
        alpha: Math.random() * 0.7 + 0.3,
      });
    }
    starsRef.current = stars;
  }, []);

  // Initialize node layout with 3D radial distribution
  useEffect(() => {
    const newSim = new Map<string, SimNode>();

    const branchAngles: Record<string, number> = {
      nucleus: 0,
      certs: (0 * 2 * Math.PI) / 5,
      coding: (1 * 2 * Math.PI) / 5,
      aios: (2 * 2 * Math.PI) / 5,
      kb: (3 * 2 * Math.PI) / 5,
      templates: (4 * 2 * Math.PI) / 5,
    };

    graphData.nodes.forEach((node) => {
      const baseRadius = node.tier === 0 ? 0 : node.tier * 115 + (Math.random() * 30 - 15);
      const branchAngle = branchAngles[node.branch] || 0;
      const jitter = (Math.random() - 0.5) * 0.6;
      const angle = node.tier === 0 ? 0 : branchAngle + jitter;

      const x = Math.cos(angle) * baseRadius;
      const y = Math.sin(angle) * baseRadius;
      const z = node.tier === 0 ? 0 : (Math.random() - 0.5) * (node.tier * 60);

      newSim.set(node.id, {
        id: node.id,
        x,
        y,
        z,
        vx: 0,
        vy: 0,
        vz: 0,
        radius: node.tier === 0 ? 15 : node.tier === 1 ? 11 : node.tier === 2 ? 8 : node.tier === 3 ? 6 : 4.5,
        branchColor: node.branchColor,
        tier: node.tier,
      });
    });

    simNodesRef.current = newSim;
    setPan({ x: 0, y: 0 });
    setZoom(1);
  }, [graphData]);

  // Center on Master Root
  const handleFocusCenter = () => {
    setPan({ x: 0, y: 0 });
    setRotation({ x: 0.25, y: 0 });
    setZoom(1);
    const rootNode = graphData.nodes.find((n) => n.tier === 0 || n.label.includes('Master Root'));
    if (rootNode) {
      setSelectedNode(rootNode);
    }
  };

  // Main 3D / 2D Canvas Physics & Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      frameCount.current++;

      // Handle Resize and Retina DPI
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, rect.width, rect.height);

      const sim = simNodesRef.current;
      const centerX = rect.width / 2 + pan.x;
      const centerY = rect.height / 2 + pan.y;

      // 1. Force Simulation Step (spring links + node repulsion)
      if (frameCount.current < 250) {
        // Link springs
        visibleLinks.forEach((link) => {
          const sId = typeof link.source === 'string' ? link.source : (link.source as any).id;
          const tId = typeof link.target === 'string' ? link.target : (link.target as any).id;
          const sNode = sim.get(sId);
          const tNode = sim.get(tId);

          if (sNode && tNode) {
            const dx = tNode.x - sNode.x;
            const dy = tNode.y - sNode.y;
            const dz = tNode.z - sNode.z;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
            const targetDist = 75;
            const force = (dist - targetDist) * 0.0025;

            sNode.vx += (dx / dist) * force;
            sNode.vy += (dy / dist) * force;
            sNode.vz += (dz / dist) * force;

            tNode.vx -= (dx / dist) * force;
            tNode.vy -= (dy / dist) * force;
            tNode.vz -= (dz / dist) * force;
          }
        });

        // Apply velocity with damping
        sim.forEach((node) => {
          if (draggedNodeId === node.id) return; // Keep dragged node in place
          node.x += node.vx;
          node.y += node.vy;
          node.z += node.vz;
          node.vx *= 0.86;
          node.vy *= 0.86;
          node.vz *= 0.86;
        });
      }

      // 3D Projection Helper
      const cosY = Math.cos(rotation.y);
      const sinY = Math.sin(rotation.y);
      const cosX = Math.cos(rotation.x);
      const sinX = Math.sin(rotation.x);
      const fov = 700;

      const project = (x: number, y: number, z: number) => {
        if (!is3DMode) {
          return {
            px: centerX + x * zoom,
            py: centerY + y * zoom,
            scale: zoom,
            depth: 0,
          };
        }

        // Rotate around Y axis (Yaw)
        const x1 = x * cosY - z * sinY;
        const z1 = z * cosY + x * sinY;

        // Rotate around X axis (Pitch)
        const y2 = y * cosX - z1 * sinX;
        const z2 = z1 * cosX + y * sinX;

        // Perspective scale
        const cameraZ = fov + 300;
        const depth = cameraZ + z2;
        const scale = depth > 10 ? (fov / depth) * zoom : 0.01;

        return {
          px: centerX + x1 * scale,
          py: centerY + y2 * scale,
          scale,
          depth: z2,
        };
      };

      // 2. Draw Background Space Stars
      starsRef.current.forEach((star) => {
        const p = project(star.x, star.y, star.z);
        if (p.scale > 0) {
          ctx.fillStyle = `rgba(0, 240, 255, ${star.alpha * Math.min(1, p.scale)})`;
          ctx.beginPath();
          ctx.arc(p.px, p.py, Math.max(0.5, star.size * p.scale), 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // 3. Draw Radial Orbit Grid Rings
      [115, 230, 345, 460].forEach((r) => {
        ctx.beginPath();
        const segments = 48;
        for (let i = 0; i <= segments; i++) {
          const theta = (i / segments) * Math.PI * 2;
          const rx = Math.cos(theta) * r;
          const ry = Math.sin(theta) * r;
          const p = project(rx, ry, 0);
          if (i === 0) ctx.moveTo(p.px, p.py);
          else ctx.lineTo(p.px, p.py);
        }
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.06)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // 4. Draw Links
      visibleLinks.forEach((link) => {
        const sId = typeof link.source === 'string' ? link.source : (link.source as any).id;
        const tId = typeof link.target === 'string' ? link.target : (link.target as any).id;
        const sNode = sim.get(sId);
        const tNode = sim.get(tId);

        if (sNode && tNode) {
          const p1 = project(sNode.x, sNode.y, sNode.z);
          const p2 = project(tNode.x, tNode.y, tNode.z);

          const isHighlighted =
            (selectedNode && (selectedNode.id === sId || selectedNode.id === tId)) ||
            (hoveredNode && (hoveredNode.id === sId || hoveredNode.id === tId));

          ctx.beginPath();
          ctx.moveTo(p1.px, p1.py);
          ctx.lineTo(p2.px, p2.py);

          if (isHighlighted) {
            ctx.strokeStyle = '#00F0FF';
            ctx.lineWidth = 2 * Math.min(2, p1.scale);
            ctx.shadowColor = '#00F0FF';
            ctx.shadowBlur = 8;
          } else {
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
            ctx.lineWidth = 0.8 * Math.min(1.5, p1.scale);
            ctx.shadowBlur = 0;
          }
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      });

      // 5. Sort Nodes by Depth for Correct 3D Rendering Order
      const renderedNodes = visibleNodes
        .map((node) => {
          const pos = sim.get(node.id);
          if (!pos) return null;
          const p = project(pos.x, pos.y, pos.z);
          return {
            node,
            pos,
            ...p,
          };
        })
        .filter(Boolean) as {
        node: GraphNode;
        pos: SimNode;
        px: number;
        py: number;
        scale: number;
        depth: number;
      }[];

      renderedNodes.sort((a, b) => a.depth - b.depth);

      // 6. Draw Nodes with Glowing Halos
      renderedNodes.forEach(({ node, pos, px, py, scale }) => {
        if (!Number.isFinite(px) || !Number.isFinite(py) || scale <= 0) return;

        const isHovered = hoveredNode?.id === node.id;
        const isSelected = selectedNode?.id === node.id;
        const baseRadius = pos.radius * scale;
        const radius = Math.max(2, baseRadius * (isSelected ? 1.4 : isHovered ? 1.25 : 1));

        // Halo Glow Circle (Safely clamped)
        const haloRadius = Math.max(1, radius * 2.2);
        if (Number.isFinite(haloRadius)) {
          const gradient = ctx.createRadialGradient(px, py, Math.max(0.1, radius * 0.3), px, py, haloRadius);
          gradient.addColorStop(0, node.branchColor);
          gradient.addColorStop(1, 'transparent');

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(px, py, haloRadius, 0, Math.PI * 2);
          ctx.fill();
        }

        // Solid Core Node
        ctx.beginPath();
        ctx.arc(px, py, Math.max(1, radius), 0, Math.PI * 2);
        ctx.fillStyle = node.branchColor;
        ctx.shadowColor = node.branchColor;
        ctx.shadowBlur = isHovered || isSelected ? 16 : 6;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Border outline
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.strokeStyle = isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.4)';
        ctx.stroke();

        // Node Label
        const showLabel = node.tier <= 1 || isHovered || isSelected || zoom > 1.25;
        if (showLabel && scale > 0.4) {
          ctx.font = `${node.tier === 0 ? 'bold 12px' : '10px'} "Fira Code", monospace`;
          ctx.fillStyle = isSelected ? '#00F0FF' : isHovered ? '#FFFFFF' : '#CBD5E1';
          ctx.textAlign = 'center';
          ctx.shadowColor = '#000000';
          ctx.shadowBlur = 4;
          ctx.fillText(node.label, px, py + radius + 11);
          ctx.shadowBlur = 0;
        }
      });

      ctx.restore();
      animationFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [visibleNodes, visibleLinks, pan, zoom, rotation, is3DMode, hoveredNode, selectedNode, draggedNodeId]);

  // Mouse Interactivity: Pan, 3D Rotate, Zoom, Hover & Click
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });

    // Check if clicking a specific node
    if (hoveredNode) {
      setDraggedNodeId(hoveredNode.id);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;

      if (e.buttons === 2 || e.shiftKey) {
        // Shift or Right-Click -> 3D Orbit Rotate
        setRotation((prev) => ({
          x: Math.max(-1.2, Math.min(1.2, prev.x + dy * 0.005)),
          y: prev.y + dx * 0.005,
        }));
      } else {
        // Standard Left-Click -> Pan
        setPan((prev) => ({
          x: prev.x + dx,
          y: prev.y + dy,
        }));
      }

      setDragStart({ x: e.clientX, y: e.clientY });
      return;
    }

    // Hit Test for Hover
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const sim = simNodesRef.current;
    const centerX = rect.width / 2 + pan.x;
    const centerY = rect.height / 2 + pan.y;

    const cosY = Math.cos(rotation.y);
    const sinY = Math.sin(rotation.y);
    const cosX = Math.cos(rotation.x);
    const sinX = Math.sin(rotation.x);
    const fov = 700;

    let hit: GraphNode | null = null;

    for (const node of visibleNodes) {
      const pos = sim.get(node.id);
      if (!pos) continue;

      let px = centerX + pos.x * zoom;
      let py = centerY + pos.y * zoom;
      let scale = zoom;

      if (is3DMode) {
        const x1 = pos.x * cosY - pos.z * sinY;
        const z1 = pos.z * cosY + pos.x * sinY;
        const y2 = pos.y * cosX - z1 * sinX;
        const z2 = z1 * cosX + pos.y * sinX;
        const depth = fov + 300 + z2;
        scale = depth > 10 ? (fov / depth) * zoom : 0.01;
        px = centerX + x1 * scale;
        py = centerY + y2 * scale;
      }

      const dist = Math.sqrt((px - mouseX) * (px - mouseX) + (py - mouseY) * (py - mouseY));
      if (dist <= pos.radius * scale + 8) {
        hit = node;
        break;
      }
    }

    setHoveredNode(hit);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedNodeId(null);

    if (hoveredNode) {
      setSelectedNode(hoveredNode);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
    setZoom((prev) => Math.min(Math.max(prev * zoomFactor, 0.25), 4));
  };

  // Find full note data for selected node card
  const selectedNoteData = useMemo(() => {
    if (!selectedNode) return null;
    return notes.find((n) => n.id === selectedNode.id || n.relativePath === selectedNode.path) || null;
  }, [selectedNode, notes]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative select-none bg-space-950">
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Left: Search & Focus Center */}
        <div className="flex items-center space-x-2 pointer-events-auto bg-space-900/90 backdrop-blur-md p-1.5 rounded-xl border border-cyan-500/30 shadow-glass-glow">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-cyan-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search graph nodes..."
              className="bg-space-950 border border-slate-700 rounded-lg pl-8 pr-2.5 py-1 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 w-44"
            />
          </div>

          <button
            onClick={handleFocusCenter}
            className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-mono transition shadow-sm"
          >
            <Crosshair className="w-3.5 h-3.5 text-amber-400" />
            <span>FOCUS CENTER (T0)</span>
          </button>
        </div>

        {/* Right: 3D/2D Mode Toggle, Branch Filters & Zoom */}
        <div className="flex items-center space-x-2 pointer-events-auto bg-space-900/90 backdrop-blur-md p-1.5 rounded-xl border border-cyan-500/30 shadow-glass-glow">
          {/* 3D / 2D Mode Switcher */}
          <button
            onClick={() => setIs3DMode(!is3DMode)}
            className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition flex items-center gap-1.5 ${
              is3DMode
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-glow-cyan'
                : 'bg-space-800 text-slate-400 border border-slate-700'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>{is3DMode ? '3D ORBIT' : '2D FLAT'}</span>
          </button>

          <div className="h-4 w-px bg-slate-700" />

          {/* Branch Filter Pills */}
          <div className="hidden lg:flex items-center space-x-1 font-mono text-[10px]">
            {[
              { id: 'nucleus', label: 'Root', color: '#FFD700' },
              { id: 'certs', label: 'Certs', color: '#10B981' },
              { id: 'coding', label: 'Projects', color: '#3B82F6' },
              { id: 'aios', label: 'AI OS', color: '#A855F7' },
              { id: 'kb', label: 'KB', color: '#F97316' },
              { id: 'templates', label: 'Templates', color: '#EC4899' },
            ].map((b) => (
              <button
                key={b.id}
                onClick={() =>
                  setSelectedBranches((prev) => ({
                    ...prev,
                    [b.id]: !prev[b.id],
                  }))
                }
                className={`px-2 py-0.5 rounded border transition ${
                  selectedBranches[b.id]
                    ? 'border-cyan-400/60 text-white shadow-sm'
                    : 'opacity-40 border-slate-700 text-slate-500'
                }`}
                style={{
                  backgroundColor: selectedBranches[b.id] ? `${b.color}25` : 'transparent',
                }}
              >
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full mr-1"
                  style={{ backgroundColor: b.color }}
                />
                {b.label}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-slate-700 hidden lg:block" />

          {/* Zoom Buttons */}
          <button
            onClick={() => setZoom((z) => Math.min(z * 1.2, 4))}
            className="p-1 rounded hover:bg-space-800 text-slate-300"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(z * 0.8, 0.25))}
            className="p-1 rounded hover:bg-space-800 text-slate-300"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Canvas Container */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
        className="w-full h-full cursor-grab active:cursor-grabbing bg-space-950"
      />

      {/* Floating Node Inspection Card */}
      {selectedNode && (
        <div className="absolute bottom-6 right-6 z-30 w-80 max-w-[90vw] bg-space-900/95 border border-cyan-500/40 rounded-xl p-4 shadow-glass-glow backdrop-blur-xl animate-in fade-in slide-in-from-bottom-3 font-mono">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: selectedNode.branchColor }}
              />
              <span className="text-[10px] uppercase font-bold text-slate-400">
                Tier {selectedNode.tier} // {selectedNode.category}
              </span>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>

          <h3 className="text-sm font-bold text-slate-100 font-sans mt-1">
            {selectedNode.label}
          </h3>

          <p className="text-[11px] text-slate-400 truncate mt-0.5">
            {selectedNode.path}
          </p>

          {/* Tags */}
          {selectedNode.tags && selectedNode.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {selectedNode.tags.map((t) => (
                <span
                  key={t}
                  className="text-[9px] px-1.5 py-0.5 rounded bg-space-950 text-cyan-300 border border-cyan-500/20"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* Backlinks & Forward Links Stats */}
          {selectedNoteData && (
            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800 text-[10px]">
              <div className="bg-space-950 p-2 rounded border border-slate-800">
                <span className="text-slate-500 block">BACKLINKS:</span>
                <span className="text-cyan-400 font-bold text-xs">
                  {selectedNoteData.backlinks.length} incoming
                </span>
              </div>
              <div className="bg-space-950 p-2 rounded border border-slate-800">
                <span className="text-slate-500 block">OUTGOING:</span>
                <span className="text-purple-400 font-bold text-xs">
                  {selectedNoteData.links.length} outgoing
                </span>
              </div>
            </div>
          )}

          {/* Open Studio Action Button */}
          <button
            onClick={() => onOpenNote(selectedNode.path)}
            className="w-full mt-3 flex items-center justify-center space-x-2 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs font-mono transition shadow-glow-cyan"
          >
            <span>OPEN IN MARKDOWN STUDIO</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
