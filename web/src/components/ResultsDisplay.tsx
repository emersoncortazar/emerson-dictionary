import type { UncommonWord } from "../types";
import { BookOpen, RotateCcw, FileText, Quote, Sparkles, Award } from "lucide-react";

interface ResultsDisplayProps {
  results: UncommonWord[];
  fileName: string;
  onReset: () => void;
}

export function ResultsDisplay({ results, fileName, onReset }: ResultsDisplayProps) {
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
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-5 py-3 text-purple-900 bg-gradient-to-r from-purple-100 to-amber-100 hover:from-purple-200 hover:to-amber-200 rounded-xl border-2 border-purple-400 shadow-md hover:shadow-lg transition-all"
        >
          <RotateCcw className="w-5 h-5" />
          <span>Analyze Another</span>
        </button>
      </div>

      {/* Results Count */}
      <div className="bg-gradient-to-r from-purple-100 via-violet-100 to-amber-100 border-3 border-purple-400 rounded-xl p-6 mb-8 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 text-6xl opacity-10">🎓</div>
        <div className="relative flex items-center gap-3">
          <Award className="w-8 h-8 text-purple-800" strokeWidth={2.5} />
          <p className="text-purple-900 text-lg">
            Discovered <strong className="text-amber-700 text-xl">{results.length}</strong> uncommon words worthy of study
          </p>
        </div>
      </div>

      {/* Word Cards */}
      <div className="space-y-6">
        {results.map((item, index) => (
          <div
            key={index}
            className="border-3 border-purple-400 rounded-xl bg-gradient-to-br from-white to-purple-50/50 shadow-lg hover:shadow-xl transition-all overflow-hidden group"
          >
            {/* Card header stripe */}
            <div className="h-2 bg-gradient-to-r from-purple-600 via-violet-600 to-amber-500"></div>
            
            <div className="p-6">
              <div className="flex items-start gap-4 mb-5">
                <div className="bg-gradient-to-br from-purple-200 to-amber-200 p-3 rounded-xl border-2 border-purple-400 shadow-md mt-1 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-7 h-7 text-purple-900" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-amber-700 italic">{item.word}</h3>
                    <Sparkles className="w-5 h-5 text-amber-500" />
                  </div>
                  <p className="text-purple-900 leading-relaxed">{item.definition}</p>
                </div>
              </div>
              
              {/* Example from text */}
              <div className="mt-5 ml-14">
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-600 to-amber-500 rounded-full"></div>
                  <div className="pl-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Quote className="w-5 h-5 text-purple-700" strokeWidth={2.5} />
                      <p className="text-sm text-purple-700 italic">Example from your text:</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-amber-50/50 p-5 rounded-lg border-2 border-purple-300 shadow-inner">
                      <p className="text-purple-900 italic leading-relaxed">
                        "{item.exampleFromText}"
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
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