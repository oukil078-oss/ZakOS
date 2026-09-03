import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Orbit, 
  Search, 
  Filter, 
  Crosshair, 
  Maximize2, 
  Layers, 
  Sparkles, 
  RotateCcw, 
  ExternalLink, 
  BookOpen, 
  Tag, 
  FileText,
  Zap,
  Eye,
  Sliders,
  Plus,
  Minus,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { GraphData, GraphNode, NoteItem } from '../../types';

interface NeuralSignal {
  id: string;
  sourceId: string;
  targetId: string;
  progress: number;
  speed: number;
  color: string;
  size: number;
}

interface NeuralBrainGalaxyProps {
  graphData: GraphData;
  notes: NoteItem[];
  onOpenNote: (path: string) => void;
  onOpenStudio?: () => void;
  isEmbedded?: boolean;
  height?: string;
  onExpandFullscreen?: () => void;
}

interface SimParticle {
  x: number;
  y: number;
  z: number;
  size: number;
  alpha: number;
  speed: number;
}

interface SimGalaxyNode {
  id: string;
  label: string;
  branch: string;
  branchColor: string;
  tier: number;
  radius: number;
  angle: number;
  orbitSpeed: number;
  elevation: number;
  linkCount: number;
  path: string;
  x: number;
  y: number;
  z: number;
  screenX?: number;
  screenY?: number;
  screenRadius?: number;
}

