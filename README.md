TEAM BLACK　
プレスリリースを改善するためのレビュー機能をもったWebサービス

### メンバー

・佐藤 鴻成
・葉山 風宇刀
・北村 健紀
・森澤 翔吾

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
- `OPENAI_API_KEY`：OPENAIのAPIを利用するためにKEYが必要となります。

フロントエンドの API 接続先:
```bash
# frontend/.env
VITE_API_BASE_URL=http://localhost:3000
```

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
    docs/
      api.md
    Gemfile
    Dockerfile
  README.md
```
### backend説明
