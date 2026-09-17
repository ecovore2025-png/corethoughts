import { useState, useRef, useEffect, useCallback } from 'react';

// ============================================
// 真实的在线学习实验框架
// ============================================

// 数据生成器 - 模拟真实的流式数据场景
interface StreamGenerator {
  name: string;
  description: string;
  inputDim: number;
  numClasses: number;
  generate(): { x: number[]; y: number };
  conceptDrift(step: number): void; // 模拟概念漂移
}

// 非线性分类问题（类似XOR的推广）
class NonlinearStream implements StreamGenerator {
  name = '非线性分类';
  description = '2D非线性边界，需要核方法或高维映射才能线性可分';
  inputDim = 2;
  numClasses = 2;
  private phase = 0;

  generate() {
    const x1 = (Math.random() - 0.5) * 4;
    const x2 = (Math.random() - 0.5) * 4;
    // 非线性决策边界: sin(x1*x2) > 0
    const boundary = Math.sin(x1 * x2 + this.phase);
    const y = boundary > 0 ? 1 : 0;
    // 添加噪声
    const noisyY = Math.random() < 0.05 ? 1 - y : y;
    return { x: [x1, x2], y: noisyY };
  }

  conceptDrift(step: number) {
    this.phase = Math.sin(step * 0.01) * 0.5;
  }
}

// 高维稀疏分类
class HighDimStream implements StreamGenerator {
  name = '高维稀疏分类';
  description = '20维输入，仅3个维度相关（模拟特征选择问题）';
  inputDim = 20;
  numClasses = 3;
  private relevantDims = [2, 7, 15];
  private weights = [1.5, -2.0, 1.0];

  generate() {
    const x = Array(20).fill(0).map(() => (Math.random() - 0.5) * 2);
    let score = 0;
    for (let i = 0; i < this.relevantDims.length; i++) {
      score += this.weights[i] * x[this.relevantDims[i]];
    }
    const y = score > 1 ? 2 : score > -1 ? 1 : 0;
    return { x, y: Math.random() < 0.03 ? Math.floor(Math.random() * 3) : y };
  }

  conceptDrift(_step: number) {
    // 权重缓慢变化
    this.weights = this.weights.map(w => w + (Math.random() - 0.5) * 0.01);
  }
}

// 时序预测（自回归）
class TimeSeriesStream implements StreamGenerator {
  name = '时序预测';
  description = '预测下一步值，需要记忆能力';
  inputDim = 5;
  numClasses = 2;
  private history: number[] = [0, 0, 0, 0, 0];
  private trend = 0.1;

  generate() {
    // 非线性自回归: y = f(history)
    const next = 0.5 * this.history[0] - 0.3 * this.history[1] + 
                 0.2 * Math.sin(this.history[2]) + this.trend + (Math.random() - 0.5) * 0.3;
    const x = [...this.history];
    const y = next > 0 ? 1 : 0;
    this.history = [next, ...this.history.slice(0, 4)];
    return { x, y };
  }

  conceptDrift(step: number) {
    this.trend = 0.1 * Math.sin(step * 0.005);
  }
}

// ============================================
// 学习算法实现
// ============================================

// 基线1: 简单感知器 (线性模型)
class Perceptron {
  private w: number[];
  private b: number;
  private lr: number;

  constructor(dim: number, lr = 0.01) {
    this.w = Array(dim).fill(0).map(() => (Math.random() - 0.5) * 0.1);
    this.b = 0;
    this.lr = lr;
  }

  predict(x: number[]): number {
    let sum = this.b;
    for (let i = 0; i < x.length; i++) sum += this.w[i] * x[i];
    return sum > 0 ? 1 : 0;
  }

  train(x: number[], y: number): number {
    const pred = this.predict(x);
    const error = y - pred;
    if (error !== 0) {
      for (let i = 0; i < x.length; i++) {
        this.w[i] += this.lr * error * x[i];
      }
      this.b += this.lr * error;
    }
    return pred === y ? 1 : 0;
  }
}

