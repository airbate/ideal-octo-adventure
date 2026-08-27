---
title: CUDA 编程模型入门：从线程层次到一次 Kernel 执行
published: 2026-08-27
tags: [CUDA, GPU, 并行计算, 芯片]
category: 芯片与算子
description: 用一个向量加法例子理解 CUDA 的 Grid、Block、Thread 层次，以及 Host 与 Device 之间的数据流。
---

# CUDA 编程模型入门：从线程层次到一次 Kernel 执行

CUDA 的核心不是“把 CPU 代码搬到 GPU”，而是把一个可拆分的工作映射到大量线程上。理解线程层次、内存层次和同步边界，比先记住某个库函数更重要。

## 一次 Kernel 的结构

CUDA 用三个层级描述并行工作：Grid 包含多个 Block，Block 包含多个 Thread。一个 Block 会被调度到一个 Streaming Multiprocessor（SM）上执行，Block 内线程可以使用共享内存并进行同步；不同 Block 之间默认不能直接同步。

```cpp
__global__ void add(const float* a, const float* b, float* c, int n) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i < n) c[i] = a[i] + b[i];
}

int threads = 256;
int blocks = (n + threads - 1) / threads;
add<<<blocks, threads>>>(d_a, d_b, d_c, n);
```

`threadIdx` 是线程在 Block 内的坐标，`blockIdx` 是 Block 在 Grid 内的坐标。两者乘加得到全局索引。边界判断不可省略，因为最后一个 Block 往往没有刚好填满。

## Warp 才是硬件执行单位

线程是编程模型里的抽象，NVIDIA GPU 通常以 32 个线程组成的 Warp 执行指令。一个 Warp 内线程走不同分支时会发生分支发散：硬件需要分别执行各条路径，再屏蔽不满足条件的线程。因此，热循环中的条件分支应尽量让同一 Warp 的线程保持一致。

## Host/Device 数据流

最小可用流程是：在 Host 分配输入 → 拷贝到 Device → 启动 Kernel → 拷贝结果回来 → 释放资源。频繁的小拷贝会抵消 GPU 计算收益，工程上应尽量批量处理，并使用 pinned memory、异步拷贝和多个 stream 隐藏传输延迟。

## 三个排错习惯

1. 每次 Kernel 启动后检查 `cudaGetLastError()`，同步点再检查 `cudaDeviceSynchronize()`。
2. 先用小规模、确定性输入验证索引和边界，再做性能优化。
3. 用 Nsight Systems 看 CPU/GPU 时间线，用 Nsight Compute 看访存、占用率和 Warp 分支，而不是凭感觉改 Block 大小。

CUDA 的第一原则是先画清楚数据如何分片，再决定线程如何组织。映射正确之后，性能问题才有可测量、可定位的边界。
