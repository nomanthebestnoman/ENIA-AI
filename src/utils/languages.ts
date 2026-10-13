import { LanguageOption } from '../types';

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: 'en-US',
    label: 'English',
    nativeLabel: 'English',
    flag: '🇬🇧',
  },
  {
    code: 'it-IT',
    label: 'Italian',
    nativeLabel: 'Italiano',
    flag: '🇮🇹',
  },
  {
    code: 'ur-PK',
    label: 'Urdu',
    nativeLabel: 'اردو',
    flag: '🇵🇰',
  },
];

export function getLanguageTestPhrase(langCode: string, voiceName?: string): string {
  if (langCode === 'ur-PK') {
    if (voiceName === 'Aoede') {
      return 'السلام علیکم! میں اینیا ہوں، نوجوان لڑکی کی شوخ اور پیاری آواز کے ساتھ! بتائیں اج ہم کیا بات کریں گے؟';
    }
    if (voiceName === 'Boy') {
      return 'السلام علیکم! میں اینیا ہوں، نوجوان لڑکے کی شوخ اور پرجوش آواز کے ساتھ! بتائیں کیا نیا کرنا ہے؟';
    }
    if (voiceName === 'Charon') {
      return 'السلام علیکم! میں اینیا ہوں۔ یہ میری بھاری اور پروقار آواز ہے، میں آپ کی خدمت میں حاضر ہوں۔';
    }
    if (voiceName === 'Zephyr') {
      return 'السلام علیکم! میں اینیا ہوں۔ یہ میری نرم، دھیمی اور پرسکون آواز ہے۔ آپ کو کیسی لگی؟';
    }
    if (voiceName === 'Fenrir') {
      return 'السلام علیکم! میں اینیا ہوں، صاف اور واضح آواز کے ساتھ۔ فرمائیے میں آپ کی کیا مدد کروں؟';
    }
    // Default Kore (ہلکی اور پیاری آواز)
    return 'السلام علیکم! میں اینیا ہوں۔ یہ میری ہلکی اور پیاری آواز ہے، بتائیے میں آپ کی کیا مدد کروں؟';
  }

  if (langCode === 'it-IT') {
    if (voiceName === 'Aoede') {
      return 'Ciao! Sono ENIA con la voce fresca, vivace e melodica di una giovane ragazza! Come posso aiutarti oggi?';
    }
    if (voiceName === 'Charon') {
      return 'Ciao! Sono ENIA con voce profonda e autorevole. Come posso aiutarti oggi?';
    }
    if (voiceName === 'Boy') {
      return 'Ciao! Sono ENIA, il tuo assistente brillante ed energico! Che cosa facciamo oggi?';
    }
    if (voiceName === 'Zephyr') {
      return 'Ciao! Sono ENIA con una voce dolce, calma e rilassante.';
    }
    return 'Ciao! Sono ENIA, il tuo assistente vocale intelligente. Questa è la mia voce melodiosa.';
  }

  if (voiceName === 'Aoede') {
    return 'Hello! I am ENIA with a youthful, sweet, and melodic young girl voice! Ready to chat whenever you are!';
  }
  if (voiceName === 'Charon') {
    return 'Hello! I am ENIA speaking with a deep, authoritative, and resonant voice.';
  }
  if (voiceName === 'Boy') {
    return 'Hey there! I am ENIA with a lively, energetic boy voice! Ready when you are!';
  }
  if (voiceName === 'Zephyr') {
    return 'Hello! I am ENIA with a calm, gentle, and soothing tone.';
  }
  if (voiceName === 'Fenrir') {
    return 'Hello! I am ENIA with crisp, clear, and articulate diction.';
  }
  return 'Hello! I am ENIA with a soft, warm, and natural conversational voice.';
}

export function getLiveTalkOpeningGreeting(langCode: string): string {
  if (langCode === 'ur-PK') {
    return 'السلام علیکم! آپ کا کیا حال ہے؟ میں اینیا ہوں، مجھے بنانے والا نعمان ہے۔ آپ فرمائیے، میں آپ کی کیا مدد کر سکتی ہوں؟';
  }
  if (langCode === 'it-IT') {
    return 'Assalam-o-Alaikum! Ciao, come stai? Sono ENIA, creata da Noman. Come posso aiutarti oggi?';
  }
  return "Assalam-o-Alaikum! Hello, how are you? I'm ENIA, created by Noman. How can I help you today?";
}
