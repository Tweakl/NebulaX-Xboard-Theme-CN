<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="{{ $theme_config['primary_color'] ?? '#6d5dfc' }}">
  <meta name="description" content="{{ $description ?? '' }}">
  <title>{{ $title }}</title>
  @if (file_exists(public_path("/theme/{$theme}/favicon.ico")))
    <link rel="icon" href="/theme/{{ $theme }}/favicon.ico">
  @endif
  <link rel="stylesheet" href="/theme/{{ $theme }}/assets/theme.css?v=1.0.0">
</head>
<body>
  <div id="app" aria-live="polite">
    <div class="boot-screen">
      <div class="brand-mark brand-mark--large"><span></span><span></span></div>
      <div class="boot-line"><i></i></div>
      <p>正在连接控制中心…</p>
    </div>
  </div>

  <script>
    window.XBOARD_THEME = {!! json_encode([
      'title' => $title,
      'description' => $description ?? '',
      'version' => $version ?? '',
      'logo' => $logo ?? '',
      'brandName' => $theme_config['brand_name'] ?? 'NebulaX',
      'tagline' => $theme_config['tagline'] ?? '让连接简单、稳定、清晰',
      'primaryColor' => $theme_config['primary_color'] ?? '#6d5dfc',
      'logoUrl' => $theme_config['logo_url'] ?? '',
      'announcement' => $theme_config['announcement'] ?? '',
      'supportUrl' => $theme_config['support_url'] ?? '',
      'footerText' => $theme_config['footer_text'] ?? 'Powered by Xboard'
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) !!};
  </script>
  <script defer src="/theme/{{ $theme }}/assets/theme.js?v=1.0.0"></script>
  {!! $theme_config['custom_html'] ?? '' !!}
</body>
</html>
