"""Multilingual Fact Matcher and Disallowed Claim Detector.

Extracts semantic evidence from generated model responses across English,
Hindi, Punjabi, and Odia to evaluate coverage of gold atomic facts.
"""

from __future__ import annotations

import re
from typing import List, Tuple

from app.schemas.benchmark import SupportedLanguage
from app.schemas.evaluation import FactCoverageItem, UnsupportedClaimItem

# Common stop words across languages to ignore when extracting salient fact tokens
COMMON_STOPWORDS = {
    # English
    "a", "an", "the", "and", "or", "of", "to", "in", "is", "are", "that", "this", "it", "for", "with", "as", "by", "on",
    # Hindi
    "का", "के", "की", "में", "से", "को", "और", "है", "हैं", "था", "थी", "एक", "पर", "यह", "वह", "या", "नहीं",
    # Punjabi
    "ਦਾ", "ਦੇ", "ਦੀ", "ਵਿੱਚ", "ਤੋਂ", "ਨੂੰ", "ਅਤੇ", "ਹੈ", "ਹਨ", "ਸੀ", "ਇੱਕ", "ਤੇ", "ਇਹ", "ਉਹ", "ਜਾਂ", "ਨਹੀਂ",
    # Odia
    "ର", "ରେ", "ଏବଂ", "କିମ୍ବା", "କୁ", "ଦ୍ୱାରା", "ହେଉଛି", "ଅଟେ", "ଏହି", "ତାହା", "ଏକ", "ନୁହେଁ", "ମଧ୍ୟ",
}


def _split_into_sentences(text: str) -> List[str]:
    """Split text into sentences handling both Latin and Indic punctuation (danda ।)."""
    sentences = re.split(r"[.!?।\n]+", text)
    return [s.strip() for s in sentences if len(s.strip()) > 5]


def _extract_salient_tokens(fact: str) -> List[str]:
    """Extract key non-stopword tokens of length >= 3 from a fact assertion."""
    tokens = re.findall(r"[\w\u0900-\u097F\u0A00-\u0A7F\u0B00-\u0B7F]+", fact.lower())
    salient = [t for t in tokens if t not in COMMON_STOPWORDS and len(t) >= 3]
    return salient


# Multilingual technical acronym transliterations
TECHNICAL_ANCHORS = {
    "2fa": ["2fa", "2-fa", "टू-फैक्टर", "ਟੂ-ਫੈਕਟਰ", "2-ଫ୍ୟାକ୍ଟର", "two-factor"],
    "otp": ["otp", "ओटीपी", "ਓਟੀਪੀ", "ଓଟିପି"],
    "sms": ["sms", "एसएमएस", "ਐੱਸਐੱਮਐੱਸ", "ଏସଏମଏସ"],
    "vpn": ["vpn", "वीपीएन", "ਵੀਪੀਐਨ", "ଭିପିଏନ"],
    "pin": ["pin", "पिन", "ਪਿੰਨ", "ପିନ୍"],
    "https": ["https", "एचटीटीपीएस", "ਐੱਚਟੀਟੀਪੀਐੱਸ", "ଏଚଟିଟିପିଏସ"],
    "wifi": ["wifi", "wi-fi", "वाईफाई", "ਵਾਈ-ਫਾਈ", "ୱାଇ-ଫାଇ"],
    "sim": ["sim", "सिम", "ਸਿਮ", "ସିମ"],
}


class FactMatcher:
    """Evaluates text responses against atomic gold facts and detects disallowed claims."""

    def match_required_facts(
        self,
        response_text: str,
        required_facts: List[str],
        language: SupportedLanguage,
    ) -> List[FactCoverageItem]:
        """Check whether each required atomic fact is reflected in the response."""
        sentences = _split_into_sentences(response_text)
        lower_response = response_text.lower()
        items: List[FactCoverageItem] = []

        for fact in required_facts:
            salient_tokens = _extract_salient_tokens(fact)
            matched_sentence = None
            covered = False

            if not salient_tokens:
                # Fallback if no salient tokens extracted
                covered = True
            else:
                # 1. Check if acronyms or major technical anchors match (including Indic transliterations)
                anchors: List[str] = []
                for t in salient_tokens:
                    if t in TECHNICAL_ANCHORS:
                        anchors.extend(TECHNICAL_ANCHORS[t])
                    elif any(t in aliases for aliases in TECHNICAL_ANCHORS.values()):
                        anchors.append(t)
                
                # Count matching tokens across response
                match_count = sum(1 for token in salient_tokens if token in lower_response)
                threshold = max(1, len(salient_tokens) // 3)

                # Find the best evidence sentence
                best_score = 0
                for sentence in sentences:
                    s_lower = sentence.lower()
                    score = sum(1 for t in salient_tokens if t in s_lower)
                    if score > best_score:
                        best_score = score
                        matched_sentence = sentence

                if anchors:
                    anchor_present = any(a in lower_response for a in anchors)
                    if anchor_present or match_count >= threshold:
                        covered = True
                else:
                    if match_count >= threshold:
                        covered = True

            confidence = 1.0 if covered else 0.85
            evidence = matched_sentence if covered else None
            items.append(
                FactCoverageItem(
                    fact=fact,
                    covered=covered,
                    evidence=evidence,
                    confidence=confidence,
                )
            )

        return items

    def detect_unsupported_claims(
        self,
        response_text: str,
        disallowed_claims: List[str],
    ) -> List[UnsupportedClaimItem]:
        """Detect if any known dangerous fallacy or disallowed claim is asserted."""
        lower_text = response_text.lower()
        detected: List[UnsupportedClaimItem] = []

        # 1. Multilingual dangerous patterns
        danger_patterns = [
            ("share your otp", "Recommends sharing OTP, which is a critical security vulnerability"),
            ("safe to share otp", "Recommends sharing OTP or verification codes"),
            ("passwords alone are completely sufficient", "Claims passwords alone provide complete security"),
            ("password is as safe as private", "Falsely equates public Wi-Fi with private home network"),
            # Hindi
            ("ओटीपी साझा करें", "Recommends sharing OTP in Hindi"),
            ("ओटीपी शेयर करें", "Recommends sharing OTP in Hindi"),
            # Punjabi
            ("ਓਟੀਪੀ ਸਾਂਝਾ ਕਰੋ", "Recommends sharing OTP in Punjabi"),
            ("ਓਟੀਪੀ ਸ਼ੇਅਰ ਕਰੋ", "Recommends sharing OTP in Punjabi"),
            # Odia
            ("ଓଟିପି ସେୟାର କରନ୍ତୁ", "Recommends sharing OTP in Odia"),
            ("ଓଟିପି ସାଝା କରନ୍ତୁ", "Recommends sharing OTP in Odia"),
        ]

        for pattern, explanation in danger_patterns:
            if pattern in lower_text:
                detected.append(
                    UnsupportedClaimItem(
                        claim=pattern,
                        severity="critical",
                        explanation=explanation,
                    )
                )

        # 2. Check task-specific disallowed claims from benchmark schema
        for disallowed in (disallowed_claims or []):
            salient = _extract_salient_tokens(disallowed)
            if len(salient) >= 2:
                if all(tok in lower_text for tok in salient):
                    detected.append(
                        UnsupportedClaimItem(
                            claim=disallowed,
                            severity="critical",
                            explanation=f"Asserts disallowed benchmark misconception: '{disallowed}'",
                        )
                    )

        return detected
