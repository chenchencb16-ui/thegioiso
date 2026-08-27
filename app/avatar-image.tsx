const avatarAssets = [
  "/assets/avatars/web/ava1.png",
  "/assets/avatars/web/ava2.png",
  "/assets/avatars/web/ava3.png",
  "/assets/avatars/web/ava4.png",
  "/assets/avatars/web/ava5.png",
  "/assets/avatars/web/ava6.png",
  "/assets/avatars/web/ava7.png",
  "/assets/avatars/web/ava8.png",
] as const;

export const avatarOptions = avatarAssets.map((_, index) => index);

export function AvatarImage({ index, className = "" }: { index: number; className?: string }) {
  const safeIndex = Number.isInteger(index) && index >= 0 && index < avatarAssets.length ? index : 0;
  return <span className={`avatar-image ${className}`} aria-hidden="true"><img src={avatarAssets[safeIndex]} alt="" draggable="false" /></span>;
}
