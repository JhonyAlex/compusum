"use client";

import { useEffect, useMemo, useState } from "react";
import Image, { type ImageProps } from "next/image";

type SafeProductImageProps = Omit<ImageProps, "src"> & {
  src?: string | null;
  fallbackText?: string;
};

export function SafeProductImage({
  src,
  alt,
  fill,
  className,
  fallbackText = "Próximamente",
  onError,
  ...props
}: SafeProductImageProps) {
  const normalizedSrc = useMemo(() => {
    if (typeof src !== "string") return "";
    return src.trim();
  }, [src]);

  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [normalizedSrc]);

  const showFallback = normalizedSrc.length === 0 || hasError;

  if (showFallback) {
    return (
      <div
        className={`${fill ? "absolute inset-0" : "h-full w-full"} flex items-center justify-center bg-slate-100 text-slate-500 text-[10px] font-medium uppercase tracking-wide text-center px-2`}
        role="img"
        aria-label={`${alt} sin imagen`}
      >
        {fallbackText}
      </div>
    );
  }

  return (
    <Image
      {...props}
      src={normalizedSrc}
      alt={alt}
      fill={fill}
      className={className}
      onError={(event) => {
        setHasError(true);
        onError?.(event);
      }}
    />
  );
}