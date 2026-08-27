---
title: 电池管理系统（BMS）设计：从电芯监控到均衡策略的完整方案
published: 2026-06-21
tags: [BMS, 电池管理, 锂离子电池, SOC估算, 电源管理]
category: 硬件设计
description: 完整讲解锂电池 BMS 的硬件架构、AFE 芯片选型、SOC/SOH 估算算法以及被动/主动均衡策略的工程实现。
---

# 电池管理系统（BMS）设计

## BMS 是什么，为什么重要

锂离子电池是一头**驯服的猛兽**——能量密度极高，但对电压、温度和电流极其敏感。过充 0.2V 可能导致热失控，过放可能导致永久容量损失。

BMS 的职责就是在整个生命周期内守护这头猛兽：
- **保护**：过充、过放、过流、短路、过温
- **均衡**：保持串联电芯之间的电压一致性
- **估算**：SOC（状态 of charge）、SOH（状态 of health）
- **通信**：向上位机报告电池状态

## 硬件架构

典型的分布式 BMS 架构：

```
┌──────────────────────────────────┐
│         BMS 主板（MCU）          │
│  SOC/SOH算法、均衡策略、通信    │
└──────────┬───────────────────────┘
           │ SPI / isoSPI
┌──────────┼──────────┬────────────┐
│  AFE #1  │  AFE #2  │  AFE #3   │
│ 12s 电芯 │ 12s 电芯 │ 12s 电芯  │
└──────────┴──────────┴────────────┘
```

### AFE 芯片选型

| 芯片 | 支持串数 | 特点 |
|------|---------|------|
| BQ76952 | 3-16s | TI 经典方案，成本低 |
| LTC6811 | 12s | ADI 方案，高精度（1.2mV） |
| MC33771 | 7-14s | NXP 方案，内置库仑计 |
| ADBMS1818 | 18s | ADI 最新的第三代方案 |

## SOC 估算：库仑计数 + 开路电压

最实用的 SOC 估算不是复杂的深度学习模型，而是**库仑计数 + OCV 修正**的组合：

$$SOC(t) = SOC(0) - \frac{1}{Q_{nom}} \int_0^t i(\tau) d\tau$$

但库仑计数有累积误差问题。解决方案：

1. 静止条件下用 OCV 查表修正 SOC
2. 充放电末端用电压拐点强制校准
3. 老化补偿：定期更新 $Q_{nom}$

```c
typedef struct {
    float soc;          // 当前 SOC [0, 100]
    float nominal_capacity_ah;  // 标称容量
    float remaining_capacity_ah;
    float ocv_table[21];  // SOC 0%-100% 对应的 OCV，步长 5%
    
    // 库仑计数
    float coulomb_counter_ah;
    uint32_t last_update_tick;
} bms_soc_t;

void bms_update_soc(bms_soc_t *bms, float current_a, float voltage_v, 
                    bool is_relaxed, uint32_t tick_ms) {
    // 库仑计数
    float dt_h = (tick_ms - bms->last_update_tick) / 3600000.0f;
    bms->coulomb_counter_ah += current_a * dt_h;
    bms->soc = (bms->remaining_capacity_ah + bms->coulomb_counter_ah) 
               / bms->nominal_capacity_ah * 100.0f;
    
    // OCV 修正（静止状态）
    if (is_relaxed) {
        float soc_from_ocv = ocv_to_soc(bms->ocv_table, voltage_v);
        bms->soc = 0.95f * bms->soc + 0.05f * soc_from_ocv;
        bms->coulomb_counter_ah = 0;
    }
    
    bms->last_update_tick = tick_ms;
    bms->soc = CLAMP(bms->soc, 0.0f, 100.0f);
}
```

## 均衡策略

### 被动均衡（最常用）

通过并联电阻旁路高电压电芯的能量，转化为热量耗散。典型均衡电流 50-200mA。

- 优点：简单、成本低
- 缺点：能量浪费、均衡功率受限
- 均衡开启条件：$\Delta V_{cell} > 20mV$ 且 $V_{cell} > 3.9V$（只在充电末期均衡）

### 主动均衡

用电感或电容将高电压电芯的能量转移到低电压电芯，效率可达 85-95%。

- 优点：效率高、均衡功率大
- 缺点：成本增加 2-3 倍，控制复杂度高

## SOH 估算

$$SOH = \frac{Q_{actual}}{Q_{nominal}} \times 100\%$$

实际估算通过追踪满充满放的库仑容量变化和直流内阻的上升来实现。

> 做好 BMS 不只是选对芯片和算法的技术问题，更是对各种失效模式有清晰认知的安全意识问题。永远为电池预留足够的设计余量——这是不能妥协的底线。
