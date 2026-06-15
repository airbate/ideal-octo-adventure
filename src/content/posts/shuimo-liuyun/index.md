---
title: 水墨流韵 — 在浏览器里重建宣纸上的水与墨
published: 2026-06-14
tags: [WebGL, GLSL, Stable Fluids, 流体模拟, 艺术, Shader]
category: 可视化与图形
description: 用 Stam 的 Stable Fluids 算法 + Beer-Lambert 吸光度模型，在单文件 HTML 里复刻「水墨流韵」水拓丹青站点。9 个 GLSL 着色器、5 种传统墨色、宣纸纹理、漆扇导出。
---

# 水墨流韵 — 在浏览器里重建宣纸上的水与墨

> Demo: [shuimo-liuyun.vercel.app](https://shuimo-liuyun.vercel.app)
> 源码: [github.com/airbate/shuimo-liuyun](https://github.com/airbate/shuimo-liuyun)

最近花了几天复刻了 [shuimo-liuyun.vercel.app](https://shuimo-liuyun.vercel.app) 这个站点：一整张宣纸铺满全屏，指尖划过的地方会洇开墨色，可以选 5 种传统墨色（玄墨/黛青/朱砂/竹青/藤黄），或者让颜色按时间轮转；闲置时画面会自己滴墨、起暗流；点 `Wash` 把宣纸洗干净；点 `Make Fan` 把当前的水面墨纹拓到一把折扇上并导出 PNG。

整站只有一个 `index.html`，零依赖。我把它逐字搬运、做了英文/中英双语版，下面是技术解剖。

## 核心算法：Stable Fluids

流体不是粒子系统，而是 **Stam 1999 年那篇 Stable Fluids** 的 WebGL 实现。每帧做这几件事：

1. **涡度增强 (Vorticity confinement)** — 让小尺度的漩涡被强制保留，否则水会过快失去细节。
2. **求散度 (Divergence)** — 计算速度场的散度。
3. **解压力 (Pressure projection, 26 次迭代)** — 通过反复解泊松方程，把速度场投影成无散场（这一步是流体"看起来像水"的关键）。
4. **梯度回减 (Gradient subtraction)** — 减去压力梯度，得到不可压的速度场。
5. **半拉格朗日平流 (Semi-Lagrangian advection)** — 把每个像素的速度采样回去，找上一帧对应位置的颜色/速度带过来。

每一步都对应一个 GLSL 片元着色器，加上 `copy / fade / splat` 三个工具着色器，共 10 个。

## 9 个着色器，一张图说清

```
                         ┌─────────────────────┐
   velocity ───────────► │ curl               │ ──► curl FBO
                         └─────────────────────┘
                                │
                                ▼
                         ┌─────────────────────┐
   curl + velocity ────► │ vorticity          │ ──► velocity'
                         └─────────────────────┘
                                │
                                ▼
                         ┌─────────────────────┐
   velocity' ──────────► │ divergence         │ ──► divergence FBO
                         └─────────────────────┘
                                │
                                ▼
   pressure (fade 0.8) ─┐
   divergence ─────────┼─►│ pressure (× 26)   │ ──► pressure'
                       └─ └─────────────────────┘
                                │
                                ▼
                         ┌─────────────────────┐
   pressure' + vel ────► │ gradient subtract  │ ──► velocity''
                         └─────────────────────┘
                                │
                                ▼
                         ┌─────────────────────┐
   velocity'' + vel ──► │ advect (velocity)  │ ──► velocity'''
                         └─────────────────────┘
                                │
                                ▼
                         ┌─────────────────────┐
   velocity''' + dye ──►│ advect (dye)       │ ──► dye'
                         └─────────────────────┘
                                │
                                ▼
                         ┌─────────────────────┐
   dye' ───────────────► │ display            │ ──► 屏幕
                         │  paper × exp(-A)   │
                         │  + hash grain      │
                         │  + fiber           │
                         │  + 暗角            │
                         └─────────────────────┘
```

## 一个反直觉的设计：颜色场不是 RGB，是吸光度

大多数人写流体时会把颜色存在 `vec3 dye` 里加法混合（`dye += inkColor`），但墨水不是「往水里加颜料」，而是「光被吸收得更多」。所以这里用 **Beer-Lambert 定律**：

```glsl
A = -log(max(color, ε)) * strength    // JavaScript 端预算好塞进 texture
// 显示时：
vec3 outColor = paper * exp(-A);
```

- `paper = vec3(0.949, 0.925, 0.875)` — 宣纸 RGB
- 累积字段 `A` 是「吸光度」，墨越浓 `A` 越大，`exp(-A)` 越小
- 显示成 `paper × exp(-A)`，自然就是减法混色，多层墨色叠加不会爆白

落笔时的 `strength = 0.85`，划过时 `0.34`，悬停拨水只 `splatVelocity` 不落墨。这三个参数直接决定手感。

## 5 种传统墨色，不是随意的 RGB

```js
const INKS = {
  mo:   [0x1c/255, 0x1c/255, 0x22/255],  // 玄墨 — 几乎黑
  dai:  [0x1c/255, 0x4b/255, 0x7d/255],  // 黛青 — 青蓝
  zhu:  [0xc2/255, 0x3b/255, 0x2e/255],  // 朱砂 — 中国红
  zhuq: [0x3a/255, 0x7d/255, 0x5d/255],  // 竹青 — 草绿偏冷
  teng: [0xc9/255, 0x94/255, 0x1a/255],  // 藤黄 — 暖黄
};
```

每一种都用 `radial-gradient` 渲成 3D 圆球 button（`ink-mo / ink-dai / ink-zhu / ink-zhuq / ink-teng`），点击切换时 CSS 用 `transform: scale(1.18)` 弹性放大。还有个 `lun` 轮转模式，每帧在 5 色之间用 `lerp3` 插值：

```js
function pickColor() {
  if (currentInk !== 'lun') return INKS[currentInk];
  const t = (cycleT % 1) * INK_KEYS.length;
  const i = Math.floor(t) % n, j = (i + 1) % n;
  return lerp3(INKS[INK_KEYS[i]], INKS[INK_KEYS[j]], t - i);
}
```

## 半浮点纹理与 WebGL 兼容回退

整个流体引擎依赖 `HALF_FLOAT` 渲染能力。WebGL 2 默认支持；WebGL 1 需要 `OES_texture_half_float` + `OES_texture_half_float_linear` 两个扩展，并且浮点纹理是否能 `framebufferTexture2D` 是逐设备检测的——所以代码里有一段 `renderable()` 测试，从 `RG16F → RGBA16F → RGBA` 自动降级。

```js
const HALF_FLOAT = isWebGL2 ? gl.HALF_FLOAT : halfFloat.HALF_FLOAT_OES;
function renderable(internal, format) {
  // 创 4×4 纹理，绑 FBO，checkFramebufferStatus
}
```

`MANUAL_FILTERING` 宏也走类似逻辑：如果不支持线性过滤，就自己写 `bilerp(sampler, uv, tsize)` 在片元着色器里做双线性插值（advect 时坐标不是整数像素，必须插值）。

## 宣纸纹理：把 noise 写进 shader

最后一道工序是 `FRAG_DISPLAY`，把墨色场画到屏幕上，同时叠上纸的质感：

```glsl
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
void main() {
  vec3 A = texture2D(uDye, vUv).rgb;
  vec3 col = paper * exp(-A);
  float grain = (hash(vUv * res) - 0.5) * 0.018;
  float fiber = (hash(floor(vUv * res * vec2(0.5, 3.0))) - 0.5) * 0.008;
  col += grain + fiber;
  vec2 d = vUv * (1.0 - vUv);
  float vig = smoothstep(0.0, 0.06, min(d.x, d.y) * 2.2);
  col *= mix(0.96, 1.0, vig);  // 四周淡淡晕染
}
```

- `grain` 是高频颗粒感，`fiber` 是横长竖短的纤维
- 四周 `smoothstep` 暗角模拟宣纸边缘的光线衰减

## 漆扇：把当前帧画进扇形

`Make Fan` 按钮触发后：

1. 给当前 canvas 强制 `render()` 一帧拿到最新图像
2. 在另一个 `<canvas id="fanCanvas">` 上：
   - `arc(cx, cy, R, a0, a1)` + `arc(cx, cy, r, a1, a0, true)` 构造扇形路径
   - `clip()` 后 `drawImage(canvas, ...)` 把主 canvas 用 `cover` 模式贴进去
   - 加一层 `linear-gradient` 模拟清漆光泽
   - 画 13 根扇骨（`a0` 到 `a1` 等分），两侧粗中间细
   - 画扇钉 + 高光
   - 在扇面右下角盖一个 44px 的「墨韵」朱文圆角印章

`Save Fan` 直接 `canvas.toDataURL('image/png')` 下载。完整一段 `drawFan()` 函数约 80 行。

## 一些性能取舍

- **SIM_RES=256 / DYE_RES=1280**：速度场分辨率低、墨色场分辨率高。流体宏观特征稳定，微观墨纹保持锐利。
- **DPR ≤ 2**：4K 屏 + retina 设备 canvas 会拉到 5120×2880，墨色场相应放大。`Math.min(devicePixelRatio, 2)` 卡住，避免部分 Android 设备爆显存。
- **PRESSURE_ITER=26**：26 次 Jacobi 迭代是质量与性能折中点。再高肉眼难辨，再低墨色会"压"出网格状伪影。

## 总结

一整份 950 行的 `index.html`，90 行 CSS、160 行 GLSL、剩下都是 JavaScript 胶水。把它拆出来看，本质上就是：

1. **2 个 ping-pong FBO**（velocity + dye）每帧乒乓读写
2. **每帧固定顺序的 9 道工序**，把流体从不可压变成视觉上像水
3. **最后一道工序用 Beer-Lambert + hash noise 把场渲染成宣纸**
4. **漆扇是后期合成**：路径 + drawImage + 装饰

如果你也对 WebGL 流体感兴趣，Pavel Dobryakov 的 [WebGL-Fluid-Simulation](https://github.com/PavelDoGreat/WebGL-Fluid-Simulation) 是这个领域最经典的参考实现，本文的所有着色器骨架都源自他的工作，原站也是基于它做的东方化改造。我做的是英文化、本地化、单文件零依赖版本。

—— 完。