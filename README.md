プレスリリースを改善するためのレビュー機能をもったWebサービス

### プロジェクトの概要
- **目的**: プレスリリースを入力すると、AIによる「改善提案」と、日本語校正サービス（Shodo）による校正結果を返します。
- **主な機能**:
  - API: `POST /api/analyze` で 5W2H と 9フックの観点から改善提案を返却
  - API: `POST /api/shodo` で Shodo に校正ジョブを作成し、即時完了なら結果、処理中ならタスクIDを返却
  - API: `GET /api/shodo/:id` で Shodo の校正結果を取得

### 使用している主な技術
- **Frontend**: Vite, React 19, TypeScript, Tailwind CSS 4, React Router, React Markdown
- **Backend**: Ruby 3.3, Rails 8 (API), RSpec, Faraday(+retry), rack-cors
- **Infra/その他**: Dockerfile（本番想定）、Solid Queue/Cache/Cable（Rails 8 同梱系）, Kamal（オプション）

### 必要な環境変数
バックエンドの Shodo 連携で使用します。`backend/.env` 等で設定してください（`dotenv-rails` あり）。
- `SHODO_API_URL`: Shodo API のベースURL（例: `https://api.example.com/`）
- `SHODO_TOKEN`: Shodo API の Bearer トークン
- オプション:
  - `SHODO_TIMEOUT_SEC` (デフォルト 10)
  - `SHODO_OPEN_TIMEOUT_SEC` (デフォルト 5)

フロントエンドの API 接続先:
```bash
# frontend/.env
VITE_API_BASE_URL=http://localhost:3000
```

### よく使うコマンド一覧
- フロントエンド
  - 開発起動: `cd frontend && npm ci && npm run dev`
  - 本番ビルド: `npm run build`
  - Lint: `npm run lint`
- バックエンド
  - 依存インストール: `cd backend && bundle install`
  - 開発サーバー: `bin/rails server`
  - RSpec 実行: `bundle exec rspec`
  - RuboCop: `bundle exec rubocop`
  - Brakeman: `bundle exec brakeman`

### ディレクトリ構成（抜粋）
```
TEAM-BLACK/
  frontend/
    src/
    public/
    package.json
    vite.config.ts
  backend/
    app/
      controllers/
        api/
          analyzes_controller.rb
          shodo_controller.rb
      models/
      services/
        shodo_service.rb
    config/
      routes.rb
    spec/
      requests/
        api/
          analyzes_spec.rb
          shodo_spec.rb
    Gemfile
    Dockerfile
  README.md
```

### 開発環境の構築方法
1. リポジトリを取得
   ```bash
   git clone <this-repo>
   cd TEAM-BLACK
   ```
2. フロントエンドのセットアップ
   ```bash
   cd frontend
   cp .env.example .env  # なければ手動で .env を作成
   echo "VITE_API_BASE_URL=http://localhost:3000" > .env
   npm ci
   npm run dev
   ```
3. バックエンドのセットアップ
   ```bash
   cd ../backend
   bundle install
   # 必要に応じて .env を作成して Shodo のキー等を設定
   # echo "SHODO_API_URL=..." >> .env
   # echo "SHODO_TOKEN=..."   >> .env
   bin/rails db:prepare
   bin/rails server
   ```
4. 動作確認
   - `POST /api/analyze` に `title/lead/body/contact` を送ると改善提案が返ります
   - `POST /api/shodo` に本文等を送ると校正ジョブが作成されます
   - `GET /api/shodo/:id` で結果取得

### テスト
```bash
cd backend
bundle exec rspec --format documentation
```