export const NeuralBrainGalaxy: React.FC<NeuralBrainGalaxyProps> = ({
  graphData,
  notes,
  onOpenNote,
  onOpenStudio,
  isEmbedded = false,
  height,
  onExpandFullscreen,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Camera & Interaction State
  const [zoom, setZoom] = useState(1.1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState({ pitch: 0.35, yaw: 0 }); // 3D Camera Angles
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isRotating, setIsRotating] = useState(true);

  // Search & Branch Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranches, setSelectedBranches] = useState<Record<string, boolean>>({
    nucleus: true,
    certs: true,
    coding: true,
    aios: true,
    kb: true,
    templates: true,
  });

  // Selected & Hovered Node
  const [hoveredNode, setHoveredNode] = useState<SimGalaxyNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<SimGalaxyNode | null>(null);

  // Starfield & Simulation Refs
  const simNodesRef = useRef<SimGalaxyNode[]>([]);
  const starfieldRef = useRef<SimParticle[]>([]);
  const signalsRef = useRef<NeuralSignal[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  const branchColorMap: Record<string, string> = {
    nucleus: '#FFD700',
    certs: '#10B981',
    coding: '#3B82F6',
    aios: '#A855F7',
    kb: '#F97316',
    templates: '#EC4899',
  };

  const branchNames: Record<string, string> = {
    nucleus: 'Master Nucleus',
    certs: '01 Certifications (eJPT)',
    coding: '02 Coding Projects',
    aios: '03 AI OS Agentic Fleet',
    kb: '04 Knowledge Base',
    templates: '05 Vault Templates',
  };

  // Initialize 3D orbital nodes & starfield
  useEffect(() => {
    // Generate background stars
    const stars: SimParticle[] = [];
    for (let i = 0; i < 280; i++) {
      stars.push({
        x: (Math.random() - 0.5) * 2000,
        y: (Math.random() - 0.5) * 2000,
        z: (Math.random() - 0.5) * 1000,
        size: Math.random() * 1.8 + 0.5,
        alpha: Math.random() * 0.7 + 0.2,
        speed: (Math.random() * 0.0003) + 0.0001,
      });
    }
    starfieldRef.current = stars;

    // Map graph nodes into 3D orbital coordinates
    if (graphData.nodes && graphData.nodes.length > 0) {
      const branchIndices: Record<string, number> = {
        nucleus: 0,
        certs: 1,
        coding: 2,
        aios: 3,
        kb: 4,
        templates: 5,
      };

      const nodes: SimGalaxyNode[] = graphData.nodes.map((n, idx) => {
        const isRoot = n.branch === 'nucleus' || n.tier === 0;
        const bIdx = branchIndices[n.branch] ?? (idx % 6);
        const baseAngle = (bIdx / 6) * Math.PI * 2 + (Math.random() * 0.4 - 0.2);
        const radius = isRoot ? 10 : 80 + (n.tier * 65) + (Math.random() * 40);
        const elevation = isRoot ? 0 : (Math.random() - 0.5) * (60 + n.tier * 30);
        const orbitSpeed = isRoot ? 0 : (0.0006 / (n.tier + 1)) * (idx % 2 === 0 ? 1 : 1.15);

        return {
          id: n.id,
          label: n.label,
          branch: n.branch,
          branchColor: branchColorMap[n.branch] || '#D4FF00',
          tier: n.tier,
          radius,
          angle: baseAngle,
          orbitSpeed,
          elevation,
          linkCount: n.linkCount || 1,
          path: n.path,
          x: 0,
          y: 0,
          z: 0,
        };
      });

      simNodesRef.current = nodes;

      // Initialize living synaptic neural signals traveling along wikilinks
      if (graphData.links && graphData.links.length > 0) {
        const sigs: NeuralSignal[] = [];
        const links = graphData.links;
        const totalSignals = Math.min(80, Math.max(35, links.length * 2));

        for (let i = 0; i < totalSignals; i++) {
          const link = links[i % links.length];
          const sId = typeof link.source === 'string' ? link.source : (link.source as any).id;
          const tId = typeof link.target === 'string' ? link.target : (link.target as any).id;

          const srcNode = nodes.find((n) => n.id === sId);
          const col = srcNode ? srcNode.branchColor : '#D4FF00';

          sigs.push({
            id: `sig-${i}`,
            sourceId: sId,
            targetId: tId,
            progress: Math.random(), // Staggered initial locations
            speed: 0.003 + Math.random() * 0.006,
            color: col,
            size: Math.random() * 2 + 2,
          });
        }
        signalsRef.current = sigs;
      }
    }
  }, [graphData]);

  // Main Canvas Render Loop with 3D Orbit Matrix
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      // Handle canvas resize
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      ctx.clearRect(0, 0, width, height);

      // Deep space cosmic backdrop
      const bgGrad = ctx.createRadialGradient(
        width / 2, height / 2, 20,
        width / 2, height / 2, Math.max(width, height) / 1.2
      );
      bgGrad.addColorStop(0, '#0F131A');
      bgGrad.addColorStop(0.5, '#0A0C10');
      bgGrad.addColorStop(1, '#050608');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Camera Angles & Auto-Rotation
      let currentYaw = rotation.yaw;
      if (isRotating && !isDragging) {
        currentYaw += 0.0012;
        setRotation(prev => ({ ...prev, yaw: (prev.yaw + 0.0012) % (Math.PI * 2) }));
      }
      const pitch = rotation.pitch;

      const cosYaw = Math.cos(currentYaw);
      const sinYaw = Math.sin(currentYaw);
      const cosPitch = Math.cos(pitch);
      const sinPitch = Math.sin(pitch);

      const centerX = width / 2 + pan.x;
      const centerY = height / 2 + pan.y;

      // 1. Draw Starfield
      starfieldRef.current.forEach(star => {
        // Orbit star slightly
        star.z += star.speed;
        const x1 = star.x * cosYaw - star.z * sinYaw;
        const z1 = star.x * sinYaw + star.z * cosYaw;
        const y2 = star.y * cosPitch - z1 * sinPitch;
        const z2 = star.y * sinPitch + z1 * cosPitch;

        const fov = 700;
        const scale = fov / (fov + z2);
        if (scale > 0) {
          const sx = centerX + x1 * scale * zoom;
          const sy = centerY + y2 * scale * zoom;

          if (sx >= 0 && sx <= width && sy >= 0 && sy <= height) {
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, star.alpha * scale)})`;
            ctx.beginPath();
            ctx.arc(sx, sy, Math.max(0.6, star.size * scale), 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });

      // 2. Solar Galaxy Center Core Glow (Master Nucleus)
      const coreGrad = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, 120 * zoom
      );
      coreGrad.addColorStop(0, 'rgba(212, 255, 0, 0.45)');
      coreGrad.addColorStop(0.3, 'rgba(255, 215, 0, 0.2)');
      coreGrad.addColorStop(0.7, 'rgba(0, 240, 255, 0.08)');
      coreGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 120 * zoom, 0, Math.PI * 2);
      ctx.fill();

      // 3. Update & Project 3D Nodes
      const projectedNodes: SimGalaxyNode[] = [];
      const nodePositionMap = new Map<string, { sx: number; sy: number }>();

      simNodesRef.current.forEach(node => {
        // Filter by branch or search query
        const branchOk = selectedBranches[node.branch] ?? true;
        const searchOk = searchQuery === '' || 
          node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          node.branch.toLowerCase().includes(searchQuery.toLowerCase());

        if (!branchOk || !searchOk) return;

        // Orbital revolution
        node.angle += node.orbitSpeed;

        const bx = Math.cos(node.angle) * node.radius;
        const by = Math.sin(node.angle) * node.radius;
        const bz = node.elevation;

        // 3D Pitch and Yaw transformation
        const x1 = bx * cosYaw - bz * sinYaw;
        const z1 = bx * sinYaw + bz * cosYaw;
        const y2 = by * cosPitch - z1 * sinPitch;
        const z2 = by * sinPitch + z1 * cosPitch;

        node.x = x1;
        node.y = y2;
        node.z = z2;

        const fov = 650;
        const scale = fov / (fov + z2);

        if (scale > 0) {
          const sx = centerX + x1 * scale * zoom;
          const sy = centerY + y2 * scale * zoom;
          const baseRadius = node.tier === 0 ? 9 : Math.min(8, 3.5 + Math.sqrt(node.linkCount) * 1.2);
          const screenRadius = baseRadius * scale * zoom;

          node.screenX = sx;
          node.screenY = sy;
          node.screenRadius = screenRadius;

          projectedNodes.push(node);
          nodePositionMap.set(node.id, { sx, sy });
        }
      });

      // Sort by Z-depth for correct rendering order
      projectedNodes.sort((a, b) => b.z - a.z);

      // 4. Render Constellation Wikilinks
      if (graphData.links && graphData.links.length > 0) {
        ctx.lineWidth = 0.8;
        graphData.links.forEach(link => {
          const sId = typeof link.source === 'string' ? link.source : (link.source as any).id;
          const tId = typeof link.target === 'string' ? link.target : (link.target as any).id;

          const p1 = nodePositionMap.get(sId);
          const p2 = nodePositionMap.get(tId);

          if (p1 && p2) {
            const isHighlighted = 
              (hoveredNode && (hoveredNode.id === sId || hoveredNode.id === tId)) ||
              (selectedNode && (selectedNode.id === sId || selectedNode.id === tId));

            ctx.strokeStyle = isHighlighted ? 'rgba(212, 255, 0, 0.8)' : 'rgba(255, 255, 255, 0.08)';
            ctx.lineWidth = isHighlighted ? 2 : 0.6;
            ctx.beginPath();
            ctx.moveTo(p1.sx, p1.sy);
            ctx.lineTo(p2.sx, p2.sy);
            ctx.stroke();
          }
        });
      }

      // 4b. Render Living Synaptic Signals Travelling Across Linked Notes
      if (signalsRef.current.length > 0) {
        signalsRef.current.forEach((sig) => {
          sig.progress += sig.speed;
          if (sig.progress >= 1) {
            sig.progress = 0;
          }

          const p1 = nodePositionMap.get(sig.sourceId);
          const p2 = nodePositionMap.get(sig.targetId);

          if (p1 && p2) {
            // Signal position on 2D screen
            const sx = p1.sx + (p2.sx - p1.sx) * sig.progress;
            const sy = p1.sy + (p2.sy - p1.sy) * sig.progress;

            // Comet tail trail
            const tailProgress = Math.max(0, sig.progress - 0.08);
            const tx = p1.sx + (p2.sx - p1.sx) * tailProgress;
            const ty = p1.sy + (p2.sy - p1.sy) * tailProgress;

            const trailGrad = ctx.createLinearGradient(tx, ty, sx, sy);
            trailGrad.addColorStop(0, 'transparent');
            trailGrad.addColorStop(1, sig.color);

            ctx.beginPath();
            ctx.moveTo(tx, ty);
            ctx.lineTo(sx, sy);
            ctx.strokeStyle = trailGrad;
            ctx.lineWidth = sig.size * 1.3;
            ctx.lineCap = 'round';
            ctx.stroke();

            // Glowing Signal Head Pulse
            ctx.beginPath();
            ctx.arc(sx, sy, sig.size, 0, Math.PI * 2);
            ctx.fillStyle = sig.color;
            ctx.shadowColor = sig.color;
            ctx.shadowBlur = 12;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        });
      }

      // 5. Render Planet Nodes
      projectedNodes.forEach(node => {
        const sx = node.screenX!;
        const sy = node.screenY!;
        const sr = Math.max(2, node.screenRadius!);

        const isHovered = hoveredNode?.id === node.id;
        const isSelected = selectedNode?.id === node.id;

        // Glow halo
        if (isHovered || isSelected || node.tier === 0) {
          const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr * 4);
          halo.addColorStop(0, node.branchColor);
          halo.addColorStop(1, 'transparent');
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(sx, sy, sr * 4, 0, Math.PI * 2);
          ctx.fill();
        }

        // Node Body
        ctx.fillStyle = isHovered || isSelected ? '#D4FF00' : node.branchColor;
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();

        // Node Label
        if (isHovered || isSelected || node.tier <= 1 || zoom > 1.3) {
          ctx.font = `${isHovered || isSelected ? 'bold 11px' : '9px'} 'Plus Jakarta Sans', sans-serif`;
          ctx.fillStyle = isHovered || isSelected ? '#D4FF00' : 'rgba(255, 255, 255, 0.85)';
          ctx.textAlign = 'center';
          ctx.fillText(node.label, sx, sy + sr + 11);
        }
      });

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [rotation, zoom, pan, isRotating, isDragging, selectedBranches, searchQuery, hoveredNode, selectedNode, graphData]);

  // Mouse / Touch handlers for 3D Orbit Interaction
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });

    // Check hit test for node click
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let clicked: SimGalaxyNode | null = null;
    for (const node of simNodesRef.current) {
      if (node.screenX !== undefined && node.screenY !== undefined && node.screenRadius !== undefined) {
        const dx = mouseX - node.screenX;
        const dy = mouseY - node.screenY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= Math.max(8, node.screenRadius + 4)) {
          clicked = node;
          break;
        }
      }
    }

    if (clicked) {
      setSelectedNode(clicked);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;

      if (e.shiftKey || e.button === 2) {
        // Pan
        setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      } else {
        // Orbit Pitch and Yaw
        setRotation(prev => ({
          yaw: prev.yaw + dx * 0.005,
          pitch: Math.max(-1.4, Math.min(1.4, prev.pitch + dy * 0.005)),
        }));
      }
      setDragStart({ x: e.clientX, y: e.clientY });
    } else {
      // Hover detection
      let hit: SimGalaxyNode | null = null;
      for (const node of simNodesRef.current) {
        if (node.screenX !== undefined && node.screenY !== undefined && node.screenRadius !== undefined) {
          const dx = mouseX - node.screenX;
          const dy = mouseY - node.screenY;
          if (Math.sqrt(dx * dx + dy * dy) <= Math.max(8, node.screenRadius + 4)) {
            hit = node;
            break;
          }
        }
      }
      setHoveredNode(hit);
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom(prev => Math.max(0.4, Math.min(3.5, prev * zoomDelta)));
  };

  return (
    <div className={`relative w-full ${
      isEmbedded 
        ? (height || 'h-[460px]') 
        : 'h-[calc(100vh-140px)] min-h-[600px]'
    } rounded-3xl overflow-hidden border border-black/[0.08] dark:border-white/[0.08] bg-[#0A0C10] shadow-2xl flex flex-col`}>
      {/* 3D Canvas Viewport */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      />

      {/* Top Floating HUD Filter Bar */}
      <div className="absolute top-4 left-4 right-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pointer-events-none">
        {/* Branch Filters */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 pointer-events-auto overflow-x-auto no-scrollbar">
          {Object.entries(branchNames).map(([key, label]) => {
            const isSelected = selectedBranches[key] ?? true;
            const color = branchColorMap[key];

            return (
              <button
                key={key}
                onClick={() => setSelectedBranches(prev => ({ ...prev, [key]: !prev[key] }))}
                className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                  isSelected 
                    ? 'text-black shadow-[0_0_15px_rgba(212,255,0,0.35)]' 
                    : 'text-gray-400 bg-white/5 opacity-50'
                }`}
                style={{ backgroundColor: isSelected ? color : undefined }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: isSelected ? '#000' : color }} />
                {label.split(' ')[0]}
              </button>
            );
          })}
        </div>

        {/* Search & Studio Link */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search vault notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-black/60 backdrop-blur-xl border border-white/10 rounded-full text-white placeholder-gray-400 focus:outline-none focus:border-[#D4FF00]"
            />
          </div>

          {/* Zoom In & Out Controls (+ and -) */}
          <div className="flex items-center gap-1 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full p-1 shadow-lg">
            <button
              onClick={() => setZoom(prev => Math.min(3.5, Math.round((prev + 0.25) * 100) / 100))}
              className="w-7 h-7 rounded-full flex items-center justify-center font-mono font-black text-sm text-gray-300 hover:text-black hover:bg-[#D4FF00] transition active:scale-90"
              title="Zoom In (+)"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
            </button>
            <span className="font-mono text-[10px] text-gray-300 font-extrabold px-1.5 select-none min-w-[38px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(prev => Math.max(0.4, Math.round((prev - 0.25) * 100) / 100))}
              className="w-7 h-7 rounded-full flex items-center justify-center font-mono font-black text-sm text-gray-300 hover:text-black hover:bg-[#D4FF00] transition active:scale-90"
              title="Zoom Out (-)"
            >
              <Minus className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          </div>

          <button
            onClick={() => setIsRotating(prev => !prev)}
            className={`p-2 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 text-xs font-bold transition-all ${
              isRotating ? 'text-[#D4FF00] border-[#D4FF00]/40' : 'text-gray-400'
            }`}
            title="Toggle Cosmic Auto-Orbit"
          >
            <Orbit className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setZoom(1.1);
              setPan({ x: 0, y: 0 });
              setRotation({ pitch: 0.35, yaw: 0 });
            }}
            className="p-2 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 text-gray-400 hover:text-white transition-all"
            title="Reset 3D Viewport"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {onExpandFullscreen && (
            <button
              onClick={onExpandFullscreen}
              className="p-2 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 text-gray-400 hover:text-[#D4FF00] hover:border-[#D4FF00]/40 transition-all flex items-center gap-1.5 px-3"
              title="Expand Fullscreen Universe"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold hidden sm:inline">Universe</span>
            </button>
          )}
        </div>
      </div>

      {/* Floating Selected Node Inspection Card */}
      {selectedNode && (
        <div className="absolute bottom-6 right-6 max-w-sm w-full bg-[#141820]/90 backdrop-blur-2xl border border-white/10 p-5 rounded-3xl shadow-[0_15px_40px_rgba(0,0,0,0.8)] animate-fadeIn text-white space-y-3">
          <div className="flex items-center justify-between">
            <span 
              className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full text-black"
              style={{ backgroundColor: selectedNode.branchColor }}
            >
              Tier {selectedNode.tier} • {branchNames[selectedNode.branch] || selectedNode.branch}
            </span>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-gray-400 hover:text-white text-xs font-bold px-1.5"
            >
              ✕
            </button>
          </div>

          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#D4FF00]" />
              {selectedNode.label}
            </h3>
            <p className="text-[11px] font-mono text-gray-400 truncate mt-0.5">
              {selectedNode.path}
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-gray-300 py-2 border-y border-white/10">
            <div>
              <span className="text-gray-500 text-[10px] block">Cross-Links</span>
              <span className="font-bold text-[#D4FF00]">{selectedNode.linkCount} connections</span>
            </div>
            <div>
              <span className="text-gray-500 text-[10px] block">Branch</span>
              <span className="font-bold">{selectedNode.branch}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => onOpenNote(selectedNode.path)}
              className="flex-1 py-2 bg-[#D4FF00] hover:bg-[#C6F500] text-black font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-[0_0_15px_rgba(212,255,0,0.3)]"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Open in Studio
            </button>
            <button
              onClick={() => {
                // Focus camera on node
                setPan({ x: -selectedNode.x * zoom, y: -selectedNode.y * zoom });
                setZoom(2);
              }}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 transition-colors"
              title="Focus 3D Viewport"
            >
              <Crosshair className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Bottom Telemetry Legend */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2 text-[11px] font-mono text-gray-400 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
        <span className="flex items-center gap-1 text-[#D4FF00]">
          <Sparkles className="w-3 h-3" />
          {simNodesRef.current.length} Vault Nodes
        </span>
        <span>•</span>
        <span>Drag to 3D Orbit</span>
        <span>•</span>
        <span>Scroll to Zoom</span>
      </div>
    </div>
  );
};