# app/controllers/api/analyzes_controller.rb
class Api::AnalyzesController < ApplicationController

  def create
    md = params.require(:markdown)
    options = params.fetch(:options, {}) # params[:options] || {} と同じ意味
    hooks_threshold = options.fetch(:hooksThreshold, 3) # options[:hooksThreshold] || 3 と同じ意味

    # --- ここから先のモジュールは別途作成する必要があります ---
    # 1) セクション抜き出し（仮のモジュール名）
    # sections = MarkdownParser.extract_sections(md)
    # title = MarkdownParser.plain(sections["title"].to_s)
    # lead  = MarkdownParser.plain(sections["lead"].to_s)
    # body  = MarkdownParser.plain(sections["body"].to_s)

    # 2) OpenAI 呼び出し（仮のサービスクラス名）
    # ai = OpenAiJudge.call(title:, lead:, body:, hooks_threshold:)
    # --- ここまでは仮置き ---

    # --- 動作確認用のダミーデータを一時的に設定 ---
    # TODO: 実際のAIロジックが完成したら削除する
    ai = {
      "fiveW2H" => {
        "title" => { "who" => 1, "what" => 1, "when" => 1, "where" => 0, "why" => 0, "how" => 0.5, "howMuch" => 1, "missing" => ["Where", "Why"], "evidence" => ["10/1開始", "月額¥2,980"] },
        "lead" => { "who" => 1, "what" => 1, "when" => 1, "where" => 1, "why" => 1, "how" => 1, "howMuch" => 1, "missing" => [], "evidence" => ["東京都内で先行"] }
      },
      "hooks" => {
        "detected" => [ { "name" => "新規性", "score" => 0.9, "evidence" => ["初の…"] }, { "name" => "数値", "score" => 0.8, "evidence" => ["導入120社・35%改善"] } ],
        "missing" => ["第三者の裏付け", "社会性", "希少性"],
        "target" => hooks_threshold
      },
      "contact" => { "exists" => false, "confidence" => 0.92, "evidence" => [] }
    }
    # --- ダミーデータここまで ---

    render json: { ai: ai, suggestions: build_suggestions(ai) }, status: :ok
  rescue ActionController::ParameterMissing => e
    render json: { error: { code: "BadRequest", message: e.message } }, status: :bad_request
  end

  private

  def build_suggestions(ai)
    s = []
    miss = []
    # 5W2H 不足の集約
    # digはネストしたハッシュ/配列の値を安全に取り出すメソッド (例: ai["fiveW2H"]["title"]["missing"])
    miss |= (ai.dig("fiveW2H", "title", "missing") || [])
    miss |= (ai.dig("fiveW2H", "lead", "missing") || [])

    miss.include?("Where") && s << "タイトルに地名（Where）を追加"
    miss.include?("Why")   && s << "読者ベネフィット/背景理由（Why）を1文で明示"
    miss.include?("How")   && s << "“どのように”（How）を具体化（仕組み・手順）"

    # フック不足
    (ai.dig("hooks", "missing") || []).include?("第三者の裏付け") &&
      s << "第三者コメント（提携・受賞・顧客事例）を1文追記"
    (ai.dig("hooks", "missing") || []).include?("社会性") &&
      s << "社会課題/制度・トレンドとの接続を1文"

    # 連絡先
    ai.dig("contact", "exists") == false &&
      s << "連絡先（会社/部署/担当/メール/電話/プレスキットURL）を本文末尾に追記"

    s.uniq
  end
end