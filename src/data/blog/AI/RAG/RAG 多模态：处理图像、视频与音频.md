---
title: RAG 多模态：处理图像、视频与音频
author: Joekma
pubDatetime: 2026-05-11T00:00:00.000+08:00
modDatetime: 2026-05-11T00:00:00.000+08:00
slug: rag-multimodal
description: '深入讲解RAG系统的多模态扩展，包括图像、视频、音频等多种数据类型处理与检索技术。'
tags:
  - RAG
  - 多模态
  - 图像处理
  - 视频检索
  - 音频处理
draft: false
series: RAG
seriesOrder: 1
language: zh-CN
---

## 概述

传统 RAG 主要处理文本数据，但现实世界中的信息往往是多模态的。本篇将介绍如何扩展 RAG 系统以支持图像、视频、音频等多种模态数据的处理与检索。

### 多模态 RAG 架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                       多模态 RAG 架构                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐        │
│  │  图像   │    │  视频   │    │  音频   │    │  文档   │        │
│  │  输入   │    │  输入   │    │  输入   │    │  输入   │        │
│  └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘        │
│       │              │              │              │              │
│       ▼              ▼              ▼              ▼              │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐        │
│  │  视觉   │    │  视频   │    │  语音   │    │  文本   │        │
│  │  嵌入   │    │  处理   │    │  识别   │    │  嵌入   │        │
│  └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘        │
│       │              │              │              │              │
│       ▼              ▼              ▼              ▼              │
│  ┌─────────────────────────────────────────────────────────┐      │
│  │                    统一向量空间                           │      │
│  │   [图像向量] [视频向量] [音频向量] [文本向量]             │      │
│  └─────────────────────────────────────────────────────────┘      │
│                              │                                    │
│                              ▼                                    │
│  ┌─────────────────────────────────────────────────────────┐      │
│  │                    多模态检索引擎                         │      │
│  └─────────────────────────────────────────────────────────┘      │
│                              │                                    │
│                              ▼                                    │
│  ┌─────────────────────────────────────────────────────────┐      │
│  │                    多模态生成模型                         │      │
│  └─────────────────────────────────────────────────────────┘      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

![多模态 RAG 将图像、视频、音频和文档分别经过 OCR、ASR、抽帧、摘要、嵌入和元数据对齐后进入统一检索索引，并用多模态模型生成带来源答案](./images/rag-multimodal-architecture-figure-01.png)

## 图像模态处理

### 图像加载与预处理

```python
import os
from PIL import Image

class ImageLoader:
    def __init__(self):
        self.supported_formats = [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp"]

    def load_image(self, image_path):
        if not any(image_path.endswith(ext) for ext in self.supported_formats):
            raise ValueError(f"不支持的图像格式: {image_path}")

        image = Image.open(image_path)

        return {
            "path": image_path,
            "size": image.size,
            "mode": image.mode,
            "format": image.format
        }

    def load_directory(self, directory):
        images = []
        for root, dirs, files in os.walk(directory):
            for file in files:
                if any(file.endswith(ext) for ext in self.supported_formats):
                    image_path = os.path.join(root, file)
                    images.append(self.load_image(image_path))

        return images

# 使用示例
# loader = ImageLoader()
# images = loader.load_directory("./images")
# print(f"加载了 {len(images)} 张图片")
```

### 图像描述生成

```python
from langchain_openai import ChatOpenAI
from transformers import BlipProcessor, BlipForConditionalGeneration
from PIL import Image
import torch

class ImageCaptioner:
    def __init__(self, model_name="Salesforce/blip-image-captioning-base"):
        self.processor = BlipProcessor.from_pretrained(model_name)
        self.model = BlipForConditionalGeneration.from_pretrained(model_name)

    def generate_caption(self, image_path, max_length=100):
        image = Image.open(image_path).convert("RGB")

        inputs = self.processor(image, return_tensors="pt")

        out = self.model.generate(
            **inputs,
            max_length=max_length,
            num_beams=5,
            no_repeat_ngram_size=2
        )

        caption = self.processor.decode(out[0], skip_special_tokens=True)

        return caption

    def batch_generate(self, image_paths, batch_size=8):
        captions = []

        for i in range(0, len(image_paths), batch_size):
            batch = image_paths[i:i+batch_size]

            for path in batch:
                caption = self.generate_caption(path)
                captions.append({
                    "path": path,
                    "caption": caption
                })

            print(f"处理进度: {min(i+batch_size, len(image_paths))}/{len(image_paths)}")

        return captions

captioner = ImageCaptioner()
captions = captioner.batch_generate(["./img1.jpg", "./img2.png"])
```

