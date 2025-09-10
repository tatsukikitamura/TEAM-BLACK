import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import AdvicePanel from "./AdvicePanel";
import Select from "./components/Select";
import type { AnalysisResult, PressReleaseData } from "./types/api";
import { toSections } from "./AdvicePanel";
import ShodoAdviceLauncher from "./shodo/ShodoAdviceLauncher";
import {
  ensureNotificationPermission,
  showDesktopNotification,
} from "./notice/notify";
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

    // ★ 初回だけ許可を取りにいく（ユーザー操作直後）
    const perm = await ensureNotificationPermission();
    if (perm === "denied") {
      console.info(
        "[notify] ユーザーが通知を拒否しました。以後は通知を出さずに続行します。"
      );
    }

    const payload = {
      title,
      lead,
      content: toSections(content),
      contact,
      searchHook: selectedHooks, 
      options: {
        target_hooks: 3,
        timeoutMs: 20000,
      },
    };

    const temp_result: AnalysisResult | null = result;
    try {
      setAdviceError(null);
      setResult(null);
      const res = await fetch(`${API_BASE}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const json = await res.json();
      setResult(json);


    // ★ ここで通知（権限が granted なら true が返る）
    const notified = await showDesktopNotification({
      title: "AIアドバイスの準備ができました",
      body: "クリックでアドバイスへスクロールします。",
      icon: "/icon-192.png",                 // 任意（public 配下のアイコン）
      tag: "advice-ready",                   // 同一タグは再通知時にマージ
      silent: false,
      data: {
        url: location.href,                  // 既存タブが無い場合に開くURL
        scrollTarget: '[aria-label="AIアドバイス"]', // Bridge 側のデフォルトに合わせる
      },
    });

      if (!notified) {
        // 通知が出せない環境 or denied の場合は黙ってスキップ（必要ならトースト表示など）
        console.info(
          "[notify] 通知は表示されませんでした（未許可/非対応/フォールバック失敗）"
        );
      }
    } catch (e: any) {
      setAdviceError(e?.message ?? "アドバイス取得に失敗しました");
      setResult(temp_result);
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

  return (
    <article className="w-4/5 mx-auto p-6 bg-[#F2F2F2] min-h-screen">
      {/* ← 横並びのラッパを追加 */}
      <div className="flex gap-6 items-start">
        {/* 左：本文エリア */}
        <div className="flex-1 min-w-0 bg-white rounded-lg shadow-sm border border-[#F2F2F2]">
          {isEditing ? (
            <div className="space-y-6 p-6">
              <h2 className="text-2xl font-bold text-[#294C79] border-b border-[#F2F2F2] pb-3">
                編集モード
              </h2>

              {/* フックの選択 */}
              <div className="bg-white p-4 rounded-lg border border-[#F2F2F2]">
                <h3 className="text-lg font-semibold mb-3 text-[#294C79]">
                  重要視したいフックの選択
                </h3>
                <Select
                  options={hookOptions}
                  value={selectedHooks}
                  onChange={setSelectedHooks}
                  placeholder="利用したいフックを選択してください"
                  className="w-full"
                />
              </div>
              {/* タイトル */}
              <div className="bg-white p-4 rounded-lg border border-[#F2F2F2]">
                <h3 className="text-lg font-semibold mb-3 text-[#294C79]">
                  タイトル
                </h3>
                <textarea
                  className="w-full border-2 border-[#294C79]/20 rounded-lg p-3 bg-white focus:border-[#294C79] focus:outline-none transition-colors resize-none"
                  style={{ height: "80px" }}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <div className="text-sm bg-white p-3 rounded-lg">
                  現在 {titleCount} / {TITLE_MAX} 文字（Markdown除外）
                </div>
              </div>
              {showTitleWarn && (
                <div className="text-orange-600 bg-orange-50 p-3 rounded-lg border border-orange-200">
                  文字数が少し多いです（{TITLE_WARN_THRESHOLD}文字以上）。
                </div>
              )}
              {titleCount > TITLE_MAX && (
                <div className="text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                  200文字以上は保存できません。
                </div>
              )}
              {error && (
                <div className="text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                  {error}
                </div>
              )}

              {/* リード文 */}
              <div className="bg-white p-4 rounded-lg border border-[#F2F2F2]">
                <h3 className="text-lg font-semibold mb-3 text-[#294C79]">
                  リード文
                </h3>
                <textarea
                  className="w-full border-2 border-[#294C79]/20 rounded-lg p-3 bg-white focus:border-[#294C79] focus:outline-none transition-colors resize-none"
                  style={{ height: "80px" }}
                  value={lead}
                  onChange={(e) => setLead(e.target.value)}
                />
              </div>

              {/* 本文 */}
              <div className="bg-white p-4 rounded-lg border border-[#F2F2F2]">
                <h3 className="text-lg font-semibold mb-3 text-[#294C79]">
                  本文
                </h3>
                <textarea
                  className="w-full border-2 border-[#294C79]/20 rounded-lg p-3 bg-white focus:border-[#294C79] focus:outline-none transition-colors resize-none"
                  style={{ height: "200px" }}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>

              {/* 連絡先 */}
              <div className="bg-white p-4 rounded-lg border border-[#F2F2F2]">
                <h3 className="text-lg font-semibold mb-3 text-[#294C79]">
                  お問い合わせ
                </h3>
                <textarea
                  className="w-full border-2 border-[#294C79]/20 rounded-lg p-3 bg-white focus:border-[#294C79] focus:outline-none transition-colors resize-none"
                  style={{ height: "100px" }}
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                />
              </div>

              <div className="flex gap-4 pt-4 border-t border-[#F2F2F2]">
                <button
                  onClick={handleSave}
                  className="px-6 py-3 bg-[#F2F2F2] hover:bg-gray-300 text-[#294C79] rounded-lg font-medium transition-colors border border-[#294C79]/20"
                >
                  プレビュー
                </button>
                {/* ★ ここは必ず openAdvice を呼ぶ */}
                <button
                  onClick={openAdvice}
                  className="px-6 py-3 bg-[#294C79] hover:bg-[#294C79]/90 text-white rounded-lg font-medium transition-colors shadow-sm"
                >
                  アドバイス
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 p-6">
              <div className="prose prose-lg max-w-none">
                <div className="text-[#294C79]">
                  <ReactMarkdown>{title}</ReactMarkdown>
                </div>
                <div className="text-gray-800">
                  <ReactMarkdown>{lead}</ReactMarkdown>
                </div>
                <div className="text-gray-800">
                  <ReactMarkdown>{content}</ReactMarkdown>
                </div>
                <div className="text-gray-700 text-sm">
                  <ReactMarkdown>{contact}</ReactMarkdown>
                </div>
              </div>
              <div className="flex gap-4 pt-4 border-t border-[#F2F2F2]">
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-3 bg-[#F2F2F2] hover:bg-gray-300 text-[#294C79] rounded-lg font-medium transition-colors border border-[#294C79]/20"
                >
                  編集
                </button>
                {/* プレビューからもアドバイス可能にするならこれを残す */}
                <button
                  onClick={openAdvice}
                  className="px-6 py-3 bg-[#294C79] hover:bg-[#294C79]/90 text-white rounded-lg font-medium transition-colors shadow-sm"
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
            result={result}
            error={adviceError}
            contact={contact}
            placement="side"
          />
        )}
      </div>
      <ShodoAdviceLauncher
        variant="inline"
        label="文書校正"
        values={{ title, lead, bodyMd: content, contact }} // これで空にならない
      />
    </article>
  );
}
