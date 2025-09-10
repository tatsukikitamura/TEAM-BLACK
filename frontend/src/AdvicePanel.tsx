import type { AnalysisResult } from "./types/api";

type Props = {
  open: boolean;
  onClose: () => void;
  result: AnalysisResult | null;
  error: string | null;
  /** 'modal' | 'side' の2モード。既定は 'modal' */
  placement?: "modal" | "side";
  /** ボタン押下ごとにインクリメントして再取得トリガーにする */
  trigger?: number; // ★ トップレベルに置く
};

// API仕様に合わせて body を [{heading, content}] に分割（## 見出しで切る）
// eslint-disable-next-line react-refresh/only-export-components
export function toSections(
  markdown: string
): Array<{ heading: string; content: string }> {
  const lines = markdown.split("\n");
  const sections: Array<{ heading: string; content: string }> = [];
  let currentHeading = "本文";
  let buffer: string[] = [];

  const flush = () => {
    if (buffer.length > 0) {
      sections.push({
        heading: currentHeading,
        content: buffer.join("\n").trim(),
      });
      buffer = [];
    }
  };

  for (const line of lines) {
    const m = line.match(/^##\s+(.+)/);
    if (m) {
      flush();
      currentHeading = m[1].trim();
    } else {
      buffer.push(line);
    }
  }
  flush();
  return sections.length ? sections : [{ heading: "本文", content: markdown }];
}

export default function AdvicePanel({
  onClose,
  result,
  error,
  placement = "modal",
}: Props) {
  const hookSuggestions: string[] = result?.ai?.hooks?.suggestion ?? [];
  const missingTitle: string[] = result?.ai?.fiveW2H?.title?.missing ?? [];
  const missingLead: string[] = result?.ai?.fiveW2H?.lead?.missing ?? [];
  const missingBody: string[] = result?.ai?.fiveW2H?.body?.missing ?? [];
  const hooksDetected = result?.ai?.hooks?.scores ?? [];
  const titleSuggestion = result?.ai?.fiveW2H?.title?.suggestion ?? "";
  const leadSuggestion = result?.ai?.fiveW2H?.lead?.suggestion ?? "";
  const bodySuggestion = result?.ai?.fiveW2H?.body?.suggestion ?? "";

  const inner = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">AIアドバイス</h2>
        <button className="px-3 py-1 rounded bg-gray-200" onClick={onClose}>
          閉じる
        </button>
      </div>

      {result == null && <div>解析中です…</div>}
      {error && <div className="text-red-600">{error}</div>}

      {result && (
        <div className="space-y-4">
          {/* フック改善提案 */}
          {hookSuggestions.length > 0 && (
            <section className="border rounded p-3 bg-blue-50">
              <h3 className="font-semibold mb-2 text-blue-700">
                フック改善提案
              </h3>
              <ul className="list-disc list-inside space-y-1">
                {hookSuggestions.map((s, i) => (
                  <li key={i} className="text-sm">
                    {s}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* フックスコア表示 */}
          {hooksDetected.length > 0 && (
            <section className="border rounded p-3">
              <h3 className="font-semibold mb-2">フック分析結果</h3>
              <div className="grid grid-cols-2 gap-2">
                {hooksDetected.map((hook, i) => (
                  <div
                    key={i}
                    className="flex justify-between p-2 bg-gray-50 rounded"
                  >
                    <span className="text-sm">{hook.name}</span>
                    <span className="text-sm font-medium">
                      {(hook.score * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 5W2H分析 - タイトル */}
          {missingTitle.length > 0 && (
            <section className="border rounded p-3 bg-red-50">
              <h3 className="font-semibold mb-2 text-red-700">
                タイトル - 不足要素
              </h3>
              <div className="flex flex-wrap gap-1 mb-2">
                {missingTitle.map((element, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-red-200 text-red-800 text-xs rounded"
                  >
                    {element}
                  </span>
                ))}
              </div>
              {titleSuggestion && (
                <div className="text-sm text-gray-700 bg-white p-2 rounded">
                  {titleSuggestion}
                </div>
              )}
            </section>
          )}

          {/* 5W2H分析 - サブタイトル */}
          {missingLead.length > 0 && (
            <section className="border rounded p-3 bg-yellow-50">
              <h3 className="font-semibold mb-2 text-yellow-700">
                サブタイトル - 不足要素
              </h3>
              <div className="flex flex-wrap gap-1 mb-2">
                {missingLead.map((element, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs rounded"
                  >
                    {element}
                  </span>
                ))}
              </div>
              {leadSuggestion && (
                <div className="text-sm text-gray-700 bg-white p-2 rounded">
                  {leadSuggestion}
                </div>
              )}
            </section>
          )}

          {/* 5W2H分析 - 本文 */}
          {missingBody.length > 0 && (
            <section className="border rounded p-3 bg-purple-50">
              <h3 className="font-semibold mb-2 text-purple-700">
                本文 - 不足要素
              </h3>
              <div className="flex flex-wrap gap-1 mb-2">
                {missingBody.map((element, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-purple-200 text-purple-800 text-xs rounded"
                  >
                    {element}
                  </span>
                ))}
              </div>
              {bodySuggestion && (
                <div className="text-sm text-gray-700 bg-white p-2 rounded">
                  {bodySuggestion}
                </div>
              )}
            </section>
          )}

          {/* 全て完璧な場合の表示 */}
          {missingTitle.length === 0 &&
            missingLead.length === 0 &&
            missingBody.length === 0 && (
              <section className="border rounded p-3 bg-green-50">
                <h3 className="font-semibold mb-2 text-green-700">
                  ✓ 分析結果
                </h3>
                <p className="text-sm text-green-600">
                  5W2H の主要要素が適切に含まれています。
                </p>
              </section>
            )}
        </div>
      )}
    </div>
  );

  if (placement === "modal") {
    return (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
        <div className="bg-white text-black w-[min(900px,92vw)] max-h-[90vh] rounded-xl p-4 shadow-xl overflow-auto">
          {inner}
        </div>
      </div>
    );
  }

  return (
    <aside
      className="w-[380px] shrink-0 max-h-[calc(100vh-4rem)] sticky top-4
                 bg-white text-black border rounded-xl p-4 overflow-auto shadow-sm"
      aria-label="AIアドバイス"
    >
      {inner}
    </aside>
  );
}