### 视觉嵌入模型

```python
from transformers import CLIPProcessor, CLIPModel
import torch

class VisualEmbedder:
    def __init__(self, model_name="openai/clip-vit-base-patch32"):
        self.processor = CLIPProcessor.from_pretrained(model_name)
        self.model = CLIPModel.from_pretrained(model_name)

    def embed_image(self, image_path):
        image = Image.open(image_path).convert("RGB")

        inputs = self.processor(images=image, return_tensors="pt")

        with torch.no_grad():
            image_embeddings = self.model.get_image_features(**inputs)

        return image_embeddings[0].numpy()

    def embed_text(self, text):
        inputs = self.processor(text=[text], return_tensors="pt", padding=True)

        with torch.no_grad():
            text_embeddings = self.model.get_text_features(**inputs)

        return text_embeddings[0].numpy()

    def compute_similarity(self, image_path, text):
        image_vec = self.embed_image(image_path)
        text_vec = self.embed_text(text)

        similarity = torch.nn.functional.cosine_similarity(
            torch.tensor(image_vec),
            torch.tensor(text_vec),
            dim=0
        )

        return similarity.item()

embedder = VisualEmbedder()
image_vector = embedder.embed_image("photo.jpg")
text_vector = embedder.embed_text("a beautiful sunset")

print(f"图像向量维度: {len(image_vector)}")
print(f"文本向量维度: {len(text_vector)}")
```

### 多模态向量数据库存储

```python
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
import chromadb

class MultimodalVectorStore:
    def __init__(self, persist_directory="./multimodal_db"):
        self.embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
        self.client = chromadb.PersistentClient(persist_directory)

        self.text_collection = self.client.create_collection("texts")
        self.image_collection = self.client.create_collection("images")

    def add_text(self, texts, metadatas, ids):
        embeddings = self.embeddings.embed_documents(texts)

        self.text_collection.add(
            embeddings=embeddings,
            documents=texts,
            metadatas=metadatas,
            ids=ids
        )

    def add_images(self, image_paths, captions, image_embeddings, metadata_list):
        for i, (path, caption, embedding, meta) in enumerate(
            zip(image_paths, captions, image_embeddings, metadata_list)
        ):
            self.image_collection.add(
                embeddings=[embedding],
                documents=[caption],
                metadatas=[{
                    **meta,
                    "image_path": path,
                    "type": "image"
                }],
                ids=[f"img_{i}"]
            )

    def search_text(self, query, k=5):
        query_embedding = self.embeddings.embed_query(query)

        results = self.text_collection.query(
            query_embeddings=[query_embedding],
            n_results=k
        )

        return results

    def search_images(self, query, k=5):
        query_embedding = self.embeddings.embed_query(query)

        results = self.image_collection.query(
            query_embeddings=[query_embedding],
            n_results=k
        )

        return results

    def multimodal_search(self, query, k=5):
        text_results = self.search_text(query, k=k)
        image_results = self.search_images(query, k=k)

        combined_results = {
            "texts": text_results,
            "images": image_results
        }

        return combined_results

vectorstore = MultimodalVectorStore()
```

## 视频模态处理

### 视频帧提取

