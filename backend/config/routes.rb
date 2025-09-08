Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html
  scope :api do
    scope :v1 do
      post "validate",  to: "api/v1/checks#validate"
      post "proofread", to: "api/v1/proofreads#create"
      get  "proofread/:id", to: "api/v1/proofreads#show"
      post "analyze",   to: "api/v1/analyzes#create"
      post "images",    to: "api/v1/images#create"
    end
  end
  


  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Defines the root path route ("/")
  # root "posts#index"
end
