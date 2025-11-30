from __future__ import annotations

"""
Emerson's Dictionary — PDF vocabulary miner.

This code helps you build a personal vocabulary dictionary:
  - Extracts text from a PDF
  - Cleans common PDF artifacts
  - Finds rare-but-real English words you don't already have in emerson_dictionary.json
  - Asks you interactively whether to add each word to "Emerson's Dictionary"
"""

import argparse
import json
import re
from collections import Counter
from pathlib import Path
from typing import Dict, Any, List, Optional

import pdfplumber
import nltk
from nltk.corpus import wordnet as wn
from wordfreq import zipf_frequency

# download WordNet data once
nltk.download("wordnet", quiet=True)
nltk.download("omw-1.4", quiet=True)

# project paths
PROJECT_ROOT = Path(__file__).resolve().parents[1]
DICT_PATH = PROJECT_ROOT / "data" / "emerson_dictionary.json"

# regex tokenizer: alphabetic words only
WORD_PATTERN = re.compile(r"[A-Za-z]+")



# Dictionary load & save
def load_emerson_dict(path: Path = DICT_PATH) -> Dict[str, Any]:
    """
    Load Emerson's Dictionary from disk
    Returns an empty dict if the file does not exist or is invalid
    """
    if not path.exists():
        return {}
    try:
        with path.open("r", encoding="utf-8") as f:
            data = json.load(f)
        if isinstance(data, dict):
            return data
        return {}
    except json.JSONDecodeError:
        # If the JSON is corrupted, start fresh
        return {}


def save_emerson_dict(dictionary: Dict[str, Any], path: Path = DICT_PATH) -> None:
    """
    Save Emerson's Dictionary to disk as printed JSON
    """
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(dictionary, f, indent=2, ensure_ascii=False)


