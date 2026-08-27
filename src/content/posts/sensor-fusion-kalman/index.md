---
title: 传感器融合实战：卡尔曼滤波从数学推导到嵌入式 C 实现
published: 2026-08-03
tags: [传感器融合, 卡尔曼滤波, 姿态解算, IMU, 嵌入式算法]
category: 信号处理
description: 从贝叶斯滤波到卡尔曼滤波的完整推导，给出在 STM32 上运行的四元数姿态估计 C 语言实现。
---

# 传感器融合实战：卡尔曼滤波与姿态解算

## 传感器融合为什么必要

任何一个做过无人机或平衡车的人都会告诉你：**单一传感器不可靠**。

- **加速度计**：静态准，动态时混入运动加速度
- **陀螺仪**：短期准，长期有积分漂移
- **磁力计**：绝对方向参考，但极易受电机和金属结构干扰

传感器融合的本质是用算法的确定性对抗物理世界的随机性。

## 卡尔曼滤波的贝叶斯直觉

卡尔曼滤波的核心是一个**预测-更新**循环：

$$
\underbrace{p(x_k | z_{1:k-1})}_{\text{先验}} = 
\int p(x_k | x_{k-1}) \cdot 
\underbrace{p(x_{k-1} | z_{1:k-1})}_{\text{上一时刻后验}} dx_{k-1}
$$

$$
\underbrace{p(x_k | z_{1:k})}_{\text{后验}} \propto 
\underbrace{p(z_k | x_k)}_{\text{似然}} \cdot 
\underbrace{p(x_k | z_{1:k-1})}_{\text{先验}}
$$

加上**线性高斯假设**，这就退化成了我们能在大一数学课上推出来的五个经典公式。

## 标准卡尔曼滤波五公式

### 预测步

状态预测：$\hat{x}_{k|k-1} = F_k \hat{x}_{k-1|k-1} + B_k u_k$

协方差预测：$P_{k|k-1} = F_k P_{k-1|k-1} F_k^T + Q_k$

### 更新步

卡尔曼增益：$K_k = P_{k|k-1} H_k^T (H_k P_{k|k-1} H_k^T + R_k)^{-1}$

状态更新：$\hat{x}_{k|k} = \hat{x}_{k|k-1} + K_k (z_k - H_k \hat{x}_{k|k-1})$

协方差更新：$P_{k|k} = (I - K_k H_k) P_{k|k-1}$

## 在嵌入式上实现姿态估计

对于 6 轴 IMU 的姿态估计（四元数），我们使用误差状态卡尔曼滤波（ESKF）：

```c
// 核心数据结构
typedef struct {
    float q[4];       // 四元数 [w, x, y, z]
    float gyro_bias[3];  // 陀螺仪偏置估计
    float P[21];      // 协方差矩阵上三角 (6×6 → 21个)
} eskf_state_t;

// 预测步：用陀螺仪更新四元数
void eskf_predict(eskf_state_t *s, float gx, float gy, float gz, float dt) {
    // 去除偏置
    float wx = gx - s->gyro_bias[0];
    float wy = gy - s->gyro_bias[1];
    float wz = gz - s->gyro_bias[2];
    
    // 四元数运动学：dq/dt = 0.5 * q ⊗ ω
    float qw = s->q[0], qx = s->q[1], qy = s->q[2], qz = s->q[3];
    s->q[0] += 0.5f * dt * (-wx*qx - wy*qy - wz*qz);
    s->q[1] += 0.5f * dt * ( wx*qw + wz*qy - wy*qz);
    s->q[2] += 0.5f * dt * ( wy*qw - wz*qx + wx*qz);
    s->q[3] += 0.5f * dt * ( wz*qw + wy*qx - wx*qy);
    
    // 四元数归一化
    float norm = 1.0f / sqrtf(qw*qw + qx*qx + qy*qy + qz*qz);
    for (int i = 0; i < 4; i++) s->q[i] *= norm;
}

// 更新步：用加速度计修正 roll/pitch
void eskf_update_accel(eskf_state_t *s, float ax, float ay, float az) {
    // 从当前四元数推算重力方向
    float qw = s->q[0], qx = s->q[1], qy = s->q[2], qz = s->q[3];
    float grav_x = 2.0f * (qx*qz - qw*qy);
    float grav_y = 2.0f * (qw*qx + qy*qz);
    float grav_z = qw*qw - qx*qx - qy*qy + qz*qz;
    
    // 归一化加速度计读数
    float a_norm = sqrtf(ax*ax + ay*ay + az*az);
    float ax_n = ax / a_norm, ay_n = ay / a_norm, az_n = az / a_norm;
    
    // 测量残差
    float ex = ay_n * grav_z - az_n * grav_y;
    float ey = az_n * grav_x - ax_n * grav_z;
    
    // 互补滤波增益（简化版，实际 ESKF 用完整的卡尔曼增益）
    float kp = 0.5f;
    s->gyro_bias[0] += ex * 0.001f;
    s->gyro_bias[1] += ey * 0.001f;
}
```

## Mahony 互补滤波：更低成本的替代方案

如果 MCU 资源紧张（比如 STM32F103），Mahony 滤波器是更好的选择——不需要维护协方差矩阵，计算量只有卡尔曼的 1/10：

- **PI 增益调参直观**：Kp 控制收敛速度，Ki 控制偏置消除速度
- **浮点运算仅需约 200 次乘法/迭代**
- **对于大多数无人机姿态控制场景足够**

## 选型建议

| 场景 | 推荐方案 | MCU 要求 |
|------|---------|---------|
| 简单倾角检测 | 加速度计低通 | 任意 |
| 无人机/平衡车 | Mahony 互补滤波 | Cortex-M0+ |
| 高精度导航 | ESKF | Cortex-M4F+ |
| SLAM/自动驾驶 | 图优化 + ESKF | Cortex-A / FPGA |

> 传感器融合算法是"所见即所得"的反面——你永远看不到真实的状态，只能通过数学模型去逼近。但正是这种对不确定性的量化管理，让机器人能够在充满噪声的物理世界中可靠运行。
