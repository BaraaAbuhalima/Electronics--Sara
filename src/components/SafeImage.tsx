"use client";
import { useState } from "react";
export default function SafeImage({
  src,
  alt,
  className = "",
  ...rest
}: {
  src: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  return (
    <img
      {...rest}
      src={failedSource === src ? "/images/fallback.svg" : src}
      alt={alt}
      className={className}
      onError={() => setFailedSource(src)}
    />
  );
}
