// src/AdivicePane.tsx
import React, { useEffect, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  lead: string;
  content: string;
  contact: string;
  analyzeOptions?: {
    hooksThreshold?: number;
    timeoutMs?: number;
  };
  /** 'modal' | 'side' の2モード。既定は 'modal' */
  placement?: "modal" | "side";
  /** ボタン押下ごとにインクリメントして再取得トリガーにする */
  trigger?: number; // ★ トップレベルに置く
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// API仕様に合わせて body を [{heading, content}] に分割（## 見出しで切る）
function toSections(markdown: string): Array<{ heading: string; content: string }> {
  const lines = markdown.split("\n");
  const sections: Array<{ heading: string; content: string }> = [];
  let currentHeading = "本文";
  let buffer: string[] = [];

  const flush = () => {
    if (buffer.length > 0) {
      sections.push({ heading: currentHeading, content: buffer.join("\n").trim() });
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
  open,
  onClose,
  title,
  lead,
  content,
  contact,
  analyzeOptions,
  placement = "modal",
  trigger, // ★ 受け取る
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  // ★ 開いた時＆triggerが変わった時だけ実行（編集では発火しない）
  useEffect(() => {
    if (!open) return;
    if (trigger === undefined) return; // 初回レンダーで未定義のときはスキップ
    let aborted = false;

    const payload = {
      title,
      lead,
      body: toSections(content),
      contact,
      options: {
        hooksThreshold: analyzeOptions?.hooksThreshold ?? 3,
        timeoutMs: analyzeOptions?.timeoutMs ?? 20000,
      },
    };

    (async () => {
      setLoading(true);
      setError(null);
      setResult(null);
      try {
        const res = await fetch(`${API_BASE}/api/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const json = await res.json();
        if (!aborted) setResult(json);
      } catch (e: any) {
        if (!aborted) setError(e?.message ?? "アドバイス取得に失敗しました");
      } finally {
        if (!aborted) setLoading(false);
      }
    })();

    return () => {
      aborted = true;
    };
  }, [open, trigger]); // ★ ここだけを見る

  if (!open) return null;

  const suggestions: string[] = result?.suggestions ?? [];
  const missingTitle: string[] = result?.ai?.fiveW2H?.title?.missing ?? [];
  const hooksDetected = result?.ai?.hooks?.detected ?? [];
  const hooksMissing: string[] = result?.ai?.hooks?.missing ?? [];
  const hooksTarget = result?.ai?.hooks?.target ?? null;

  const inner = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">AIアドバイス</h2>
        <button className="px-3 py-1 rounded bg-gray-200" onClick={onClose}>
          閉じる
        </button>
      </div>

      {loading && <div>解析中です…</div>}
      {error && <div className="text-red-600">{error}</div>}

      {!loading && !error && result && (
        <div className="space-y-4">
          {suggestions.length > 0 && (
            <section className="border rounded p-3 bg-gray-50">
              <h3 className="font-semibold mb-2">改善提案</h3>
              <ul className="list-disc list-inside">
                {suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </section>
          )}

          {(missingTitle.length > 0 || result?.ai?.fiveW2H) && (
            <section className="border rounded p-3">
              <h3 className="font-semibold mb-2">5W2H+1W チェック（タイトル抜粋）</h3>
              {missingTitle.length > 0 ? (
                <div className="text-sm">不足: {missingTitle.join(", ")}</div>
              ) : (
                <div className="text-sm">タイトルは主要要素を概ね満たしています。</div>
              )}
            </section>
          )}

          {(hooksDetected.length > 0 || hooksMissing.length > 0) && (
            <section className="border rounded p-3">
              <h3 className="font-semibold mb-2">フック</h3>
              {hooksTarget !== null && <div className="text-sm mb-2">目標数: {hooksTarget}</div>}
              {hooksDetected.length > 0 && (
                <>
                  <div className="font-medium">検出されたフック</div>
                  <ul className="list-disc list-inside mb-2">
                    {hooksDetected.map((h: any, i: number) => (
                      <li key={i}>
                        {h.name}（score: {h.score}）
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {hooksMissing.length > 0 && (
                <>
                  <div className="font-medium">不足している可能性</div>
                  <ul className="list-disc list-inside">
                    {hooksMissing.map((m: string, i: number) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </>
              )}
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
