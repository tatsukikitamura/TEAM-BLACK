OpenAI.configure do |c|
    c.access_token = ENV.fetch("OPENAI_API_KEY")
    c.request_timeout = 30 # 秒
  end
  