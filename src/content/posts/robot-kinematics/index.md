---
title: 机器人运动学：从 DH 参数法到数值逆解的工程实践
published: 2026-06-30
tags: [机器人学, 运动学, DH参数, 逆运动学, 机械臂]
category: 机器人
description: 系统讲解机器人正向/逆向运动学的数学基础与工程实现，包含 DH 参数法推导、雅可比矩阵和数值逆解算法。
---

# 机器人运动学：从 DH 参数法到数值逆解

## 为什么要从运动学开始

任何一个机械臂项目——无论是六轴工业机械臂还是四轴 SCARA——运动学都是最底层的数学模型。它回答了机器人最基本的两个问题：

- **正运动学（FK）**：给定各关节角度，末端执行器在哪里？
- **逆运动学（IK）**：想让末端到某个位置，各关节应该转多少度？

## DH 参数法

Denavit-Hartenberg（DH）参数法用 **4 个参数** 描述相邻关节间的空间关系：

| 参数 | 含义 | 类型 |
|------|------|------|
| a | 连杆长度 | 常量 |
| α | 连杆扭转角 | 常量 |
| d | 关节偏移 | 旋转关节为变量 |
| θ | 关节角度 | 旋转关节为变量 |

### 齐次变换矩阵

$$
^{i-1}T_i = \begin{bmatrix}
\cos\theta_i & -\sin\theta_i\cos\alpha_i & \sin\theta_i\sin\alpha_i & a_i\cos\theta_i \\
\sin\theta_i & \cos\theta_i\cos\alpha_i & -\cos\theta_i\sin\alpha_i & a_i\sin\theta_i \\
0 & \sin\alpha_i & \cos\alpha_i & d_i \\
0 & 0 & 0 & 1
\end{bmatrix}
$$

对于六轴机械臂，末端位姿就是 6 个矩阵连乘：

$$^0T_6 = ^0T_1 \cdot ^1T_2 \cdot ^2T_3 \cdot ^3T_4 \cdot ^4T_5 \cdot ^5T_6$$

## Python 实现正运动学

```python
import numpy as np

def dh_transform(theta, d, a, alpha):
    """返回 4x4 DH 齐次变换矩阵"""
    ct, st = np.cos(theta), np.sin(theta)
    ca, sa = np.cos(alpha), np.sin(alpha)
    return np.array([
        [ct, -st*ca,  st*sa, a*ct],
        [st,  ct*ca, -ct*sa, a*st],
        [0,      sa,     ca,    d],
        [0,       0,      0,    1]
    ])

def forward_kinematics(dh_params, joint_angles):
    """计算末端位姿"""
    T = np.eye(4)
    for i, (d, a, alpha) in enumerate(dh_params):
        T = T @ dh_transform(joint_angles[i], d, a, alpha)
    return T
```

## 逆运动学：数值解法

解析法只适用于特定构型的机械臂（如 Pieper 准则下的六轴臂）。更通用的方案是**基于雅可比伪逆的数值迭代**：

```python
def inverse_kinematics_numeric(dh_params, target_pose, initial_guess, max_iter=100, tolerance=1e-6):
    """数值 IK：雅可比伪逆迭代法"""
    q = np.array(initial_guess, dtype=float)
    
    for iteration in range(max_iter):
        # 正运动学
        T_current = forward_kinematics(dh_params, q)
        
        # 位置误差和姿态误差 → 6维误差向量
        pos_error = target_pose[:3, 3] - T_current[:3, 3]
        rot_error = 0.5 * np.cross(T_current[:3,:3].T @ target_pose[:3,:3]).diagonal()
        error = np.concatenate([pos_error, rot_error])
        
        if np.linalg.norm(error) < tolerance:
            return q
        
        # 计算雅可比矩阵（数值微分）
        J = compute_jacobian(dh_params, q)
        
        # 阻尼最小二乘法（避免奇异）
        lambda_damp = 0.01
        delta_q = J.T @ np.linalg.solve(
            J @ J.T + lambda_damp**2 * np.eye(6), error
        )
        q += delta_q
    
    raise RuntimeError("IK did not converge")
```

## 关节限位与避奇异

工程中还需要处理：

1. **关节限位**：每次迭代后 clamp 关节角度到 [q_min, q_max]
2. **奇异位姿**：雅可比矩阵条件数过大时，增大阻尼系数 λ
3. **多解选择**：给定期望姿态（如 elbow up/down），在初值中体现偏好

> 运动学是机械臂控制的地基。地基不牢，上层再漂亮的轨迹规划和力控都是空中楼阁。建议先在一个 URDF 模型上反复练习 FK/IK 的计算和验证，形成肌肉记忆。