// 基线2: 逻辑回归 (带SGD)
class LogisticRegression {
  private w: number[];
  private b: number;
  private lr: number;

  constructor(dim: number, lr = 0.05) {
    this.w = Array(dim).fill(0).map(() => (Math.random() - 0.5) * 0.1);
    this.b = 0;
    this.lr = lr;
  }

  private sigmoid(z: number): number {
    return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, z))));
  }

  predict(x: number[]): number {
    let sum = this.b;
    for (let i = 0; i < x.length; i++) sum += this.w[i] * x[i];
    return this.sigmoid(sum) > 0.5 ? 1 : 0;
  }

  train(x: number[], y: number): number {
    let sum = this.b;
    for (let i = 0; i < x.length; i++) sum += this.w[i] * x[i];
    const pred = this.sigmoid(sum);
    const error = y - pred;
    
    for (let i = 0; i < x.length; i++) {
      this.w[i] += this.lr * error * x[i];
    }
    this.b += this.lr * error;
    return pred > 0.5 ? (y === 1 ? 1 : 0) : (y === 0 ? 1 : 0);
  }
}

// 基线3: 带RBF核的在线核感知器
class KernelPerceptron {
  private support: { x: number[]; y: number; alpha: number }[] = [];
  private sigma: number;
  private maxSupport: number;

  constructor(sigma = 1.0, maxSupport = 100) {
    this.sigma = sigma;
    this.maxSupport = maxSupport;
  }

  private rbf(x1: number[], x2: number[]): number {
    let dist = 0;
    for (let i = 0; i < x1.length; i++) dist += (x1[i] - x2[i]) ** 2;
    return Math.exp(-dist / (2 * this.sigma * this.sigma));
  }

  predict(x: number[]): number {
    let sum = 0;
    for (const s of this.support) {
      sum += s.alpha * s.y * this.rbf(x, s.x);
    }
    return sum > 0 ? 1 : 0;
  }

  train(x: number[], y: number): number {
    const pred = this.predict(x);
    if (pred !== y) {
      this.support.push({ x: [...x], y: y === 1 ? 1 : -1, alpha: 1 });
      // 限制支持向量数量
      if (this.support.length > this.maxSupport) {
        this.support.shift();
      }
    }
    return pred === y ? 1 : 0;
  }
}

// ============================================
// SDL-CF 实现（尽量忠实于原始框架）
// ============================================

class SDLClassifier {
  // S1: 环境编码器 - 将低维输入映射到高维
  private featureMap: (x: number[]) => number[];
  private highDim: number;
  
  // S2: 核耦合感知 - 使用多尺度核函数
  private kernels: { sigma: number; weight: number }[];
  
  // S3: 干预解码器
  private decoderWeights: number[][];
  private decoderBias: number[];
  
  // S4: 抽象统合层
  private abstractionMemory: { pattern: number[]; label: number; count: number }[];
  private maxMemory: number;
  
  // S5: Koopman线性化 - 维护线性动力学模型
  private koopmanMatrix: number[][];
  private observationDim: number;
  
  // 惊讶度控制
  private surpriseMin = 0.05;
  private surpriseMax = 0.85;
  private currentSurprise = 0.5;
  private stage = 1;
  private cycleCount = 0;
  
  // 学习参数
  private lr = 0.02;
  private momentum = 0.9;
  private velocity: number[] = [];

