import pixAsset from "@/assets/pix.png.asset.json";

export function PixIcon({ className = "h-4 w-4" }: { className?: string }) {
  return <img src={pixAsset.url} alt="" aria-hidden="true" className={`${className} shrink-0 object-contain`} />;
}