<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MyPortfolio</title>
  <link rel="stylesheet" href="style.css" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">

</head>

<body>

  <!-- ===============================
       ヘッダー
  =============================== -->
  <header class="header">
    <h1 id="site-title">MyPortfolio</h1>

    <!-- PC用検索バー -->
    <div class="search-box pc-search">
      <i class="fa-solid fa-magnifying-glass search-icon"></i>
      <input id="search-input" type="text" placeholder="検索..." />
      <span id="search-clear">×</span>
    </div>

    <!-- ハンバーガー -->
    <div class="mobile-menu-btn">
      <span></span>
      <span></span>
      <span></span>
    </div>
  </header>

  <!-- ===============================
       スマホメニュー
  =============================== -->
  <div class="mobile-menu-panel">

    <a class="nav-item" href="#gallery" data-view="gallery">画像一覧</a>
    <a class="nav-item" href="#about" data-view="about">ABOUT</a>
    <a class="nav-item" href="#info" data-view="info">制作について</a>
    <a class="nav-item" href="https://himawari-fukushikai.org//" target="_blank">法人HP</a>

    <!-- スマホ専用検索バー -->
    <div class="mobile-search-area">
      <div class="mobile-search-box">
        <i class="fa-solid fa-magnifying-glass search-icon"></i>
        <input id="mobile-search-input" type="text" placeholder="検索..." />
        <button id="mobile-search-btn">検索</button>
      </div>
    </div>

    <a class="consult-btn" href="https://works.do/R/ti/p/300885@himawari-fukushikai" target="_blank">
      ご相談はこちら
    </a>

  </div>

  <!-- ===============================
       レイアウト
  =============================== -->
  <div class="layout">

    <!-- PCサイドバー -->
    <aside class="sidebar">
      <a class="nav-item" href="#gallery" data-view="gallery">画像一覧</a>
      <a class="nav-item" href="#about" data-view="about">ABOUT</a>
      <a class="nav-item" href="#info" data-view="info">制作について</a>
      <a class="nav-item" href="https://himawari-fukushikai.org//" target="_blank">法人HP</a>

      <div class="sidebar-bottom">
        <a class="consult-btn" href="https://works.do/R/ti/p/300885@himawari-fukushikai" target="_blank">
          ご相談はこちら
        </a>

        <div id="admin-panel" class="admin-only">管理者モード</div>
      </div>
    </aside>

    <!-- ===============================
         メイン
    =============================== -->
    <main class="main">

      <!-- 画像一覧 -->
      <section id="view-gallery" class="view">
        <div id="works-list" class="works-grid"></div>
      </section>

      <!-- ABOUT -->
      <section id="view-about" class="view hidden">
        <h2>ABOUT</h2>
        <div id="about-content"></div>
        <button id="edit-about" class="admin-only">編集</button>
      </section>

      <!-- 制作について -->
      <section id="view-info" class="view hidden">
        <h2>制作について</h2>
        <div id="info-content"></div>
        <button id="edit-info" class="admin-only">編集</button>
      </section>

    </main>
  </div>

  <!-- ===============================
       画像ビューア
  =============================== -->
  <div id="image-viewer" class="image-viewer">

    <!-- スマホ専用 × ボタン -->
    <button id="viewer-close-btn" class="viewer-close-btn">×</button>

    <div class="viewer-left">
      <button class="viewer-arrow left" id="viewer-prev">‹</button>
      <img id="viewer-image" class="viewer-image" src="" alt="" />
      <button class="viewer-arrow right" id="viewer-next">›</button>
    </div>

    <div class="viewer-right">
      <div class="viewer-drag-handle"></div>

      <h3 class="viewer-section-title">TITLE</h3>
      <p id="viewer-title"></p>

      <h3 class="viewer-section-title">TAGS</h3>
      <div id="viewer-tags"></div>

      <h3 class="viewer-section-title">DESCRIPTION</h3>
      <p id="viewer-description"></p>
    </div>
  </div>

  <!-- ===============================
       モーダル
  =============================== -->
  <div id="edit-modal" class="modal">
    <div class="modal-content">
      <h3 id="modal-title"></h3>
      <textarea id="modal-textarea"></textarea>
      <div class="modal-buttons">
        <button class="modal-btn save" id="modal-save">保存</button>
        <button class="modal-btn cancel" id="modal-cancel">キャンセル</button>
      </div>
    </div>
  </div>

  <script src="app.js"></script>
</body>
</html>