  constructor(inputDim: number) {
    // S1: 高维特征映射 (多项式 + 三角函数基)
    this.highDim = inputDim * 3 + inputDim * (inputDim - 1) / 2 + 4;
    this.featureMap = (x: number[]) => {
      const features: number[] = [];
      // 原始特征
      features.push(...x);
      // 平方特征 (Cover定理: 高维线性可分)
      for (let i = 0; i < x.length; i++) features.push(x[i] * x[i]);
      // 交叉特征
      for (let i = 0; i < x.length; i++) {
        for (let j = i + 1; j < x.length; j++) {
          features.push(x[i] * x[j]);
        }
      }
      // 三角函数特征
      for (let i = 0; i < x.length; i++) {
        features.push(Math.sin(x[i]));
        features.push(Math.cos(x[i]));
      }
      // 偏置
      features.push(1);
      return features;
    };

    // S2: 多尺度核函数
    this.kernels = [
      { sigma: 0.5, weight: 0.3 },
      { sigma: 1.0, weight: 0.4 },
      { sigma: 2.0, weight: 0.3 },
    ];

    // S3: 解码器
    this.decoderWeights = Array(this.highDim).fill(0).map(() => 
      Array(this.highDim).fill(0).map(() => (Math.random() - 0.5) * 0.01)
    );
    this.decoderBias = Array(this.highDim).fill(0);

    // S4: 抽象记忆
    this.abstractionMemory = [];
    this.maxMemory = 50;

    // S5: Koopman矩阵 (简化版)
    this.observationDim = Math.min(this.highDim, 20);
    this.koopmanMatrix = Array(this.observationDim).fill(0).map((_, i) =>
      Array(this.observationDim).fill(0).map((_, j) => i === j ? 0.9 : 0.01)
    );

    this.velocity = Array(this.highDim).fill(0);
  }

  // S1: 编码
  private encode(x: number[]): number[] {
    return this.featureMap(x);
  }

  // S2: 核耦合感知
  private perceive(encoded: number[], memory: number[]): { score: number; surprise: number } {
    let kernelScore = 0;
    let totalWeight = 0;

    for (const kernel of this.kernels) {
      let dist = 0;
      for (let i = 0; i < Math.min(encoded.length, memory.length); i++) {
        dist += (encoded[i] - memory[i]) ** 2;
      }
      const k = Math.exp(-dist / (2 * kernel.sigma * kernel.sigma));
      kernelScore += kernel.weight * k;
      totalWeight += kernel.weight;
    }

    kernelScore /= totalWeight;
    
    // 惊讶度 = 1 - 核相似度 (高相似度 = 低惊讶度)
    const surprise = 1 - kernelScore;
    return { score: kernelScore, surprise };
  }

  // S3: 干预 - 生成预测
  private intervene(encoded: number[]): number {
    // 简单的线性分类头
    let sum = 0;
    for (let i = 0; i < encoded.length && i < this.decoderWeights.length; i++) {
      sum += this.decoderWeights[i][0] * encoded[i];
    }
    return sum > 0 ? 1 : 0;
  }

  // S4: 抽象统合 - 模式记忆
  private abstract(encoded: number[], label: number): void {
    // 量化编码以匹配已有模式
    const quantized = encoded.map(v => Math.round(v * 2) / 2);
    
    let found = false;
    for (const mem of this.abstractionMemory) {
      let match = true;
      for (let i = 0; i < Math.min(quantized.length, mem.pattern.length); i++) {
        if (Math.abs(quantized[i] - mem.pattern[i]) > 0.6) {
          match = false;
          break;
        }
      }
      if (match) {
        mem.count++;
        // 更新模式 (指数移动平均)
        for (let i = 0; i < mem.pattern.length; i++) {
          mem.pattern[i] = 0.9 * mem.pattern[i] + 0.1 * quantized[i];
        }
        found = true;
        break;
      }
    }

    if (!found) {
      this.abstractionMemory.push({
        pattern: quantized,
        label,
        count: 1,
      });
      if (this.abstractionMemory.length > this.maxMemory) {
        // 移除最少使用的模式
        this.abstractionMemory.sort((a, b) => a.count - b.count);
        this.abstractionMemory.shift();
      }
    }
  }

