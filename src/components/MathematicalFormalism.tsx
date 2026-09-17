import { useState } from 'react';

export default function MathematicalFormalism() {
  const [activeSection, setActiveSection] = useState(0);

  const sections = [
    {
      title: '公设体系',
      content: `
**公设 1（高维线性公设）**：设系统约束方程为 S: ℝ^∞ → ℝ^∞，根据 Cover 定理，
当维度 d → ∞ 时，任意有界模式分类问题线性可分的概率 P(d, N) → 1。
因此，S 在充分高维空间中可近似为线性算子：

    S(x) ≈ Ax + b,  其中 A ∈ ℝ^(∞×∞), b ∈ ℝ^∞

**公设 2（环境投影公设）**：环境 E 同样是无穷维约束方程。
外部输入 I 是 E 在有限维子空间上的投影：

    I(t) = Π_d[E(x(t))] + η(t)

其中 Π_d: ℝ^∞ → ℝ^d 为正交投影，η(t) 为投影噪声。

**公设 3（惊讶度区间公设）**：存在 ε_min > 0 和 ε_max > ε_min，使得
耦合成功的充要条件为：

    ε_min ≤ ε(t) = D_KL[P(t) || S] ≤ ε_max

（修正 Friston：ε 不可为零，零惊讶度意味着系统完全封闭，失去学习能力）
      `,
    },
    {
      title: 'S1-S2: 输入与感知',
      content: `
**S1 输入方程**：

    I(t) = Π_d ∘ E(x(t)) ∈ ℝ^d

维度 d ≪ ∞，输入是环境的低维投影。

**S2 感知方程**（核耦合）：

    P(t) = K[I ⊗ S] = ∫∫ k(i, s) · I(i) · S(s) di ds

其中 k(·,·) 为核函数（推荐高斯核或卷积核），⊗ 表示张量耦合。

等价地，在 RKHS 中：

    P(t) = ⟨Φ(I(t)), Φ(S)⟩_H

其中 Φ: ℝ^d → H 为核特征映射，H 为再生核希尔伯特空间。

**惊讶度计算**：

    ε(t) = D_KL[P(t) || S] = ∫ P(t) log[P(t)/S] dt

**耦合成功条件**：

    ε_min ≤ ε(t) ≤ ε_max

当 ε > ε_max 时，触发递归降阶策略（见后文）。
      `,
    },
    {
      title: 'S3-S4: 干预与抽象',
      content: `
**S3 输出方程**（升维）：

    O(t) = Φ↑_d→d'[P(t)]

其中 Φ↑ 为升维映射，d' > d，恢复行动空间维度。
升维映射通过伪逆或学习到的解码器实现：

    Φ↑ = argmin_Ψ ||Ψ(P) - I||² + λ·Reg(Ψ)

**S4 半统合方程**（进一步升维）：

    U(t) = Ψ↑_d'→D[O(t)],  D > d' > d

泛化条件（可通约度约束）：

    Comm(U) = min_{x ∈ X_test} sim(U(x), U_true(x)) ≥ θ

其中 θ 为泛化阈值，X_test 为测试域。

**知识的诅咒定量表达**：

    Bias_KC = ||U_local - U_global|| / ||U_global||

其中 U_local 仅统合近邻经验，U_global 为全局最优统合。
当 Bias_KC 过大时，系统陷入"专家盲区"。
      `,
    },
    {
      title: 'S5: 再线性化与解耦',
      content: `
**Koopman 升维线性化**：

设非线性动力学 x_{t+1} = F(x_t)，Koopman 算子 K 作用于观测量 g：

    [Kg](x) = g(F(x))

在有限维近似中，选择基函数 {g₁, g₂, ..., g_N}：

    G(x[t+1]) ≈ K̃ · G(x[t])

其中 G = [g₁, ..., g_N]^T，K̃ ∈ ℝ^(N×N) 为有限维 Koopman 矩阵。

**解耦更新**（量子退相干类比）：

    S'(x) = S(x) + α · ∫[K̃ · U(t)] dμ(t) - β · Decoh(S, E_ext)

其中 Decoh 为退相干项，引入外部环境信息 E_ext 完备系统。

**因果涌现度量**：

    CE = C_eff(S') - C_eff(S)

其中 C_eff 为有效信息（Effective Information, Hoel 2017）：

    C_eff(M) = I(X_{t+1}; X_t) | do(X_t ~ Uniform)

当 CE > 0 时，宏观描述具有更强的因果效力——即因果涌现发生。
      `,
    },
    {
      title: '可通约度与四象限',
      content: `
**可通约度定义**（Commensurability）：

    C(t) = 1 - H_rel(S_t || S_∞)

其中 H_rel 为相对熵的归一化形式，S_∞ 为理想约束方程。
C ∈ [0, 1]，C 越高表示越接近"纯粹理性"（不受经验局限）。

**四象限动力学**：

设状态为 (H, C)，其中 H 为系统熵，C 为可通约度。

    Q1 (初始): H = H_max, C = C_max  — 高熵高可通约（无知但开放）
    Q2 (S2-S3): H = H_max, C < C_max — 高熵低可通约（感知但受限）
    Q3 (S4):    H < H_max, C < C_max — 低熵低可通约（有序但偏狭）
    Q4 (S5):    H < H_max, C → C_max — 低熵高可通约（智慧且通达）

**象限转移方程**：

    dH/dt = -γ · ε(t) + σ · ξ(t)     （熵减但含随机扰动）
    dC/dt = f(stage) · (C_max - C)    （可通约度恢复）

其中 f(S1-S2) < 0, f(S3) ≈ 0, f(S4) < 0, f(S5) > 0。

**"熵的熵增定律"**：

    d²S_universe/dt² > 0

为追求系统内部有序（-dH_system），需加速外部无序化（+dH_env），
且 dH_env/dt 的增长速率本身也在增长。
      `,
    },
    {
      title: '递归自迭代与 SOC',
      content: `
**递归降阶策略**（当 ε > ε_max 时）：

Step 0: 不直接处理原始输入 I(t)，而是构造简化输入：

    I₀(t) = R[I(t)]  其中 R 为降复杂度的正则化算子

Step k: 在第 k 步，系统处于自组织临界态：

    P(Δx) ~ Δx^(-τ)  其中 τ ≈ 1.5（Bak-Tang 幂律指数）

Step k+1: 迭代更新：

    I_{k+1}(t) = I_k(t) + α_k · ∇_I L(I_k, S)

其中 α_k ~ k^(-δ) 为学习率衰减，δ ∈ (0.5, 1)。

**子系统自迭代**：

将系统划分为 {S₁, S₂, ..., S_n} 个相对独立的紧致化子系统。
两两交互：

    S_i^{t+1} = S_i^t + Σ_j K_ij[S_i^t, S_j^t]

经过 M 轮循环后合并：

    S^{t+M} = Merge({S_i^{t+M}}) + Feedback(S^{t+M}, E)

**完备性保证**（Gödel 约束）：

根据 Gödel 第二不完备定理，此自迭代过程无法证明自身的一致性。
但可以通过引入外部参照系（类比 Turing oracle）来部分完备：

    Completeness(S) = 1 - |Gödel(S)| / |S_total|

其中 Gödel(S) 为系统内不可判定的命题集合。
      `,
    },
    {
      title: 'Calabi-Yau 同构',
      content: `
**紧致化类比**：

在弦论中，10维时空 = 4维宏观时空 × 6维 Calabi-Yau 流形。
类比到本框架：

    认知空间 = 可观测维度(d) × 隐式认知维度(6n)

**S2-S3 的临时紧致化**：

    M_temp = M_d × CY_n(temp)

新维度是临时的，用于当前任务的降维处理。
任务完成后，这些维度可以被"展开"（decompactification）。

**S4 的永久紧致化**：

    M_perm = M_d × CY_n(perm)

永久维度代表内化的认知结构，成为系统的一部分。
类似于物理中紧致化后的额外维度决定了低能物理的粒子谱。

**S5 的反紧致化**：

    M_final = M_{d+k}  其中 k 为新释放的维度数

将紧致维度释放回宏观空间，增加系统的可观测维度。
这对应于认知中的"顿悟"——突然看到了新的维度。

**同构映射**（非生搬硬套）：

    CY 的 Euler 特征 χ ↔ 认知系统的拓扑不变量
    CY 的 Hodge 数 h^{p,q} ↔ 不同层次的认知结构
    模空间 ↔ 认知状态的可能配置空间
    镜像对称 ↔ 不同认知路径的等价性
      `,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-purple-500/20">
        <h2 className="text-xl font-bold text-purple-300 mb-2">SDL-CF 数学形式化</h2>
        <p className="text-slate-400 text-sm">
          以下给出螺旋升维认知框架的完整数学表述。每个公设、定义和定理都经过严格的数学语言描述。
        </p>
      </div>

      {/* Section tabs */}
      <div className="flex flex-wrap gap-2">
        {sections.map((section, i) => (
          <button
            key={i}
            onClick={() => setActiveSection(i)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeSection === i
                ? 'bg-purple-600/40 text-purple-200'
                : 'text-slate-400 hover:text-slate-200 bg-slate-800/50'
            }`}
          >
            {section.title}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-purple-500/20">
        <h3 className="text-lg font-bold text-cyan-300 mb-4">{sections[activeSection].title}</h3>
        <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono leading-relaxed overflow-x-auto">
          {sections[activeSection].content}
        </pre>
      </div>

      {/* Summary equations */}
      <div className="bg-gradient-to-r from-purple-900/30 to-cyan-900/30 rounded-2xl p-6 border border-purple-500/20">
        <h3 className="text-lg font-bold text-purple-300 mb-4">核心方程汇总</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="bg-slate-900/50 rounded-lg p-4">
            <p className="text-yellow-300 font-mono mb-1">输入方程</p>
            <p className="text-slate-300 font-mono">I(t) = Π_d[E(x(t))] + η(t)</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-4">
            <p className="text-yellow-300 font-mono mb-1">感知方程（核耦合）</p>
            <p className="text-slate-300 font-mono">P(t) = ⟨Φ(I), Φ(S)⟩_H</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-4">
            <p className="text-yellow-300 font-mono mb-1">惊讶度约束</p>
            <p className="text-slate-300 font-mono">ε_min ≤ D_KL[P||S] ≤ ε_max</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-4">
            <p className="text-yellow-300 font-mono mb-1">输出方程（升维）</p>
            <p className="text-slate-300 font-mono">O(t) = Φ↑[P(t)], dim(O) &gt; dim(P)</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-4">
            <p className="text-yellow-300 font-mono mb-1">Koopman 线性化</p>
            <p className="text-slate-300 font-mono">G(x[t+1]) ≈ K̃ · G(x[t])</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-4">
            <p className="text-yellow-300 font-mono mb-1">因果涌现</p>
            <p className="text-slate-300 font-mono">CE = C_eff(S') - C_eff(S) &gt; 0</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-4">
            <p className="text-yellow-300 font-mono mb-1">可通约度</p>
            <p className="text-slate-300 font-mono">C(t) = 1 - H_rel(S_t || S_∞)</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-4">
            <p className="text-yellow-300 font-mono mb-1">SOC 幂律</p>
            <p className="text-slate-300 font-mono">P(Δx) ~ Δx^(-τ), τ ≈ 1.5</p>
          </div>
        </div>
      </div>
    </div>
  );
}
