export function isTextComponentContentType(contentType?: string | null) {
  return contentType ? /\btext\/x\-component\b/.test(contentType) : false;
}
