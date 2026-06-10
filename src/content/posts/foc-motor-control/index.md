---
title: 永磁同步电机 FOC 控制：从 Clarke-Park 变换到电流环整定
published: 2025-08-12
tags: [FOC, 电机控制, PMSM, 矢量控制, 电流环]
category: 机器人
description: 深入解析磁场定向控制（FOC）的数学原理与工程实现，涵盖 Clarke/Park 变换、SVPWM 调制和 PI 电流环参数整定方法。
---

# 永磁同步电机 FOC 控制详解

## 为什么 FOC 是电机控制的黄金标准

永磁同步电机（PMSM）本质上是一个**强耦合、非线性、多变量**系统。三相定子电流通过磁场相互作用产生转矩，但三相之间并非独立。

FOC（Field-Oriented Control）的核心思想是用数学变换将这个复杂的三相交流系统**解耦**成一个等效的直流电机模型——直轴电流 $i_d$ 控制磁场，交轴电流 $i_q$ 控制转矩，两者正交，互不干扰。

## Clarke 变换：三相静止 → 两相静止

$$i_{\alpha} = i_a$$
$$i_{\beta} = \frac{1}{\sqrt{3}}(i_a + 2i_b)$$

在嵌入式 C 实现中，$i_c = -(i_a + i_b)$（基尔霍夫电流定律），因此只需要两路 ADC 采样。

```c
void clarke_transform(float ia, float ib, float *i_alpha, float *i_beta) {
    *i_alpha = ia;
    *i_beta = (ia + 2.0f * ib) * 0.577350269f;  // 1/sqrt(3)
}
```

## Park 变换：两相静止 → 旋转坐标系

$$\begin{bmatrix} i_d \\ i_q \end{bmatrix} = \begin{bmatrix} \cos\theta & \sin\theta \\ -\sin\theta & \cos\theta \end{bmatrix} \begin{bmatrix} i_{\alpha} \\ i_{\beta} \end{bmatrix}$$

这是整个 FOC 中最美的部分：经过 Park 变换后，正弦变化的 $i_\alpha$、$i_\beta$ 变成了直流量 $i_d$、$i_q$。

## SVPWM：比 SPWM 高 15.5% 的电压利用率

空间矢量 PWM 通过合成 6 个基本矢量和 2 个零矢量来逼近任意方向和大小的电压矢量：

```
扇区判断 → 相邻矢量作用时间计算 → 七段式 PWM 波形生成
```

七段式 SVPWM 的开关序列设计使得每次切换只变动一个桥臂，开关损耗最小：

```
扇区 I: 000-100-110-111-110-100-000  (七段)
```

## 电流环 PI 参数整定

FOC 最内环是电流环——它决定了整个系统的带宽和稳定性。对于 PMSM 的 d/q 轴模型，电流环的开环传递函数为：

$$G_{OL}(s) = \frac{K_p s + K_i}{s} \cdot \frac{1}{L s + R}$$

采用零极点对消法，设 $K_p / K_i = L / R$，则闭环传递函数简化为一阶：

$$G_{CL}(s) = \frac{\omega_b}{s + \omega_b}, \quad \omega_b = \frac{K_p}{L}$$

工程调参步骤：

1. 测量相电阻 R 和相电感 L（LCR 表或通过阶跃响应辨识）
2. 设定目标带宽 $\omega_b$（通常为 PWM 频率的 1/20 到 1/10）
3. $K_p = \omega_b \cdot L$，$K_i = \omega_b \cdot R$

```c
typedef struct {
    float kp, ki;
    float integral;
    float integral_max;
    float output_max;
} pi_controller_t;

float pi_update(pi_controller_t *pi, float setpoint, float feedback, float dt) {
    float error = setpoint - feedback;

    // 积分分离：大误差时只用 P
    if (fabsf(error) > pi->output_max * 0.3f) {
        pi->integral *= 0.9f;  // 缓慢衰减
    } else {
        pi->integral += error * dt;
    }

    // 积分限幅（抗饱和）
    if (pi->integral > pi->integral_max) pi->integral = pi->integral_max;
    if (pi->integral < -pi->integral_max) pi->integral = -pi->integral_max;

    float output = pi->kp * error + pi->ki * pi->integral;

    // 输出限幅
    if (output > pi->output_max) output = pi->output_max;
    if (output < -pi->output_max) output = -pi->output_max;

    return output;
}
```

## 无传感器 FOC：滑模观测器

对于低成本应用（无编码器），滑模观测器通过反电动势估计转子位置：

- **优势**：无需位置传感器，硬件成本降低
- **挑战**：零速和低速下反电动势太小，需要高频注入法配合
- **实用方案**：开环启动至 5%-10% 额定转速后切换到闭环观测器

> FOC 是电机控制的"内功"——把 Clarke、Park、SVPWM、PI 整定这套基本功练扎实了，再去学无传感器、弱磁、MTPA 等高级技巧，就都是锦上添花了。
