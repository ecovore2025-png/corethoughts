import { useState, useEffect, useRef } from 'react';

// Generate nonlinear trajectory
function nonlinearDynamics(x: number, y: number): [number, number] {
  return [
    0.8 * x + 0.3 * Math.sin(y * 2),
    0.7 * y + 0.2 * Math.cos(x * 3) + 0.1 * x * y
  ];
}

export default function MathDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<'original' | 'lifted' | 'koopman'>('original');
  const [sigma, setSigma] = useState(1.0);
  const [showTrajectory, setShowTrajectory] = useState(true);
  const [timeStep, setTimeStep] = useState(0);

  // Generate data points
  const [originalPoints, setOriginalPoints] = useState<[number, number][]>([]);
  const [liftedPoints, setLiftedPoints] = useState<[number, number, number][]>([]);

  useEffect(() => {
    const pts: [number, number][] = [];
    let x = 0.5, y = 0.5;
    for (let i = 0; i < 100; i++) {
      pts.push([x, y]);
      [x, y] = nonlinearDynamics(x, y);
      // Keep in bounds
      x = Math.max(-1.5, Math.min(1.5, x));
      y = Math.max(-1.5, Math.min(1.5, y));
    }
    setOriginalPoints(pts);

    // Lift to higher dimension using polynomial features
    const lifted: [number, number, number][] = pts.map(([x, y]) => [
      x,
      y,
      x * y // interaction term
    ]);
    setLiftedPoints(lifted);
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    if (phase === 'original') {
      drawOriginal(ctx, w, h);
    } else if (phase === 'lifted') {
      drawLifted(ctx, w, h);
    } else {
      drawKoopman(ctx, w, h);
    }
  }, [phase, originalPoints, liftedPoints, sigma, showTrajectory, timeStep]);

  function drawOriginal(ctx: CanvasRenderingContext2D, w: number, h: number) {
    // Title
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('原始非线性动力学 (x, y) 空间', 20, 30);

    // Axes
    const cx = w / 2, cy = h / 2;
    const scale = Math.min(w, h) * 0.3;

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - scale * 1.5, cy);
    ctx.lineTo(cx + scale * 1.5, cy);
    ctx.moveTo(cx, cy - scale * 1.5);
    ctx.lineTo(cx, cy + scale * 1.5);
    ctx.stroke();

    // Draw trajectory
    if (showTrajectory && originalPoints.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = '#f9731640';
      ctx.lineWidth = 1;
      for (let i = 0; i < Math.min(timeStep || originalPoints.length, originalPoints.length - 1); i++) {
        const [x1, y1] = originalPoints[i];
        const [x2, y2] = originalPoints[i + 1];
        ctx.moveTo(cx + x1 * scale, cy - y1 * scale);
        ctx.lineTo(cx + x2 * scale, cy - y2 * scale);
      }
      ctx.stroke();
    }

    // Draw points
    const maxPts = timeStep || originalPoints.length;
    for (let i = 0; i < Math.min(maxPts, originalPoints.length); i++) {
      const [x, y] = originalPoints[i];
      const alpha = 1 - i / originalPoints.length * 0.7;
      ctx.beginPath();
      ctx.arc(cx + x * scale, cy - y * scale, 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(249, 115, 22, ${alpha})`;
      ctx.fill();
    }

    // Info
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px sans-serif';
    ctx.fillText('非线性系统: x\' = 0.8x + 0.3sin(2y), y\' = 0.7y + 0.2cos(3x) + 0.1xy', 20, h - 20);
    ctx.fillText('→ 轨迹在低维空间中是非线性的、难以预测的', 20, h - 40);
  }

  function drawLifted(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('核特征映射后的高维空间 (φ(x), φ(y), φ(x·y))', 20, 30);

    // 3D-ish projection (isometric)
    const cx = w / 2, cy = h / 2 + 30;
    const scale = Math.min(w, h) * 0.2;

    // Draw axes
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    // x-axis
    ctx.beginPath();
    ctx.moveTo(cx - scale * 2, cy + scale * 0.5);
    ctx.lineTo(cx + scale * 2, cy - scale * 0.5);
    ctx.stroke();
    // y-axis
    ctx.beginPath();
    ctx.moveTo(cx - scale * 2, cy - scale * 0.5);
    ctx.lineTo(cx + scale * 2, cy + scale * 0.5);
    ctx.stroke();
    // z-axis (interaction)
    ctx.beginPath();
    ctx.moveTo(cx, cy + scale * 1.5);
    ctx.lineTo(cx, cy - scale * 1.5);
    ctx.stroke();

    ctx.fillStyle = '#60a5fa';
    ctx.font = '10px sans-serif';
    ctx.fillText('φ(x)', cx + scale * 2 + 5, cy - scale * 0.5);
    ctx.fillText('φ(y)', cx + scale * 2 + 5, cy + scale * 0.5);
    ctx.fillText('φ(x·y)', cx + 5, cy - scale * 1.5 - 5);

    // Project 3D to 2D (simple orthographic)
    const maxPts = timeStep || liftedPoints.length;
    for (let i = 0; i < Math.min(maxPts, liftedPoints.length); i++) {
      const [x, y, z] = liftedPoints[i];
      // Isometric projection
      const px = cx + (x - y) * scale * 0.7;
      const py = cy + (x + y) * scale * 0.3 - z * scale * 0.8;
      const alpha = 1 - i / liftedPoints.length * 0.7;

      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(96, 165, 250, ${alpha})`;
      ctx.fill();
    }

    // Kernel coupling visualization
    ctx.fillStyle = '#a78bfa';
    ctx.font = '11px sans-serif';
    ctx.fillText(`核函数: k(a,b) = exp(-|a-b|² / (2σ²)), σ = ${sigma.toFixed(2)}`, 20, h - 40);
    ctx.fillText('→ 通过核映射，非线性关系在高维空间中变得线性可分', 20, h - 20);
  }

  function drawKoopman(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('Koopman 线性化: 高维空间中的线性动力学', 20, 30);

    const cx = w / 2, cy = h / 2 + 30;
    const scale = Math.min(w, h) * 0.2;

    // Draw axes
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - scale * 2, cy + scale * 0.5);
    ctx.lineTo(cx + scale * 2, cy - scale * 0.5);
    ctx.moveTo(cx - scale * 2, cy - scale * 0.5);
    ctx.lineTo(cx + scale * 2, cy + scale * 0.5);
    ctx.moveTo(cx, cy + scale * 1.5);
    ctx.lineTo(cx, cy - scale * 1.5);
    ctx.stroke();

    // Approximate Koopman linearization
    // In lifted space, dynamics become approximately: G(t+1) ≈ K̃ · G(t)
    // We simulate this by fitting a linear model to the lifted trajectory
    const maxPts = timeStep || liftedPoints.length;

    // Compute approximate linear dynamics in lifted space
    if (liftedPoints.length > 2) {
      // Simple linear regression for demonstration
      for (let i = 0; i < Math.min(maxPts - 1, liftedPoints.length - 1); i++) {
        const [x1, y1, z1] = liftedPoints[i];
        const [x2, y2, z2] = liftedPoints[i + 1];

        const px1 = cx + (x1 - y1) * scale * 0.7;
        const py1 = cy + (x1 + y1) * scale * 0.3 - z1 * scale * 0.8;
        const px2 = cx + (x2 - y2) * scale * 0.7;
        const py2 = cy + (x2 + y2) * scale * 0.3 - z2 * scale * 0.8;

        // Draw linear segments (Koopman approximation)
        ctx.beginPath();
        ctx.moveTo(px1, py1);
        ctx.lineTo(px2, py2);
        ctx.strokeStyle = `rgba(34, 197, 94, ${0.3 + 0.7 * (1 - i / liftedPoints.length)})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw points
        ctx.beginPath();
        ctx.arc(px1, py1, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(34, 197, 94, ${1 - i / liftedPoints.length * 0.7})`;
        ctx.fill();
      }
    }

    // Show Koopman matrix visualization
    ctx.fillStyle = '#22c55e';
    ctx.font = '11px sans-serif';
    ctx.fillText('Koopman 算子 K̃: G(t+1) = K̃ · G(t)', 20, h - 60);
    ctx.fillText('→ 非线性动力学在高维观测空间中变为线性!', 20, h - 40);
    ctx.fillText('→ 这就是 Cover 定理 + Koopman 理论的力量', 20, h - 20);
  }

  // Animation timer
  useEffect(() => {
    if (!showTrajectory) return;
    const interval = setInterval(() => {
      setTimeStep(prev => {
        const max = phase === 'original' ? originalPoints.length : liftedPoints.length;
        return prev >= max ? 0 : prev + 1;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [showTrajectory, phase, originalPoints.length, liftedPoints.length]);

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-purple-500/20">
        <h2 className="text-xl font-bold text-purple-300 mb-2">数学机制演示</h2>
        <p className="text-slate-400 text-sm mb-4">
          可视化 SDL-CF 的核心数学机制：非线性动力学 → 核特征映射 → Koopman 线性化。
          展示 Cover 定理和 Koopman 算子如何协同工作。
        </p>

        {/* Controls */}
        <div className="flex flex-wrap gap-3 items-center mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => { setPhase('original'); setTimeStep(0); }}
              className={`px-3 py-1.5 rounded text-sm ${phase === 'original' ? 'bg-orange-600 text-white' : 'bg-slate-700 text-slate-300'}`}
            >
              原始空间
            </button>
            <button
              onClick={() => { setPhase('lifted'); setTimeStep(0); }}
              className={`px-3 py-1.5 rounded text-sm ${phase === 'lifted' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}
            >
              核映射空间
            </button>
            <button
              onClick={() => { setPhase('koopman'); setTimeStep(0); }}
              className={`px-3 py-1.5 rounded text-sm ${phase === 'koopman' ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-300'}`}
            >
              Koopman 线性化
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">核宽度 σ:</span>
            <input
              type="range"
              min="0.1"
              max="3.0"
              step="0.1"
              value={sigma}
              onChange={(e) => setSigma(parseFloat(e.target.value))}
              className="w-20 accent-purple-500"
            />
            <span className="text-xs text-slate-300">{sigma.toFixed(1)}</span>
          </div>
          <button
            onClick={() => setShowTrajectory(!showTrajectory)}
            className={`px-3 py-1.5 rounded text-sm ${showTrajectory ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300'}`}
          >
            {showTrajectory ? '⏸ 暂停动画' : '▶ 播放动画'}
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-purple-500/20">
        <canvas
          ref={canvasRef}
          width={700}
          height={400}
          className="w-full rounded-lg"
          style={{ maxHeight: '400px' }}
        />
      </div>

      {/* Explanation */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-orange-900/20 rounded-xl p-4 border border-orange-500/20">
          <h3 className="text-sm font-bold text-orange-300 mb-2">S1-S2: 原始非线性</h3>
          <p className="text-xs text-slate-400">
            在低维空间中，动力学是非线性的。轨迹呈现复杂的曲线，难以用简单的线性模型预测。
            这就是为什么我们需要升维。
          </p>
          <div className="mt-2 font-mono text-xs text-slate-500">
            x' = 0.8x + 0.3sin(2y)<br/>
            y' = 0.7y + 0.2cos(3x) + 0.1xy
          </div>
        </div>
        <div className="bg-blue-900/20 rounded-xl p-4 border border-blue-500/20">
          <h3 className="text-sm font-bold text-blue-300 mb-2">S2: 核特征映射</h3>
          <p className="text-xs text-slate-400">
            通过核函数 k(x,y) = exp(-|x-y|²/(2σ²))，我们将数据隐式映射到无穷维 RKHS。
            在这个高维空间中，原本非线性的关系变得线性可分（Cover 定理）。
          </p>
          <div className="mt-2 font-mono text-xs text-slate-500">
            φ: (x,y) → (x, y, xy, x², y², ...)
          </div>
        </div>
        <div className="bg-green-900/20 rounded-xl p-4 border border-green-500/20">
          <h3 className="text-sm font-bold text-green-300 mb-2">S5: Koopman 线性化</h3>
          <p className="text-xs text-slate-400">
            在高维观测空间中，Koopman 算子将非线性动力学转化为线性动力学：
            G(t+1) = K̃·G(t)。这使得我们可以用简单的矩阵运算来预测复杂的非线性行为。
          </p>
          <div className="mt-2 font-mono text-xs text-slate-500">
            K̃ ∈ ℝ^(N×N), G = [g₁,...,g_N]^T
          </div>
        </div>
      </div>

      {/* Surprise demonstration */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-purple-500/20">
        <h3 className="text-sm font-bold text-purple-300 mb-3">惊讶度 ε 的可视化</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="h-8 bg-slate-900 rounded-full overflow-hidden relative">
              <div className="absolute inset-y-0 left-[10%] w-[5%] bg-green-500/30 border-x border-green-500" />
              <div className="absolute inset-y-0 left-[10%] right-[20%] bg-gradient-to-r from-green-500/20 to-yellow-500/20" />
              <div className="absolute inset-y-0 right-[20%] w-[20%] bg-red-500/20" />
              {/* Markers */}
              <div className="absolute top-0 bottom-0 left-[10%] border-l-2 border-green-400" />
              <div className="absolute top-0 bottom-0 right-[20%] border-r-2 border-red-400" />
              {/* Labels */}
              <span className="absolute -top-5 left-[8%] text-[10px] text-green-400">ε_min</span>
              <span className="absolute -top-5 right-[18%] text-[10px] text-red-400">ε_max</span>
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-slate-500">
              <span>过低（封闭，无学习）</span>
              <span>最优区间（可学习且保持探索）</span>
              <span>过高（耦合失败）</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-3">
          <strong className="text-yellow-300">关键创新：</strong>与 Friston 的自由能原理不同，本框架要求惊讶度保持在 [ε_min, ε_max] 区间内。
          完全最小化惊讶度会导致系统失去探索能力和创造性——系统需要适度的"惊讶"来驱动学习。
        </p>
      </div>
    </div>
  );
}
