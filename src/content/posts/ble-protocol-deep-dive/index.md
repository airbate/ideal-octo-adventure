---
title: BLE 蓝牙协议栈深度解析：从物理层到 GATT 的每一层
published: 2025-08-28
tags: [BLE, 蓝牙, 无线通信, 协议栈, IoT]
category: 物联网
description: 逐层拆解 BLE 5.x 协议栈——物理层的 GFSK 调制、链路层的状态机、L2CAP 的分片重组、以及 GATT 的服务发现机制。
---

# BLE 蓝牙协议栈深度解析

## 一个数据包的旅程

当你的手机 App 读取智能手环的心率数据时，一个 20 字节的 GATT 数值穿越了整个 BLE 协议栈。让我们逐层追踪这条路。

## 物理层（PHY）：1Mbps GFSK 的背后

BLE 使用 **GFSK（高斯频移键控）**，调制指数 0.5，带宽-周期积 BT = 0.5：

- **1M PHY**：1 Mbps 符号率，经典模式
- **2M PHY**（BLE 5.0）：2 Mbps，吞吐量翻倍但接收灵敏度下降约 4dB
- **Coded PHY**（BLE 5.0）：125kbps / 500kbps，前向纠错（FEC）换取 ~6dB 灵敏度提升，适合远距离

从射频角度看，BLE的调制信号带宽：

$$B_{99\%} \approx \frac{1 + h}{T} = \frac{1.5}{1\mu s} = 1.5\text{ MHz}$$

这就是为什么 BLE 使用 2MHz 信道间隔——刚好够隔离相邻信道。

## 链路层（LL）：状态机的七个状态

BLE 链路层是一个有限状态机，包含 7 个核心状态：

```
Standby → Advertising → Connection (Slave)
Standby → Scanning → Initiating → Connection (Master)
```

### 连接事件分析

每次连接事件中，Master 在预定的时间窗口（`connInterval`）内发起传输。关键参数：

| 参数 | 范围 | 含义 |
|------|------|------|
| connInterval | 7.5ms - 4s | 连接间隔，决定功耗和延迟的平衡 |
| connSlaveLatency | 0 - 499 | 从机可跳过的连接事件数 |
| connSupervisionTimeout | 100ms - 32s | 超时判定断连时间 |

功耗优化的黄金公式：

$$\text{平均电流} \propto \frac{T_{active}}{T_{interval}} = \frac{T_{TX} + T_{RX}}{connInterval}$$

增大 `connInterval` 是最简单的省电手段，但会牺牲响应延迟。

## L2CAP：分片与重组

BLE 4.0/4.1 的 L2CAP MTU 只有 23 字节，扣除 ATT 头（3 字节），实际应用数据仅有 20 字节。这是很多初学者遇到的"为什么我的数据发不全"的根本原因。

BLE 4.2 引入了 **LE Data Length Extension**，将链路层 PDU 扩展到 251 字节，使得单个连接事件可以承载更多数据——吞吐量从 ~30kbps 提升到 ~700kbps。

## ATT/GATT：数据组织模型

GATT（Generic Attribute Profile）定义了一个树状的数据组织方式：

```
Service (UUID: 0x180D — Heart Rate)
├── Characteristic (UUID: 0x2A37 — Heart Rate Measurement)
│   ├── Value (通知/指示)
│   └── Descriptor: CCCD (0x2902)
├── Characteristic (UUID: 0x2A38 — Body Sensor Location)
│   └── Value (只读)
```

### CCCD：为什么我的通知收不到

这是 BLE 开发中最高频的坑。从机不会主动推送数据，除非主机关闭了对应 Characteristic 的 **CCCD（Client Characteristic Configuration Descriptor）**：

```c
// 主机端代码：订阅通知
uint16_t cccd_value = 0x0001;  // 0x0001 = Notifications, 0x0002 = Indications
err = bt_gatt_write(conn, cccd_handle, &cccd_value, sizeof(cccd_value));
```

## BLE 5.x 的新特性实战

- **2M PHY**：固件升级场景使用——OTA 时间减半
- **Advertising Extensions**：广播包从 31 字节扩展到 1650 字节，支持链式广播
- **Periodic Advertising**：无连接的多播数据流，适合传感器广播

> 协议栈不是用来背的。最好的学习方法是用 nRF Connect 抓包，看着一个个 PDU 在空中飞过，协议栈自然就立体了。
