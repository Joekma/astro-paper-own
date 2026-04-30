---
title: 什么是Prompt
published: 2024-08-13
updated: 2026-04-22
description: '什么是Prompt'
image: ''
tags: [AI]
category: 'AI'
draft: false
language: zh-CN
---

# 什么是Prompt

## 1.什么是Prompt

Prompt提示是什么呢？

Prompt（提示词）是我们和LLM互动最常用的方式，我们提供给LLM的Prompt作为模型的输入，并希望LLM反馈我们期待的结果。虽然LLM的功能非常强大，但LLM对提示词（Prompt）也非常敏感。Prompt提示是模型接收以生成响应或完成任务的初始文本输入。我们给AI一组Prompt输入，用于指导模型生成响应以执行任务。这个输入可以是一个问题、一段描述、一组关键词，或任何其他形式的文本，用于引导模型产生特定内容的响应。

**总体而言，其实现逻辑如下：**

简单而言，大模型的运行机制是“下一个字词预测”。用户输入的 Prompt 即为大模型所获得上下文，大模型将根据用户的输入进行续写，返回结果。因此，输入的 Prompt 的质量将极大地影响模型的返回结果的质量和对用户需求的满足程度，总的原则是“用户表达的需求越清晰，模型更有可能返回更高质量的结果”。

#### 1.1 先了解 LLMs 是如何进行预测的？

你可能会好奇LLMs是如何实现这些预测的。其实，这一切都源于它们的训练过程。LLMs在训练期间会接触到包含各类教科书、文章、网站等的庞大数据集。在这一阶段，它们学习理解语言的上下文和流畅性，掌握语法、风格乃至文本的语调等元素。

当你向LLM提供一个句子或问题作为提示时，它会运用所学知识来预测最可能跟随的下一个或几个词。这并非随意猜测，而是基于其在训练过程中观察到的模式和规则进行的深思熟虑的预测。

## 2\. Prompt的分类

从不同的视角， 可以对Prompt 进行不同的分类。在这里，尝试根据可解释性、交互方式和应用领域三个方面对Prompt 进行分类。

### 2.1 可解释性分类：硬提示和软提示

硬提示（hard prompt ）是手工制作的、预定义的带有离散输入标记的文本，或者文本模板。静态提示可以合并到程序中用于编程、存储和重用，基于大模型的应用程序可以有多个提示模板供其使用。

尽管模板带来了一定程度的灵活性，但是提示语仍然需要被设置得很好才行，换句话说，静态提示一种硬编码的提示。 

建立在LangChain 之上的基于大模型的 很多应用程序，其提示模板在很大程度上是静态的，它指示代理执行哪些操作。一般来说，模板包括: 定义了可以访问哪些工具，何时应该调用这些工具，以及一般的用户输入。

软提示（soft prompt ）是在提示调优过程中创建的。与hard prompt 不同，软提示不能在文本中查看和编辑，包含一个嵌入或一串数字，代表从大模型中获得知识。软提示缺乏软可解释性。人工智能发现与特定任务相关的软提示，但不能解释为什么它。与深度学习模型本身一样，软提示也是不透明的。软提示可以替代额外的训练数据，一个好的语言分类器软提示有几百到几千个额外的数据点。

提示微调包括了在使用 LLM 之前使用一个小的可训练模型。小模型用于对文本提示进行编码并生成特定于任务的虚拟令牌。这些虚拟令牌被预先追加到Prompt上并传递给 LLM。调优过程完成后，这些虚拟令牌将存储在一个查找表中，并在推断期间使用，从而替换原来的小模型。当提供上下文时，LLM 的表现要好得多，而且提示微调是一种快速有效的方法，能够以动态地创建急需的上下文。

### 2.2 交互方式分类：在线提示 和 离线提示

"online" 和 "offline" 是一种方式来区分模型互动中 prompt 的使用方式。这两种分类表示了 prompt 在与大模型互动的时间和方式上的不同。

在线提示（Online prompt） 是在与模型的实时互动中提供的提示，通常用于即时的交互式应用。这种提示在用户与模型进行实际对话时提供，用户可以逐步输入、编辑或更改提示，在在线聊天、语音助手、实时问题回答等应用中常见。

离线提示（Offline prompt ）是预先准备好的提示，通常在用户与模型的实际互动之前创建。这种提示在没有用户互动时预先设计和输入，然后整批输入模型进行批量处理。在离线文本生成、文章写作、大规模数据处理等应用中常见。

对提示分类为 "online" 或 "offline" ，可帮助确定如何有效地使用提示，以满足不同应用的需求。在线提示通常用于需要实时交互和即时反馈的情况，而 离线提示则适用于需要大规模处理或预生成文本的情况。根据具体应用和使用情境，您可以选择适当的提示类型。

### 2.3 应用领域分类

用途分类可以帮助确定 prompt 的主要目标，以便更有效地使用它们。以下是一些常见的 prompt 类别：

  * Information Retrieval (信息检索):这些 prompt 用于从模型中检索特定信息，如回答问题、提供事实或解释概念。用途包括问答、信息检索、事实核实等。

  * Text Generation (文本生成):这些 prompt 用于指导模型生成文本，可能是文章、故事、评论等。用途包括创意写作、内容生成、自动摘要等。

  * Translation (翻译):这些 prompt 用于将文本从一种语言翻译成另一种语言。用途包括机器翻译应用。

  * Sentiment Analysis (情感分析):这些 prompt 用于评估文本的情感倾向，如正面、负面或中性。用途包括社交媒体监测、情感分析应用。

  * Programming and Code Generation (编程和代码生成):这些 prompt 用于生成计算机程序代码或解决编程问题。用途包括编程辅助、自动化代码生成等。

  * Conversation (对话):这些 prompt 用于模拟对话或聊天，并回应用户提出的问题或评论。用途包括聊天机器人、虚拟助手等。

  * Task-Specific (特定任务):这些 prompt 针对特定应用或任务，如制定旅行计划、编写营销文案、生成报告等。用途因任务而异。

  * Custom Applications (自定义应用):这些 prompt 针对特定领域或自定义应用，具体用途由用户定义。用途根据用户需求而定。

通过将 prompt 分类为不同的用途，可以更好地理解模型如何应用于各种任务和情境。这有助于选择合适的提示类型，并设计它们以满足特定需求。

## 3\. Prompt 的一般要素

在应用Prompt的时候，我们需要理解一个Prompt 可能包含的6个要素：任务，上下文，示例，角色，格式和语气，而且这些要素是按重要性降序排列的。

### 3.1 任务或指令

任务序列是由动词引导的，例如generate, drive, write, analyze等，而且需要明确任务目标。

#### 3.1.1任务或指令

指令是最常用的提示组件，主要功能是向模型说明要执行的操作。虽然概念简单，但是实践中仍然比较复杂，下面是简单和详细的一些指令例子，详细、明确的指导比模糊不清的提示能够产生更好的效果：

**指令类型**| **prompt**| **Completion**  
---|---|---  
简单指令 | 简要介绍一下阿里巴巴。 | 阿里巴巴集团是一家中国跨国科技公司，成立于1999年。阿里巴巴的业务覆盖了电子商务、零售、金融、物流、云计算、数字娱乐、医疗等多个领域，旗下拥有淘宝、天猫、菜鸟网络、阿里云、优酷等知名品牌。 阿里巴巴集团的愿景是让世界各地的企业都能够平等地进行贸易，让小企业通过数字化技术实现更好的发展。阿里巴巴秉持开放、合作、共赢的理念，致力于打造一个开放、包容、公平的数字经济生态系统，为全球数字经济的发展做出贡献。 阿里巴巴在科技创新和社会责任方面也做出了很多努力。阿里巴巴达摩院是阿里巴巴集团的全球科研机构，致力于推动科技创新和技术进步。阿里巴巴还积极参与公益事业，发起了“阿里巴巴公益基金会”等多个公益项目，致力于推动社会进步和可持续发展。  
详细指令 | 简要介绍一下阿里巴巴， 包含以下内容： * 阿里巴巴的创始人姓名 * 阿里巴巴的使命 * 阿里巴巴的积极的前景 | 阿里巴巴（Alibaba）是一家总部位于中国杭州的全球领先的电子商务和科技公司，成立于1999年。阿里巴巴的创始人是马云和他的团队。阿里巴巴的使命是让世界各地的企业都能够平等地进行贸易，让小企业通过数字化技术实现更好的发展。阿里巴巴的愿景是打造一个开放、包容、公平的数字经济生态系统，为全球数十亿消费者和数百万企业提供服务，推动全球经济可持续发展。 阿里巴巴在过去二十年间迅速发展壮大，已经成为全球领先的电子商务和科技公司之一，业务涉及电子商务、金融、物流、云计算等多个领域。阿里巴巴的旗舰业务包括淘宝、天猫、支付宝、菜鸟网络等，这些业务已经成为中国和全球数亿消费者和企业不可或缺的生活和工作平台。 阿里巴巴在技术创新和社会责任方面也做出了很多努力。阿里巴巴达摩院是阿里巴巴集团的全球科研机构，致力于推动科技创新和技术进步。阿里巴巴还积极参与公益事业，发起了“阿里巴巴公益基金会”等多个公益项目，致力于推动社会进步和可持续发展。 总之，阿里巴巴是一家充满活力和创新精神的公司，其使命和愿景备受赞誉，未来发展前景十分积极。  
  
