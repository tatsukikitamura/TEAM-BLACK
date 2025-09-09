class Api::ShodoController < ApplicationController
  def create
    # フロントから送信されたデータを受け取る。許可するキーを限定。
    p = params.permit(:title, :lead, :content, :contact,
                      options: [:type, :maxWaitMs, :pollIntervalMs])

    # データを文字列に成形して変数に格納
    title = p[:title].to_s
    lead  = p[:lead].to_s
    bodytxt = p[:content].to_s
    contact = p[:contact].to_s

    # すべてのフィールドが空の場合にエラーを発生させます。
    raise ActionController::ParameterMissing, "パラメータが不足しています" if [title, lead, bodytxt, contact].all?(&:blank?)
  
      # Shodo API用のデータ準備とAPI呼び出しです。プレスリリースの校正・チェック機能を実行します。
      # build_compositeメソッドでShodo API用のデータ形式に変換。4つのフィールドを統合し1つのテキストに結合してcompositeに格納。build_compositeは下で定義している。
      composite = build_composite(title:, lead:, bodytxt:, contact:)
      # デフォルトは"text"。Shodo APIの処理タイプを指定。
      type          = (p.dig(:options, :type) || "text")
      # デフォルトは6000。Shodo APIの最大待ち時間を指定。
      max_wait_ms   = (p.dig(:options, :maxWaitMs) || 6000).to_i
      # デフォルトは500。Shodo APIのポーリング間隔を指定。サーバーに結果を確認しに行く頻度のこと。
      poll_interval = (p.dig(:options, :pollIntervalMs) || 500).to_i
      
      # Shodo APIに校正リクエストを送信し、校正ジョブのIDを取得する処理。ShodoService.lint!はservices/shodo_service.rbで定義している。 
      lint_id = ShodoService.lint!(composite, type: type)
  
      # ポーリングループ。Shodo APIの校正結果を定期的に確認する処理です。
      # 変数の初期化
      waited = 0
      result = nil
      # 最大6秒間ポーリングを継続。max_wait_msは6000。
      while waited < max_wait_ms
        # ShodoService.fetchメソッドで校正結果を取得する。ShodoService.fetchはservices/shodo_service.rbで定義している。
        result = ShodoService.fetch(lint_id)
        # result["status"]が"done"か"failed"の場合は、ポーリングを終了。
        break if result["status"] == "done" || result["status"] == "failed"
        # 指定時間だけ待つ。poll_intervalはデフォルトの場合500。
        sleep(poll_interval / 1000.0)
        # 累積時間を更新。
        waited += poll_interval
      end
  
      # 校正結果に基づくレスポンス生成。
      # 校正が正常に完了した場合。decorate_resultは下で定義している。ステータスコードは200。
      if result && result["status"] == "done"
        render json: { shodo: decorate_result(result, composite:) }, status: :ok
      # 校正が失敗した場合。ステータスコードは502。
      elsif result && result["status"] == "failed"
        render json: { error: { code: "ShodoError", message: "Shodo failed" } }, status: :bad_gateway
      # 校正が進行中またはタイムアウトの場合。ステータスコードは202。
      # retryAfterMsはポーリング間隔を秒単位で返す。
      else
        render json: { shodo: { status: "processing", task_id: lint_id, retryAfterMs: poll_interval } }, status: :accepted
      end
    # 必須パラメータが欠落している場合は、BadRequestを返す。ステータスコードは400。
    rescue ActionController::ParameterMissing => e
      render json: { error: { code: "BadRequest", message: "パラメータが不足しています" } }, status: :bad_request
    # Shodo API関連のエラーの場合は、BadGatewayを返す。ステータスコードは502。
    rescue ShodoService::ShodoError => e
      render json: { error: { code: "ShodoError", message: e.message } }, status: :bad_gateway
    end
  
    # 校正結果の取得APIです。校正ジョブのIDを使って結果を取得し、状態に応じてレスポンスを返します。
    def show
      # 校正ジョブのIDを取得。
      lint_id = params[:id]
      # ShodoService.fetchメソッドで校正結果を取得。services/shodo_service.rbで定義している。
      result = ShodoService.fetch(lint_id)
      # result["status"]が"done"の場合は、校正結果を返す。
      if result["status"] == "done"
        # show時は composite を知らないので section 特定は省略 or client側で保持した composite を送らせる設計も可
        render json: { shodo: decorate_result(result) }, status: :ok
      # 完了時以外の時。
      else
        render json: { shodo: { status: result["status"] } }, status: :ok
      end
    # Shodo API関連のエラーの場合は、BadGatewayを返す。ステータスコードは502。
    rescue ShodoService::ShodoError => e
      render json: { error: { code: "ShodoError", message: e.message } }, status: :bad_gateway
    end
  
    private
  
    # プレスリリースの４つの部分を統合して1つのテキストに結合するメソッドです。Shodo APIに送信するための形式に変換します。
    def build_composite(title:, lead:, bodytxt:, contact:)
      # 空の配列を作成。
      parts = []
      # titleが空でない場合のみ配列に追加。
      parts << "[TITLE]\n#{title}"     unless title.blank?
      # leadが空でない場合のみ配列に追加。
      parts << "[LEAD]\n#{lead}"       unless lead.blank?
      # bodytxtが空でない場合のみ配列に追加。
      parts << "[BODY]\n#{bodytxt}"    unless bodytxt.blank?
      # contactが空でない場合のみ配列に追加。
      parts << "[CONTACT]\n#{contact}" unless contact.blank?
      # 配列の各要素を\n\nで結合。
      parts.join("\n\n")
    end
  
    # Shodo APIからの校正結果を装飾・整形するメソッドです。フロントエンドが使いやすい形式に変換します。
    # resultはShodo APIからの校正結果。compositeはプレスリリースの４つの部分を統合したテキスト。
    def decorate_result(result, composite: nil)
      # result["messages"]を配列に変換し、各メッセージをnormalize_messageで正規化。
      msgs = Array(result["messages"]).map { |m| normalize_message(m) }
      
      # compositeが存在する場合のみ実行。
      # 校正メッセージの位置から、どのセクション（タイトル、リード、本文、連絡先）に属するかを推定する処理です。
      if composite
        # 元テキストを解析して各セクションの位置を特定。セクション名とその開始・終了位置のマップを作成。section_index_mapは下で定義している。
        index_map = section_index_map(composite)
        # 実際の例
        #index_map = {
        # "TITLE" => { start: 0, end: 25 },      # [TITLE]から次の空行まで
        # "LEAD" => { start: 27, end: 80 },       # [LEAD]から次の空行まで
        #"BODY" => { start: 82, end: 120 },      # [BODY]から次の空行まで
        #"CONTACT" => { start: 122, end: 150 }  # [CONTACT]から最後まで }
        
        # 校正メッセージの位置から、どのセクション（タイトル、リード、本文、連絡先）に属するかを推定する処理です。guess_sectionは下で定義している。
        msgs.each { |m| m["section"] = guess_section(m["offset"], index_map) if m["offset"] }
      end
  
      # 校正結果を返す。
      {
        status: result["status"],
        messages: msgs
      }
    end
  
    # Shodo APIからの校正メッセージを標準化するメソッドです。異なるフィールド名を統一し、一貫した形式に変換します。
    def normalize_message(m)
      length_value = if m["index"] && m["index_to"]
                      m["index_to"] - m["index"]
                    else
                      nil
                    end
      
      {
        "type" => m["code"] || "",
        "section" => "", # 後でセクション推定で設定
        "offset" => m["index"],
        "length" => length_value,
        "before" => m["before"] || "",
        "after"  => m["after"]  || "",
        "explanation" => m["message"] || ""
      }
    end
  
    # [TITLE]等の文字列から文字位置を取得。
    # 例
    # index_map = {
    #   "title" => 0,
    #   "lead" => 26,
    #   "body" => 81,
    #   "contact" => 121
    # }
    def section_index_map(composite)
      idx = {}
      idx["title"]   = composite.index("[TITLE]")   || -1
      idx["lead"]    = composite.index("[LEAD]")    || -1
      idx["body"]    = composite.index("[BODY]")    || -1
      idx["contact"] = composite.index("[CONTACT]") || -1
      idx
    end
  
    
    # 校正メッセージのオフセット位置から、どのセクション（タイトル、リード、本文、連絡先）に属するかを推定するメソッド
    #
    # アルゴリズム:
    # 1. オフセット位置がセクション開始位置以降にあるセクションを抽出
    # 2. その中で開始位置が最大（最も近い）のセクションを選択
    # 3. 該当するセクションがない場合は"body"をデフォルトとして返す
    #
    # 例:
    #   idx = {"title" => 0, "lead" => 26, "body" => 81, "contact" => 121}
    #   guess_section(30, idx)  # => "lead" (26が最大で30 >= 26を満たす)
    #   guess_section(90, idx)  # => "body" (81が最大で90 >= 81を満たす)
    #   guess_section(5, idx)   # => "title" (0が最大で5 >= 0を満たす)
    #
    # 注意:
    # - この推定は簡易的なもので、セクションの終了位置は考慮しない
    # - セクション境界付近では不正確な結果になる可能性がある
    # - idxの値が-1の場合は存在しないセクションとして扱われる
    #
    # @param offset [Integer] 校正メッセージのテキスト内での位置（文字数）
    # @param idx [Hash] セクション名とその開始位置のマップ {"title" => 0, "lead" => 26, ...}
    # @return [String] 推定されたセクション名（"title", "lead", "body", "contact"）
    def guess_section(offset, idx)
      cand = idx.select { |_k, v| v >= 0 && offset >= v }.max_by { |_k, v| v }
      cand ? cand.first : "body"
    end
  end
  