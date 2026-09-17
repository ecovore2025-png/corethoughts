import { useState } from 'react';

type Tab = 'strengths' | 'weaknesses' | 'related' | 'newParadigm';

export default function AnalysisSection() {
  const [activeTab, setActiveTab] = useState<Tab>('strengths');

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-purple-500/20">
        <h2 className="text-xl font-bold text-purple-300 mb-2">学术文献分析与评估</h2>
        <p className="text-slate-400 text-sm">
          基于对相关学术文献的系统检索，对 SDL-CF 框架的优点、不足、相关工作及新范式进行评述。
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'strengths' as Tab, label: '✅ 优点' },
          { id: 'weaknesses' as Tab, label: '⚠️ 不足' },
          { id: 'related' as Tab, label: '📚 相关工作' },
          { id: 'newParadigm' as Tab, label: '🔬 新范式提案' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-purple-600/40 text-purple-200'
                : 'text-slate-400 hover:text-slate-200 bg-slate-800/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'strengths' && <StrengthsSection />}
      {activeTab === 'weaknesses' && <WeaknessesSection />}
      {activeTab === 'related' && <RelatedWorkSection />}
      {activeTab === 'newParadigm' && <NewParadigmSection />}
    </div>
  );
}

function StrengthsSection() {
  return (
    <div className="space-y-4">
      <div className="bg-green-900/20 rounded-xl p-5 border border-green-500/20">
        <h3 className="text-lg font-bold text-green-300 mb-3">理论优点</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-green-200 mb-1">1. 统一性框架的雄心</h4>
            <p className="text-sm text-slate-300">
              将 Cover 定理、Koopman 算子、Friston 自由能、Pearl 因果阶梯、因果涌现和 Calabi-Yau 紧致化
              整合在一个统一的认知框架中，这种跨学科综合在文献中是罕见的。
              类似于 Bertalanffy 一般系统论的现代升级版。
            </p>
            <p className="text-xs text-slate-500 mt-1">
              参考: Bertalanffy (1968) "General System Theory"; Kalman (1960) SSM
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-green-200 mb-1">2. 对自由能原理的修正具有洞见</h4>
            <p className="text-sm text-slate-300">
              提出惊讶度不应完全最小化而应保持非零下界，这与 Schwartenbeck et al. (2013) 关于
              "exploration and novelty seeking" 的发现一致。Friston 的框架确实面临"过度利用-缺乏探索"的批评
              (Millidge et al., 2022)。本框架的 [ε_min, ε_max] 区间约束提供了更优雅的解决方案。
            </p>
            <p className="text-xs text-slate-500 mt-1">
              参考: Schwartenbeck et al. (2013) Frontiers in Psychology; Millidge et al. (2022) Neural Computation
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-green-200 mb-1">3. 降维-升维对称性与 Cover 定理的结合</h4>
            <p className="text-sm text-slate-300">
              利用 Cover 定理（高维线性可分性）来论证约束方程的"几乎线性"特质，
              然后通过 Koopman 算子实现非线性→线性的提升，这在数学上是自洽的。
              Williams et al. (2015) 的 "A data-driven approximation of the Koopman operator"
              已经验证了这种方法的可行性。
            </p>
            <p className="text-xs text-slate-500 mt-1">
              参考: Cover (1965) "Geometrical and Statistical Properties of Systems of Linear Inequalities";
              Williams et al. (2015) PNAS
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-green-200 mb-1">4. 因果涌现的引入</h4>
            <p className="text-sm text-slate-300">
              S5 阶段与 Hoel (2017, 2026) 的因果涌现理论高度契合：
              通过 coarse-graining（粗粒化）获得更强的因果效力。
              本框架将因果涌现置于认知循环的终端，赋予了它操作性的意义。
            </p>
            <p className="text-xs text-slate-500 mt-1">
              参考: Hoel (2017) "When the Map Is Better Than the Territory"; Hoel (2026) "Causal Emergence 2.0"
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-green-200 mb-1">5. 递归自迭代与 SOC 的结合</h4>
            <p className="text-sm text-slate-300">
              提出系统可以通过将自身划分为子系统来实现自我迭代，每步处于自组织临界态，
              这为"无外部刺激下的系统演化"提供了可行路径。
              与 Bak et al. (1987) 的 SOC 理论和 Kauffman (1993) 的 "order for free" 概念一致。
            </p>
            <p className="text-xs text-slate-500 mt-1">
              参考: Bak et al. (1987) PRL; Kauffman (1993) "The Origins of Order"
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-green-200 mb-1">6. "知识的诅咒"的定量表达</h4>
            <p className="text-sm text-slate-300">
              将专家面对初学者时的认知偏差（将事物本身的逻辑等同于学习过程）
              用 Bias_KC = ||U_local - U_global|| / ||U_global|| 来定量表达，
              这是一个可操作化的贡献。与 Chi (2006) 关于专家-新手差异的研究呼应。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function WeaknessesSection() {
  return (
    <div className="space-y-4">
      <div className="bg-red-900/20 rounded-xl p-5 border border-red-500/20">
        <h3 className="text-lg font-bold text-red-300 mb-3">潜在不足与挑战</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-red-200 mb-1">1. "几乎线性"公设的过度简化</h4>
            <p className="text-sm text-slate-300">
              Cover 定理确实保证高维线性可分性，但它针对的是<strong>分类问题</strong>，
              而非一般的函数逼近。对于连续动力系统，高维并不自动意味着线性——
              许多高维系统（如湍流、神经网络训练动态）仍然表现出强烈的非线性。
              May (1976) 已经证明，即使是简单的低维非线性系统也能产生混沌。
            </p>
            <p className="text-xs text-slate-500 mt-1">
              参考: May (1976) Nature "Simple mathematical models with very complicated dynamics"
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-red-200 mb-1">2. 无穷维约束方程的不可操作性</h4>
            <p className="text-sm text-slate-300">
              将系统约束方程定义为"仅存于理念世界"的无穷维对象，虽然在哲学上优雅，
              但在数学上缺乏操作性。这类似于 Kant 的"物自体"概念——
              设定了一个永远无法直接触及的目标。
              虽然渐近逼近是可行的，但缺少收敛速率和误差界的保证。
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-red-200 mb-1">3. Calabi-Yau 类比的深度问题</h4>
            <p className="text-sm text-slate-300">
              CY 流形的紧致化有严格的数学约束（Ricci-flat, SU(n) holonomy 等），
              而认知过程中的"维度创造"是否满足这些约束并不清楚。
              如果仅仅是隐喻性的类比，那么它的预测力有限；
              如果要求严格的数学同构，则需要证明认知空间确实满足 CY 的几何条件。
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-red-200 mb-1">4. 可通约度的定义模糊性</h4>
            <p className="text-sm text-slate-300">
              "可通约度"被描述为"不受阅历影响的保守性/理性主义程度"，
              但其数学定义 C(t) = 1 - H_rel(S_t || S_∞) 依赖于理想约束方程 S_∞，
              而 S_∞ 本身是不可得的（公设中已承认）。
              这导致可通约度在操作上无法直接计算，只能间接估计。
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-red-200 mb-1">5. 核耦合的计算复杂度</h4>
            <p className="text-sm text-slate-300">
              S2 阶段的核耦合 P(t) = K[I ⊗ S] 涉及无穷维积分，
              即使有限维近似也需要 O(N²) 的核矩阵计算。
              对于"近乎无限个变量"的系统，这在实际中是不可行的。
              需要引入随机特征近似 (Rahimi & Recht, 2007) 或 Nyström 方法。
            </p>
            <p className="text-xs text-slate-500 mt-1">
              参考: Rahimi & Recht (2007) "Random Features for Large-Scale Kernel Machines"
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-red-200 mb-1">6. 自我指涉的 Gödel 约束</h4>
            <p className="text-sm text-slate-300">
              框架承认 Gödel 不完备性意味着系统无法完全自描述，
              但没有给出在不完备性约束下如何保证迭代收敛的方案。
              如果自迭代可能产生不一致的结果，那么整个框架的可靠性就受到质疑。
              这类似于"理发师悖论"——系统试图通过自身来完备自身。
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-red-200 mb-1">7. 缺乏经验验证</h4>
            <p className="text-sm text-slate-300">
              作为一个元理论框架，目前缺少具体的经验预测和可证伪性检验。
              自由能原理也面临类似的批评 (Gershman, 2019)：
              "如果所有行为都可以解释为自由能最小化，那这个理论就没有预测力。"
              本框架需要提出具体的、可证伪的预测。
            </p>
            <p className="text-xs text-slate-500 mt-1">
              参考: Gershman (2019) "What is free energy minimization?"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function RelatedWorkSection() {
  const works = [
    {
      category: '直接相关',
      items: [
        {
          ref: 'Friston (2010) "The free-energy principle: a unified brain theory?" Nature Reviews Neuroscience',
          relevance: '本框架的惊讶度概念直接源自 FEP，但修正了其最小化假设',
        },
        {
          ref: 'Williams et al. (2015) "A data-driven approximation of the Koopman operator" PNAS',
          relevance: 'S5 的 Koopman 线性化方法的技术基础',
        },
        {
          ref: 'Hoel (2017) "When the Map Is Better Than the Territory" Entropy',
          relevance: '因果涌现理论，S5 阶段的理论基础',
        },
        {
          ref: 'Pearl (2009) "Causality" Cambridge University Press',
          relevance: '因果阶梯 L1-L3 与本框架 S1-S5 的对应关系',
        },
      ],
    },
    {
      category: '间接相关',
      items: [
        {
          ref: 'Schmidhuber (1990) "Making the world differentiable: the use of self-referentially weighted networks"',
          relevance: '递归自指涉的思想先驱',
        },
        {
          ref: 'Bengio et al. (2013) "Representation Learning: A Review" IEEE TNNLS',
          relevance: '深度学习中降维→升维的层次化表征学习',
        },
        {
          ref: 'Tononi et al. (2016) "Integrated Information Theory" PLOS Computational Biology',
          relevance: '意识的信息整合理论与本框架的信息论基础',
        },
        {
          ref: 'Liu et al. (2022) "A survey on neural ODEs" arXiv',
          relevance: '连续时间动态系统的神经网络逼近，与 Koopman 方法互补',
        },
        {
          ref: 'Scholkopf et al. (2021) "Toward Causal Representation Learning" Proc. IEEE',
          relevance: '因果表征学习，与本框架的因果阶梯对应',
        },
      ],
    },
    {
      category: '哲学基础',
      items: [
        {
          ref: 'Bertalanffy (1968) "General System Theory"',
          relevance: '一般系统论——"关系是大差不差的"思想的源头',
        },
        {
          ref: 'Kant (1781) "Critique of Pure Reason"',
          relevance: '先验范畴与"理念世界"约束方程的哲学对应',
        },
        {
          ref: 'Whitehead (1929) "Process and Reality"',
          relevance: '过程哲学——认知作为动态过程而非静态结构',
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {works.map((section) => (
        <div key={section.category} className="bg-slate-800/50 rounded-xl p-5 border border-purple-500/20">
          <h3 className="text-lg font-bold text-cyan-300 mb-3">{section.category}</h3>
          <div className="space-y-3">
            {section.items.map((item, i) => (
              <div key={i} className="bg-slate-900/50 rounded-lg p-3">
                <p className="text-sm text-slate-300 font-medium">{item.ref}</p>
                <p className="text-xs text-slate-500 mt-1">→ {item.relevance}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function NewParadigmSection() {
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-purple-900/30 to-cyan-900/30 rounded-xl p-5 border border-purple-500/20">
        <h3 className="text-lg font-bold text-purple-300 mb-3">SDL-CF 机器学习新范式提案</h3>
        <p className="text-sm text-slate-300 mb-4">
          基于上述框架，提出一个可实现的机器学习范式——<strong className="text-cyan-300">螺旋升维网络 (Spiral Lifting Network, SLN)</strong>。
        </p>

        <div className="space-y-4">
          <div className="bg-slate-900/50 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-300 mb-2">架构概览</h4>
            <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap">{`
输入 x ∈ ℝ^d
    │
    ▼
[S1] 环境编码器 E_θ: ℝ^d → ℝ^D (D >> d)
    │  使用随机傅里叶特征或神经隐式表示
    │
    ▼
[S2] 核耦合感知层 K_φ: ℝ^D × ℝ^D → ℝ^k (k << d)
    │  P = KernelConv(E(x), S; σ)  σ 可学习
    │  惊讶度门控: gate = σ(ε - ε_min) · σ(ε_max - ε)
    │  若 gate ≈ 0，触发递归降阶
    │
    ▼
[S3] 干预解码器 D_ψ: ℝ^k → ℝ^d'
    │  O = D(P)  d' > d (升维)
    │  使用 Hypernetwork 生成解码权重
    │
    ▼
[S4] 抽象统合层 A_χ: ℝ^d' → ℝ^D'
    │  U = A(O)  D' > d' > d
    │  使用 attention 实现跨域泛化
    │  知识的诅咒正则化: L_KC = ||U_local - U_global||²
    │
    ▼
[S5] Koopman 线性化层 K_ω: ℝ^D' → ℝ^D'
    │  G(x_{t+1}) = K̃ · G(x_t)
    │  K̃ 通过 EDMD (Extended DMD) 学习
    │  解耦: S' = S + α·K̃·U - β·Decoh(S, E_ext)
    │
    ▼
输出: 更新的系统模型 S' + 因果涌现度量 CE
`}</pre>
          </div>

          <div className="bg-slate-900/50 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-300 mb-2">训练目标</h4>
            <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap">{`
L_total = L_recon + λ₁·L_surprise + λ₂·L_linearity + λ₃·L_KC + λ₄·L_CA

L_recon    = ||x - decode(encode(x))||²          // 重构损失
L_surprise = max(0, ε - ε_max) + max(0, ε_min - ε) // 惊讶度区间约束
L_linearity = ||K̃·G - G'||²                       // Koopman 线性化损失
L_KC       = ||U_local - U_global||²               // 知识诅咒正则
L_CA       = -C_eff(S')                            // 最大化因果涌现
`}</pre>
          </div>

          <div className="bg-slate-900/50 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-300 mb-2">与传统方法的关系</h4>
            <div className="text-xs text-slate-300 space-y-1">
              <p>• <strong>Transformer</strong>: 可视为 S4 注意力统合的特例</p>
              <p>• <strong>VAE</strong>: 可视为 S2-S3 降维-升维的概率版本</p>
              <p>• <strong>RL</strong>: 可视为 S3 干预阶段的序列决策</p>
              <p>• <strong>贝叶斯优化</strong>: 可视为惊讶度引导的探索策略</p>
              <p>• <strong>GAN</strong>: 可视为 S5 解耦阶段的对抗完备</p>
              <p>• <strong>Neural ODE</strong>: 可视为连续时间版本的 Koopman 线性化</p>
            </div>
          </div>

          <div className="bg-slate-900/50 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-300 mb-2">可证伪预测</h4>
            <div className="text-xs text-slate-300 space-y-1">
              <p>1. 在需要泛化的任务上，SLN 应优于同等参数量的标准 Transformer</p>
              <p>2. 惊讶度门控应导致更好的探索-利用平衡（对比纯 RL）</p>
              <p>3. Koopman 层应使长程预测更稳定（对比直接 RNN）</p>
              <p>4. 在分布外检测任务上，惊讶度应作为有效的 OOD 信号</p>
              <p>5. 因果涌现度量 CE 应与任务性能正相关</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
