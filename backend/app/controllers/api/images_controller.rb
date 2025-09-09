class Api::ImagesController < ApplicationController
  def validate
    client = OpenAI::Client.new

    image_url = params[:image_url]
    
    response = client.chat(
      parameters: {
        model: "gpt-4o-mini",  # 画像も扱えるモデル
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "この画像に文字が含まれているか判定してください。True/Falseで答えてください。" },
              { type: "image_url", image_url: { url: image_url } }
            ]
          }
        ]
      }
    )

    render json: { result: response.dig("choices", 0, "message", "content") }
  end
end