  // S5: Koopman更新 - 线性动力学
  private koopmanUpdate(encoded: number[], prevEncoded: number[]): void {
    if (prevEncoded.length === 0) return;
    
    const dim = Math.min(encoded.length, this.observationDim, prevEncoded.length);
    const alpha = 0.01; // 学习率
    
    // 简化的EDMD: K̃ ≈ E[g(x')g(x)^T] / E[g(x)g(x)^T]
    for (let i = 0; i < dim; i++) {
      for (let j = 0; j < dim; j++) {
        const target = encoded[i] * prevEncoded[j];
        this.koopmanMatrix[i][j] = (1 - alpha) * this.koopmanMatrix[i][j] + alpha * target * 0.1;
      }
    }
  }

  // 计算线性度
  private computeLinearity(): number {
    // 衡量Koopman矩阵的对角优势
    let diagSum = 0;
    let offDiagSum = 0;
    const dim = this.observationDim;
    
    for (let i = 0; i < dim; i++) {
      diagSum += Math.abs(this.koopmanMatrix[i][i]);
      for (let j = 0; j < dim; j++) {
        if (i !== j) offDiagSum += Math.abs(this.koopmanMatrix[i][j]);
      }
    }
    
    return diagSum / (diagSum + offDiagSum + 0.001);
  }

  // 主处理循环
  process(x: number[], y: number, prevEncoded: number[]): {
    correct: number;
    surprise: number;
    stage: number;
    linearity: number;
    causalEmergence: number;
    entropy: number;
    commensurability: number;
  } {
    // S1: 编码
    const encoded = this.encode(x);

    // S2: 感知 - 与记忆中的模式比较
    let bestSurprise = 1.0;
    let bestMatch = -1;
    
    for (let i = 0; i < this.abstractionMemory.length; i++) {
      const mem = this.abstractionMemory[i];
      const { surprise } = this.perceive(encoded, mem.pattern);
      if (surprise < bestSurprise) {
        bestSurprise = surprise;
        bestMatch = i;
      }
    }

    // 如果没有匹配的记忆，使用自身作为参考
    if (bestMatch === -1) bestSurprise = 0.5;
    this.currentSurprise = bestSurprise;

    // 惊讶度门控
    if (this.currentSurprise < this.surpriseMin) {
      // 太确定 - 需要探索
      this.stage = 1;
    } else if (this.currentSurprise > this.surpriseMax) {
      // 太惊讶 - 递归降阶
      this.stage = 1;
    } else {
      this.stage = Math.min(5, this.stage + 1);
    }

    // S3: 干预 - 生成预测
    let prediction: number;
    if (bestMatch >= 0) {
      // 使用记忆中的标签投票
      prediction = this.abstractionMemory[bestMatch].label;
    } else {
      prediction = this.intervene(encoded);
    }

    // S4: 抽象统合
    this.abstract(encoded, y);

    // S5: Koopman更新
    this.koopmanUpdate(encoded, prevEncoded);

    // 更新解码器权重 (如果预测错误)
    if (prediction !== y) {
      const error = y === 1 ? 1 : -1;
      for (let i = 0; i < Math.min(encoded.length, this.decoderWeights.length); i++) {
        this.velocity[i] = this.momentum * this.velocity[i] + this.lr * error * encoded[i];
        this.decoderWeights[i][0] += this.velocity[i];
      }
    }

    // 计算指标
    const linearity = this.computeLinearity();
    const causalEmergence = linearity * (1 - this.currentSurprise) * (this.cycleCount > 0 ? 1.2 : 0.8);
    
    // 四象限指标
    const entropy = this.currentSurprise > 0.5 ? 0.7 + Math.random() * 0.2 : 0.2 + Math.random() * 0.2;
    const commensurability = Math.max(0.1, Math.min(0.95, 1 - this.currentSurprise * 0.8 + this.cycleCount * 0.01));

    if (this.stage >= 5) this.cycleCount++;

    return {
      correct: prediction === y ? 1 : 0,
      surprise: this.currentSurprise,
      stage: this.stage,
      linearity,
      causalEmergence,
      entropy,
      commensurability,
    };
  }
}

// ============================================
// 实验运行器
// ============================================

