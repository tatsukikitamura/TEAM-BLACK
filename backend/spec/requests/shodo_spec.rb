require 'rails_helper'

RSpec.describe "Api::ShodoController", type: :request do
  describe "POST /api/shodo（校正ジョブ作成）" do
    let(:path) { "/api/shodo" }
    let(:params) do
      {
        title: "タイトル",
        lead: "リード",
        body: [ { heading: "h1", content: "本文" } ],
        contact: "会社/担当/メール",
        options: { type: "text", maxWaitMs: 1000, pollIntervalMs: 10 }
      }
    end

    it "Shodo が即時に完了した場合は done を返すこと" do
      allow(ShodoService).to receive(:lint!).and_return("job-1")
      allow(ShodoService).to receive(:fetch).with("job-1").and_return({ "status" => "done", "messages" => [] })

      post path, params: params

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json.dig("shodo", "status")).to eq("done")
    end

    it "処理中の場合は 202 Accepted と task_id を返すこと" do
      allow(ShodoService).to receive(:lint!).and_return("job-2")
      allow(ShodoService).to receive(:fetch).and_return({ "status" => "processing" })

      post path, params: params

      expect(response).to have_http_status(:accepted)
      json = JSON.parse(response.body)
      expect(json.dig("shodo", "status")).to eq("processing")
      expect(json.dig("shodo", "task_id")).to eq("job-2")
    end

    it "全フィールドが空の場合は 400 BadRequest を返すこと" do
      post path, params: { title: "", lead: "", body: [], contact: "" }

      expect(response).to have_http_status(:bad_request)
      json = JSON.parse(response.body)
      expect(json.dig("error", "code")).to eq("BadRequest")
    end
  end

  describe "GET /api/shodo/:id（校正結果取得）" do
    it "完了済みジョブなら done を返すこと" do
      allow(ShodoService).to receive(:fetch).with("job-9").and_return({ "status" => "done", "messages" => [] })

      get "/api/shodo/job-9"

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json.dig("shodo", "status")).to eq("done")
    end
  end
end