```python
import cv2
from pathlib import Path

class VideoFrameExtractor:
    def __init__(self, fps=1):
        self.fps = fps

    def extract_frames(self, video_path, output_dir, fps=1):
        Path(output_dir).mkdir(parents=True, exist_ok=True)

        video_capture = cv2.VideoCapture(video_path)

        video_fps = video_capture.get(cv2.CAP_PROP_FPS)
        frame_interval = int(video_fps / fps)

        frame_count = 0
        saved_count = 0

        while True:
            ret, frame = video_capture.read()

            if not ret:
                break

            if frame_count % frame_interval == 0:
                output_path = Path(output_dir) / f"frame_{saved_count:04d}.jpg"
                cv2.imwrite(str(output_path), frame)
                saved_count += 1

            frame_count += 1

        video_capture.release()

        return saved_count

    def extract_keyframes(self, video_path, num_keyframes=10):
        video_capture = cv2.VideoCapture(video_path)

        total_frames = int(video_capture.get(cv2.CAP_PROP_FRAME_COUNT))

        keyframe_indices = [
            int(i * total_frames / num_keyframes)
            for i in range(num_keyframes)
        ]

        keyframes = []
        frame_count = 0

        while True:
            ret, frame = video_capture.read()

            if not ret:
                break

            if frame_count in keyframe_indices:
                keyframes.append(frame)

            frame_count += 1

        video_capture.release()

        return keyframes

extractor = VideoFrameExtractor()
num_frames = extractor.extract_frames("video.mp4", "./frames", fps=1)
keyframes = extractor.extract_keyframes("video.mp4", num_keyframes=20)

print(f"提取了 {num_frames} 帧")
print(f"提取了 {len(keyframes)} 个关键帧")
```

### 视频描述生成

```python
# 视频描述生成：实际方案是按帧提取后用图像描述模型
# 这里使用 BLIP 处理关键帧并拼接为视频描述
from transformers import BlipProcessor, BlipForConditionalGeneration
import torch
from PIL import Image

class VideoCaptioner:
    """视频描述生成器：对关键帧逐帧生成描述后拼接。"""

    def __init__(self, model_name="Salesforce/blip-image-captioning-base"):
        self.processor = BlipProcessor.from_pretrained(model_name)
        self.model = BlipForConditionalGeneration.from_pretrained(model_name)

    def caption_frame(self, frame, max_length=100):
        """为单帧生成描述。"""
        if isinstance(frame, str):
            image = Image.open(frame).convert("RGB")
        else:
            image = frame if isinstance(frame, Image.Image) else Image.fromarray(frame)

        inputs = self.processor(image, return_tensors="pt")
        with torch.no_grad():
            output = self.model.generate(
                **inputs,
                max_length=max_length,
                num_beams=5,
                no_repeat_ngram_size=2
            )
        return self.processor.decode(output[0], skip_special_tokens=True)

    def caption_video(self, frames, max_length=100):
        """为整个视频（关键帧列表）生成综合描述。"""
        frame_captions = [self.caption_frame(f, max_length) for f in frames]
        # 简单拼接作为视频描述
        return " ".join(frame_captions)

    def caption_video_with_timestamps(self, frames, timestamps, max_length=100):
        """为每个关键帧生成带时间戳的描述。"""
        captions = []
        for frame, ts in zip(frames, timestamps):
            captions.append({
                "timestamp": ts,
                "caption": self.caption_frame(frame, max_length),
            })
        return captions

# 使用示例
# captioner = VideoCaptioner()
# keyframes = [...]  # 关键帧列表（numpy 数组或 PIL Image）
# video_caption = captioner.caption_video(keyframes)
```

### 视频向量存储

```python
class VideoVectorStore:
    def __init__(self, client, embedder):
        self.client = client
        self.embedder = embedder
        self.collection = client.create_collection("videos")

    def add_video(self, video_path, video_caption, frame_captions, metadata):
        """添加视频到向量库。

        Args:
            video_path: 视频文件路径
            video_caption: 视频整体描述
            frame_captions: 关键帧描述与向量字典 {caption: vector} 或 [(caption, vector), ...]
            metadata: 视频元数据
        """
        video_embedding = self.embedder.embed_text(video_caption)

        self.collection.add(
            embeddings=[video_embedding],
            documents=[video_caption],
            metadatas=[{
                **metadata,
                "video_path": video_path,
                "type": "video",
                "frame_count": len(frame_captions)
            }],
            ids=[f"video_{hash(video_path)}"]
        )

        for i, (caption, frame_vec) in enumerate(frame_captions.items()):
            self.collection.add(
                embeddings=[frame_vec],
                documents=[caption],
                metadatas=[{
                    "video_path": video_path,
                    "frame_index": i,
                    "type": "video_frame"
                }],
                ids=[f"video_{hash(video_path)}_frame_{i}"]
            )

    def search_videos(self, query, k=5):
        query_embedding = self.embedder.embed_text(query)

        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=k,
            where={"type": "video"}
        )

        return results
```

