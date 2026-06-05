# 优选商城 - E-commerce Platform

基于 Vue.js + Element Plus 的完整电商网站，包含商品展示、购物车、用户认证、订单管理等核心功能。

## 🛠 技术栈

- **Frontend**: Vue 3 + Element Plus + Vuex + Vue Router + Axios + Vite
- **Backend**: Node.js + Express + Sequelize
- **Database**: MySQL 8.0 (utf8mb4)

## 🚀 启动指南 (How to Run)

1. 确保 Docker Desktop 已启动
2. 在项目根目录执行：

```bash
docker compose up --build
```

3. 等待容器启动完成（首次构建约 2-5 分钟）
4. 访问前端页面

## 🔗 服务地址 (Services)

| 服务 | 地址 |
|------|------|
| **Frontend** | http://localhost:3227 |
| **Backend API** | http://localhost:8227 |
| **Database** | localhost:3307 (user: ecommerce / pass: ecommerce123) |

## 🧪 测试账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | 123456 |
| 普通用户 | user | 123456 |

## 📦 功能模块

- **商品展示与搜索**：首页推荐、分类浏览、关键词搜索
- **商品详情**：图片、描述、价格、库存、加入购物车
- **购物车管理**：添加、修改数量、删除、清空
- **用户认证**：注册、登录、密码找回、重置密码
- **订单管理**：创建订单、支付、取消、订单列表与详情
- **个人中心**：个人信息、收货地址管理

## 🎨 设计说明

- 现代渐变风格 UI，浅色系主色调
- 响应式布局，支持 PC 与移动端
- Element Plus 组件库，非原生 HTML 弹窗
- 骨架屏/加载状态、Hover 动效
