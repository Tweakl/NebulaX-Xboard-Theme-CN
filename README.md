# NebulaX Xboard 中文主题

原创、轻量、无域名绑定的 Xboard 用户端主题。主题使用同源 `/api/v1`，可部署在根域名或任意子域名。

## 功能

- 登录、注册、邮箱验证码及验证码适配
- 用户仪表盘、流量与订阅状态
- 套餐选择、创建订单与基础支付跳转
- 订单列表、取消待支付订单
- 账户资料、客服入口、深浅色模式
- 桌面端与移动端响应式布局
- API 始终使用同源 `/api/v1`，不绑定固定域名

## 安装

1. 下载仓库中的 [`NebulaX-1.0.0.zip`](NebulaX-1.0.0.zip)。
2. 进入 Xboard 管理后台的主题管理页面并上传 ZIP。
3. 切换到 NebulaX，再按需要填写品牌名称、主题色和客服地址。

正式安装包已经按照 Xboard 的上传规则打包，内部结构为：

```text
NebulaX/
├─ config.json
├─ dashboard.blade.php
└─ assets/
   ├─ theme.css
   └─ theme.js
```

## 兼容性

- Xboard 当前 V1 用户接口
- 桌面端及移动端浏览器
- Cloudflare Turnstile、reCAPTCHA v2/v3
- 明亮与深色模式

本地可直接打开 `preview.html` 查看模拟数据预览。
