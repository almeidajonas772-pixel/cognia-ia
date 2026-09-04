"use client";

import { useRef, useState } from "react";
import { ArrowUp, ImagePlus, X, Square } from "lucide-react";

export type PendingImage = { dataUrl: string; name: string };

const MAX_IMAGES = 4;
const MAX_BYTES = 4 * 1024 * 1024;

export function Composer({
  onSend,
  onStop,
  streaming,
  placeholder = "Pergunte qualquer coisa sobre suas matérias...",
  autoFocus = false,
}: {
  onSend: (text: string, images: PendingImage[]) => void;
  onStop?: () => void;
  streaming: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const [text, setText] = useState("");
  const [images, setImages] = useState<PendingImage[]>([]);
  const [imgError, setImgError] = useState<string | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function grow() {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }

  function submit() {
    const t = text.trim();
    if ((!t && images.length === 0) || streaming) return;
    onSend(t, images);
    setText("");
    setImages([]);
    setImgError(null);
    requestAnimationFrame(grow);
  }

  async function addFiles(files: FileList | null) {
    if (!files) return;
    setImgError(null);
    const next: PendingImage[] = [];
    for (const file of Array.from(files)) {
      if (images.length + next.length >= MAX_IMAGES) break;
      if (!file.type.startsWith("image/")) continue;
      if (file.size > MAX_BYTES) {
        setImgError("Cada imagem deve ter até 4 MB.");
        continue;
      }
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      next.push({ dataUrl, name: file.name });
    }
    if (next.length) setImages((imgs) => [...imgs, ...next].slice(0, MAX_IMAGES));
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-2">
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 p-1">
          {images.map((img, i) => (
            <div
              key={i}
              className="relative h-16 w-16 overflow-hidden rounded-lg border border-border"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.dataUrl}
                alt={img.name}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() =>
                  setImages((imgs) => imgs.filter((_, idx) => idx !== i))
                }
                aria-label="Remover imagem"
                className="absolute right-0.5 top-0.5 grid h-5 w-5 place-items-center rounded-full bg-black/70 text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {imgError && (
        <p className="px-2 pb-1 text-xs text-rose-400">{imgError}</p>
      )}

      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          aria-label="Anexar imagem"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted hover:bg-white/5 hover:text-foreground"
        >
          <ImagePlus className="h-5 w-5" />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => addFiles(e.target.files)}
        />

        <textarea
          ref={taRef}
          value={text}
          autoFocus={autoFocus}
          onChange={(e) => {
            setText(e.target.value);
            grow();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder={placeholder}
          className="max-h-[200px] flex-1 resize-none bg-transparent py-2 text-sm text-foreground placeholder:text-muted focus:outline-none"
        />

        {streaming ? (
          <button
            type="button"
            onClick={onStop}
            aria-label="Parar"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/10 text-foreground hover:bg-white/15"
          >
            <Square className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={!text.trim() && images.length === 0}
            aria-label="Enviar"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary text-white hover:bg-primary-hover disabled:opacity-40"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
