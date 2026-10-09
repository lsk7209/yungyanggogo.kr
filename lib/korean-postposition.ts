/**
 * 한국어 받침 유무에 따른 자연스러운 조사 처리 유틸리티
 * 괄호 병기(은/는, 이/가) 없이 맥락에 맞는 올바른 조사를 합성합니다.
 */

export type JosaType = "은/는" | "이/가" | "을/를" | "과/와" | "으로/로" | "의";

/**
 * 주어진 문자열의 마지막 글자에 받침(종성)이 있는지 판별합니다.
 */
export function hasJongseong(text: string): boolean {
  if (!text || text.trim().length === 0) return false;
  const trimmed = text.trim();
  const lastChar = trimmed[trimmed.length - 1];
  const code = lastChar.charCodeAt(0);

  // 한글 음절 범위: 0xAC00 (가) ~ 0xD7A3 (힣)
  if (code >= 0xac00 && code <= 0xd7a3) {
    const jongseong = (code - 0xac00) % 28;
    return jongseong > 0;
  }

  // 숫자 받침 판별 (0, 1, 3, 6, 7, 8 은 받침 있음)
  if (/[013678]$/.test(trimmed)) {
    return true;
  }
  if (/[2459]$/.test(trimmed)) {
    return false;
  }

  // 영문 알파벳 끝글자 (l, m, n, r 등 비음/유음 계열 받침 체감)
  if (/[lmnr]$/i.test(trimmed)) {
    return true;
  }

  return false;
}

/**
 * 단어에 적절한 조사를 선택하여 반환합니다.
 */
export function getJosa(word: string, josaType: JosaType): string {
  const hasJong = hasJongseong(word);

  switch (josaType) {
    case "은/는":
      return hasJong ? "은" : "는";
    case "이/가":
      return hasJong ? "이" : "가";
    case "을/를":
      return hasJong ? "을" : "를";
    case "과/와":
      return hasJong ? "과" : "와";
    case "의":
      return "의";
    case "으로/로": {
      // 'ㄹ' 받침(종성 인덱스 8)인 경우 '로'를 사용
      const trimmed = word.trim();
      if (trimmed.length > 0) {
        const code = trimmed[trimmed.length - 1].charCodeAt(0);
        if (code >= 0xac00 && code <= 0xd7a3) {
          const jong = (code - 0xac00) % 28;
          if (jong === 8) return "로";
        }
      }
      return hasJong ? "으로" : "로";
    }
    default:
      return "";
  }
}

/**
 * 단어 뒤에 자연스러운 조사를 덧붙여 반환합니다.
 * @example appendJosa("신라면", "은/는") => "신라면은"
 * @example appendJosa("사과", "이/가") => "사과가"
 */
export function appendJosa(word: string, josaType: JosaType): string {
  return `${word}${getJosa(word, josaType)}`;
}
