import Image from "next/image";

interface ContemporaryPortraitProps {
  name: string;
  image?: string;
  focus?: string;
  priority?: boolean;
  /** Gateway cards crop to the face; story heroes preserve the whole image. */
  fit?: "cover" | "contain";
  /**
   * next/image `sizes`. Defaults to the full viewport, which is right for the
   * story hero; the gateway grid must pass its own, or every card downloads a
   * full-width image to display in a third of one.
   */
  sizes?: string;
}

export default function ContemporaryPortrait({
  name,
  image,
  focus = "50% 30%",
  priority = false,
  fit = "cover",
  sizes = "100vw",
}: ContemporaryPortraitProps) {
  if (image) {
    if (fit === "contain") {
      return (
        <>
          <Image
            src={image}
            alt=""
            fill
            priority={priority}
            sizes={sizes}
            aria-hidden
            className="scale-105 object-cover opacity-25"
            style={{ objectPosition: focus }}
          />
          <Image
            src={image}
            alt={`Portrait of ${name}`}
            fill
            priority={priority}
            sizes={sizes}
            className="object-contain"
          />
        </>
      );
    }

    return (
      <Image
        src={image}
        alt={`Portrait of ${name}`}
        fill
        priority={priority}
        sizes={sizes}
        className="object-cover"
        style={{ objectPosition: focus }}
      />
    );
  }

  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("");

  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      role="img"
      aria-label={`Portrait placeholder for ${name}`}
      style={{
        background:
          "radial-gradient(circle at 50% 30%, rgba(232,226,212,0.13), transparent 24%), linear-gradient(145deg, #24242a 0%, #131317 52%, #0b0b0d 100%)",
      }}
    >
      <div className="text-center">
        <span className="block font-serif text-7xl text-parchment/35 sm:text-9xl">
          {initials}
        </span>
        <span className="mt-5 block text-[10px] uppercase tracking-[0.32em] text-muted/70">
          Portrait forthcoming
        </span>
      </div>
    </div>
  );
}
