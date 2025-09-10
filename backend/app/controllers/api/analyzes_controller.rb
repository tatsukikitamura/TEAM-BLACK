# frozen_string_literal: true
class Api::AnalyzesController < ApplicationController
  # DB関連のエラーをまとめて捕捉する。handle_db_errorは下で定義している。
  rescue_from ActiveRecord::StatementInvalid, with: :handle_db_error

  def create
    # フロントから送信されたデータを受け取る。許可するキーを限定。
    p = params.permit(:title, :lead, :content, :contact, :searchHook,
                      options: [:hooksThreshold, :timeoutMs])

    # データをそれぞれ文字列に成形して変数に格納
    title = p[:title].to_s
    lead  = p[:lead].to_s
    content = p[:content].to_s
    contact = p[:contact].to_s
    search_hook = p[:searchHook].to_s

    # フックの閾値とタイムアウト時間を変数に格納
    hooks_threshold = p.dig(:options, :hooksThreshold) || 3
    timeout_ms      = p.dig(:options, :timeoutMs) || 20000

    # DBから類似・成功事例を検索する
    # pg_trgmを使って類似タイトルを検索し、いいね数順に上位3件を取得
    similar_releases = Release.find_by_sql([<<-SQL, { current_title: title, limit: 3 }])
      SELECT
      r.title,
      rs.like_count,
      -- similarity()はpg_trgmの関数で、2つの文字列がどれだけ似ているかを0から1の数値で返します。
      similarity(r.title, :current_title) AS sim
      FROM
        release r
      INNER JOIN
        release_statistics rs ON r.company_id = rs.company_id AND r.release_id = rs.release_id
      WHERE
        r.title % :current_title -- pg_trgmの機能の% 演算子で二つが類似しているかを判定します。
      ORDER BY
        sim DESC, rs.like_count DESC -- 類似度を最優先、同じ類似度ならいいね数が多いもの順に並べる。
      LIMIT :limit
    SQL

    # similar_releaseの中でもtitleだけを配列に変換する
    success_examples = similar_releases.pluck(:title)

    # services/open_ai_judge.rb に引数を渡して、AI判定を行う。結果をaiに格納
    ai = OpenAiJudge.call(
      title: title, lead: lead, body: content, contact: contact,
      target_hooks: hooks_threshold, timeout_ms: timeout_ms,
      search_hook: search_hook, success_examples: success_examples
    )
    render json: { ai: ai }, status: :ok

  # 必須パラメータが欠落している場合は、BadRequestを返す。ステータスコードは400。
  rescue ActionController::ParameterMissing => e
    render json: { error: { code: "BadRequest", message: "パラメータが不足しています" } }, status: :bad_request
  # AI判定の結果が空の場合や、無効なJSONの場合、api呼び出し中になんらかのエラーが発生した場合は、BadGatewayを返す。ステータスコードは502。
  rescue OpenAiJudge::AiError => e
    render json: { error: { code: "AiError", message: e.message } }, status: :bad_gateway
  end

  private

  def handle_db_error(exception)
    # エラーログには詳細を記録しておく
    Rails.logger.error("Database error: #{exception.message}")
    # フロントには汎用的なメッセージを返す
    render json: { error: { code: "DatabaseError", message: "データベース処理中にエラーが発生しました" } }, status: :internal_server_error
  end
end
