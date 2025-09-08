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

---

## 主な特徴

1. **革新的な技術**  
   - AI／機械学習を活用し、従来比◯倍の性能を実現。  
   - 高速処理と省エネルギー化を同時に達成。

2. **ユーザーフレンドリーな設計**  
   - 直感的なUI／UX。  
   - 導入から運用までを簡易化。

3. **持続可能性への配慮**  
   - 環境負荷を低減する設計思想。  
   - 国際的な基準に準拠したエコシステム。

---

## コメント

> 「PRTIEM は、業界に新しい可能性を開くプラットフォームです。ユーザー体験を革新し、未来を共に築いていきます。」  
> — PRTIEM 代表取締役 ◯◯ ◯◯氏

---

## 今後の展望

PRTIEM は今後、国内外のパートナーとの協業を拡大し、さらなる機能拡張やグローバル展開を予定しています。正式リリース後のロードマップについても順次公開される見込みです。

---

## まとめ

- PRTIEM が解決する課題と提供価値  
- 業界に与えるインパクト  
- 今後の展開への期待  

プレリリースの詳細は [公式サイト](https://example.com) をご覧ください。
`;
const initialContact = `---

## お問い合わせ

PRTIEM 広報担当  
E-mail: [info@example.com](mailto:info@example.com)  
電話: 03-1234-5678  
公式サイト: [https://example.com](https://example.com)
`;


//マークダウン文字数カウント
function countMarkdownChars(text:string) {
  // Markdownの装飾記号を削除
  const stripped = text
    .replace(/^#+\s*/gm, "") // 見出しの # を削除
    .replace(/^-+\s*/gm, "") // 箇条書きの - を削除
    .replace(/\*\*([^*]+)\*\*/g, "$1") // 太字 **...**
    .replace(/\*([^*]+)\*/g, "$1")     // 強調 *...*
    .replace(/`([^`]+)`/g, "$1");      // インラインコード `...`

  return stripped.length;
}






// 設定（しきい値）
const TITLE_WARN_THRESHOLD = 70;
const TITLE_MAX = 200;

// マークダウン表示
export default function MarkdownPreview() {
  // 編集用の状態変数
  const [title, setTitle] = useState(initialTitle);
  const [lead, setLead] = useState(initialLead);
  const [content, setContent] = useState(initialContent);
  const [contact, setContact] = useState(initialContact);
  const [isEditing, setIsEditing] = useState(false);

  // 各フィールドの（見かけの）文字数
  const titleCount = useMemo(() => countMarkdownChars(title), [title]);
  const leadCount = useMemo(() => countMarkdownChars(lead), [lead]);
  const contentCount = useMemo(() => countMarkdownChars(content), [content]);
  const contactCount = useMemo(() => countMarkdownChars(contact), [contact]);

  const titleWarning =
    titleCount >= TITLE_WARN_THRESHOLD && titleCount <= TITLE_MAX;

  const handleSave = () => {
    setIsEditing(false);
  };

  // タイトルは「Markdownを除いた文字数が200超」の入力を拒否（変更を反映しない）
  const handleTitleChange: React.ChangeEventHandler<HTMLTextAreaElement> = (e) => {
    const next = e.target.value;
    const nextCount = countMarkdownChars(next);
    if (nextCount <= TITLE_MAX) {
      setTitle(next);
    }
    // 200超なら無視（現在のstateを保持）
  };

  const baseTextareaCls =
    "w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-400";

  return (
    <article className="w-4/5 mx-auto p-4">
      {isEditing ? (
        <div className="space-y-5">
          <h2 className="text-xl font-bold">編集モード</h2>

          {/* タイトル（制限＆警告つき） */}
          <div>
            <label className="block mb-2 font-semibold">
              タイトル <span className="text-sm text-gray-500">(最大{TITLE_MAX}文字・Markdown除外)</span>
            </label>
            <textarea
              className={baseTextareaCls}
              style={{ height: "80px" }}
              value={title}
              onChange={handleTitleChange}
              aria-describedby="title-helper title-count"
            />
            <div id="title-count" className="mt-1 text-sm text-gray-600">
              現在 {titleCount} / {TITLE_MAX} 文字
            </div>
            {titleWarning && (
              <div
                id="title-helper"
                className="mt-1 text-sm text-amber-600"
                role="alert"
              >
                文字数が少し多いです（{TITLE_WARN_THRESHOLD}文字以上）。
              </div>
            )}
            {titleCount > TITLE_MAX && (
              <div className="mt-1 text-sm text-red-600" role="alert">
                200文字を超えるため、これ以上入力できません。
              </div>
            )}
          </div>

          {/* リード */}
          <div>
            <label className="block mb-2 font-semibold">リード文</label>
            <textarea
              className={baseTextareaCls}
              style={{ height: "80px" }}
              value={lead}
              onChange={(e) => setLead(e.target.value)}
              aria-describedby="lead-count"
            />
            <div id="lead-count" className="mt-1 text-sm text-gray-600">
              現在 {leadCount} 文字（Markdown除外）
            </div>
          </div>

          {/* 本文 */}
          <div>
            <label className="block mb-2 font-semibold">本文</label>
            <textarea
              className={baseTextareaCls}
              style={{ height: "200px" }}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              aria-describedby="content-count"
            />
            <div id="content-count" className="mt-1 text-sm text-gray-600">
              現在 {contentCount} 文字（Markdown除外）
            </div>
          </div>

          {/* お問い合わせ */}
          <div>
            <label className="block mb-2 font-semibold">お問い合わせ</label>
            <textarea
              className={baseTextareaCls}
              style={{ height: "100px" }}
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              aria-describedby="contact-count"
            />
            <div id="contact-count" className="mt-1 text-sm text-gray-600">
              現在 {contactCount} 文字（Markdown除外）
            </div>
          </div>

          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded"
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
            className="px-4 py-2 bg-gray-600 text-white rounded"
          >
            編集
          </button>
        </div>
      )}
    </article>
  );
}