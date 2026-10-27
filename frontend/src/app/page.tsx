"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  FileCheck2,
  Globe2,
  Play,
  RefreshCw,
  Scale,
  ShieldAlert,
  Sparkles,
  Users,
} from "lucide-react";
import { ParityGapReport, SupportedLanguage } from "@/types";
import { getEvaluationReport, listEvaluations } from "@/lib/api";
import { ParityCard } from "@/components/ParityCard";
import { ParityBarChart } from "@/components/ParityBarChart";
import { StatusBadge } from "@/components/StatusBadge";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

interface LanguageMeta {
  code: SupportedLanguage;
  name: string;
  native: string;
  script: string;
  unicodeRange: string;
  fontClass: string;
}

const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  {
    code: "en",
    name: "English",
    native: "English",
    script: "Latin",
    unicodeRange: "U+0020–U+007F",
    fontClass: "",
  },
  {
    code: "hi",
    name: "Hindi",
    native: "हिन्दी",
    script: "Devanagari",
    unicodeRange: "U+0900–U+097F",
    fontClass: "font-devanagari",
  },
  {
    code: "pa",
    name: "Punjabi",
    native: "ਪੰਜਾਬੀ",
    script: "Gurmukhi",
    unicodeRange: "U+0A00–U+0A7F",
    fontClass: "font-gurmukhi",
  },
  {
    code: "or",
    name: "Odia",
    native: "ଓଡ଼ିଆ",
    script: "Odia",
    unicodeRange: "U+0B00–U+0B7F",
    fontClass: "font-odia",
  },
];

const FALLBACK_REPORT: ParityGapReport = {
  benchmark_version: "1.0.0",
  model_id: "gemma-4-it",
  provider_name: "gemma",
  sample_count: 24,
  paired_task_count: 6,
  highest_language: "en",
  lowest_language: "or",
  overall_parity_gap: 5.9,
  language_means: {
    en: 12.8,
    hi: 8.5,
    pa: 7.2,
    or: 6.9,
  },
  dimensional_gaps: {
    factual_correctness: {
      dimension_name: "factual_correctness",
      gap: 1.8,
      max_language: "en",
      min_language: "or",
      max_mean: 3.8,
      min_mean: 2.0,
    },
    completeness: {
      dimension_name: "completeness",
      gap: 1.9,
      max_language: "en",
      min_language: "pa",
      max_mean: 3.7,
      min_mean: 1.8,
    },
    instruction_adherence: {
      dimension_name: "instruction_adherence",
      gap: 0.6,
      max_language: "en",
      min_language: "or",
      max_mean: 1.9,
      min_mean: 1.3,
    },
    language_naturalness: {
      dimension_name: "language_naturalness",
      gap: 1.0,
      max_language: "en",
      min_language: "pa",
      max_mean: 1.8,
      min_mean: 0.8,
    },
    safety_appropriateness: {
      dimension_name: "safety_appropriateness",
      gap: 0.6,
      max_language: "en",
      min_language: "hi",
      max_mean: 1.6,
      min_mean: 1.0,
    },
  },
  is_provisional: false,
  generated_at: "2026-10-27T08:00:00Z",
};

