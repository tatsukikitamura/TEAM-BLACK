rspecを用いたtestについて

成功時の出力例：

tatsuki@tatsuki:~/TEAM-BLACK/backend$ bundle exec rspec --format documentation | cat

Api::AnalyzesController
  POST /api/analyze
    正常なリクエストの場合
      HTTPステータス200 (ok) が返ること
      レスポンスJSONにaiキーが含まれていること
    必須パラメータ（markdown）が欠落している場合
      HTTPステータス400 (bad_request)の時に200 が返ること

Api::ImagesController
  POST /api/image（画像解析）
    OpenAIの応答から result が返ること

Api::ShodoController
  POST /api/shodo（校正ジョブ作成）
    Shodo が即時に完了した場合は done を返すこと
    処理中の場合は 202 Accepted と task_id を返すこと
    全フィールドが空の場合は 400 BadRequest を返すこと
  GET /api/shodo/:id（校正結果取得）
    完了済みジョブなら done を返すこと

Finished in 27.22 seconds (files took 3.76 seconds to load)
8 examples, 0 failures

このテストでわかること（詳細）

1) Analyze API（/api/analyze）
- 目的: 入力テキスト（markdown）を解析し、AIによる提案（aiキー）を返すことを確認
- テスト観点:
  - 正常系: 200 OK が返り、JSON に ai キーが含まれる
  - 異常系: 必須パラメータ省略時の挙動

2) Image API（/api/image）
- 目的: 画像URLを OpenAI に渡し、判定結果テキストを `result` として返すことを確認
- 外部依存のスタブ化:
  - `OpenAI::Client` を test 内でダブルに置き換え、`chat` の戻り値を固定
- サンプル（RSpec 抜粋）:
  - スタブ: `allow(OpenAI::Client).to receive(:new).and_return(fake_client)`
  - 戻り値: `{ "choices" => [{ "message" => { "content" => "True" } }] }`
  - リクエスト: `post "/api/image", params: { image_url: "https://..." }`
  - 期待値: `have_http_status(:ok)`, `JSON["result"] == "True"`
- ポイント: APIキーは実際の外部呼び出しを行わないため不要（スタブしている）

3) Shodo API（/api/shodo, /api/shodo/:id）
- 目的: 校正ジョブの作成と取得に関する主要な分岐（done/processing/error）を確認
- 外部依存のスタブ化:
  - `ShodoService.lint!`（ジョブ作成）、`ShodoService.fetch`（結果取得）をスタブ
- テスト観点:
  - 即時完了: `done` ステータスで 200 OK と結果が返る
  - 処理中: 202 Accepted と `task_id` が返る
  - 入力不足: 400 BadRequest（全フィールド空）
  - 結果取得: GET で `done` を返すケース

実行方法
```bash
bundle exec rspec --format documentation
```
