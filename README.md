# 🚀 TechSprint – Accelerate Your Tech Learning

An advanced **Full-Stack Online Learning Platform** built with modern web technologies including **React, Firebase, Express, and MongoDB**.  
TechSprint enables users to explore, enroll in, and manage tech courses through a clean, responsive, and interactive UI with full role-based functionality.

---

## 🌐 Live Demo

### 🔗 Client  
**https://techsprint-client.netlify.app/**

### 🔗 Server  
**https://techsprint-server.vercel.app/**

> **Student Access:** Login using any Email/Gmail account to explore Student CRUD functionalities.  
> **Instructor Access (Full CRUD – Add / Update / Delete Courses):**  
> **Email:** `tajrianrashid@instructor.com`  
> **Password:** `Qw1234567890`

---

## ✨ Key Features

### 1. **Dynamic Course Management**
Full CRUD operations powered by MongoDB:  
- Add new courses  
- Update course details  
- Delete courses  
- Manage instructor-specific course lists  

### 2. **Secure User Authentication**
- Firebase Email/Password Authentication  
- Google Sign-In  
- Protected routes and persistent login sessions  

### 3. **Role-Based Access Control**
- **Instructors:** Add, update, and delete courses  
- **Students:** Enroll in courses & manage enrolled list  
- Automatically restricts unauthorized operations  

### 4. **Interactive Dashboards**
- **My Added Courses:** Instructor's personal course list  
- **My Enrolled Courses:** Student’s personalized learning dashboard  

### 5. **Modern UI with Animations**
- Smooth transitions and motion effects using **Framer Motion**  
- Enhances engagement and overall user experience  

### 6. **Responsive & Mobile-Friendly Design**
- Fully responsive layout  
- Built using **Tailwind CSS** and **DaisyUI**  
- Optimized for all screen sizes  

### 7. **Featured Courses & Top Instructors**
- Homepage showcases featured sections  
- Dynamic data fetched from backend REST API  

### 8. **Cloud Deployment**
- **Client:** Netlify / Firebase Hosting  
- **Server:** Vercel  
- **Database:** MongoDB Atlas  
- Ensures fast performance and global accessibility  

---

## 🛠️ Tech Stack

### **Frontend**
- React  
- React Router  
- Tailwind CSS  
- DaisyUI  
- Framer Motion  

### **Backend**
- Node.js  
- Express.js  

### **Database**
- MongoDB (Atlas)

### **Authentication**
- Firebase Authentication  

### **Deployment**
- Netlify (Client)  
- Vercel (Server)

---

## 📦 Dependencies

```json```
"dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^17.2.3",
    "express": "^5.1.0",
    "firebase-admin": "^13.6.0",
    "joi": "^18.0.1",
    "mongodb": "^7.0.0"
  }

## 🏃 Running Locally

To run TechSprint on your local machine, follow these steps:

1. **Clone the repository**  
```bash```
```git clone https://github.com/mdtajrianrashid/B12-A10-Server-TechSprint.git```
```cd B12-A10-Server-TechSprint```

**Install dependencies**

**For the server:**
```bash```
```cd B12-A10-Server-TechSprint```
```npm install```
```nodemon index.js```

2. **Open the app**

**Backend API will run at: http://localhost:3000**

## You can now explore all features locally with full CRUD, authentication, and dashboards.