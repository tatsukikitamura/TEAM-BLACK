import { useState } from "react";

const TestAPI = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // 環境変数が無い時は 3000 をデフォルトに
  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000); // 20s timeout

    try {
      const res = await fetch(`${apiBase}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "テストタイトル",
          lead: "これはテスト用のリード文です。",
          body: [{ heading: "概要", content: "本文のテストです。" }],
          contact: "test@example.com",
          // options: { hooksThreshold: 3, timeoutMs: 20000 }, // 必要なら
        }),
        signal: controller.signal,
      });

      // 失敗時の本文も読んで表示
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${res.statusText}${text ? `\n${text}` : ""}`);
      }

      setResult(await res.json());
    } catch (e: any) {
      if (e.name === "AbortError") setError("リクエストがタイムアウトしました");
      else setError(e.message || String(e));
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleClick} disabled={loading}>
        {loading ? "送信中..." : "APIテスト実行"}
      </button>
      {error && <p>Error: {error}</p>}
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
};

export default TestAPI;
