---
title: ROS 机器人操作系统入门：从节点通信到自主导航
published: 2025-03-30
tags: [ROS, 机器人, 导航, SLAM, 传感器]
category: 机器人
description: ROS 2 入门实战指南——从核心概念（节点、话题、服务）到 Navigation2 自主导航栈的完整配置流程。
---

# ROS 机器人操作系统入门

## ROS 解决什么问题

造一个机器人，你需要协调十几个传感器和执行器。如果每个模块都从头写通信代码，你花在"让东西连起来"上的时间将远超"让机器人变聪明"的时间。

ROS（Robot Operating System）提供了一套**分布式通信框架** + **标准化的机器人功能包**，让你专注于算法而不是基础设施。

## 核心概念：节点、话题、服务

### 节点（Node）

ROS 中每个功能模块是一个独立的进程（节点）。例如：摄像头驱动是一个节点，SLAM 算法是另一个节点。它们互相独立，崩溃不影响彼此。

### 话题（Topic）

节点之间通过话题传递**流式数据**——Publish/Subscribe 模式：

```
Lidar Driver Node ──→ /scan (sensor_msgs/LaserScan)
                              ↓
                      SLAM Node (订阅 /scan，发布 /map)
                              ↓
                      /map (nav_msgs/OccupancyGrid)
                              ↓
                      Navigation Node (订阅 /map)
```

### 服务（Service）

适合**请求-响应**模式的一次性操作（如"拍一张照片"）：

```python
# 服务端
from std_srvs.srv import Trigger

class CameraNode(Node):
    def __init__(self):
        super().__init__('camera')
        self.srv = self.create_service(Trigger, 'capture', self.capture_cb)
    
    def capture_cb(self, request, response):
        # 拍照逻辑...
        response.success = True
        response.message = "Image captured"
        return response
```

## ROS 2 相比 ROS 1 的关键改进

| 特性 | ROS 1 | ROS 2 |
|------|-------|-------|
| 通信协议 | 自定义 TCP/UDP | DDS（工业标准） |
| Master 节点 | 需要 roscore | 无中心节点 |
| 实时性 | 不支持 | 支持（通过 RTI DDS） |
| 多机器人 | 困难 | 原生支持 |
| 跨平台 | Linux | Linux / Windows / macOS |

## TF2：坐标变换框架

机器人上每个传感器都有自己的坐标系。TF2 通过维护一棵**坐标树**来自动管理所有坐标变换：

```
map → odom → base_link → lidar_link
                      → camera_link
                      → left_wheel
                      → right_wheel
```

查询 lidar 到 map 的变换只需要一行代码：

```python
from tf2_ros import Buffer, TransformListener

tf_buffer = Buffer()
tf_listener = TransformListener(tf_buffer, node)

# 查询 lidar_frame 在 map 坐标系下的位姿
transform = tf_buffer.lookup_transform('map', 'lidar_link', rclpy.time.Time())
```

## Navigation2：自主导航栈

Navigation2 是 ROS 2 的导航框架，提供了一套完整的行为树驱动的自主导航方案：

```
传感器数据 → Global Planner（A*/Dijkstra 全局路径）
           → Local Planner（DWA/TEB 局部避障）
           → Costmap（代价地图：障碍物 + 膨胀层）
           → Behavior Tree（协调行为：旋转恢复、重规划等）
           → Controller（cmd_vel 输出给电机驱动）
```

### 基础配置

只需正确配置 TF 和传感器话题，Navigation2 就能工作：

```yaml
# nav2_params.yaml
planner_server:
  ros__parameters:
    planner_plugin: "nav2_navfn_planner/NavfnPlanner"

controller_server:
  ros__parameters:
    controller_plugin: "dwb_core::DWBLocalPlanner"

local_costmap:
  ros__parameters:
    robot_radius: 0.22
    inflation_layer:
      inflation_radius: 0.35
```

## 从仿真到现实

在实际机器人上部署 ROS 的额外建议：

1. **仿真先行**：用 Gazebo/Ignition + 你的 URDF 模型充分验证后再上真机
2. **时钟同步**：激光雷达和里程计的时钟偏差 > 10ms 会导致 SLAM 严重退化
3. **计算资源**：至少 Raspberry Pi 4 (4GB) 才能跑基础 SLAM。视觉 SLAM 建议 Jetson Orin
4. **里程计质量至关重要**：轮式里程计的误差会传递到整个建图和导航系统

> ROS 不是银弹——它给你一套标准工具和通信框架，但机器人的"智能"部分永远需要你自己设计和调优。把 ROS 当作乐高，你的算法才是让机器人"活"起来的灵魂。
