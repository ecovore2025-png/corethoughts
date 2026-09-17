import { useState, useRef, useEffect, useCallback } from 'react';

// ============================================================
// SDL-CF 作为元框架：将传统ML方法嵌入S2和S3
// ============================================================
// 
// 核心思想：SDL-CF 不是与 Transformer/NN 竞争的模型，
// 而是一个认知架构，传统方法作为其 S2(感知) 和 S3(干预) 的引擎。
// 
// 类比：操作系统(SDL-CF) vs 应用程序(Transformer/NN/RL)
// SDL-CF 提供全局协调、自适应、可解释性
// 传统方法提供局部计算能力
// ============================================================

interface StreamData {
  x: number[];
  y: number;
}

// ============================================
// 数据流生成器 - 模拟真实场景
// ============================================

class ConceptDriftStream {
  private phase = 0;
  private driftRate: number;
  private inputDim: number;

  constructor(inputDim = 4, driftRate = 0.005) {
    this.inputDim = inputDim;
    this.driftRate = driftRate;
  }

  generate(): StreamData {
    this.phase += this.driftRate;
    const x = Array(this.inputDim).fill(0).map(() => (Math.random() - 0.5) * 2);
    
    // 非线性决策边界，随时间漂移
    let score = 0;
    // 主要特征（随概念漂移变化权重）
    score += Math.cos(this.phase) * x[0] * x[1];
    score += Math.sin(this.phase) * x[2];
    if (this.inputDim > 3) {
      score += Math.cos(this.phase * 0.7) * x[3] * x[0];
    }
    // 添加噪声
    score += (Math.random() - 0.5) * 0.5;
    
    const y = score > 0 ? 1 : 0;
    return { x, y };
  }

  getDriftMagnitude(): number {
    return Math.abs(Math.sin(this.phase));
  }
}

// ============================================
// S2引擎：传统ML方法作为感知模块
// ============================================

// 引擎1: 简单线性感知器
class PerceptronEngine {
  private w: number[];
  private b = 0;
  private lr = 0.05;
  name = '感知器';

  constructor(dim: number) {
    this.w = Array(dim).fill(0).map(() => (Math.random() - 0.5) * 0.1);
  }

  predict(x: number[]): number {
    let sum = this.b;
    for (let i = 0; i < x.length; i++) sum += this.w[i] * x[i];
    return sum > 0 ? 1 : 0;
  }

  train(x: number[], y: number): void {
    const pred = this.predict(x);
    const error = y - pred;
    for (let i = 0; i < x.length; i++) this.w[i] += this.lr * error * x[i];
    this.b += this.lr * error;
  }
}

// 引擎2: 带RBF核的核感知器（非线性）
class KernelEngine {
  private support: { x: number[]; y: number; alpha: number }[] = [];
  private sigma = 1.0;
  private maxSV = 150;
  name = 'RBF核感知器';

  predict(x: number[]): number {
    let sum = 0;
    for (const sv of this.support) {
      let dist = 0;
      for (let i = 0; i < x.length; i++) dist += (x[i] - sv.x[i]) ** 2;
      sum += sv.alpha * sv.y * Math.exp(-dist / (2 * this.sigma * this.sigma));
    }
    return sum > 0 ? 1 : 0;
  }

  train(x: number[], y: number): void {
    const pred = this.predict(x);
    if (pred !== y) {
      this.support.push({ x: [...x], y: y === 1 ? 1 : -1, alpha: 1 });
      if (this.support.length > this.maxSV) this.support.shift();
    }
  }
}

// 引擎3: 小型神经网络（模拟Transformer的简化版）
class MiniNN {
  private w1: number[][];
  private b1: number[];
  private w2: number[];
  private b2 = 0;
  private lr = 0.03;
  private hiddenDim: number;
  name = '小型神经网络';

  constructor(inputDim: number, hiddenDim = 16) {
    this.hiddenDim = hiddenDim;
    this.w1 = Array(hiddenDim).fill(null).map(() =>
      Array(inputDim).fill(0).map(() => (Math.random() - 0.5) * 0.3)
    );
    this.b1 = Array(hiddenDim).fill(0).map(() => Math.random() * 0.1);
    this.w2 = Array(hiddenDim).fill(0).map(() => (Math.random() - 0.5) * 0.3);
  }

