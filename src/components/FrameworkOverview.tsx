import { useState } from 'react';

const stages = [
  {
    id: 'S1',
    title: '输入阶段 (Input)',
    color: 'from-blue-500 to-cyan-500',
    icon: '📥',
    description: '外部环境作为无穷维约束方程，通过投影产生低维输入方程',
    details: [
      '环境约束方程 E(x) ≈ 线性（Cover定理保证高维线性可分性）',
      '输入方程 I(t) = Π_d[E(x)]，其中 Π_d 为到 d 维空间的投影',
      '输入是环境在高维空间中的低维投影，保留了关键信息但丢失了部分结构',
    ],
    pearl: 'L1 — 关联层（Association）',
  },
  {
    id: 'S2',
    title: '情境感知 (Perception)',
    color: 'from-purple-500 to-pink-500',
    icon: '👁️',
    description: '输入方程与系统约束方程耦合，产生极低维感知方程',
    details: [
      '系统约束方程 S(x) 是主体对世界的内部模型',
      '感知方程 P(t) = K[I(t), S(x)]，K 为卷积/核耦合算子',
      '惊讶度 ε = D_KL[P || S] 须在 [ε_min, ε_max] 区间内',
      '不同意 Friston：惊讶度不能完全最小化，需保持适度以维持探索',
    ],
    pearl: 'L1→L2 过渡（开始理解干预）',
  },
  {
    id: 'S3',
    title: '干预阶段 (Intervention)',
    color: 'from-orange-500 to-red-500',
    icon: '🎯',
    description: '将感知方程升维回输入维度，生成输出方程',
    details: [
      '输出方程 O(t) = Φ↑[P(t)]，Φ↑ 为升维映射',
      '升维过程保留了感知的语义，但恢复了行动空间',
      '类似于 Pearl 因果阶梯的干预层：do(X=x) 的操作',
      '输出方程同时具备输入方程和系统约束方程的特征',
    ],
    pearl: 'L2 — 干预层（Intervention）',
  },
  {
    id: 'S4',
    title: '抽象逻辑化 (Abstraction)',
    color: 'from-green-500 to-emerald-500',
    icon: '🧠',
    description: '进一步升维至超越原始输入维度，产生半统合方程',
    details: [
      '半统合方程 U(t) = Ψ↑[O(t)]，dim(U) > dim(I)',
      '泛化条件：U 不仅解释当前事件，还需具有普遍解释力',
      '"知识的诅咒"：U 只统合与当前相近的经验，遗忘来时路',
      'Gödel 不完备性：系统无法完全自描述，观测者效应导致主观性',
      '类似 Calabi-Yau 的永久紧致化维度',
    ],
    pearl: 'L2→L3 过渡（局部反事实）',
  },
  {
    id: 'S5',
    title: '再线性化与解耦 (Linearization & Decoupling)',
    color: 'from-cyan-500 to-blue-500',
    icon: '🔓',
    description: 'Koopman 升维线性化，逼近原始约束方程，实现因果涌现',
    details: [
      'Koopman 算子 K：将低维非线性动力学提升为高维线性动力学',
      '解耦：引入外部信息完备系统，类似量子退相干',
      '更新约束方程 S\'(x) = ∫[K[U(t)]] dμ',
      '因果涌现：宏观描述比微观描述具有更强的因果效力',
      '"反紧致化"：释放紧致维度到外部空间',
    ],
    pearl: 'L3 — 反事实层（Counterfactual）',
  },
];

