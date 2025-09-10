import type { AnalysisResult, HookScore } from "./types/api";

type Props = {
  open: boolean;
  result: AnalysisResult | null;
  error: string | null;
  contact?: string;
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
  result,
  contact,
  error,
  placement = "modal",
}: Props) {
  const hookSuggestions: string[] = result?.ai?.hooks?.suggestion ?? [];
  const missingTitle: string[] = result?.ai?.fiveW2H?.title?.missing ?? [];
  const missingLead: string[] = result?.ai?.fiveW2H?.lead?.missing ?? [];
  const missingBody: string[] = result?.ai?.fiveW2H?.body?.missing ?? [];
  const hooksDetected: HookScore[] = result?.ai?.hooks?.scores ?? [];
  const titleSuggestion: string = result?.ai?.fiveW2H?.title?.suggestion ?? "";
  const leadSuggestion: string = result?.ai?.fiveW2H?.lead?.suggestion ?? "";
  const bodySuggestion: string = result?.ai?.fiveW2H?.body?.suggestion ?? "";

  const inner = (
    <div className="space-y-6">
      <div className="flex items-center pb-4 border-b border-[#F2F2F2]">
        <h2 className="text-2xl font-bold text-[#294C79]">AIアドバイス</h2>
      </div>

      {result == null && (
        <div className="text-[#294C79] text-center py-8 bg-[#F2F2F2] rounded-lg">
          解析中です…
        </div>
      )}
      {error && (
        <div className="text-red-700 bg-red-50 border border-red-200 rounded-lg p-4">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-6">
          {/* フック改善提案 */}
          {hookSuggestions.length > 0 && (
            <section className="border-2 border-[#294C79]/20 rounded-lg p-6 bg-white shadow-sm">
              <h3 className="font-semibold mb-4 text-[#294C79] text-lg border-b border-[#F2F2F2] pb-3">
                フック - 改善案
              </h3>
              <ul className="space-y-4">
                {hookSuggestions.map((s, i) => (
                  <li
                    key={i}
                    className="text-sm text-gray-800 leading-relaxed flex items-start bg-[#F2F2F2] p-3 rounded-lg"
                  >
                    <span className="inline-block w-2 h-2 bg-[#294C79] rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    {s}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* フックスコア表示 */}
          {hooksDetected.length > 0 && (
            <section className="border-2 border-[#294C79]/20 rounded-lg p-6 bg-white shadow-sm">
              <h3 className="font-semibold mb-4 text-[#294C79] text-lg border-b border-[#F2F2F2] pb-3">
                フック - 分析
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {hooksDetected.map((hook, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center p-4 bg-[#F2F2F2] rounded-lg border border-[#294C79]/10"
                  >
                    <span className="text-sm text-[#294C79] font-medium">
                      {hook.name}
                    </span>
                    <span className="text-sm font-bold text-white bg-[#294C79] px-3 py-1 rounded-full">
                      {(hook.score * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 5W2H分析 - タイトル */}
          {missingTitle.length > 0 && (
            <section className="border-2 border-[#294C79]/20 rounded-lg p-6 bg-white shadow-sm">
              <h3 className="font-semibold mb-4 text-[#294C79] text-lg border-b border-[#F2F2F2] pb-3">
                タイトル - 改善案
              </h3>
              <div className="flex flex-wrap gap-3 mb-4">
                {missingTitle.map((element, i) => (
                  <span
                    key={i}
                    className="px-4 py-2 bg-[#294C79] text-white text-sm rounded-full font-medium"
                  >
                    {element}
                  </span>
                ))}
              </div>
              {titleSuggestion && (
                <div className="text-sm text-gray-800 bg-[#F2F2F2] p-4 rounded-lg border border-[#294C79]/10 leading-relaxed">
                  {titleSuggestion}
                </div>
              )}
            </section>
          )}

          {/* 5W2H分析 - リード文 */}
          {missingLead.length > 0 && (
            <section className="border-2 border-[#294C79]/20 rounded-lg p-6 bg-white shadow-sm">
              <h3 className="font-semibold mb-4 text-[#294C79] text-lg border-b border-[#F2F2F2] pb-3">
                リード文 - 改善案
              </h3>
              <div className="flex flex-wrap gap-3 mb-4">
                {missingLead.map((element, i) => (
                  <span
                    key={i}
                    className="px-4 py-2 bg-[#294C79] text-white text-sm rounded-full font-medium"
                  >
                    {element}
                  </span>
                ))}
              </div>
              {leadSuggestion && (
                <div className="text-sm text-gray-800 bg-[#F2F2F2] p-4 rounded-lg border border-[#294C79]/10 leading-relaxed">
                  {leadSuggestion}
                </div>
              )}
            </section>
          )}

          {/* 5W2H分析 - 本文 */}
          {missingBody.length > 0 && (
            <section className="border-2 border-[#294C79]/20 rounded-lg p-6 bg-white shadow-sm">
              <h3 className="font-semibold mb-4 text-[#294C79] text-lg border-b border-[#F2F2F2] pb-3">
                本文 - 改善案
              </h3>
              <div className="flex flex-wrap gap-3 mb-4">
                {missingBody.map((element, i) => (
                  <span
                    key={i}
                    className="px-4 py-2 bg-[#294C79] text-white text-sm rounded-full font-medium"
                  >
                    {element}
                  </span>
                ))}
              </div>
              {bodySuggestion && (
                <div className="text-sm text-gray-800 bg-[#F2F2F2] p-4 rounded-lg border border-[#294C79]/10 leading-relaxed">
                  {bodySuggestion}
                </div>
              )}
            </section>
          )}

          {/* お問い合わせ情報の改善提案 */}
          {(() => {
            // contactが空または基本的なテンプレートのみの場合をチェック
            const isEmpty =
              !contact || contact.trim() === "" || contact.trim() === "---";

            if (isEmpty) {
              return (
                <section className="border-2 border-[#294C79]/20 rounded-lg p-6 bg-white shadow-sm">
                  <h3 className="font-semibold mb-4 text-[#294C79] text-lg border-b border-[#F2F2F2] pb-3">
                    お問い合わせ - 改善案
                  </h3>
                  <div className="flex flex-wrap gap-3 mb-4">
                    <span className="px-4 py-2 bg-[#294C79] text-white text-sm rounded-full font-medium">
                      部署・担当者名
                    </span>
                    <span className="px-4 py-2 bg-[#294C79] text-white text-sm rounded-full font-medium">
                      メールアドレス
                    </span>
                    <span className="px-4 py-2 bg-[#294C79] text-white text-sm rounded-full font-medium">
                      電話番号
                    </span>
                  </div>
                  <div className="text-sm text-gray-800 bg-[#F2F2F2] p-4 rounded-lg border border-[#294C79]/10 leading-relaxed">
                    お問い合わせ情報を追加することをお勧めします。部署名または担当者名、メールアドレス、電話番号を記載することで、読者が気軽に連絡を取ることができ、プレスリリースの効果を高めることができます。
                  </div>
                </section>
              );
            }

            // contactに内容がある場合は、不足要素をチェック
            const missingElements = [];
            if (!contact.includes("@")) missingElements.push("メールアドレス");
            if (
              !contact.includes("電話") &&
              !contact.includes("TEL") &&
              !contact.includes("tel")
            )
              missingElements.push("電話番号");
            if (!contact.includes("部署") && !contact.includes("担当"))
              missingElements.push("部署・担当者名");

            if (missingElements.length > 0) {
              return (
                <section className="border-2 border-[#294C79]/20 rounded-lg p-6 bg-white shadow-sm">
                  <h3 className="font-semibold mb-4 text-[#294C79] text-lg border-b border-[#F2F2F2] pb-3">
                    お問い合わせ - 改善案
                  </h3>
                  <div className="flex flex-wrap gap-3 mb-4">
                    {missingElements.map((element, i) => (
                      <span
                        key={i}
                        className="px-4 py-2 bg-[#294C79] text-white text-sm rounded-full font-medium"
                      >
                        {element}
                      </span>
                    ))}
                  </div>
                  <div className="text-sm text-gray-800 bg-[#F2F2F2] p-4 rounded-lg border border-[#294C79]/10 leading-relaxed">
                    お問い合わせ情報をより充実させることをお勧めします。
                    {missingElements.join("、")}
                    を追加することで、読者がより簡単に連絡を取ることができるようになります。
                  </div>
                </section>
              );
            }

            return null;
          })()}

          {/* 全て完璧な場合の表示 */}
          {missingTitle.length === 0 &&
            missingLead.length === 0 &&
            missingBody.length === 0 && (
              <section className="border-2 border-[#294C79]/20 rounded-lg p-6 bg-white shadow-sm">
                <h3 className="font-semibold mb-4 text-[#294C79] text-lg border-b border-[#F2F2F2] pb-3">
                  ✓ 分析結果
                </h3>
                <p className="text-sm text-gray-800 bg-[#F2F2F2] p-4 rounded-lg">
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
      className="w-[400px] shrink-0 max-h-[calc(100vh-4rem)] sticky top-4
                 bg-white text-black border-2 border-[#294C79]/20 rounded-xl p-6 overflow-auto shadow-lg"
      aria-label="AIアドバイス"
    >
      {inner}
    </aside>
  );
}