# PDF text extraction and cleaning
def extract_text_from_pdf(pdf_path: Path) -> str:
    """
    Extract raw text from all pages of a PDF using pdfplumber
    """
    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF not found: {pdf_path}")

    text_chunks: List[str] = []
    with pdfplumber.open(str(pdf_path)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text() or ""
            text_chunks.append(page_text)

    return "\n".join(text_chunks)


def clean_pdf_text(raw: str) -> str:
    """
    Clean up common PDF artifacts before tokenization:
    - Join words broken by hyphens at line breaks
    - Normalize multiple spaces/tabs
    """
    # Fix hyphen + newline splits
    no_hyphen_breaks = re.sub(r"(\w+)-\s*\n\s*(\w+)", r"\1\2", raw)

    # Collapse repeated spaces/tabs (keep newlines)
    normalized = re.sub(r"[ \t]{2,}", " ", no_hyphen_breaks)

    return normalized


# Tokenization & candidate selection
def tokenize(text: str) -> List[str]:
    """
    Simple tokenizer that returns only alphabetic word tokens
    """
    return WORD_PATTERN.findall(text)


def is_candidate_word(
    word: str,
    emerson_dict: Dict[str, Any],
    freq_threshold: float = 3.5,
) -> bool:
    """
    Decide if a word is a candidate for learning

    Criteria:
      - minimum length
      - not already in Emerson's Dictionary
      - ignore ALL CAPS (likely acronyms)
      - must exist in WordNet
      - must have a *reasonable* global frequency:
          - not 0 (completely unseen)
          - not too low (likely garbage OCR)
          - not too high (too common to be interesting)
    """
    w = word.lower()

    # Too short to be interesting
    if len(w) <= 3:
        return False

    # You already know it
    if w in emerson_dict:
        return False

    # Likely acronym
    if word.isupper():
        return False

    # Must be a real English word in WordNet
    if not wn.synsets(w):
        return False

    # Use global frequency estimates
    freq = zipf_frequency(w, "en")

    # Ignore things unseen in corpora
    if freq == 0.0:
        return False

    # Tune these bounds
    min_freq = 1.5   # too low → probably garbage or hyper-rare
    max_freq = freq_threshold  # too high

    if not (min_freq <= freq <= max_freq):
        return False

    return True


def get_candidate_words(
    text: str,
    emerson_dict: Dict[str, Any],
    max_words: int = 100,
    freq_threshold: float = 3.5,
) -> List[str]:
    """
    From cleaned text, return a ranked list of candidate vocabulary words

    Ranking:
      1. Rarer global frequency (lower Zipf frequency first)
      2. Higher count in the document
    """
    tokens = tokenize(text)
    counts: Counter[str] = Counter(w.lower() for w in tokens)

    candidates: List[tuple[str, int, float]] = []

    for word, count in counts.items():
        if is_candidate_word(word, emerson_dict, freq_threshold=freq_threshold):
            freq = zipf_frequency(word, "en")
            candidates.append((word, count, freq))

    # Sort by (rarity, -document_frequency)
    candidates.sort(key=lambda x: (x[2], -x[1]))

    return [w for (w, _count, _freq) in candidates[:max_words]]


# Definitions and example sentences
def get_definition(word: str) -> Optional[str]:
    """
    Look up the first WordNet definition for a word.
    Returns None if no definition is found.
    """
    synsets = wn.synsets(word)
    if not synsets:
        return None
    return synsets[0].definition()


def find_example_sentence(
    text: str,
    word: str,
    max_len: int = 220,
) -> Optional[str]:
    """
    Find a sentence from the original text that contains the given word
    Returns a truncated version if too long
    """
    pattern = re.compile(
        r"[^.?!]*\b" + re.escape(word) + r"\b[^.?!]*[.?!]",
        re.IGNORECASE,
    )
    match = pattern.search(text)
    if not match:
        return None

    sentence = match.group(0).strip()
    if len(sentence) > max_len:
        sentence = sentence[: max_len - 3] + "..."
    return sentence


# Interactive CLI flow
def review_candidates_interactively(
    pdf_path: Path,
    max_words: int = 50,
    freq_threshold: float = 3.5,
) -> None:
    """
    Main interactive loop:
      - load dictionary
      - extract + clean text from PDF
      - find candidate words
      - for each word: show definition + example, ask to add/skip/quit
    """
    print(f"Loading Emerson's Dictionary from: {DICT_PATH}")
    emerson_dict = load_emerson_dict()

    print(f"\nExtracting text from: {pdf_path}")
    raw_text = extract_text_from_pdf(pdf_path)
    text = clean_pdf_text(raw_text)

    print("\nFinding candidate vocabulary words...")
    candidates = get_candidate_words(
        text,
        emerson_dict,
        max_words=max_words,
        freq_threshold=freq_threshold,
    )

    if not candidates:
        print("No new candidate words found with current settings.")
        return

    print(f"Found {len(candidates)} candidate words.\n")

    for word in candidates:
        definition = get_definition(word)
        example = find_example_sentence(text, word)

        print("=" * 60)
        print(f"Word: {word}")
        print(f"Definition: {definition or '[no WordNet definition found]'}")
        print(f"Example: {example or '[no example sentence found]'}")
        print()
        choice = input(
            "Add to Emerson's Dictionary? [y]es / [n]o / [q]uit: "
        ).strip().lower()

        if choice == "q":
            print("Quitting review.")
            break

        if choice == "y":
            emerson_dict[word] = {
                "definition": definition,
                "example": example,
                "source_pdf": str(pdf_path),
            }
            print(f"✅ Added '{word}' to Emerson's Dictionary.\n")
        else:
            print("⏭️ Skipped.\n")

    print("\nSaving Emerson's Dictionary...")
    save_emerson_dict(emerson_dict)
    print("Done. 📘")


# CLI entry point
def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Mine vocabulary from a PDF into Emerson's Dictionary."
    )
    parser.add_argument(
        "pdf_path",
        help="Path to the PDF file (e.g., book).",
    )
    parser.add_argument(
        "--max-words",
        type=int,
        default=50,
        help="Maximum number of candidate words to review (default: 50).",
    )
    parser.add_argument(
        "--freq-threshold",
        type=float,
        default=3.5,
        help=(
            "Upper Zipf frequency threshold for rarity (lower = rarer, default: 3.5). "
            "Try 4.0 for slightly easier words, 3.0 for harder words."
        ),
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    pdf_path = Path(args.pdf_path)
    review_candidates_interactively(
        pdf_path=pdf_path,
        max_words=args.max_words,
        freq_threshold=args.freq_threshold,
    )


if __name__ == "__main__":
    main()
