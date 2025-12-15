import { useMemo, useRef, useState } from "react";
import { ResultsDisplay } from "./components/ResultsDisplay";
import type { UncommonWord } from "./types";
import dictionaryData from "./emerson_dictionary.json";

type DictEntry = {
  definition?: string;
};

const STOPWORDS = new Set([
  "a","an","and","are","as","at","be","been","but","by","can","could","did","do","does",
  "for","from","had","has","have","he","her","hers","him","his","how","i","if","in","into",
  "is","it","its","just","like","may","me","might","more","most","my","no","not","of","on",
  "one","or","our","out","said","she","should","so","some","than","that","the","their","them",
  "then","there","these","they","this","to","too","up","us","was","we","were","what","when",
  "where","which","who","will","with","would","you","your"
]);

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function tokenize(text: string): string[] {
  return text.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) ?? [];
}

function extractExampleSentence(text: string, word: string): string {
  const lower = text.toLowerCase();
  const w = word.toLowerCase();

  const idx = lower.search(new RegExp(`\\b${escapeRegExp(w)}\\b`, "i"));
  if (idx === -1) return "No example found in your text.";

  let start = idx;
  while (start > 0) {
    const ch = text[start - 1];
    if (ch === "." || ch === "!" || ch === "?" || ch === "\n") break;
    start--;
  }

  let end = idx;
  while (end < text.length) {
    const ch = text[end];
    if (ch === "." || ch === "!" || ch === "?" || ch === "\n") {
      end++;
      break;
    }
    end++;
  }

  const sentence = text.slice(start, end).trim();
  return sentence.length > 0 ? sentence : "No example found in your text.";
}

export default function App() {
  const [mode, setMode] = useState<"upload" | "results">("upload");
  const [fileName, setFileName] = useState<string>("");
  const [uploadedText, setUploadedText] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const dictMap = useMemo(() => {
    const raw = dictionaryData as Record<string, DictEntry>;
    const m = new Map<string, string>();
    for (const [word, entry] of Object.entries(raw)) {
      m.set(word.toLowerCase(), entry.definition || "No definition available");
    }
    return m;
  }, []);

  const results: UncommonWord[] = useMemo(() => {
    if (!uploadedText) return [];

    const tokens = tokenize(uploadedText);
    const counts = new Map<string, number>();
    for (const t of tokens) counts.set(t, (counts.get(t) ?? 0) + 1);

    const candidates = [...counts.entries()]
      .filter(([w]) => {
        if (STOPWORDS.has(w)) return false;
        if (w.length < 8) return false;
        return true;
      })
      .sort((a, b) => {
        const [wa, ca] = a;
        const [wb, cb] = b;
        if (ca !== cb) return ca - cb;
        if (wa.length !== wb.length) return wb.length - wa.length;
        return wa.localeCompare(wb);
      })
      .slice(0, 75);

    return candidates.map(([word]) => {
      const def = dictMap.get(word.toLowerCase()) ?? "Not in your dictionary yet.";
      return {
        word,
        definition: def,
        exampleFromText: extractExampleSentence(uploadedText, word),
      };
    });
  }, [uploadedText, dictMap]);

  async function handleFile(file: File) {
    const text = await file.text();
    setUploadedText(text);
    setFileName(file.name);
    setMode("results");
  }

  function onReset() {
    setUploadedText("");
    setFileName("");
    setMode("upload");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".txt")) {
      alert("Please drop a .txt file.");
      return;
    }

    void handleFile(file);
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-50 via-white to-amber-50 px-6 py-6">
      {/* Full-width wrapper; centered content that can expand */}
      <div className="w-full max-w-6xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-purple-900 mb-8">
          Emerson&apos;s Dictionary
        </h1>

        {mode === "upload" ? (
          <div className="w-full rounded-2xl bg-white shadow-lg p-8 border-2 border-purple-300">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              className="w-full rounded-2xl border-2 border-dashed border-purple-300 p-10 bg-gradient-to-br from-purple-50 to-amber-50"
            >
              <p className="text-purple-900 text-xl font-semibold mb-2">
                Drag &amp; drop a .txt file to analyze
              </p>
              <p className="text-purple-700 mb-6">
                Or click below to choose a file.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".txt"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleFile(f);
                }}
              />

              <button
                className="px-5 py-3 text-purple-900 bg-gradient-to-r from-purple-100 to-amber-100 hover:from-purple-200 hover:to-amber-200 rounded-xl border-2 border-purple-400 shadow-md hover:shadow-lg transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose a file
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full">
            <ResultsDisplay
              results={results}
              fileName={fileName || "Uploaded Text"}
              onReset={onReset}
            />
          </div>
        )}
      </div>
    </div>
  );
}