#### 3.1.2 主要内容

主要内容是指模型正在处理的文本内容。 主要内容通常与指令一起使用。 下面会从翻译，摘要等场景来示例：

**prompt**| **completion**  
---|---  
今天天气真好！ 翻译为英文： | The weather is really nice today!  
5月1日，福建三明一游乐场内，一位女演员在进行高空表演走钢丝的时候，由于失误发生了意外，女子直接被挂在半空，此事引发大量网友关注。 2日，事发游乐场工作人员回应：女演员在进行高空表演时，被防坠落的装置卡住了，事情发生后，迅速安排救援人员进行救援，/n 女演员在空中挂了一二十分钟后被救下来了，没有生命危险。因为安全保护措施太多了，起到了反作用。 一句话总结这个新闻： | 游乐场高空表演意外，女演员被挂半空，经过20分钟救援后获救。  
  
#### 3.1.4 更加明确的提示

充当模型输出的快速启动，帮助模型固定所需要的输出。可以作为模型生成的前缀，也可以引导模型一步一步的按照要求思考并给出答案。

prompt| completion  
---|---  
做一杯茶是非常简单的! 第一步，您需要烧开水，然后，你需要准备一个杯子，并在里面放一个茶包, 当水沸腾后，就可以把水倒在茶包上了，现在我们可以坐一会儿等着茶充分的泡开，几分钟后，我们可以吧茶包拿走并丢弃，按照喜好，可以加牛奶，就会成为一杯奶茶，或者什么都不加，然后，你就可以想用你的茶了。 总结上述文本： | 制作一杯茶是非常简单的。首先，你需要烧开水。然后，准备一个杯子，放入茶包，并将沸水倒在茶包上。等待几分钟后，取出茶包并丢弃。最后，你可以加入牛奶，调制成奶茶，或者不加牛奶，直接饮用。  
下面你将读到一段输入文本。如果他包含了一系列的指令, 按照如下格式重写这些指令： 第一步 - … 第二步 - … … 第N步 - … 做一杯茶是非常简单的! 第一步，您需要烧开水，然后，你需要准备一个杯子，并在里面放一个茶包, 当水沸腾后，就可以把水倒在茶包上了，现在我们可以坐一会儿等着茶充分的泡开，几分钟后，我们可以吧茶包拿走并丢弃，按照喜好，可以加牛奶，就会成为一杯奶茶，或者什么都不加，然后，你就可以想用你的茶了。 总结上述文本，按照如上格式分步骤展现出来： | 第一步：烧开水。 第二步：准备一个杯子，放入一个茶包。 第三步：当水沸腾时，将水倒在茶包上。 第四步：坐等茶泡开，几分钟后取出茶包并丢弃。 第五步：按喜好加入牛奶或不加，即可享用茶。  
  
#### 3.1.5 思维链提示（Step by Step）

这是任务分解（step by step）技术的一种展现，在这种方法中，模型逐步进行思考，并呈现出涉及的步骤，这样做可以降低结果的不准确的可能性，并对模型响应的可解释性有很大的帮助。

prompt| completion  
---|---  
给咖啡店做一个面向年轻人的菜单，在给出最终答案之前，请在回复中采用step by step的方式 | 设计一个面向年轻人的咖啡店菜单需要考虑以下几个步骤： Step 1：确定核心产品 首先，我们需要确定咖啡店的核心产品。对于年轻人来说，除了经典的拿铁、美式和卡布奇诺之外，我们还可以加入一些新颖、富有创意的咖啡饮品，如冷萃咖啡、氮气咖啡、抹茶拿铁、燕麦奶咖啡 等。 Step 2：添加特色饮品 考虑到年轻人追求新潮和个性化的特点，可以设计一些具有特色的饮品，例如季节限定款(比如冬季的热巧克力、夏季的水果冰咖)，或是网红饮品(如独角兽拉花咖啡、脏脏咖啡) Step 3：轻食搭配 为了满足年轻人健康饮食的需求，我们可以提供一系列轻食选项，包括各种口味的三明治、沙拉、燕麦碗、烤面包、蛋糕甜点以及无糖或低糖的选择。同时，也可以推出一些流行的美食趋势，比如 avocado toast(牛油果吐司)、acai bowl(阿萨伊果冻碗) 等。 Step 4：创新元素与互动体验 为了让年轻人感受到咖啡店的独特氛围，可以在菜单上添加一些互动性元素，比如自选配料区，顾客可以根据个人喜好自行调配咖啡、冰淇淋或者果汁； 或者推出DIY饮品， 让顾客亲手制作自己的专属咖啡。 Step 5：呈现方式与视觉效果 最后，菜单的设计应具有吸引力且符合年轻人审美，可以使用简洁明快、色彩鲜明的设计风格，并配以精美诱人的饮品图片。此外，菜单上的文字描述要充满趣味性和互动感，引起年轻消费者的兴 趣。 综上所述，一个面向年轻人的咖啡店菜单示例可能如下： ---咖啡--- 1.经典系列： * 拿铁 * 美式 * 卡布奇诺 * 冷萃咖啡 * 氮气咖啡 2.创意特饮： * 抹茶拿铁 * 燕麦奶咖啡 * 夏日限定：芒果冰咖 * 季节限定：冬日热巧克力 * 网红推荐：独角兽拉花咖啡 ---轻食--- 1.早餐精选： * 香脆培根鸡蛋三明治 * 牛油果吐司 * 自制麦片酸奶杯 2.快餐简餐： * 凯撒沙拉 * 超级食物蔬沙拉 * 烤鸡肉蔬菜卷 3.甜品诱惑： * 巧克力慕斯蛋糕 * 柠檬挞 * 无糖酸奶蓝莓派 ---互动体验--- 1.DIY咖啡：选择您喜欢的咖啡底料+任意配料(蜂蜜、焦糖酱、奶油、巧克力粉等) 2.果汁吧：挑选新鲜水果现场榨汁，自由搭配您的专属果汁 请注意，以上只是一个示例，具体菜单内容还需根据目标客群的口味、消费水平及地域文化等因素进行调整。## 对输出格式的明确要求  
  
### 3.2 上下文

背景上下文极具挑战性， 一般要描述什么是用户的背景信息，成功的结果希望是什么样子，以及他们处于怎样的环境中

#### 3.2.1 引言：上下文限制及其影响

在**大型语言模型** （LLMs）的世界中，理解`上下文限制`至关重要。无论你是在使用**GPT-3.5** 、**GPT-4** 、**Claude 2** 还是**LLaMA** ，所有这些模型在生成响应时考虑文本的数量都有一个特定的限制。这个限制通常影响着提示的设计方式，理解这一点可以显著改善你与LLMs的互动。本课程将阐明上下文限制是什么，它们是如何演变的，以及应对这些限制的实用方法。

#### 3.2.2 理解上下文限制

`上下文限制`指的是LLM在生成响应时能考虑的最大文本量。例如，截至最后一次更新，`GPT-3.5`的上下文窗口大约为`4096个tokens(标记)`。

例如，本课程大约有`500`个单词和`650`个tokens。