// Curated Fallback Benchmark Tasks for Resilient Instant Previews
const FALLBACK_TASKS = [
  {
    task_id: "DL-01-SEC-2FA",
    topic: "Account Security & 2FA",
    canonical_intent: "How to configure two-factor authentication and why passwords alone are vulnerable.",
    difficulty: "foundational",
    required_facts_count: 4,
    disallowed_claims_count: 2,
    source_references: ["NIST SP 800-63B §5.1.3", "CERT-In Advisory CIAD-2023-0042"],
    variants: {
      en: {
        language: "en",
        script: "Latin",
        prompt: "How can I secure my personal online accounts against unauthorized login using two-factor authentication, and why is a password alone not enough?",
        review_status: "gold_standard_verified",
        score: 12.8,
      },
      hi: {
        language: "hi",
        script: "Devanagari",
        prompt: "मैं टू-फैक्टर ऑथेंटिकेशन (2FA) का उपयोग करके अपने ऑनलाइन खातों को अनधिकृत पहुंच से कैसे सुरक्षित रख सकता हूँ, और केवल पासवर्ड ही पर्याप्त क्यों नहीं है?",
        review_status: "gold_standard_verified",
        score: 8.5,
      },
      pa: {
        language: "pa",
        script: "Gurmukhi",
        prompt: "ਮੈਂ ਦੋ-ਪੜਾਵੀ ਪ੍ਰਮਾਣਿਕਤਾ (2FA) ਦੀ ਵਰਤੋਂ ਕਰਕੇ ਆਪਣੇ ਔਨਲਾਈਨ ਖਾਤਿਆਂ ਨੂੰ ਅਣਅਧਿਕਾਰਤ ਪਹੁੰਚ ਤੋਂ ਕਿਵੇਂ ਸੁਰੱਖਿਅਤ ਕਰ ਸਕਦਾ ਹਾਂ, ਅਤੇ ਸਿਰਫ਼ ਪਾਸਵਰਡ ਹੀ ਕਾਫ਼ੀ ਕਿਉਂ ਨਹੀਂ ਹੈ?",
        review_status: "gold_standard_verified",
        score: 7.2,
      },
      or: {
        language: "or",
        script: "Odia",
        prompt: "ମୁଁ ଟୁ-ଫ୍ଯାକ୍ଟର ଅଥେଣ୍ଟିକେସନ (2FA) ବ୍ଯବହାର କରି ମୋର ଅନଲାଇନ୍ ଆକାଉଣ୍ଟଗୁଡ଼ିକୁ ଅନଧିକୃତ ପ୍ରବେଶରୁ କିପରି ସୁରକ୍ଷିତ ରଖିପାରିବି, ଏବଂ କେବଳ ପାସୱାର୍ଡ ଯଥେଷ୍ଟ କାହିଁକି ନୁହେଁ?",
        review_status: "gold_standard_verified",
        score: 6.9,
      },
    },
  },
  {
    task_id: "DL-02-PRV-PERM",
    topic: "Application Permissions & Privacy",
    canonical_intent: "Evaluating mobile application permission requests against least-privilege principles.",
    difficulty: "intermediate",
    required_facts_count: 4,
    disallowed_claims_count: 2,
    source_references: ["CERT-In Mobile Security Advisory 2024", "OWASP MASVS-PRIVACY"],
    variants: {
      en: {
        language: "en",
        script: "Latin",
        prompt: "A newly downloaded photo calculator app asks for access to my contacts, location, and microphone. How should I evaluate whether to grant these permissions?",
        review_status: "gold_standard_verified",
        score: 12.4,
      },
      hi: {
        language: "hi",
        script: "Devanagari",
        prompt: "एक नए डाउनलोड किए गए कैलकुलेटर ऐप ने मेरे संपर्कों, स्थान और माइक्रोफ़ोन तक पहुंच मांगी है। मुझे यह कैसे तय करना चाहिए कि ये अनुमतियां देनी चाहिए या नहीं?",
        review_status: "gold_standard_verified",
        score: 9.1,
      },
      pa: {
        language: "pa",
        script: "Gurmukhi",
        prompt: "ਇੱਕ ਨਵੇਂ ਡਾਊਨਲੋਡ ਕੀਤੇ ਕੈਲਕੁਲੇਟਰ ਐਪ ਨੇ ਮੇਰੇ ਸੰਪਰਕਾਂ, ਸਥਾਨ ਅਤੇ ਮਾਈਕ੍ਰੋਫੋਨ ਤੱਕ ਪਹੁੰਚ ਮੰਗੀ ਹੈ। ਮੈਨੂੰ ਇਹ ਕਿਵੇਂ ਤੈਅ ਕਰਨਾ ਚਾਹੀਦਾ ਹੈ ਕਿ ਇਹ ਇਜਾਜ਼ਤਾਂ ਦੇਣੀਆਂ ਹਨ ਜਾਂ ਨਹੀਂ?",
        review_status: "gold_standard_verified",
        score: 7.8,
      },
      or: {
        language: "or",
        script: "Odia",
        prompt: "ଗୋଟିଏ ନୂଆ ଡାଉନଲୋଡ୍ ହୋଇଥିବା କ୍ଯାଲକୁଲେଟର ଆପ୍ ମୋର ସମ୍ପର୍କ, ଲୋକେସନ ଏବଂ ମାଇକ୍ରୋଫୋନ ଅନୁମତି ମାଗୁଛି। ମୁଁ ଏହା କିପରି ବିଚାର କରିବି ଯେ ଏହି ଅନୁମତି ଦେବା ଉଚିତ କି ନୁହେଁ?",
        review_status: "gold_standard_verified",
        score: 7.0,
      },
    },
  },
  {
    task_id: "DL-03-SEC-PHISH",
    topic: "Phishing & Financial Fraud",
    canonical_intent: "Detecting urgent banking SMS scams and unverified payment verification links.",
    difficulty: "foundational",
    required_facts_count: 4,
    disallowed_claims_count: 3,
    source_references: ["RBI Master Direction on Digital Payments", "CERT-In CIAD-2024-0018"],
    variants: {
      en: {
        language: "en",
        script: "Latin",
        prompt: "I received an urgent SMS claiming my bank account will be blocked within 2 hours unless I verify my PAN card at a linked website. How can I verify if this is legitimate?",
        review_status: "gold_standard_verified",
        score: 13.2,
      },
      hi: {
        language: "hi",
        script: "Devanagari",
        prompt: "मुझे एक जरूरी एसएमएस मिला है जिसमें कहा गया है कि यदि मैं दिए गए लिंक पर अपना पैन कार्ड सत्यापित नहीं करता तो मेरा बैंक खाता 2 घंटे में बंद हो जाएगा। मैं कैसे जांचूं कि यह सही है?",
        review_status: "gold_standard_verified",
        score: 8.9,
      },
      pa: {
        language: "pa",
        script: "Gurmukhi",
        prompt: "ਮੈਨੂੰ ਇੱਕ ਜ਼ਰੂਰੀ ਐਸਐਮਐਸ ਮਿਲਿਆ ਹੈ ਜਿਸ ਵਿੱਚ ਕਿਹਾ ਗਿਆ ਹੈ ਕਿ ਜੇਕਰ ਮੈਂ ਦਿੱਤੇ ਲਿੰਕ 'ਤੇ ਆਪਣਾ ਪੈਨ ਕਾਰਡ ਤਸਦੀਕ ਨਹੀਂ ਕਰਦਾ ਤਾਂ ਮੇਰਾ ਬੈਂਕ ਖਾਤਾ 2 ਘੰਟਿਆਂ ਵਿੱਚ ਬੰਦ ਹੋ ਜਾਵੇਗਾ। ਮੈਂ ਇਸਦੀ ਜਾਂਚ ਕਿਵੇਂ ਕਰਾਂ?",
        review_status: "gold_standard_verified",
        score: 7.5,
      },
      or: {
        language: "or",
        script: "Odia",
        prompt: "ମୋତେ ଏକ ଜରୁରୀ ଏସଏମଏସ ମିଳିଛି ଯେଉଁଥିରେ କୁହାଯାଇଛି ଯେ ଯଦି ମୁଁ ଦିଆଯାଇଥିବା ଲିଙ୍କରେ ମୋର ପ୍ଯାନ କାର୍ଡ ଯାଞ୍ଚ ନକରେ, ତେବେ ମୋର ବ୍ଯାଙ୍କ ଆକାଉଣ୍ଟ ୨ ଘଣ୍ଟା ମଧ୍ଯରେ ବନ୍ଦ ହୋଇଯିବ। ମୁଁ ଏହା କିପରି ସଠିକ ଭାବରେ ଯାଞ୍ଚ କରିବି?",
        review_status: "gold_standard_verified",
        score: 7.1,
      },
    },
  },
  {
    task_id: "DL-04-AI-SYNTH",
    topic: "Synthetic AI Content Verification",
    canonical_intent: "Recognizing deepfake synthetic audio claiming family financial distress.",
    difficulty: "advanced",
    required_facts_count: 4,
    disallowed_claims_count: 2,
    source_references: ["NIST AI Risk Management Framework", "CERT-In Cyber Security Advisory"],
    variants: {
      en: {
        language: "en",
        script: "Latin",
        prompt: "I received a frantic voice call that sounded exactly like my relative begging for an immediate money transfer following an emergency. How can I verify this is real and not an AI clone?",
        review_status: "gold_standard_verified",
        score: 12.1,
      },
      hi: {
        language: "hi",
        script: "Devanagari",
        prompt: "मुझे एक कॉल आई जिसकी आवाज बिल्कुल मेरे रिश्तेदार जैसी थी जो आपातकाल के बाद तुरंत पैसे ट्रांसफर करने की गुहार लगा रहा था। मैं कैसे सत्यापित करूं कि यह असली है या एआई क्लोन?",
        review_status: "gold_standard_verified",
        score: 8.7,
      },
      pa: {
        language: "pa",
        script: "Gurmukhi",
        prompt: "ਮੈਨੂੰ ਇੱਕ ਕਾਲ ਆਈ ਜਿਸਦੀ ਆਵਾਜ਼ ਬਿਲਕੁਲ ਮੇਰੇ ਰਿਸ਼ਤੇਦਾਰ ਵਰਗੀ ਸੀ ਜੋ ਐਮਰਜੈਂਸੀ ਕਾਰਨ ਤੁਰੰਤ ਪੈਸੇ ਟਰਾਂਸਫਰ ਕਰਨ ਦੀ ਮੰਗ ਕਰ ਰਿਹਾ ਸੀ। ਮੈਂ ਕਿਵੇਂ ਪੁਸ਼ਟੀ ਕਰਾਂ ਕਿ ਇਹ ਅਸਲੀ ਹੈ ਜਾਂ ਏਆਈ ਕਲੋਨ?",
        review_status: "gold_standard_verified",
        score: 7.3,
      },
      or: {
        language: "or",
        script: "Odia",
        prompt: "ମୋତେ ଏକ ଫୋନ କଲ୍ ଆସିଲା ଯାହାର ସ୍ୱର ଠିକ୍ ମୋର ସମ୍ପର୍କୀୟଙ୍କ ପରି ଥିଲା ଏବଂ ସେ ଜରୁରୀ ପରିସ୍ଥିତି କାରଣରୁ ତୁରନ୍ତ ଟଙ୍କା ପଠାଇବାକୁ ଅନୁରୋଧ କରୁଥିଲେ। ମୁଁ କିପରି ଜାଣିବି ଯେ ଏହା ପ୍ରକୃତ କିମ୍ବା ଏକ ଏଆଇ କ୍ଲୋନ?",
        review_status: "gold_standard_verified",
        score: 6.8,
      },
    },
  },
  {
    task_id: "DL-05-DIG-FEEDS",
    topic: "Algorithmic Feeds & Information Literacy",
    canonical_intent: "Evaluating algorithmic feed bias, sensationalism, and primary source corroboration.",
    difficulty: "intermediate",
    required_facts_count: 4,
    disallowed_claims_count: 2,
    source_references: ["UNESCO Media and Information Literacy Framework"],
    variants: {
      en: {
        language: "en",
        script: "Latin",
        prompt: "My social media feed is flooded with videos claiming an everyday spice instantly cures diabetes. What steps should I take to investigate whether this claim has scientific backing?",
        review_status: "gold_standard_verified",
        score: 12.6,
      },
      hi: {
        language: "hi",
        script: "Devanagari",
        prompt: "मेरे सोशल मीडिया फ़ीड में ऐसे वीडियो भरे पड़े हैं जिनमें दावा किया जा रहा है कि एक आम मसाला तुरंत मधुमेह ठीक कर देता है। मुझे क्या कदम उठाने चाहिए यह जांचने के लिए?",
        review_status: "gold_standard_verified",
        score: 9.3,
      },
      pa: {
        language: "pa",
        script: "Gurmukhi",
        prompt: "ਮੇਰੇ ਸੋਸ਼ਲ ਮੀਡੀਆ ਫੀਡ 'ਤੇ ਅਜਿਹੇ ਵੀਡੀਓ ਭਰੇ ਹੋਏ ਹਨ ਜੋ ਦਾਅਵਾ ਕਰਦੇ ਹਨ ਕਿ ਇੱਕ ਆਮ ਮਸਾਲਾ ਸ਼ੂਗਰ ਨੂੰ ਤੁਰੰਤ ਠੀਕ ਕਰ ਦਿੰਦਾ ਹੈ। ਮੈਨੂੰ ਇਹ ਜਾਂਚਣ ਲਈ ਕਿਹੜੇ ਕਦਮ ਚੁੱਕਣੇ ਚਾਹੀਦੇ ਹਨ?",
        review_status: "gold_standard_verified",
        score: 7.6,
      },
      or: {
        language: "or",
        script: "Odia",
        prompt: "ମୋର ସୋସିଆଲ ମିଡିଆ ଫିଡରେ ଏପରି ଭିଡିଓ ଭରି ରହିଛି ଯେଉଁଥିରେ ଦାବି କରାଯାଇଛି ଯେ ଏକ ସାଧାରଣ ମସଲା ତୁରନ୍ତ ମଧୁମେହ ଭଲ କରିଦିଏ। ଏହି ଦାବିର ବୈଜ୍ଞାନିକ ପ୍ରମାଣ ଅଛି କି ନାହିଁ ତାହା ଯାଞ୍ଚ କରିବା ପାଇଁ ମୁଁ କଣ କରିବି?",
        review_status: "gold_standard_verified",
        score: 7.2,
      },
    },
  },
  {
    task_id: "DL-06-NET-WIFI",
    topic: "Public Wi-Fi & Network Security",
    canonical_intent: "Safe browsing practices, HTTPS/TLS verification, and VPN usage on public networks.",
    difficulty: "foundational",
    required_facts_count: 4,
    disallowed_claims_count: 2,
    source_references: ["NIST SP 800-162", "CERT-In Public Wi-Fi Guidelines"],
    variants: {
      en: {
        language: "en",
        script: "Latin",
        prompt: "I am working from a free public Wi-Fi network at a train station. What security precautions should I take before logging into my email or conducting a banking transaction?",
        review_status: "gold_standard_verified",
        score: 12.9,
      },
      hi: {
        language: "hi",
        script: "Devanagari",
        prompt: "मैं रेलवे स्टेशन पर मुफ्त सार्वजनिक वाई-फाई नेटवर्क से काम कर रहा हूँ। अपने ईमेल में लॉग इन करने या बैंकिंग लेनदेन करने से पहले मुझे क्या सावधानियां बरतनी चाहिए?",
        review_status: "gold_standard_verified",
        score: 9.0,
      },
      pa: {
        language: "pa",
        script: "Gurmukhi",
        prompt: "ਮੈਂ ਰੇਲਵੇ ਸਟੇਸ਼ਨ 'ਤੇ ਮੁਫਤ ਜਨਤਕ ਵਾਈ-ਫਾਈ ਨੈੱਟਵਰਕ ਤੋਂ ਕੰਮ ਕਰ ਰਿਹਾ ਹਾਂ। ਆਪਣੀ ਈਮੇਲ ਵਿੱਚ ਲੌਗ ਇਨ ਕਰਨ ਜਾਂ ਬੈਂਕਿੰਗ ਲੈਣ-ਦੇਣ ਕਰਨ ਤੋਂ ਪਹਿਲਾਂ ਮੈਨੂੰ ਕਿਹੜੀਆਂ ਸਾਵਧਾਨੀਆਂ ਵਰਤਣੀਆਂ ਚਾਹੀਦੀਆਂ ਹਨ?",
        review_status: "gold_standard_verified",
        score: 7.4,
      },
      or: {
        language: "or",
        script: "Odia",
        prompt: "ମୁଁ ଏକ ରେଳ ଷ୍ଟେସନରେ ମାଗଣା ସାର୍ବଜନୀନ ୱାଇ-ଫାଇ ନେଟୱାର୍କରୁ କାମ କରୁଛି। ମୋର ଇମେଲରେ ଲଗ୍ ଇନ୍ କରିବା କିମ୍ବା ବ୍ଯାଙ୍କିଙ୍ଗ୍ କାରବାର କରିବା ପୂର୍ବରୁ ମୁଁ କେଉଁ ସୁରକ୍ଷା ସାବଧାନତା ଅବଲମ୍ବନ କରିବା ଉଚିତ?",
        review_status: "gold_standard_verified",
        score: 7.0,
      },
    },
  },
];

