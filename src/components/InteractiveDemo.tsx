import { useState, useCallback, useRef, useEffect } from 'react';

interface SimState {
  step: number;
  stage: number; // 1-5
  quadrant: number; // 1-4
  entropy: number;
  commensurability: number;
  surprise: number;
  dimension: number;
  linearity: number;
  history: { step: number; entropy: number; comm: number; stage: number }[];
  log: string[];
}



function simulateStep(prev: SimState): SimState {
  const next = { ...prev, step: prev.step + 1, history: [...prev.history], log: [...prev.log] };
  const noise = () => (Math.random() - 0.5) * 0.1;

  switch (prev.stage) {
    case 1: // S1: Input
      next.stage = 2;
      next.dimension = 5 + Math.floor(Math.random() * 3); // low-dim input
      next.surprise = 0.3 + Math.random() * 0.4;
      next.entropy = Math.min(1, prev.entropy + 0.05 + noise());
      next.log.push(`S1: 接收外部输入，维度 d=${next.dimension}，惊讶度 ε=${next.surprise.toFixed(3)}`);
      break;

    case 2: // S2: Perception (kernel coupling)
      next.stage = 3;
      // Simulate kernel coupling - dimension drops
      next.dimension = Math.max(2, Math.floor(prev.dimension * 0.4));
      // Surprise should decrease but stay non-zero
      next.surprise = Math.max(0.05, prev.surprise * 0.6 + noise() * 0.1);
      next.entropy = Math.min(1, prev.entropy + 0.02 + noise());
      next.commensurability = Math.max(0.1, prev.commensurability - 0.15 + noise());
      next.linearity = 0.5 + Math.random() * 0.3;
      next.log.push(`S2: 核耦合降维至 d=${next.dimension}，ε=${next.surprise.toFixed(3)}，C=${next.commensurability.toFixed(3)}`);
      if (next.surprise > 0.7) {
        next.log.push(`⚠️ 惊讶度过大！触发递归降阶策略...`);
        next.surprise *= 0.5;
      }
      break;

    case 3: // S3: Intervention (upscaling)
      next.stage = 4;
      next.dimension = prev.dimension * 2 + 3;
      next.linearity = prev.linearity + 0.1;
      next.log.push(`S3: 升维干预至 d=${next.dimension}，生成输出方程`);
      break;

    case 4: // S4: Abstraction (further upscaling)
      next.stage = 5;
      next.dimension = prev.dimension + 5;
      next.entropy = Math.max(0.1, prev.entropy - 0.2 + noise());
      next.commensurability = Math.max(0.05, prev.commensurability - 0.1 + noise());
      next.linearity = Math.min(0.9, prev.linearity + 0.15);
      next.log.push(`S4: 抽象统合至 d=${next.dimension}，H=${next.entropy.toFixed(3)}，C=${next.commensurability.toFixed(3)}`);
      next.log.push(`📚 知识的诅咒: Bias_KC = ${(1 - next.commensurability).toFixed(3)}`);
      break;

    case 5: // S5: Linearization & Decoupling
      next.stage = 1;
      next.dimension = prev.dimension + 3;
      next.entropy = Math.max(0.05, prev.entropy - 0.15 + noise());
      next.commensurability = Math.min(1, prev.commensurability + 0.3 + noise() * 0.5);
      next.linearity = Math.min(1, prev.linearity + 0.2);
      next.log.push(`S5: Koopman 线性化，d=${next.dimension}，线性度=${next.linearity.toFixed(3)}`);
      next.log.push(`🔓 解耦完成，因果涌现 CE=${(next.linearity * next.commensurability).toFixed(3)}`);
      next.log.push(`✅ 完成一轮 S1→S5 循环，进入第 ${Math.floor(next.step / 5) + 1} 轮`);
      break;
  }

  // Determine quadrant
  const highEntropy = next.entropy > 0.5;
  const highComm = next.commensurability > 0.5;
  if (highEntropy && highComm) next.quadrant = 1;
  else if (highEntropy && !highComm) next.quadrant = 2;
  else if (!highEntropy && !highComm) next.quadrant = 3;
  else next.quadrant = 4;

  next.history.push({ step: next.step, entropy: next.entropy, comm: next.commensurability, stage: next.stage });
  return next;
}