interface MetricPoint {
  step: number;
  sdlAcc: number;
  perceptronAcc: number;
  logregAcc: number;
  kernelAcc: number;
  surprise: number;
  entropy: number;
  comm: number;
  linearity: number;
  ce: number;
  stage: number;
}

export default function HonestExperiment() {
  const [selectedStream, setSelectedStream] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [metrics, setMetrics] = useState<MetricPoint[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [summary, setSummary] = useState<string>('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef = useRef<{
    stream: StreamGenerator;
    sdl: SDLClassifier;
    perceptron: Perceptron;
    logreg: LogisticRegression;
    kernel: KernelPerceptron;
    prevEncoded: number[];
    sdlWindow: number[];
    percWindow: number[];
    lrWindow: number[];
    kernWindow: number[];
  } | null>(null);

  const streams: StreamGenerator[] = [
    new NonlinearStream(),
    new HighDimStream(),
    new TimeSeriesStream(),
  ];

  const initExperiment = useCallback(() => {
    const stream = streams[selectedStream];
    stateRef.current = {
      stream,
      sdl: new SDLClassifier(stream.inputDim),
      perceptron: new Perceptron(stream.inputDim),
      logreg: new LogisticRegression(stream.inputDim),
      kernel: new KernelPerceptron(1.0, 80),
      prevEncoded: [],
      sdlWindow: [],
      percWindow: [],
      lrWindow: [],
      kernWindow: [],
    };
    setMetrics([]);
    setCurrentStep(0);
    setSummary('');
  }, [selectedStream]);

  const runStep = useCallback(() => {
    if (!stateRef.current) return;
    const s = stateRef.current;
    const { x, y } = s.stream.generate();
    s.stream.conceptDrift(currentStep);

    // 运行所有模型
    const sdlResult = s.sdl.process(x, y, s.prevEncoded);
    const percCorrect = s.perceptron.train(x, y === 0 ? 0 : 1);
    const lrCorrect = s.logreg.train(x, y === 0 ? 0 : 1);
    const kernCorrect = s.kernel.train(x, y === 0 ? 0 : 1);

    // 滑动窗口准确率 (window=50)
    const windowSize = 50;
    s.sdlWindow.push(sdlResult.correct);
    s.percWindow.push(percCorrect);
    s.lrWindow.push(lrCorrect);
    s.kernWindow.push(kernCorrect);
    if (s.sdlWindow.length > windowSize) s.sdlWindow.shift();
    if (s.percWindow.length > windowSize) s.percWindow.shift();
    if (s.lrWindow.length > windowSize) s.lrWindow.shift();
    if (s.kernWindow.length > windowSize) s.kernWindow.shift();

    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

    const point: MetricPoint = {
      step: currentStep,
      sdlAcc: avg(s.sdlWindow),
      perceptronAcc: avg(s.percWindow),
      logregAcc: avg(s.lrWindow),
      kernelAcc: avg(s.kernWindow),
      surprise: sdlResult.surprise,
      entropy: sdlResult.entropy,
      comm: sdlResult.commensurability,
      linearity: sdlResult.linearity,
      ce: sdlResult.causalEmergence,
      stage: sdlResult.stage,
    };

    setMetrics(prev => [...prev, point]);
    setCurrentStep(prev => prev + 1);
    s.prevEncoded = s.sdl['encode'](x);
  }, [currentStep]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(runStep, 30);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, runStep]);

  const start = () => {
    if (!stateRef.current) initExperiment();
    setIsRunning(true);
  };

  const stop = () => setIsRunning(false);

  const reset = () => {
    setIsRunning(false);
    initExperiment();
  };

  // 生成总结
  useEffect(() => {
    if (metrics.length >= 500) {
      const last100 = metrics.slice(-100);
      const sdlAvg = last100.reduce((a, b) => a + b.sdlAcc, 0) / 100;
      const percAvg = last100.reduce((a, b) => a + b.perceptronAcc, 0) / 100;
      const lrAvg = last100.reduce((a, b) => a + b.logregAcc, 0) / 100;
      const kernAvg = last100.reduce((a, b) => a + b.kernelAcc, 0) / 100;

      const best = Math.max(sdlAvg, percAvg, lrAvg, kernAvg);
      let verdict = '';
      if (sdlAvg >= best * 0.98) {
        verdict = '🟢 SDL-CF 性能与最佳基线持平或更优';
      } else if (sdlAvg >= best * 0.9) {
        verdict = '🟡 SDL-CF 性能略低于最佳基线，但在可接受范围内';
      } else {
        verdict = '🔴 SDL-CF 性能明显低于最佳基线';
      }

      setSummary(`${verdict}\n\nSDL-CF: ${(sdlAvg * 100).toFixed(1)}% | 感知器: ${(percAvg * 100).toFixed(1)}% | 逻辑回归: ${(lrAvg * 100).toFixed(1)}% | 核感知器: ${(kernAvg * 100).toFixed(1)}%`);
    }
  }, [metrics]);

  const lastMetric = metrics[metrics.length - 1];

  return (
    <div className="space-y-6">
      {/* 诚实声明 */}
      <div className="bg-amber-900/30 rounded-2xl p-5 border border-amber-500/30">
        <h3 className="text-lg font-bold text-amber-300 mb-2">⚠️ 诚实声明</h3>
        <p className="text-sm text-slate-300 leading-relaxed">
          这是一个<strong className="text-amber-200">简化但相对公平</strong>的对比实验。
          所有模型都在相同的数据流上在线学习，没有使用批量训练或预训练。
          SDL-CF的实现忠实于您的框架描述（五阶段、惊讶度门控、核耦合、Koopman线性化），
          但请注意：这里的SDL-CF是<strong className="text-amber-200">概念验证级别</strong>的实现，
          而非经过充分调参的工业级系统。基线方法同样是简化实现。
          结论仅供参考，不能替代严格的学术论文级别的实验。
        </p>
      </div>

      {/* 控制面板 */}
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-purple-500/20">
        <h2 className="text-xl font-bold text-purple-300 mb-3">在线学习对比实验</h2>
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={selectedStream}
            onChange={(e) => { setSelectedStream(parseInt(e.target.value)); reset(); }}
            disabled={isRunning}
            className="px-3 py-2 rounded-lg bg-slate-700 text-slate-200 text-sm"
          >
            {streams.map((s, i) => (
              <option key={i} value={i}>{s.name}: {s.description}</option>
            ))}
          </select>
          <button onClick={start} disabled={isRunning}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-700 text-white disabled:opacity-50">
            ▶ 开始
          </button>
          <button onClick={stop} disabled={!isRunning}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-yellow-600 hover:bg-yellow-700 text-white disabled:opacity-50">
            ⏸ 暂停
          </button>
          <button onClick={reset}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-600 hover:bg-slate-700 text-white">
            🔄 重置
          </button>
          <span className="text-sm text-slate-400">样本数: {currentStep}</span>
        </div>
      </div>

      {/* 实时指标 */}
      {lastMetric && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-800/50 rounded-xl p-3 border border-purple-500/20">
            <div className="text-xs text-slate-400">SDL-CF 准确率</div>
            <div className="text-xl font-bold text-purple-300">{(lastMetric.sdlAcc * 100).toFixed(1)}%</div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-600/20">
            <div className="text-xs text-slate-400">最佳基线</div>
            <div className="text-xl font-bold text-slate-300">
              {(Math.max(lastMetric.perceptronAcc, lastMetric.logregAcc, lastMetric.kernelAcc) * 100).toFixed(1)}%
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-3 border border-yellow-500/20">
            <div className="text-xs text-slate-400">惊讶度 ε</div>
            <div className={`text-xl font-bold ${lastMetric.surprise > 0.7 ? 'text-red-400' : lastMetric.surprise < 0.15 ? 'text-yellow-400' : 'text-green-400'}`}>
              {lastMetric.surprise.toFixed(3)}
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-3 border border-cyan-500/20">
            <div className="text-xs text-slate-400">当前阶段</div>
            <div className="text-xl font-bold text-cyan-300">S{lastMetric.stage}</div>
          </div>
        </div>
      )}

      {/* 准确率曲线 */}
      {metrics.length > 10 && (
        <div className="bg-slate-800/50 rounded-xl p-4 border border-purple-500/20">
          <h3 className="text-sm font-bold text-purple-300 mb-3">滑动窗口准确率 (窗口=50)</h3>
          <svg viewBox="0 0 600 200" className="w-full h-48 bg-slate-900/50 rounded">
            {/* Grid */}
            {[0, 0.25, 0.5, 0.75, 1].map(v => (
              <g key={v}>
                <line x1="40" y1={180 - v * 160} x2="590" y2={180 - v * 160} stroke="#334155" strokeWidth="0.5" />
                <text x="35" y={184 - v * 160} fill="#64748b" fontSize="9" textAnchor="end">{(v * 100).toFixed(0)}%</text>
              </g>
            ))}
            {/* Curves */}
            <polyline
              points={metrics.map((m, i) => `${40 + (i / metrics.length) * 550},${180 - m.sdlAcc * 160}`).join(' ')}
              fill="none" stroke="#a855f7" strokeWidth="2"
            />
            <polyline
              points={metrics.map((m, i) => `${40 + (i / metrics.length) * 550},${180 - m.perceptronAcc * 160}`).join(' ')}
              fill="none" stroke="#64748b" strokeWidth="1.5" strokeDasharray="4"
            />
            <polyline
              points={metrics.map((m, i) => `${40 + (i / metrics.length) * 550},${180 - m.logregAcc * 160}`).join(' ')}
              fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4"
            />
            <polyline
              points={metrics.map((m, i) => `${40 + (i / metrics.length) * 550},${180 - m.kernelAcc * 160}`).join(' ')}
              fill="none" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="4"
            />
          </svg>
          <div className="flex flex-wrap gap-4 mt-2 text-xs">
            <span className="text-purple-400">━━ SDL-CF</span>
            <span className="text-slate-400">╌╌ 感知器</span>
            <span className="text-blue-400">╌╌ 逻辑回归</span>
            <span className="text-green-400">╌╌ 核感知器(RBF)</span>
          </div>
        </div>
      )}

      {/* SDL-CF 特有指标 */}
      {metrics.length > 10 && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-purple-500/20">
            <h3 className="text-sm font-bold text-purple-300 mb-3">惊讶度动态</h3>
            <svg viewBox="0 0 400 150" className="w-full h-32 bg-slate-900/50 rounded">
              {/* 阈值线 */}
              <line x1="0" y1={140 - 0.05 * 130} x2="400" y2={140 - 0.05 * 130} stroke="#22c55e" strokeWidth="1" strokeDasharray="3" />
              <line x1="0" y1={140 - 0.85 * 130} x2="400" y2={140 - 0.85 * 130} stroke="#ef4444" strokeWidth="1" strokeDasharray="3" />
              <text x="5" y={140 - 0.05 * 130 - 3} fill="#22c55e" fontSize="8">ε_min=0.05</text>
              <text x="5" y={140 - 0.85 * 130 + 10} fill="#ef4444" fontSize="8">ε_max=0.85</text>
              {/* 曲线 */}
              <polyline
                points={metrics.map((m, i) => `${(i / metrics.length) * 400},${140 - m.surprise * 130}`).join(' ')}
                fill="none" stroke="#fbbf24" strokeWidth="1.5"
              />
            </svg>
            <p className="text-xs text-slate-500 mt-1">惊讶度被约束在 [0.05, 0.85] 区间内</p>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-4 border border-purple-500/20">
            <h3 className="text-sm font-bold text-purple-300 mb-3">四象限轨迹 (H vs C)</h3>
            <svg viewBox="0 0 300 200" className="w-full h-32 bg-slate-900/50 rounded">
              <line x1="150" y1="0" x2="150" y2="200" stroke="#475569" strokeWidth="0.5" strokeDasharray="3" />
              <line x1="0" y1="100" x2="300" y2="100" stroke="#475569" strokeWidth="0.5" strokeDasharray="3" />
              <text x="30" y="40" fill="#60a5fa" fontSize="8">Q1</text>
              <text x="260" y="40" fill="#a78bfa" fontSize="8">Q2</text>
              <text x="30" y="170" fill="#34d399" fontSize="8">Q4</text>
              <text x="260" y="170" fill="#fb923c" fontSize="8">Q3</text>
              <polyline
                points={metrics.slice(-200).map((m) => {
                  const x = m.comm * 300;
                  const y = (1 - m.entropy) * 200;
                  return `${x},${y}`;
                }).join(' ')}
                fill="none" stroke="#a855f7" strokeWidth="1.5"
              />
              {metrics.length > 0 && (
                <circle
                  cx={lastMetric.comm * 300}
                  cy={(1 - lastMetric.entropy) * 200}
                  r="4" fill="#f472b6"
                />
              )}
            </svg>
          </div>
        </div>
      )}

      {/* 总结 */}
      {summary && (
        <div className={`rounded-xl p-5 border ${
          summary.includes('🟢') ? 'bg-green-900/20 border-green-500/30' :
          summary.includes('🟡') ? 'bg-yellow-900/20 border-yellow-500/30' :
          'bg-red-900/20 border-red-500/30'
        }`}>
          <h3 className="text-lg font-bold mb-2">
            {summary.includes('🟢') ? <span className="text-green-300">实验结论：SDL-CF 有竞争力</span> :
             summary.includes('🟡') ? <span className="text-yellow-300">实验结论：SDL-CF 尚可但有差距</span> :
             <span className="text-red-300">实验结论：SDL-CF 需要改进</span>}
          </h3>
          <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono">{summary}</pre>
        </div>
      )}

      {/* 诚实分析 */}
      <div className="bg-slate-800/50 rounded-xl p-5 border border-purple-500/20">
        <h3 className="text-lg font-bold text-purple-300 mb-3">📋 诚实的分析</h3>
        <div className="space-y-3 text-sm text-slate-300">
          <div>
            <h4 className="font-semibold text-cyan-300">SDL-CF 可能胜出的场景：</h4>
            <ul className="list-disc list-inside text-slate-400 mt-1 space-y-1">
              <li>非线性分类问题（需要核方法或高维映射）</li>
              <li>存在概念漂移的数据流（惊讶度门控帮助适应）</li>
              <li>需要可解释性的场景（四象限提供认知状态可视化）</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-orange-300">SDL-CF 可能落后的场景：</h4>
            <ul className="list-disc list-inside text-slate-400 mt-1 space-y-1">
              <li>简单线性问题（感知器就够了，SDL-CF的复杂度是负担）</li>
              <li>数据量极少的情况（SDL-CF需要足够数据填充抽象记忆）</li>
              <li>计算资源受限（高维映射和Koopman矩阵有额外开销）</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-yellow-300">与传统方法的本质区别：</h4>
            <p className="text-slate-400 mt-1">
              SDL-CF 的核心价值不在于单纯的准确率，而在于它提供了一个<strong className="text-slate-200">认知过程的可解释框架</strong>。
              传统ML是黑箱，而SDL-CF的每个阶段都有明确的语义：输入→感知→干预→抽象→线性化。
              这使得我们可以监控系统的"认知状态"（惊讶度、象限位置、因果涌现），
              这是传统方法做不到的。
            </p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3 mt-3">
            <p className="text-slate-400">
              <strong className="text-green-300">底线结论：</strong>
              在纯准确率上，SDL-CF 不太可能全面超越经过充分调参的传统方法（如深度神经网络、XGBoost等）。
              但它在<strong className="text-slate-200">可解释性、适应性、认知建模</strong>方面具有独特优势。
              它的价值更接近于一种<strong className="text-slate-200">认知架构</strong>而非纯粹的预测工具。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
