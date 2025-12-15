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

const LOCAL_STORAGE_KEY = "emerson_user_dictionary_v1";

function normalizeWord(word: string): string {
  return word.trim().toLowerCase();
}

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

function loadUserDictionary(): Record<string, string> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string>;
    if (!parsed || typeof parsed !== "object") return {};

    const cleaned: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed)) {
      const nk = normalizeWord(k);
      const nv = (v ?? "").toString().trim();
      if (nk && nv) cleaned[nk] = nv;
    }
    return cleaned;
  } catch {
    return {};
  }
}

function saveUserDictionary(dict: Record<string, string>) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dict));
}

export default function App() {
  const [mode, setMode] = useState<"upload" | "results">("upload");
  const [fileName, setFileName] = useState<string>("");
  const [uploadedText, setUploadedText] = useState<string>("");

  // user-editable dictionary stored in localStorage
  const [userDict, setUserDict] = useState<Record<string, string>>(() => loadUserDictionary());

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // bundled dictionary (read-only)
  const baseDictMap = useMemo(() => {
    const raw = dictionaryData as Record<string, DictEntry>;
    const m = new Map<string, string>();
    for (const [word, entry] of Object.entries(raw)) {
      const key = normalizeWord(word);
      const def = (entry?.definition ?? "").toString().trim();
      if (key && def) m.set(key, def);
    }
    return m;
  }, []);

  // merged dictionary: user overrides base
  const combinedDictMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const [k, v] of baseDictMap.entries()) m.set(k, v);
    for (const [k, v] of Object.entries(userDict)) m.set(normalizeWord(k), v);
    return m;
  }, [baseDictMap, userDict]);

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
        if (ca !== cb) return ca - cb; // rarer first
        if (wa.length !== wb.length) return wb.length - wa.length; // longer first
        return wa.localeCompare(wb);
      })
      .slice(0, 75);

    return candidates.map(([word]) => {
      const key = normalizeWord(word);
      const def = combinedDictMap.get(key) ?? "Not in your dictionary yet.";
      return {
        word,
        definition: def,
        exampleFromText: extractExampleSentence(uploadedText, word),
      };
    });
  }, [uploadedText, combinedDictMap]);

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

  function upsertUserDefinition(word: string, definition: string) {
    const w = normalizeWord(word);
    const d = definition.trim();
    if (!w || !d) return;

    setUserDict((prev) => {
      const next = { ...prev, [w]: d };
      saveUserDictionary(next);
      return next;
    });
  }

  function removeUserWord(word: string) {
    const w = normalizeWord(word);
    if (!w) return;

    setUserDict((prev) => {
      const next = { ...prev };
      delete next[w];
      saveUserDictionary(next);
      return next;
    });
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-50 via-white to-amber-50 px-6 py-6">
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
          <ResultsDisplay
            results={results}
            fileName={fileName || "Uploaded Text"}
            onReset={onReset}
            userDictionary={userDict}
            onSaveDefinition={upsertUserDefinition}
            onRemoveUserWord={removeUserWord}
          />
        )}
      </div>
    </div>
  );
}