function getInitialState(): SimState {
  return {
    step: 0,
    stage: 1,
    quadrant: 1,
    entropy: 0.85,
    commensurability: 0.9,
    surprise: 0.5,
    dimension: 10,
    linearity: 0.2,
    history: [{ step: 0, entropy: 0.85, comm: 0.9, stage: 1 }],
    log: ['系统初始化：高熵高可通约态（Q1），准备开始认知循环...'],
  };
}

export default function InteractiveDemo() {
  const [state, setState] = useState<SimState>(getInitialState());
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(500);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const stepOnce = useCallback(() => {
    setState(prev => simulateStep(prev));
  }, []);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(stepOnce, speed);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, speed, stepOnce]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [state.log]);

  const reset = () => {
    setIsRunning(false);
    setState(getInitialState());
  };

  const stageNames = ['', 'S1 输入', 'S2 感知', 'S3 干预', 'S4 抽象', 'S5 解耦'];
  const stageColors = ['', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-green-500', 'bg-cyan-500'];
  const quadrantNames = ['', 'Q1: 高熵高可通约', 'Q2: 高熵低可通约', 'Q3: 低熵低可通约', 'Q4: 低熵高可通约'];
  const quadrantColors = ['', 'text-blue-300', 'text-purple-300', 'text-orange-300', 'text-cyan-300'];

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-purple-500/20">
        <h2 className="text-xl font-bold text-purple-300 mb-2">SDL-CF 交互模拟器</h2>
        <p className="text-slate-400 text-sm mb-4">
          模拟一个认知系统经历 S1→S5 的螺旋循环，观察熵、可通约度、维度和惊讶度的动态变化。
        </p>

        {/* Controls */}
        <div className="flex flex-wrap gap-3 items-center">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`px-4 py-2 rounded-lg font-medium text-sm ${
              isRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
            } text-white transition-colors`}
          >
            {isRunning ? '⏸ 暂停' : '▶ 运行'}
          </button>
          <button
            onClick={stepOnce}
            disabled={isRunning}
            className="px-4 py-2 rounded-lg font-medium text-sm bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 transition-colors"
          >
            ⏭ 单步
          </button>
          <button
            onClick={reset}
            className="px-4 py-2 rounded-lg font-medium text-sm bg-slate-600 hover:bg-slate-700 text-white transition-colors"
          >
            🔄 重置
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">速度:</span>
            <input
              type="range"
              min="100"
              max="1500"
              step="100"
              value={1600 - speed}
              onChange={(e) => setSpeed(1600 - parseInt(e.target.value))}
              className="w-24 accent-purple-500"
            />
          </div>
          <span className="text-xs text-slate-500">步数: {state.step}</span>
        </div>
      </div>

      {/* Status Panel */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-purple-500/20">
          <div className="text-xs text-slate-400 mb-1">当前阶段</div>
          <div className={`inline-block px-2 py-1 rounded text-sm font-bold text-white ${stageColors[state.stage]}`}>
            {stageNames[state.stage]}
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-purple-500/20">
          <div className="text-xs text-slate-400 mb-1">当前象限</div>
          <div className={`text-sm font-bold ${quadrantColors[state.quadrant]}`}>
            {quadrantNames[state.quadrant]}
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-purple-500/20">
          <div className="text-xs text-slate-400 mb-1">惊讶度 ε</div>
          <div className={`text-sm font-bold ${state.surprise > 0.7 ? 'text-red-400' : state.surprise < 0.2 ? 'text-yellow-400' : 'text-green-400'}`}>
            {state.surprise.toFixed(4)}
          </div>
          <div className="w-full bg-slate-700 rounded-full h-1.5 mt-2">
            <div
              className={`h-1.5 rounded-full ${state.surprise > 0.7 ? 'bg-red-500' : state.surprise < 0.2 ? 'bg-yellow-500' : 'bg-green-500'}`}
              style={{ width: `${state.surprise * 100}%` }}
            />
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-purple-500/20">
          <div className="text-xs text-slate-400 mb-1">当前维度</div>
          <div className="text-sm font-bold text-cyan-300">{state.dimension}</div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-purple-500/20">
          <div className="text-xs text-slate-400 mb-2">熵 H</div>
          <div className="text-2xl font-bold text-blue-300">{state.entropy.toFixed(3)}</div>
          <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
            <div className="h-2 rounded-full bg-blue-500" style={{ width: `${state.entropy * 100}%` }} />
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-purple-500/20">
          <div className="text-xs text-slate-400 mb-2">可通约度 C</div>
          <div className="text-2xl font-bold text-green-300">{state.commensurability.toFixed(3)}</div>
          <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
            <div className="h-2 rounded-full bg-green-500" style={{ width: `${state.commensurability * 100}%` }} />
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-purple-500/20">
          <div className="text-xs text-slate-400 mb-2">线性度 L</div>
          <div className="text-2xl font-bold text-purple-300">{state.linearity.toFixed(3)}</div>
          <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
            <div className="h-2 rounded-full bg-purple-500" style={{ width: `${state.linearity * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Trajectory Chart */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-purple-500/20">
        <h3 className="text-sm font-bold text-purple-300 mb-3">轨迹图 (H vs C)</h3>
        <svg viewBox="0 0 400 300" className="w-full h-64">
          {/* Grid */}
          <line x1="50" y1="20" x2="50" y2="270" stroke="#475569" strokeWidth="1" />
          <line x1="50" y1="270" x2="380" y2="270" stroke="#475569" strokeWidth="1" />
          {/* Quadrant lines */}
          <line x1="215" y1="20" x2="215" y2="270" stroke="#475569" strokeWidth="0.5" strokeDasharray="4" />
          <line x1="50" y1="145" x2="380" y2="145" stroke="#475569" strokeWidth="0.5" strokeDasharray="4" />
          {/* Labels */}
          <text x="215" y="15" fill="#94a3b8" fontSize="10" textAnchor="middle">C (可通约度)</text>
          <text x="20" y="145" fill="#94a3b8" fontSize="10" textAnchor="middle" transform="rotate(-90, 20, 145)">H (熵)</text>
          {/* Quadrant labels */}
          <text x="130" y="80" fill="#60a5fa" fontSize="9" textAnchor="middle">Q1</text>
          <text x="300" y="80" fill="#a78bfa" fontSize="9" textAnchor="middle">Q2</text>
          <text x="130" y="220" fill="#fbbf24" fontSize="9" textAnchor="middle">Q4</text>
          <text x="300" y="220" fill="#fb923c" fontSize="9" textAnchor="middle">Q3</text>
          {/* Trajectory */}
          {state.history.length > 1 && (
            <polyline
              points={state.history.map((h, i) => {
                const x = 50 + h.comm * 330;
                const y = 270 - h.entropy * 250;
                return `${x},${y}`;
              }).join(' ')}
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="2"
            />
          )}
          {/* Current point */}
          {state.history.length > 0 && (
            <circle
              cx={50 + state.commensurability * 330}
              cy={270 - state.entropy * 250}
              r="5"
              fill="#f472b6"
              stroke="white"
              strokeWidth="1.5"
            />
          )}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="50%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#f472b6" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Log */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-purple-500/20">
        <h3 className="text-sm font-bold text-purple-300 mb-3">运行日志</h3>
        <div ref={logRef} className="h-48 overflow-y-auto space-y-1 font-mono text-xs">
          {state.log.map((entry, i) => (
            <div key={i} className={`${
              entry.startsWith('⚠️') ? 'text-yellow-400' :
              entry.startsWith('✅') ? 'text-green-400' :
              entry.startsWith('📚') ? 'text-orange-400' :
              entry.startsWith('🔓') ? 'text-cyan-400' :
              'text-slate-400'
            }`}>
              <span className="text-slate-600">[{String(i).padStart(3, '0')}]</span> {entry}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
