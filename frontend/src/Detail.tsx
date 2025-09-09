import React, { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import AdvicePanel from "./AdvicePanel";
import Select from "./components/Select";
import type { AnalysisResult, PressReleaseData } from "./types/api";
import { toSections } from "./AdvicePanel";

// モックデータ（略）
const initialTitle = `# PRTIEM、新たな時代を切り拓く革新的ソリューションを発表`;
const initialLead = `2025年◯月◯日、**PRTIEM** は最新のプレリリースを公開し、業界に新たな可能性を提示しました。本記事では、その主要ポイントと今後の展望をまとめます。`;
const initialContent = `---
## 発表の概要
- 製品名／サービス名：**PRTIEM**
- 発表日：2025年◯月◯日
- 主な対象：企業ユーザー／開発者／一般消費者
- 提供開始時期：◯月予定

PRTIEM は、従来の〇〇課題を解決し、△△分野における新しいスタンダードを目指しています。
`;
const initialContact = `---
## お問い合わせ
PRTIEM 広報担当  
E-mail: [info@example.com](mailto:info@example.com)  
電話: 03-1234-5678  
公式サイト: [https://example.com](https://example.com)
`;

// Markdown装飾を除いた文字数
function countMarkdownChars(text: string) {
  const stripped = text
    .replace(/^#+\s*/gm, "")
    .replace(/^-+\s*/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1");
  return stripped.length;
}

const TITLE_WARN_THRESHOLD = 70;
const TITLE_MAX = 200;

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export default function MarkdownPreview() {
  const [title, setTitle] = useState(initialTitle);
  const [lead, setLead] = useState(initialLead);
  const [content, setContent] = useState(initialContent);
  const [contact, setContact] = useState(initialContact);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedHooks, setSelectedHooks] = useState("");

  const hookOptions = [
    {
      value: "時流/季節性",
      label:
        "時流/季節性: 季節/時流/トレンドや特定日付と結びつく情報（例: バレンタイン、2/22 など）",
    },
    { value: "意外性", label: "意外性: 「まさか」を実現、常識とズラす要素" },
    {
      value: "逆説/対立",
      label: "逆説/対立: 定説と真逆、または対立構図の提示",
    },
    { value: "地域性", label: "地域性: 具体的な県名・市区名・ご当地性" },
    {
      value: "話題性",
      label: "話題性: 既に話題の事柄/作品/トレンドへの便乗・コラボ",
    },
    {
      value: "社会性/公益性",
      label: "社会性/公益性: 公益性・社会課題・制度/政策との接続",
    },
    { value: "新規性/独自性", label: "新規性/独自性: 初/唯一/独自の取り組み" },
    {
      value: "最上級/希少性",
      label: "最上級/希少性: 世界一/◯◯限定/希少素材 等",
    },
    {
      value: "画像/映像",
      label:
        "画像/映像: インパクトのあるビジュアルの存在・計画（画像が記事採否に影響しうる）",
    },
  ];

  // アドバイス
  const [adviceOpen, setAdviceOpen] = useState(false);
  const [adviceData, setAdviceData] = useState<PressReleaseData | null>(null);

  const [adviceError, setAdviceError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  // ★ アドバイスボタン押下時：その瞬間の値をスナップショットしてから開く
  const openAdvice = async () => {
    setAdviceData({ title, lead, content, contact }); // スナップショット
    setAdviceOpen(true);

    const payload = {
      title,
      lead,
      content: toSections(content),
      contact,
      searchHook: selectedHooks, // ★ 追加
      options: {
        target_hooks: 3,
        timeoutMs: 20000,
      },
    };
    try {
      const res = await fetch(`${API_BASE}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const json = await res.json();
      console.log(json);
      setResult(json);
    } catch (e: any) {
      setAdviceError(e?.message ?? "アドバイス取得に失敗しました");
    }
  };

  const titleCount = useMemo(() => countMarkdownChars(title), [title]);
  const showTitleWarn =
    titleCount >= TITLE_WARN_THRESHOLD && titleCount <= TITLE_MAX;

  const handleSave = () => {
    if (titleCount > TITLE_MAX) {
      setError(
        `タイトルは ${TITLE_MAX} 文字以内にしてください（現在 ${titleCount} 文字）。`
      );
      return;
    }
    setError(null);
    setIsEditing(false);
  };

  console.log("result:", result);

  return (
    <article className="w-4/5 mx-auto p-4">
      {/* ← 横並びのラッパを追加 */}
      <div className="flex gap-4 items-start">
        {/* 左：本文エリア */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">編集モード</h2>

              {/* フックの選択 */}
              <div>
                <h3 className="text-lg font-semibold mb-2">フックの選択</h3>
                <Select
                  options={hookOptions}
                  value={selectedHooks}
                  onChange={setSelectedHooks}
                  placeholder="利用したいフックを選択してください"
                  className="w-full"
                />
              </div>
              {/* タイトル */}
              <div>
                <h3 className="text-lg font-semibold mb-2">タイトル</h3>
                <textarea
                  className="w-full border rounded p-2"
                  style={{ height: "80px" }}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                現在 {titleCount} / {TITLE_MAX} 文字（Markdown除外）
              </div>
              {showTitleWarn && (
                <div>
                  文字数が少し多いです（{TITLE_WARN_THRESHOLD}文字以上）。
                </div>
              )}
              {titleCount > TITLE_MAX && (
                <div className="text-red-600">
                  200文字以上は保存できません。
                </div>
              )}
              {error && <div className="text-red-600">{error}</div>}

              {/* サブタイトル */}
              <div>
                <h3 className="text-lg font-semibold mb-2">サブタイトル</h3>
                <textarea
                  className="w-full border rounded p-2"
                  style={{ height: "80px" }}
                  value={lead}
                  onChange={(e) => setLead(e.target.value)}
                />
              </div>

              {/* 本文 */}
              <div>
                <h3 className="text-lg font-semibold mb-2">本文</h3>
                <textarea
                  className="w-full border rounded p-2"
                  style={{ height: "200px" }}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>

              {/* 連絡先 */}
              <div>
                <h3 className="text-lg font-semibold mb-2">お問い合わせ</h3>
                <textarea
                  className="w-full border rounded p-2"
                  style={{ height: "100px" }}
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-black rounded"
                >
                  保存
                </button>
                {/* ★ ここは必ず openAdvice を呼ぶ */}
                <button
                  onClick={openAdvice}
                  className="px-4 py-2 bg-amber-400 text-black rounded"
                >
                  アドバイス
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <ReactMarkdown>{title}</ReactMarkdown>
              <ReactMarkdown>{lead}</ReactMarkdown>
              <ReactMarkdown>{content}</ReactMarkdown>
              <ReactMarkdown>{contact}</ReactMarkdown>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-gray-600 text-black rounded"
                >
                  編集
                </button>
                {/* プレビューからもアドバイス可能にするならこれを残す */}
                <button
                  onClick={openAdvice}
                  className="px-4 py-2 bg-amber-400 text-black rounded"
                >
                  アドバイス
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 右：AIアドバイス（side表示） */}
        {adviceData && (
          <AdvicePanel
            open={adviceOpen}
            onClose={() => setAdviceOpen(false)}
            result={result}
            error={adviceError}
            placement="side"
          />
        )}
      </div>
    </article>
  );
}