## 音频模态处理

### 音频加载与转录

```python
import speech_recognition as sr
from pydub import AudioSegment

class AudioProcessor:
    def __init__(self):
        self.recognizer = sr.Recognizer()

    def load_audio(self, audio_path):
        audio = AudioSegment.from_file(audio_path)

        return {
            "duration": len(audio) / 1000,
            "channels": audio.channels,
            "sample_rate": audio.frame_rate,
            "path": audio_path
        }

    def transcribe_audio(self, audio_path, language="zh-CN"):
        with sr.AudioFile(audio_path) as source:
            audio_data = self.recognizer.record(source)

        text = self.recognizer.recognize_google(audio_data, language=language)

        return text

    def transcribe_with_timestamps(self, audio_path, chunk_duration=30):
        audio = AudioSegment.from_file(audio_path)
        total_duration = len(audio) / 1000

        transcriptions = []

        current_time = 0
        while current_time < total_duration:
            end_time = min(current_time + chunk_duration, total_duration)

            chunk = audio[current_time * 1000:end_time * 1000]
            chunk_path = f"/tmp/audio_chunk_{current_time}.wav"
            chunk.export(chunk_path, format="wav")

            with sr.AudioFile(chunk_path) as source:
                audio_data = self.recognizer.record(source)

            try:
                text = self.recognizer.recognize_google(audio_data)
                transcriptions.append({
                    "start": current_time,
                    "end": end_time,
                    "text": text
                })
            except:
                transcriptions.append({
                    "start": current_time,
                    "end": end_time,
                    "text": ""
                })

            current_time = end_time

        return transcriptions

processor = AudioProcessor()
audio_info = processor.load_audio("audio.mp3")
transcriptions = processor.transcribe_with_timestamps("audio.mp3")
```

### Whisper 语音转文本

```python
import whisper

class WhisperTranscriber:
    def __init__(self, model_name="base"):
        self.model = whisper.load_model(model_name)

    def transcribe(self, audio_path, language=None):
        result = self.model.transcribe(
            audio_path,
            language=language,
            fp16=False
        )

        return {
            "text": result["text"],
            "language": result["language"],
            "segments": result["segments"]
        }

    def transcribe_with_timestamps(self, audio_path, language=None):
        result = self.model.transcribe(
            audio_path,
            language=language,
            word_timestamps=True,
            fp16=False
        )

        segments = []
        for segment in result["segments"]:
            words = []
            for word in segment.get("words", []):
                words.append({
                    "word": word["word"],
                    "start": word["start"],
                    "end": word["end"]
                })

            segments.append({
                "start": segment["start"],
                "end": segment["end"],
                "text": segment["text"],
                "words": words
            })

        return segments

transcriber = WhisperTranscriber(model_name="base")
result = transcriber.transcribe_with_timestamps("speech.wav")

print(f"转录结果: {result['text']}")
for segment in result["segments"][:3]:
    print(f"[{segment['start']:.1f}s - {segment['end']:.1f}s]: {segment['text']}")
```

### 音频特征提取与嵌入

