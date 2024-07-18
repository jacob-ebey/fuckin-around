export function isTextComponentContentType(contentType?: string | null) {
  return contentType ? /\btext\/x\-component\b/.test(contentType) : false;
}

export function cleanRemoteName(name: string) {
  return name.replace(/[^\w]/g, "_");
}
