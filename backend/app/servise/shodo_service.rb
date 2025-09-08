# app/services/shodo_service.rb
class ShodoService
    ROOT = "https://api.shodo.ink/@#{ENV.fetch('SHODO_ORG')}/#{ENV.fetch('SHODO_PROJECT')}/".freeze
  
    def self.lint!(text, type: "text")
      conn = Faraday.new(url: ROOT) do |f|
        f.request :json
        f.response :json, content_type: /\bjson$/
        f.adapter Faraday.default_adapter
      end
      res = conn.post("lint/") do |r|
        r.headers["Authorization"] = "Bearer #{ENV.fetch('SHODO_TOKEN')}"
        r.body = { body: text.to_s, type: type }
      end
      
      # デバッグログ
      Rails.logger.info "Shodo API Response Status: #{res.status}"
      Rails.logger.info "Shodo API Response Body: #{res.body}"
      
      res.body.fetch("lint_id")
    end
  
    def self.fetch(lint_id)
      conn = Faraday.new(url: ROOT) do |f|
        f.response :json, content_type: /\bjson$/
        f.adapter Faraday.default_adapter
      end
      res = conn.get("lint/#{lint_id}/") do |r|
        r.headers["Authorization"] = "Bearer #{ENV.fetch('SHODO_TOKEN')}"
      end
      res.body # => {"status"=>"processing|done|failed","messages"=>[...] }
    end
  end
  