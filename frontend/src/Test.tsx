// src/test.tsx
import React from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import "./App.css"; // ← あなたの @import "tailwindcss"; が入っているCSS

function DarkToggle() {
  return (
    <button
      onClick={() => document.documentElement.classList.toggle("dark")}
      className="text-sm px-3 py-1 rounded border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
      title="Toggle dark mode"
    >
      Dark
    </button>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const link =
    "text-sm px-3 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800";
  const active = "font-semibold underline";
  return (
    <div className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="mx-auto max-w-5xl px-4 py-4 flex items-center gap-2">
        <h1 className="text-lg font-semibold mr-auto">Markdown Demo</h1>
        <NavLink to="/" className={({ isActive }) => `${link} ${isActive ? active : ""}`}>
          Home
        </NavLink>
        <NavLink to="/md" className={({ isActive }) => `${link} ${isActive ? active : ""}`}>
          Markdown
        </NavLink>
        <NavLink to="/md/sample" className={({ isActive }) => `${link} ${isActive ? active : ""}`}>
          Sample
        </NavLink>
        <DarkToggle />
      </header>
      <main className="mx-auto max-w-5xl px-4 pb-16">{children}</main>
    </div>
  );
}

function Home() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Home</h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        右上の <span className="font-mono">Markdown</span> へどうぞ。
      </p>
      <div className="p-6 space-y-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
        <h3 className="text-2xl font-bold text-blue-600">Tailwind v4 動作チェック</h3>
        <p className="text-sm">
          これは <code>text-blue-600</code>, <code>p-6</code> のテストです。
        </p>
        <button className="px-4 py-2 rounded bg-blue-600 text-white hover:opacity-90">
          ボタン
        </button>
      </div>
    </div>
  );
}

const samples: Record<string, string> = {
  default: `
# React Router + Markdown + Tailwind

- [x] GFM（表/チェックリスト/打消し）対応
- [x] 画像
- [x] Prism シンタックスハイライト

## コードブロック
\`\`\`ts
type User = { name: string; age: number };
const u: User = { name: "Yamada", age: 20 };
console.log(u);
\`\`\`

## テーブル
| 名前 | 年齢 |
|-----|-----:|
| 山田 | 20   |
| 田中 | 25   |

## 画像
![ねこ](https://placekitten.com/300/200)

**太字** ~~打消し~~ *斜体*
`,
  sample: `
# サンプル（/md/sample）

- [ ] Todo 1
- [x] Todo 2

\`\`\`js
function greet(n){ console.log("Hello " + n); }
greet("Router");
\`\`\`
`,
};

function MarkdownPage({ initialKey = "default" }: { initialKey?: keyof typeof samples }) {
  const [text, setText] = React.useState<string>(samples[initialKey] ?? samples.default);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Markdown Viewer</h2>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={12}
        className="w-full font-mono text-sm p-3 border rounded-lg bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-800"
        placeholder="ここにMarkdownを書いてください"
      />

      <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
        {/* prose: Markdown の見た目を一気に整える。max-w-none で横幅制限解除 */}
        <article className="prose prose-zinc max-w-none dark:prose-invert">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || "");
                return match ? (
                  <SyntaxHighlighter
                    style={oneDark}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  >
                    {String(children).replace(/\n$/, "")}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
              img({ ...props }) {
                // prose でサイズはいい感じになるが、角丸を追加
                return <img className="rounded-lg" {...props} />;
              },
              table({ ...props }) {
                // 横スクロール可能に
                return (
                  <div className="overflow-x-auto">
                    <table {...props} />
                  </div>
                );
              },
            }}
          >
            {text}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="space-y-2">
      <h2 className="text-xl font-bold">ページが見つかりません</h2>
      <p className="text-sm">
        上部ナビの「Home」または「Markdown」から移動してください。
      </p>
    </div>
  );
}

export default function Test() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/md" element={<MarkdownPage initialKey="default" />} />
          <Route path="/md/sample" element={<MarkdownPage initialKey="sample" />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