```python
import librosa
import numpy as np
import torch
from transformers import Wav2Vec2Model, Wav2Vec2Processor

class AudioEmbedder:
    def __init__(self, model_name="facebook/wav2vec2-base-960h"):
        self.processor = Wav2Vec2Processor.from_pretrained(model_name)
        self.model = Wav2Vec2Model.from_pretrained(model_name)

    def extract_features(self, audio_path):
        audio, sr = librosa.load(audio_path, sr=16000)

        inputs = self.processor(audio, sampling_rate=16000, return_tensors="pt")

        with torch.no_grad():
            outputs = self.model(**inputs)

        embeddings = outputs.last_hidden_state.mean(dim=1)

        return embeddings[0].numpy()

    def embed_transcription(self, text, embedding_model):
        return embedding_model.embed_query(text)

    def create_audio_document(self, audio_path, transcription, embedding_model):
        audio_embedding = self.extract_features(audio_path)

        text_embedding = self.embed_transcription(transcription, embedding_model)

        combined_embedding = (audio_embedding + text_embedding) / 2

        return {
            "audio_path": audio_path,
            "transcription": transcription,
            "audio_embedding": audio_embedding,
            "text_embedding": text_embedding,
            "combined_embedding": combined_embedding
        }

# 使用示例
# embedder = AudioEmbedder()
# transcription_text = "示例转录文本"
# embeddings_model = OpenAIEmbeddings(model="text-embedding-3-small")
# audio_doc = embedder.create_audio_document("audio.wav", transcription_text, embeddings_model)
```

### 音频向量存储

```python
class AudioVectorStore:
    def __init__(self, client, embeddings_model):
        self.client = client
        self.embeddings_model = embeddings_model
        self.collection = client.create_collection("audio")

    def add_audio(self, audio_doc, metadata):
        self.collection.add(
            embeddings=[audio_doc["combined_embedding"]],
            documents=[audio_doc["transcription"]],
            metadatas=[{
                **metadata,
                "audio_path": audio_doc["audio_path"],
                "type": "audio"
            }],
            ids=[f"audio_{hash(audio_doc['audio_path'])}"]
        )

    def search_audio(self, query, k=5):
        query_embedding = self.embeddings_model.embed_query(query)

        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=k
        )

        return results

# 使用示例
# import chromadb
# client = chromadb.PersistentClient("./audio_db")
# embeddings_model = OpenAIEmbeddings(model="text-embedding-3-small")
# audio_store = AudioVectorStore(client, embeddings_model)
```

## 多模态检索

### 跨模态检索

```python
class CrossModalRetriever:
    def __init__(self, image_vectorstore, text_vectorstore, audio_vectorstore, image_embedder):
        self.image_store = image_vectorstore
        self.text_store = text_vectorstore
        self.audio_store = audio_vectorstore
        self.image_embedder = image_embedder

    def retrieve(self, query, modalities=["text", "image", "audio"], k=5):
        results = {"texts": [], "images": [], "audios": []}

        if "text" in modalities:
            text_results = self.text_store.search_text(query, k=k)
            results["texts"] = text_results

        if "image" in modalities:
            image_results = self.image_store.search_images(query, k=k)
            results["images"] = image_results

        if "audio" in modalities:
            audio_results = self.audio_store.search_audio(query, k=k)
            results["audios"] = audio_results

        return results

    def image_to_text_search(self, image_path, k=5):
        """以图搜文：使用图像向量在文本库中检索。"""
        image_embedding = self.image_embedder.embed_image(image_path)
        # 注意：需要 Chroma 集合直接支持按向量查询
        results = self.text_store.text_collection.query(
            query_embeddings=[image_embedding],
            n_results=k
        )
        return results

    def text_to_image_search(self, text_query, k=5):
        """以文搜图：使用文本向量在图像库中检索。"""
        text_embedding = self.image_embedder.embed_text(text_query)
        results = self.image_store.image_collection.query(
            query_embeddings=[text_embedding],
            n_results=k
        )
        return results

# 使用示例
# retriever = CrossModalRetriever(image_store, text_store, audio_store, image_embedder)
# multimodal_results = retriever.retrieve(
#     query="日落风景",
#     modalities=["text", "image"],
#     k=5
# )
```

### 多模态相似度融合

