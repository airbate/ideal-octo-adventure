---
title: 从 CUDA Kernel 到 PyTorch 自定义算子：接口、Autograd 与验证
published: 2026-08-27
tags: [CUDA, PyTorch, C++/CUDA, 自定义算子]
category: 芯片与算子
description: 介绍把 CUDA Kernel 接入 PyTorch 的最小工程闭环：算子注册、设备检查、反向传播、测试与基准。
---

# 从 CUDA Kernel 到 PyTorch 自定义算子：接口、Autograd 与验证

写出能跑的 Kernel 只是算子开发的一半。真正可用的 PyTorch 扩展还要处理设备、dtype、shape、自动求导和 Python/C++ 边界。

## 先定义清晰的契约

在写 C++ 之前确定：输入是否必须 contiguous、支持哪些 dtype、输出 shape、是否允许 CPU、错误信息如何表达。算子入口应尽早检查 device 和 shape，避免把非法输入带进 Kernel 后才触发难读的 CUDA error。

```cpp
TORCH_CHECK(x.is_cuda(), "x must be a CUDA tensor");
TORCH_CHECK(x.scalar_type() == at::kFloat, "only float32 is supported");
TORCH_CHECK(x.is_contiguous(), "x must be contiguous");
```

## 注册与调用

现代 PyTorch 扩展通常通过 `TORCH_LIBRARY` 注册 schema，再为 CUDA dispatch key 提供实现。schema 描述参数和返回值，Python 侧调用稳定的 `torch.ops.my_ns.my_op`，而不是直接暴露内部 C++ 函数。

```cpp
TORCH_LIBRARY(my_ns, m) {
    m.def("scale(Tensor x, float alpha) -> Tensor");
}
TORCH_LIBRARY_IMPL(my_ns, CUDA, m) {
    m.impl("scale", &scale_cuda);
}
```

## Autograd 不能靠“结果看起来对”

如果算子参与训练，需要提供 backward，或用 Python `torch.autograd.Function` 保存反向所需的中间结果。先用 PyTorch 参考实现对照，再用 `torch.autograd.gradcheck`（double、较小输入）验证梯度；随机大张量测试负责发现越界、未初始化和竞态。

## 流与设备语义

Kernel 应使用当前 CUDA stream，而不是擅自创建并同步默认 stream。分配输出时遵循输入的 device、dtype 和 memory format。异步执行意味着错误可能延迟到后续 API 才暴露，调试阶段可以开启 `CUDA_LAUNCH_BLOCKING=1` 定位，但不要把它作为生产配置。

## 最小测试矩阵

- shape：空张量、非整除 Block 的长度、二维/三维边界；
- dtype：float32、必要时 float16/bfloat16；
- layout：contiguous 与明确拒绝的 non-contiguous；
- 数值：与参考实现比较绝对/相对误差；
- 训练：forward、backward、gradcheck；
- 性能：固定版本、warmup、同步计时，并覆盖目标 GPU。

好的自定义算子不是“比 Python 快一次”，而是具备可验证的语义、正确的 stream 行为、稳定的梯度和可重复的性能数据。
