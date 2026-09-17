import { useState, useEffect, useRef } from 'react';

interface Point {
  x: number;
  y: number;
  stage: number;
  cycle: number;
}

export default function QuadrantVisualization() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const animRef = useRef<number>(0);

  // Generate spiral trajectory
  useEffect(() => {
    const newPoints: Point[] = [];
    let t = 0;
    for (let cycle = 0; cycle < 5; cycle++) {
      for (let stage = 1; stage <= 5; stage++) {
        // Spiral inward (toward lower-left = low entropy, high commensurability)
        const decay = 1 - cycle * 0.15;
        const angle = t * 0.8 + stage * 1.2;
        const radius = (0.3 + decay * 0.3) * (1 + 0.1 * Math.sin(stage));

        // Map to quadrant space: x = commensurability, y = entropy
        // Q1: top-left (high H, high C), Q2: top-right (high H, low C)
        // Q3: bottom-right (low H, low C), Q4: bottom-left (low H, high C)
        const cx = 0.5 + radius * Math.cos(angle) * 0.4;
        const cy = 0.5 + radius * Math.sin(angle) * 0.4;

        newPoints.push({
          x: Math.max(0.05, Math.min(0.95, cx)),
          y: Math.max(0.05, Math.min(0.95, cy)),
          stage,
          cycle,
        });
        t += 0.3;
      }
    }
    setPoints(newPoints);
  }, []);

  // Animate drawing
  useEffect(() => {
    if (!isAnimating || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let idx = 0;
    const draw = () => {
      if (idx >= points.length) {
        setIsAnimating(false);
        return;
      }

      const w = canvas.width;
      const h = canvas.height;
      const px = points[idx].x * w;
      const py = (1 - points[idx].y) * h;

      // Draw point
      const colors = ['#3b82f6', '#a855f7', '#f97316', '#22c55e', '#06b6d4'];
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fillStyle = colors[points[idx].stage - 1];
      ctx.fill();

      // Draw connecting line
      if (idx > 0) {
        const prevPx = points[idx - 1].x * w;
        const prevPy = (1 - points[idx - 1].y) * h;
        ctx.beginPath();
        ctx.moveTo(prevPx, prevPy);
        ctx.lineTo(px, py);
        ctx.strokeStyle = colors[points[idx].stage - 1] + '60';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      idx++;
      animRef.current = requestAnimationFrame(draw);
    };

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid(ctx, canvas.width, canvas.height);
    draw();

    return () => cancelAnimationFrame(animRef.current);
  }, [isAnimating, points]);

  function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {
    // Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    // Quadrant backgrounds
    ctx.fillStyle = '#1e3a5f20';
    ctx.fillRect(0, 0, w / 2, h / 2); // Q1
    ctx.fillStyle = '#3b1f5f20';
    ctx.fillRect(w / 2, 0, w / 2, h / 2); // Q2
    ctx.fillStyle = '#5f3b1f20';
    ctx.fillRect(w / 2, h / 2, w / 2, h / 2); // Q3
    ctx.fillStyle = '#1f5f3b20';
    ctx.fillRect(0, h / 2, w / 2, h / 2); // Q4

    // Grid lines
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Labels
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#60a5fa';
    ctx.fillText('Q1: 高熵高可通约', 10, 20);
    ctx.fillStyle = '#a78bfa';
    ctx.fillText('Q2: 高熵低可通约', w / 2 + 10, 20);
    ctx.fillStyle = '#fb923c';
    ctx.fillText('Q3: 低熵低可通约', w / 2 + 10, h - 10);
    ctx.fillStyle = '#34d399';
    ctx.fillText('Q4: 低熵高可通约', 10, h - 10);

    // Axis labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px sans-serif';
    ctx.fillText('可通约度 C →', w / 2 - 30, h - 30);
    ctx.save();
    ctx.translate(20, h / 2 + 30);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('熵 H →', 0, 0);
    ctx.restore();
  }

  const startAnimation = () => {
    setIsAnimating(true);
  };

  const drawAllAtOnce = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid(ctx, canvas.width, canvas.height);

    const colors = ['#3b82f6', '#a855f7', '#f97316', '#22c55e', '#06b6d4'];
    const w = canvas.width;
    const h = canvas.height;

    for (let i = 0; i < points.length; i++) {
      const px = points[i].x * w;
      const py = (1 - points[i].y) * h;

      if (i > 0) {
        const prevPx = points[i - 1].x * w;
        const prevPy = (1 - points[i - 1].y) * h;
        ctx.beginPath();
        ctx.moveTo(prevPx, prevPy);
        ctx.lineTo(px, py);
        ctx.strokeStyle = colors[points[i].stage - 1] + '60';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fillStyle = colors[points[i].stage - 1];
      ctx.fill();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-purple-500/20">
        <h2 className="text-xl font-bold text-purple-300 mb-2">四象限动力学可视化</h2>
        <p className="text-slate-400 text-sm mb-4">
          系统在 (熵 H, 可通约度 C) 空间中的螺旋运动轨迹。理想路径：Q1 → Q2 → Q3 → Q4 → Q1'（更高阶的循环）。
        </p>
        <div className="flex gap-3">
          <button
            onClick={startAnimation}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white"
          >
            ▶ 动画演示
          </button>
          <button
            onClick={drawAllAtOnce}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-600 hover:bg-slate-700 text-white"
          >
            📊 静态展示
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="bg-slate-800/50 rounded-2xl p-4 border border-purple-500/20">
        <canvas
          ref={canvasRef}
          width={600}
          height={450}
          className="w-full rounded-lg"
          style={{ maxHeight: '450px' }}
        />
      </div>

      {/* Legend */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-purple-500/20">
          <h3 className="text-sm font-bold text-purple-300 mb-3">阶段颜色编码</h3>
          <div className="space-y-2">
            {[
              { stage: 'S1 输入', color: 'bg-blue-500', desc: '接收外部信息' },
              { stage: 'S2 感知', color: 'bg-purple-500', desc: '核耦合降维' },
              { stage: 'S3 干预', color: 'bg-orange-500', desc: '升维生成输出' },
              { stage: 'S4 抽象', color: 'bg-green-500', desc: '统合泛化' },
              { stage: 'S5 解耦', color: 'bg-cyan-500', desc: 'Koopman线性化' },
            ].map((item) => (
              <div key={item.stage} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${item.color}`} />
                <span className="text-sm text-slate-300">{item.stage}</span>
                <span className="text-xs text-slate-500">— {item.desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-4 border border-purple-500/20">
          <h3 className="text-sm font-bold text-purple-300 mb-3">象限转移规则</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-blue-300">Q1→Q2</span>
              <span className="text-slate-500">S2-S3: 熵保持，可通约度下降（开始专业化）</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-purple-300">Q2→Q3</span>
              <span className="text-slate-500">S4: 熵降低，可通约度保持低位（泛化但偏狭）</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-orange-300">Q3→Q4</span>
              <span className="text-slate-500">S5: 熵保持低位，可通约度大幅提升（智慧通达）</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-cyan-300">Q4→Q1'</span>
              <span className="text-slate-500">新一轮: 更高阶的开放态（螺旋上升）</span>
            </div>
          </div>
        </div>
      </div>

      {/* "Entropy's entropy increase law" */}
      <div className="bg-gradient-to-r from-orange-900/20 to-red-900/20 rounded-2xl p-6 border border-orange-500/20">
        <h3 className="text-lg font-bold text-orange-300 mb-3">"熵的熵增定律"</h3>
        <p className="text-slate-300 text-sm leading-relaxed mb-3">
          系统为了追求内部有序（降低自身熵 H），必须加速外部环境的无序化。
          而且，外部无序化的速率本身也在增长：
        </p>
        <div className="bg-slate-900/50 rounded-lg p-4 font-mono text-sm text-slate-300">
          <p>dH_system/dt &lt; 0 （系统内部有序化）</p>
          <p>dH_env/dt &gt; 0 （环境加速无序化）</p>
          <p>d²H_env/dt² &gt; 0 （无序化速率本身在增长）</p>
          <p className="mt-2 text-yellow-300">→ 这就是"为了更高的有序在更低一级的层面把物质给加速地无序化"</p>
        </div>
        <p className="text-slate-400 text-sm mt-3">
          类比：人类文明为了维持内部高度有序（科技、文化），正在加速消耗地球资源（熵增）。
          而消耗速率本身也在指数增长。
        </p>
      </div>
    </div>
  );
}
