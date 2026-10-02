# HALF STREAK — Unity UI Toolkit版

既存のHALF / SPLITデザインを、Unity UI Toolkitだけで動くゲームとして移植したサンプルです。

## 対応環境

- Unity 2022.3 LTS以上
- UI Toolkit（Unity標準）
- 追加パッケージ不要

## 起動

1. Unity Hubでこの`unity`フォルダをプロジェクトとして開く
2. `Assets/Scenes/HalfStreak.unity`を開く
3. Playを押す（`HalfStreakBootstrap`がUI Toolkitの画面を自動生成）

## 操作

- 左半分／右半分をクリックまたはタップ
- `A` / `←`で左、`D` / `→`で右
- ミス後に左右どちらかを選ぶと新しいラウンドを開始
- ベスト連勝は`PlayerPrefs`へ保存

## 構成

- `Assets/UI/HalfStreak.uxml`: UI Toolkitの画面構造
- `Assets/UI/HalfStreak.uss`: ネオ・ブルータリズムのスタイルとレスポンシブ対応
- `Assets/Scripts/HalfStreakController.cs`: ゲーム状態、入力、記録、演出
- `Assets/Scenes/HalfStreak.unity`: 起動シーン
- `Assets/Scripts/HalfStreakBootstrap.cs`: UXML/USSをResourcesから読み込む自動起動

## 注意

`Assets/Resources`にもUXML/USSを配置しているため、シーンへの手動参照は不要です。Unityが`.meta`を再生成した場合でも、Resourcesのファイル名は変更しないでください。
