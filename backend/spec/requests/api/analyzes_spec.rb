# spec/requests/api/analyzes_spec.rb
require 'rails_helper'

RSpec.describe "Api::AnalyzesController", type: :request do
  describe "POST /api/analyze" do
    let(:valid_params) do
      { markdown: "新製品を発表します。これは革新的な技術です。" }
    end

    context "正常なリクエストの場合" do
      before do
        # postメソッドで /api/analyze にリクエストを送るシミュレーション
        post api_analyze_path, params: valid_params, as: :json
      end

      it "HTTPステータス200 (ok) が返ること" do
        expect(response).to have_http_status(:ok)
      end

      it "レスポンスJSONにaiキーが含まれていること" do
        json = JSON.parse(response.body)
        expect(json).to include("ai")
      end

      it "レスポンスJSONのsuggestionsに期待される提案が含まれていること" do
        json = JSON.parse(response.body)
        # build_suggestionsメソッドが生成するダミーデータに基づくテスト
        expect(json["suggestions"]).to include("タイトルに地名（Where）を追加")
        expect(json["suggestions"]).to include("連絡先（会社/部署/担当/メール/電話/プレスキットURL）を本文末尾に追記")
      end
    end

    context "必須パラメータ（markdown）が欠落している場合" do
      before do
        post api_analyze_path, params: {}, as: :json
      end

      it "HTTPステータス400 (bad_request) が返ること" do
        expect(response).to have_http_status(:bad_request)
      end

      it "エラーメッセージが含まれていること" do
        json = JSON.parse(response.body)
        expect(json["error"]["message"]).to match(/param is missing or the value is empty or invalid: markdown/)
      end
    end
  end
end