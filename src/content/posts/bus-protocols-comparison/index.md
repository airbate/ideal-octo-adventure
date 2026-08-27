---
title: I2C、SPI、UART 总线协议深度对比：选型不再犹豫
published: 2026-07-17
tags: [I2C, SPI, UART, 通信协议, 嵌入式, 总线]
category: 嵌入式系统
description: 从物理层到协议层的全方位对比 I2C、SPI、UART 三大嵌入式总线协议，包含时序分析、实际波形案例和选型决策树。
---

# I2C、SPI、UART 总线协议深度对比

## 三张时序图看懂三种协议

在示波器上看这三种协议的波形，差别一目了然：

**UART**：一根线（TX 或 RX），无时钟线。靠双方约定的波特率同步：
```
Start(D0) D1 D2 D3 D4 D5 D6 D7 Stop
  ─┐   ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌───
   └───┘ └─┘ └─┘ └─┘ └─┘ └─┘ └─┘ └─┘
```

**SPI**：四线制（至少三线），主设备产生时钟：
```
SCLK: ─┐  ┌┐  ┌┐  ┌┐  ┌┐  ┌┐  ┌┐  ┌┐  ┌─
MOSI: ──X──X──X──X──X──X──X──X──X─────────
MISO: ──X──X──X──X──X──X──X──X──X─────────
CS:   ──┘                                   └─
```

**I2C**：两线制，带 ACK 确认：
```
SCL: ─┐  ┌┐  ┌┐  ┌┐  ┌┐  ┌┐  ┌┐  ┌┐  ┌┐  ┌─
SDA:   X──X──X──X──X──X──X──X──X──X──X──X──
     Start  A6 A5 A4 A3 A2 A1 A0 R/W ACK
```

## 全方位对比

| 维度 | UART | SPI | I2C |
|------|------|-----|-----|
| 信号线数 | 2 (TX,RX) | 3+MISO (≥4) | 2 (SDA,SCL) |
| 最大速率 | ~5 Mbps | ~50 MHz+ | 100k/400k/1M/3.4M |
| 拓扑 | 点对点 | 多从机（CS 选择） | 多主多从（地址） |
| 全双工 | 是 | 是 | 否（半双工） |
| 硬件复杂度 | 低 | 低（无协议开销） | 中（地址/ACK） |
| 距离 | 长（RS232→15m） | 短（PCB 级别） | 中（< 1m 板间） |
| 流控 | 软件 XON/XOFF | 无（靠 CS 管理） | 内置 ACK/NACK |

## I2C 的坑与实战

### 使能 I2C 的上拉电阻

这是 I2C 最高频的硬件错误。I2C 使用开漏输出，必须外部上拉：

$$R_{pull-up(min)} = \frac{V_{DD} - V_{OL(max)}}{I_{OL}}$$

$$R_{pull-up(max)} = \frac{t_r}{0.8473 \times C_{bus}}$$

对于 3.3V、400kHz、总线电容 100pF 的典型场景，上拉电阻约为 2.2kΩ。

### 总线死锁自救

I2C 从机有时会"卡住"——把 SDA 拉低不放。软件恢复方法：

```c
void i2c_recover(I2C_HandleTypeDef *hi2c) {
    GPIO_InitTypeDef gpio = {0};
    gpio.Pin = SDA_PIN | SCL_PIN;
    gpio.Mode = GPIO_MODE_OUTPUT_OD;
    gpio.Speed = GPIO_SPEED_FREQ_HIGH;
    HAL_I2C_DeInit(hi2c);
    HAL_GPIO_Init(GPIOB, &gpio);
    
    // 发送最多 9 个 SCL 脉冲，直到 SDA 被释放
    for (int i = 0; i < 9; i++) {
        HAL_GPIO_WritePin(GPIOB, SCL_PIN, GPIO_PIN_RESET);
        delay_us(5);
        HAL_GPIO_WritePin(GPIOB, SCL_PIN, GPIO_PIN_SET);
        delay_us(5);
        if (HAL_GPIO_ReadPin(GPIOB, SDA_PIN)) break;
    }
    // 发送 STOP 条件
    // ... 然后重新初始化 I2C 外设
}
```

## SPI 模式配置对照

SPI 有 4 种模式，由 CPOL（时钟极性）和 CPHA（时钟相位）决定——这是初学 SPI 时最容易搞混的配置：

| 模式 | CPOL | CPHA | 空闲时钟 | 采样沿 |
|------|------|------|---------|-------|
| 0 | 0 | 0 | 低 | 上升沿 |
| 1 | 0 | 1 | 低 | 下降沿 |
| 2 | 1 | 0 | 高 | 下降沿 |
| 3 | 1 | 1 | 高 | 上升沿 |

**90% 的设备用模式 0 或模式 3**。如果通信不上，第一个检查的就是 SPI 模式是否匹配。

## 选型决策树

```
需要多设备（>2）共享总线？
├── 是 → 需要高速（>1Mbps）？
│        ├── 是 → SPI（每设备一个 CS 引脚）
│        └── 否 → I2C（2 线搞定）
└── 否 → 距离 > PCB？
         ├── 是 → UART（RS485可达1km）
         └── 否 → SPI（最简单、最快）
```

> 没有完美的总线协议，只有最适合你当前约束的方案。数信号线、算数据率、看拓扑结构——选型从来不是靠背参数表，而是搞清楚你的工程约束是什么。