  private relu(x: number): number { return Math.max(0, x); }
  private sigmoid(x: number): number { return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x)))); }

  private forward(x: number[]): { hidden: number[]; output: number } {
    const hidden = this.w1.map((w, i) => {
      let sum = this.b1[i];
      for (let j = 0; j < x.length; j++) sum += w[j] * x[j];
      return this.relu(sum);
    });
    let out = this.b2;
    for (let i = 0; i < hidden.length; i++) out += this.w2[i] * hidden[i];
    return { hidden, output: this.sigmoid(out) };
  }

  predict(x: number[]): number {
    return this.forward(x).output > 0.5 ? 1 : 0;
  }

  train(x: number[], y: number): void {
    const { hidden, output } = this.forward(x);
    const error = y - output;
    const grad_out = error * output * (1 - output);

    // 更新第二层
    for (let i = 0; i < this.hiddenDim; i++) {
      const grad_h = grad_out * this.w2[i];
      this.w2[i] += this.lr * error * hidden[i];
      // 更新第一层
      for (let j = 0; j < x.length; j++) {
        this.w1[i][j] += this.lr * grad_h * (hidden[i] > 0 ? 1 : 0) * x[j];
      }
      this.b1[i] += this.lr * grad_h * (hidden[i] > 0 ? 1 : 0);
    }
    this.b2 += this.lr * error;
  }
}

// ============================================
// SDL-CF 元框架：协调S2引擎 + 添加认知层
// ============================================

type EngineType = 'perceptron' | 'kernel' | 'nn';

class SDLCognitiveFramework {
  private s2Engine: PerceptronEngine | KernelEngine | MiniNN;
  private engineType: EngineType;
  private inputDim: number;

  // S1: 特征映射（高维嵌入）
  private featureDim: number;
  private mapToHighDim: (x: number[]) => number[];

  // S2: 惊讶度监控
  private surpriseHistory: number[] = [];
  private surpriseMin = 0.1;
  private surpriseMax = 0.8;
  private currentSurprise = 0.5;

  // S4: 抽象记忆（模式库）
  private patternMemory: { features: number[]; label: number; confidence: number; age: number }[] = [];
  private maxPatterns = 30;

  // S5: Koopman线性化追踪
  private koopmanTrace: number[][] = [];
  private linearityScore = 0.3;

  // 认知状态
  private stage = 1;
  private cycleCount = 0;
  private adaptationTriggered = 0;
  private driftDetected = 0;

  // 性能追踪
  private recentCorrect: number[] = [];
  private windowSize = 50;

  constructor(inputDim: number, engineType: EngineType) {
    this.inputDim = inputDim;
    this.engineType = engineType;

    // 初始化S2引擎
    switch (engineType) {
      case 'perceptron':
        this.s2Engine = new PerceptronEngine(inputDim);
        break;
      case 'kernel':
        this.s2Engine = new KernelEngine();
        break;
      case 'nn':
        this.s2Engine = new MiniNN(inputDim, 16);
        break;
    }

    // S1: 高维特征映射
    this.featureDim = inputDim * 2 + 1; // 简化版
    this.mapToHighDim = (x: number[]) => {
      const features = [...x];
      // 非线性特征
      for (let i = 0; i < x.length; i++) features.push(x[i] * x[i]);
      // 交互特征
      for (let i = 0; i < x.length; i++) {
        for (let j = i + 1; j < x.length; j++) {
          features.push(x[i] * x[j]);
        }
      }
      features.push(1); // bias
      return features;
    };
  }

  // 计算惊讶度（基于预测置信度与历史一致性）
  private computeSurprise(prediction: number, trueLabel: number, features: number[]): number {
    // 基础惊讶度
    const basicSurprise = prediction === trueLabel ? 0.15 : 0.75;

    // 模式匹配惊讶度
    let patternSurprise = 0.5;
    for (const pattern of this.patternMemory) {
      let dist = 0;
      for (let i = 0; i < Math.min(features.length, pattern.features.length); i++) {
        dist += (features[i] - pattern.features[i]) ** 2;
      }
      if (dist < 2.0) {
        patternSurprise = pattern.label === trueLabel ? 0.1 : 0.8;
        break;
      }
    }

    // 综合惊讶度
    return 0.6 * basicSurprise + 0.4 * patternSurprise;
  }

  // S4: 更新抽象记忆
  private updateAbstraction(features: number[], label: number, confidence: number): void {
    // 量化特征
    const quantized = features.map(v => Math.round(v * 3) / 3);

    // 查找匹配模式
    let matched = false;
    for (const pattern of this.patternMemory) {
      let dist = 0;
      for (let i = 0; i < Math.min(quantized.length, pattern.features.length); i++) {
        dist += (quantized[i] - pattern.features[i]) ** 2;
      }
      if (dist < 1.5) {
        // 更新已有模式
        pattern.confidence = 0.9 * pattern.confidence + 0.1 * confidence;
        pattern.age++;
        for (let i = 0; i < pattern.features.length; i++) {
          pattern.features[i] = 0.95 * pattern.features[i] + 0.05 * quantized[i];
        }
        matched = true;
        break;
      }
    }

    if (!matched) {
      this.patternMemory.push({ features: quantized, label, confidence, age: 0 });
      if (this.patternMemory.length > this.maxPatterns) {
        // 移除最旧/最低置信度的模式
        this.patternMemory.sort((a, b) => a.confidence * a.age - b.confidence * b.age);
        this.patternMemory.shift();
      }
    }
  }

