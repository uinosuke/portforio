/* ===============================
   画像ビューア（赤枠内表示版）
=============================== */
.image-viewer {
  position: relative;        /* fixed → relative に変更 */
  width: 100%;
  background: rgba(0,0,0,0.65);
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
  opacity: 1;                /* オーバーレイの fade を無効化 */
  transform: none;           /* これも無効化 */
  pointer-events: auto;      /* クリック可能に */
  display: none;             /* 初期は非表示 */
}

.image-viewer.open {
  display: block;            /* 開いたら表示 */
}

.viewer-left {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.viewer-image {
  max-width: 100%;
  max-height: 70vh;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.5);
}

.viewer-right {
  width: 100%;
  background: #1a1a1a;
  border-top: 1px solid #333;
  padding: 20px;
  margin-top: 20px;
}
