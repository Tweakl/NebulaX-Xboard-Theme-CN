(() => {
  'use strict';

  const app = document.getElementById('app');
  const config = Object.assign({
    title: 'Xboard', brandName: 'NebulaX', tagline: '让连接简单、稳定、清晰',
    primaryColor: '#6d5dfc', logoUrl: '', announcement: '', supportUrl: '', footerText: 'Powered by Xboard'
  }, window.XBOARD_THEME || {});
  const isPreview = Boolean(window.NEBULAX_PREVIEW);
  const storageKey = 'nebulax_auth_data';
  const themeKey = 'nebulax_color_mode';
  const state = {
    auth: localStorage.getItem(storageKey) || '',
    guest: {}, user: null, subscribe: null, plans: [], orders: [], notices: [],
    loading: false, captchaToken: '', renderId: 0
  };

  const periodMap = {
    month_price: '月付', quarter_price: '季付', half_year_price: '半年付',
    year_price: '年付', two_year_price: '两年付', three_year_price: '三年付',
    onetime_price: '一次性', reset_price: '重置流量'
  };
  const orderStatus = {
    0: ['待支付', 'warning'], 1: ['开通中', 'warning'], 2: ['已完成', 'success'], 3: ['已取消', 'danger']
  };

  applyBrandColor(config.primaryColor);
  setColorMode(localStorage.getItem(themeKey) || 'light');
  ensureGlobals();

  function applyBrandColor(color) {
    if (!/^#[0-9a-f]{6}$/i.test(color || '')) return;
    const rgb = [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16));
    document.documentElement.style.setProperty('--primary', color);
    document.documentElement.style.setProperty('--primary-rgb', rgb.join(', '));
    document.documentElement.style.setProperty('--primary-strong', shade(color, -14));
  }

  function shade(hex, amount) {
    const value = parseInt(hex.slice(1), 16);
    const calc = shift => Math.max(0, Math.min(255, (value >> shift & 255) + amount));
    return `#${[16, 8, 0].map(s => calc(s).toString(16).padStart(2, '0')).join('')}`;
  }

  function setColorMode(mode) {
    document.documentElement.dataset.theme = mode === 'dark' ? 'dark' : 'light';
    localStorage.setItem(themeKey, mode);
  }

  function ensureGlobals() {
    if (!document.querySelector('.toast-stack')) {
      document.body.insertAdjacentHTML('beforeend', '<div class="toast-stack" aria-live="assertive"></div><dialog class="dialog" id="global-dialog"></dialog>');
    }
  }

  function e(value) {
    return String(value ?? '').replace(/[&<>'"]/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    })[char]);
  }

  function icon(name) {
    const paths = {
      dashboard: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
      plans: '<path d="M4 7h16M4 12h16M4 17h10"/><circle cx="18" cy="17" r="2"/>',
      orders: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z"/><path d="M9 8h6M9 12h6"/>',
      user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
      moon: '<path d="M20.5 14.3A8.5 8.5 0 0 1 9.7 3.5 8.5 8.5 0 1 0 20.5 14.3z"/>',
      sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"/>',
      logout: '<path d="M10 17l5-5-5-5M15 12H3"/><path d="M14 4h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5"/>',
      mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
      lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
      copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
      bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
      check: '<path d="m5 12 4 4L19 6"/>',
      arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
      close: '<path d="M18 6 6 18M6 6l12 12"/>',
      wifi: '<path d="M5 12.55a11 11 0 0 1 14 0M8.5 16a6 6 0 0 1 7 0M12 20h.01"/><path d="M2 9a16 16 0 0 1 20 0"/>',
      chart: '<path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/>',
      calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
      wallet: '<path d="M4 6h15a2 2 0 0 1 2 2v10H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12"/><path d="M16 11h5"/>',
      info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
      refresh: '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M18.5 9A7 7 0 0 0 6 6.5L4 12M5.5 15A7 7 0 0 0 18 17.5l2-5.5"/>',
      support: '<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><path d="M18 19c0 1-1 2-2 2h-3M4 14h3v5H5a2 2 0 0 1-2-2v-1a2 2 0 0 1 1-2zM20 14h-3v5h2a2 2 0 0 0 2-2v-1a2 2 0 0 0-1-2z"/>',
      empty: '<path d="M3 7h18M5 7l1 13h12l1-13M9 11v5M15 11v5"/><path d="M9 7V4h6v3"/>'
    };
    return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.info}</svg>`;
  }

  function brand() {
    const visual = config.logoUrl
      ? `<img class="brand-logo" src="${e(config.logoUrl)}" alt="">`
      : '<span class="brand-mark"><span></span><span></span></span>';
    return `<div class="brand">${visual}<div><strong>${e(config.brandName || config.title)}</strong><small>control center</small></div></div>`;
  }

  async function api(path, options = {}) {
    if (isPreview) return mockApi(path, options);
    const headers = Object.assign({ Accept: 'application/json' }, options.headers || {});
    if (state.auth) headers.Authorization = state.auth;
    if (options.body && !(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
    const response = await fetch(`/api/v1${path}`, {
      method: options.method || 'GET', headers,
      body: options.body && !(options.body instanceof FormData) ? JSON.stringify(options.body) : options.body
    });
    let result;
    try { result = await response.json(); } catch { result = { message: `请求失败（${response.status}）` }; }
    if (response.status === 401) {
      clearAuth();
      if (!location.hash.startsWith('#/login')) location.hash = '#/login';
    }
    if (!response.ok || result.status === 'fail') {
      const message = result.message || result.error || '请求失败，请稍后重试';
      throw new Error(Array.isArray(message) ? message.join('，') : message);
    }
    return Object.prototype.hasOwnProperty.call(result, 'data') ? result.data : result;
  }

  function mockApi(path, options) {
    const now = Math.floor(Date.now() / 1000);
    const plans = [
      { id: 1, name: '轻量探索', transfer_enable: 120, speed_limit: 300, device_limit: 3, month_price: 1200, quarter_price: 3200, year_price: 9800, tags: ['入门', '稳定'], content: '适合轻量使用与日常浏览', show: true, sell: true },
      { id: 2, name: '星云畅享', transfer_enable: 500, speed_limit: null, device_limit: 8, month_price: 2600, quarter_price: 7200, year_price: 23800, tags: ['热门', '高速'], content: '全速线路与充足流量', show: true, sell: true },
      { id: 3, name: '无限引力', transfer_enable: 1200, speed_limit: null, device_limit: null, month_price: 4800, half_year_price: 25800, year_price: 44800, tags: ['大流量'], content: '为多设备与重度使用准备', show: true, sell: true }
    ];
    const data = path.includes('/guest/comm/config') ? { app_description: '一个清爽、快速的网络服务中心', is_invite_force: 0, is_email_verify: 0, is_captcha: 0 }
      : path.includes('/auth/login') || path.includes('/auth/register') ? { auth_data: 'Bearer preview-token', token: 'preview' }
      : path.includes('/user/info') ? { email: 'hello@nebulax.dev', balance: 2680, commission_balance: 0, expired_at: now + 86400 * 126, created_at: now - 86400 * 93, plan_id: 2 }
      : path.includes('/getSubscribe') ? { plan_id: 2, u: 23 * 1024 ** 3, d: 172 * 1024 ** 3, transfer_enable: 500 * 1024 ** 3, expired_at: now + 86400 * 126, subscribe_url: 'https://example.com/s/nebula-preview', plan: plans[1], device_limit: 8, speed_limit: null, reset_day: 12 }
      : path.includes('/plan/fetch') ? plans
      : path.includes('/notice/fetch') ? [{ id: 1, title: '欢迎使用 NebulaX', content: '全新用户中心已经准备就绪。你可以在订阅中心复制链接，或前往套餐页面续费。', created_at: now }]
      : path.includes('/order/fetch') ? [{ trade_no: '202606210001', status: 2, total_amount: 2600, period: 'month_price', created_at: now - 86400 * 4, plan: plans[1] }]
      : path.includes('/order/save') ? 'PREVIEW-ORDER-001'
      : path.includes('/getPaymentMethod') ? [{ id: 1, name: '演示支付', payment: 'demo' }]
      : path.includes('/order/checkout') ? { type: -1, data: true }
      : true;
    return new Promise(resolve => setTimeout(() => resolve(data), 180));
  }

  function saveAuth(auth) {
    state.auth = auth || '';
    localStorage.setItem(storageKey, state.auth);
  }
  function clearAuth() {
    state.auth = ''; state.user = null; state.subscribe = null;
    localStorage.removeItem(storageKey);
  }
  function routeName() {
    return (location.hash.replace(/^#\/?/, '').split(/[?\/]/)[0] || (state.auth ? 'dashboard' : 'login')).toLowerCase();
  }
  function go(route) { location.hash = `#/${route}`; }
  function initials(email) { return (email || config.brandName || 'NX').slice(0, 2).toUpperCase(); }
  function bytes(value) {
    const size = Number(value || 0);
    if (size <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
    return `${(size / 1024 ** i).toFixed(i > 2 ? 2 : 1)} ${units[i]}`;
  }
  function money(cents) { return `¥${(Number(cents || 0) / 100).toFixed(Number(cents || 0) % 100 ? 2 : 0)}`; }
  function date(value) {
    if (!value) return '长期有效';
    const stamp = Number(value) < 1e12 ? Number(value) * 1000 : Number(value);
    return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(stamp));
  }
  function toast(message, type = 'success', title = type === 'error' ? '操作失败' : '操作成功') {
    const node = document.createElement('div');
    node.className = `toast ${type}`;
    node.innerHTML = `${icon(type === 'error' ? 'info' : 'check')}<div><b>${e(title)}</b><p>${e(message)}</p></div>`;
    document.querySelector('.toast-stack').appendChild(node);
    setTimeout(() => node.remove(), 3600);
  }

  function nav(route, label, iconName) {
    const active = routeName() === route ? ' active' : '';
    return `<a class="nav-link${active}" href="#/${route}" data-nav="${route}">${icon(iconName)}<span>${label}</span></a>`;
  }

  function shell(content, title, subtitle = '') {
    const user = state.user || {};
    return `<div class="app-shell">
      <aside class="sidebar">
        ${brand()}
        <nav class="nav" aria-label="主导航">
          <p class="nav-label">Workspace</p>
          ${nav('dashboard', '仪表盘', 'dashboard')}
          ${nav('plans', '订阅套餐', 'plans')}
          ${nav('orders', '我的订单', 'orders')}
          <p class="nav-label">Account</p>
          ${nav('account', '账户设置', 'user')}
        </nav>
        <div class="sidebar-bottom">
          ${config.supportUrl ? `<div class="support-card"><b>需要一点帮助？</b><p>遇到连接或订阅问题，可以随时联系我们。</p><a class="btn btn-secondary btn-sm" href="${e(config.supportUrl)}" target="_blank" rel="noopener">${icon('support')} 联系客服</a></div>` : ''}
          <button class="nav-link" type="button" data-action="logout">${icon('logout')}<span>退出登录</span></button>
        </div>
      </aside>
      <main class="main">
        <div class="mobile-brand">${brand()}<button class="icon-btn" data-action="theme" aria-label="切换深浅色">${icon(document.documentElement.dataset.theme === 'dark' ? 'sun' : 'moon')}</button></div>
        <header class="topbar">
          <div class="topbar-title"><strong>${e(title)}</strong><span>${e(subtitle || config.tagline)}</span></div>
          <div class="topbar-actions">
            <button class="icon-btn" data-action="theme" aria-label="切换深浅色">${icon(document.documentElement.dataset.theme === 'dark' ? 'sun' : 'moon')}</button>
            <button class="icon-btn" data-nav="dashboard" aria-label="查看通知">${icon('bell')}</button>
            <a class="avatar" href="#/account" title="${e(user.email || '')}">${e(initials(user.email))}</a>
          </div>
        </header>
        <div class="content">${content}</div>
      </main>
      <nav class="mobile-nav" aria-label="移动端导航">
        ${nav('dashboard', '首页', 'dashboard')}${nav('plans', '套餐', 'plans')}${nav('orders', '订单', 'orders')}${nav('account', '我的', 'user')}
      </nav>
    </div>`;
  }

  function authPage(mode) {
    const register = mode === 'register';
    const guest = state.guest || {};
    const emailVerify = register && Number(guest.is_email_verify) === 1;
    const invite = register && Number(guest.is_invite_force) === 1;
    const authFields = register ? `
      ${invite ? `<div class="field"><label for="invite_code">邀请码</label><input class="input" id="invite_code" name="invite_code" autocomplete="off" required placeholder="请输入邀请码"></div>` : ''}
      ${emailVerify ? `<div class="field"><label for="email_code">邮箱验证码</label><div class="verify-row"><input class="input" id="email_code" name="email_code" inputmode="numeric" maxlength="6" required placeholder="6 位验证码"><button class="btn btn-secondary" type="button" data-action="send-code">发送验证码</button></div></div>` : ''}
      <div id="captcha-box"></div>` : '';
    app.innerHTML = `<div class="auth-shell">
      <section class="auth-panel">
        ${brand()}
        <div class="auth-main">
          <p class="eyebrow">${register ? 'Create account' : 'Welcome back'}</p>
          <h1>${register ? '创建你的账户' : '欢迎回来'}</h1>
          <p>${register ? '几步即可开始，连接体验从这里变得更轻盈。' : '登录后管理订阅、查看流量与选择套餐。'}</p>
          <form class="form" id="auth-form" data-mode="${mode}">
            <div class="field"><label for="email">邮箱地址</label><div class="input-wrap">${icon('mail')}<input class="input" id="email" name="email" type="email" autocomplete="email" required placeholder="name@example.com"></div></div>
            <div class="field"><label for="password">登录密码</label><div class="input-wrap">${icon('lock')}<input class="input" id="password" name="password" type="password" minlength="8" autocomplete="${register ? 'new-password' : 'current-password'}" required placeholder="至少 8 位字符"></div></div>
            ${authFields}
            ${!register ? `<div class="form-meta"><label class="check"><input type="checkbox" checked> 保持登录</label><a class="text-link" href="#/register">没有账户？</a></div>` : `<p class="field-hint">创建账户即代表你同意站点服务条款与隐私政策。</p>`}
            <button class="btn btn-primary btn-block" type="submit">${register ? '注册并进入' : '登录控制中心'} ${icon('arrow')}</button>
          </form>
          <p class="field-hint" style="margin-top:20px;text-align:center">${register ? '已经有账户？ <a class="text-link" href="#/login">直接登录</a>' : `还没有账户？ <a class="text-link" href="#/register">免费注册</a>`}</p>
        </div>
        <div class="auth-footer">${e(config.footerText)}</div>
      </section>
      <aside class="auth-visual" aria-hidden="true">
        <div class="orbit"></div>
        <div class="visual-copy"><span class="visual-kicker">● LIVE NETWORK</span><h2>${e(config.tagline)}</h2><p>${e(state.guest.app_description || config.description || '一个专注体验的网络服务控制中心。')}</p><div class="visual-stats"><div><b>99.9%</b><span>服务可用性</span></div><div><b>24/7</b><span>持续连接</span></div><div><b>1-Click</b><span>快速订阅</span></div></div></div>
      </aside>
    </div>`;
    if (register) mountCaptcha();
  }

  async function mountCaptcha() {
    const guest = state.guest || {};
    if (!Number(guest.is_captcha)) return;
    const box = document.getElementById('captcha-box');
    if (!box) return;
    box.innerHTML = '<p class="field-hint">正在载入安全验证…</p>';
    try {
      if (guest.captcha_type === 'turnstile') {
        await loadScript('https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit');
        box.innerHTML = '';
        window.turnstile.render(box, { sitekey: guest.turnstile_site_key, callback: token => { state.captchaToken = token; }, 'expired-callback': () => { state.captchaToken = ''; } });
      } else if (guest.captcha_type === 'recaptcha-v3') {
        await loadScript(`https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(guest.recaptcha_v3_site_key)}`);
        box.innerHTML = '<p class="field-hint">本页面受 reCAPTCHA 安全验证保护。</p>';
      } else {
        await loadScript('https://www.google.com/recaptcha/api.js?render=explicit');
        box.innerHTML = '';
        window.grecaptcha.render(box, { sitekey: guest.recaptcha_site_key, callback: token => { state.captchaToken = token; } });
      }
    } catch { box.innerHTML = '<p class="field-hint" style="color:var(--danger)">安全验证加载失败，请刷新页面重试。</p>'; }
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = [...document.scripts].find(s => s.src === src);
      if (existing) return resolve();
      const script = document.createElement('script'); script.src = src; script.async = true;
      script.onload = resolve; script.onerror = reject; document.head.appendChild(script);
    });
  }

  async function captchaPayload() {
    const guest = state.guest || {};
    if (!Number(guest.is_captcha)) return {};
    if (guest.captcha_type === 'recaptcha-v3') {
      const token = await window.grecaptcha.execute(guest.recaptcha_v3_site_key, { action: 'register' });
      return { recaptcha_v3_token: token };
    }
    if (!state.captchaToken) throw new Error('请先完成人机验证');
    return guest.captcha_type === 'turnstile' ? { turnstile_token: state.captchaToken } : { recaptcha_data: state.captchaToken };
  }

  function pageHead(kicker, title, desc, action = '') {
    return `<div class="page-head"><div><p class="eyebrow">${e(kicker)}</p><h1>${e(title)}</h1><p>${e(desc)}</p></div>${action}</div>`;
  }

  async function renderDashboard(id) {
    app.innerHTML = shell(`${pageHead('Overview', '今天也保持连接', '订阅、流量与账户状态，一眼就能看清。')}<div class="grid grid-4"><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div></div>`, '仪表盘');
    try {
      const [user, subscribe, notices] = await Promise.all([
        api('/user/info'), api('/user/getSubscribe'), api('/user/notice/fetch').catch(() => [])
      ]);
      if (id !== state.renderId) return;
      state.user = user; state.subscribe = subscribe; state.notices = Array.isArray(notices) ? notices : [];
      const used = Number(subscribe.u || 0) + Number(subscribe.d || 0);
      const total = Number(subscribe.transfer_enable || 0);
      const percent = total ? Math.min(100, Math.round(used / total * 100)) : 0;
      const remaining = Math.max(0, total - used);
      const planName = subscribe.plan?.name || '暂无订阅';
      const announcement = config.announcement || state.notices[0]?.content || '';
      const content = `${pageHead('Overview', `你好，${(user.email || '用户').split('@')[0]}`, '这里是你的连接状态与订阅概览。', '<a class="btn btn-primary" href="#/plans">查看套餐 ' + icon('arrow') + '</a>')}
        ${announcement ? `<div class="announcement">${icon('bell')}<p>${e(announcement)}</p></div>` : ''}
        <div class="grid grid-4">
          <div class="card stat-card"><span class="stat-icon">${icon('wifi')}</span><strong>${e(planName)}</strong><span>当前订阅</span></div>
          <div class="card stat-card"><span class="stat-icon">${icon('chart')}</span><strong>${bytes(remaining)}</strong><span>剩余流量</span></div>
          <div class="card stat-card"><span class="stat-icon">${icon('calendar')}</span><strong>${date(subscribe.expired_at)}</strong><span>订阅到期</span></div>
          <div class="card stat-card"><span class="stat-icon">${icon('wallet')}</span><strong>${money(user.balance)}</strong><span>账户余额</span></div>
        </div>
        <div class="grid grid-3" style="margin-top:20px">
          <section class="card card-pad span-2"><div class="card-title"><div><h2>流量使用</h2><p>上传与下载流量合计</p></div><span class="status ${percent > 85 ? 'danger' : 'success'}">已使用 ${percent}%</span></div>
            <div class="traffic-summary"><div class="traffic-ring-wrap"><div class="traffic-ring" style="--p:${percent}%"></div><div class="traffic-ring-label"><b>${percent}%</b><span>本周期</span></div></div>
              <div class="traffic-details"><div class="metric-row"><span>已用流量</span><b>${bytes(used)}</b></div><div class="metric-row"><span>套餐总量</span><b>${bytes(total)}</b></div><div class="metric-row"><span>下次重置</span><b>${subscribe.reset_day ? `每月 ${e(subscribe.reset_day)} 日` : '跟随套餐'}</b></div><div class="progress"><span style="width:${percent}%"></span></div></div>
            </div>
          </section>
          <section class="card card-pad"><div class="card-title"><div><h2>订阅链接</h2><p>添加到你的客户端</p></div>${icon('wifi')}</div>
            <div class="subscribe-box"><span class="subscribe-url">${e(subscribe.subscribe_url || '暂无订阅链接')}</span><button class="btn btn-primary btn-sm" data-action="copy-sub" ${subscribe.subscribe_url ? '' : 'disabled'}>${icon('copy')} 复制</button></div>
            <div class="info-list" style="margin-top:14px"><div class="info-item"><span>设备数量</span><b>${subscribe.device_limit || '不限'}</b></div><div class="info-item"><span>速度上限</span><b>${subscribe.speed_limit ? `${e(subscribe.speed_limit)} Mbps` : '不限速'}</b></div><div class="info-item"><span>订阅状态</span><b><span class="status success">正常</span></b></div></div>
          </section>
        </div>`;
      app.innerHTML = shell(content, '仪表盘', config.tagline);
    } catch (error) { renderError(error); }
  }

  async function renderPlans(id) {
    app.innerHTML = shell(`${pageHead('Plans', '选择适合你的方案', '所有价格与流量都清楚列出，没有藏起来的小字。')}<div class="plan-grid"><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div></div>`, '订阅套餐');
    try {
      const plans = await api(state.auth ? '/user/plan/fetch' : '/guest/plan/fetch');
      if (id !== state.renderId) return;
      state.plans = (Array.isArray(plans) ? plans : []).filter(plan => plan.show !== false);
      const cards = state.plans.map((plan, index) => planCard(plan, index === 1)).join('');
      const content = `${pageHead('Plans', '选择适合你的方案', '按需求选择周期，随时可以在账户中查看订单。')}<div class="plan-grid">${cards || empty('暂时没有可售套餐', '管理员还没有发布订阅套餐。')}</div>`;
      app.innerHTML = shell(content, '订阅套餐');
    } catch (error) { renderError(error); }
  }

  function planCard(plan, featured) {
    const prices = Object.keys(periodMap).filter(key => Number(plan[key]) > 0);
    const first = prices[0];
    const tags = Array.isArray(plan.tags) ? plan.tags : [];
    return `<article class="card plan-card ${featured ? 'featured' : ''}">
      <h2 class="plan-name">${e(plan.name)}</h2><div class="plan-tags">${tags.map(tag => `<span class="tag">${e(tag)}</span>`).join('')}</div>
      <div class="plan-price">${first ? `<b>${money(plan[first])}</b><span> / ${e(periodMap[first])}</span>` : '<b>—</b>'}</div>
      <ul class="plan-features"><li>${icon('check')} ${e(plan.transfer_enable || 0)} GB 套餐流量</li><li>${icon('check')} ${plan.speed_limit ? `${e(plan.speed_limit)} Mbps` : '不限速'} 网络</li><li>${icon('check')} ${plan.device_limit ? `${e(plan.device_limit)} 台设备` : '不限设备'}</li><li>${icon('check')} ${e(plan.content || '稳定线路与便捷订阅')}</li></ul>
      <button class="btn ${featured ? 'btn-primary' : 'btn-secondary'}" data-action="purchase" data-plan="${e(plan.id)}" ${plan.sell === false || !prices.length ? 'disabled' : ''}>选择该方案 ${icon('arrow')}</button>
    </article>`;
  }

  async function renderOrders(id) {
    app.innerHTML = shell(`${pageHead('Billing', '我的订单', '查看购买记录和订单状态。')}<div class="card skeleton"></div>`, '我的订单');
    try {
      const orders = await api('/user/order/fetch');
      if (id !== state.renderId) return;
      state.orders = Array.isArray(orders) ? orders : [];
      const rows = state.orders.map(order => {
        const status = orderStatus[order.status] || ['未知', 'warning'];
        return `<tr><td><strong>${e(order.plan?.name || '订阅套餐')}</strong><br><small>${e(order.trade_no || '')}</small></td><td>${e(periodMap[order.period] || order.period || '—')}</td><td>${money(order.total_amount)}</td><td>${date(order.created_at)}</td><td><span class="status ${status[1]}">${status[0]}</span></td><td>${Number(order.status) === 0 ? `<button class="btn btn-ghost btn-sm" data-action="cancel-order" data-trade="${e(order.trade_no)}">取消</button>` : '—'}</td></tr>`;
      }).join('');
      const content = `${pageHead('Billing', '我的订单', '购买记录、支付状态和套餐信息都在这里。', '<a class="btn btn-primary" href="#/plans">购买套餐</a>')}
        <section class="card">${rows ? `<div class="table-wrap"><table class="table"><thead><tr><th>订单</th><th>周期</th><th>金额</th><th>创建时间</th><th>状态</th><th>操作</th></tr></thead><tbody>${rows}</tbody></table></div>` : empty('还没有订单', '选择一个套餐后，订单会显示在这里。')}</section>`;
      app.innerHTML = shell(content, '我的订单');
    } catch (error) { renderError(error); }
  }

  async function renderAccount(id) {
    app.innerHTML = shell(`${pageHead('Account', '账户设置', '管理个人信息与安全选项。')}<div class="grid grid-2"><div class="skeleton"></div><div class="skeleton"></div></div>`, '账户设置');
    try {
      const user = state.user || await api('/user/info');
      if (id !== state.renderId) return;
      state.user = user;
      const content = `${pageHead('Account', '账户设置', '你的账户资料与常用操作。')}
        <div class="grid grid-2"><section class="card card-pad"><div class="profile-card"><div class="profile-avatar">${e(initials(user.email))}</div><div><h2>${e(user.email)}</h2><p>加入于 ${date(user.created_at)}</p></div></div><div class="info-list" style="margin-top:22px"><div class="info-item"><span>账户余额</span><b>${money(user.balance)}</b></div><div class="info-item"><span>套餐编号</span><b>${e(user.plan_id || '暂无')}</b></div><div class="info-item"><span>到期时间</span><b>${date(user.expired_at)}</b></div><div class="info-item"><span>账户状态</span><b><span class="status ${user.banned ? 'danger' : 'success'}">${user.banned ? '已停用' : '正常'}</span></b></div></div></section>
        <section class="card card-pad"><div class="card-title"><div><h2>偏好设置</h2><p>这些设置保存在当前浏览器</p></div></div><div class="info-list"><div class="info-item"><span>界面主题</span><button class="btn btn-secondary btn-sm" data-action="theme">切换深浅色</button></div><div class="info-item"><span>客服支持</span>${config.supportUrl ? `<a class="text-link" href="${e(config.supportUrl)}" target="_blank" rel="noopener">打开客服</a>` : '<b>未配置</b>'}</div><div class="info-item"><span>前端版本</span><b>NebulaX 1.0.0</b></div><div class="info-item"><span>登录状态</span><button class="btn btn-danger btn-sm" data-action="logout">退出登录</button></div></div></section></div>`;
      app.innerHTML = shell(content, '账户设置');
    } catch (error) { renderError(error); }
  }

  function empty(title, message) { return `<div class="empty">${icon('empty')}<h3>${e(title)}</h3><p>${e(message)}</p></div>`; }
  function renderError(error) {
    const content = `${pageHead('Connection', '页面暂时无法载入', '服务器返回了一个错误。')}<section class="card empty">${icon('info')}<h3>${e(error.message || '加载失败')}</h3><p>请检查网络或稍后再试。</p><button class="btn btn-primary" data-action="reload" style="margin-top:16px">${icon('refresh')} 重新加载</button></section>`;
    app.innerHTML = state.auth ? shell(content, '连接异常') : app.innerHTML;
  }

  function openPurchase(planId) {
    if (!state.auth) return go('login');
    const plan = state.plans.find(item => String(item.id) === String(planId));
    if (!plan) return;
    const periods = Object.keys(periodMap).filter(key => Number(plan[key]) > 0);
    const dialog = document.getElementById('global-dialog');
    dialog.innerHTML = `<div class="dialog-head"><h3>选择 ${e(plan.name)} 的周期</h3><button class="icon-btn" data-action="close-dialog" aria-label="关闭">${icon('close')}</button></div><form class="dialog-body" id="purchase-form" data-plan="${e(plan.id)}"><div class="period-list">${periods.map((key, i) => `<label class="choice"><input type="radio" name="period" value="${key}" ${i === 0 ? 'checked' : ''}><span><b>${e(periodMap[key])}</b><small>${money(plan[key])}</small></span></label>`).join('')}</div><div class="field" style="margin-top:18px"><label for="coupon_code">优惠码（可选）</label><input class="input" id="coupon_code" name="coupon_code" placeholder="输入优惠码"></div><div class="dialog-actions"><button class="btn btn-secondary" type="button" data-action="close-dialog">取消</button><button class="btn btn-primary" type="submit">创建订单 ${icon('arrow')}</button></div></form>`;
    dialog.showModal();
  }

  async function createOrder(form) {
    const button = form.querySelector('[type="submit"]');
    button.disabled = true; button.textContent = '正在创建…';
    try {
      const data = new FormData(form);
      const tradeNo = await api('/user/order/save', { method: 'POST', body: { plan_id: form.dataset.plan, period: data.get('period'), coupon_code: data.get('coupon_code') || undefined } });
      const methods = await api('/user/order/getPaymentMethod').catch(() => []);
      renderPayments(tradeNo, methods || []);
    } catch (error) { toast(error.message, 'error'); button.disabled = false; button.textContent = '创建订单'; }
  }

  function renderPayments(tradeNo, methods) {
    const dialog = document.getElementById('global-dialog');
    dialog.innerHTML = `<div class="dialog-head"><h3>完成支付</h3><button class="icon-btn" data-action="close-dialog">${icon('close')}</button></div><form class="dialog-body" id="payment-form" data-trade="${e(tradeNo)}"><p class="field-hint" style="margin-top:0">订单 ${e(tradeNo)} 已创建，请选择支付方式。免费订单可直接确认。</p><div class="payment-list">${methods.length ? methods.map((method, i) => `<label class="choice"><input type="radio" name="method" value="${e(method.id)}" ${i === 0 ? 'checked' : ''}><span><b>${e(method.name)}</b><small>${e(method.payment || '在线支付')}</small></span></label>`).join('') : '<p class="field-hint">当前没有在线支付方式，将尝试使用余额或免费开通。</p>'}</div><div class="dialog-actions"><button class="btn btn-secondary" type="button" data-action="close-dialog">稍后支付</button><button class="btn btn-primary" type="submit">确认支付</button></div></form>`;
  }

  async function checkout(form) {
    const button = form.querySelector('[type="submit"]'); button.disabled = true; button.textContent = '处理中…';
    try {
      const data = new FormData(form);
      const result = await api('/user/order/checkout', { method: 'POST', body: { trade_no: form.dataset.trade, method: data.get('method') || 0 } });
      if (result.type === -1 || result.data === true) {
        document.getElementById('global-dialog').close(); toast('套餐已成功开通'); go('dashboard');
      } else if (typeof result.data === 'string' && /^https?:\/\//i.test(result.data)) {
        location.href = result.data;
      } else {
        button.disabled = false; button.textContent = '确认支付';
        toast('支付请求已创建，请按支付页面提示完成', 'success', '等待支付');
        if (typeof result.data === 'string') window.open(result.data, '_blank', 'noopener');
      }
    } catch (error) { toast(error.message, 'error'); button.disabled = false; button.textContent = '确认支付'; }
  }

  async function handleAuth(form) {
    const mode = form.dataset.mode;
    const button = form.querySelector('[type="submit"]'); button.disabled = true; button.textContent = mode === 'register' ? '正在创建账户…' : '正在登录…';
    try {
      const data = Object.fromEntries(new FormData(form).entries());
      if (mode === 'register') Object.assign(data, await captchaPayload());
      const result = await api(`/passport/auth/${mode}`, { method: 'POST', body: data });
      saveAuth(result.auth_data);
      toast(mode === 'register' ? '账户创建成功' : '欢迎回来');
      go('dashboard');
    } catch (error) { toast(error.message, 'error'); button.disabled = false; button.textContent = mode === 'register' ? '注册并进入' : '登录控制中心'; }
  }

  async function sendEmailCode(button) {
    const email = document.getElementById('email')?.value;
    if (!email) return toast('请先填写邮箱地址', 'error');
    button.disabled = true;
    try {
      const captcha = await captchaPayload();
      await api('/passport/comm/sendEmailVerify', { method: 'POST', body: Object.assign({ email }, captcha) });
      let count = 60; button.textContent = `${count}s`;
      const timer = setInterval(() => { count -= 1; button.textContent = count > 0 ? `${count}s` : '重新发送'; if (count <= 0) { clearInterval(timer); button.disabled = false; } }, 1000);
      toast('验证码已发送，请检查邮箱');
    } catch (error) { toast(error.message, 'error'); button.disabled = false; button.textContent = '发送验证码'; }
  }

  async function render() {
    const id = ++state.renderId;
    let route = routeName();
    if (!state.auth && !['login', 'register'].includes(route)) route = 'login';
    if (state.auth && ['login', 'register'].includes(route)) route = 'dashboard';
    if (route !== routeName()) { go(route); return; }
    if (route === 'login' || route === 'register') return authPage(route);
    if (route === 'plans') return renderPlans(id);
    if (route === 'orders') return renderOrders(id);
    if (route === 'account') return renderAccount(id);
    return renderDashboard(id);
  }

  document.addEventListener('click', async event => {
    const target = event.target.closest('[data-action], [data-nav]');
    if (!target) return;
    if (target.dataset.nav) { go(target.dataset.nav); return; }
    const action = target.dataset.action;
    if (action === 'theme') {
      setColorMode(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'); render();
    } else if (action === 'logout') {
      clearAuth(); toast('已安全退出'); go('login');
    } else if (action === 'copy-sub') {
      try { await navigator.clipboard.writeText(state.subscribe?.subscribe_url || ''); toast('订阅链接已复制'); } catch { toast('复制失败，请手动复制', 'error'); }
    } else if (action === 'purchase') openPurchase(target.dataset.plan);
    else if (action === 'close-dialog') document.getElementById('global-dialog').close();
    else if (action === 'reload') render();
    else if (action === 'send-code') sendEmailCode(target);
    else if (action === 'cancel-order') {
      try { await api('/user/order/cancel', { method: 'POST', body: { trade_no: target.dataset.trade } }); toast('订单已取消'); render(); } catch (error) { toast(error.message, 'error'); }
    }
  });

  document.addEventListener('submit', event => {
    const form = event.target;
    if (!['auth-form', 'purchase-form', 'payment-form'].includes(form.id)) return;
    event.preventDefault();
    if (form.id === 'auth-form') handleAuth(form);
    if (form.id === 'purchase-form') createOrder(form);
    if (form.id === 'payment-form') checkout(form);
  });

  window.addEventListener('hashchange', render);

  (async function boot() {
    try { state.guest = await api('/guest/comm/config'); }
    catch (error) { state.guest = {}; toast(error.message, 'error', '无法读取站点配置'); }
    if (!location.hash) go(state.auth ? 'dashboard' : 'login');
    else render();
  })();
})();
