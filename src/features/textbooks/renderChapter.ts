// features/textbooks/renderChapter.ts
// A small markdown renderer for chapter content.
//
// Purpose-built rather than pulled from npm: the chapters use a fixed, known
// subset of markdown, and a full parser would add far more to the bundle than
// this app can justify shipping over a 2G connection.

interface Block {
  kind: "heading" | "paragraph" | "ul" | "ol" | "quote" | "table" | "rule";
  level?: number;
  lines: string[];
}

/**
 * Escapes HTML before any markup is added.
 *
 * Chapter content is authored in-repo rather than user-submitted, but the
 * output goes through `dangerouslySetInnerHTML`, so it is escaped anyway —
 * defence in depth costs nothing here.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Inline formatting: bold, italic, code. Applied after escaping. */
function inline(text: string): string {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>");
}

function splitRow(row: string): string[] {
  return row
    .replace(/^\s*\|/, "")
    .replace(/\|\s*$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isTableDivider(line: string): boolean {
  return /^\s*\|[\s:|-]+\|\s*$/.test(line);
}

/** Groups raw lines into blocks so each can be rendered in one pass. */
function toBlocks(source: string): Block[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let current: Block | null = null;

  const flush = () => {
    if (current) blocks.push(current);
    current = null;
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === "") {
      flush();
      continue;
    }

    const heading = /^(#{1,4})\s+(.*)$/.exec(trimmed);
    if (heading) {
      flush();
      blocks.push({
        kind: "heading",
        level: heading[1].length,
        lines: [heading[2]],
      });
      continue;
    }

    if (/^---+$/.test(trimmed)) {
      flush();
      blocks.push({ kind: "rule", lines: [] });
      continue;
    }

    // A table needs a header row followed by a divider row.
    if (
      trimmed.startsWith("|") &&
      i + 1 < lines.length &&
      isTableDivider(lines[i + 1])
    ) {
      flush();
      const table: Block = { kind: "table", lines: [trimmed] };
      i += 1; // skip the divider

      while (i + 1 < lines.length && lines[i + 1].trim().startsWith("|")) {
        i += 1;
        table.lines.push(lines[i].trim());
      }

      blocks.push(table);
      continue;
    }

    if (trimmed.startsWith("> ")) {
      if (current?.kind !== "quote") {
        flush();
        current = { kind: "quote", lines: [] };
      }
      current.lines.push(trimmed.slice(2));
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      if (current?.kind !== "ul") {
        flush();
        current = { kind: "ul", lines: [] };
      }
      current.lines.push(trimmed.replace(/^[-*]\s+/, ""));
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      if (current?.kind !== "ol") {
        flush();
        current = { kind: "ol", lines: [] };
      }
      current.lines.push(trimmed.replace(/^\d+\.\s+/, ""));
      continue;
    }

    if (current?.kind !== "paragraph") {
      flush();
      current = { kind: "paragraph", lines: [] };
    }
    current.lines.push(trimmed);
  }

  flush();
  return blocks;
}

function renderTable(rows: string[]): string {
  const [headerRow, ...bodyRows] = rows;
  const headers = splitRow(headerRow)
    .map((cell) => `<th scope="col">${inline(cell)}</th>`)
    .join("");

  const body = bodyRows
    .map(
      (row) =>
        `<tr>${splitRow(row)
          .map((cell) => `<td>${inline(cell)}</td>`)
          .join("")}</tr>`
    )
    .join("");

  // Wrapped so a wide table scrolls inside its own box rather than pushing the
  // page sideways on a phone.
  return `<div class="table-scroll"><table><thead><tr>${headers}</tr></thead><tbody>${body}</tbody></table></div>`;
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Renders chapter markdown to HTML. */
export function renderChapter(source: string): string {
  // Mirrors `chapterOutline`, so the ids emitted here match the anchors the
  // contents list links to.
  const seen = new Map<string, number>();

  return toBlocks(source)
    .map((block) => {
      switch (block.kind) {
        case "heading": {
          // The chapter title is already rendered in the page header, so the
          // leading `#` becomes an h2 to keep one h1 per document.
          const level = Math.min((block.level ?? 1) + 1, 4);
          const raw = block.lines[0].trim();

          let anchor = "";
          if (block.level === 2 || block.level === 3) {
            const base = slugify(raw);
            const count = seen.get(base) ?? 0;
            seen.set(base, count + 1);
            anchor = ` id="${count === 0 ? base : `${base}-${count}`}"`;
          }

          return `<h${level}${anchor}>${inline(raw)}</h${level}>`;
        }
        case "paragraph":
          return `<p>${block.lines.map(inline).join(" ")}</p>`;
        case "ul":
          return `<ul>${block.lines.map((l) => `<li>${inline(l)}</li>`).join("")}</ul>`;
        case "ol":
          return `<ol>${block.lines.map((l) => `<li>${inline(l)}</li>`).join("")}</ol>`;
        case "quote":
          return `<blockquote><p>${block.lines.map(inline).join(" ")}</p></blockquote>`;
        case "table":
          return renderTable(block.lines);
        case "rule":
          return "<hr />";
      }
    })
    .join("\n");
}

/** Section headings in a chapter, for the in-page contents list. */
export function chapterOutline(
  source: string
): { id: string; title: string; level: number }[] {
  const outline: { id: string; title: string; level: number }[] = [];
  const seen = new Map<string, number>();

  for (const line of source.replace(/\r\n/g, "\n").split("\n")) {
    const match = /^(#{2,3})\s+(.*)$/.exec(line.trim());
    if (!match) continue;

    const title = match[2].trim();
    const base = slugify(title);

    // Two sections can share a title; suffix duplicates so ids stay unique.
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);

    outline.push({
      id: count === 0 ? base : `${base}-${count}`,
      title,
      level: match[1].length,
    });
  }

  return outline;
}