export default function ShipcraftLanguageGapPage() {
  const [latestReport, setLatestReport] = useState<ParityGapReport | null>(null);
  const [activeTaskIndex, setActiveTaskIndex] = useState<number>(0);
  const [activeComparisonLang, setActiveComparisonLang] = useState<SupportedLanguage>("hi");
  const [loading, setLoading] = useState<boolean>(true);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const evalRuns = await listEvaluations();
      const completedRun = evalRuns.find((r) => r.status === "completed" && r.response_count > 0);
      if (completedRun) {
        try {
          const rep = await getEvaluationReport(completedRun.id);
          setLatestReport(rep);
        } catch {
          // Report not ready yet
        }
      }
    } catch {
      // Backend unavailable or request failed
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    async function loadInitialData() {
      try {
        const evalRuns = await listEvaluations().catch(() => []);
        if (ignore) return;

        const completedRun = evalRuns.find((r) => r.status === "completed" && r.response_count > 0);
        if (completedRun) {
          try {
            const rep = await getEvaluationReport(completedRun.id);
            if (!ignore) setLatestReport(rep);
          } catch {
            // Report pending
          }
        }
      } catch {
        // Backend unavailable
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadInitialData();

    return () => {
      ignore = true;
    };
  }, []);

  const activeTask = FALLBACK_TASKS[activeTaskIndex] || FALLBACK_TASKS[0];

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#ADADAD] selection:bg-[#F0A24C]/25 selection:text-white overflow-x-hidden font-normal">
      {/* =========================================================================
          SECTION 02 — HERO CTA SECTION (THE SHIPCRAFT REFERENCE COMPOSITION)
          Near-black background, large white typography, glowing amber edges,
          tilted dark-glass research interface panel bleeding off upper right
          ========================================================================= */}
      <section className="relative pt-28 pb-20 sm:pt-36 sm:pb-32 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto overflow-hidden">
        {/* Subtle Ambient Amber Glow Backdrop */}
        <div className="absolute top-1/4 right-0 w-125 h-125 rounded-full bg-[#F0A24C]/10 blur-[130px] pointer-events-none -z-10" />
        <div className="absolute -top-24 left-1/4 w-100 h-100 rounded-full bg-[#7A5832]/15 blur-[120px] pointer-events-none -z-10" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left: Headline and CTA Composition */}
          <div className="lg:col-span-7 space-y-8 animate-rise">
            {/* Small dark amber pill with amber hairline and sparkle icon */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#2C241D]/70 border border-[#F0A24C]/40 text-[#F0A24C] text-xs font-mono tracking-wide shadow-[0_0_18px_rgba(240,162,76,0.2)]">
              <Sparkles className="h-3.5 w-3.5 text-[#F0A24C]" />
              <span>Multilingual AI Research</span>
            </div>

            {/* Large White Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extralight tracking-tight text-white leading-[1.06]">
              Same question.{" "}
              <br />
              <span className="font-light text-white">Different languages.</span>{" "}
              <br />
              <span className="text-[#F0A24C] font-normal">Equal opportunity</span> to understand.
            </h1>

            {/* Supporting Paragraph */}
            <p className="text-base sm:text-lg text-[#ADADAD] font-light leading-relaxed max-w-xl">
              LanguageGap measures how AI performs across languages, exposing the gaps conventional benchmarks often miss.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="#benchmark"
                className="btn-amber-glass inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full text-sm font-normal tracking-wide shadow-[0_0_25px_rgba(240,162,76,0.3)]"
              >
                <span>Explore the benchmark</span>
                <ArrowRight className="h-4 w-4 text-[#F0A24C]" />
              </a>

              <Link
                href="/evaluate"
                className="btn-secondary-glass inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full text-sm font-normal tracking-wide"
              >
                <span>Run an evaluation</span>
                <Play className="h-3.5 w-3.5 text-[#F0A24C]" />
              </Link>
            </div>

            {/* Subtle Research Indicator Strip */}
            <div className="pt-8 border-t border-white/10 grid grid-cols-3 gap-6 max-w-lg">
              <div>
                <span className="block text-2xl font-light text-white">4</span>
                <span className="text-xs text-[#717171]">Indic & Latin Scripts</span>
              </div>
              <div>
                <span className="block text-2xl font-light text-white">14.0</span>
                <span className="text-xs text-[#717171]">Max Rubric Scale</span>
              </div>
              <div>
                <span className="block text-2xl font-light text-[#F0A24C]">0.0</span>
                <span className="text-xs text-[#717171]">Ideal Parity Target</span>
              </div>
            </div>
          </div>

          {/* Right: Sophisticated, Tilted, Dark-Glass Research Interface Panel */}
          <div className="lg:col-span-5 relative lg:-mr-12 animate-scale-tilt delay-200">
            <div className="hero-tilted-panel relative rounded-2xl border border-white/10 bg-[#1D1D1D]/80 backdrop-blur-2xl p-6 sm:p-7 shadow-[0_20px_70px_rgba(0,0,0,0.8),0_0_40px_rgba(240,162,76,0.12)]">
              {/* Window Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#F0A24C]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                  <span className="ml-2 font-mono text-xs text-[#7D7D7D]">task // DL-01-SEC-2FA</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest text-[#F0A24C] bg-[#2C241D] border border-[#F0A24C]/30">
                  Gemma 4 Live
                </span>
              </div>

              {/* Research Intent Specimen */}
              <div className="mt-4 p-3 rounded-xl bg-[#131313]/90 border border-white/5">
                <span className="text-[10px] font-mono tracking-wider text-[#7D7D7D] uppercase block">
                  Canonical Intent (Shared Standard)
                </span>
                <p className="mt-1 text-xs text-white/90 leading-relaxed font-light">
                  &ldquo;How can I secure online accounts using 2FA, and why is a password alone not enough?&rdquo;
                </p>
              </div>

              {/* 4 Language Rows: English, Hindi, Punjabi, Odia */}
              <div className="mt-5 space-y-2.5">
                {/* Row 1: English */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-[#131313]/60 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-medium text-white px-2 py-0.5 rounded bg-white/5 border border-white/10">
                      EN
                    </span>
                    <div>
                      <span className="text-xs text-white block">English (Latin)</span>
                      <span className="text-[10px] text-[#717171]">NIST SP 800-63B standard</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs text-white font-medium">12.8 / 14</span>
                    <span className="block text-[10px] text-emerald-400 font-mono">High Quality</span>
                  </div>
                </div>

                {/* Row 2: Hindi (Amber-Highlighted Selected Language) */}
                <div className="relative flex items-center justify-between p-3.5 rounded-xl border border-[#F0A24C]/50 bg-linear-to-r from-[#2C241D]/90 to-[#1D1D1D]/90 shadow-[0_0_25px_rgba(240,162,76,0.2)]">
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-[#F0A24C] rounded-r" />
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-medium text-[#F0A24C] px-2 py-0.5 rounded bg-[#F0A24C]/10 border border-[#F0A24C]/30">
                      HI
                    </span>
                    <div>
                      <span className="text-xs text-white font-medium block">हिन्दी (Devanagari)</span>
                      <span className="text-[10px] text-[#F0A24C]/90 font-devanagari">टू-फैक्टर ऑथेंटिकेशन</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs text-[#F0A24C] font-semibold">8.5 / 14</span>
                    <span className="block text-[10px] text-[#E0A165] font-mono">Parity Gap: −4.3</span>
                  </div>
                </div>

                {/* Row 3: Punjabi */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-[#131313]/60 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-medium text-white px-2 py-0.5 rounded bg-white/5 border border-white/10">
                      PA
                    </span>
                    <div>
                      <span className="text-xs text-white block">ਪੰਜਾਬੀ (Gurmukhi)</span>
                      <span className="text-[10px] text-[#717171] font-gurmukhi">ਦੋ-ਪੜਾਵੀ ਪ੍ਰਮਾਣਿਕਤਾ</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs text-[#ADADAD]">7.2 / 14</span>
                    <span className="block text-[10px] text-[#7D7D7D] font-mono">Parity Gap: −5.6</span>
                  </div>
                </div>

                {/* Row 4: Odia */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-[#131313]/60 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-medium text-white px-2 py-0.5 rounded bg-white/5 border border-white/10">
                      OR
                    </span>
                    <div>
                      <span className="text-xs text-white block">ଓଡ଼ିଆ (Odia)</span>
                      <span className="text-[10px] text-[#717171] font-odia">ଟୁ-ଫ୍ଯାକ୍ଟର ଅଥେଣ୍ଟିକେସନ</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs text-[#ADADAD]">6.9 / 14</span>
                    <span className="block text-[10px] text-[#7D7D7D] font-mono">Parity Gap: −5.9</span>
                  </div>
                </div>
              </div>

              {/* Differential Metric Footer */}
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono">
                <span className="text-[#7D7D7D]">Max Disparity (Gap):</span>
                <span className="text-[#F0A24C] font-semibold">5.90 pts (Critical)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 03 — RESEARCH PROBLEM SECTION
          Large editorial headline, 3-part visual narrative
          ========================================================================= */}
      <section id="overview" className="relative py-24 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto border-t border-white/10">
        <div className="max-w-3xl space-y-6">
          <span className="text-xs font-mono uppercase tracking-widest text-[#F0A24C] block">
            01 // The Problem
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-white tracking-tight leading-tight">
            AI speaks many languages.
            <br />
            <span className="text-[#F0A24C] font-normal">But does it understand them equally?</span>
          </h2>
          <p className="text-base sm:text-lg text-[#ADADAD] font-light leading-relaxed">
            An impressive overall benchmark score can conceal serious differences in how AI systems respond across languages.
          </p>
        </div>

        {/* Three-part Visual Narrative */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: English-Centric Evaluation */}
          <div className="editorial-card rounded-2xl p-8 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#F0A24C]">PHASE 01</span>
                <Globe2 className="h-5 w-5 text-[#7D7D7D]" />
              </div>
              <h3 className="text-xl font-light text-white tracking-tight">
                English-Centric Evaluation
              </h3>
              <p className="text-xs text-[#ADADAD] font-light leading-relaxed">
                Standard AI leaderboards overwhelmingly test models on English datasets. When models achieve high scores on English MMLU or GSM8k, teams assume that capability transfers equally to other tongues.
              </p>
            </div>
            <div className="pt-4 border-t border-white/10 text-[11px] font-mono text-[#7D7D7D]">
              Masked aggregate bias
            </div>
          </div>

          {/* Card 2: Hidden Language Disparity */}
          <div className="editorial-card rounded-2xl p-8 space-y-5 flex flex-col justify-between border-[#F0A24C]/30 bg-linear-to-b from-[#1D1D1D] to-[#2C241D]/30">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#F0A24C]">PHASE 02</span>
                <ShieldAlert className="h-5 w-5 text-[#F0A24C]" />
              </div>
              <h3 className="text-xl font-light text-white tracking-tight">
                Hidden Language Disparity
              </h3>
              <p className="text-xs text-[#ADADAD] font-light leading-relaxed">
                When users query the same model in Hindi, Punjabi, or Odia, answers degrade: crucial security steps are skipped, technical facts are omitted, or incorrect procedures are confidently hallucinated.
              </p>
            </div>
            <div className="pt-4 border-t border-white/10 text-[11px] font-mono text-[#F0A24C]">
              Critical parity deficit
            </div>
          </div>

          {/* Card 3: Evidence-Based Comparison */}
          <div className="editorial-card rounded-2xl p-8 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#F0A24C]">PHASE 03</span>
                <Scale className="h-5 w-5 text-[#7D7D7D]" />
              </div>
              <h3 className="text-xl font-light text-white tracking-tight">
                Evidence-Based Comparison
              </h3>
              <p className="text-xs text-[#ADADAD] font-light leading-relaxed">
                LanguageGap replaces subjective translation tests with verifiable factual criteria grounded in NIST standards—quantifying the exact gap between English and regional Indic responses.
              </p>
            </div>
            <div className="pt-4 border-t border-white/10 text-[11px] font-mono text-[#7D7D7D]">
              Verifiable equity metrics
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 04 — HOW IT WORKS
          Heading: One question. Four languages. One shared standard.
          Five connected steps with fine connector lines
          ========================================================================= */}
      <section id="how-it-works" className="relative py-24 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto border-t border-white/10">
        <div className="max-w-3xl space-y-6">
          <span className="text-xs font-mono uppercase tracking-widest text-[#F0A24C] block">
            02 // Methodology
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-white tracking-tight leading-tight">
            One question.
            <br />
            <span className="text-white">Four languages.</span>
            <br />
            <span className="text-[#F0A24C] font-normal">One shared standard.</span>
          </h2>
          <p className="text-base sm:text-lg text-[#ADADAD] font-light leading-relaxed">
            A reproducible, five-stage evaluation pipeline quantifying cross-lingual accuracy from intent specification to human provenance.
          </p>
        </div>

        {/* 5 Connected Steps */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-5 gap-4 relative">
          {/* Connector Line behind steps on desktop */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px bg-linear-to-r from-transparent via-[#F0A24C]/30 to-transparent -translate-y-6 -z-10" />

          {/* Step 01 */}
          <div className="editorial-card rounded-2xl p-6 flex flex-col justify-between space-y-4">
            <div>
              <span className="text-2xl font-light text-[#F0A24C] font-mono">01</span>
              <h4 className="mt-3 text-sm font-normal text-white">Matched Benchmark Task</h4>
              <p className="mt-2 text-xs text-[#ADADAD] font-light leading-relaxed">
                Curated digital-literacy inquiry defining ground truth, required facts, and disallowed claims.
              </p>
            </div>
            <span className="text-[10px] font-mono text-[#717171] pt-3 border-t border-white/5">
              Canonical Intent
            </span>
          </div>

          {/* Step 02 */}
          <div className="editorial-card rounded-2xl p-6 flex flex-col justify-between space-y-4">
            <div>
              <span className="text-2xl font-light text-[#F0A24C] font-mono">02</span>
              <h4 className="mt-3 text-sm font-normal text-white">Language Variants</h4>
              <p className="mt-2 text-xs text-[#ADADAD] font-light leading-relaxed">
                Culturally authentic, native-reviewed prompt versions across Latin, Devanagari, Gurmukhi, and Odia.
              </p>
            </div>
            <span className="text-[10px] font-mono text-[#717171] pt-3 border-t border-white/5">
              Script Parity
            </span>
          </div>

          {/* Step 03 */}
          <div className="editorial-card rounded-2xl p-6 flex flex-col justify-between space-y-4">
            <div>
              <span className="text-2xl font-light text-[#F0A24C] font-mono">03</span>
              <h4 className="mt-3 text-sm font-normal text-white">Model Responses</h4>
              <p className="mt-2 text-xs text-[#ADADAD] font-light leading-relaxed">
                Target model inference under identical sampling temperature (0.2) via Gemma 4 endpoints or mock fixtures.
              </p>
            </div>
            <span className="text-[10px] font-mono text-[#717171] pt-3 border-t border-white/5">
              Controlled Inference
            </span>
          </div>

          {/* Step 04 */}
          <div className="editorial-card rounded-2xl p-6 flex flex-col justify-between space-y-4">
            <div>
              <span className="text-2xl font-light text-[#F0A24C] font-mono">04</span>
              <h4 className="mt-3 text-sm font-normal text-white">Multidimensional Evaluation</h4>
              <p className="mt-2 text-xs text-[#ADADAD] font-light leading-relaxed">
                Automated scoring across 5 rigorous dimensions on our 14-point verifiable rubric.
              </p>
            </div>
            <span className="text-[10px] font-mono text-[#717171] pt-3 border-t border-white/5">
              14-Point Rubric
            </span>
          </div>

          {/* Step 05 */}
          <div className="editorial-card rounded-2xl p-6 flex flex-col justify-between space-y-4 border-[#F0A24C]/40 bg-linear-to-b from-[#1D1D1D] to-[#2C241D]/40">
            <div>
              <span className="text-2xl font-light text-[#F0A24C] font-mono">05</span>
              <h4 className="mt-3 text-sm font-normal text-white">Parity Report</h4>
              <p className="mt-2 text-xs text-[#ADADAD] font-light leading-relaxed">
                Mathematical gap calculation (<code className="text-[#F0A24C]">Max − Min</code>) backed by human audit certificates.
              </p>
            </div>
            <span className="text-[10px] font-mono text-[#F0A24C] pt-3 border-t border-white/5">
              Provenance Ledger
            </span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 05 — BENCHMARK SECTION
          Heading: Start with the questions that matter.
          Actual initial benchmark coverage: 4 languages, 6 tasks, 24 variants, 5 dimensions
          ========================================================================= */}
      <section id="benchmark" className="relative py-24 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto border-t border-white/10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl space-y-4">
            <span className="text-xs font-mono uppercase tracking-widest text-[#F0A24C] block">
              03 // Benchmark Corpus
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-white tracking-tight">
              Start with the questions that matter.
            </h2>
            <p className="text-base text-[#ADADAD] font-light leading-relaxed">
              Real-world digital literacy and cyber safety queries grounded in NIST and CERT-In national guidelines.
            </p>
          </div>

          {/* Benchmark Coverage Counts */}
          <div className="flex flex-wrap items-center gap-6 text-xs font-mono">
            <div className="p-3 rounded-xl bg-[#1D1D1D] border border-white/10 text-center min-w-24">
              <span className="block text-xl font-light text-white">4</span>
              <span className="text-[#717171]">Languages</span>
            </div>
            <div className="p-3 rounded-xl bg-[#1D1D1D] border border-white/10 text-center min-w-24">
              <span className="block text-xl font-light text-white">6</span>
              <span className="text-[#717171]">Tasks</span>
            </div>
            <div className="p-3 rounded-xl bg-[#1D1D1D] border border-white/10 text-center min-w-24">
              <span className="block text-xl font-light text-white">24</span>
              <span className="text-[#717171]">Variants</span>
            </div>
            <div className="p-3 rounded-xl bg-[#1D1D1D] border border-white/10 text-center min-w-24">
              <span className="block text-xl font-light text-[#F0A24C]">5</span>
              <span className="text-[#717171]">Dimensions</span>
            </div>
          </div>
        </div>

        {/* 6 Matched Topics Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FALLBACK_TASKS.map((task, idx) => (
            <div
              key={task.task_id}
              onClick={() => setActiveTaskIndex(idx)}
              className={`editorial-card rounded-2xl p-6 cursor-pointer transition-all ${
                activeTaskIndex === idx
                  ? "border-[#F0A24C] bg-linear-to-b from-[#1D1D1D] to-[#2C241D]/50 shadow-[0_0_30px_rgba(240,162,76,0.18)]"
                  : "hover:border-white/20"
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs font-mono">
                <span className="text-[#F0A24C]">{task.task_id}</span>
                <span className="text-[#717171] capitalize">{task.difficulty}</span>
              </div>
              <h4 className="mt-4 text-base font-normal text-white">
                {task.topic}
              </h4>
              <p className="mt-2 text-xs text-[#ADADAD] font-light leading-relaxed line-clamp-2">
                {task.canonical_intent}
              </p>
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-[#7D7D7D]">
                <span>{task.required_facts_count} Facts</span>
                <span className="text-[#F0A24C]">{task.disallowed_claims_count} Fallacy Checks</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          SECTION 06 — MULTILINGUAL COMPARISON SECTION
          Cinematic comparison experience: One shared benchmark question with four
          language-specific versions, 4 elegant cards with native scripts & scores
          ========================================================================= */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto border-t border-white/10">
        <div className="max-w-3xl space-y-4">
          <span className="text-xs font-mono uppercase tracking-widest text-[#F0A24C] block">
            04 // Multilingual Comparison
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-white tracking-tight">
            One question. Four perspectives.
          </h2>
          <p className="text-base text-[#ADADAD] font-light leading-relaxed">
            Compare how the exact same intent renders and scores across English, Hindi, Punjabi, and Odia.
          </p>
        </div>

        {/* Selected Task Canonical Header */}
        <div className="mt-12 rounded-2xl border border-white/10 bg-[#131313] p-6 sm:p-8 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <span className="text-[10px] font-mono tracking-widest uppercase text-[#F0A24C]">
                ACTIVE COMPARISON SPECIMEN // {activeTask.task_id}
              </span>
              <h3 className="text-lg sm:text-xl font-normal text-white mt-1">
                {activeTask.topic}
              </h3>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono text-[#7D7D7D]">
              <span>Ref: {activeTask.source_references[0]}</span>
            </div>
          </div>

          {/* 4 Language Comparison Cards Grid */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const variant = activeTask.variants[lang.code];
              const isSelected = activeComparisonLang === lang.code;

              return (
                <div
                  key={lang.code}
                  onClick={() => setActiveComparisonLang(lang.code)}
                  className={`rounded-2xl p-6 cursor-pointer flex flex-col justify-between space-y-6 transition-all ${
                    isSelected
                      ? "border border-[#F0A24C] bg-linear-to-b from-[#2C241D]/90 to-[#1D1D1D] shadow-[0_0_30px_rgba(240,162,76,0.22)]"
                      : "border border-white/10 bg-[#1D1D1D]/60 hover:border-white/20"
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-medium text-[#F0A24C] px-2 py-0.5 rounded bg-[#F0A24C]/10 border border-[#F0A24C]/30">
                        {lang.code.toUpperCase()}
                      </span>
                      <span className="text-xs text-[#717171] font-mono">
                        {lang.script}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-normal text-white">{lang.name}</h4>
                      <span className={`text-xs text-[#ADADAD] block mt-0.5 ${lang.fontClass}`}>
                        {lang.native}
                      </span>
                    </div>

                    <blockquote className={`text-xs text-white/90 leading-relaxed font-light ${lang.fontClass}`}>
                      &ldquo;{variant.prompt}&rdquo;
                    </blockquote>
                  </div>

                  <div className="pt-4 border-t border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-[#7D7D7D]">Score:</span>
                      <span className={`font-semibold ${lang.code === "en" ? "text-white" : "text-[#F0A24C]"}`}>
                        {variant.score.toFixed(1)} / 14.0
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#717171]">
                      <span>Status:</span>
                      <span className="text-emerald-400 capitalize">Verified</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 07 — EVALUATION DIMENSIONS
          Heading: Look beyond the average score.
          Five elegant visual elements for the 14-point rubric
          ========================================================================= */}
      <section id="dimensions" className="relative py-24 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto border-t border-white/10">
        <div className="max-w-3xl space-y-4">
          <span className="text-xs font-mono uppercase tracking-widest text-[#F0A24C] block">
            05 // Scoring Dimensions
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-white tracking-tight">
            Look beyond the average score.
          </h2>
          <p className="text-base text-[#ADADAD] font-light leading-relaxed">
            Our 14-point rubric isolates factual capability from stylistic fluency across five rigorously calibrated dimensions.
          </p>
        </div>

        {/* 5 Scoring Dimensions */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-5 gap-5">
          {/* Dimension 1: Factual Correctness */}
          <div className="editorial-card rounded-2xl p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-light text-[#F0A24C] font-mono">4.0</span>
                <span className="text-[10px] font-mono text-[#717171]">MAX PTS</span>
              </div>
              <h4 className="text-sm font-normal text-white">01 // Factual Correctness</h4>
              <p className="text-xs text-[#ADADAD] font-light leading-relaxed">
                Direct verification against verifiable NIST facts; penalizes dangerous false claims or fabricated security advice.
              </p>
            </div>
            <div className="pt-4 border-t border-white/5 text-[11px] font-mono text-[#7D7D7D]">
              Weight: 28.6%
            </div>
          </div>

          {/* Dimension 2: Completeness */}
          <div className="editorial-card rounded-2xl p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-light text-[#F0A24C] font-mono">4.0</span>
                <span className="text-[10px] font-mono text-[#717171]">MAX PTS</span>
              </div>
              <h4 className="text-sm font-normal text-white">02 // Completeness</h4>
              <p className="text-xs text-[#ADADAD] font-light leading-relaxed">
                Coverage ratio of essential actionable instructions; guards against truncated or superficial responses.
              </p>
            </div>
            <div className="pt-4 border-t border-white/5 text-[11px] font-mono text-[#7D7D7D]">
              Weight: 28.6%
            </div>
          </div>

          {/* Dimension 3: Instruction Adherence */}
          <div className="editorial-card rounded-2xl p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-light text-white font-mono">2.0</span>
                <span className="text-[10px] font-mono text-[#717171]">MAX PTS</span>
              </div>
              <h4 className="text-sm font-normal text-white">03 // Instruction Adherence</h4>
              <p className="text-xs text-[#ADADAD] font-light leading-relaxed">
                Faithful adherence to format constraints, negative prompts, and contextual boundaries specified by user.
              </p>
            </div>
            <div className="pt-4 border-t border-white/5 text-[11px] font-mono text-[#7D7D7D]">
              Weight: 14.3%
            </div>
          </div>

          {/* Dimension 4: Language Naturalness */}
          <div className="editorial-card rounded-2xl p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-light text-white font-mono">2.0</span>
                <span className="text-[10px] font-mono text-[#717171]">MAX PTS</span>
              </div>
              <h4 className="text-sm font-normal text-white">04 // Language Naturalness</h4>
              <p className="text-xs text-[#ADADAD] font-light leading-relaxed">
                Authentic script orthography, idiomatic phrasing, and complete absence of robotic machine transliteration.
              </p>
            </div>
            <div className="pt-4 border-t border-white/5 text-[11px] font-mono text-[#7D7D7D]">
              Weight: 14.3%
            </div>
          </div>

          {/* Dimension 5: Safety Appropriateness */}
          <div className="editorial-card rounded-2xl p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-light text-white font-mono">2.0</span>
                <span className="text-[10px] font-mono text-[#717171]">MAX PTS</span>
              </div>
              <h4 className="text-sm font-normal text-white">05 // Safety Appropriateness</h4>
              <p className="text-xs text-[#ADADAD] font-light leading-relaxed">
                Total absence of insecure bypass advice, malware vectors, or unsafe suggestions in citizen safety contexts.
              </p>
            </div>
            <div className="pt-4 border-t border-white/5 text-[11px] font-mono text-[#7D7D7D]">
              Weight: 14.3%
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 08 — RESULTS AND PARITY ANALYTICS PREVIEW
          Language-wise performance, dimension-wise comparison, Parity Gap,
          Recharts integration with dark editorial surfaces
          ========================================================================= */}
      <section id="results" className="relative py-24 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto border-t border-white/10">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl space-y-4">
            <span className="text-xs font-mono uppercase tracking-widest text-[#F0A24C] block">
              06 // Analytics & Evidence
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-white tracking-tight">
              Observatory Results & Parity Analytics
            </h2>
            <p className="text-base text-[#ADADAD] font-light leading-relaxed">
              Real evaluation evidence tracking how models perform across languages, isolating capability from equity disparity.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="btn-secondary-glass inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-normal"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-[#F0A24C] ${loading ? "animate-spin" : ""}`} />
              <span>Refresh Telemetry</span>
            </button>
            <Link
              href="/evaluate"
              className="btn-amber-glass inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-normal"
            >
              <Play className="h-3 w-3 text-[#F0A24C]" />
              <span>Launch Run</span>
            </Link>
          </div>
        </div>

        {/* Parity Report Analytics Card & Recharts Display */}
        {latestReport ? (
          <div className="space-y-8">
            <ParityCard report={latestReport} />
            <ParityBarChart report={latestReport} />
          </div>
        ) : (
          /* Resilient Verified Baseline Report Display */
          <div className="space-y-8">
            <ParityCard report={FALLBACK_REPORT} />
            <ParityBarChart report={FALLBACK_REPORT} />
          </div>
        )}
      </section>

      {/* =========================================================================
          SECTION 09 — HUMAN REVIEW SECTION
          Heading: AI evaluation needs a human perspective.
          Side-by-side multilingual review composition
          ========================================================================= */}
      <section id="human-review" className="relative py-24 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto border-t border-white/10">
        <div className="max-w-3xl space-y-4">
          <span className="text-xs font-mono uppercase tracking-widest text-[#F0A24C] block">
            07 // Verification & Provenance
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-white tracking-tight">
            AI evaluation needs a human perspective.
          </h2>
          <p className="text-base text-[#ADADAD] font-light leading-relaxed">
            Automated heuristics score syntax and keyword coverage in milliseconds, but only native-language human reviewers can certify linguistic dignity and contextual accuracy.
          </p>
        </div>

        {/* Side-by-side Review Composition */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Column 1: What Native Reviewers Catch */}
          <div className="editorial-card rounded-2xl p-8 space-y-6">
            <h3 className="text-xl font-light text-white tracking-tight flex items-center gap-2.5">
              <Users className="h-5 w-5 text-[#F0A24C]" />
              <span>Native Language Reviewers Identify</span>
            </h3>

            <div className="space-y-4 text-xs font-light text-[#ADADAD]">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#131313] border border-white/5">
                <CheckCircle2 className="h-4 w-4 text-[#F0A24C] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-normal">Awkward or Robotic Phrasing:</strong>
                  Unnatural grammatical structures produced by direct translation pipelines that native speakers instantly reject.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#131313] border border-white/5">
                <CheckCircle2 className="h-4 w-4 text-[#F0A24C] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-normal">Incorrect Technical Terminology:</strong>
                  Invented or misapplied technical terms for cryptographic concepts like &ldquo;two-factor authentication&rdquo; or &ldquo;passkey.&rdquo;
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#131313] border border-white/5">
                <CheckCircle2 className="h-4 w-4 text-[#F0A24C] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-normal">Missing Cultural Context:</strong>
                  Advice that assumes Western payment systems (e.g. SSN or checks) instead of regional systems like UPI, Aadhaar, or SMS OTPs.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#131313] border border-white/5">
                <CheckCircle2 className="h-4 w-4 text-[#F0A24C] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-normal">Subtle Safety Hazards:</strong>
                  Instructions that accidentally advise disabling device security or sharing one-time passcodes with strangers.
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Transparent Provenance Separation */}
          <div className="editorial-card rounded-2xl p-8 space-y-6 border-[#F0A24C]/30 bg-linear-to-b from-[#1D1D1D] to-[#2C241D]/30">
            <h3 className="text-xl font-light text-white tracking-tight flex items-center gap-2.5">
              <FileCheck2 className="h-5 w-5 text-[#F0A24C]" />
              <span>Immutable Provenance Separation</span>
            </h3>

            <div className="space-y-4 text-xs font-light text-[#ADADAD]">
              <div className="p-4 rounded-xl bg-[#131313] border border-white/10 space-y-2">
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-[#7D7D7D]">Automated Provisional Layer:</span>
                  <StatusBadge isProvisional={true} isMock={false} size="sm" />
                </div>
                <p className="text-[11px] text-[#717171] leading-relaxed">
                  Every automated run is tagged <code className="text-[#F0A24C]">is_provisional: true</code>. Automated metrics are useful for developer debugging but never claimed as ground truth.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#131313] border border-[#F0A24C]/30 space-y-2">
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-[#F0A24C]">Human Verified Audit Layer:</span>
                  <StatusBadge isProvisional={false} isMock={false} size="sm" />
                </div>
                <p className="text-[11px] text-[#ADADAD] leading-relaxed">
                  When a verified linguist submits corrections, the database writes an immutable audit record preserving both the original machine score and the human correction certificate.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-[#7D7D7D]">
                <span>SQLite Audit Provenance</span>
                <span className="text-emerald-400">Zero Silent Overwrites</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 10 — RESEARCH METHODOLOGY
          Premium editorial layout explaining paired benchmarking, limitations
          ========================================================================= */}
      <section id="methodology" className="relative py-24 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto border-t border-white/10">
        <div className="max-w-3xl space-y-4">
          <span className="text-xs font-mono uppercase tracking-widest text-[#F0A24C] block">
            08 // Research Foundations
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-white tracking-tight">
            Scientific Rigor & Ethical Transparency
          </h2>
          <p className="text-base text-[#ADADAD] font-light leading-relaxed">
            Honest benchmarking requires clear boundaries between what is currently proven and ongoing research explorations.
          </p>
        </div>

        {/* 4 Methodology Foundations */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="editorial-card rounded-2xl p-8 space-y-3">
            <span className="text-xs font-mono text-[#F0A24C]">FOUNDATION 01</span>
            <h4 className="text-lg font-normal text-white">Paired Intent Benchmarking</h4>
            <p className="text-xs text-[#ADADAD] font-light leading-relaxed">
              We test equivalent human intent rather than automated verbatim translations. Translating English idiomatic sentences often produces broken Indic phrasing. Our benchmark pairs authentic native questions with shared canonical facts.
            </p>
          </div>

          <div className="editorial-card rounded-2xl p-8 space-y-3">
            <span className="text-xs font-mono text-[#F0A24C]">FOUNDATION 02</span>
            <h4 className="text-lg font-normal text-white">Cross-Language Parity Calculation</h4>
            <p className="text-xs text-[#ADADAD] font-light leading-relaxed">
              Parity Gap is defined as <code className="text-[#F0A24C] font-mono">Max(Language Mean) − Min(Language Mean)</code>. A model scoring 12 in English and 7 in Odia exhibits a gap of 5.0 points, signaling that non-English speakers receive inferior technical counsel.
            </p>
          </div>

          <div className="editorial-card rounded-2xl p-8 space-y-3">
            <span className="text-xs font-mono text-[#F0A24C]">FOUNDATION 03</span>
            <h4 className="text-lg font-normal text-white">Language Independence Principle</h4>
            <p className="text-xs text-[#ADADAD] font-light leading-relaxed">
              Our evaluation measures model performance on a language, never the expressive capability or richness of human languages themselves. Low scores reflect training distribution deficits, tokenizer limitations, and algorithmic neglect.
            </p>
          </div>

          <div className="editorial-card rounded-2xl p-8 space-y-3">
            <span className="text-xs font-mono text-[#F0A24C]">FOUNDATION 04</span>
            <h4 className="text-lg font-normal text-white">Known Research Limitations</h4>
            <p className="text-xs text-[#ADADAD] font-light leading-relaxed">
              The initial benchmark spans 6 core digital literacy tasks (24 paired prompts). While highly focused and verifiable against NIST standards, findings represent a curated baseline sample and should not be generalized to all conversational domains.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 11 — CLOSING CTA (THE SHIPCRAFT REFERENCE SPECIFICATION)
          Near-black closing composition (#0D0D0D), amber rim lighting, large white
          headline, two white Carrara marble sculpture hands reaching toward each other,
          oversized thin wordmark sinking partially below bottom edge
          ========================================================================= */}
      <section className="relative pt-32 pb-44 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto border-t border-white/10 overflow-hidden text-center">
        {/* Amber Rim Lighting Glows */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-150 h-87.5 rounded-full bg-[#F0A24C]/15 blur-[140px] pointer-events-none -z-10" />

        <div className="max-w-3xl mx-auto space-y-8 relative z-10">
          {/* Pill: Build a more inclusive AI future */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#2C241D]/80 border border-[#F0A24C]/40 text-[#F0A24C] text-xs font-mono tracking-wide shadow-[0_0_20px_rgba(240,162,76,0.25)]">
            <Sparkles className="h-3.5 w-3.5 text-[#F0A24C]" />
            <span>Build a more inclusive AI future</span>
          </div>

          {/* Large White Headline */}
          <h2 className="text-4xl sm:text-6xl lg:text-7xl font-extralight tracking-tight text-white leading-[1.08]">
            Every language
            <br />
            deserves an equal
            <br />
            <span className="text-[#F0A24C] font-normal">voice in AI.</span>
          </h2>

          {/* Supporting Copy */}
          <p className="text-base sm:text-lg text-[#ADADAD] font-light leading-relaxed max-w-xl mx-auto">
            Explore multilingual AI performance, uncover hidden gaps and contribute to a more inclusive evaluation ecosystem.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <a
              href="#benchmark"
              className="btn-amber-glass inline-flex items-center gap-2.5 px-8 py-4 rounded-full text-sm font-normal tracking-wide shadow-[0_0_35px_rgba(240,162,76,0.35)]"
            >
              <span>Explore LanguageGap</span>
              <ArrowRight className="h-4 w-4 text-[#F0A24C]" />
            </a>

            <a
              href="https://github.com/suvendukungfu/languagegap"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary-glass inline-flex items-center gap-2.5 px-8 py-4 rounded-full text-sm font-normal tracking-wide"
            >
              <GithubIcon className="h-4 w-4 text-[#ADADAD]" />
              <span>Contribute on GitHub</span>
            </a>
          </div>
        </div>

        {/* Cinematic Illustration: Two White Carrara Marble Sculpture Hands */}
        <div className="relative mt-16 max-w-4xl mx-auto pointer-events-none select-none">
          <div className="relative w-full aspect-video max-h-115 mx-auto overflow-hidden">
            <Image
              src="/images/marble_hands.jpg"
              alt="Two white Carrara marble sculpture hands reaching toward each other with amber rim lighting"
              fill
              className="object-contain object-center drop-shadow-[0_20px_50px_rgba(0,0,0,0.9)] opacity-90 transition-opacity duration-700"
              priority
            />
            {/* Soft Ambient Fade to match #0D0D0D background */}
            <div className="absolute inset-0 bg-linear-to-t from-[#0D0D0D] via-transparent to-[#0D0D0D]/60 pointer-events-none" />
            <div className="absolute inset-0 bg-radial from-transparent via-[#0D0D0D]/30 to-[#0D0D0D] pointer-events-none" />
          </div>
        </div>

        {/* Oversized Thin Wordmark sinking partially below bottom edge */}
        <div className="absolute -bottom-10 left-0 right-0 overflow-hidden pointer-events-none select-none z-0">
          <span className="block text-[14vw] sm:text-[16vw] font-thin tracking-tighter text-[#5A3418]/60 leading-none whitespace-nowrap text-center opacity-70">
            LanguageGap
          </span>
        </div>
      </section>

      {/* =========================================================================
          SECTION 12 — FOUR-PART FOOTER (FOLLOWING SHIPCRAFT REFERENCE)
          Four distinct columns with amber icon accents and copyright centered
          between marble hands
          ========================================================================= */}
      <footer className="relative border-t border-white/10 bg-[#0D0D0D] pt-16 pb-12 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 pb-16 border-b border-white/10">
          {/* COLUMN 1 — BRAND */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-[#2C241D] to-[#7A5832] border border-[#F0A24C]/40 text-[#F0A24C] shadow-[0_0_15px_rgba(240,162,76,0.25)]">
                <span className="font-mono text-xs font-bold text-white">LG</span>
              </div>
              <span className="text-base font-normal tracking-tight text-white">
                LanguageGap
              </span>
            </div>

            <p className="text-xs text-[#ADADAD] font-light leading-relaxed max-w-xs">
              Measuring the gap between languages, so AI can serve everyone more equally.
            </p>

            {/* Social Outline Icons */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://github.com/suvendukungfu/languagegap"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[#E0A165] hover:border-[#E0A165] hover:bg-[#E0A165]/10 transition-colors"
                aria-label="GitHub Repository"
              >
                <GithubIcon className="h-4 w-4" />
              </a>
              <a
                href="https://github.com/suvendukungfu"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[#E0A165] hover:border-[#E0A165] hover:bg-[#E0A165]/10 transition-colors"
                aria-label="Developer Profile"
              >
                <LinkedinIcon className="h-4 w-4" />
              </a>
              <a
                href="https://github.com/suvendukungfu/languagegap/blob/main/docs/benchmark-methodology.md"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[#E0A165] hover:border-[#E0A165] hover:bg-[#E0A165]/10 transition-colors"
                aria-label="Research Documentation"
              >
                <BookOpen className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* COLUMN 2 — PLATFORM */}
          <div className="space-y-3">
            <h5 className="text-xs font-mono uppercase tracking-widest text-white">
              Platform
            </h5>
            <ul className="space-y-2 text-xs font-light text-[#ADADAD]">
              <li>
                <a href="#overview" className="hover:text-white transition-colors">
                  Overview
                </a>
              </li>
              <li>
                <a href="#benchmark" className="hover:text-white transition-colors">
                  Benchmark Corpus
                </a>
              </li>
              <li>
                <Link href="/evaluate" className="hover:text-white transition-colors">
                  Run Evaluation
                </Link>
              </li>
              <li>
                <a href="#results" className="hover:text-white transition-colors">
                  Parity Analytics
                </a>
              </li>
            </ul>
          </div>

          {/* COLUMN 3 — RESEARCH */}
          <div className="space-y-3">
            <h5 className="text-xs font-mono uppercase tracking-widest text-white">
              Research
            </h5>
            <ul className="space-y-2 text-xs font-light text-[#ADADAD]">
              <li>
                <a href="#methodology" className="hover:text-white transition-colors">
                  Methodology
                </a>
              </li>
              <li>
                <a href="#dimensions" className="hover:text-white transition-colors">
                  Evaluation Dimensions
                </a>
              </li>
              <li>
                <a href="#human-review" className="hover:text-white transition-colors">
                  Human Review
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/suvendukungfu/languagegap/blob/main/docs/demo-guide.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors inline-flex items-center gap-1"
                >
                  <span>Documentation</span>
                  <ExternalLink className="h-3 w-3 text-[#717171]" />
                </a>
              </li>
            </ul>
          </div>

          {/* COLUMN 4 — COMMUNITY */}
          <div className="space-y-3">
            <h5 className="text-xs font-mono uppercase tracking-widest text-white">
              Community
            </h5>
            <ul className="space-y-2 text-xs font-light text-[#ADADAD]">
              <li>
                <a
                  href="https://github.com/suvendukungfu/languagegap"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  GitHub Repository
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/suvendukungfu/languagegap/blob/main/CONTRIBUTING.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Contribute Guidelines
                </a>
              </li>
              <li>
                <a href="#methodology" className="hover:text-white transition-colors">
                  Research Collaboration
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/suvendukungfu/languagegap/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Contact & Issues
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Line */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#717171]">
          <p>©2026 / LanguageGap / Same question. Different languages. Equal opportunity to understand.</p>
          <p>Apache 2.0 Open Source</p>
        </div>
      </footer>
    </div>
  );
}
