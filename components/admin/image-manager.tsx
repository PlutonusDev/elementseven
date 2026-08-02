"use client";

import { useActionState, useRef } from "react";
import { deleteProductImageAction, uploadProductImageAction } from "@/lib/actions/admin/products";
import { Alert } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

type Image = { id: string; url: string; alt: string };

export function ImageManager({ productId, images }: { productId: string; images: Image[] }) {
  const [state, formAction] = useActionState(uploadProductImageAction, null);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <section className="border border-mist bg-white p-5">
      <h2 className="font-display text-sm font-bold">Images</h2>
      <p className="mt-1 text-xs text-slate">Stored on local disk via the storage interface (swap for S3 later).</p>

      {images.length > 0 ? (
        <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((image) => (
            <li key={image.id} className="group relative border border-mist bg-[#f1f2ef]">
              <img src={image.url} alt={image.alt} className="aspect-square w-full object-cover" />
              <form action={deleteProductImageAction} className="absolute top-1 right-1">
                <input type="hidden" name="id" value={image.id} />
                <button
                  type="submit"
                  aria-label="Delete image"
                  className="flex h-6 w-6 items-center justify-center border border-ink bg-paper text-xs font-bold text-ink opacity-0 transition-opacity group-hover:opacity-100 hover:bg-alert hover:text-paper focus-visible:opacity-100"
                >
                  ✕
                </button>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 border border-dashed border-mist px-3 py-6 text-center text-xs text-slate">
          No images yet.
        </p>
      )}

      <form
        action={(fd) => {
          formAction(fd);
          fileRef.current && (fileRef.current.value = "");
        }}
        className="mt-4 flex flex-wrap items-center gap-2"
      >
        <input type="hidden" name="productId" value={productId} />
        <input
          ref={fileRef}
          type="file"
          name="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml,image/avif,image/gif"
          required
          className="text-[13px] file:mr-3 file:border file:border-ink file:bg-paper file:px-3 file:py-1.5 file:text-[13px] file:font-medium"
        />
        <SubmitButton size="sm" pendingText="Uploading…">
          Upload
        </SubmitButton>
      </form>

      {state?.message && (
        <Alert tone={state.ok ? "success" : "error"} className="mt-3">
          {state.message}
        </Alert>
      )}
    </section>
  );
}