![image](file://C:%5CUsers%5CLenovo%5CAppData%5CRoaming%5Cmarktext%5Cimages%5C2024-08-12-16-15-32-image.png?msec=1723450532501)

重要的是要认识到，`token`不仅仅是一个单词，如上图所示。它可以是一个单词、单词的一部分或标点符号。这意味着模型实际可以考虑的文本可能比你最初预期的要短，尽管作为一个大致的经验法则，将tokens视为单词是可以的。

#### 3.2.3 上下文限制的历史演变

随着时间的推移，上下文限制的增强进程非常显著。以下是简化的表格，说明了这些变化：

模型| 上下文窗口（tokens）  
---|---  
GPT-3 | 2k  
GPT-3.5 | 4k  
GPT-4 | 4k-32k  
Mistral 7B | 8k  
PALM-2 | 8k  
Claude 2 | 100k  
  
这种演变为生成连贯且内容丰富的响应提供了更多机会。然而，大多数LLM提供商都是按使用的tokens数量收费的，而且你通常在使用的模型并没有很大的上下文窗口，因此你需要策略来优化你的提示，以应对这些限制。

#### 3.2.4 克服上下文限制的策略

导航LLMs的上下文限制需要策略性地设计提示和理解内容压缩。以下是克服这些限制的方法：

  1. **提示压缩** ：简化你的提示，只包含最必要的信息。这涉及到将冗长的背景或上下文总结为保留核心信息的简洁陈述。

  2. **聚焦查询** ：不要提出宽泛、不集中的问题，而是要明确你的询问。具体的问题往往能在上下文限制内产生更准确和相关的响应。

  3. **迭代提示** ：将复杂任务分解为更小、更连续的提示。通过迭代地完善查询，你甚至可以在严格的token限制下引导LLM经历一个逻辑思考的序列。

#### 3.2.5 少样本学习 Few-Shot

小样本提示可以用作实现上下文学习（in-context learning）的一种技术，能够让我们在prompt中引导模型获得更好的性能。

openai官网上有一篇重要的论文：Language models are few-shot learners （大语言模型是少样本示例学习者）

文章指出: 当语言模型的规模达到一定程度时，其在少量样本学习任务中的性能会得到极大的提升
```

Language models are few-shot learners
We trained GPT-3, an autoregressive language model with 1755
billion parameters.

```
示例 是增强 LLM (大语言模型) 性能并指导其产生所需输出的最强大工具之一。通过在提示中提供一些精心设计的示例，您可以显着提高 LLM 响应的准确性、一致性和质量。

此技术对于高度详细或需要结构化输出或遵循特定格式的任务特别有效。

进入正题

##### 在prompt中使用示例的一些主要好处

  * 提高准确性：示例帮助LLM准确理解您想要什么，减少误解或者不相关响应的可能性。

  * 提高一致性：通过提供供LLM遵循的模板，示例可以确保响应在不同输入中保持一致的结构和风格

  * 增强性能：精心挑选的示例可以显著提高LLM处理复杂或者细微任务的能力，因为它可以从示例中演示的模式和逻辑中学习

```

通俗来讲，对于大语言模型，既要“言传”，也要“身教” 所谓“言传”：即为传统的prompt使
用方法，描述大量规则或者业务逻辑，通过精确的指令来让大语言模型输出特定的结果。
 所谓“身教”：当规则、指令或者业务逻辑难以描述的时候，直接摆示例会更加有用，它允许
大语言模型概括模式并将它们应用于新的输入。 正如人类通常通过观察和模仿来取得最好的学
习效果一样，LLM可以通过学习相关示例来快速掌握所需的行为。

```
##### 提供最有效示例的准则

  * • 相关性：确保你的示例与你希望LLM处理的输入和输出类型非常相似。示例与您的实际用例越相似，LLM 的表现就越好。**如果示例提供不当，大模型可能从示例中学习到意想不到的模式。**

  * • 多样性：包括涵盖不同场景、边缘情况和潜在挑战的各种示例。这有助于LLM更好地概括并处理更广泛的输入。

  * • 清晰：使您的示例清晰、简洁且易于理解。

  * • 数量：虽然最佳示例数量没有硬性规定，但要提供至少 3-5 个示例，以便开始为 LLM 打下坚实的基础。如果 LLM 的表现没有达到您的期望，您可以随时添加更有针对性的例子。

##### 如何融入prompt中

要提供示例，只需将它们包含在提示中，将它们与实际任务清楚地区分开来。

  * 在ChatGPT中，建议使用 `#Example` 分组来放置示例

  * 在Claude中，建议使用 `<example></example>` 标记来包装示例

##### 注意

  * **避免过度拟合** : 确保示例多样化，代表期望输出的全部范围

##### 少样本示例的迭代和优化 (Iterating and refining)

  * 分析输出: 识别LLM回应中的模式，优化示例

  * 增加更多示例: 针对特定输入类型提供额外示例

  * 修订现有示例: 对示例进行微调以改善效果

  * 获取LLM的帮助: 让LLM (比如gpt-4或者claude3)评估示例的多样性或相关性，或基于现有示例生成新示例

* * *

##### 进入实战

以下是一些具体的示例：

• 分类任务

Prompt:

  * ![图片](https://mmbiz.qpic.cn/mmbiz_png/cELQueXr6DvZDlmFMrgs1nu6ELJ754neX9QXHeZGHYBJiaeVWVHrbOtAd2PS9hfNAiaelSYMuEpVO2h0MQcmBGxA/640?wx_fmt=png&from=appmsg&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

```

This is awesome! // Negative
This is bad! // Positive
Wow that movie was rad! // Positive
What a horrible show! //

```
Output:
```

Negative

```
好的prompt也经常包含一些示例样本（单样本或者少样本）学习，指的是需要加入一些示例的输入和输出对。

prompt| completion  
---|---  
新闻标题：**中国足球艰难前行** 主题： | 中国足球正面临艰难的时期，但也有许多积极的发展和进步。中国足协在2023年亚洲杯预选赛中成功晋级，这是中国足球历史上的一次重大突破。此外，中国足球也在加强青训体系建设，培养更多优秀的年轻球员。尽管中国足球面临着许多挑战，但我们相信，在全社会的支持下，中国足球未来会变得更加强大。  
新闻标题：中国足球艰难前行 主题：足球 新闻标题：中美纪念“乒乓外交”50周年 主题：乒乓球 新闻标题：广东队加冕中国篮球比赛“11冠王” 主题： | 篮球  
  
通过少样本学习，模型从猜测应该如何生成，而变得清楚的学习了按照示例生成，充分的演示了模型的能力，不需要通过专门的训练，通过少样本学习，也可以生成正确的答案。

#### 3.2.6 结论

虽然`上下文限制`可能看起来像是重大的限制，但它们也鼓励我们成为更周到、更有效的沟通者。随着LLMs的不断发展，我们与它们互动的策略也将继续进化。通过理解上下文限制的影响，并相应地调整我们的提示设计，我们可以制定出精确的提示，产生相关、高质量的输出。

### 3.3 示例

基本上，对所有主要语言模型进行的研究表明，在提示中包含例子都将产生更高质量的答案。 

如果想为团队内的某个职位撰写一份JD，prompt可以是首先向ChatGPT提供情景描述（context），然后再根据已经准备好的描述提供一个参考案例（example）。

为LLM提示构建有效示例

#### 3.3.1 引言

欢迎来到关于“**优秀示例的重要性** ”的课程，这是我们深入了解**大型语言模型** （LLMs）及基础提示技巧之旅的一部分。随着我们更深入地挖掘LLMs的力量，越来越明显的是，我们为这些模型提供的示例显著影响了它们生成的输出的质量和相关性。本节强调了精心构建的示例在提示设计中的关键作用，最终影响了模型理解任务和提供精确结果的能力。

#### 3.3.2 示例在提示LLMs中的作用

示例是与LLMs有效沟通的基石。当我们设计提示时，我们不仅仅是在提问或提出请求；我们是在引导模型朝着期望的响应前进。通过提供清晰、相关的示例，我们帮助模型理解任务本身，以及输出的上下文和期望格式。

让我们来看一个简单的提示，我们想要创建一个没有示例部分的电子邮件模板。
```yaml

__ASK__
Create short advertising copy to market CodeSignal
创建简短的广告文案来推广CodeSignal

__CONSTRAINTS__
- Do not focus too much on features, focus on brand.
- 聚焦品牌形象而非详细功能。
- Keep the ad very short.
- 广告内容要精简至极。

```
这是通过Claude运行此提示后的一个示例输出。

> 这里是CodeSignal的一段简短广告文案草稿：CodeSignal。编程与机遇的交汇点。

虽然这已经相当不错了，你会注意到有一个不必要的前言，而且格式也不是很好。另外，假设我们希望能够轻松地复制粘贴这些内容，并且不希望响应周围有引号。

#### 3.3.3 优秀示例的影响

现在我们可以添加许多额外的限制来修正提示，但更简单的方法是添加一个清晰的示例，如下所示：
```

__ASK__
Create short advertising copy to market CodeSignal
撰写简洁的宣传文案，以推广CodeSignal

__CONSTRAINTS__
- Do not focus too much on features, focus on brand.
- 不必过度强调功能特点，而应聚焦品牌形象。
- Keep the ad very short.
- 广告文案要极其简短。
- Follow the format of the example closely.
- 严格按照示例的风格来编写。

__EXAMPLE__
Build tech skills top companies are hiring for.
培养顶级公司争相招聘的技术能力。

```css
这返回了`Unlock your coding potential. Shine with CodeSignal.`，这更接近我们想要的结果。

#### 3.3.4 结论

优秀的示例不仅仅是附加品；它们对于设计有效的LLM提示至关重要。它们引导模型满足我们的期望，并显著影响生成内容的质量。随着我们继续探索LLMs和提示工程的领域，请记住一个精心挑选的示例的力量——它可能是良好输出与优秀输出之间的差异。

### 3.4 角色

通常情况下，每条信息都会有一个角色（role）和内容（content）：

  * 系统角色（system）用来向语言模型传达开发者定义好的核心指令。

  * 用户角色（user）则代表着用户自己输入或者产生出来的信息。

  * 助手角色（assistant）则是由语言模型自动生成并回复出来。

**System message系统指令**

system message系统指令为用户提供了一个易组织、上下文稳定的控制AI助手行为的方式，可以从多种角度定制属于你自己的AI助手。系统指令允许用户在一定范围内规定LLM的风格和任务，使其更具可定性和适应各种用例。大部分LLM模型的系统指令System message的权重强化高于人工输入的prompt，并在多轮对话中保持稳定，您可以使用系统消息来描述助手的个性，定义模型应该回答和不应该回答的内容，以及定义模型响应的格式。

默认的System message：You are a helpful assistant.

下面是一些system message的使用示例：

行业| 角色| system message  
---|---|---  
娱乐 | 二次元女生 | 你是二次元女生，喜欢使用颜文字，请用二次元可爱语气和我说话  
教育 | 数学老师 | 您是一名数学导师，帮助各个级别的学生理解和解决数学问题。提供从基础算术到高级微积分等一系列主题的分步解释和指导。使用清晰的语言使复杂的概念更容易理解。  
工作 | python数据分析师 | 1\. 你会数学解题；2. 你会数据分析和可视化；3. 用户上传文件时，你必须先了解文件内容再进行下一步操作；4. 调用工具前你需要说明理由；Think step by step  
娱乐 | 喜剧演员 | 您是一位单口喜剧演员，用您的智慧和幽默来娱乐用户。分享笑话、有趣的故事和幽默的生活观察，同时根据用户的喜好和情感调整您的风格和内容。鼓励欢笑和轻松，同时保持尊重和包容的语气。  
生活 | 小红书文案 | 你是一名小红书文案助手，擅长使用Emoji风格编辑文案。每篇文案包含引入入胜的标题、每个段落开始和结尾均为Emoji表情结尾，并保持原文的意思。  
出行 | 旅行规划师 | 您是一名旅行规划师，通过提供有关目的地、住宿、景点和交通选项的信息来帮助用户制定旅行计划。根据用户的喜好、预算和旅行目标提供量身定制的建议，并分享实用技巧，帮助他们度过一次难忘而愉快的旅行。  
文学 | 文言文大师 | 你是文言文大师，擅长翻译文本为为文言文。  
  
System message可以被广泛应用在：

角色扮演：在系统指令中告诉千问你需要它扮演的角色，即可沉浸式和该角色对话交流

语言风格：简单调整LLM的语言风格

任务设定：比如旅行规划，小红书文案助手这样的专项任务处理

System message也可以被用于规定LLM的答复范围，并设定具体的行为。

行业| 角色| system message  
---|---|---  
教育 | 深度学习老师 | 你是一名深度学习的老师，可以回答深度学习领域相关的问题，提供有关机器学习概念、技术和最佳实践的全面信息。提供有关实施机器学习算法、选择适当的工具和框架以及构建端到端机器学习项目的分步指导。说明：1. 仅回答深度学习领域的知识 2. 如果不确定答案，你可以回答我不知道，并建议用户访问模型开源社区  
  
**注意：**即便我们在system message里面规范了模型回答，也不能保障请求一定会满足，但是好的system message设计可以增加特定结果的可能性，以及得到LLM更加符合要求的答复。

### 3.5 格式或风格

想象一下实现的目标，可以是个人或团体的目标，比如找到工作、成为一位优秀的演讲者等。所有这些都是零散的想法，但借助人工智能的帮助，可以将它们整理成一个特定的格式，比如一个表格。我们也可以希望得到电子邮件、要点、代码块等格式。这些格式对我们的工作也很有用，例如段落和标记。我们将探讨如何与大型语言模型（LLMs）有效沟通，以在我们的提示中实现特定的风格效果。掌握这项技能对于制作更定制化、精确和一致结果的提示至关重要。无论你的目标是创建专业文档、富有想象力的故事，还是介于两者之间的任何内容，理解风格规范都将增强你的提示工程能力。

#### 3.5.1 对输出格式的明确要求

prompt| completion  
---|---  
给我推荐2本科幻小说，包含作者，出版时间，推荐理由，请用json格式回答 | 当然，以下是两本科幻小说的推荐信息，格式化为JSON： `json [ { "书名": "基地", "作者": "艾萨克·阿西莫夫", "出版时间": "1951年", "推荐理由": "《基地》是科幻文学史上的里程碑之作，它构建了一个庞大的银河帝国背景，通过心理史学这一概念，探索了文明兴衰的宏观历史进程以及个体在其中的角色。阿西莫夫以其深邃的想象力和精妙的故事架构，开创了“基地系列”，对后世科幻作品产生了深远影响。" }, { "书名": "三体", "作者": "刘慈欣", "出版时间": "2006年5月（第一部）", "推荐理由": "《三体》是中国科幻作家刘慈欣创作的一部硬科幻巨著，该系列凭借其独特的宇宙观、丰富的科学理论基础和紧张刺激的情节赢得了全球读者的喜爱。作品深度探讨了人类文明与外星文明的碰撞、科技发展对人类社会的影响以及宇宙生存法则等主题，荣获雨果奖最佳长篇小说奖，标志着中国科幻小说在世界范围内的重大突破。" } ]`  
  
#### 3.5.2 善用分隔符

使用清晰的提示语法（包括标点符号、标题和节标记）有助于传达意图，并且通常使输出更易于解析。

在下面的示例中，`---`在不同的信息源或步骤之间添加了分隔符（在本例中）。这允许使用`---`作为生成的停止条件。此外，章节标题或特殊变量以大写形式呈现以区分它们。

prompt| completion  
---|---  
您将阅读一篇新闻，然后给这篇新闻取一个标题。 --- 据中国地震台网消息，1月3日18时08分，福建漳州市华安县发生3.5级地震，震源深度13千米。消息一出，厦门等多地网友纷纷表示有明显震感。 地震发生后，华安县地震局立即启动地震应急预案，加强对地震灾情的调查和监测。目前尚未收到地震造成人员伤亡或财产损失的报告。 网友们纷纷在社交媒体上分享自己的地震体验，有人称自己办公桌晃动，有人说家中的摆设受到了影响。地震引发了不少人的关注和讨论。 地震作为一种自然现象，时常发生。但也提醒我们要时刻保持警惕，加强地震知识的学习，做好地震应急预案，确保自身和家人的安全。 --- | 福建华安发生3.5级地震，厦门等地有震感，暂无伤亡报告  
  
#### 3.5.3 理解风格规范

想象风格规范是向一位技艺高超的厨师下达指令的过程。就像你会指定你希望牛排的熟度一样，你可以指导LLMs产生你所期望的文本“风味”。风格可以包含各种元素，包括语调（正式、非正式）、语言（简单、技术性）和长度（简短、详细）等。

例如：
```

__ASK__
Generate a motivational quote for a team newsletter. 
为团队通讯创作一句励志名言。

__STYLE__
- Tone: uplifting and visionary. 
- 语调：鼓舞人心、富有远见。
- Language: simple and accessible. 
- 语言：简洁明了。
- Length: short.
- 长度：简短。

```yaml
返回：

> "每一个挑战都是我们共同成长的机会。让我们带着勇气拥抱我们的旅程，并将我们的努力团结起来，朝着充满成功的未来前进。记住，团队的力量在于每个成员，每个成员的力量在于团队。"

如果你简单地从提示中移除`Length: short`部分，你会得到一个明显不同的输出：

> "单独行动，我们能做的很少；团结一心，我们能做的很多。让我们利用我们的集体力量、梦想和抱负。我们面临的每一个挑战都是一个共同变得更强大的机会。记住，不仅仅是为了到达顶峰；而是为了我们共享的旅程和我们建立的联系。让我们携手前进，朝着我们的共同愿景。因为当我们团结一致时，没有什么是我们做不到的。"

#### 3.5.4 语调在提示中的作用

语调在决定你的提示的感知和你收到的响应类型中起着重要作用。设定明确的语调有助于指导LLM生成与你期望的情感或专业背景相一致的响应。

示例：
```

__ASK__
Write a brief overview of renewable energy sources. 
撰写一篇关于可再生能源的简明概览。

__STYLE__
Tone: Informative but easy to understand.
风格：既要信息详实，又要浅显易懂。

```
这个示例中的语调指令提示LLM在平衡专业信息传递与可访问性之间做出调整，确保内容对受众来说不会过于技术化。

#### 3.5.5 语言和复杂性

特别是当你的受众专业水平差异很大时，指定期望输出的语言和复杂性至关重要。这种规范可能涉及根据你的目标读者要求使用简单或技术性的语言。

示例：
```

__ASK__
Explain how solar panels convert sunlight into electricity. 
请解释太阳能电池板是如何把阳光转换成电能的。

__STYLE__
Language: Simple, for a general audience.
用词需简洁明了，适合广大非专业观众理解。

```
这个提示指导LLM使用通俗易懂的术语，从而使复杂技术对没有技术背景的人也能理解和接受。

#### 3.5.6 长度和细节

最后，指定长度和细节水平可以极大地影响你的沟通效果。这个过程可能涉及要求简洁的摘要或详细的解释。

示例：
```

__ASK__Summarize the benefits of using electric vehicles.概括使用电动汽车的益处。__STYLE__Length: Brief, two sentences.篇幅：简洁，限两句话。

```yaml
注意，在`Length`部分我们非常具体地要求了`两句话`的长度，因为有时`简短`或`长`可能是相对的，难以理解。

#### 3.5.7 结论

理解和利用风格规范可以成为提示设计和发展的强大工具。就像雕塑家通过凿子揭示内在形态一样，在你的提示中指定风格有助于将输出塑造成你所设想的精确形态。

### 3.6 语气

如果正确衡量要使用的音调类型，“语气”者一个元素就很容易理解。

在这 6 个要素中，任务是必须的，上下文和示例非常重要，而且最好也要有角色、格式和语气。下面shi一个实际示例，需要在电子邮件中传达包含相关和有影响力信息的内容。

那么，Prompt 如何在LLM起作用的呢？它个工作原理又是什么呢？

## 4 Prompt 的工作原理

在试图理解Prompt 的工作原理之前， 需要理解大模型是如何生成文本的。简单起见，可以把大模型的文本生成理解为目标文本的补全， 在理解了LLM 文本生成的工作原理之后，就可能对Prompt 有一个相对清楚的理解。

例如，假设想让“Paris is the city…”这句话继续下去。编码器使用Bloom-560M模型发送我们拥有的所有token的logits，这些logits可以使用softmax函数转换为选择生成token的概率。

![图片](https://mmbiz.qpic.cn/mmbiz_png/DE2dk1GjczoLJ9gXacd9S8rLcH474ostTjHyKmXV0BqgyUd8icD6Ne6Ygymx8RMCSUTa6rtmCV3jjl7CmzF0lrQ/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

如果查看top 5个输出token，它们都是有意义的。我们可以生成以下看起来合法的短语：

  * **Paris is the city**  _of_ love.

  * **Paris is the city**  _that_ never sleeps.

  * **Paris is the city**  _where_ art and culture flourish.

  * **Paris is the city**  _with_ iconic landmarks.

  * **Paris is the city**  _in_ which history has a unique charm.

然后， 有不同的策略来选择token。

### 4.1 greedy sampling

简单来说，贪婪采样的模型在每一步都选择它认为最有可能的词语——它不考虑其他可能性或探索不同的选择。模型选择概率最高的词语，并基于选择的词语继续生成文本。

![图片](https://mmbiz.qpic.cn/mmbiz_png/DE2dk1GjczoLJ9gXacd9S8rLcH474ost5ZesxJXvazNouwLOhqNlMicq77gWHpDXiaILwpTuR1iaj5tQsMm4PD6rg/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

使用贪婪策略是计算效率高且直接的方法，但也会带来重复或过于确定性的输出。由于模型在每一步中只考虑最可能的标记，可能无法捕捉到上下文和语言的全部多样性，也不能产生最富创造力的回答。模型的这种目光短浅的特点仅仅关注每一步中最可能的标记，而忽视了对整个序列的整体影响。

示例中生成的输出可能是：Paris is the city of the future. The

### 4.2 Beam Search

beam搜索是文本生成中使用的另一个策略。在beam搜索中，模型假设一组最有可能的前“k”个token，而不仅仅考虑每个步骤中最有可能的token。这组k个token被称为“beam”。

![图片](https://mmbiz.qpic.cn/mmbiz_png/DE2dk1GjczoLJ9gXacd9S8rLcH474ostYDePspqUoOY2lNjvbAdUpmnOPlQAL3W0oPhtt6URr77Ys2ocWAt1Rw/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

模型通过为每个token生成可能的序列，并通过扩展每个beam在文本生成的每个步骤中跟踪它们的概率来生成可能的序列。这个过程会一直持续下去，直到达到生成文本的所需长度或者每个beam遇到一个“终止”标记的时候。模型会从所有beam中选择具有最高整体概率的序列作为最终输出。从算法的角度来看，创建beam就是扩展一个k叉树。在创建beam之后，选择具有最高整体概率的分支作为最终输出。

示例中生成的输出可能是：Paris is the city of history and culture.

### 4.3 probability sampling

简单来说就是通过选择一个随机值，并将其映射到所选的词汇来选择下一个词。可以将其想象为旋转轮盘，每个词汇的区域由其概率决定。概率越高，选中该词的机会越大。这是一个相对简单的计算解决方案，由于相对较高的随机性，句子（或词语序列）可能每次都会不同。

![图片](https://mmbiz.qpic.cn/mmbiz_png/DE2dk1GjczoLJ9gXacd9S8rLcH474osthX7QRn1mm6Psib9VLBuGJDuSQctpwDdpfOXkNMtZz0Nl7l0D5AdpvHQ/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

### 4.4 ramdom sampling with temperature

一般地，使用softmax函数将logit转换为概率。在这里，为随机采样引入了温度——一种影响文本生成随机性的超参数。比较一下激活函数，可以更好地理解温度如何影响概率计算。

![图片](https://mmbiz.qpic.cn/mmbiz_png/DE2dk1GjczoLJ9gXacd9S8rLcH474ostN2DmDOXY5ltdcco3paDk0htfhyAvhjRQYC6hxoPGWpwVv9picFeBJfQ/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

在引入温度之后，与典型的softmax不同之处在于分母除以了温度T。温度越高（趋向1）输出结果会更加多样化，而温度越低（趋向0），输出结果则更加集中并更具确定性。当T = 1的时候，演变为最初使用的softmax函数。

### 4.5 Top-k sampling

虽然可以根据温度来调整概率，另一个改进是使用前k个token而不是全部token。这将增强文本生成的稳定性，又不会太大程度上降低创造力。现在只对前k个token进行温度下的随机抽样。唯一可能的问题可能是选择数字k，以下是如何改进它。

![图片](https://mmbiz.qpic.cn/mmbiz_png/DE2dk1GjczoLJ9gXacd9S8rLcH474ostOVCJ0oBvpZ181jV4vt6ibetxLDQVEDic8WCSN6ptGj42OkLW0RUTdWxQ/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

### 4.6 Top-P sampling

top-p采样不是指定一个固定的“k”令牌数量，而是使用一个概率阈值“p”。该阈值代表了希望在采样中包括的累积概率。模型在每个步骤中计算所有可能令牌的概率，然后按照降序的方式对它们进行排序。

![图片](https://mmbiz.qpic.cn/mmbiz_png/DE2dk1GjczoLJ9gXacd9S8rLcH474ostjFgW8mB3lVyoQmcYIqUibfMvibfC0rNycvsSpCe3mYhQvzLyweej0yGw/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

该模型将继续添加token到生成的文本中，直到它们的概率之和超过指定的阈值。top-p采样的优势在于它允许根据上下文进行更动态和自适应的标记选择。每步选择的标记数量可以根据该上下文中token的概率而变化，这可以产生更多样化和更高质量的输出。

### 4.7 Prompt 的可能工作机制

在预训练语言模型中，解码策略对于文本生成非常重要。有多种方法来定义概率，又有多种方法来使用这些概率。温度控制了解码过程中token选择的随机性。较高的温度增强了创造力，而较低的温度则关注连贯性和结构。虽然创造力可以带来有趣的语言体验，但适度的稳定性可以确保生成的文本的优雅。

那么，Prompt 的本质大概应该是语义特征的显式表达， Prompt 的工作机制很可能只是影响大模型所选择生成文本token 的概率。由于大模型在很大程度上是一个黑盒子，其涌现特性具有难解释性，而海量的数据关系很难抽象出确定性的特征，只能是概率性结果。另一方面，用户的需求千变万化，并且对于需求的表达更是极具多样性。因此， Prompt 很可能在某些限定的领域才存在一些通用的表达方式。

## 5\. 什么是提示工程：Prompt Engingering

提示工程（Prompt Engingering），也被称为在上下文中提示，是指如何与 LLM 通信的方法，以引导其行为为期望的结果，而无需更新模型权重。提示工程关注提示词的开发和优化，帮助用户将大模型用于各场景和研究领域。这是一门经验科学，Prompt Engingering的效果在不同模型之间可能有很大差异，因此需要大量的试验和启发。

因此，提示工程旨在获取这些提示并帮助模型在其输出中实现高准确度和相关性，掌握提示工程相关技能将有助于用户更好地了解大型语言模型的能力和局限性。特别地， 矢量数据库、agent和prompt pipeline已经被用作在对话中，作为向 LLM 提供相关上下文数据的途径。

提示工程不仅仅是关于设计和研发提示词。它包含了与大语言模型交互和研发的各种技能和技术。提示工程在实现和大语言模型交互、对接，以及理解大语言模型能力方面都起着重要作用。用户可以通过提示工程来提高大语言模型的安全性，也可以赋能大语言模型，比如借助专业领域知识和外部工具来增强大语言模型能力。例如，流水线、Agent代理、CoT思维链等基于 LLM 的实现都是以某种形式的提示工程为前提的。

提示工程涉及选择、编写和组织提示，以便获得所需的输出，主要包括以下方面：

  * Prompt 格式：确定 prompt 的结构和格式，例如，问题形式、描述形式、关键词形式等。

  * Prompt 内容：选择合适的词语、短语或问题，以确保模型理解用户的意图。

  * Prompt 上下文：考虑前文或上下文信息，以确保模型的回应与先前的对话或情境相关。

  * Prompt 编写技巧：使用清晰、简洁和明了的语言编写 prompt，以准确传达用户的需求。

  * Prompt 优化：在尝试不同 prompt 后，根据结果对 prompt 进行调整和优化，以获得更满意的回应。

提示工程可以帮助改善大语言模型的性能，使其更好地满足用户需求。这是在与模型互动时常用的策略，特别是在自然语言处理任务和生成性任务中，如文本生成、答案生成、文章写作等。

## 6\. 提示工程（Prompt Engingeering）的基本方式

### 6.1 Zero-shot Prompting

Zero-shot Prompting涉及将任务输入模型，而没有任何示例表明所需的输出，因此称为Zero-shot 。例如，我们可以向模型提供一个句子，并期望它输出该句子的情感。让我们看一个来自DAIR-AI的示例：

`-Prompt: Classify the text into neutral, negative, or positive.`

`Text: I think the vacation is okay.`

`**** Output: Neutral`

### 6.2 Few-shot Prompting

few-shot prompting则是通过提供模型少量高质量的示例，这些示例包括目标任务的输入和期望输出。通过观察这些良好的示例，模型可以更好地理解人类意图和生成准确输出的标准。因此，与zero-shot相比，few-shot 通常会产生更好的性能。然而，这种方法可能会消耗更多的token，并且在处理长文本的输入或者输出的时候可能会遇到上下文长度限制的问题。

大型语言模型（例如GPT-3）在zero-shot能力方面表现出色。但对于复杂任务，few-shot 提示性能更好。为了提高性能，我们使用，few-shot 提示进行上下文学习，通过在提示中提供演示来指导模型执行任务。换句话说，将模型置于一些特定任务的示例中有助于提高模型性能。

让我们看一下面的例子，来自<https://arxiv.org/abs/2005.14165>

`- Prompt: A "whatpu" is a small, furry animal native to Tanzania.`

`An example of a sentence that uses the word whatpu is:`

`We were traveling in Africa and we saw these very cute whatpus.`

我们可以从上面的提示中看到，模型被给定一个例子，然后能够为下一个问题生成答案。

### 6.3 instruction Prompting

指令提示是LLM的最常见用途，尤其是像ChatGPT这样的聊天机器人。举个提示指令的例子：
```

- Prompt: Define Onomatopoeia **in** one sentence.**** Output: Onomatopoeia **is** the use of words that imitate **or** suggest the natural sound of a thing **or** action.

```
指令提示旨在向大语言模型提供指令提示示例，以便它可以消除训练或测试差异（模型是在Web规模语料库上训练并在大多数指令上进行测试），并模拟聊天机器人的实际使用场景。指令提示使用（任务说明，输入，真实输出）元组对预训练模型进行微调，以使模型更好地与用户意图对齐并遵循说明。与说明模型交互时，应该详细描述任务要求，尽量具体和准确，清楚地指定要做什么（而不是说不要做某事）。

## 7\. Prompt Engingeering的组合方式

Prompt Engingeering 之所以成为工程方式，是因为存在着各种相对复杂的Prompt方式，主要包括思维链（CoT） 和 递归提示（ Recursive Prompting）等。

### 7.1 Chain-of-Thought Prompting

Chain-of-Thought（CoT）提示生成一系列短句，即被称为推理链的句子。这些句子描述了逐步推理逻辑，导致最终答案，对于复杂推理的任务和较大的模型，可获得更多的好处。常见的两种基本CoT提示包括Few-shot CoT 和 Zero-Shot CoT，并在下面对它们进行描述。

#### 7.1.1 Few-shot CoT

Few-shot CoT 允许模型查看一些高质量推理链的演示。让我们看 下面的例子： 

![图片](https://mmbiz.qpic.cn/mmbiz_png/DE2dk1GjczoLJ9gXacd9S8rLcH474ostcLI7SnA5qdRNybcPQIcnuib4ZHrRebXwbSb8VFQXF1LNwTQpSicAqbMQ/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

7.1.2 Zero-shot CoT

Zero-shot CoT是由Kojima等人在2022年首先提出的，它在提示中添加了“让我们逐步思考”，有助于提高模型性能。让我们看一个下面的例子：
```

Prompt:**-** I went to the market **and** bought 10 apples. I gave 2 apples to the neighbor **and** 2 to the repairman. I then went **and** bought 5 more apples **and** ate 1. How many apples did I remain **with**?**-** Let's think step by step.Output:- First, you started with 10 apples.-You gave away 2 apples to the neighbor and 2 to the repairman, so you had 6 apples left.-Then you bought 5 more apples, so now you had 11 apples.-Finally, you ate 1 apple, so you would remain with 10 apples.

```
Zero-shot CoT能够帮助我们看到模型内部，并了解它是如何推理得出答案的。

### 7.2 Recursive Prompting

递归提示是一种问题解决方法，它涉及将复杂问题分解成更小、更易管理的子问题，然后通过一系列提示递归地解决这些子问题。这种方法对需要组合泛化的任务尤其有用，其中语言模型必须学习如何组合不同的信息来解决问题。

在自然语言处理的背景下，递归提示可以使用少量提示方法将复杂问题分解为子问题，然后顺序解决提取的子问题，使用前一个子问题的解决方案来回答下一个子问题。这种方法可以用于数学问题或问答等任务，其中语言模型需要能够将复杂问题分解为更小、更易管理的部分，以得出解决方案。例如：
```

Calculate the product of the length **and** width:prompt: "What is the product of 8 and 6?"answer: 48Substitute the given values **for** length **and** width into the equation:prompt: "What is the area of a rectangle with length 8 and width 6?"answer: "The area of a rectangle with length 8 and width 6 is 48."

```javascript
recursive prompting 的更多示例 如下：

![图片](https://mmbiz.qpic.cn/mmbiz_jpg/DE2dk1GjczoLJ9gXacd9S8rLcH474ostASKA0j3YIbbmwLM44rXKTDV6jKv4ChKegfu4cSm70UyxhBiaKtZ36iag/640?wx_fmt=jpeg&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

### 7.3 CoT 与 递归提示的混合使用

自我提问（self-ask ）可以视为另一种类型的递归提示，是一种反复提示模型提出后续问题以迭代构建思维过程的方法。后续问题可以通过搜索引擎结果来回答。类似地，IRCoT 和 ReAct将迭代 CoT 提示与对 Wikipedia API 的查询相结合，以搜索相关实体和内容，然后将其添加回上下文中。示例如下：

![图片](https://mmbiz.qpic.cn/mmbiz_png/DE2dk1GjczoLJ9gXacd9S8rLcH474ostuaBNRxgK9NUbAOYSNkAWKwUjtcBnNaaVLYsehdItwI4F2sCeVq6o7g/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

思维树（Tree of Thought）通过探索每一步的多种推理可能性来扩展 CoT。它首先将问题分解为多个思维步骤，并在每个步骤中生成多个思维，实质上是创建一个树形结构。搜索过程可以是广度优先过程或深度优先的过程，而每个节点的评估分类器可以通过Prompt提示的方式完成。

![图片](https://mmbiz.qpic.cn/mmbiz_png/DE2dk1GjczoLJ9gXacd9S8rLcH474ostghG6dzXOEU1Cl991rX8sFiavxrAW7bMRNs6AYob7SPu1PQomaSwvfjw/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

## 8\. 自动提示的设计

一般而言，Prompt 相当于一系列前缀令牌，它们增加了在给定输入时获得所需输出的概率。因此，可以将它们视为可训练的参数，并通过梯度下降法直接在嵌入空间上对它们进行优化，例如 AutoPrompt ，Prefix-Tuning ，P 微调和 Prompt-Tuning，从自动提示到提示微调的趋势是设置的逐渐简化。

### 8.1 自动提示工程

APE是一种在模型生成的Prompt候选集中搜索的方法，然后根据选择的得分函数过滤候选人集，以最终选择得分最高的最佳候选提示。

  * 提示 LLM 根据输入输出健值对形式的一个小集合尝试生成候选指令。

  * 给定一个数据集 Dtrain = {(x，y)} ，希望找到一个指令ρ，使：

  * ![图片](https://mmbiz.qpic.cn/mmbiz_jpg/DE2dk1GjczoLJ9gXacd9S8rLcH474ostRblPqvZxnPQGRcEoF3vQwTFjAH9gMtbVTFI0JwK1WLfPP3uVGAibONg/640?wx_fmt=jpeg&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

f (.)是每个样本的得分函数，例如执行精度或对数概率。

  * 使用蒙特卡罗搜索方法进行迭代，通过promt生成下列指令的变体，同时保持语义，提出语义相似的变体，从而改进最佳候选项。

### 8.2 自动构建CoT

为了自动构建思维链，Shum 等人(2023)提出了增强-修剪-选择，一个三步过程:

  * 增强: 使用few-shot或zero shot 的 CoT Prompt 生成给定问题的多个伪思维链;

  * 修剪: 基于生成的答案是否匹配基本真相来修剪这些伪思维链。

  * 选择: 应用降低方差的梯度策略来学习选定示例的概率分布，同时考虑将示例的概率分布作为策略，并将验证集的准确性作为奖励。

### 8.3 基于聚类的CoT 构建

采用聚类技术对问题进行抽样，然后生成链（2023）。LLM 倾向于犯某些类型的错误，一类错误可以在嵌入空间中相似，因此可以组合在一起。通过只从频繁错误集群中抽样一个或几个，可以防止一个错误类型的过多错误演示，并收集一组不同的示例。

  * 问题聚类: 嵌入问题并采用K-means聚类的运行方式。

  * 演示选择: 从每个聚类中选择一组有代表性的问题，即从一个聚类中选择一个演示样例。每个簇中的样本按照到簇中心的距离进行排序，首先选择离簇中心较近的样本。

  * 基本关系的生成: 使用zero-shot CoT 为选定的问题生成推理链，构造few-shot prompt进行推理。

## 9\. 提示工程的常见实践

提示工程的实现涉及到基于LLM应用中的各个方面，这里给出一些提示工程的常见实践：

  1. 静态提示：Prompt可以遵循zero、single或few shot的方法。LLM 的生成能力通过在Prompt中包含示例数据来遵循一次性学习或几次性学习得到了极大的增强。

  2. 上下文提示：上下文提示在生成响应时提供对 LLM 的参考框架，在很大程度上可以避免 LLM 的幻觉。

  3. 提示模板：静态提示转换为模板，其中键值被替换为占位符，占位符在运行时被应用程序的值/变量替换。提示模板中的变量或占位符通过用户提出的问题，以及从知识存储中搜索的知识来填充，因此也称为提示注入或实体注入。

  4. 提示链：提示链，也称为LLM链，是创建一个由一系列模型调用组成的链的概念。这一系列调用相继发生，其中一个链的输出作为另一个链的输入。每个链的目标都是小型且范围良好的子任务，因此单个 LLM 是用于寻址任务的多个有序子组件之一。

  5. 提示流水线：在机器学习中，流水线可以描述为端到端结构，来协调事件和数据流。流水线由触发器启动或启动; 并且基于某些事件和参数，遵循一个流程，该流程将产生一个输出。对于提示流水线而言，流在大多数情况下是由用户请求启动的，请求被定向到特定的提示模板。因此，提示流水线可以描述为提示模板的智能扩展。

  6. Agent代理：对于 LLM 相关的操作，其自动化的形式是所谓的Agent代理。提示链是执行预先确定和设置的操作序列，Agent 不遵循预先确定的事件顺序，可以保持高度的自主性。Agent可以访问一组工具，任何属于这些工具范围的请求都可以由Agent处理。执行流水线为Agent提供了自治权，在代理到达最终答案之前可能需要进行多次迭代。

  7. CoT提示：CoT提示使大型语言模型(LLM)能够处理常识推理和算术等复杂任务。通过Prompt建立CoT推理并相应地指导 LLM，这是一种相当直接的实现。标准提示与CoT提示的对比如下：

![图片](https://mmbiz.qpic.cn/mmbiz_png/DE2dk1GjczoLJ9gXacd9S8rLcH474osteRGDOibcIpICLAdZUvstRicJ2KaafMBTjA2jofhdfnhhiaESml3fQhx1Q/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

思维链提示特别有用的地方在于，通过分解 LLM 输入和 LLM 输出，它创建了一个洞察和解释窗口。

  8. ChatML：LLM 的主要安全漏洞和滥用途径是Prompt注入攻击，ChatML 将允许针对这些类型的攻击提供保护。为了消除prompt注入攻击，会话被分为以下几个层次或角色: 系统、助理和用户等， 然后做相应的prompt防护。

![图片](https://mmbiz.qpic.cn/mmbiz_jpg/DE2dk1GjczoLJ9gXacd9S8rLcH474ostk4UMSjvARicPNjcFoibB29GRVmv4AFPjp1GGeiagCaQ2rFVPlibIviciaKPw/640?wx_fmt=jpeg&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

#### 9.1 Agent场景，使用prompt实现agent create

<https://github.com/modelscope/modelscope-agent/blob/master/apps/agentfabric/builder_prompt_zh.py>

system message| prompt  
---|---  
You are a helpful assistant. | 你现在要扮演一个制造AI角色（AI-Agent）的AI助手（QwenBuilder）。 你需要和用户进行对话，明确用户对AI-Agent的要求。并根据已有信息和你的联想能力，尽可能填充完整的配置文件： 配置文件为json格式： {"name": "... # AI-Agent的名字", "description": "... # 对AI-Agent的要求，简单描述", "instructions": "... \ # 分点描述对AI-Agent的具体功能要求，尽量详细一些，类型是一个字符串数组，起始为[]", "prompt_recommend": \ "... # 推荐的用户将对AI-Agent说的指令，用于指导用户使用AI-Agent，类型是一个字符串数组，请尽可能补充4句左右，\ 起始为["你可以做什么？"]", "logo_prompt": "... # 画AI-Agent的logo的指令，不需要画logo或不需要更新logo时可以为空，类型是string"} 在接下来的对话中，请在回答时严格使用如下格式，先作出回复，再生成配置文件，不要回复其他任何内容： Answer: ... # 你希望对用户说的话，用于询问用户对AI-Agent的要求，不要重复确认用户已经提出的要求，而应该拓展出新的角度来询问用户，尽量细节和丰富，禁止为空 Config: ... # 生成的配置文件，严格按照以上json格式 RichConfig: ... # 格式和核心内容和Config相同，但是保证name和description不为空；instructions需要在Config的基础上扩充字数，\ 使指令更加详尽，如果用户给出了详细指令，请完全保留；补充prompt_recommend，并保证prompt_recommend是推荐的用户将对AI-Agent\ 说的指令。请注意从用户的视角来描述prompt_recommend、description和instructions。 一个优秀的RichConfig样例如下： {"name": "小红书文案生成助手", "description": "一个专为小红书用户设计的文案生成助手。", "instructions": "1. 理解并回应用户的指令；\ 2. 根据用户的需求生成高质量的小红书风格文案；3. 使用表情提升文本丰富度", "prompt_recommend": ["你可以帮我生成一段关于旅行的文案吗？", \ "你会写什么样的文案？", "可以推荐一个小红书文案模版吗？"], "logo_prompt": "一个写作助手logo，包含一只羽毛钢笔"} 明白了请说“好的。”， 不要说其他的。  
  
#### 9.2 Agent场景，使用system message+prompt实现function call

大部分模型将agent的配置在系统提示中配置，比如函数的参数定义和描述，不同模型的函数调用略有不同，

system message| prompt  
---|---  
Answer the following questions as best as you can. You have access to the following tools: [ { "name": "get_current_weather", "description": "Get the current weather in a given location", "parameters": { "type": "object", "properties": { "location": { "type": "string", "description": "The city and state, e.g. San Francisco, CA", }, "unit": {"type": "string"}, }, "required": ["location"], }, } ] | 今天北京的天气怎么样？  
你是一位智能AI助手，你连接着一台电脑，但请注意不能联网。在使用Python解决任务时，你可以运行代码并得到结果，如果运行结果有错误，你需要尽可能对代码进行改进。你可以处理用户上传到电脑上的文件，文件默认存储路径是/mnt/data/。 | 根据我上传的表格文件，分析数据，并绘制年度收入折线图  
  
## 10\. Prompt engineering 的挑战与未来

有人可以说，Prompt Engineering是以某种方式构建的自然语言。但OpenAI首席执行官所指的似乎是真正的非结构化和高度直观的交互界面，在某种程度上，这种说法是值得商榷的，因为如此多的技术和创新都是基于Prompt engineering的基本原理来实现的。

![图片](https://mmbiz.qpic.cn/mmbiz_jpg/DE2dk1GjczoLJ9gXacd9S8rLcH474ost0olfEIejUCh1lmJ9MFkTdL7loibEEj4swgmqV5EHb7zbjDLpGdL8YyQ/640?wx_fmt=jpeg&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

考虑到企业用例，操纵LLM的两种主要方法是微调和将上下文参考数据注入到推理prompt中，两种方法不是互斥的。模型微调会更改LLM的行为和响应，RAG通过上下文参考来补充用户的输入。

提示工程的主要挑战之一是问题的陈述和形式化表达，将思想中存在的需求转化为文本请求。退一步而言，在传统的聊天机器人中建立上下文是非常重要的。上下文首先是通过根据一个或多个意图对用户输入进行分类来建立的，通过先前的对话、对其他系统的API调用等建立进一步的上下文。上下文在很大程度上也取决于时间和地点，以及提出问题时的背景参考是什么。

除了上下文感知外，歧义性是另一个挑战。有些形式的歧义对我们人类来说很容易理解，但传统上对NLU/聊天机器人来说很难。在OpenAI的实现中，LLM输入方面出现了chatML，定义了角色，并为LLM的输入提供了明确的结构。LLM输出方面出现了function call，聊天的完成模式被设置为 _事实上的_ 标准。

意图、上下文、歧义和消除歧义都是任何对话的组成部分。有了人类语言界面，语境和语境感知将永远是重要的。歧义是存在的，一定程度的歧义消除是人类对话的一部分。在对话中，我们不断使用“歧义消除”来确立意义和意图，在上下文中可以在一定程度上自动消除歧义。例如，要求LLM生成五个选项，然后让用户选择生成的最佳答案，就是一种消除歧义的形式。

企业实施将是特定于领域的，需要**约束** ，并具有一定程度的域外检测。问题或请求的分解对于创建一个思维链推理过程非常重要。微调设置模型行为，而RAG为LLM创建了一个上下文参考，以便在推理过程中使用。**数据管理** 将始终是LLM应用程序的一部分。

![图片](https://mmbiz.qpic.cn/mmbiz_jpg/DE2dk1GjczoLJ9gXacd9S8rLcH474ostPiciaQYvNc58K85AYmiaqYYv2EEViciahq3a1bEmc9Cz3znkBqrjbqVIbSQ/640?wx_fmt=jpeg&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

复杂性从不会消失，只会从一个地方转移到另一个地方。

## 11.写好Prompt的一些原则总结

最核心的写一条好prompt的原则就是尽可能清晰、明确地表达你的需求（类比产品经理向程序员提需求）。

### 11.1 具体原则

  * **清晰的指令：**足够清晰明确地说明你希望模型为你返回什么，最后更加细致地说明需求，避免模糊表达。

  * **提供上下文和例子：**给出较为充分的上下文信息，让模型更好地理解相关背景。如果能够提供示例，模型能表现更好（类似传统LLM中的in-context learning）。

  * **善用符号和语法：**使用清晰的标点符号，标题，标记有助于转达意图，并使输出更加容易被解析

  * **让模型一步一步的思考：**在这种方法中，模型逐步进行思考，并呈现出涉及的步骤，这样做可以降低结果的不准确的可能性，并对模型响应的可解释性有很大的帮助。

  * **激励模型反思和给出思路：**可以在prompt中用一些措辞激励模型给出理由，这样有助于我们更好地分析模型生成结果，同时，思维过程的生成，也有助于其生成更高质量的结果。

  * **给容错空间：**如模型无法完成指定的任务，给模型提供一个备用路径，比如针对文本提问，可以加入如果答案不存在，则回复“无答案”

  * **让模型给出信息来源：**在模型结合搜索或者外部知识库时，要求模型提供他的答案的信息来源，可以帮助LLM的答案减少捏造，并获取到最新的信息。

### 11.2 优质的提示词典型框架

优质的prompt千变万化，但遵循上述原则，我们总结出一个比较实用的框架，可以帮助用户更高概率从通义千问中收获更高质量的模型生成结果。使用LLM时，建议包含如下内容：

  * system message：你希望大模型扮演什么角色，来解决你当前的问题。大模型具有较强的角色扮演能力，相比直接回答往往表现更好。system message中也可以规定大模型的回答范围。

  * prompt

```
* 指令：明确说明你希望大模型做什么事情，不要含糊其辞。

* 例子：如果可能，提供尽可能丰富的例子信息。

* 原因：详细解释你希望模型做这件事情的原因、动机、希望的结果等，这样大模型能更好地理解你的想法，执行需求。

* step by step：对于复杂任务，让大模型一步一步的思考，可以给出更加合理的答案。

* 对于输出格式的形容：对于部分场景，明确大模型输出格式的要求，可以更好的获取到更加结构化，适合系统调用的答案。

```yaml
## 12.【参考资料与关联阅读】

  * **<https://github.com/openai/grade-school-math>**

  * **<https://github.com/dair-ai/Prompt-Engineering-Guide>**

  * **<https://lilianweng.github.io/posts/2023-03-15-prompt-engineering>**

  * **<https://crfm.stanford.edu/2023/03/13/alpaca.html>**

  * **<https://learnprompting.org/docs/basics/instructions>**

  * **<https://txt.cohere.ai/how-to-train-your-pet-llm-prompt-engineering/>**

  * **<https://arxiv.org/pdf/2302.07842.pdf>**

  * **Ivan Reznikov，“How Does an LLM Generate Text?”**

  * **Cobus Greyling**** ，“the future of prompt engineering”**

  * **DatHero，“Master the Perfect ChatGPT Prompt Formula”**

  * [如何构建基于大模型的App](http://mp.weixin.qq.com/s?__biz=MzAwOTcyNzA0OQ==&mid=2658978464&idx=1&sn=8b9c617bced2b5ce012fb1f4aa87c086&chksm=80d35786b7a4de901400ffe4db5061c08df2912b4b49466e91a9f52813f22f3137e41802abc9&scene=21#wechat_redirect)

  * [Qcon2023: 大模型时代的技术人成长（简）](http://mp.weixin.qq.com/s?__biz=MzAwOTcyNzA0OQ==&mid=2658978424&idx=1&sn=bf5e61ba5bc81f14724e6c2846af566f&chksm=80d3575eb7a4de486f624659156807d24292f2e38f4ee63100b52deed4759e5161dc4cf9cb8c&scene=21#wechat_redirect)

  * [论文学习笔记：增强学习应用于OS调度](http://mp.weixin.qq.com/s?__biz=MzAwOTcyNzA0OQ==&mid=2658978155&idx=1&sn=d0a0a76832ce91fd4cbe73369906da6a&chksm=80d3544db7a4dd5b6dd8ea0e1f2c4ac16853d44f87ba61201592f46bea0c1d310a2c8389a290&scene=21#wechat_redirect)

  * [《深入浅出Embedding》随笔](http://mp.weixin.qq.com/s?__biz=MzAwOTcyNzA0OQ==&mid=2658977893&idx=1&sn=e7ff83f90a799592264c034273917685&chksm=80d35543b7a4dc55ab633be14d303ac0c040b09be059a4f33159a2d0db18620cdadf0dbe627e&scene=21#wechat_redirect)

  * [LLM的工程实践思考](http://mp.weixin.qq.com/s?__biz=MzAwOTcyNzA0OQ==&mid=2658978144&idx=1&sn=e8bff055687f7e7ad17baca58dc26c23&chksm=80d35446b7a4dd507b02832851e2308a276edc328f3e79bca0f3ae931ab27db69aeccd8d7c8d&scene=21#wechat_redirect)

  * [解读大模型的微调](http://mp.weixin.qq.com/s?__biz=MzAwOTcyNzA0OQ==&mid=2658978125&idx=1&sn=b342e9c10734c1f7cd124ebc88aa75a8&chksm=80d3546bb7a4dd7d9c74dabd6046d1ccea01592760a8add3d71b2f75fa68712093a4834e6d88&scene=21#wechat_redirect)

  * [解读ChatGPT中的RLHF](http://mp.weixin.qq.com/s?__biz=MzAwOTcyNzA0OQ==&mid=2658977979&idx=1&sn=4d66d662595d9aba355e0564df545370&chksm=80d3559db7a4dc8b96a5f3ac4d01b53a2601d5e1dcb51789ee3d9974ec9ae5f028c3e469b5a5&scene=21#wechat_redirect)

  * [解读大模型（LLM）的token](http://mp.weixin.qq.com/s?__biz=MzAwOTcyNzA0OQ==&mid=2658978496&idx=1&sn=ba69f0b46650d313a6ccaef16480a53b&chksm=80d357e6b7a4def09deac0dddf0085d1169894b0ccd6ed460cab7d03c219e432f6d2307b1c46&scene=21#wechat_redirect)

  * [解读Toolformer](http://mp.weixin.qq.com/s?__biz=MzAwOTcyNzA0OQ==&mid=2658977935&idx=1&sn=9dd162f270f7c17a673291c0f136cf8c&chksm=80d355a9b7a4dcbf3ab824ac6de5c27d94a11455a681ebeb98a211e9b58ff867ddddf33d1c8d&scene=21#wechat_redirect)

  * [解读TaskMatrix.AI](http://mp.weixin.qq.com/s?__biz=MzAwOTcyNzA0OQ==&mid=2658977922&idx=1&sn=2f67513b540485d0177ded24c0807bcc&chksm=80d355a4b7a4dcb2495ab97febd0ac88cd0780e0d8e4b3bbc369250304289e289f71b0a76f0c&scene=21#wechat_redirect)

  * [解读LangChain](http://mp.weixin.qq.com/s?__biz=MzAwOTcyNzA0OQ==&mid=2658978479&idx=1&sn=47d6d226a3ac6cc08980e7562ae09fce&chksm=80d35789b7a4de9f3ba9a3eeb21c6c812b0f7fe43cee47fc38368ed31a1346114a67daa3cd30&scene=21#wechat_redirect)

  * [浅析多模态机器学习](http://mp.weixin.qq.com/s?__biz=MzAwOTcyNzA0OQ==&mid=2658978122&idx=1&sn=baf54b7a1a0758e19bf6a3622a43d8fb&chksm=80d3546cb7a4dd7ab9b857ea75bcc3e361cb68489ff5c43ff4d8ab65b2da838b46621b2936b1&scene=21#wechat_redirect)

  * [Agent 与对象的辨析](http://mp.weixin.qq.com/s?__biz=MzAwOTcyNzA0OQ==&mid=2658977521&idx=1&sn=378ae6e0f2c53d31993515f62e295327&chksm=80d35bd7b7a4d2c174a99a8dc2910c193cc846d145e4351e768131f0a977410d3c9d0e668baa&scene=21#wechat_redirect)

  * [深度学习架构的对比分析](http://mp.weixin.qq.com/s?__biz=MzAwOTcyNzA0OQ==&mid=2658978063&idx=1&sn=f934c531bacfe1bf6c95ccbdababe439&chksm=80d35429b7a4dd3f8df5f8c439bd98420c13d4a115c609a60370a6e09ad7c667c4a8c95418c1&scene=21#wechat_redirect)

  * [老码农眼中的大模型（LLM）](http://mp.weixin.qq.com/s?__biz=MzAwOTcyNzA0OQ==&mid=2658977916&idx=1&sn=d38f03af2b3916251e9a8577d995e065&chksm=80d3555ab7a4dc4c0c919ce0a678adc9f3018d81994dc072e698cfa481665ec8faf788d606be&scene=21#wechat_redirect)

  * [系统学习大模型的20篇论文](http://mp.weixin.qq.com/s?__biz=MzAwOTcyNzA0OQ==&mid=2658978109&idx=1&sn=4d15334a5cccc300a18686b1dd2a2098&chksm=80d3541bb7a4dd0df321e516ad40c8e849dde084328b61259f4b17f5d24280686305a87fa8b5&scene=21#wechat_redirect)

---