export default function FrameworkOverview() {
  const [expandedStage, setExpandedStage] = useState<string | null>('S1');

  return (
    <div className="space-y-8">
      {/* Introduction */}
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-purple-500/20">
        <h2 className="text-xl font-bold text-purple-300 mb-4">核心思想</h2>
        <p className="text-slate-300 leading-relaxed mb-4">
          任何复杂系统（气象、经济、心智、社会等）本质上是一个<strong className="text-cyan-300">极高维信息的集合</strong>。
          差异在于信息本身，而关系结构是大致相同的——这呼应了贝塔朗菲的一般系统论和卡尔曼的状态空间模型思想。
          系统本身是一个含有近乎无限个变量的约束关系，但由于维度诅咒和计算复杂度，这个约束方程是不可得的，仅存于理念世界。
        </p>
        <p className="text-slate-300 leading-relaxed mb-4">
          关键公设：根据 <strong className="text-yellow-300">Cover 定理</strong>，维度越高越能线性可分。因此，
          这个无穷维约束方程是<strong className="text-green-300">几乎线性的</strong>，非常有规律，不会出现太多混沌。
        </p>
        <p className="text-slate-300 leading-relaxed">
          认知过程就是在这个高维空间中，通过<strong className="text-pink-300">降维→升维→再线性化</strong>的螺旋循环，
          不断逼近那个理念世界中的约束方程，实现认知的螺旋上升。
        </p>
      </div>

      {/* Stages */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-purple-300">五阶段认知循环 (S1 → S5)</h2>
        {stages.map((stage) => (
          <div
            key={stage.id}
            className="bg-slate-800/50 rounded-xl border border-purple-500/20 overflow-hidden transition-all"
          >
            <button
              onClick={() => setExpandedStage(expandedStage === stage.id ? null : stage.id)}
              className="w-full px-6 py-4 flex items-center gap-4 text-left hover:bg-slate-700/30 transition-colors"
            >
              <span className="text-2xl">{stage.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold bg-gradient-to-r ${stage.color} text-white`}>
                    {stage.id}
                  </span>
                  <h3 className="font-semibold text-slate-200">{stage.title}</h3>
                </div>
                <p className="text-sm text-slate-400 mt-1">{stage.description}</p>
              </div>
              <span className="text-slate-500 text-sm">
                {expandedStage === stage.id ? '▲' : '▼'}
              </span>
            </button>
            {expandedStage === stage.id && (
              <div className="px-6 pb-4 border-t border-purple-500/10 pt-4">
                <ul className="space-y-2 mb-4">
                  {stage.details.map((detail, i) => (
                    <li key={i} className="text-sm text-slate-300 flex gap-2">
                      <span className="text-purple-400">•</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
                <div className="bg-slate-900/50 rounded-lg px-4 py-2 text-sm">
                  <span className="text-yellow-400 font-medium">Pearl 因果阶梯对应：</span>
                  <span className="text-slate-300 ml-2">{stage.pearl}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Key Innovations */}
      <div className="bg-gradient-to-r from-purple-900/30 to-cyan-900/30 rounded-2xl p-6 border border-purple-500/20">
        <h2 className="text-xl font-bold text-purple-300 mb-4">关键创新点</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <h3 className="font-semibold text-cyan-300 mb-2">🔄 惊讶度的非零下界</h3>
            <p className="text-sm text-slate-400">
              与 Friston 的自由能原理不同，本框架认为惊讶度 ε 必须保持在一个 [ε_min, ε_max] 的非零区间内。
              完全最小化惊讶度会导致系统失去探索能力和创造性。
            </p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <h3 className="font-semibold text-cyan-300 mb-2">📐 降维-升维对称性</h3>
            <p className="text-sm text-slate-400">
              S2-S3 是临时性降维（类似 Calabi-Yau 的临时紧致化），S4 是永久性维度创造，
              S5 则是"反紧致化"释放——这与弦论中的紧致化/去紧致化形成同构。
            </p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <h3 className="font-semibold text-cyan-300 mb-2">🌀 递归自迭代</h3>
            <p className="text-sm text-slate-400">
              系统可以将自身视为"环境"，划分为子系统两两交互，通过递归循环实现自我迭代。
              每步处于自组织临界态（SOC），服从幂律分布。
            </p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <h3 className="font-semibold text-cyan-300 mb-2">📊 可通约度定量</h3>
            <p className="text-sm text-slate-400">
              引入"可通约度"概念（类似保守性/理性主义程度），不受阅历影响的内在理性度量。
              系统在四象限中螺旋运动：高熵高可通约 → 高熵低可通约 → 低熵低可通约 → 低熵高可通约。
            </p>
          </div>
        </div>
      </div>

      {/* Theoretical Foundations */}
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-purple-500/20">
        <h2 className="text-xl font-bold text-purple-300 mb-4">理论基石</h2>
        <div className="grid md:grid-cols-3 gap-3">
          {[
            { name: 'Cover 定理', desc: '高维空间中模式更可能线性可分' },
            { name: 'Koopman 算子', desc: '将非线性动力学提升为高维线性系统' },
            { name: '变分自由能', desc: 'Friston 的惊讶度最小化（本框架修正之）' },
            { name: 'Pearl 因果阶梯', desc: 'L1关联→L2干预→L3反事实' },
            { name: '因果涌现', desc: 'Hoel: 宏观因果效力可超越微观' },
            { name: 'Calabi-Yau 紧致化', desc: '额外维度的紧致化/去紧致化' },
            { name: '自组织临界态', desc: 'Bak-Tang: 幂律分布的自组织' },
            { name: 'Gödel 不完备性', desc: '系统无法完全自描述' },
            { name: '核方法/卷积', desc: '高维特征空间的隐式映射' },
          ].map((item) => (
            <div key={item.name} className="bg-slate-900/50 rounded-lg px-3 py-2">
              <span className="text-xs font-bold text-purple-400">{item.name}</span>
              <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
