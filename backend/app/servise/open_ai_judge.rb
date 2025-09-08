# frozen_string_literal: true
class OpenAiJudge
    class AiError < StandardError; end
  
    MODEL = ENV.fetch("OPENAI_MODEL", "gpt-4o-mini")
  
    # 公開API
    def self.call(title:, lead:, body:, contact:, target_hooks:, timeout_ms: 20_000)
      new(title, lead, body, contact, target_hooks, timeout_ms).call
    end
  
    def initialize(title, lead, body, contact, target_hooks, timeout_ms)
      @title, @lead, @body, @contact = title, lead, body, contact
      @target_hooks = target_hooks
      @timeout_ms   = timeout_ms
    end
  
    def call
      client = OpenAI::Client.new
  
      messages = [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user",   content: user_payload }
      ]
  
      # JSON専用モード（壊れたJSONを避ける）
      resp = client.chat(parameters: {
        model: MODEL,
        response_format: { type: "json_object" },
        temperature: 0.2,
        messages: messages
      })
  
      content = resp.dig("choices", 0, "message", "content")
      raise AiError, "empty content" if content.to_s.strip.empty?
  
      parsed = JSON.parse(content) rescue nil
      raise AiError, "invalid JSON response" unless parsed.is_a?(Hash)
  
      # 最低限の形を保証（空配列・既定値を補う）
      normalize_output(parsed)
    rescue => e
      raise AiError, e.message
    end
  
    private
  
    SYSTEM_PROMPT = <<~PROMPT
      あなたは日本語プレスリリースの編集者です。
      出力は必ず **有効なJSON** のみ。余計な文字は一切出さない。

      目的（今回の仕様）:
      1) 5W2H+1W（ToWhom）の不足指摘（title/lead/bodyごと）
      2) 「9つのフック」の検出と不足指摘
      3) 本文全体から連絡先の有無判定

      ルール:
      - スコアは 0 / 0.5 / 1 の三段階。
      - 各スコアには、原文の短い evidence を1つ以上付けること。
      - evidence が提示できない要素は、スコアの上限を 0.5 とする（1を付けてはならない）。
      - missing 配列は必ず "Who|What|Where|When|Why|How|HowMuch|ToWhom" の大文字表記で返す。
      - **missing の定義**：その要素のスコアが **1 未満**（=0 または 0.5）なら該当要素名を missing に含める。
      - つまり、title/lead/body それぞれで、スコア 1 の要素だけが「満たされている」扱い。

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
      1) 時流/季節性: 季節/時流/トレンドや特定日付と結びつく情報（例: バレンタイン、2/22 など）
      2) 意外性: 「まさか」を実現、常識とズラす要素
      3) 逆説/対立: 定説と真逆、または対立構図の提示
      4) 地域性: 具体的な県名・市区名・ご当地性
      5) 話題性: 既に話題の事柄/作品/トレンドへの便乗・コラボ
      6) 社会性/公益性: 公益性・社会課題・制度/政策との接続
      7) 新規性/独自性: 初/唯一/独自の取り組み
      8) 最上級/希少性: 世界一/◯◯限定/希少素材 等
      9) 画像/映像: インパクトのあるビジュアルの存在・計画（画像が記事採否に影響しうる）

      連絡先の有無:
      - メール/電話/担当者/部署/「広報」「取材」「お問い合わせ」「press contact」等の有無で判断。
      - セクション名は問わない（本文全体から意味的に判定）。

      出力スキーマ:
      {
        "fiveW2H": {
          "title": {"who":0|0.5|1,"what":0|0.5|1,"where":0|0.5|1,"when":0|0.5|1,"why":0|0.5|1,"how":0|0.5|1,"howMuch":0|0.5|1,"toWhom":0|0.5|1,"missing":[...],"evidence":[...]},
          "lead":  { ... 同様 ... },
          "body":  { ... 同様 ... }
        },
        "hooks": {
          "detected": [ {"name":"時流/季節性|意外性|逆説/対立|地域性|話題性|社会性/公益性|新規性/独自性|最上級/希少性|画像/映像","score":0.0-1.0,"evidence":["..."]} ],
          "missing":  ["..."],
          "target":   <number>
        },
        "contact": {"exists": true|false, "confidence": 0.0-1.0, "evidence": ["..."]}
      }
    PROMPT
  
    def user_payload
      <<~TXT
        <INPUTS>
        [TITLE]
        #{@title}
  
        [LEAD]
        #{@lead}
  
        [BODY]
        #{@body}
  
        [CONTACT]
        #{@contact}
  
        [TARGET_HOOKS]
        #{@target_hooks}
        </INPUTS>
      TXT
    end
  
    W_KEYS = %w[who what where when why how howMuch toWhom].freeze
    
    MISSING_CANON = {
      "who"=>"Who","what"=>"What","where"=>"Where","when"=>"When","why"=>"Why","how"=>"How","howmuch"=>"HowMuch","towhom"=>"ToWhom",
      "Who"=>"Who","What"=>"What","Where"=>"Where","When"=>"When","Why"=>"Why","How"=>"How","HowMuch"=>"HowMuch","ToWhom"=>"ToWhom"
    }.freeze

    def canonicalize_missing(arr)
      Array(arr).map { |x| MISSING_CANON[x.to_s] }.compact.uniq
    end

    def normalize_output(obj)
      obj["fiveW2H"] ||= {}

      %w[title lead body].each do |k|
        obj["fiveW2H"][k] ||= {}
        # 既定値
        W_KEYS.each { |m| obj["fiveW2H"][k][m] ||= 0 }
        obj["fiveW2H"][k]["evidence"] ||= []

        # missingの正規化（大文字化）
        current_missing = canonicalize_missing(obj["fiveW2H"][k]["missing"])

        # ★ スコアから不足を再導出（スコア<1は不足）
        auto_missing = W_KEYS.select { |m| obj["fiveW2H"][k][m].to_f < 1.0 }.map do |m|
          MISSING_CANON[m] || m
        end

        obj["fiveW2H"][k]["missing"] = (current_missing + auto_missing).uniq
      end

      obj["hooks"] ||= {}
      obj["hooks"]["detected"] ||= []
      obj["hooks"]["missing"]  ||= []
      obj["hooks"]["target"]   ||= @target_hooks

      obj["contact"] ||= { "exists" => false, "confidence" => 0.0, "evidence" => [] }
      obj
    end
  end
  