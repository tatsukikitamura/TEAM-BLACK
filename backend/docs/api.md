# API Documentation

## 概要

この API は、プレスリリースの分析と校正を行うサービスです。以下の 2 つの主要機能を提供します：

1. **プレスリリース分析** (`/api/analyze`) - OpenAI を使用した 5W2H+1W 分析と 9 つのフック検出
2. **プレスリリース校正** (`/api/shodo`) - Shodo API を使用した日本語校正

## ベース URL

```
http://localhost:3000/api
```

## エンドポイント

### 1. プレスリリース分析

#### POST `/api/analyze`

プレスリリースの内容を分析し、5W2H+1W の不足要素と 9 つのフックを検出します。

**リクエスト**

```http
POST /api/analyze
Content-Type: application/json
```

**リクエストボディ**

`````json
{
  "title": "チーム開発×データ分析に挑む3Daysハッカソン受付開始",
  "lead": "プレスリリース配信サービス「PR TIMES」等を運営する株式会社PR TIMES（東京都港区、代表取締役：山口拓己、東証プライSプライム：3922）は、2026・27年卒業予定のエンジニア志望学生を対象に、「PR TIMES HACKATHON 2025 Summer」を開催します。",
  "content": "## 同世代エンジニアとつながり、チーム開発の経験を積める3日間\n\nPR TIMESハッカソンは、2016年より開催している内定直結型のハッカソンイベントです。2025年9月8日〜10日の3日間でWebサービスの開発を行い、特に優秀な方には年収500万円以上の中途採用基準での内定をお出しします。",
  "contact": "【お問い合わせ】株式会社PR TIMES 広報部 / https://prtimes.co.jp/",
  "options": {
    "hooksThreshold": 3,
    "timeoutMs": 20000
  },
  "searchHook": "地域性"
}```

**パラメータ**

| フィールド                | 型      | 必須 | 説明                                          |
| ------------------------ | ------- | ---- | --------------------------------------------- |
| `title`                  | string  | 必須 | プレスリリースのタイトル                      |
| `lead`                   | string  | 必須 | リード文（概要）                              |
| `content`                | string  | 必須 | 本文内容（マークダウン形式）                  |
| `contact`                | string  | 必須 | 連絡先情報                                    |
| `searchHook`             | string  | 任意 | 特定のフック名を指定（例: "地域性"）。指定した場合、そのフックの改善提案を生成する |
| `options.hooksThreshold` | integer | 任意 | フック検出の閾値（デフォルト: 3）             |
| `options.timeoutMs`      | integer | 任意 | タイムアウト時間（ミリ秒、デフォルト: 20000） |

**レスポンス**

**成功時 (200 OK)**

AI分析結果と改善提案を返します。

| フィールド | 型 | 説明 |
|-----------|----|----|
| `ai` | object | AI分析結果 |
| `ai.fiveW2H` | object | 5W2H+1W分析結果 |
| `ai.fiveW2H.title` | object | タイトルの5W2H+1W分析 |
| `ai.fiveW2H.title.missing` | array | 不足している要素のリスト |
| `ai.fiveW2H.title.suggestion` | string | タイトル改善の提案文 |
| `ai.fiveW2H.lead` | object | リード文の5W2H+1W分析 |
| `ai.fiveW2H.body` | object | 本文の5W2H+1W分析 |
| `ai.hooks` | object | 9つのフック分析結果 |
| `ai.hooks.scores` | array | 各フックのスコア（0.0-1.0） |
| `ai.hooks.scores[].name` | string | フック名 |
| `ai.hooks.scores[].score` | number | スコア（0.0-1.0） |
| `ai.hooks.suggestion` | array | フック改善の提案文配列 |

#### フック改善提案（`hooks.suggestion`）の条件分岐

`hooks.suggestion`の内容は、リクエストに含まれる`searchHook`パラメータの有無によって変わります。

