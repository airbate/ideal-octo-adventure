---
title: 给 AI 算命装上确定性计算 — Numerologist Skills 项目总览
published: 2026-06-15
tags: [Claude Code, LLM, Prompt Engineering, 奇门遁甲, 紫微斗数, 四柱八字, 传统术数]
category: AI Engineering
description: 把奇门遁甲、紫微斗数、四柱八字三个传统术数系统，拆成可审计、可复用的 Claude Code skill。核心思路：先追问 → 刚性计算外包给脚本 → 解读时固定口径，最大限度减少 LLM 在排盘与流派上的幻觉。
---

# 给 AI 算命装上确定性计算 — Numerologist Skills 项目总览

> 仓库: [github.com/airbate/Numerologist_skills](https://github.com/airbate/Numerologist_skills)

你让 LLM 算一卦奇门遁甲，它回了一段看上去挺像那么回事的解读 —— 但你对照《神奇之门》或者万年历一查，发现阴遁/阳遁反了、值符落宫不对、九星反吟都没看出来。紫微斗数更夸张：同一个生辰，让三个模型跑能给你排出三张本命盘。

这就是「赛博半仙」的天然缺陷：**传统术数的排盘是高度确定的计算过程，但 LLM 没有外挂历法库，只能靠它从训练语料里「拼」出一个看起来对的盘**。越是细节、越是涉及闰月/换日/流派分歧的地方，幻觉越严重。

[Numerologist_skills](https://github.com/airbate/Numerologist_skills) 这个仓库的目的不是让 AI 「更懂玄学」，而是把术数工作中能确定性化的部分从 LLM 里剥离出去，把剩下必须靠语言模型判断的部分约束在固定规则内。

## 仓库长什么样

```
Numerologist_skills/
├── README.md                       # 设计原则、免责声明
├── qimen-dunjia/                   # 奇门遁甲 skill
│   ├── SKILL.md
│   ├── references/                 # 规则集、术语、口径
│   └── scripts/
│       └── qimen_cli.py            # 唯一带脚本的 skill
├── ziwei-doushu/                   # 紫微斗数 skill
│   ├── SKILL.md
│   └── references/                 # 计算 / 星曜 / 四化 / 格局
└── bazi/                           # 四柱八字 skill
    ├── SKILL.md
    └── references/
```

三个 skill 的目录结构是一样的：`SKILL.md` 是给 LLM 看的触发规则和工作流，`references/` 是给 LLM 读的 Markdown 规则集。**只有奇门遁甲多一个 `scripts/` 目录** —— 因为奇门的排盘涉及大量历法与遁甲局数计算，把这些外包给 Python 脚本 + `lunar_python` 库，比让 LLM 自己算可靠得多。

## 三个 skill 各自的边界

### 奇门遁甲 — 唯一走脚本的

奇门遁甲的「盘」是一个 9×9 的活盘，由四盘（天盘/地盘/人盘/神盘）叠成，每盘 9 个位置、每位置 9 个符号（九星/八门/九神/天干），加上阴阳遁、局数、用神、空亡判断……盘面要素接近 200 项。LLM 在训练语料里见过的奇门案例是有限的，让它「心算」一个完整排盘必然出错。

所以奇门 skill 的工作流是**强约束**的：

```yaml
# 摘自 SKILL.md 的总原则
- 默认规则集固定为 mainline-cn-v1,不要在正式排盘路径里混用其他流派
- 正式排盘前必须先访谈
- 固定计算一律调用 scripts/qimen_cli.py
- 不展示完整推理链,只展示关键依据和必要计算结果
```

CLI 本身是一个 Python 脚本（依赖 `lunar_python` + `tzdata`）：

```bash
pip install -r qimen-dunjia/scripts/requirements.txt
python qimen-dunjia/scripts/qimen_cli.py \
    --input tmp/qimen_input.json \
    --output tmp/qimen_output.json
```

输入是结构化的「事 + 时」，输出是结构化的「盘」。LLM 只负责把用户的话转成 input JSON、读懂 output JSON 做解读。**排盘本身的正确性由代码保证，不由 LLM 保证**。

### 紫微斗数 — references 驱动的纯规则约束

紫微斗数没有外挂 CLI（仓库里目前是这样），因为它的星曜安星规则相对简单，但**流派分歧极大**（三合派、飞星派、奇门派对四化和格局的判断不完全一致）。所以紫微 skill 把所有判断逻辑都写进 references：

- `references/calculation.md` — 安星规则、宫位起法
- `references/stars.md` — 14 主星 + 辅星的性质
- `references/sihua.md` — 四化飞星规则
- `references/patterns.md` — 格局判断

SKILL.md 里明确写「默认采用主流三合派排盘口径，并吸收飞星派在四化分析上的实用方法」 —— **口径先声明，再做结论**。

### 四柱八字 — 经典文本 + Prompt 模板

八字 skill 的 references 比较薄（`prompt-template.md` + `tiangan-dizhi.md`），但 SKILL.md 明确要 LLM 综合参考《穷通宝鉴》《三命通会》《滴天髓》《渊海子平》《千里命稿》《协纪辨方书》《果老星宗》《子平真诠》《神峰通考》九本书的体系 —— 等于给 LLM 一个**古籍索引**，让它的解读能落在传统命理的口径内。

## 四条设计原则

从 README 提炼出来，贯穿三个 skill：

1. **先追问，再输出** — 信息不全时优先补参数，不硬排盘。用户说「给我算一卦」是不够的，必须先确认「算什么 / 哪一刻 / 想判断什么」。
2. **确定性计算外包** — 凡是历法换算、固定排盘、结构化计算，交给脚本或可信排盘结果，不让 LLM 算。
3. **先声明口径，再做结论** — 流派、换日规则、闰月归属、默认规则都要说清楚。同一件事三合派和飞星派结论可能不同，必须告诉用户「我用的是哪个口径」。
4. **只给结构化参考** — 健康、法律、财务等高风险场景不替代现实专业建议。

第三条是最容易被一般「AI 算命」产品忽略的：不给口径只给结论的解读，本质上是「凭感觉说话」。

## 为什么这个项目值得做

大多数 AI 算命产品的做法是：

> 微调 / Prompt 工程 + 知识库 RAG → 让模型「更像」算命大师

Numerologist_skills 的做法相反：

> 把能确定的部分从模型里拿走 → 让模型只能在其能确定的部分工作

这跟软件工程里「把不可控的代码隔离在最小范围内」是同一个逻辑。当 LLM 必须做某件事（解读盘面、解释术语、给出建议）时，给它：

- 准确的输入（脚本算出的盘）
- 准确的边界（references 里的规则集）
- 准确的约束（SKILL.md 里的触发条件和输出格式）

它的幻觉率会显著下降 —— 不是因为模型变聪明了，而是因为**留给它「猜」的空间被压缩了**。

## 谁会用这个

三种人：

1. **AI 应用开发者** — 想做玄学类 AI 产品但担心「胡说八道」翻车的。直接 fork 这个仓库改 prompt。
2. **命理研究者** — 想用 LLM 辅助查盘、解盘，但需要保证排盘准确。
3. **Prompt 工程学习者** — 这是个相当完整的「prompt + 规则 + 工具调用」组合案例，可以当教学样本看。

## 局限性

老实说：

- **紫微/八字没有外挂计算**。它们的排盘规则虽然简单但案例数据远没有奇门多，LLM 在一些冷门组合上还是会出现星曜错位。需要进一步做 CLI 化。
- **大运流年的逐年推进** 紫微和八字都还没做完，需要一个时间维度的脚本。
- **可视化**：仓库根目录有一个 42KB 的 `20260325-AI术数工程化-可视化.html`，是早期的可视化原型，但没有纳入主流程。

## 后续计划

- 把紫微和八字的排盘也用 Python 脚本化，至少做本命盘那部分
- 加一个统一的「排盘 → 解读」工作流，把三个 skill 串起来
- 尝试把 references 里的一部分规则固化为可单测的判定函数（given 命盘 → 命中哪些格局），让 SKILL.md 真的能跑回归测试

—— 如果你对其中任何一个方向有兴趣，欢迎在仓库开 issue 或者直接 PR。

## Disclaimer

跟仓库本身一样：本文内容用于传统术数的工程化表达与 AI 约束实验，**不构成医疗、法律、财务或其他现实决策建议**。术数呈现的是倾向、结构、课题与机会，不是绝对命定。

—— 完。