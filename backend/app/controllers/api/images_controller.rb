class Api::ImagesController < ApplicationController
  # 画像検証APIエンドポイント
  # POST /api/images/validate でアクセス
  def validate
    # OpenAIクライアントの初期化
    # 環境変数 OPENAI_API_KEY にAPIキーが設定されている必要があります
    client = OpenAI::Client.new

    # リクエストパラメータから画像URLを取得
    # 例: { "image_url": "https://example.com/image.jpg" }
    image_url = params[:image_url]
    
    # OpenAI APIへのリクエスト実行
    # gpt-4o-miniモデルは画像解析機能に対応しています
    response = client.chat(
      parameters: {
        model: "gpt-4o-mini",  # 画像解析可能なマルチモーダルモデル
        messages: [
          {
            role: "user",  # ユーザーからのメッセージ
            content: [
              # システムプロンプト：AIへの指示
              { type: "text", text: "この画像に文字が含まれているか判定してください。True/Falseで答えてください。" },
              # 解析対象の画像URL
              { type: "image_url", image_url: { url: image_url } }
            ]
          }
        ]
      }
    )

    # APIレスポンスから結果を抽出してJSON形式で返却
    # choices[0].message.content にAIの応答が含まれます
    render json: { 
      result: response.dig("choices", 0, "message", "content") 
    }
  end
end