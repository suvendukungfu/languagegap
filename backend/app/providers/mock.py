"""Deterministic Mock Provider for Testing and Offline Demonstrations.

Supplies pre-recorded, realistic multilingual responses across English,
Hindi, Punjabi, and Odia without requiring an active inference server
or network connectivity.
"""

from __future__ import annotations

import asyncio
from typing import Dict, Optional

from app.providers.base import BaseModelProvider, ProviderResponseValidationError
from app.schemas.provider import (
    GenerationResult,
    ProviderMetadata,
    SamplingParams,
    TokenUsage,
)

# Canonical multilingual mock responses for digital literacy tasks
FIXTURE_RESPONSES: Dict[str, str] = {
    # English responses
    "DL-01-SEC-2FA:en": (
        "Two-factor authentication (2FA) significantly strengthens account security by requiring two distinct "
        "evidence items before granting access: something you know (your password) and something you possess "
        "(such as a time-based code from an authenticator app or a hardware security key). A password alone is "
        "vulnerable to data breaches, phishing, and credential stuffing. Using an authenticator app or FIDO security key "
        "is more secure than SMS-based verification because SMS can be intercepted or vulnerable to SIM-swap attacks. "
        "Never share OTPs with anyone, even if they claim to be support personnel."
    ),
    "DL-02-PRIV-PERMS:en": (
        "You should regularly inspect app permissions in your phone's Settings > Privacy menu. Grant access only "
        "to permissions that are strictly necessary for the app to function. Sensitive permissions like camera, "
        "microphone, location, and contacts should be configured to 'Allow only while using the app'. If an app like "
        "a flashlight or calculator demands access to your contacts or location, deny those permissions or uninstall the app."
    ),
    "DL-03-FRAUD-PHISH:en": (
        "Common red flags in phishing SMS messages include artificial urgency, threats of immediate account deactivation, "
        "suspicious shortened links (e.g., bit.ly or misspelled bank names), and requests to verify an OTP. Legitimate banks "
        "and financial institutions will never ask you to disclose your full password, PIN, or one-time password over SMS or chat. "
        "Always contact your bank through official customer care numbers or mobile banking apps directly."
    ),
    # Hindi responses
    "DL-01-SEC-2FA:hi": (
        "टू-फैक्टर ऑथेंटिकेशन (2FA) आपके ऑनलाइन खातों में सुरक्षा की एक अतिरिक्त परत जोड़ता है। इसमें केवल पासवर्ड (जो आप जानते हैं) "
        "ही नहीं, बल्कि आपके पास मौजूद डिवाइस (जैसे ऑथेंटिकेटर ऐप या सुरक्षा कुंजी) का सत्यापन कोड भी आवश्यक होता है। केवल पासवर्ड डेटा "
        "उल्लंघन या फ़िशिंग के कारण आसानी से लीक हो सकते हैं। ऑथेंटिकेटर ऐप (जैसे Google Authenticator) का उपयोग एसएमएस ओटीपी की तुलना "
        "में अधिक सुरक्षित है क्योंकि एसएमएस सिम-स्वैपिंग के प्रति संवेदनशील हो सकता है। अपना ओटीपी कभी किसी से साझा न करें।"
    ),
    "DL-02-PRIV-PERMS:hi": (
        "अपने स्मार्टफोन की ऐप अनुमतियों को नियंत्रित करने के लिए सेटिंग्स > गोपनीयता (Privacy) > अनुमति प्रबंधक में जाएं। ऐप्स को केवल वही "
        "अनुमतियां दें जो उनके मूल कार्य के लिए आवश्यक हों। कैमरा, माइक्रोफ़ोन और लोकेशन जैसी संवेदनशील अनुमतियों के लिए 'केवल ऐप का उपयोग "
        "करते समय अनुमति दें' चुनें। यदि कोई साधारण ऐप अनावश्यक व्यक्तिगत डेटा मांगता है, तो अनुमति अस्वीकार करें।"
    ),
    "DL-03-FRAUD-PHISH:hi": (
        "बैंक खाता बंद होने का दावा करने वाले फ़िशिंग संदेशों में अक्सर घबराहट और तत्काल कार्रवाई का दबाव बनाया जाता है। आधिकारिक बैंक कभी "
        "भी एसएमएस या मैसेजिंग ऐप पर आपका ओटीपी, पासवर्ड या पिन नहीं मांगते। किसी भी अनजान लिंक पर क्लिक करने से बचें और हमेशा बैंक की आधिकारिक "
        "वेबसाइट या ऐप के माध्यम से ही स्थिति की पुष्टि करें।"
    ),
    # Punjabi responses
    "DL-01-SEC-2FA:pa": (
        "ਦੋ-ਪੜਾਵੀ ਪ੍ਰਮਾਣਿਕਤਾ (2FA) ਤੁਹਾਡੇ ਔਨਲਾਈਨ ਖਾਤਿਆਂ ਲਈ ਸੁਰੱਖਿਆ ਦੀ ਇੱਕ ਮਹੱਤਵਪੂਰਨ ਵਾਧੂ ਪਰਤ ਪ੍ਰਦਾਨ ਕਰਦੀ ਹੈ। ਇਸ ਵਿੱਚ ਸਿਰਫ਼ ਪਾਸਵਰਡ ਹੀ ਨਹੀਂ, "
        "ਸਗੋਂ ਤੁਹਾਡੇ ਫ਼ੋਨ ਜਾਂ ਪ੍ਰਮਾਣਕ ਐਪ (Authenticator App) ਤੋਂ ਪ੍ਰਾਪਤ ਹੋਇਆ ਕੋਡ ਵੀ ਲਾਜ਼ਮੀ ਹੁੰਦਾ ਹੈ। ਸਿਰਫ਼ ਪਾਸਵਰਡ ਡਾਟਾ ਲੀਕ ਜਾਂ ਫਿਸ਼ਿੰਗ ਕਾਰਨ ਅਸੁਰੱਖਿਅਤ "
        "ਹੋ ਸਕਦੇ ਹਨ। ਪ੍ਰਮਾਣਕ ਐਪ ਦੀ ਵਰਤੋਂ ਐਸਐਮਐਸ ਓਟੀਪੀ ਨਾਲੋਂ ਬਿਹਤਰ ਹੈ ਕਿਉਂਕਿ ਐਸਐਮਐਸ ਨੂੰ ਸਿਮ-ਸਵੈਪਿੰਗ ਰਾਹੀਂ ਨੁਕਸਾਨ ਪਹੁੰਚਾਇਆ ਜਾ ਸਕਦਾ ਹੈ। ਆਪਣਾ ਓਟੀਪੀ ਕਦੇ ਕਿਸੇ ਨਾਲ ਸਾਂਝਾ ਨਾ ਕਰੋ।"
    ),
    "DL-02-PRIV-PERMS:pa": (
        "ਆਪਣੇ ਸਮਾਰਟਫੋਨ 'ਤੇ ਐਪ ਅਨੁਮਤੀਆਂ ਦੀ ਨਿਗਰਾਨੀ ਕਰਨ ਲਈ ਸੈਟਿੰਗਾਂ > ਗੋਪਨੀਯਤਾ (Privacy) ਵਿੱਚ ਜਾਓ। ਸਿਰਫ਼ ਉਹ ਅਨੁਮਤੀਆਂ ਦਿਓ ਜੋ ਐਪ ਦੇ ਕੰਮ ਕਰਨ ਲਈ ਜ਼ਰੂਰੀ ਹਨ। "
        "ਕੈਮਰਾ, ਮਾਈਕ੍ਰੋਫੋਨ ਅਤੇ ਲੋਕੇਸ਼ਨ ਵਰਗੀਆਂ ਸੰਵੇਦਨਸ਼ੀਲ ਅਨੁਮਤੀਆਂ ਲਈ 'ਕੇਵਲ ਐਪ ਵਰਤਣ ਦੌਰਾਨ' ਵਿਕਲਪ ਚੁਣੋ।"
    ),
    "DL-03-FRAUD-PHISH:pa": (
        "ਫਿਸ਼ਿੰਗ ਸੁਨੇਹਿਆਂ ਵਿੱਚ ਅਕਸਰ ਤੁਰੰਤ ਖਾਤਾ ਬੰਦ ਹੋਣ ਦਾ ਡਰ ਪੈਦਾ ਕੀਤਾ ਜਾਂਦਾ ਹੈ। ਕੋਈ ਵੀ ਅਧਿਕਾਰਤ ਬੈਂਕ ਕਦੇ ਵੀ ਐਸਐਮਐਸ ਜਾਂ ਕਾਲ ਰਾਹੀਂ ਤੁਹਾਡਾ ਓਟੀਪੀ, "
        "ਪਾਸਵਰਡ ਜਾਂ ਪਿੰਨ ਨਹੀਂ ਮੰਗਦਾ। ਸ਼ੱਕੀ ਲਿੰਕਾਂ 'ਤੇ ਕਲਿੱਕ ਨਾ ਕਰੋ ਅਤੇ ਬੈਂਕ ਦੀ ਅਧਿਕਾਰਤ ਹੈਲਪਲਾਈਨ 'ਤੇ ਸੰਪਰਕ ਕਰੋ।"
    ),
    # Odia responses
    "DL-01-SEC-2FA:or": (
        "ଟୁ-ଫ୍ୟାକ୍ଟର ଅଥେଣ୍ଟିକେସନ (2FA) ଆପଣଙ୍କ ଅନଲାଇନ୍ ଆକାଉଣ୍ଟ ପାଇଁ ଏକ ଦୃଢ଼ ସୁରକ୍ଷା ସ୍ତର ପ୍ରଦାନ କରେ। ଏଥିରେ କେବଳ ପାସୱାର୍ଡ ନୁହେଁ, ବରଂ ଆପଣଙ୍କ ଫୋନରେ "
        "ଆସୁଥିବା କୋଡ୍ ବା ଅଥେଣ୍ଟିକେଟର ଆପ୍ ମାଧ୍ୟମରେ ସତ୍ୟାପନ କରାଯାଏ। କେବଳ ପାସୱାର୍ଡ ଫିସିଂ କିମ୍ବା ଡାଟା ଚୋରି ଦ୍ୱାରା ଖୋଲିପାରେ। ଅଥେଣ୍ଟିକେଟର ଆପ୍ ବ୍ୟବହାର "
        "SMS OTP ଠାରୁ ଅଧିକ ସୁରକ୍ଷିତ କାରଣ SMS ସିମ୍-ସ୍ୱାପିଂ ଦ୍ୱାରା ହ୍ୟାକ୍ ହୋଇପାରେ। ଆପଣଙ୍କର OTP କାହା ସହିତ ମଧ୍ୟ ସେୟାର କରନ୍ତୁ ନାହିଁ।"
    ),
    "DL-02-PRIV-PERMS:or": (
        "ଆପଣଙ୍କ ସ୍ମାର୍ଟଫୋନରେ ଆପ୍ ଅନୁମତି ଯାଞ୍ଚ କରିବା ପାଇଁ ସେଟିଙ୍ଗ୍ସ > ପ୍ରାଇଭେସି (Privacy) କୁ ଯାଆନ୍ତୁ। ଆପ୍ କାର୍ଯ୍ୟ ପାଇଁ ଆବଶ୍ୟକ ଥିବା ଅନୁମତି ହିଁ ପ୍ରଦାନ କରନ୍ତୁ। "
        "କ୍ୟାମେରା, ମାଇକ୍ରୋଫୋନ ଏବଂ ଲୋକେସନ ଭଳି ଗୁରୁତ୍ୱପୂର୍ଣ୍ଣ ଅନୁମତି ପାଇଁ 'ଆପ୍ ବ୍ୟବହାର ସମୟରେ ଅନୁମତି ଦିଅନ୍ତୁ' ଚୟନ କରନ୍ତୁ।"
    ),
    "DL-03-FRAUD-PHISH:or": (
        "ଆକାଉଣ୍ଟ ବନ୍ଦ ହୋଇଯିବ ବୋଲି ଭୟ ସୃଷ୍ଟି କରୁଥିବା SMS ଗୁଡ଼ିକ ପ୍ରାୟତଃ ଫିସିଂ ହୋଇଥାଏ। ପ୍ରକୃତ ବ୍ୟାଙ୍କ କେବେ ମଧ୍ୟ SMS ବା ଚାଟ୍ ମାଧ୍ୟମରେ ଆପଣଙ୍କର OTP, "
        "ପାସୱାର୍ଡ କିମ୍ବା PIN ମାଗନ୍ତି ନାହିଁ। କୌଣସି ସନ୍ଦେହଜନକ ଲିଙ୍କ୍ ଉପରେ କ୍ଲିକ୍ କରନ୍ତୁ ନାହିଁ ଏବଂ ସିଧାସଳଖ ବ୍ୟାଙ୍କ ସହ ଯୋଗାଯୋଗ କରନ୍ତୁ।"
    ),
}

