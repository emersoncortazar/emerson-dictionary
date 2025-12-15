import { useState, useMemo } from "react";
import { ResultsDisplay } from "./components/ResultsDisplay";
import type { UncommonWord } from "./types";

// Import dictionary data directly from the local file
// NOTE: If this import fails, run the Python script to generate the file!
import dictionaryData from "./emerson_dictionary.json";

export default function App() {
  const [fileName] = useState("My Dictionary");

  // Convert the dictionary object { word: { ...details } } 
  // into the array format the UI expects [ { word, ...details } ]
  const results: UncommonWord[] = useMemo(() => {
    return Object.entries(dictionaryData).map(([word, details]: [string, any]) => ({
      word: word,
      definition: details.definition || "No definition available",
      exampleFromText: details.example || "No example available",
    }));
  }, []);

  const onReset = () => {
    // Placeholder for future reset logic
    console.log("Reset clicked");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-amber-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-purple-900 mb-6">
          Emerson&apos;s Dictionary
        </h1>

        <ResultsDisplay results={results} fileName={fileName} onReset={onReset} />
      </div>
    </div>
  );
}