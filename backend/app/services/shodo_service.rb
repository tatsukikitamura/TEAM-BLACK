# Faraday gemのretry機能を読み込む - HTTPクライアントライブラリ: RubyでHTTPリクエストを送信するためのgem
# faraday/retry - 自動リトライ機能: HTTPリクエストが失敗した時に自動的に再試行する。設定可能: リトライ回数、間隔、対象となるHTTPステータスコードを設定可能。
require "faraday/retry"

class ShodoService
  # Shodo API関連のエラーを表すカスタム例外
  class ShodoError < StandardError; end

  # 環境変数からShodo APIの設定を取得
  # API_ROOT: Shodo APIのベースURL
  API_ROOT = ENV.fetch('SHODO_API_URL')
  # TOKEN: Shodo APIの認証トークン
  TOKEN    = ENV.fetch('SHODO_TOKEN')

  # 起動時にAPI_ROOTをログ出力（デプロイ先でのURL誤設定に一発で気づける）
  Rails.logger.info "Shodo API_ROOT=#{API_ROOT}"

  # 校正リクエストをShodo APIに送信する
  #
  # @param text [String] 校正したいテキスト
  # @param type [String] テキストの種類 ("text" がデフォルト)
  # @return [String] 校正タスクのID (lint_id)
  # @raise [ShodoError] API呼び出しが失敗した場合
  #
  # 処理の流れ:
  # 1. リクエスト情報をログ出力
  # 2. POST /lint/ エンドポイントにリクエスト送信
  # 3. レスポンスの成功/失敗をチェック
  # 4. 失敗時は適切なエラーメッセージでShodoErrorを発生
  # 5. 成功時はlint_idを抽出して返す
  #
  def self.lint!(text, type: "text")
    # POSTリクエストを/lint/エンドポイントに送信
    # 認証ヘッダー: Authorization: Bearer {TOKEN}
    # Acceptヘッダー: application/json
    # リクエストボディ: { body: "テキスト", type: "text" }
    res  = conn.post("lint/") do |r|
      r.headers["Authorization"] = "Bearer #{TOKEN}"
      r.headers["Accept"]        = "application/json"
      r.body = { body: text.to_s, type: type }
    end

    # HTTPレスポンスのボディをJSONとして解析。parse_bodyは下で定義している。
    body = parse_body(res)

    # レスポンスが成功していない場合HTTPステータスコードに応じて適切なエラーメッセージを生成
    unless res.success?
      error_msg = case res.status
          # 401: 認証エラー
          when 401 then "Shodo API認証エラー (TOKEN不正)"
            # 404: URL誤り
          when 404 then "Shodo API URL誤り"
            # 422: リクエスト形式エラー
          when 422 then "Shodo API リクエスト形式エラー"
            # それ以外: リクエスト失敗
          else "Shodo lint failed (#{res.status})"
          end
      raise ShodoError, error_msg
    end

    # レスポンスから校正タスクのIDを抽出
    lint_id = body["lint_id"] || body["id"] || body["task_id"]
    # IDが見つからない場合はエラーを発生
    unless lint_id
      raise ShodoError, "Shodo response has no lint id"
    end
    # IDを返す
    lint_id
  end

  # 校正結果をShodo APIから取得する
  #
  # @param lint_id [String] 校正タスクのID
  # @return [Hash] 校正結果のハッシュ
  # @raise [ShodoError] API呼び出しが失敗した場合
  #
  # 処理の流れ:
  # 1. GET /lint/{lint_id}/ エンドポイントにリクエスト送信
  # 2. レスポンスの成功/失敗をチェック
  # 3. 失敗時は適切なエラーメッセージでShodoErrorを発生
  # 4. 成功時は校正結果のハッシュを返す
  #
  def self.fetch(lint_id)
    # GETリクエストを/lint/{lint_id}/エンドポイントに送信
    #認証ヘッダー: Authorization: Bearer {TOKEN}
    # Acceptヘッダー: application/json
    # リクエストボディ: なし（GETリクエストなので）
    res  = conn.get("lint/#{lint_id}/") do |r|
      r.headers["Authorization"] = "Bearer #{TOKEN}"
      r.headers["Accept"]        = "application/json"
    end

    # HTTPレスポンスのボディをJSONとして解析。parse_bodyは下で定義している。
    body = parse_body(res)

    # レスポンスが成功していない場合HTTPステータスコードに応じて適切なエラーメッセージを生成
    unless res.success?
      error_msg = case res.status
                  # 401: 認証エラー
                  when 401 then "Shodo API認証エラー (TOKEN不正)"
                  # 404: URL誤り
                  when 404 then "Shodo API URL誤り"
                  # 422: リクエスト形式エラー
                  when 422 then "Shodo API リクエスト形式エラー"
                  # それ以外: リクエスト失敗
                  else "Shodo fetch failed (#{res.status})"
                  end
      raise ShodoError, error_msg
    end
    # 校正結果のハッシュをそのまま返す
    body
  end

  # ---- helpers ----
  
  # Faraday接続オブジェクトを生成・設定する
  #
  # 設定内容:
  # - タイムアウト設定 (SHODO_TIMEOUT_SEC, SHODO_OPEN_TIMEOUT_SEC)
  # - JSONリクエスト/レスポンスの自動処理
  # - リトライ機能 (最大2回、0.2秒間隔)
  # - リトライ対象: GET/POSTメソッド、429/5xxステータス
  #
  # @return [Faraday::Connection] 設定済みのFaraday接続オブジェクト
  #
  # HTTPクライアントの設定を管理し、最適化された接続オブジェクトを提供するメソッド
  def self.conn
    @conn ||= Faraday.new(url: API_ROOT) do |f|
      # タイムアウト設定(環境変数で設定も可能)
      # SHODO_TIMEOUT_SEC: リクエスト全体のタイムアウト時間
      f.options.timeout      = (ENV["SHODO_TIMEOUT_SEC"] || 10).to_i
      # SHODO_OPEN_TIMEOUT_SEC: 接続のタイムアウト時間(リクエストを送信するまでの待ち時間)
      f.options.open_timeout = (ENV["SHODO_OPEN_TIMEOUT_SEC"] || 5).to_i
      # リクエストボディを自動的にJSONに変換
      f.request  :json
      # レスポンスボディを自動的にJSONに変換
      f.response :json, content_type: /\bjson$/
      # リトライ機能(最大2回、0.2秒間隔)
      f.request  :retry, max: 2, interval: 0.2,
                         methods: %i[get post],
                         # これらのHTTPステータスコードの場合のみリトライする
                         retry_statuses: [429, 500, 502, 503, 504]
      # HTTPリクエストを実際に送信するためのライブラリを指定する設定。
      f.adapter Faraday.default_adapter
    end
  end

  # HTTPレスポンスのボディを安全にパースする
  #
  # @param res [Faraday::Response] HTTPレスポンスオブジェクト
  # @return [Hash] パースされたJSONハッシュ、またはフォールバック用ハッシュ
  #
  # 処理内容:
  # - ボディが文字列の場合: JSON.parseを試行、失敗時は{"raw" => body}を返す
  # - ボディがハッシュの場合: そのまま返す
  # - ボディがnilの場合: 空のハッシュ{}を返す
  #
  # HTTPレスポンスのボディを安全にJSONとして解析し、エラー時はフォールバック処理を行うメソッド。
  def self.parse_body(res)
    # ボディが文字列の場合: JSON.parseを試行、失敗時は{"raw" => body}を返す
    # ボディがハッシュの場合: そのまま返す
    # ボディがnilの場合: 空のハッシュ{}を返す
    res.body.is_a?(String) ? (JSON.parse(res.body) rescue { "raw" => res.body }) : (res.body || {})
  end
end
  