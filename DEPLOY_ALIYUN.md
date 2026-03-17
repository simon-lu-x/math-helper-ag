# 阿里云部署指南

## 架构概览

```
前端 SPA    →  OSS 静态托管 + CDN 加速
后端 API    →  函数计算 FC 3.0（Node.js 20，HTTP 触发器）
域名/HTTPS  →  阿里云 DNS + 免费 SSL 证书
```

---

## 前置准备

1. 开通阿里云账号，充值（OSS + CDN + FC 均按量付费，费用极低）
2. 安装工具：
   ```bash
   npm install -g @serverless-devs/s   # Serverless Devs CLI（部署 FC）
   npm install -g @alicloud/ossutil2    # OSS CLI（上传前端产物）
   ```
3. 配置阿里云 AccessKey：
   ```bash
   s config add --AccessKeyID <YOUR_ID> --AccessKeySecret <YOUR_SECRET> -a default
   ```

---

## 第一步：部署后端（函数计算 FC）

### 1. 编译 FC 函数

```bash
cd functions
npm install
npx tsc          # 产物输出到 functions/lib/fc_index.js
cd ..
```

### 2. 配置环境变量

在系统环境中注入，让 `s.yaml` 的 `${env.GEMINI_API_KEY}` 能读到：

```bash
export GEMINI_API_KEY=your-gemini-api-key
```

> 推荐做法：在阿里云 FC 控制台「函数详情 → 环境变量」中直接填写，更安全。

### 3. 部署到 FC

```bash
s deploy
```

部署成功后，控制台会输出 HTTP 触发器 URL，形如：
```
https://math-helper-ocr.cn-hangzhou.fcapp.run
```

记录此 URL，后续步骤需要用到。

### 4. 绑定自定义域名（可选但推荐）

在函数计算控制台 → 「自定义域名」→ 绑定 `api.yourdomain.com`，
路由配置：`/ocr` → `math-helper-ocr` 函数。

---

## 第二步：构建前端

### 1. 复制并填写生产环境配置

```bash
cp .env.production.example .env.production
```

编辑 `.env.production`，将 `VITE_API_BASE` 改为上一步得到的 FC 地址：

```
VITE_API_BASE=https://api.yourdomain.com
# 或直接使用 FC 自动域名（不绑定自定义域名时）:
# VITE_API_BASE=https://math-helper-ocr.cn-hangzhou.fcapp.run
```

### 2. 构建

```bash
npm run build
# 产物在 dist/ 目录
```

---

## 第三步：部署前端（OSS + CDN）

### 1. 创建 OSS Bucket

在阿里云控制台 → 对象存储 OSS → 创建 Bucket：
- 地域：华东2（上海）或华北2（北京）
- 读写权限：**公共读**
- 开启**静态网站托管**：
  - 默认首页：`index.html`
  - 默认 404 页：`index.html`（支持 SPA 路由）

### 2. 上传构建产物

```bash
# 替换 <bucket-name> 和 <region> 为实际值
ossutil2 cp -r dist/ oss://<bucket-name>/ --region <region> --force
```

### 3. 开启 CDN 加速

在阿里云控制台 → CDN → 添加域名：
- 加速域名：`yourdomain.com`
- 源站类型：OSS 域名，选择刚创建的 Bucket
- 开启 HTTPS（申请免费 DV 证书，一键签发）

### 4. 配置 DNS

在域名控制台将 `yourdomain.com` CNAME 解析到 CDN 分配的加速域名。

---

## 验证

```bash
# 1. 访问前端
open https://yourdomain.com

# 2. 测试 FC API（替换 URL 为实际触发器地址）
curl -X POST https://api.yourdomain.com/ocr \
  -H "Content-Type: application/json" \
  -d '{"images":[],"prompt":"test"}' \
  # 预期返回 400: Missing images for OCR
```

---

## 更新部署

### 更新前端

```bash
npm run build
ossutil2 cp -r dist/ oss://<bucket-name>/ --region <region> --force
# CDN 刷新缓存（控制台操作或使用 aliyun CLI）
```

### 更新后端

```bash
cd functions && npx tsc && cd ..
s deploy
```

---

## 费用估算（参考）

| 服务 | 用量（低流量） | 月费用估算 |
|------|-------------|-----------|
| OSS 存储 | ~50MB | < ¥0.1 |
| CDN 流量 | 10GB | ~¥2.5 |
| 函数计算 FC | 1万次调用 | ~¥0.5 |
| SSL 证书 | 免费 DV 证书 | ¥0 |
| **合计** | | **~¥3/月** |
