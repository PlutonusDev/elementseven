"use client";

import { useState } from "react";
import { cx } from "@/components/ui";

export type GalleryImage = { url: string; alt: string };

export function Gallery({ images, name }: { images: GalleryImage[]; name: string }) {
  const [index, setIndex] = useState(0);
  const current = images[index] ?? images[0];

  if (!current) {
    return <div className="aspect-square border border-mist bg-[#f1f2ef]" aria-hidden="true" />;
  }

  return (
    <div>
      <div className="aspect-square overflow-hidden border border-mist bg-[#f1f2ef]">
        <img
          src={current.url}
          alt={current.alt || name}
          width={800}
          height={800}
          className="h-full w-full object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2" role="group" aria-label="Product images">
          {images.map((image, i) => (
            <button
              key={image.url}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show image ${i + 1} of ${images.length}`}
              aria-current={i === index}
              className={cx(
                "h-16 w-16 overflow-hidden border bg-[#f1f2ef] transition-colors",
                i === index ? "border-ink" : "border-mist hover:border-slate",
              )}
            >
              <img src={image.url} alt="" width={64} height={64} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
