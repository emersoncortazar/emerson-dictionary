import { useMemo, useState } from "react";
import type { UncommonWord } from "../types";
import {
  BookOpen,
  RotateCcw,
  FileText,
  Quote,
  Sparkles,
  Award,
  Plus,
  Save,
  X,
  Trash2,
  LibraryBig,
} from "lucide-react";

interface ResultsDisplayProps {
  results: UncommonWord[];
  fileName: string;
  onReset: () => void;

  // Personal dictionary (localStorage-backed)
  userDictionary: Record<string, string>;
  onSaveDefinition: (word: string, definition: string) => void;
  onRemoveUserWord: (word: string) => void;
}

export function ResultsDisplay({
  results,
  fileName,
  onReset,
  userDictionary,
  onSaveDefinition,
  onRemoveUserWord,
}: ResultsDisplayProps) {
  const [showDictionary, setShowDictionary] = useState(false);

  // Inline editor for a specific result card
  const [editingWord, setEditingWord] = useState<string | null>(null);
  const [editingDef, setEditingDef] = useState<string>("");

  // Manual add form
  const [newWord, setNewWord] = useState("");
  const [newDef, setNewDef] = useState("");

  const sortedUserWords = useMemo(() => {
    return Object.keys(userDictionary).sort((a, b) => a.localeCompare(b));
  }, [userDictionary]);

  function startEdit(word: string, existingDefinition?: string) {
    setEditingWord(word);
    setEditingDef(existingDefinition ?? "");
  }

  function cancelEdit() {
    setEditingWord(null);
    setEditingDef("");
  }

  function saveEdit() {
    if (!editingWord) return;
    const w = editingWord.trim();
    const d = editingDef.trim();
    if (!w || !d) return;
    onSaveDefinition(w, d);
    cancelEdit();
  }

  function saveManual() {
    const w = newWord.trim();
    const d = newDef.trim();
    if (!w || !d) return;
    onSaveDefinition(w, d);
    setNewWord("");
    setNewDef("");
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-5 border-b-2 border-purple-400">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-purple-200 to-amber-200 p-3 rounded-xl border-2 border-purple-400">
            <FileText className="w-6 h-6 text-purple-900" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-purple-700 text-sm italic">Analysis complete for:</p>
            <h2 className="text-purple-900">{fileName}</h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDictionary((v) => !v)}
            className="flex items-center gap-2 px-5 py-3 text-purple-900 bg-white hover:bg-purple-50 rounded-xl border-2 border-purple-300 shadow-md hover:shadow-lg transition-all"
            title="Open your personal dictionary"
          >
            <LibraryBig className="w-5 h-5" />
            My Dictionary
          </button>

          <button
            onClick={onReset}
            className="flex items-center gap-2 px-5 py-3 text-purple-900 bg-gradient-to-r from-purple-100 to-amber-100 hover:from-purple-200 hover:to-amber-200 rounded-xl border-2 border-purple-400 shadow-md hover:shadow-lg transition-all"
          >
            <RotateCcw className="w-5 h-5" />
            Analyze Another
          </button>
        </div>
      </div>

      {/* Dictionary panel */}
      {showDictionary && (
        <div className="mb-8 rounded-2xl border-2 border-purple-300 bg-white shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-purple-900 text-xl font-semibold flex items-center gap-2">
              <LibraryBig className="w-5 h-5" />
              Your Personal Dictionary (saved in this browser)
            </h3>

            <button
              onClick={() => setShowDictionary(false)}
              className="px-3 py-2 rounded-lg border-2 border-purple-200 hover:bg-purple-50 text-purple-900"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Manual add */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
            <input
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              placeholder="Word (e.g., crepuscular)"
              className="px-4 py-3 rounded-xl border-2 border-purple-200 focus:outline-none focus:border-purple-400"
            />
            <input
              value={newDef}
              onChange={(e) => setNewDef(e.target.value)}
              placeholder="Definition (your wording)"
              className="px-4 py-3 rounded-xl border-2 border-purple-200 focus:outline-none focus:border-purple-400 md:col-span-2"
            />
            <button
              onClick={saveManual}
              className="md:col-span-3 flex items-center justify-center gap-2 px-5 py-3 rounded-xl border-2 border-purple-400 bg-gradient-to-r from-purple-100 to-amber-100 hover:from-purple-200 hover:to-amber-200 text-purple-900 shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              Add to My Dictionary
            </button>
          </div>

          {/* List */}
          <div className="max-h-72 overflow-auto rounded-xl border border-purple-100">
            {sortedUserWords.length === 0 ? (
              <div className="p-4 text-purple-700 italic">
                No saved words yet. Add a word above, or save definitions directly from results.
              </div>
            ) : (
              <ul className="divide-y divide-purple-100">
                {sortedUserWords.map((w) => (
                  <li key={w} className="p-4 flex items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold text-purple-900">{w}</div>
                      <div className="text-purple-700">{userDictionary[w]}</div>
                    </div>
                    <button
                      onClick={() => onRemoveUserWord(w)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-red-200 hover:bg-red-50 text-red-700"
                      title="Remove from your personal dictionary"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <p className="text-purple-600 text-sm mt-3">
            Note: this is stored in your browser’s localStorage, so it persists across refreshes on this device/browser.
          </p>
        </div>
      )}

      {/* Results Summary */}
      <div className="flex items-center gap-4 mb-8 p-6 bg-gradient-to-r from-purple-100 to-amber-50 rounded-2xl border-2 border-purple-300 shadow-md">
        <div className="bg-white p-3 rounded-xl border-2 border-purple-200">
          <Award className="w-7 h-7 text-purple-700" />
        </div>
        <div>
          <h3 className="text-purple-900 font-semibold text-lg">
            Discovered <span className="text-amber-600">{results.length}</span> uncommon words worthy of study
          </h3>
        </div>
      </div>

      {/* Word Cards */}
      <div className="space-y-8">
        {results.map(({ word, definition, exampleFromText }) => {
          const isEditingThis = editingWord?.toLowerCase() === word.toLowerCase();
          const isMissingDef = definition === "Not in your dictionary yet.";

          return (
            <div
              key={word}
              className="bg-white rounded-2xl border-2 border-purple-300 shadow-lg overflow-hidden"
            >
              {/* Top accent bar */}
              <div className="h-2 bg-gradient-to-r from-purple-600 to-amber-500" />

              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-gradient-to-br from-purple-100 to-amber-100 p-4 rounded-xl border-2 border-purple-200 shadow-sm">
                      <BookOpen className="w-7 h-7 text-purple-900" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xl font-semibold text-purple-900 italic">
                          {word}
                        </h4>
                        <Sparkles className="w-5 h-5 text-amber-500" />
                      </div>

                      {/* Definition */}
                      {!isEditingThis ? (
                        <p className={`mt-1 ${isMissingDef ? "text-purple-500 italic" : "text-purple-700"}`}>
                          {definition}
                        </p>
                      ) : (
                        <div className="mt-3 space-y-3">
                          <input
                            value={editingDef}
                            onChange={(e) => setEditingDef(e.target.value)}
                            placeholder="Type a definition..."
                            className="w-full px-4 py-3 rounded-xl border-2 border-purple-200 focus:outline-none focus:border-purple-400"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              onClick={saveEdit}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-purple-400 bg-gradient-to-r from-purple-100 to-amber-100 hover:from-purple-200 hover:to-amber-200 text-purple-900"
                            >
                              <Save className="w-4 h-4" />
                              Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-purple-200 hover:bg-purple-50 text-purple-900"
                            >
                              <X className="w-4 h-4" />
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {!isEditingThis && (
                    <button
                      onClick={() => startEdit(word, isMissingDef ? "" : definition)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-purple-200 hover:bg-purple-50 text-purple-900"
                      title="Save a definition in your personal dictionary"
                    >
                      <Plus className="w-4 h-4" />
                      {isMissingDef ? "Add definition" : "Edit definition"}
                    </button>
                  )}
                </div>

                {/* Example */}
                <div className="mt-6 bg-gradient-to-r from-purple-50 to-amber-50 p-5 rounded-xl border border-purple-100">
                  <div className="flex items-center gap-2 text-purple-700 italic mb-3">
                    <Quote className="w-4 h-4" />
                    <span>Example from your text:</span>
                  </div>

                  <div className="bg-white rounded-xl border-2 border-purple-200 p-4 shadow-sm">
                    <p className="text-purple-900 italic">&quot;{exampleFromText}&quot;</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom decorative element */}
      <div className="mt-10 text-center">
        <div className="inline-flex items-center gap-2 text-purple-700">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-amber-500"></div>
          <Sparkles className="w-5 h-5 text-amber-500" />
          <span className="text-sm italic">End of Analysis</span>
          <Sparkles className="w-5 h-5 text-amber-500" />
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-amber-500"></div>
        </div>
      </div>
    </div>
  );
}
