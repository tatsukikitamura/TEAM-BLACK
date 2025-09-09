### Backend（Rails API）

このドキュメントは backend（Rails API）に関する情報のみをまとめたものです。

### 主な技術
- Ruby 3.3.0
- Rails 8.0.2（API）
- Shodo
- RSpec（テスト用）
- Faraday / faraday-retry（外部 API 連携）
- rack-cors（CORS）
- Solid Queue / Solid Cache / Solid Cable（Rails 8 同梱）
- Dockerfile（本番想定ビルド）

### プロジェクトの概要

- フロントエンドから受け取ったプレスリリース情報をもとに、
  - `OpenAiJudge` を用いた改善提案（5W2H＋9フックの不足抽出）
  - `ShodoService` を用いた日本語校正（外部 Shodo API 連携）
  を提供する API を実装しています。

- 主要エンドポイント（`config/routes.rb`）
  - `POST /api/analyze` → `Api::AnalyzesController#create`
  - `POST /api/shodo` → `Api::ShodoController#create`
  - `GET  /api/shodo/:id` → `Api::ShodoController#show`

### 必要な環境変数やコマンド一覧

- 必要な環境変数（`.env` などに設定可能。`dotenv-rails` 利用可）
  - `SHODO_API_URL`（必須）: Shodo API のベース URL
  - `SHODO_TOKEN`（必須）: Shodo API の Bearer トークン
  - `OPENAI_API_KEY`（必須）：

### ディレクトリ構成（抜粋）
```
backend/
  app/
    controllers/
      api/
        analyzes_controller.rb
        shodo_controller.rb
    models/
      application_record.rb
      markdown_parser.rb
    services/
      shodo_service.rb
  config/
    routes.rb
  spec/
    requests/
      api/
        analyzes_spec.rb
        # shodo_spec.rb（任意・追加可能）
    rails_helper.rb
    spec_helper.rb
  Dockerfile
  Gemfile
  Gemfile.lock
  Rakefile




