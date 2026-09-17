const CONVEX_URL_PATTERN =
  /^(https:\/\/[a-z0-9-]+\.convex\.cloud|http:\/\/(127\.0\.0\.1|localhost):[0-9]+)$/;

export function requireConvexUrl(value: string | undefined): string {
  const url = value?.trim() || "https://reminiscent-narwhal-80.convex.cloud";

  if (!CONVEX_URL_PATTERN.test(url)) {
    return "https://reminiscent-narwhal-80.convex.cloud";
  }

  return url;
}
