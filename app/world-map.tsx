export type WorldView = "world" | "social" | "shorts" | "chat" | "game" | "browser" | "mail" | "profile";

type WorldMapProps = {
  nickname: string;
  avatar: string;
  open: (view: WorldView) => void;
};

const islands: { id: Exclude<WorldView, "world" | "profile">; label: string; subtitle: string; asset: string; position: string }[] = [
  { id: "social", label: "Social Zone", subtitle: "Kết nối & Chia sẻ", asset: "/assets/world/social-zone.png", position: "north-west" },
  { id: "shorts", label: "Video ngắn", subtitle: "Xem & Khám phá", asset: "/assets/world/short-video.png", position: "north-east" },
  { id: "chat", label: "Chat Hub", subtitle: "Trò chuyện", asset: "/assets/world/chat-hub.png", position: "mid-west" },
  { id: "game", label: "Pixel Quest", subtitle: "Game & Thử thách", asset: "/assets/world/pixel-quest.png", position: "mid-east" },
  { id: "mail", label: "Mail Station", subtitle: "Thư & Thông tin", asset: "/assets/world/mail-station.png", position: "south-west" },
  { id: "browser", label: "Web Gate", subtitle: "Khám phá Web", asset: "/assets/world/web-gate.png", position: "south-east" },
];

export function WorldMap({ nickname, avatar, open }: WorldMapProps) {
  return (
    <section className="island-world">
      <div className="island-world-intro">
        <div>
          <p className="eyebrow">THẾ GIỚI SỐ • ONLINE</p>
          <h1>Chào, <span>{nickname}!</span></h1>
          <p>Hôm nay bạn muốn khám phá đâu trong thế giới số?</p>
        </div>
      </div>

      <div className="island-map" aria-label="Bản đồ các khu vực trong thế giới số">
        <span className="map-cloud cloud-one" aria-hidden="true" />
        <span className="map-cloud cloud-two" aria-hidden="true" />
        <span className="map-cloud cloud-three" aria-hidden="true" />
        <svg className="island-routes" viewBox="0 0 1000 720" preserveAspectRatio="none" aria-hidden="true">
          <path d="M500 360 L500 95" />
          <path d="M500 360 L760 190" />
          <path d="M500 360 L760 535" />
          <path d="M500 360 L500 635" />
          <path d="M500 360 L240 535" />
          <path d="M500 360 L240 190" />
        </svg>

        {islands.map((island) => (
          <button
            className={`island-place island-${island.position}`}
            key={island.id}
            onClick={() => open(island.id)}
            aria-label={`Mở ${island.label}: ${island.subtitle}`}
          >
            <span className="island-art">
              <img src={island.asset} alt={`Đảo ${island.label}`} draggable="false" />
            </span>
            <span className="island-label">
              <strong>{island.label}</strong>
              <small>{island.subtitle}</small>
            </span>
          </button>
        ))}

        <button className="profile-hub" onClick={() => open("profile")} aria-label="Mở Hồ sơ">
          <span className="profile-hub-orbit" aria-hidden="true"><i>{avatar}</i></span>
          <strong>Hồ sơ</strong>
          <small>Danh tính của bạn trong thế giới số</small>
        </button>
      </div>
    </section>
  );
}
