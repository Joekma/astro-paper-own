# 微调系列图片 Prompt 与 Style Contract

状态：`prototype-pending`。只有 `ft05-f01` 获得用户明确确认后，才能将状态改为 `approved` 并生成其他图片。

## Style Draft

- 用途：scientific-educational，中文大模型微调教程学术插图。
- 画布：1600×900，16:9 横向，白色或极浅灰论文背景。
- 字体：中文无衬线；英文术语、公式、Shape 和配置字段使用等宽字体。
- 配色：数据/Token 蓝、冻结基座深灰、可训练 Adapter 青绿、量化橙、Loss 红、评估绿、部署紫、警告琥珀。
- 构图：扁平、精确、网格对齐、细线箭头、充足留白；单图只解释一个认知问题。
- 禁止：3D 装饰、卡通人物、火箭/芯片图标、品牌标志、水印、虚构节点、无关公式和未经核验的性能数字。
- 技术文本若生成漂移，必须用确定性文本层修正；不能接受“大致可读”。

## Prototype `ft05-f01`

目标文件：`src/data/blog/AI/微调/images/fine-tuning-05-lora-qlora-parameter-path-figure-01.png`

```text
Use case: scientific-educational
Asset type: 中文大模型微调教程的学术参数路径图
Primary request: 绘制一张 LoRA 与 QLoRA 参数路径对照图，准确表达冻结基座、可训练低秩矩阵、量化存储、计算 dtype 与梯度路径。
Scene/backdrop: 白色或极浅灰论文背景，无纹理噪声。
Style/medium: 顶会论文附图与研究生教材插图风格；扁平、精确、克制、矢量感强。
Composition/framing: 1600×900 横向画布。左侧 58% 为 LoRA 双路径，右侧 42% 为 QLoRA 存储—计算—梯度三层。严格网格对齐、细线箭头、充足留白。
Color palette: 输入与数据蓝；冻结 W₀ 深灰；A、B 与 Adapter 青绿；4-bit 量化橙；梯度路径红；输出深蓝。
Text (verbatim): "LoRA"; "QLoRA"; "x ∈ R^(d_in)"; "W₀ ∈ R^(d_out×d_in)"; "A ∈ R^(r×d_in)"; "B ∈ R^(d_out×r)"; "ΔW = (α/r)BA"; "y = W₀x + (α/r)BAx"; "Frozen / 冻结"; "Trainable / 可训练"; "4-bit frozen storage"; "BF16 compute"; "仅更新 Adapter".
Structure: LoRA 主路径 x→W₀x→相加；Adapter 路径 x→A→B→α/r→相加；右侧从 4-bit frozen storage 向下到 BF16 compute，再到仅更新 Adapter，红色梯度箭头只能回到 A、B，不能进入 W₀。
Constraints: A 必须是 r×d_in，B 必须是 d_out×r；BA 必须与 W₀ 同 Shape；不得交换 A/B；不得声称固定显存比例或“必然接近全参数微调”。最小正文标签字号按 1600×900 不低于 24 px。
Avoid: 3D、照片、霓虹、渐变堆叠、装饰图标、数据库圆柱、雪花、火焰、火箭、芯片、无关公式、拼写错误、额外文字、水印。
```

## 批量 Prompt 模板（尚未批准）

样图批准后，每张图单独继承 Style Contract，并从 `fine-tuning-academic-image-storyboard.json` 注入 `learningObjective`、`requiredLabels`、`structure` 与 `distinction`。不得把多张不同教学图合并为一次变体生成。
