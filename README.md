# 单词学习应用（前后端分离）

## 快速开始（本地）
1. 启动依赖（推荐 Docker Compose）
   ```bash
   docker-compose up -d --build
   ```
   前端：http://localhost:4173  
   后端：http://localhost:8080  
   MySQL：localhost:3306（库 `word_app`，用户/密码 `word/word`）
2. 手动运行（如不用 Docker）  
   - 后端：`cd backend && mvn spring-boot:run`（需先启动本地 MySQL，并设置环境变量 `MYSQL_*` 和 `JWT_SECRET`）  
   - 前端：`cd frontend && npm install && npm run dev`

## 技术栈
- 后端：Spring Boot 3、Spring Security + JWT、Spring Data JPA、MySQL
- 前端：React + Vite + TypeScript，绿色主题
- 部署：Dockerfile（前后端）、`docker-compose.yml`

## 主要接口
- `POST /api/auth/register` 注册（返回 token）
- `POST /api/auth/login` 登录（返回 token）
- `GET /api/words?q=` 列表/搜索
- `POST /api/words` 添加
- `PUT /api/words/{id}` 更新
- `DELETE /api/words/{id}` 删除
- `POST /api/words/{id}/review` 复习标记（`correct` 布尔）
- `GET /api/words/due` 待复习列表

默认 CORS 允许 `http://localhost:4173`，可通过环境变量 `FRONTEND_ORIGIN` 调整。

Docker 构建前端时已通过 build args 绑定后端地址 `http://backend:8080`；若前端单独运行，请在 `frontend/.env` 里设置 `VITE_API_BASE=http://localhost:8080`。
