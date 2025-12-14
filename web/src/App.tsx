import { useState } from "react";
import { ResultsDisplay } from "./components/ResultsDisplay";

import type { UncommonWord } from "./types";


const sampleResults: UncommonWord[] = [
  {
    word: "rutty",
    definition: "full of ruts",
    exampleFromText: "The boys walked down the dark rutty road.",
  },
  {
    word: "lugubrious",
    definition: "excessively mournful",
    exampleFromText: "He spoke in a lugubrious tone.",
  },
];

export default function App() {
  const [fileName, setFileName] = useState("east_of_eden.pdf");
  const [results, setResults] = useState<UncommonWord[]>(sampleResults);

  const onReset = () => {
    // later: clear state and return to upload screen
    setFileName("another_book.pdf");
    setResults(sampleResults);
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
