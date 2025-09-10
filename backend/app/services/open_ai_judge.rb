# frozen_string_literal: true
class OpenAiJudge
    # AI判定の結果が空の場合や、無効なJSONの場合、api呼び出し中になんらかのエラーが発生した場合は、AiErrorを返す。
    class AiError < StandardError; end
   # モデルを環境変数から取得して指定。gpt-4o-miniを使用するのは、費用の安さとレスポンスの速さのため。
    MODEL = ENV.fetch("OPENAI_MODEL", "gpt-4o-mini")
  
    # ai = OpenAiJudge.call(title: title, lead: lead, body: bodytxt, contact: contact, target_hooks: hooks_threshold, timeout_ms: timeout_ms, search_hook: search_hook, success_examples: success_examples) のようにcallメソッドを呼び出せるようにする記述。analyzes_controller.rb で使用。
    def self.call(title:, lead:, body:, contact:, target_hooks:, timeout_ms: 20_000, search_hook: "", success_examples: [])
      new(title, lead, body, contact, target_hooks, timeout_ms, search_hook, success_examples).call
    end
    
    # オブジェクトの初期化を行い、後でcallメソッドで使用するためのデータを準備します。
    def initialize(title, lead, body, contact, target_hooks, timeout_ms, search_hook, success_examples)
      @title, @lead, @body, @contact = title, lead, body, contact
      @target_hooks = target_hooks
      @timeout_ms   = timeout_ms
      @search_hook  = search_hook
      @success_examples = success_examples
    end
  
    # OpenAI APIを呼び出して分析を行うメソッド。
    def call
      # OpenAI::Clientを初期化。client変数に格納。
      # OpenAI::Client.newはOpenAIのgemの機能。client.chat()で分析できる。
      client = OpenAI::Client.new
  
      # OpenAI APIに送信するメッセージの構成
      messages = [
        # システムメッセージ：AIの動作を定義。SYSTEM_PROMPTは下で定義している。
        { role: "system", content: SYSTEM_PROMPT },
        # ユーザメッセージ：ユーザが入力したデータ。user_payloadは下で定義している。
        { role: "user",   content: user_payload }
      ]
  
      # client.chat()でAPIを呼び出し。結果をrespに格納。
      # parameters: {
      #   model: MODEL,　- モデルを指定。
      #   response_format: { type: "json_object" }, - 出力形式をJSONで指定。
      #   temperature: 0.2, - 低い値で一貫性重視。分析結果の安定性を向上。
      #   messages: messages - 上で作成したメッセージ配列。システムプロンプトとユーザーメッセージ。
      # }
      resp = client.chat(parameters: {
        model: MODEL,
        response_format: { type: "json_object" },
        temperature: 0.2,
        messages: messages
      })
  
      # OpenAI APIからのレスポンスからコンテンツを抽出し、空でないことを確認する処理。
      # digメソッドを使用してネストしたハッシュから値を安全に取得。
      content = resp.dig("choices", 0, "message", "content")
      # コンテンツが空の場合は、AiErrorをraise。
      raise AiError, "empty content" if content.to_s.strip.empty?
  
      # JSON文字列を解析し、有効なハッシュであることを確認する処理。
      # JSON文字列をRubyオブジェクトに変換。解析に失敗した場合はnilを返す。
      parsed = JSON.parse(content) rescue nil
      # 解析結果がハッシュ（連想配列）かチェック。ハッシュでない場合はAiErrorをraise。
      raise AiError, "invalid JSON response" unless parsed.is_a?(Hash)
  
      # レスポンスの正規化処理。normalize_outputは下で定義している。
      normalize_output(parsed)
    # 他のすべての例外をキャッチして、AiErrorをraise。
    rescue => e
      raise AiError, e.message
    end
  
    private
  
    # OpenAIに送信するシステムプロンプトです。AIの役割と分析ルールを定義しています。
    SYSTEM_PROMPT = <<~PROMPT
      あなたは日本語プレスリリースの編集者です。
      出力は必ず **有効なJSON** のみ。余計な文字は一切出さない。

      目的（今回の仕様）:
      1) 5W2H+1W（ToWhom）の不足指摘と改善提案（title/lead/bodyごと）
      2) 「9つのフック」の検出とスコアリング、改善提案

      ルール:
      - スコアは 0.0 から 1.0 の範囲で評価する
      - missing 配列は必ず "Who|What|Where|When|Why|How|HowMuch|ToWhom" の大文字表記で返す
      - **missing の定義**：その要素のスコアが **1.0 未満**なら該当要素名を missing に含める
      - suggestion は具体的で実用的な改善提案を日本語で記述する

      フック改善提案（hooks.suggestion）の条件分岐:
      - SEARCH_HOOKが指定されている場合：指定されたフックを強化するための具体的な改善案（リライト案など）を生成
      - SEARCH_HOOKが指定されていない場合：スコアが高いフックや改善すべきフックについて汎用的なアドバイスを生成

      **成功事例参照**:
      - SUCCESS_EXAMPLESが提供されている場合、それらの成功事例を参考にして改善提案を行う
      - 成功事例の良い点を分析し、現在のプレスリリースに適用できる要素を提案する
      - 成功事例の特徴的な表現や構成を参考に、より効果的な改善案を生成する

      定義（5W2H+1W）:
      - Who（誰が）: 主語となる企業・団体名
      - What（何を）: サービス/事業/プロジェクト/イベント/製品/組織
      - Where（どこで）: 会場/販売エリア/URL/対象範囲（場所性が読み取れるもの）
      - When（いつ）: 具体日付・曜日・時刻・期間
      - Why（どうして）: 背景・目的
      - How（どのように）: 概要・特徴・方法・リアル/オンライン等
      - HowMuch（どのくらい）: 金額・数量・規模
      - ToWhom（誰に）: 情報を届けたい対象（読者/利用者/来場者/購入者など）

      定義（9つのフック）:
      1) 時流/季節性: 季節/時流/トレンドや特定日付と結びつく情報
      2) 意外性: 「まさか」を実現、常識とズラす要素
      3) 逆説/対立: 定説と真逆、または対立構図の提示
      4) 地域性: 具体的な県名・市区名・ご当地性
      5) 話題性: 既に話題の事柄/作品/トレンドへの便乗・コラボ
      6) 社会性/公益性: 公益性・社会課題・制度/政策との接続
      7) 新規性/独自性: 初/唯一/独自の取り組み
      8) 最上級/希少性: 世界一/◯◯限定/希少素材等
      9) 画像/映像: インパクトのあるビジュアルの存在・計画

      出力スキーマ:
      {
        "fiveW2H": {
          "title": {
            "missing": ["Who", "What", "Where", "When", "Why", "How", "HowMuch", "ToWhom"],
            "suggestion": "具体的な改善提案文"
          },
          "lead": {
            "missing": ["Who", "What", "Where", "When", "Why", "How", "HowMuch", "ToWhom"],
            "suggestion": "具体的な改善提案文"
          },
          "body": {
            "missing": ["Who", "What", "Where", "When", "Why", "How", "HowMuch", "ToWhom"],
            "suggestion": "具体的な改善提案文"
          }
        },
        "hooks": {
          "scores": [
            {"name": "時流/季節性", "score": 0.0-1.0},
            {"name": "意外性", "score": 0.0-1.0},
            {"name": "逆説/対立", "score": 0.0-1.0},
            {"name": "地域性", "score": 0.0-1.0},
            {"name": "話題性", "score": 0.0-1.0},
            {"name": "社会性/公益性", "score": 0.0-1.0},
            {"name": "新規性/独自性", "score": 0.0-1.0},
            {"name": "最上級/希少性", "score": 0.0-1.0},
            {"name": "画像/映像", "score": 0.0-1.0}
          ],
          "suggestion": ["改善提案1", "改善提案2"]
        }
      }
    PROMPT
  
    # OpenAIに送信するユーザーメッセージの内容を生成するメソッドです。分析対象のプレスリリースデータをAIが理解しやすい形式に構造化して送信します。
    def user_payload
      search_hook_info = @search_hook.empty? ? "" : "\n\n[SEARCH_HOOK]\n#{@search_hook}"
      success_examples_info = @success_examples.empty? ? "" : "\n\n[SUCCESS_EXAMPLES]\n#{@success_examples.join("\n")}"
      
      <<~TXT
        <INPUTS>
        [TITLE]
        #{@title}
  
        [LEAD]
        #{@lead}
  
        [CONTENT]
        #{@body}
  
        [CONTACT]
        #{@contact}#{search_hook_info}#{success_examples_info}
        </INPUTS>
      TXT
    end
  

    # OpenAIからのレスポンスを標準形式に正規化するメソッドです。不足しているフィールドを補完し、データの一貫性を保ちます。
    def normalize_output(obj)
      # fiveW2Hセクションが存在しない場合は空ハッシュを作成
      obj["fiveW2H"] ||= {}

      %w[title lead body].each do |k|
        # 各セクションに対して、セクションが存在しない場合は空ハッシュを作成
        obj["fiveW2H"][k] ||= {}
        # missing配列のデフォルト値を空配列に設定
        obj["fiveW2H"][k]["missing"] ||= []
        # suggestionのデフォルト値を空文字列に設定
        obj["fiveW2H"][k]["suggestion"] ||= ""
      end

      # hooksセクションが存在しない場合は空ハッシュを作成
      obj["hooks"] ||= {}
      # scores配列のデフォルト値を空配列に設定
      obj["hooks"]["scores"] ||= []
      # suggestion配列のデフォルト値を空配列に設定
      obj["hooks"]["suggestion"] ||= []
      
      # 正規化処理が完了したオブジェクトを返す
      obj
    end
  end
  