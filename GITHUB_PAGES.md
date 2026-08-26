# GitHub Pages 公開手順

このプロジェクトには、GitHub Pages 用の公開ワークフローが含まれています。`main` ブランチへ反映すると、静的サイトが自動的にビルド・公開されます。

## 初回設定

対象リポジトリの **Settings → Pages** を開き、公開元として **GitHub Actions** を選択してください。その後、`.github/workflows/deploy-pages.yml` を含む変更を `main` ブランチへ反映すると、Actions タブから公開処理の進行を確認できます。

| リポジトリの種類 | 公開先 | このプロジェクトの設定 |
|---|---|---|
| 通常のリポジトリ | `https://<OWNER>.github.io/<REPOSITORY>/` | リポジトリ名を自動検出してベースパスを設定します。 |
| `<OWNER>.github.io` リポジトリ | `https://<OWNER>.github.io/` | ルートパスで公開します。 |

## ローカルでの確認

通常リポジトリの配下に公開する構成を確認する場合は、次のようにビルドします。

```bash
GITHUB_REPOSITORY=<OWNER>/<REPOSITORY> pnpm build:pages
pnpm vite preview --outDir dist/public
```

GitHub Actions 上では `GITHUB_REPOSITORY` が自動設定されるため、追加の環境変数は不要です。公開用の成果物は `dist/public` に出力されます。

## 参考資料

GitHub Pages は GitHub Actions のワークフローから静的成果物を公開できます。必要な権限とデプロイ手順は、[GitHubの公式ガイド](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)を参照してください。Vite プロジェクトをリポジトリ配下で公開する場合は、適切な `base` の設定が必要です。[Viteの公開ガイド](https://vite.dev/guide/static-deploy)を参照してください。
