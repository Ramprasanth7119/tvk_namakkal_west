import { cookies } from "next/headers";
import { translations, Language } from "@/constants/translations";

export async function getBackendT() {
  const cookieStore = await cookies();
  const langCookie = cookieStore.get("tvk_pref_lang");
  const lang: Language = (langCookie?.value as Language) || "ta";

  return function t(key: string, variables?: Record<string, string | number>): string {
    const langDict = translations[lang] || translations["ta"];
    let text = langDict[key];
    
    // Fallback to Tamil if translation is missing in English
    if (text === undefined) {
      text = translations["ta"][key];
    }
    
    // Fallback to key name if completely missing
    if (text === undefined) {
      return key;
    }

    if (variables) {
      Object.entries(variables).forEach(([k, v]) => {
        text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      });
    }

    return text;
  };
}
