"use client";

import { useEffect, useMemo, useState } from "react";
import Image, { type ImageProps } from "next/image";
import { isBlockedImageSource } from "@/lib/product-fallbacks";

type SafeProductImageProps = Omit<ImageProps, "src"> & {
  src?: string | null;
  fallbackText?: string;
  preventNotFoundLog?: boolean;
};

export function SafeProductImage({
  src,
  alt,
  fill,
  className,
  fallbackText = "próximamente",
  preventNotFoundLog = false,
  onError,
  ...props
}: SafeProductImageProps) {
  const normalizedSrc = useMemo(() => {
    if (typeof src !== "string") return "";
    const trimmedSrc = src.trim();

    if (!trimmedSrc || isBlockedImageSource(trimmedSrc)) {
      return "";
    }

    return trimmedSrc;
  }, [src]);

  const [hasError, setHasError] = useState(false);
  const [isCheckingSrc, setIsCheckingSrc] = useState(false);
  const [isSrcAvailable, setIsSrcAvailable] = useState(true);

  useEffect(() => {
    setHasError(false);
    setIsCheckingSrc(false);
    setIsSrcAvailable(true);
  }, [normalizedSrc]);

  useEffect(() => {
    if (!preventNotFoundLog || normalizedSrc.length === 0 || !normalizedSrc.startsWith("/uploads/")) {
      return;
    }

    let active = true;
    setIsCheckingSrc(true);

    fetch(normalizedSrc, { method: "HEAD", cache: "no-store" })
      .then((response) => {
        if (!active) return;
        setIsSrcAvailable(response.ok);
      })
      .catch(() => {
        if (!active) return;
        setIsSrcAvailable(false);
      })
      .finally(() => {
        if (!active) return;
        setIsCheckingSrc(false);
      });

    return () => {
      active = false;
    };
  }, [preventNotFoundLog, normalizedSrc]);

  const showFallback =
    normalizedSrc.length === 0
    || hasError
    || (preventNotFoundLog && (isCheckingSrc || !isSrcAvailable));

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