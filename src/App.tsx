import { useState } from 'react';
import FrameworkOverview from './components/FrameworkOverview';
import MathematicalFormalism from './components/MathematicalFormalism';
import InteractiveDemo from './components/InteractiveDemo';
import AnalysisSection from './components/AnalysisSection';
import QuadrantVisualization from './components/QuadrantVisualization';
import MathDemo from './components/MathDemo';
import HonestExperiment from './components/HonestExperiment';

type Tab = 'overview' | 'formalism' | 'demo' | 'mathdemo' | 'quadrant' | 'experiment' | 'analysis';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview', label: '框架概述', icon: '🌀' },
    { id: 'formalism', label: '数学形式化', icon: '📐' },
    { id: 'demo', label: '系统模拟', icon: '🔬' },
    { id: 'mathdemo', label: '数学机制', icon: '🧮' },
    { id: 'quadrant', label: '四象限模型', icon: '📊' },
    { id: 'experiment', label: '经验验证', icon: '🧪' },
    { id: 'analysis', label: '优劣分析', icon: '⚖️' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-purple-500/30 backdrop-blur-sm bg-slate-900/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent">
            螺旋升维认知框架 (SDL-CF)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Spiral Dimensional Lifting Cognitive Framework — 基于高维线性化与因果涌现的统一认知范式
          </p>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-purple-500/20 bg-slate-900/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-purple-600/40 text-purple-200 shadow-lg shadow-purple-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'overview' && <FrameworkOverview />}
        {activeTab === 'formalism' && <MathematicalFormalism />}
        {activeTab === 'demo' && <InteractiveDemo />}
        {activeTab === 'mathdemo' && <MathDemo />}
        {activeTab === 'quadrant' && <QuadrantVisualization />}
        {activeTab === 'experiment' && <HonestExperiment />}
        {activeTab === 'analysis' && <AnalysisSection />}
      </main>

      {/* Footer */}
      <footer className="border-t border-purple-500/20 bg-slate-900/50 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p>SDL-CF: 一个融合 Cover 定理、Koopman 算子、因果涌现、Pearl 因果阶梯与 Calabi-Yau 紧致化思想的统一认知框架</p>
        </div>
      </footer>
    </div>
  );
}
