---
title: FPGA 开发实战：Verilog 入门与状态机设计精要
published: 2025-10-20
tags: [FPGA, Verilog, 数字电路, 硬件描述语言, 状态机]
category: 硬件设计
description: 从数字电路基础到 Verilog 可综合设计，深入讲解 FPGA 开发的思维范式转换和状态机设计方法。
---

# FPGA 开发实战：Verilog 入门与状态机设计精要

## 从软件思维到硬件思维

FPGA 开发的第一个门槛不是语法，而是**思维范式转换**。写 C 代码时你在写"指令序列"，CPU 逐条执行。写 Verilog 时你在"描述数字电路结构"，所有语句是**并行**执行的。

```verilog
// 这三条赋值语句同时生效，不是顺序执行！
always @(posedge clk) begin
    a <= b;          // a 拿到的是 b 上一个周期的值
    b <= a;          // b 拿到的是 a 上一个周期的值
end
// 结果：a 和 b 在每个时钟沿交换！
```

这就是非阻塞赋值 `<=` 的魔力——它模拟了寄存器行为的本质。

## 可综合设计原则

不是所有 Verilog 语法都能被综合成实际电路。以下是核心原则：

### 必须避免的陷阱

```verilog
// ❌ 不可综合：混合时钟沿
always @(posedge clk or negedge rst_n) begin
    // 可以，这是带异步复位的寄存器
end

// 但这样不行：
always @(posedge clk1 or posedge clk2) begin
    // 双时钟触发，综合器无法推断器件
end
```

### 阻塞赋值 vs 非阻塞赋值的黄金法则

| 场景 | 使用 |
|------|------|
| 组合逻辑 (always @(*)) | `=` (阻塞) |
| 时序逻辑 (always @(posedge clk)) | `<=` (非阻塞) |
| 同一个 always 块混用 | ❌ 绝对不要 |

## 状态机设计：三段式写法

三段式状态机是工业界最推荐的设计风格，将状态跳转、下一状态逻辑和输出逻辑分离：

```verilog
module uart_rx_fsm (
    input  wire       clk,
    input  wire       rst_n,
    input  wire       rx,
    output reg [7:0]  data,
    output reg        data_valid
);
    // 状态编码：独热码减少组合逻辑级数
    localparam IDLE    = 5'b00001;
    localparam START   = 5'b00010;
    localparam DATA    = 5'b00100;
    localparam PARITY  = 5'b01000;
    localparam STOP    = 5'b10000;

    reg [4:0]  state, next_state;
    reg [3:0]  bit_cnt;
    reg [7:0]  shift_reg;

    // 第一段：状态跳转
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n)
            state <= IDLE;
        else
            state <= next_state;
    end

    // 第二段：下一状态逻辑（纯组合逻辑）
    always @(*) begin
        next_state = state;
        case (state)
            IDLE:   if (!rx) next_state = START;
            START:  next_state = DATA;
            DATA:   if (bit_cnt == 8) next_state = PARITY;
            PARITY: next_state = STOP;
            STOP:   next_state = IDLE;
            default: next_state = IDLE;
        endcase
    end

    // 第三段：输出逻辑
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            data <= 0;
            data_valid <= 0;
        end else begin
            case (state)
                DATA: begin
                    shift_reg <= {rx, shift_reg[7:1]};
                    bit_cnt <= bit_cnt + 1;
                end
                STOP: begin
                    data <= shift_reg;
                    data_valid <= 1;
                end
                default: data_valid <= 0;
            endcase
        end
    end
endmodule
```

## 时序约束的必要性

很多 FPGA 初学者遇到"烧进去程序跑不对"的问题，十有八九是**没有加时序约束**。SDC 约束文件是 FPGA 工程的必备文件：

```tcl
# 主时钟约束
create_clock -name clk -period 10.0 [get_ports clk]

# 输入延迟约束
set_input_delay -clock clk -max 3.0 [get_ports rx]
set_input_delay -clock clk -min 1.0 [get_ports rx]

# 输出延迟约束
set_output_delay -clock clk -max 4.0 [get_ports data_valid]
```

## CDC（跨时钟域）处理

当设计中有多个时钟域时，亚稳态问题是 FPGA 设计的经典痛点：

```verilog
// 两级同步器 —— CDC 最基本的处理
reg [1:0] sync_ff;
always @(posedge dst_clk) begin
    sync_ff <= {sync_ff[0], src_signal};
end
wire synced_signal = sync_ff[1];
```

> FPGA 开发真正的门槛不在于写 Verilog 代码，而在于**理解硬件行为**和**时序分析能力**。当你开始用示波器和逻辑分析仪而不是 printf 调试时，你就真正入门了。
