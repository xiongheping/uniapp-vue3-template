const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

/**
 * Base64 编码（仅支持 ASCII 字符，小程序端无 btoa）
 */
export function encodeBase64(input: string): string {
  let output = '';
  for (let i = 0; i < input.length; i += 3) {
    const c1 = input.charCodeAt(i) & 0xFF;
    const c2 = input.charCodeAt(i + 1);
    const c3 = input.charCodeAt(i + 2);
    const has2 = !Number.isNaN(c2);
    const has3 = !Number.isNaN(c3);
    const bits = (c1 << 16) | ((has2 ? c2 : 0) << 8) | (has3 ? c3 : 0);
    output += CHARS.charAt((bits >> 18) & 0x3F);
    output += CHARS.charAt((bits >> 12) & 0x3F);
    output += has2 ? CHARS.charAt((bits >> 6) & 0x3F) : '=';
    output += has3 ? CHARS.charAt(bits & 0x3F) : '=';
  }
  return output;
}

/**
 * SVG 源码转 image 组件可用的 data URI
 * @param svg 需为 ASCII（如含中文请自行 urlencode）
 */
export function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;base64,${encodeBase64(svg)}`;
}