```python
class MultimodalFusion:
    def __init__(self, weights=None):
        self.weights = weights or {
            "text": 0.4,
            "image": 0.3,
            "audio": 0.3
        }

    def fuse_scores(self, results_by_modality):
        fused = {}

        for modality, results in results_by_modality.items():
            if not results:
                continue

            weight = self.weights.get(modality, 0)

            for i, item in enumerate(results):
                score = (1 / (1 + i)) * weight

                key = item.get("id", item.get("path", i))

                if key not in fused:
                    fused[key] = {
                        "item": item,
                        "score": score
                    }
                else:
                    fused[key]["score"] += score

        sorted_results = sorted(
            fused.values(),
            key=lambda x: x["score"],
            reverse=True
        )

        return [r["item"] for r in sorted_results]

fusion = MultimodalFusion(weights={
    "text": 0.5,
    "image": 0.3,
    "audio": 0.2
})

fused_results = fusion.fuse_scores({
    "text": text_results,
    "image": image_results,
    "audio": audio_results
})
```

## 多模态生成

### 多模态上下文构建

```python
class MultimodalContextBuilder:
    def __init__(self):
        self.captioner = ImageCaptioner()
        self.transcriber = WhisperTranscriber()

    def build_context(self, retrieved_items):
        context_parts = []

        for item in retrieved_items:
            modality = item.get("type", "text")

            if modality == "text":
                context_parts.append(f"[文本] {item.get('content', '')}")

            elif modality == "image":
                caption = item.get("caption", item.get("description", ""))
                context_parts.append(f"[图像] {caption}")

            elif modality == "video":
                description = item.get("description", "")
                context_parts.append(f"[视频] {description}")

            elif modality == "audio":
                transcription = item.get("transcription", item.get("content", ""))
                context_parts.append(f"[音频] {transcription}")

        return "\n\n".join(context_parts)

context_builder = MultimodalContextBuilder()
context = context_builder.build_context(retrieved_items)
```

### 多模态回答生成

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate

class MultimodalGenerator:
    def __init__(self, model="gpt-4o"):
        self.llm = ChatOpenAI(model=model)

        self.prompt = PromptTemplate.from_template(
            """你是一个多模态助手，可以理解和回答关于文本、图像、视频和音频的问题。

基于以下多模态上下文信息回答用户的问题。

多模态上下文：
{context}

用户问题：{question}

请根据上下文提供准确的回答。如果涉及特定媒体，请明确指出。
"""
        )

        self.chain = self.prompt | self.llm

    def generate(self, context, question):
        return self.chain.invoke({
            "context": context,
            "question": question
        })

    def generate_with_media_refs(self, context, question):
        response = self.generate(context, question)

        media_refs = []

        if "[图像]" in context:
            media_refs.append("images")

        if "[视频]" in context:
            media_refs.append("videos")

        if "[音频]" in context:
            media_refs.append("audios")

        return {
            "answer": response.content,
            "referenced_media": media_refs
        }

generator = MultimodalGenerator(model="gpt-4o")
answer = generator.generate(context, "这张图片描述了什么场景？")
```

## 实战：构建多模态 RAG 系统

```python
import cv2
import chromadb
from langchain_openai import OpenAIEmbeddings

