# CleanTube — YouTube Ad Blocker

Chrome / Chromium向けのManifest V3拡張機能です。YouTube上の広告関連リクエストをDeclarative Net Requestで遮断し、ページ内に挿入される広告枠をcontent scriptで除去します。

## インストール

1. `chrome://extensions` または `edge://extensions` を開く。
2. 「デベロッパーモード」を有効にする。
3. 「パッケージ化されていない拡張機能を読み込む」を選び、この `extension` フォルダを指定する。
4. YouTubeのタブを再読み込みする。

## 収録機能

- `doubleclick.net`、`googleadservices.com`、`googlesyndication.com` など広告配信ドメインのリクエスト遮断
- YouTubeの広告スロット、オーバーレイ、プロモーション要素の除去
- スキップボタンの自動クリックと広告表示中の動画位置スキップ（サイト側の変更により効かない場合があります）
- ポップアップからのON/OFF切り替えと状態保存

YouTubeは頻繁に仕様を変更するため、すべての広告を常に除去できることを保証するものではありません。広告ブロックが動画再生に影響する場合はポップアップから無効化してください。
