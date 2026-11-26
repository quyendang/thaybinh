"""Short part-of-speech labels for the share table.

Same rules as the FastENG iOS app and the web manager (TBENGLISH).

Display only: the stored `words.type` value is never rewritten.
"""

# iOS String.shortestWordType: whole labels.
SHORT = {
    "noun": "n",
    "verb": "v",
    "adjective": "adj",
    "adverb": "adv",
    "pronoun": "pron",
    "preposition": "prep",
    "conjunction": "conj",
    "interjection": "interj",
    "article": "art",
    "determiner": "det",
    "numeral": "num",
    "abbreviation": "abbr",
    "linking verb": "link.v",
    "phrase": "phr",
    "verb phrase": "v phr",
    "phrase verb": "phr v",
}
# Words inside long multi-word labels the AI writes
# ("prepositional phrase", "interrogative determiner").
WORD = {
    "prepositional": "pre",
    "phrasal": "phr",
    "interrogative": "interrog",
    "auxiliary": "aux",
    "possessive": "poss",
    "demonstrative": "dem",
    "relative": "rel",
    "personal": "pers",
    "reflexive": "refl",
    "indefinite": "indef",
    "definite": "def",
    "compound": "comp",
    "comparative": "compar",
    "superlative": "superl",
    "countable": "count",
    "uncountable": "uncount",
    "plural": "pl",
    "singular": "sg",
    "transitive": "tr",
    "intransitive": "intr",
    "proper": "prop",
    "ordinal": "ord",
    "cardinal": "card",
    "quantifier": "quant",
    "expression": "expr",
    "collocation": "colloc",
    "idiomatic": "idiom",
    "adverbial": "adv",
    "adjectival": "adj",
    "nominal": "nom",
    "subordinating": "sub",
    "coordinating": "coord",
    "correlative": "correl",
    "conditional": "cond",
    "exclamation": "excl",
    "emphatic": "emph",
    "gerund": "ger",
    "participle": "part",
    "infinitive": "inf",
}


def _abbr(label: str) -> str:
    k = label.lower()
    if k in SHORT:
        return SHORT[k]
    if " " not in k:
        return k
    # ponytail: unknown long words fall back to their first 4 letters;
    # add them to WORD when one reads badly.
    words = k.split()
    return " ".join(
        SHORT.get(w) or WORD.get(w) or (w[:4] if len(w) > 6 else w) for w in words
    )


def short_type(value: str | None) -> str:
    """ "noun, verb" -> "n | v"; empty stays empty."""
    if not value or not value.strip():
        return ""
    return " | ".join(_abbr(t.strip()) for t in value.split(","))
