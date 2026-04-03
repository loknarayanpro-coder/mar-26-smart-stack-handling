# Smart Stock Inventory System

A comprehensive inventory management system built with a **FastAPI** backend and a **React (Vite)** frontend. This application allows for user authentication, product management, and sales reporting.

## 🚀 Features

-   **User Authentication**: Secure signup and login functionality using JWT and SQLite.
-   **Inventory Management**: Create, read, update, and delete products (stored in MongoDB).
-   **Reporting**: View sales reports and analytics.
-   **Responsive Design**: Built with React and modern CSS for a seamless user experience.

## 🛠️ Tech Stack

### Backend
-   **Framework**: FastAPI
-   **Language**: Python
-   **Databases**:
    -   **SQLite**: Used for User Authentication (stored in `users.db`).
    -   **MongoDB**: Used for Inventory and Product data.
-   **Key Libraries**: `uvicorn`, `pydantic`, `sqlalchemy`, `motor`, `pyjwt`, `passlib`.

### Frontend
-   **Framework**: React
-   **Build Tool**: Vite
-   **Key Libraries**: `axios`, `react-router-dom`, `jwt-decode`.

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your machine:

1.  **Node.js** (v14 or higher) & **npm** - [Download Here](https://nodejs.org/)
2.  **Python** (v3.8 or higher) - [Download Here](https://www.python.org/)
3.  **MongoDB** - Ensure you have a local MongoDB instance running or a cloud MongoDB Atlas URI. [Download Community Server](https://www.mongodb.com/try/download/community)

---

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Infosys_project
```

### 2. Backend Setup

Navigate to the backend directory and set up the Python environment.

```bash
cd backend
```

**Create and activate a virtual environment:**

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Mac/Linux
python3 -m venv venv
source venv/bin/activate
```

**Install dependencies:**

```bash
pip install -r requirements.txt
```

**Environment Variables:**
Create a `.env` file in the `backend` folder (if not already present) and add your configurations:

```env
MONGO_URL=mongodb://localhost:27017
SECRET_KEY=your_super_secret_key
```

### 3. Frontend Setup

Open a new terminal, navigate to the frontend directory, and install dependencies.

```bash
cd frontend
npm install
```

---

## 🏃‍♂️ Running the Application

You need to run both the backend and frontend servers simultaneously (in separate terminal windows).

### Start the Backend Server

From the `backend` directory (with virtual environment activated):

```bash
uvicorn main:app --reload
```
*The backend API will run at `http://localhost:8000`*

### Start the Frontend Server

From the `frontend` directory:

```bash
npm run dev
```
*The frontend application will run at `http://localhost:5173` (or the port shown in your terminal)*

---

## 📂 Project Structure

```
Infosys_project/
├── backend/             # FastAPI Backend
│   ├── routes/          # API Routes (auth, products, reports)
│   ├── main.py          # Application Entry Point
│   ├── database.py      # MongoDB Connection
│   ├── sql_models.py    # SQL Models (User)
│   ├── users.db         # SQLite Database File
│   └── requirements.txt # Python Dependencies
│
├── frontend/            # React Frontend
│   ├── src/
│   │   ├── pages/       # Application Pages
│   │   └── ...
│   ├── package.json     # JS Dependencies
│   └── vite.config.js   # Vite Configuration
│
└── README.md            # Project Documentation
```

## 🤝 Contributing

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature-branch`).
3.  Commit your changes.
4.  Push to the branch.
5.  Open a Pull Request.