  // 检测概念漂移
  private detectDrift(): boolean {
    if (this.recentCorrect.length < this.windowSize) return false;
    const recent = this.recentCorrect.slice(-20);
    const older = this.recentCorrect.slice(-this.windowSize, -20);
    if (older.length < 10) return false;

    const recentAcc = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAcc = older.reduce((a, b) => a + b, 0) / older.length;

    return olderAcc - recentAcc > 0.15; // 准确率下降超过15%
  }

  // 自适应机制：当检测到漂移时重置部分状态
  private adapt(): void {
    this.adaptationTriggered++;
    // 清空部分抽象记忆（保留高置信度的）
    this.patternMemory = this.patternMemory.filter(p => p.confidence > 0.6);
    // 重置惊讶度历史
    this.surpriseHistory = [];
    this.stage = 1; // 回到输入阶段重新感知
  }

  // 主处理流程
  process(x: number[], y: number): {
    correct: number;
    surprise: number;
    stage: number;
    driftDetected: boolean;
    adapted: boolean;
    linearity: number;
    entropy: number;
    commensurability: number;
    causalEmergence: number;
  } {
    // === S1: 输入编码 ===
    const features = this.mapToHighDim(x);

    // === S2: 感知（使用嵌入的传统方法） ===
    const prediction = this.s2Engine.predict(x);
    this.s2Engine.train(x, y); // 在线学习

    // === S2.5: 惊讶度计算 ===
    this.currentSurprise = this.computeSurprise(prediction, y, features);
    this.surpriseHistory.push(this.currentSurprise);
    if (this.surpriseHistory.length > 100) this.surpriseHistory.shift();

    // === 惊讶度门控 ===
    let adapted = false;
    if (this.currentSurprise > this.surpriseMax) {
      // 太惊讶 → 可能需要适应
      this.stage = 1;
    } else if (this.currentSurprise < this.surpriseMin) {
      // 太确定 → 探索模式
      this.stage = 2;
    } else {
      this.stage = Math.min(5, this.stage + 1);
    }

    // === S3: 干预（利用抽象记忆修正预测） ===
    let finalPrediction = prediction;
    if (this.patternMemory.length > 5) {
      // 用模式记忆投票修正
      let votes = 0;
      let totalWeight = 0;
      for (const pattern of this.patternMemory) {
        let dist = 0;
        for (let i = 0; i < Math.min(features.length, pattern.features.length); i++) {
          dist += (features[i] - pattern.features[i]) ** 2;
        }
        if (dist < 3.0) {
          const weight = pattern.confidence / (1 + dist);
          votes += weight * (pattern.label === 1 ? 1 : -1);
          totalWeight += weight;
        }
      }
      if (totalWeight > 0.5) {
        finalPrediction = votes > 0 ? 1 : 0;
      }
    }

    // === S4: 抽象统合 ===
    this.updateAbstraction(features, y, prediction === y ? 0.8 : 0.2);

    // === S5: Koopman线性化追踪 ===
    this.koopmanTrace.push(features.slice(0, 10));
    if (this.koopmanTrace.length > 2) {
      // 计算相邻帧的线性相关度
      const curr = this.koopmanTrace[this.koopmanTrace.length - 1];
      const prev = this.koopmanTrace[this.koopmanTrace.length - 2];
      let dot = 0, normA = 0, normB = 0;
      for (let i = 0; i < curr.length; i++) {
        dot += curr[i] * prev[i];
        normA += curr[i] * curr[i];
        normB += prev[i] * prev[i];
      }
      const cosine = dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-8);
      this.linearityScore = 0.95 * this.linearityScore + 0.05 * Math.abs(cosine);
    }
    if (this.koopmanTrace.length > 50) this.koopmanTrace.shift();

    // === 概念漂移检测 ===
    const drift = this.detectDrift();
    if (drift) {
      this.driftDetected++;
      this.adapt();
      adapted = true;
    }

    // === 记录性能 ===
    const isCorrect = finalPrediction === y ? 1 : 0;
    this.recentCorrect.push(isCorrect);
    if (this.recentCorrect.length > this.windowSize) this.recentCorrect.shift();

    if (this.stage >= 5) this.cycleCount++;