1. **`searchHook`が指定された場合:**
   - AIは指定されたフック（例: "地域性"）を強化するために、本文の内容に基づいた**具体的な改善案（リライト案など）**を生成します。

2. **`searchHook`が指定されていない場合:**
   - AIは検出されたスコア全体を評価し、スコアが高いフックや改善すべきフックについて**汎用的なアドバイス**を生成します。

```json
{
  "ai": {
    "fiveW2H": {
      "title": {
        "missing": ["Where", "When", "HowMuch"],
        "suggestion": "タイトルに「いつ(When)」の情報と、具体的な「場所(Where)」や「規模・価格(HowMuch)」の要素を追加することで、読者の関心をより強く引くことができます。"
      },
      "lead": {
        "missing": ["Why"],
        "suggestion": "リード文に「なぜ(Why)」この取り組みを行うのか、背景や目的を簡潔に加えると、記事の説得力が高まります。"
      },
      "body": {
        "missing": [],
        "suggestion": "本文の構成要素は十分に満たされています。各セクションの内容が具体的で分かりやすいです。"
      }
    },
    "hooks": {
      "scores": [
        { "name": "新規性/独自性", "score": 0.9 },
        { "name": "地域性", "score": 0.8 },
        { "name": "社会性/公益性", "score": 0.7 },
        { "name": "最上級/希少性", "score": 0.5 },
        { "name": "話題性", "score": 0.4 },
        { "name": "画像/映像", "score": 0.3 },
        { "name": "時流/季節性", "score": 0.2 },
        { "name": "意外性", "score": 0.1 },
        { "name": "逆説/対立", "score": 0.0 }
      ],
      "suggestion": [
        "フックとして「新規性/独自性」(スコア0.9)と「地域性」(スコア0.8)が特に強く検出されました。",
        "これらの強みを活かし、見出しや本文でさらに具体的にアピールすることで、メディア露出の可能性を高められます。"
      ]
    }
  }
}````

**エラー時**

- **400 Bad Request**: 必須パラメータが不足
- **502 Bad Gateway**: AI 分析エラー

```json
{
  "error": {
    "code": "BadRequest",
    "message": "パラメータが不足しています"
  }
}
```

```json
{
  "error": {
    "code": "AiError",
    "message": "AI分析でエラーが発生しました"
  }
}
```

### 2. プレスリリース校正

#### POST `/api/shodo`

プレスリリースの日本語校正を実行します。非同期処理で校正ジョブを作成し、結果を取得します。

**リクエスト**

```http
POST /api/shodo
Content-Type: application/json
```

**リクエストボディ**

```json
{
  "title": "チーム開発×データ分析に挑む3Daysハッカソン受付開始",
  "lead": "プレスリリース配信サービス「PR TIMES」等を運営する株式会社PR TIMES（東京都港区、代表取締役：山口拓己、東証プライSプライム：3922）は、2026・27年卒業予定のエンジニア志望学生を対象に、「PR TIMES HACKATHON 2025 Summer」を開催します。",
  "content": "## 同世代エンジニアとつながり、チーム開発の経験を積める3日間\n\nPR TIMESハッカソンは、2016年より開催している内定直結型のハッカソンイベントです。2025年9月8日〜10日の3日間でWebサービスの開発を行い、特に優秀な方には年収500万円以上の中途採用基準での内定をお出しします。",
  "contact": "【お問い合わせ】株式会社PR TIMES 広報部 / https://prtimes.co.jp/",
  "options": {
    "type": "text",
    "maxWaitMs": 6000,
    "pollIntervalMs": 500
  }
}
```

**パラメータ**

| フィールド               | 型      | 必須 | 説明                                      |
| ------------------------ | ------- | ---- | ----------------------------------------- |
| `title`                  | string  | 必須 | プレスリリースのタイトル                  |
| `lead`                   | string  | 必須 | リード文（概要）                          |
| `content`                | string  | 必須 | 本文内容（マークダウン形式）              |
| `contact`                | string  | 必須 | 連絡先情報                                |
| `options.type`           | string  | 任意 | 校正タイプ（デフォルト: "text"）          |
| `options.maxWaitMs`      | integer | 任意 | 最大待機時間（ミリ秒、デフォルト: 6000）  |
| `options.pollIntervalMs` | integer | 任意 | ポーリング間隔（ミリ秒、デフォルト: 500） |

**レスポンス**

**校正完了時 (200 OK)**

```json
{
  "shodo": {
    "status": "done",
    "messages": [
      {
        "type": "ら抜き言葉",
        "section": "lead",
        "offset": 45,
        "length": 3,
        "before": "食べれる",
        "after": "食べられる",
        "explanation": "ら抜き言葉です。正しくは「食べられる」です。"
      },
      {
        "type": "敬語",
        "section": "body",
        "offset": 102,
        "length": 4,
        "before": "言った",
        "after": "申した",
        "explanation": "より丁寧な敬語表現があります。"
      }
    ]
  }
}
```

**校正処理中 (202 Accepted)**

```json
{
  "shodo": {
    "status": "processing",
    "task_id": "abc123",
    "retryAfterMs": 500
  }
}
```

**エラー時**

- **400 Bad Request**: 必須パラメータが不足
- **502 Bad Gateway**: Shodo API エラー

```json
{
  "error": {
    "code": "BadRequest",
    "message": "パラメータが不足しています"
  }
}
```

```json
{
  "error": {
    "code": "ShodoError",
    "message": "Shodo API認証エラー (TOKEN不正)"
  }
}
```

#### GET `/api/shodo/:id`

校正ジョブの結果を取得します。

**リクエスト**

```http
GET /api/shodo/abc123
```

**レスポンス**

**校正完了時 (200 OK)**

```json
{
  "shodo": {
    "status": "done",
    "messages": [
      {
        "type": "ら抜き言葉",
        "section": "lead",
        "offset": 45,
        "length": 3,
        "before": "食べれる",
        "after": "食べられる",
        "explanation": "ら抜き言葉です。正しくは「食べられる」です。"
      },
      {
        "type": "敬語",
        "section": "body",
        "offset": 102,
        "length": 4,
        "before": "言った",
        "after": "申した",
        "explanation": "より丁寧な敬語表現があります。"
      }
    ]
  }
}
```

**校正処理中 (200 OK)**

```json
{
  "shodo": {
    "status": "processing"
  }
}
```

## 5W2H+1W 分析について

### 分析要素

| 要素        | 説明                                          | 例                                          |
| ----------- | --------------------------------------------- | ------------------------------------------- |
| **Who**     | 主語となる企業・団体名                        | 「株式会社 PR TIMES」                       |
| **What**    | サービス/事業/プロジェクト/イベント/製品/組織 | 「ハッカソンイベント」                      |
| **Where**   | 会場/販売エリア/URL/対象範囲                  | 「PR TIMES 本社（赤坂インターシティ 8F）」  |
| **When**    | 具体日付・曜日・時刻・期間                    | 「2025 年 9 月 8 日〜10 日」                |
| **Why**     | 背景・目的                                    | 「エンジニア志望学生の育成」                |
| **How**     | 概要・特徴・方法・リアル/オンライン等         | 「3 日間で Web サービス開発」               |
| **HowMuch** | 金額・数量・規模                              | 「年収 500 万円以上」「30 名」              |
| **ToWhom**  | 情報を届けたい対象                            | 「2026・27 年卒業予定のエンジニア志望学生」 |

### スコアリング

- **1.0**: 完全に満たされている
- **0.5**: 部分的に満たされている
- **0.0**: 満たされていない

## 9 つのフックについて

### フック要素

1. **時流/季節性**: 季節/時流/トレンドや特定日付と結びつく情報
2. **意外性**: 「まさか」を実現、常識とズラす要素
3. **逆説/対立**: 定説と真逆、または対立構図の提示
4. **地域性**: 具体的な県名・市区名・ご当地性
5. **話題性**: 既に話題の事柄/作品/トレンドへの便乗・コラボ
6. **社会性/公益性**: 公益性・社会課題・制度/政策との接続
7. **新規性/独自性**: 初/唯一/独自の取り組み
8. **最上級/希少性**: 世界一/◯◯ 限定/希少素材等
9. **画像/映像**: インパクトのあるビジュアルの存在・計画

## 校正機能について

### 校正メッセージの構造

| フィールド    | 型      | 説明                                               |
| ------------- | ------- | -------------------------------------------------- |
| `type`        | string  | 校正の種類（例: "ら抜き言葉", "敬語"）             |
| `section`     | string  | セクション名（"title", "lead", "body", "contact"） |
| `offset`      | integer | テキスト内での位置（文字数）                       |
| `length`      | integer | 対象テキストの長さ                                 |
| `before`      | string  | 修正前のテキスト                                   |
| `after`       | string  | 修正後のテキスト                                   |
| `explanation` | string  | 詳細な説明                                         |

### 校正結果の構造

校正結果は以下の構造で返されます：

- **status**: 校正処理の状態（"done" または "processing"）
- **messages**: 校正メッセージの配列
  - 各メッセージには `type`、`section`、`offset`、`length`、`before`、`after`、`explanation` が含まれます

## エラーコード

| コード         | HTTP ステータス | 説明                       |
| -------------- | --------------- | -------------------------- |
| `BadRequest`   | 400             | リクエストパラメータが不正 |
| `DatabaseError`| 500             | データベース処理でエラーが発生 |
| `AiError`      | 502             | AI 分析でエラーが発生      |
| `ShodoError`   | 502             | Shodo API でエラーが発生   |

## 使用例

### プレスリリース分析の例

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "title": "チーム開発×データ分析に挑む3Daysハッカソン受付開始",
    "lead": "プレスリリース配信サービス「PR TIMES」等を運営する株式会社PR TIMES（東京都港区、代表取締役：山口拓己、東証プライム：3922）は、2026・27年卒業予定のエンジニア志望学生を対象に、「PR TIMES HACKATHON 2025 Summer」を開催します。",
    "content": "## 同世代エンジニアとつながり、チーム開発の経験を積める3日間\n\nPR TIMESハッカソンは、2016年より開催している内定直結型のハッカソンイベントです。2025年9月8日〜10日の3日間でWebサービスの開発を行い、特に優秀な方には年収500万円以上の中途採用基準での内定をお出しします。",
    "contact": "【お問い合わせ】株式会社PR TIMES 広報部 / https://prtimes.co.jp/",
    "options": {
      "hooksThreshold": 3
    }
  }'
```

### プレスリリース校正の例

```bash
curl -X POST http://localhost:3000/api/shodo \
  -H "Content-Type: application/json" \
  -d '{
    "title": "新商品発表会のご案内",
    "lead": "来月開催される新商品発表会についてご案内いたします。",
    "content": "## 開催概要\n\n詳細な内容がここに記載されます。食べれるはら抜き言葉のテストです。",
    "contact": "お問い合わせはこちらまで",
    "options": {
      "type": "text",
      "maxWaitMs": 10000,
      "pollIntervalMs": 1000
    }
  }'
```

## 環境変数

以下の環境変数が必要です：

- `OPENAI_API_KEY`: OpenAI の api キー
- `OPENAI_MODEL`: OpenAI モデル名（デフォルト: "gpt-4o-mini"）
- `SHODO_API_URL`: Shodo API のベース URL
- `SHODO_TOKEN`: Shodo API の認証トークン
- `SHODO_TIMEOUT_SEC`: Shodo API のタイムアウト時間（秒、デフォルト: 10）
- `SHODO_OPEN_TIMEOUT_SEC`: Shodo API の接続タイムアウト時間（秒、デフォルト: 5）
`````