GENERIC_MOCK_RESPONSE = (
    "This is an illustrative benchmark response generated by the MockGemmaProvider for offline testing and demonstration. "
    "To protect your digital privacy and security, ensure you use strong authentication, verify application permissions, "
    "and never disclose sensitive credentials or OTPs on untrusted channels."
)


class MockGemmaProvider(BaseModelProvider):
    """Deterministic, zero-cost provider for automated tests and offline demonstrations."""

    def __init__(self, model_id: str = "gemma-4-it-mock", latency_ms: float = 45.0):
        self.model_id = model_id
        self.simulated_latency_ms = latency_ms

    def get_model_metadata(self) -> ProviderMetadata:
        return ProviderMetadata(
            provider_name="mock",
            model_id=self.model_id,
            model_revision="v1-fixture",
            quantization="none",
            base_url="mock://localhost",
            is_mock=True,
        )

    async def health_check(self) -> bool:
        """Mock provider is always healthy."""
        return True

    async def generate(
        self,
        prompt: str,
        sampling_params: Optional[SamplingParams] = None,
    ) -> GenerationResult:
        """Return deterministic multilingual fixture text."""
        if not prompt or not prompt.strip():
            raise ProviderResponseValidationError("Prompt must not be empty")

        # Simulate minimal processing latency
        await asyncio.sleep(self.simulated_latency_ms / 1000.0)

        # Match prompt with known task responses if possible
        matched_text = GENERIC_MOCK_RESPONSE
        for key, response_text in FIXTURE_RESPONSES.items():
            task_id, lang = key.split(":")
            if task_id in prompt:
                matched_text = response_text
                break

        # If not directly matched by task_id in prompt, check for language keywords
        if matched_text == GENERIC_MOCK_RESPONSE:
            if any("\u0900" <= c <= "\u097F" for c in prompt):
                matched_text = FIXTURE_RESPONSES["DL-01-SEC-2FA:hi"]
            elif any("\u0A00" <= c <= "\u0A7F" for c in prompt):
                matched_text = FIXTURE_RESPONSES["DL-01-SEC-2FA:pa"]
            elif any("\u0B00" <= c <= "\u0B7F" for c in prompt):
                matched_text = FIXTURE_RESPONSES["DL-01-SEC-2FA:or"]
            else:
                matched_text = FIXTURE_RESPONSES["DL-01-SEC-2FA:en"]

        words = matched_text.split()
        usage = TokenUsage(
            prompt_tokens=len(prompt.split()),
            completion_tokens=len(words),
            total_tokens=len(prompt.split()) + len(words),
        )

        result = GenerationResult(
            text=matched_text,
            finish_reason="stop",
            latency_ms=self.simulated_latency_ms,
            usage=usage,
            provider_metadata=self.get_model_metadata(),
            raw_response={"mock": True, "fixture_length": len(matched_text)},
        )
        self.validate_response(result)
        return result
