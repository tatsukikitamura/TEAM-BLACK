# frozen_string_literal: true

class MarkdownParser
  # Markdownテキストからセクションを抽出
  def self.extract_sections(markdown)
    sections = {
      "title" => "",
      "lead" => "",
      "body" => "",
      "contact" => ""
    }

    return sections if markdown.blank?

    lines = markdown.split("\n")
    current_section = "body"
    current_content = []

    lines.each do |line|
      # 見出しレベル1をタイトルとして扱う
      if line.match(/^#\s+(.+)/)
        if current_section == "body" && current_content.empty?
          sections["title"] = line.gsub(/^#\s+/, "")
          current_section = "lead"
        else
          current_content << line
        end
      # リード文の判定（簡易的）
      elsif line.match(/^##\s+(概要|リード|はじめに)/) && current_section == "lead"
        current_section = "body"
        current_content << line
      # お問い合わせセクションの判定
      elsif line.match(/^##\s+(お問い合わせ|連絡先|コンタクト)/)
        sections["body"] = current_content.join("\n") if current_section == "body"
        current_section = "contact"
        current_content = [line]
      else
        current_content << line
      end
    end

    # 最後のセクションを設定
    case current_section
    when "lead"
      sections["lead"] = current_content.join("\n")
    when "body"
      sections["body"] = current_content.join("\n")
    when "contact"
      sections["contact"] = current_content.join("\n")
    end

    sections
  end

  # Markdownの装飾記号を除去してプレーンテキストに変換
  def self.plain(markdown)
    return "" if markdown.blank?

    markdown
      .gsub(/^#+\s*/, "")           # 見出し記号
      .gsub(/^\*+\s*/, "")          # リスト記号
      .gsub(/\*\*([^*]+)\*\*/, '\1') # 太字
      .gsub(/\*([^*]+)\*/, '\1')     # 斜体
      .gsub(/`([^`]+)`/, '\1')       # インラインコード
      .gsub(/\[([^\]]+)\]\([^)]+\)/, '\1') # リンク
      .gsub(/!\[([^\]]*)\]\([^)]+\)/, '\1') # 画像
      .gsub(/~~([^~]+)~~/, '\1')     # 打消し線
      .strip
  end
end