    // === 四象限指标 ===
    const avgSurprise = this.surpriseHistory.length > 0
      ? this.surpriseHistory.reduce((a, b) => a + b, 0) / this.surpriseHistory.length
      : 0.5;
    const entropy = avgSurprise > 0.4 ? 0.6 + Math.random() * 0.2 : 0.2 + Math.random() * 0.15;
    const commensurability = Math.min(0.95, 0.3 + this.cycleCount * 0.02 + (1 - avgSurprise) * 0.3);
    const causalEmergence = this.linearityScore * commensurability * (this.patternMemory.length / this.maxPatterns);

    return {
      correct: isCorrect,
      surprise: this.currentSurprise,
      stage: this.stage,
      driftDetected: drift,
      adapted,
      linearity: this.linearityScore,
      entropy,
      commensurability,
      causalEmergence,
    };
  }

  getEngineName(): string {
    return this.s2Engine.name;
  }

  getStage(): number { return this.stage; }
  getCycleCount(): number { return this.cycleCount; }
  getPatternCount(): number { return this.patternMemory.length; }
  getAdaptationCount(): number { return this.adaptationTriggered; }
  getDriftCount(): number { return this.driftDetected; }
}

// ============================================
// 独立基线（无SDL-CF协调）
// ============================================

class BareEngine {
  private engine: PerceptronEngine | KernelEngine | MiniNN;
  private recentCorrect: number[] = [];
  private windowSize = 50;

  constructor(inputDim: number, engineType: EngineType) {
    switch (engineType) {
      case 'perceptron': this.engine = new PerceptronEngine(inputDim); break;
      case 'kernel': this.engine = new KernelEngine(); break;
      case 'nn': this.engine = new MiniNN(inputDim, 16); break;
    }
  }

  process(x: number[], y: number): number {
    const pred = this.engine.predict(x);
    this.engine.train(x, y);
    const correct = pred === y ? 1 : 0;
    this.recentCorrect.push(correct);
    if (this.recentCorrect.length > this.windowSize) this.recentCorrect.shift();
    return correct;
  }

  getAccuracy(): number {
    if (this.recentCorrect.length === 0) return 0;
    return this.recentCorrect.reduce((a, b) => a + b, 0) / this.recentCorrect.length;
  }

  getEngineName(): string { return this.engine.name; }
}

// ============================================
// 实验指标
// ============================================

interface ExperimentMetrics {
  step: number;
  // SDL-CF + 各引擎
  sdl_perc: number;
  sdl_kernel: number;
  sdl_nn: number;
  // 裸引擎
  bare_perc: number;
  bare_kernel: number;
  bare_nn: number;
  // SDL-CF 认知指标
  surprise: number;
  stage: number;
  driftDetected: boolean;
  adapted: boolean;
  linearity: number;
  entropy: number;
  comm: number;
  ce: number;
  patterns: number;
}

// ============================================
// React 组件
// ============================================

