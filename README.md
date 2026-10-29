# LiveQuiz: Real-Time Live Quiz & Leaderboard Platform

LiveQuiz is a gamified live quiz conduction platform designed for hosts and players. Hosts can build custom question sets, launch live game sessions, distribute join pins (or links), and control question progression. Players can join game sessions, submit choices in real-time under countdown timers, and view their scores on animated live leaderboards.

---

## 🚀 Core Features

- **Dynamic Conductor Lobby**: Hosts can launch quizzes to generate a unique 6-digit Join PIN and a copyable direct URL link.
- **Real-Time Gameplay**: WebSocket-driven connection (Socket.io) ensures instantaneous question switching, timer countdowns, and scoreboard sync.
- **Collapsible Sidebar Layout**: Clean dashboard routing with dedicated pages for Quizzes, Question Sets, Session Logs, and Charts.
- **Split Quiz Detail routes**: Separate routes for quiz edits (`/edit`) and performance analytics (`/stats`).
- **Responsive Web UI**: Fluid mobile layouts for players and responsive desktop layouts for hosts.
- **Vibrant Dual-Theme Aesthetic**: Glassmorphic panels with full Light & Dark mode support, smooth CSS transition toggles, and high contrast text.
- **Aggregated Performance Analytics**: Review participant count averages and question accuracy breakdown charts.

---

## 🛠️ Technology Stack

| Layer | Technology | Key Usage |
| :--- | :--- | :--- |
| **Frontend UI** | **Next.js 16 (App Router)** | Client UI layout, page routes, and Server Side Rendering (SSR) |
| **State Store** | **Redux Toolkit** | Authorization cache, active quiz selectors, and lobby stores |
| **REST API** | **Express (Node/Bun)** | Authentication handlers, Quiz CRUD operations, and logs API |
| **WebSockets** | **Socket.io** | Two-way event broadcasts (joins, start questions, leaderboard sync) |
| **Cache Database** | **Redis** | Sub-millisecond player scores, sessions, and ranked ZSET rankings |
| **Primary Database** | **MongoDB** | Durable document stores for Users, Quizzes, and Session logs |
| **Containers** | **Docker & Compose** | Unified multi-container deployment orchestration |

---

## Screenshots

![Screenshot 1](./screenshots/theme/2/1.png)
![Screenshot 2](./screenshots/theme/2/2.png)
![Screenshot 3](./screenshots/theme/2/3.png)
![Screenshot 4](./screenshots/theme/2/4.png)
![Screenshot 5](./screenshots/theme/2/5.png)


## ⚙️ Environment Configurations

Create a `.env` file in the root of the backend and frontend folders using the templates provided:

### Backend Configuration (`backend/.env`)
```ini
PORT=8000
MONGO_URI=mongodb://livequizuser:livequiz123@localhost:27017/livequiz?authSource=admin
REDIS_URI=redis://localhost:6379
FRONTEND_URL=http://localhost:3000

# Mail Configuration (Nodemailer SMTP)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_FROM="Live Quiz" <no-reply@livequiz.com>
```

### Frontend Configuration (`frontend/.env`)
```ini
PORT=3000
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

---

## 🐳 Docker Deployment (Single Command)

We have provided convenient scripts to build the code assets and orchestrate MongoDB, Redis, the API server, and Next.js UI container instances instantly.

### Prerequisites
- Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) (ensure the Docker daemon is running).

### Quick Launch Commands

#### Windows (PowerShell)
Execute the PowerShell startup script at the root directory:
```powershell
.\docker-start.ps1
```

#### Linux / macOS (Bash)
Execute the Bash shell startup script:
```bash
chmod +x docker-start.sh
./docker-start.sh
```

#### Manual Docker Compose
If you prefer running compose commands directly:
```bash
docker compose up --build -d
```

Once all containers show as healthy, you can access the system at:
- **Web UI Client**: [http://localhost:3000](http://localhost:3000)
- **API Server Gateway**: [http://localhost:8000](http://localhost:8000)
- **MongoDB Connection**: `mongodb://livequizuser:livequiz123@localhost:27017/livequiz?authSource=admin`
- **Redis Connection**: `redis://localhost:6379`

---

## 🛠️ Manual Development Setup

If you wish to run the client and gateway servers locally on your machine:

### 1. Start Database Services
Ensure you have MongoDB and Redis services running locally on ports `27017` and `6379` respectively.

### 2. Launch Backend API Gateway
```bash
cd backend
bun install
bun run dev
```

### 3. Launch Frontend Client
```bash
cd frontend
bun install
bun run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
