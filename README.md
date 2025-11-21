
# 🎓 Rural AI Learning Platform  
**A Peer-to-Peer AI-powered Video Learning Platform for Rural Students**

![Education](https://img.shields.io/badge/Domain-Education-blue)
![Status](https://img.shields.io/badge/Status-Active-success)
![Tech](https://img.shields.io/badge/Tech-React%20%7C%20Node%20%7C%20AI-purple)

---

## 📌 Problem Statement

Many rural students face:
- Lack of qualified teachers  
- Poor internet connectivity  
- No access to quality digital learning tools  
- High cost of private education  

**Goal:** Build a gamified, AI-based peer learning platform where students teach and learn from each other using a points system.

---

## 💡 Our Solution

Rural AI Learning Platform provides:
- AI-assisted learning
- Peer-to-peer video teaching
- Points based learning economy
- Offline-first support
- Game-like learning progress

---

## ✨ Key Features

- 🎥 Peer-to-peer live video classes (WebRTC)
- 🤖 AI Learning Assistant (Gemini API)
- 💰 Points system (Teach = Earn, Learn = Spend)
- 📴 Offline-first learning (sync on reconnect)
- 🎮 Gamified learning system
- 🔐 Secure authentication
- 🌍 Designed for rural internet conditions

---

## 🛠 Tech Stack

### Frontend:
- React.js
- Tailwind CSS
- WebRTC
- Axios

### Backend:
- Node.js
- Express.js
- Gemini AI API
- REST API

### Deployment:
- Vercel (Frontend)
- Render (Backend)

---

## 🚀 Implementation Steps

### Step 1: Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/rural-ai-learning.git
cd rural-ai-learning
````

---

### Step 2: Backend Setup

```bash
cd backend
npm install
```

Create `.env` file inside backend folder:

```env
GEMINI_API_KEY=your_gemini_api_key
PORT=5000
NODE_ENV=development
```

Run backend:

```bash
npm start
```

Backend will run on:
👉 [http://localhost:5000](http://localhost:5000)

---

### Step 3: Frontend Setup

Open **new terminal**:

```bash
cd frontend
npm install
```

Create `.env` file:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

Start frontend:

```bash
npm start
```

Frontend runs on:
👉 [http://localhost:3000](http://localhost:3000)

---

## 🧪 Testing Flow

1. Open frontend in browser
2. Create an account
3. Ask AI a question
4. Join an online session
5. Switch to teacher mode
6. Teach to earn points

---

## 🌍 Deployment Guide

### Backend Deployment (Render)

1. Go to: [https://render.com](https://render.com)
2. Create **New Web Service**
3. Connect your GitHub repo
4. Set:

```
Root Directory: backend  
Build Command: npm install  
Start Command: npm start
```

5. Add Environment Variable:

```
GEMINI_API_KEY = your_api_key
```

---

### Frontend Deployment (Vercel)

1. Go to: [https://vercel.com](https://vercel.com)
2. Import GitHub repo
3. Set:

```
Root Directory: frontend  
Framework: Create React App
```

4. Add environment variable:

```
REACT_APP_API_URL = your_render_backend_url
```

Deploy 🚀

---

## 📂 Project Structure

```
rural-ai-learning/
│
├── backend/
│   ├── server.js
│   ├── routes/
│   ├── controllers/
│   └── .env
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── .env
│
├── README.md
└── package.json
```

---


---

## 🔮 Future Enhancements

* Mobile app version
* Multiple language support
* Voice-based AI learning
* Offline downloadable lessons

---

## 👨‍💻 Developer

**Sabharish C**
Full Stack Developer
📧 Email: [sabharishc98@gmail.com](mailto:sabharishc98@gmail.com)

---

## 📜 License

This project is licensed under the MIT License.

---

Just tell me 😎
```
