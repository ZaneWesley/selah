# Selah (סלאח) — Senior Project Proposal

> **Hebrew:** *to lift up / reflect*  
> **Course:** Computer Science Department Senior Project  
> **Student:** Zane Harrison  
> **Advisor:** Professor Glas ([bglas@uu.edu](mailto:bglas@uu.edu))  

---

## 📌 Project Overview

**Selah** is a conversational AI chatbot designed to provide emotionally intelligent, context-aware responses for individuals navigating personal struggles, decision-making, and relational challenges. The system analyzes user input, detects emotional nuance, and generates supportive dialogue modeled after healthy counseling communication patterns.

> ⚠️ **Disclaimer:** The goal of Selah is **not** to replace professional mental health therapists, but rather to serve as an accessible, non-judgmental first step for individuals who may be hesitant to seek counseling. The platform guides conversations toward reflection, encouragement, and seamlessly recommends professional help or crisis hotlines when appropriate.

---

## 🎯 Motivation & Problem Statement

Many people currently turn to general-purpose AI models (such as ChatGPT) for life decisions, mental struggles, and relational advice. However, standard LLMs lack fine-tuned emotional intelligence, crisis guardrails, and persistent longitudinal context. 

Selah provides a safe outlet for users who might never pursue traditional therapy, bridging the gap between passive self-reflection and professional support. It serves as an auxiliary tool designed to improve quality of life and encourage proactive wellness.

---

## 🏗️ Architecture Overview

### **1. Frontend**
* **Framework:** React / React Native (cross-platform web and native mobile application architecture).
* **UI/UX:** Modern chat interface displaying real-time messaging, conversation history, user profiling metrics, and settings.

### **2. Backend**
* **Core:** Python backend service.
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

---

## 📊 Scope & Feature Tiering

### 🥉 Minimum Viable Product (MVP) — *Target Grade: C*
* [x] Basic front-end web/chat interface.
* [x] Python backend API to process incoming and outgoing messages.
* [x] Basic emotional classification algorithm.
* [x] Retrieval-based ML response system (Target accuracy ~60%).

### 🥈 Standard Project — *Target Grade: B*
* [x] Polished user interface and responsive UX.
* [x] Fine-tuned NLP model with multi-turn conversation context awareness.
* [x] Persistent conversation history and session logs.
* [x] Model response accuracy >70%.
* [x] Automated redirection to professional mental health resources when appropriate.

### 🥇 Advanced Project — *Target Grade: A*
* [x] Deep integration of user profiling data into model context window.
* [x] Advanced emotional intelligence and multi-class emotion detection.
* [x] Personalization and adaptive conversation tone over extended use.
* [x] Model accuracy >80%.

---

## 📅 Project Timeline & Milestones

| Date | Target Milestone | Status |
| :--- | :--- | :---: |
| **Sept 04** | Working Python environment setup & basic frontend infrastructure | ⏳ |
| **Sept 18** | Foundational database implementation (Firebase schema setup) | ⏳ |
| **Oct 02** | Basic open-source model pipeline integration | ⏳ |
| **Oct 16** | Frontend expansion (User profiles, chat history, settings UI) | ⏳ |
| **Oct 30** | Fine-tuned, functional `Mistral-7B` model running locally/via API | ⏳ |
| **Nov 13** | Model accuracy >80%, full frontend-backend-database pipeline | ⏳ |
| **Dec 04** | Polished UI, final bug fixes, profiling optimization, and presentation | ⏳ |

---

*Submitted to Professor Glas • Computer Science Department*
