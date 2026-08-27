# Selah (סלאח) — Senior Project Proposal

> **Hebrew:** *to lift up / reflect*  
> **Course:** Computer Science Department Senior Project  
> **Student:** Zane Harrison  
> **Advisor:** Professor Thatcher, Dr. Ruby

---

## 📌 Project Overview

**Selah** is a conversational Al chatbot designed to provide emotionally intelligent responses to users discussing personal struggles, decision-making, and relational challenges. The system will analyze user input, detect emotional context, and generate supportive responses modeled after healthy counseling communication patterns. It will also include a journaling aspect where users can openly write, but includes the option to bring in the AI to talk about their entrée.


> ⚠️ **Disclaimer:** The goal of Selah is **not** to replace professional mental health therapists, but rather to serve as an accessible, non-judgmental first step for individuals who may be hesitant to seek counseling. The platform guides conversations toward reflection, encouragement, and seamlessly recommends professional help or crisis hotlines when appropriate.

---

## 🎯 Motivation & Problem Statement

Many people currently turn to general-purpose AI models (such as ChatGPT) for life decisions, mental struggles, and relational advice. However, standard LLMs lack fine-tuned emotional intelligence, crisis guardrails, and persistent longitudinal context. 

Selah provides a safe outlet for users who might never pursue traditional therapy, bridging the gap between passive self-reflection and professional support. It serves as an auxiliary tool designed to improve quality of life and encourage proactive wellness.

---

## 🏗️ Architecture Overview

### **1. Frontend**
* **Framework:** React Native (cross-platform web and native mobile application architecture).
* **UI/UX:** Modern chat interface displaying real-time messaging, conversation history, user profiling metrics, text editor, and settings.

### **2. Backend**
* **Core:** Python backend
* **Responsibilities:** API request orchestration, prompt engineering, session management, and routing user input to the ML inference pipeline.

### **3. Database**
* **System:** Firebase (Firestore / Auth).
* **Storage:** User profiles, encrypted conversation history, session logs, and emotional state dynamics over time.

### **4. Machine Learning & Safety Engine**
* **Base Model:** Fine-tuned `Mistral-7B-Instruct-v0.3` configured for supportive, safe, and empathetic dialogic turns.
* **NLP Classification:** Custom intent and sentiment classification algorithm for emotional profiling.
* **Safety Protocols:** Pattern recognition for self-harm or violence triggers that override standard dialog to present immediate crisis hotline resources.

---

## 💡 Technical Skill Set & Learning Goals

### **Existing Knowledge Utilized**
* Initial web application architecture and API routing with Python backends.
* Modular project structure scalable to native platforms.

### **New Technologies & Concepts to Acquire**
* Cross-platform component architecture using **React Native**.
* Deployment, fine-tuning, and API integration of open-source Large Language Models (LLMs).
* Implementation of safety classifiers and dynamic context windowing.
