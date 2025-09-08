import React, { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";

//モックデータ
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

// Markdownの装飾記号を除いてカウント
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

export default function MarkdownPreview() {
  const [title, setTitle] = useState(initialTitle);
  const [lead, setLead] = useState(initialLead);
  const [content, setContent] = useState(initialContent);
  const [contact, setContact] = useState(initialContact);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const titleCount = useMemo(() => countMarkdownChars(title), [title]);
  const showTitleWarn =
    titleCount >= TITLE_WARN_THRESHOLD && titleCount <= TITLE_MAX;

  const handleSave = () => {
    if (titleCount > TITLE_MAX) {
      setError(`タイトルは ${TITLE_MAX} 文字以内にしてください（現在 ${titleCount} 文字）。`);
      return;
    }
    setError(null);
    setIsEditing(false);
  };

  return (
    <article className="w-4/5 mx-auto p-4">
      {isEditing ? (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">編集モード</h2>

          {/* タイトル */}
          <textarea
            className="w-full border rounded p-2"
            style={{ height: "80px" }}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div>
            現在 {titleCount} / {TITLE_MAX} 文字（Markdown除外）
          </div>
          {showTitleWarn && (
            <div>文字数が少し多いです（{TITLE_WARN_THRESHOLD}文字以上）。</div>
          )}
          {titleCount > TITLE_MAX && (
            <div className="text-red-600">200文字以上は保存できません。</div>
          )}
          {error && <div className="text-red-600">{error}</div>}

          {/* サブタイトル */}
          <textarea
            className="w-full border rounded p-2"
            style={{ height: "80px" }}
            value={lead}
            onChange={(e) => setLead(e.target.value)}
          />

          {/* 本文 */}
          <textarea
            className="w-full border rounded p-2"
            style={{ height: "200px" }}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          {/* 連絡 */}
          <textarea
            className="w-full border rounded p-2"
            style={{ height: "100px" }}
            value={contact}
            onChange={(e) => setContact(e.target.value)}
          />

          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-black rounded"
          >
            保存
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <ReactMarkdown>{title}</ReactMarkdown>
          <ReactMarkdown>{lead}</ReactMarkdown>
          <ReactMarkdown>{content}</ReactMarkdown>
          <ReactMarkdown>{contact}</ReactMarkdown>
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-gray-600 text-black rounded"
          >
            編集
          </button>
        </div>
      )}
    </article>
  );
}