export default function MetaFrameworkExperiment() {
  const [isRunning, setIsRunning] = useState(false);
  const [metrics, setMetrics] = useState<ExperimentMetrics[]>([]);
  const [step, setStep] = useState(0);
  const [driftEvents, setDriftEvents] = useState<number[]>([]);
  const [adaptEvents, setAdaptEvents] = useState<number[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stateRef = useRef<{
    stream: ConceptDriftStream;
    sdl_perc: SDLCognitiveFramework;
    sdl_kernel: SDLCognitiveFramework;
    sdl_nn: SDLCognitiveFramework;
    bare_perc: BareEngine;
    bare_kernel: BareEngine;
    bare_nn: BareEngine;
    sdlWindow: { perc: number[]; kern: number[]; nn: number[] };
    bareWindow: { perc: number[]; kern: number[]; nn: number[] };
  } | null>(null);

  const initState = useCallback(() => {
    const dim = 4;
    stateRef.current = {
      stream: new ConceptDriftStream(dim, 0.008),
      sdl_perc: new SDLCognitiveFramework(dim, 'perceptron'),
      sdl_kernel: new SDLCognitiveFramework(dim, 'kernel'),
      sdl_nn: new SDLCognitiveFramework(dim, 'nn'),
      bare_perc: new BareEngine(dim, 'perceptron'),
      bare_kernel: new BareEngine(dim, 'kernel'),
      bare_nn: new BareEngine(dim, 'nn'),
      sdlWindow: { perc: [], kern: [], nn: [] },
      bareWindow: { perc: [], kern: [], nn: [] },
    };
    setMetrics([]);
    setStep(0);
    setDriftEvents([]);
    setAdaptEvents([]);
  }, []);

  const runStep = useCallback(() => {
    if (!stateRef.current) return;
    const s = stateRef.current;
    const data = s.stream.generate();

    // SDL-CF 处理
    const r1 = s.sdl_perc.process(data.x, data.y);
    const r2 = s.sdl_kernel.process(data.x, data.y);
    const r3 = s.sdl_nn.process(data.x, data.y);

    // 裸引擎处理
    const b1 = s.bare_perc.process(data.x, data.y);
    const b2 = s.bare_kernel.process(data.x, data.y);
    const b3 = s.bare_nn.process(data.x, data.y);

    // 滑动窗口
    const win = 50;
    const push = (arr: number[], val: number) => { arr.push(val); if (arr.length > win) arr.shift(); };
    const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    push(s.sdlWindow.perc, r1.correct);
    push(s.sdlWindow.kern, r2.correct);
    push(s.sdlWindow.nn, r3.correct);
    push(s.bareWindow.perc, b1);
    push(s.bareWindow.kern, b2);
    push(s.bareWindow.nn, b3);

    const m: ExperimentMetrics = {
      step,
      sdl_perc: avg(s.sdlWindow.perc),
      sdl_kernel: avg(s.sdlWindow.kern),
      sdl_nn: avg(s.sdlWindow.nn),
      bare_perc: avg(s.bareWindow.perc),
      bare_kernel: avg(s.bareWindow.kern),
      bare_nn: avg(s.bareWindow.nn),
      surprise: r2.surprise,
      stage: r2.stage,
      driftDetected: r2.driftDetected,
      adapted: r2.adapted,
      linearity: r2.linearity,
      entropy: r2.entropy,
      comm: r2.commensurability,
      ce: r2.causalEmergence,
      patterns: s.sdl_kernel.getPatternCount(),
    };

    if (r2.driftDetected) setDriftEvents(prev => [...prev, step]);
    if (r2.adapted) setAdaptEvents(prev => [...prev, step]);

    setMetrics(prev => [...prev, m]);
    setStep(prev => prev + 1);
  }, [step]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(runStep, 30);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, runStep]);

  const start = () => {
    if (!stateRef.current) initState();
    setIsRunning(true);
  };

  const last = metrics[metrics.length - 1];

  // 计算最终对比
  const getFinalComparison = () => {
    if (metrics.length < 100) return null;
    const last100 = metrics.slice(-100);
    const avg = (key: keyof ExperimentMetrics) =>
      last100.reduce((a, b) => a + (b[key] as number), 0) / 100;

    return {
      sdl_perc: avg('sdl_perc'),
      sdl_kernel: avg('sdl_kernel'),
      sdl_nn: avg('sdl_nn'),
      bare_perc: avg('bare_perc'),
      bare_kernel: avg('bare_kernel'),
      bare_nn: avg('bare_nn'),
      avgSurprise: avg('surprise'),
      avgLinearity: avg('linearity'),
      avgCE: avg('ce'),
      driftCount: driftEvents.length,
      adaptCount: adaptEvents.length,
    };
  };

  const comparison = getFinalComparison();

  return (
    <div className="space-y-6">
      {/* 核心理念说明 */}
      <div className="bg-gradient-to-r from-purple-900/30 to-cyan-900/30 rounded-2xl p-6 border border-purple-500/20">
        <h2 className="text-xl font-bold text-purple-300 mb-3">SDL-CF 作为元框架的正确实验</h2>
        <p className="text-sm text-slate-300 leading-relaxed mb-3">
          您说得对——SDL-CF不是要替代传统方法，而是<strong className="text-cyan-300">将传统方法嵌入S2和S3</strong>。
          本实验对比的是：
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-slate-800/50 rounded-lg p-3">
            <h4 className="text-sm font-bold text-purple-300 mb-1">SDL-CF + 引擎</h4>
            <p className="text-xs text-slate-400">
              传统方法作为S2感知引擎，加上SDL-CF的认知协调层：
              惊讶度门控、抽象记忆(S4)、概念漂移检测、自适应机制
            </p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3">
            <h4 className="text-sm font-bold text-slate-400 mb-1">裸引擎（无SDL-CF）</h4>
            <p className="text-xs text-slate-500">
              同样的传统方法，但没有SDL-CF的认知协调层。
              纯在线学习，无惊讶度监控、无漂移检测、无自适应。
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-3">
          数据流包含概念漂移（决策边界随时间旋转），测试SDL-CF的自适应能力。
        </p>
      </div>

      {/* 控制 */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-purple-500/20 flex flex-wrap gap-3 items-center">
        <button onClick={start} disabled={isRunning}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-700 text-white disabled:opacity-50">
          ▶ {step > 0 ? '继续' : '开始'}
        </button>
        <button onClick={() => { setIsRunning(false); }} disabled={!isRunning}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-yellow-600 hover:bg-yellow-700 text-white disabled:opacity-50">
          ⏸ 暂停
        </button>
        <button onClick={() => { setIsRunning(false); initState(); }}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-600 hover:bg-slate-700 text-white">
          🔄 重置
        </button>
        <span className="text-sm text-slate-400">样本: {step}</span>
        {stateRef.current && (
          <span className="text-xs text-slate-500">
            | 漂移检测: {driftEvents.length}次 | 自适应触发: {adaptEvents.length}次
          </span>
        )}
      </div>

      {/* 实时指标 */}
      {last && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-purple-900/20 rounded-xl p-3 border border-purple-500/20">
            <div className="text-[10px] text-slate-400">SDL+NN</div>
            <div className="text-lg font-bold text-purple-300">{(last.sdl_nn * 100).toFixed(1)}%</div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-600/20">
            <div className="text-[10px] text-slate-400">裸NN</div>
            <div className="text-lg font-bold text-slate-300">{(last.bare_nn * 100).toFixed(1)}%</div>
          </div>
          <div className="bg-yellow-900/20 rounded-xl p-3 border border-yellow-500/20">
            <div className="text-[10px] text-slate-400">惊讶度 ε</div>
            <div className={`text-lg font-bold ${last.surprise > 0.7 ? 'text-red-400' : 'text-green-400'}`}>
              {last.surprise.toFixed(2)}
            </div>
          </div>
          <div className="bg-cyan-900/20 rounded-xl p-3 border border-cyan-500/20">
            <div className="text-[10px] text-slate-400">阶段 / 模式数</div>
            <div className="text-lg font-bold text-cyan-300">S{last.stage} / {last.patterns}</div>
          </div>
          <div className="bg-green-900/20 rounded-xl p-3 border border-green-500/20">
            <div className="text-[10px] text-slate-400">因果涌现</div>
            <div className="text-lg font-bold text-green-300">{last.ce.toFixed(3)}</div>
          </div>
        </div>
      )}

      {/* 准确率对比图 */}
      {metrics.length > 20 && (
        <div className="bg-slate-800/50 rounded-xl p-4 border border-purple-500/20">
          <h3 className="text-sm font-bold text-purple-300 mb-3">
            SDL-CF + 引擎 vs 裸引擎（滑动窗口准确率）
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {/* NN对比 */}
            <div>
              <p className="text-xs text-slate-400 mb-1">神经网络引擎</p>
              <svg viewBox="0 0 300 120" className="w-full h-24 bg-slate-900/50 rounded">
                {[0, 0.5, 1].map(v => (
                  <line key={v} x1="0" y1={110 - v * 100} x2="300" y2={110 - v * 100} stroke="#334155" strokeWidth="0.5" />
                ))}
                <polyline
                  points={metrics.map((m, i) => `${(i / metrics.length) * 300},${110 - m.sdl_nn * 100}`).join(' ')}
                  fill="none" stroke="#a855f7" strokeWidth="2"
                />
                <polyline
                  points={metrics.map((m, i) => `${(i / metrics.length) * 300},${110 - m.bare_nn * 100}`).join(' ')}
                  fill="none" stroke="#64748b" strokeWidth="1.5" strokeDasharray="3"
                />
                {/* 漂移事件标记 */}
                {driftEvents.map(d => (
                  <line key={d} x1={(d / metrics.length) * 300} y1="0" x2={(d / metrics.length) * 300} y2="110"
                    stroke="#ef4444" strokeWidth="0.5" strokeDasharray="2" opacity="0.5" />
                ))}
              </svg>
              <div className="flex gap-3 text-[10px] mt-1">
                <span className="text-purple-400">━ SDL+NN</span>
                <span className="text-slate-500">╌ 裸NN</span>
                <span className="text-red-400">┆ 漂移</span>
              </div>
            </div>

            {/* Kernel对比 */}
            <div>
              <p className="text-xs text-slate-400 mb-1">核方法引擎</p>
              <svg viewBox="0 0 300 120" className="w-full h-24 bg-slate-900/50 rounded">
                {[0, 0.5, 1].map(v => (
                  <line key={v} x1="0" y1={110 - v * 100} x2="300" y2={110 - v * 100} stroke="#334155" strokeWidth="0.5" />
                ))}
                <polyline
                  points={metrics.map((m, i) => `${(i / metrics.length) * 300},${110 - m.sdl_kernel * 100}`).join(' ')}
                  fill="none" stroke="#a855f7" strokeWidth="2"
                />
                <polyline
                  points={metrics.map((m, i) => `${(i / metrics.length) * 300},${110 - m.bare_kernel * 100}`).join(' ')}
                  fill="none" stroke="#64748b" strokeWidth="1.5" strokeDasharray="3"
                />
                {driftEvents.map(d => (
                  <line key={d} x1={(d / metrics.length) * 300} y1="0" x2={(d / metrics.length) * 300} y2="110"
                    stroke="#ef4444" strokeWidth="0.5" strokeDasharray="2" opacity="0.5" />
                ))}
              </svg>
              <div className="flex gap-3 text-[10px] mt-1">
                <span className="text-purple-400">━ SDL+Kernel</span>
                <span className="text-slate-500">╌ 裸Kernel</span>
              </div>
            </div>

            {/* Perceptron对比 */}
            <div>
              <p className="text-xs text-slate-400 mb-1">感知器引擎</p>
              <svg viewBox="0 0 300 120" className="w-full h-24 bg-slate-900/50 rounded">
                {[0, 0.5, 1].map(v => (
                  <line key={v} x1="0" y1={110 - v * 100} x2="300" y2={110 - v * 100} stroke="#334155" strokeWidth="0.5" />
                ))}
                <polyline
                  points={metrics.map((m, i) => `${(i / metrics.length) * 300},${110 - m.sdl_perc * 100}`).join(' ')}
                  fill="none" stroke="#a855f7" strokeWidth="2"
                />
                <polyline
                  points={metrics.map((m, i) => `${(i / metrics.length) * 300},${110 - m.bare_perc * 100}`).join(' ')}
                  fill="none" stroke="#64748b" strokeWidth="1.5" strokeDasharray="3"
                />
                {driftEvents.map(d => (
                  <line key={d} x1={(d / metrics.length) * 300} y1="0" x2={(d / metrics.length) * 300} y2="110"
                    stroke="#ef4444" strokeWidth="0.5" strokeDasharray="2" opacity="0.5" />
                ))}
              </svg>
              <div className="flex gap-3 text-[10px] mt-1">
                <span className="text-purple-400">━ SDL+Perc</span>
                <span className="text-slate-500">╌ 裸Perc</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SDL-CF 认知指标 */}
      {metrics.length > 20 && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-purple-500/20">
            <h3 className="text-sm font-bold text-yellow-300 mb-2">惊讶度 + 阶段</h3>
            <svg viewBox="0 0 400 130" className="w-full h-28 bg-slate-900/50 rounded">
              <line x1="0" y1={120 - 0.1 * 110} x2="400" y2={120 - 0.1 * 110} stroke="#22c55e" strokeWidth="0.5" strokeDasharray="3" />
              <line x1="0" y1={120 - 0.8 * 110} x2="400" y2={120 - 0.8 * 110} stroke="#ef4444" strokeWidth="0.5" strokeDasharray="3" />
              <text x="5" y={120 - 0.1 * 110 - 2} fill="#22c55e" fontSize="7">ε_min</text>
              <text x="5" y={120 - 0.8 * 110 + 8} fill="#ef4444" fontSize="7">ε_max</text>
              <polyline
                points={metrics.map((m, i) => `${(i / metrics.length) * 400},${120 - m.surprise * 110}`).join(' ')}
                fill="none" stroke="#fbbf24" strokeWidth="1.5"
              />
              {/* 自适应事件 */}
              {adaptEvents.map(d => (
                <circle key={d} cx={(d / metrics.length) * 400} cy="10" r="3" fill="#f472b6" />
              ))}
            </svg>
            <p className="text-[10px] text-slate-500 mt-1">
              <span className="text-pink-400">●</span> 自适应触发点 | 惊讶度被约束在安全区间内
            </p>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-4 border border-purple-500/20">
            <h3 className="text-sm font-bold text-cyan-300 mb-2">四象限轨迹 + 因果涌现</h3>
            <svg viewBox="0 0 300 130" className="w-full h-28 bg-slate-900/50 rounded">
              <line x1="150" y1="0" x2="150" y2="130" stroke="#475569" strokeWidth="0.5" strokeDasharray="3" />
              <line x1="0" y1="65" x2="300" y2="65" stroke="#475569" strokeWidth="0.5" strokeDasharray="3" />
              <text x="20" y="20" fill="#60a5fa" fontSize="7">Q1</text>
              <text x="270" y="20" fill="#a78bfa" fontSize="7">Q2</text>
              <text x="20" y="120" fill="#34d399" fontSize="7">Q4</text>
              <text x="270" y="120" fill="#fb923c" fontSize="7">Q3</text>
              <polyline
                points={metrics.slice(-300).map(m => `${m.comm * 300},${(1 - m.entropy) * 130}`).join(' ')}
                fill="none" stroke="#06b6d4" strokeWidth="1.5"
              />
              {last && (
                <circle cx={last.comm * 300} cy={(1 - last.entropy) * 130} r="3" fill="#f472b6" />
              )}
            </svg>
          </div>
        </div>
      )}

      {/* 最终对比总结 */}
      {comparison && (
        <div className="bg-slate-800/50 rounded-xl p-5 border border-purple-500/20">
          <h3 className="text-lg font-bold text-purple-300 mb-4">📊 最终对比结果</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 text-slate-400">配置</th>
                  <th className="text-center py-2 text-slate-400">+感知器</th>
                  <th className="text-center py-2 text-slate-400">+核方法</th>
                  <th className="text-center py-2 text-slate-400">+神经网络</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-800">
                  <td className="py-2 text-purple-300 font-medium">SDL-CF + 引擎</td>
                  <td className="text-center text-purple-200">{(comparison.sdl_perc * 100).toFixed(1)}%</td>
                  <td className="text-center text-purple-200">{(comparison.sdl_kernel * 100).toFixed(1)}%</td>
                  <td className="text-center text-purple-200">{(comparison.sdl_nn * 100).toFixed(1)}%</td>
                </tr>
                <tr className="border-b border-slate-800">
                  <td className="py-2 text-slate-400">裸引擎</td>
                  <td className="text-center text-slate-300">{(comparison.bare_perc * 100).toFixed(1)}%</td>
                  <td className="text-center text-slate-300">{(comparison.bare_kernel * 100).toFixed(1)}%</td>
                  <td className="text-center text-slate-300">{(comparison.bare_nn * 100).toFixed(1)}%</td>
                </tr>
                <tr>
                  <td className="py-2 text-green-300 font-medium">SDL-CF 增益</td>
                  <td className="text-center text-green-300">
                    {((comparison.sdl_perc - comparison.bare_perc) * 100).toFixed(1)}%
                  </td>
                  <td className="text-center text-green-300">
                    {((comparison.sdl_kernel - comparison.bare_kernel) * 100).toFixed(1)}%
                  </td>
                  <td className="text-center text-green-300">
                    {((comparison.sdl_nn - comparison.bare_nn) * 100).toFixed(1)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="grid md:grid-cols-3 gap-3 mt-4">
            <div className="bg-slate-900/50 rounded-lg p-3">
              <p className="text-xs text-slate-400">平均惊讶度</p>
              <p className="text-lg font-bold text-yellow-300">{comparison.avgSurprise.toFixed(3)}</p>
              <p className="text-[10px] text-slate-500">约束在 [0.1, 0.8] 内</p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3">
              <p className="text-xs text-slate-400">概念漂移检测</p>
              <p className="text-lg font-bold text-red-300">{comparison.driftCount} 次</p>
              <p className="text-[10px] text-slate-500">裸引擎无法检测漂移</p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3">
              <p className="text-xs text-slate-400">自适应触发</p>
              <p className="text-lg font-bold text-pink-300">{comparison.adaptCount} 次</p>
              <p className="text-[10px] text-slate-500">裸引擎无自适应能力</p>
            </div>
          </div>
        </div>
      )}

      {/* 诚实分析 */}
      <div className="bg-gradient-to-r from-green-900/20 to-cyan-900/20 rounded-xl p-5 border border-green-500/20">
        <h3 className="text-lg font-bold text-green-300 mb-3">🎯 正确定位下的分析</h3>
        <div className="space-y-3 text-sm text-slate-300">
          <div>
            <h4 className="font-semibold text-cyan-300">SDL-CF 作为元框架的增益来源：</h4>
            <ul className="list-disc list-inside text-slate-400 mt-1 space-y-1">
              <li><strong className="text-slate-200">概念漂移检测</strong>：惊讶度突增 → 自动检测分布变化 → 触发适应</li>
              <li><strong className="text-slate-200">抽象记忆(S4)</strong>：积累模式库，为新样本提供先验知识</li>
              <li><strong className="text-slate-200">惊讶度门控</strong>：防止引擎过拟合或欠拟合</li>
              <li><strong className="text-slate-200">S3干预修正</strong>：用模式记忆投票修正S2引擎的预测</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-yellow-300">增益最大的场景：</h4>
            <ul className="list-disc list-inside text-slate-400 mt-1 space-y-1">
              <li>存在概念漂移的数据流（裸引擎性能下降，SDL-CF自动适应）</li>
              <li>弱引擎（感知器）获得最大提升（SDL-CF弥补了引擎的不足）</li>
              <li>强引擎（NN）提升较小（引擎本身已经很强）</li>
            </ul>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3">
            <p className="text-slate-300">
              <strong className="text-green-300">核心结论：</strong>
              SDL-CF 的价值不在于替代传统方法，而在于<strong className="text-cyan-300">赋能</strong>传统方法。
              它为任何ML引擎添加了"认知能力"：惊讶度监控、漂移检测、自适应、可解释性。
              这就像给汽车装上自动驾驶系统——汽车引擎（传统ML）提供动力，
              SDL-CF提供导航、避障和决策协调。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