class MultimodalRAGSystem:
    """多模态 RAG 系统：整合图像、视频、音频处理与检索。"""

    def __init__(self):
        self.image_loader = ImageLoader()
        self.video_extractor = VideoFrameExtractor()
        self.audio_processor = AudioProcessor()
        self.image_captioner = ImageCaptioner()

        self.image_embedder = VisualEmbedder()
        self.text_embedder = OpenAIEmbeddings(model="text-embedding-3-small")
        self.audio_embedder = AudioEmbedder()
        self.transcriber = WhisperTranscriber()

        # Chroma 客户端
        self.client = chromadb.PersistentClient("./multimodal_db")

        # 各模态向量库
        self.text_vectorstore = MultimodalVectorStore("./text_db")
        self.image_vectorstore = MultimodalVectorStore("./image_db")
        self.video_vectorstore = VideoVectorStore(self.client, self.text_embedder)
        self.audio_vectorstore = AudioVectorStore(self.client, self.text_embedder)

        # 跨模态检索器
        self.retriever = CrossModalRetriever(
            image_vectorstore=self.image_vectorstore,
            text_vectorstore=self.text_vectorstore,
            audio_vectorstore=self.audio_vectorstore,
            image_embedder=self.image_embedder
        )

        self.context_builder = MultimodalContextBuilder()
        self.generator = MultimodalGenerator()

    def process_image(self, image_path):
        caption = self.image_captioner.generate_caption(image_path)
        embedding = self.image_embedder.embed_image(image_path)
        self.image_vectorstore.add_images(
            [image_path], [caption], [embedding], [{"source": image_path}]
        )

    def process_video(self, video_path):
        frames = self.video_extractor.extract_keyframes(video_path, num_keyframes=20)

        captions = []
        for i, frame in enumerate(frames):
            frame_path = f"/tmp/frame_{i}.jpg"
            cv2.imwrite(frame_path, frame)
            caption = self.image_captioner.generate_caption(frame_path)
            captions.append(caption)

        self.video_vectorstore.add_video(
            video_path,
            " ".join(captions),
            {i: cap for i, cap in enumerate(captions)},
            {"source": video_path}
        )

    def process_audio(self, audio_path):
        transcription = self.transcriber.transcribe(audio_path)
        audio_doc = self.audio_embedder.create_audio_document(
            audio_path,
            transcription["text"],
            self.text_embedder
        )
        self.audio_vectorstore.add_audio(
            audio_doc, {"source": audio_path}
        )

    def query(self, question, modalities=None):
        modalities = modalities or ["text", "image", "audio"]
        retrieved = self.retriever.retrieve(question, modalities=modalities, k=5)
        context = self.context_builder.build_context(
            self.flatten_results(retrieved)
        )
        answer = self.generator.generate(context, question)
        return {"answer": answer, "sources": retrieved}

    def flatten_results(self, results):
        all_items = []
        for modality in ["texts", "images", "audios"]:
            if modality in results:
                items = results[modality]
                if items and "documents" in items:
                    docs = items["documents"]
                    metas = items.get("metadatas", [{}] * len(docs))
                    for i, doc in enumerate(docs):
                        all_items.append({
                            "type": modality[:-1] if modality.endswith("s") else modality,
                            "content": doc,
                            "metadata": metas[i] if i < len(metas) else {}
                        })
        return all_items

# 使用示例
# system = MultimodalRAGSystem()
# system.process_image("photo.jpg")
# system.process_video("video.mp4")
# system.process_audio("speech.wav")
# result = system.query("描述这个视频的内容", modalities=["video", "text"])
# print(result["answer"])
```

## 最佳实践

### 多模态处理选择指南

| 场景 | 推荐方案 | 说明 |
|------|---------|------|
| **图像为主** | CLIP + BLIP | 视觉理解能力强 |
| **视频为主** | VideoCLIP + 帧提取 | 兼顾时序信息 |
| **音频为主** | Whisper + Wav2Vec2 | 高质量转录 |
| **混合场景** | 统一嵌入 + 融合 | 灵活组合 |

### 性能优化

```python
class MultimodalOptimizer:
    def __init__(self):
        self.cache = {}

    def parallel_process(self, items, process_fn, max_workers=4):
        from concurrent.futures import ThreadPoolExecutor

        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            results = list(executor.map(process_fn, items))

        return results

    def cache_embeddings(self, key, embedding):
        self.cache[key] = embedding

    def get_cached(self, key):
        return self.cache.get(key)

optimizer = MultimodalOptimizer()
```

## 总结

| 模态 | 处理工具 | 嵌入模型 |
|------|---------|---------|
| **图像** | PIL, OpenCV | CLIP, BLIP |
| **视频** | OpenCV, FFmpeg | VideoCLIP |
| **音频** | Librosa, Whisper | Wav2Vec2 |
| **文本** | LangChain | OpenAI Embeddings |

多模态 RAG 扩展了传统文本 RAG 的能力，可以处理更加丰富的多媒体信息。

## 后续内容

本系列后续将深入讲解：
- RAG 与 Agents 结合
- 生产级 RAG 最佳实践
- RAG 安全与隐私保护
