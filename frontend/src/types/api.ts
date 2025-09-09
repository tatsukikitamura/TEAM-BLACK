// API関連の型定義

// 5W2H分析のセクション
export interface FiveW2HSection {
  missing: string[];
  suggestion: string;
}

// フックスコア
export interface HookScore {
  name: string;
  score: number;
}

// OpenAI分析のAPIレスポンス
export interface AnalysisResult {
  ai: {
    fiveW2H: {
      title: FiveW2HSection;
      lead: FiveW2HSection;
      body: FiveW2HSection;
    };
    hooks: {
      scores: HookScore[];
      suggestion: string[];
    };
  };
}

// APIリクエスト用のプレスリリースデータ
export interface PressReleaseData {
  title: string;
  lead: string;
  content: string;
  contact: string;
  category?: string;
  target?: string;
}

// APIエラーレスポンス
export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

// APIレスポンスの基本構造
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

// Select コンポーネント用
export interface SelectOption {
  value: string;
  label: string;
}
