require 'rails_helper'

RSpec.describe "Api::ImagesController", type: :request do
  describe "POST /api/image（画像解析）" do
    let(:path) { "/api/image" }

    it "OpenAIの応答から result が返ること" do
      fake_client = instance_double(OpenAI::Client)
      allow(OpenAI::Client).to receive(:new).and_return(fake_client)
      allow(fake_client).to receive(:chat).and_return(
        {
          "choices" => [
            { "message" => { "content" => "True" } }
          ]
        }
      )

      post path, params: { image_url: "https://example.com/image.jpg" }

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body["result"]).to eq("True")
    end
  end
end
