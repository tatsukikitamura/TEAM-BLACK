# frozen_string_literal: true
class Api::AnalyzesController < ApplicationController
  def create
    # フロントから送信されたデータを受け取る。許可するキーを限定。
    p = params.permit(:markdown, :title, :lead, :contact,
                      options: [:hooksThreshold, :timeoutMs],
                      images: [:url, :role],
                      body: [:heading, :content])

    # データを文字列に成形して変数に格納。　
    # bodyは配列。各セクションをheadingとcontentに分けて、それぞれを空行で連結してbodytxtに格納。
    title = p[:title].to_s
    lead  = p[:lead].to_s
    bodytxt = (p[:body] || []).map { |sec| [sec[:heading], sec[:content]].compact.join("\n") }.join("\n\n")
    contact = p[:contact].to_s

    # フックの閾値とタイムアウト時間を変数に格納。
    hooks_threshold = p.dig(:options, :hooksThreshold) || 3
    timeout_ms      = p.dig(:options, :timeoutMs) || 20000

    # services/open_ai_judge.rb に引数を渡して、AI判定を行う。結果をaiに格納。
    # build_suggestions にaiを渡して、AI判定の結果を元に、改善提案を生成。結果をsuggestionsに格納。
    ai = OpenAiJudge.call(
      title: title, lead: lead, body: bodytxt, contact: contact,
      target_hooks: hooks_threshold, timeout_ms: timeout_ms
    )
    render json: { ai: ai, suggestions: build_suggestions(ai, limit: 5) }, status: :ok

  # 必須パラメータが欠落している場合は、BadRequestを返す。ステータスコードは400。
  rescue ActionController::ParameterMissing => e
    render json: { error: { code: "BadRequest", message: e.message } }, status: :bad_request
  # AI判定の結果が空の場合や、無効なJSONの場合、api呼び出し中になんらかのエラーが発生した場合は、BadGatewayを返す。ステータスコードは502。
  rescue OpenAiJudge::AiError => e
    render json: { error: { code: "AiError", message: e.message } }, status: :bad_gateway
  end

  private
  # AI判定の結果を元に、改善提案を生成。結果をsuggestionsに格納。
  def build_suggestions(ai, limit: 5)
    out = []

    # 5W2H+1W（優先：When, Where, Why, HowMuch, ToWhom, How, Who, What）の不足を抽出。
    miss = (%w[title lead body].flat_map { |k| ai.dig("fiveW2H", k, "missing") || [] }).uniq
    priorities = %w[When Where Why HowMuch ToWhom How Who What]
    miss.sort_by { |k| priorities.index(k) || 999 }.each do |m|
      case m
      when "When"    then out << "いつ（When）実施/開始かを明記"
      when "Where"   then out << "地名・会場・URLなど「Where」を明記"
      when "Why"     then out << "背景/目的（Why）を1文で明示"
      when "HowMuch" then out << "価格・数量・規模（HowMuch）を明確化"
      when "ToWhom"  then out << "誰に届けたいか（ToWhom）を明確化（対象の具体化）"
      when "How"     then out << "「どのように」（How）を具体化（方法・手段）"
      when "Who"     then out << "主語となる企業/団体名（Who）を明記"
      when "What"    then out << "何を（What）を具体名やカテゴリで明確化"
      end
    end

    # 9フック（優先：新規性/独自性 → 時流/季節性 → 地域性 → 社会性/公益性 → 最上級/希少性 → 話題性 → 画像/映像 → 意外性 → 逆説/対立）の不足を抽出。
    hooks_missing = ai.dig("hooks","missing") || []
    hook_priority = [
      "新規性/独自性","時流/季節性","地域性","社会性/公益性",
      "最上級/希少性","話題性","画像/映像","意外性","逆説/対立"
    ]
    hook_map = {
      "新規性/独自性" => "「初/唯一/独自」のポイントを明確化",
      "時流/季節性"   => "季節・トレンド・特定日付/期間に接続",
      "地域性"       => "県/市区名・ご当地性を明記",
      "社会性/公益性" => "社会課題/制度・政策との関連を1文で",
      "最上級/希少性" => "世界一/限定数/希少素材などの根拠を提示",
      "話題性"       => "話題の作品/トレンドとのコラボや便乗を明記",
      "画像/映像"     => "インパクトのある画像/動画（ビフォーアフター等）を用意",
      "意外性"       => "「まさか」の捻り・常識とのズラしを1文で提示",
      "逆説/対立"     => "定説の逆張り/対立構図（A vs B 等）を見出し化"
    }
    hooks_missing.sort_by { |k| hook_priority.index(k) || 999 }.each { |k| out << hook_map[k] if hook_map[k] }

    # 連絡先の不足を抽出。 連絡先がない場合は、連絡先を追加する提案を追加。
    out << "連絡先（会社/部署/担当/メール/電話/プレスキットURL）を本文末尾に追記" if ai.dig("contact","exists") == false

    # 不足を抽出した結果を返す。
    out.uniq.first(limit)
  end
end
