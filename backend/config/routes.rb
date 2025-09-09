Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html
  
  # APIエンドポイントの設定
  namespace :api do
    # 画像分析処理：新しい分析リクエストを受け付ける
    post "analyze",   to: "analyzes#create"
    
    # 画像検証処理：画像の内容を検証する
    post "validate",  to: "checks#validate"
    
    # 書道関連処理：新しい書道解析リクエストを受け付ける
    post "shodo", to: "shodo#create"
    
    # 書道結果取得：特定のIDの書道解析結果を取得する
    get "shodo/:id", to: "shodo#show"
    post "image", to: "images#validate"
  end

  # ヘルスチェックエンドポイント
  # アプリケーションの稼働状態を確認するために使用
  # ロードバランサーや監視ツールからアクセスされる
  get "up" => "rails/health#show", as: :rails_health_check

  # ルートパス（トップページ）の設定
  # 現在はコメントアウトされているため未設定
  # root "posts#index"
end