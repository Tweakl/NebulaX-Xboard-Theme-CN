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
    docs: [], invite: null, nodes: [], tickets: [], traffic: [],
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

  function safeHtml(value) {
    const template = document.createElement('template');
    template.innerHTML = String(value || '');
    template.content.querySelectorAll('script,style,iframe,object,embed,form').forEach(node => node.remove());
    template.content.querySelectorAll('*').forEach(node => [...node.attributes].forEach(attr => {
      if (/^on/i.test(attr.name) || ((attr.name === 'href' || attr.name === 'src') && /^\s*javascript:/i.test(attr.value))) node.removeAttribute(attr.name);
    }));
    return template.innerHTML;
  }

  function icon(name) {
    const paths = {
      dashboard: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
      plans: '<path d="M4 7h16M4 12h16M4 17h10"/><circle cx="18" cy="17" r="2"/>',
      orders: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z"/><path d="M9 8h6M9 12h6"/>',
      docs: '<path d="M4 5a3 3 0 0 1 3-3h12v17H7a3 3 0 0 0-3 3V5z"/><path d="M7 2v17M9 7h7M9 11h6"/>',
      invite: '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0M17 7v6M14 10h6"/>',
      nodes: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
      ticket: '<path d="M4 4h16v13H8l-4 4V4z"/><path d="M8 9h8M8 13h5"/>',
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
    const docs = [
      { id: 1, category: '快速开始', title: '如何开始使用', body: '<h2>三步完成连接</h2><p>购买订阅后复制订阅链接，导入客户端并选择节点即可。</p><ol><li>购买适合的套餐</li><li>复制仪表盘中的订阅链接</li><li>导入客户端并更新订阅</li></ol>', updated_at: now },
      { id: 2, category: '常见问题', title: '订阅无法更新怎么办', body: '<p>请先确认套餐未到期，再尝试切换网络并重新更新订阅。</p>', updated_at: now - 86400 },
      { id: 3, category: '客户端', title: '设备与客户端说明', body: '<p>请使用服务商推荐的客户端，并避免公开分享订阅链接。</p>', updated_at: now - 86400 * 3 }
    ];
    const tickets = [{ id: 12, level: 1, reply_status: 1, status: 0, subject: '客户端连接问题', created_at: now - 7200, updated_at: now - 1800 }];
    const queryId = new URLSearchParams(path.split('?')[1] || '').get('id');
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
      : path.includes('/knowledge/fetch') ? (queryId ? docs.find(item => String(item.id) === queryId) : Object.values(docs.reduce((groups, item) => { (groups[item.category] ||= []).push(item); return groups; }, {})))
      : path.includes('/invite/fetch') ? { codes: [{ code: 'NEBULA8X', pv: 4, status: 0, created_at: now - 86400 * 12 }], stat: [8, 3680, 1200, 10, 2480] }
      : path.includes('/invite/details') ? { data: [{ id: 1, commission_amount: 1280, created_at: now - 86400 * 2 }], total: 1 }
      : path.includes('/invite/save') ? true
      : path.includes('/server/fetch') ? [{ id: 1, type: 'shadowsocks', name: '香港 · 星港', rate: 1, tags: ['低延迟'], is_online: true, last_check_at: now }, { id: 2, type: 'vless', name: '日本 · 东京', rate: 1.2, tags: ['流媒体'], is_online: true, last_check_at: now }, { id: 3, type: 'trojan', name: '美国 · 洛杉矶', rate: 1.5, tags: ['大带宽'], is_online: false, last_check_at: now - 600 }]
      : path.includes('/ticket/fetch') ? (queryId ? Object.assign({}, tickets[0], { message: [{ id: 1, is_me: true, message: '导入订阅后无法连接，请协助检查。', created_at: now - 7200 }, { id: 2, is_me: false, message: '您好，请更新订阅后重新测试。', created_at: now - 1800 }] }) : tickets)
      : path.includes('/ticket/save') || path.includes('/ticket/reply') || path.includes('/ticket/close') ? true
      : path.includes('/stat/getTrafficLog') ? [{ d: 3.4 * 1024 ** 3, u: .8 * 1024 ** 3, record_at: now - 86400 * 2, server_rate: 1 }, { d: 6.2 * 1024 ** 3, u: 1.1 * 1024 ** 3, record_at: now - 86400, server_rate: 1.2 }, { d: 2.8 * 1024 ** 3, u: .5 * 1024 ** 3, record_at: now, server_rate: 1 }]
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
          ${nav('dashboard', '仪表盘', 'dashboard')}
          ${nav('docs', '使用文档', 'docs')}
          <p class="nav-label">财务</p>
          ${nav('orders', '我的订单', 'orders')}
          ${nav('invites', '我的邀请', 'invite')}
          <p class="nav-label">订阅</p>
          ${nav('plans', '购买订阅', 'plans')}
          ${nav('nodes', '节点状态', 'nodes')}
          <p class="nav-label">用户</p>
          ${nav('account', '个人中心', 'user')}
          ${nav('tickets', '我的工单', 'ticket')}
          ${nav('traffic', '流量明细', 'chart')}
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
        ${nav('dashboard', '首页', 'dashboard')}${nav('plans', '订阅', 'plans')}${nav('docs', '文档', 'docs')}${nav('tickets', '工单', 'ticket')}${nav('account', '我的', 'user')}
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
    app.innerHTML = shell(`${pageHead('Plans', '选择适合你的方案', '所有价格与流量都清楚列出，没有藏起来的小字。')}<div class="plan-grid"><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div></div>`, '购买订阅');
    try {
      const plans = await api(state.auth ? '/user/plan/fetch' : '/guest/plan/fetch');
      if (id !== state.renderId) return;
      state.plans = (Array.isArray(plans) ? plans : []).filter(plan => plan.show !== false);
      const cards = state.plans.map((plan, index) => planCard(plan, index === 1)).join('');
      const content = `${pageHead('Plans', '选择适合你的方案', '按需求选择周期，随时可以在账户中查看订单。')}<div class="plan-grid">${cards || empty('暂时没有可售套餐', '管理员还没有发布订阅套餐。')}</div>`;
      app.innerHTML = shell(content, '购买订阅');
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

  async function renderDocs(id) {
    app.innerHTML = shell(`${pageHead('Knowledge', '使用文档', '安装、连接和常见问题说明。')}<div class="grid grid-2"><div class="skeleton"></div><div class="skeleton"></div></div>`, '使用文档');
    try {
      const result = await api('/user/knowledge/fetch?language=zh-CN');
      if (id !== state.renderId) return;
      const groups = Array.isArray(result) ? result : Object.values(result || {});
      state.docs = groups.flatMap(group => Array.isArray(group) ? group : [group]).filter(Boolean);
      const byCategory = state.docs.reduce((all, article) => { (all[article.category || '使用指南'] ||= []).push(article); return all; }, {});
      const sections = Object.entries(byCategory).map(([category, articles]) => `<section class="card card-pad doc-category"><div class="card-title"><div><h2>${e(category)}</h2><p>${articles.length} 篇文档</p></div>${icon('docs')}</div><div class="doc-list">${articles.map(article => `<button class="doc-link" data-action="open-doc" data-id="${e(article.id)}"><span><b>${e(article.title)}</b><small>更新于 ${date(article.updated_at)}</small></span>${icon('arrow')}</button>`).join('')}</div></section>`).join('');
      app.innerHTML = shell(`${pageHead('Knowledge', '使用文档', '从快速入门到常见问题，答案都整理在这里。')}<div class="grid grid-2">${sections || empty('还没有文档', '管理员暂未发布使用说明。')}</div>`, '使用文档');
    } catch (error) { renderError(error); }
  }

  async function renderInvites(id) {
    app.innerHTML = shell(`${pageHead('Referral', '我的邀请', '查看邀请码和返佣统计。')}<div class="grid grid-4"><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div></div>`, '我的邀请');
    try {
      const invite = await api('/user/invite/fetch');
      if (id !== state.renderId) return;
      state.invite = invite || { codes: [], stat: [] };
      const stat = state.invite.stat || [];
      const codes = Array.isArray(state.invite.codes) ? state.invite.codes : [];
      const rows = codes.map(item => { const link = `${location.origin}/#/register?code=${encodeURIComponent(item.code)}`; return `<tr><td><strong>${e(item.code)}</strong></td><td>${e(item.pv || 0)}</td><td>${date(item.created_at)}</td><td><button class="btn btn-secondary btn-sm" data-action="copy-invite" data-link="${e(link)}">${icon('copy')} 复制链接</button></td></tr>`; }).join('');
      const content = `${pageHead('Referral', '我的邀请', '分享邀请码，清楚查看邀请人数与返佣。', '<button class="btn btn-primary" data-action="generate-invite">生成邀请码</button>')}
        <div class="grid grid-4"><div class="card stat-card"><span class="stat-icon">${icon('invite')}</span><strong>${e(stat[0] || 0)}</strong><span>已注册用户</span></div><div class="card stat-card"><span class="stat-icon">${icon('wallet')}</span><strong>${money(stat[1])}</strong><span>有效佣金</span></div><div class="card stat-card"><span class="stat-icon">${icon('calendar')}</span><strong>${money(stat[2])}</strong><span>待确认佣金</span></div><div class="card stat-card"><span class="stat-icon">${icon('chart')}</span><strong>${e(stat[3] || 0)}%</strong><span>返佣比例</span></div></div>
        <section class="card" style="margin-top:20px">${rows ? `<div class="table-wrap"><table class="table"><thead><tr><th>邀请码</th><th>访问量</th><th>创建时间</th><th>操作</th></tr></thead><tbody>${rows}</tbody></table></div>` : empty('还没有邀请码', '点击右上角生成第一个邀请码。')}</section>`;
      app.innerHTML = shell(content, '我的邀请');
    } catch (error) { renderError(error); }
  }

  async function renderNodes(id) {
    app.innerHTML = shell(`${pageHead('Network', '节点状态', '实时查看线路可用状态。')}<div class="node-grid"><div class="skeleton"></div><div class="skeleton"></div></div>`, '节点状态');
    try {
      const result = await api('/user/server/fetch');
      if (id !== state.renderId) return;
      state.nodes = Array.isArray(result) ? result : (result?.data || []);
      const online = state.nodes.filter(node => Boolean(node.is_online)).length;
      const cards = state.nodes.map(node => `<article class="card node-card"><div class="node-head"><span class="node-dot ${node.is_online ? 'online' : ''}"></span><div><h2>${e(node.name)}</h2><p>${e(String(node.type || '').toUpperCase())}</p></div><span class="status ${node.is_online ? 'success' : 'danger'}">${node.is_online ? '在线' : '维护中'}</span></div><div class="info-list"><div class="info-item"><span>流量倍率</span><b>${e(node.rate || 1)}×</b></div><div class="info-item"><span>节点标签</span><b>${(node.tags || []).map(tag => e(tag)).join(' · ') || '标准线路'}</b></div><div class="info-item"><span>最近检测</span><b>${date(node.last_check_at)}</b></div></div></article>`).join('');
      app.innerHTML = shell(`${pageHead('Network', '节点状态', `${online} / ${state.nodes.length} 个节点在线，状态会随服务端检测更新。`)}<div class="node-grid">${cards || empty('暂无可用节点', '当前套餐没有可展示的节点。')}</div>`, '节点状态');
    } catch (error) { renderError(error); }
  }

  async function renderTickets(id) {
    app.innerHTML = shell(`${pageHead('Support', '我的工单', '查看与客服的沟通记录。')}<div class="card skeleton"></div>`, '我的工单');
    try {
      const tickets = await api('/user/ticket/fetch');
      if (id !== state.renderId) return;
      state.tickets = Array.isArray(tickets) ? tickets : [];
      const rows = state.tickets.map(item => `<tr><td><button class="table-link" data-action="open-ticket" data-id="${e(item.id)}"><strong>${e(item.subject)}</strong><br><small>#${e(item.id)}</small></button></td><td><span class="status ${Number(item.status) === 0 ? 'success' : 'warning'}">${Number(item.status) === 0 ? '处理中' : '已关闭'}</span></td><td>${Number(item.reply_status) === 1 ? '有新回复' : '等待回复'}</td><td>${date(item.updated_at || item.created_at)}</td></tr>`).join('');
      app.innerHTML = shell(`${pageHead('Support', '我的工单', '提交问题、查看回复，解决过程不会丢失。', '<button class="btn btn-primary" data-action="new-ticket">新建工单</button>')}<section class="card">${rows ? `<div class="table-wrap"><table class="table"><thead><tr><th>主题</th><th>状态</th><th>回复</th><th>更新时间</th></tr></thead><tbody>${rows}</tbody></table></div>` : empty('还没有工单', '遇到问题时，可以创建一张新工单。')}</section>`, '我的工单');
    } catch (error) { renderError(error); }
  }

  async function renderTraffic(id) {
    app.innerHTML = shell(`${pageHead('Usage', '流量明细', '查看每日上传和下载用量。')}<div class="card skeleton"></div>`, '流量明细');
    try {
      const traffic = await api('/user/stat/getTrafficLog');
      if (id !== state.renderId) return;
      state.traffic = Array.isArray(traffic) ? traffic : (traffic?.data || []);
      const max = Math.max(1, ...state.traffic.map(item => Number(item.u || 0) + Number(item.d || 0)));
      const totalUp = state.traffic.reduce((sum, item) => sum + Number(item.u || 0), 0);
      const totalDown = state.traffic.reduce((sum, item) => sum + Number(item.d || 0), 0);
      const bars = state.traffic.map(item => { const total = Number(item.u || 0) + Number(item.d || 0); return `<div class="traffic-row"><span>${date(item.record_at)}</span><div class="traffic-track"><i style="width:${Math.max(3, total / max * 100)}%"></i></div><b>${bytes(total)}</b><small>上 ${bytes(item.u)} · 下 ${bytes(item.d)} · ${e(item.server_rate || 1)}×</small></div>`; }).join('');
      const content = `${pageHead('Usage', '流量明细', '统计记录由服务端生成，倍率已经单独标注。')}<div class="grid grid-3"><div class="card stat-card"><span class="stat-icon">${icon('chart')}</span><strong>${bytes(totalUp + totalDown)}</strong><span>记录总用量</span></div><div class="card stat-card"><span class="stat-icon">${icon('arrow')}</span><strong>${bytes(totalDown)}</strong><span>下载流量</span></div><div class="card stat-card"><span class="stat-icon">${icon('refresh')}</span><strong>${bytes(totalUp)}</strong><span>上传流量</span></div></div><section class="card card-pad traffic-history" style="margin-top:20px">${bars || empty('暂无流量记录', '开始使用节点后，明细会显示在这里。')}</section>`;
      app.innerHTML = shell(content, '流量明细');
    } catch (error) { renderError(error); }
  }

  async function renderAccount(id) {
    app.innerHTML = shell(`${pageHead('Account', '个人中心', '管理个人信息与安全选项。')}<div class="grid grid-2"><div class="skeleton"></div><div class="skeleton"></div></div>`, '个人中心');
    try {
      const user = state.user || await api('/user/info');
      if (id !== state.renderId) return;
      state.user = user;
      const content = `${pageHead('Account', '个人中心', '你的账户资料与常用操作。')}
        <div class="grid grid-2"><section class="card card-pad"><div class="profile-card"><div class="profile-avatar">${e(initials(user.email))}</div><div><h2>${e(user.email)}</h2><p>加入于 ${date(user.created_at)}</p></div></div><div class="info-list" style="margin-top:22px"><div class="info-item"><span>账户余额</span><b>${money(user.balance)}</b></div><div class="info-item"><span>套餐编号</span><b>${e(user.plan_id || '暂无')}</b></div><div class="info-item"><span>到期时间</span><b>${date(user.expired_at)}</b></div><div class="info-item"><span>账户状态</span><b><span class="status ${user.banned ? 'danger' : 'success'}">${user.banned ? '已停用' : '正常'}</span></b></div></div></section>
        <section class="card card-pad"><div class="card-title"><div><h2>偏好设置</h2><p>这些设置保存在当前浏览器</p></div></div><div class="info-list"><div class="info-item"><span>界面主题</span><button class="btn btn-secondary btn-sm" data-action="theme">切换深浅色</button></div><div class="info-item"><span>客服支持</span>${config.supportUrl ? `<a class="text-link" href="${e(config.supportUrl)}" target="_blank" rel="noopener">打开客服</a>` : '<b>未配置</b>'}</div><div class="info-item"><span>前端版本</span><b>NebulaX 1.1.0</b></div><div class="info-item"><span>登录状态</span><button class="btn btn-danger btn-sm" data-action="logout">退出登录</button></div></div></section></div>`;
      app.innerHTML = shell(content, '个人中心');
    } catch (error) { renderError(error); }
  }

  function empty(title, message) { return `<div class="empty">${icon('empty')}<h3>${e(title)}</h3><p>${e(message)}</p></div>`; }
  function renderError(error) {
    const content = `${pageHead('Connection', '页面暂时无法载入', '服务器返回了一个错误。')}<section class="card empty">${icon('info')}<h3>${e(error.message || '加载失败')}</h3><p>请检查网络或稍后再试。</p><button class="btn btn-primary" data-action="reload" style="margin-top:16px">${icon('refresh')} 重新加载</button></section>`;
    app.innerHTML = state.auth ? shell(content, '连接异常') : app.innerHTML;
  }

  async function openDoc(articleId) {
    const dialog = document.getElementById('global-dialog');
    dialog.innerHTML = `<div class="dialog-head"><h3>正在载入文档…</h3><button class="icon-btn" data-action="close-dialog">${icon('close')}</button></div>`;
    if (!dialog.open) dialog.showModal();
    try {
      const article = state.docs.find(item => String(item.id) === String(articleId)) || await api(`/user/knowledge/fetch?id=${encodeURIComponent(articleId)}&language=zh-CN`);
      dialog.innerHTML = `<div class="dialog-head"><div><h3>${e(article.title)}</h3><small>${e(article.category || '使用文档')}</small></div><button class="icon-btn" data-action="close-dialog">${icon('close')}</button></div><article class="dialog-body rich-text">${safeHtml(article.body || '<p>暂无内容</p>')}</article>`;
    } catch (error) { dialog.close(); toast(error.message, 'error'); }
  }

  function openTicketCreate() {
    const dialog = document.getElementById('global-dialog');
    dialog.innerHTML = `<div class="dialog-head"><h3>新建工单</h3><button class="icon-btn" data-action="close-dialog">${icon('close')}</button></div><form class="dialog-body form" id="ticket-create-form"><div class="field"><label for="ticket_subject">主题</label><input class="input" id="ticket_subject" name="subject" required maxlength="120" placeholder="简要描述问题"></div><div class="field"><label for="ticket_level">优先级</label><select class="input" id="ticket_level" name="level"><option value="0">一般</option><option value="1">紧急</option><option value="2">非常紧急</option></select></div><div class="field"><label for="ticket_message">问题详情</label><textarea class="input textarea" id="ticket_message" name="message" required rows="6" placeholder="请写明设备、客户端和错误现象"></textarea></div><div class="dialog-actions"><button class="btn btn-secondary" type="button" data-action="close-dialog">取消</button><button class="btn btn-primary" type="submit">提交工单</button></div></form>`;
    if (!dialog.open) dialog.showModal();
  }

  async function openTicket(ticketId) {
    const dialog = document.getElementById('global-dialog');
    dialog.innerHTML = `<div class="dialog-head"><h3>正在载入工单…</h3><button class="icon-btn" data-action="close-dialog">${icon('close')}</button></div>`;
    if (!dialog.open) dialog.showModal();
    try {
      const ticket = await api(`/user/ticket/fetch?id=${encodeURIComponent(ticketId)}`);
      const messages = Array.isArray(ticket.message) ? ticket.message : [];
      dialog.innerHTML = `<div class="dialog-head"><div><h3>${e(ticket.subject)}</h3><small>工单 #${e(ticket.id)}</small></div><button class="icon-btn" data-action="close-dialog">${icon('close')}</button></div><div class="dialog-body"><div class="ticket-thread">${messages.map(message => `<div class="ticket-message ${message.is_me ? 'me' : ''}"><b>${message.is_me ? '我' : '客服'}</b><p>${e(message.message)}</p><small>${date(message.created_at)}</small></div>`).join('') || '<p class="field-hint">暂无回复内容。</p>'}</div>${Number(ticket.status) === 0 ? `<form class="form" id="ticket-reply-form" data-id="${e(ticket.id)}"><div class="field"><label for="ticket_reply">继续回复</label><textarea class="input textarea" id="ticket_reply" name="message" required rows="4" placeholder="输入回复内容"></textarea></div><div class="dialog-actions"><button class="btn btn-danger" type="button" data-action="close-ticket" data-id="${e(ticket.id)}">关闭工单</button><button class="btn btn-primary" type="submit">发送回复</button></div></form>` : '<p class="field-hint">此工单已关闭。</p>'}</div>`;
    } catch (error) { dialog.close(); toast(error.message, 'error'); }
  }

  async function submitTicket(form) {
    const button = form.querySelector('[type="submit"]'); button.disabled = true;
    try {
      const data = Object.fromEntries(new FormData(form).entries()); data.level = Number(data.level || 0);
      await api('/user/ticket/save', { method: 'POST', body: data });
      document.getElementById('global-dialog').close(); toast('工单已提交'); render();
    } catch (error) { toast(error.message, 'error'); button.disabled = false; }
  }

  async function replyTicket(form) {
    const button = form.querySelector('[type="submit"]'); button.disabled = true;
    try {
      await api('/user/ticket/reply', { method: 'POST', body: { id: form.dataset.id, message: new FormData(form).get('message') } });
      toast('回复已发送'); openTicket(form.dataset.id);
    } catch (error) { toast(error.message, 'error'); button.disabled = false; }
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
    const dialog = document.getElementById('global-dialog');
    if (dialog?.open) dialog.close();
    let route = routeName();
    if (!state.auth && !['login', 'register'].includes(route)) route = 'login';
    if (state.auth && ['login', 'register'].includes(route)) route = 'dashboard';
    if (route !== routeName()) { go(route); return; }
    if (route === 'login' || route === 'register') return authPage(route);
    if (route === 'docs') return renderDocs(id);
    if (route === 'plans') return renderPlans(id);
    if (route === 'orders') return renderOrders(id);
    if (route === 'invites') return renderInvites(id);
    if (route === 'nodes') return renderNodes(id);
    if (route === 'tickets') return renderTickets(id);
    if (route === 'traffic') return renderTraffic(id);
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
    } else if (action === 'copy-invite') {
      try { await navigator.clipboard.writeText(target.dataset.link || ''); toast('邀请链接已复制'); } catch { toast('复制失败，请手动复制', 'error'); }
    } else if (action === 'open-doc') openDoc(target.dataset.id);
    else if (action === 'new-ticket') openTicketCreate();
    else if (action === 'open-ticket') openTicket(target.dataset.id);
    else if (action === 'generate-invite') {
      try { await api('/user/invite/save'); toast('邀请码已生成'); render(); } catch (error) { toast(error.message, 'error'); }
    } else if (action === 'close-ticket') {
      try { await api('/user/ticket/close', { method: 'POST', body: { id: target.dataset.id } }); document.getElementById('global-dialog').close(); toast('工单已关闭'); render(); } catch (error) { toast(error.message, 'error'); }
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
    if (!['auth-form', 'purchase-form', 'payment-form', 'ticket-create-form', 'ticket-reply-form'].includes(form.id)) return;
    event.preventDefault();
    if (form.id === 'auth-form') handleAuth(form);
    if (form.id === 'purchase-form') createOrder(form);
    if (form.id === 'payment-form') checkout(form);
    if (form.id === 'ticket-create-form') submitTicket(form);
    if (form.id === 'ticket-reply-form') replyTicket(form);
  });

  window.addEventListener('hashchange', render);

  (async function boot() {
    try { state.guest = await api('/guest/comm/config'); }
    catch (error) { state.guest = {}; toast(error.message, 'error', '无法读取站点配置'); }
    if (!location.hash) go(state.auth ? 'dashboard' : 'login');
    else render();
  })();
})();
