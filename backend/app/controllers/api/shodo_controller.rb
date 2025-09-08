# app/controllers/api/shodos_controller.rb
class Api::ShodosController < ApplicationController
    protect_from_forgery with: :null_session
  
    def create
      p = params.permit(:markdown, :title, :lead, :contact,
                        options: [:type, :maxWaitMs, :pollIntervalMs],
                        body: [:heading, :content])
  
      # 1) 入力正規化（分割優先、markdownは後方互換）
      title   = p[:title].to_s
      lead    = p[:lead].to_s
      bodytxt = (p[:body] || []).map { |sec| [sec[:heading], sec[:content]].compact.join("\n") }.join("\n\n")
      contact = p[:contact].to_s
  
      if title.blank? && lead.blank? && p[:markdown].present?
        sections = MarkdownParser.extract_sections(p[:markdown])
        title   = MarkdownParser.plain(sections["title"].to_s)
        lead    = MarkdownParser.plain(sections["lead"].to_s)
        bodytxt = MarkdownParser.plain(sections["body"].to_s)
        contact = MarkdownParser.plain(sections["contact"].to_s)
      end
  
      raise ActionController::ParameterMissing, "content is empty" if [title, lead, bodytxt, contact].all?(&:blank?)
  
      # 2) Shodoへ投入（ひとまず1テキストに連結）
      composite = build_composite(title:, lead:, bodytxt:, contact:)
      type          = (p.dig(:options, :type) || "text")
      max_wait_ms   = (p.dig(:options, :maxWaitMs) || 6000).to_i
      poll_interval = (p.dig(:options, :pollIntervalMs) || 500).to_i
  
      lint_id = ShodoService.lint!(composite, type: type)
  
      # 3) 短時間だけ同期ポーリング（UX改善）
      waited = 0
      result = nil
      while waited < max_wait_ms
        result = ShodoService.fetch(lint_id)
        break if result["status"] == "done" || result["status"] == "failed"
        sleep(poll_interval / 1000.0)
        waited += poll_interval
      end
  
      if result && result["status"] == "done"
        render json: { shodo: decorate_result(result, composite:) }, status: :ok
      elsif result && result["status"] == "failed"
        render json: { error: { code: "ShodoError", message: "Shodo failed" } }, status: :bad_gateway
      else
        render json: { shodo: { status: "processing", task_id: lint_id } }, status: :accepted
      end
    rescue ActionController::ParameterMissing => e
      render json: { error: { code: "BadRequest", message: e.message } }, status: :bad_request
    end
  
    def show
      lint_id = params[:id]
      result = ShodoService.fetch(lint_id)
      if result["status"] == "done"
        # show時は composite を知らないので section 特定は省略 or client側で保持した composite を送らせる設計も可
        render json: { shodo: decorate_result(result) }, status: :ok
      else
        render json: { shodo: { status: result["status"] } }, status: :ok
      end
    rescue => e
      render json: { error: { code: "ShodoError", message: e.message } }, status: :bad_gateway
    end
  
    private
  
    # セクション目印を差し込む（offset→section推定に使う）
    def build_composite(title:, lead:, bodytxt:, contact:)
      parts = []
      parts << "[TITLE]\n#{title}"     unless title.blank?
      parts << "[LEAD]\n#{lead}"       unless lead.blank?
      parts << "[BODY]\n#{bodytxt}"    unless bodytxt.blank?
      parts << "[CONTACT]\n#{contact}" unless contact.blank?
      parts.join("\n\n")
    end
  
    # Shodoの messages を整形し、ら抜き等のサマリを付与
    def decorate_result(result, composite: nil)
      msgs = Array(result["messages"]).map { |m| normalize_message(m) }
      if composite # section推定
        index_map = section_index_map(composite)
        msgs.each { |m| m["section"] = guess_section(m["offset"], index_map) if m["offset"] }
      end
  
      {
        status: result["status"],
        messages: msgs,
        summary: summarize(msgs)
      }
    end
  
    def normalize_message(m)
      {
        "type" => m["type"] || m["category"] || "",
        "before" => m["before"] || m["src"] || "",
        "after"  => m["after"]  || m["dst"] || "",
        "offset" => m["offset"] || m["pos"],
        "length" => m["length"] || m["len"],
        "message" => m["message"] || m["title"] || "",
        "explanation" => m["explanation"] || m["detail"] || ""
      }
    end
  
    def summarize(msgs)
      ranuki = msgs.select { |m|
        t = "#{m["type"]} #{m["message"]} #{m["explanation"]}"
        t.include?("ら抜き") || t.include?("ら抜き言葉")
      }
      by_section = msgs.group_by { |m| m["section"] || "unknown" }.transform_values!(&:size)
      {
        counts: {
          total: msgs.size,
          ranuki: ranuki.size,
          keigo: msgs.count { |m| m["type"].to_s.include?("敬語") }
        },
        bySection: {
          "title" => by_section["title"].to_i,
          "lead" => by_section["lead"].to_i,
          "body" => by_section["body"].to_i,
          "contact" => by_section["contact"].to_i
        },
        ranukiSamples: ranuki.first(5).map { |m| m.slice("section","before","after") }
      }
    end
  
    # [TITLE]等の見出しから文字位置を取得
    def section_index_map(composite)
      idx = {}
      idx["title"]   = composite.index("[TITLE]")   || -1
      idx["lead"]    = composite.index("[LEAD]")    || -1
      idx["body"]    = composite.index("[BODY]")    || -1
      idx["contact"] = composite.index("[CONTACT]") || -1
      idx
    end
  
    def guess_section(offset, idx)
      # 最も近いセクションを雑に推定（offset >= セクション開始の最大）
      cand = idx.select { |_k, v| v >= 0 && offset >= v }.max_by { |_k, v| v }
      cand ? cand.first : "body"
    end
  end
  