import React from "react";
import ReactMarkdown from "react-markdown";

// 各セクションを分けて変数に格納

//モックデータ
const title = `# PRTIEM、新たな時代を切り拓く革新的ソリューションを発表`;

const lead = `2025年◯月◯日、**PRTIEM** は最新のプレリリースを公開し、業界に新たな可能性を提示しました。本記事では、その主要ポイントと今後の展望をまとめます。`;

const content = `---

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


const contact = `---


## お問い合わせ


PRTIEM 広報担当
E-mail: [info@example.com](mailto:info@example.com)
電話: 03-1234-5678
公式サイト: [https://example.com](https://example.com)
`;


//マークダウンを表示
export default function MarkdownPreview() {
return (
<article>
<ReactMarkdown>{title}</ReactMarkdown>
<ReactMarkdown>{lead}</ReactMarkdown>
<ReactMarkdown>{content}</ReactMarkdown>
<ReactMarkdown>{contact}</ReactMarkdown>
</article>
);
}