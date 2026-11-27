
import React from "react";
import { PlayCircleFilled, LinkOutlined } from "@ant-design/icons";
import "./LinkPreview.css";

interface Props {
  url: string;
}

function getYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.slice(1).split("/")[0] || null;
    }

    if (
      parsed.hostname.includes("youtube.com") ||
      parsed.hostname.includes("youtube-nocookie.com")
    ) {
      if (parsed.pathname === "/watch") {
        return parsed.searchParams.get("v");
      }

      const match = parsed.pathname.match(
        /\/(?:embed|shorts)\/([^/?]+)/
      );

      return match?.[1] ?? null;
    }
  } catch {
    return null;
  }

  return null;
}

const LinkPreview: React.FC<Props> = ({ url }) => {
  const videoId = getYouTubeId(url);

  let hostname = url;

  try {
    hostname = new URL(url).hostname.replace(/^www\./, "");
  } catch {}

  return (
    <a
      className="message-link-preview"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(event) => event.stopPropagation()}
    >
      {videoId ? (
        <>
          <div className="youtube-preview-image">
            <img
              src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
              alt="YouTube video thumbnail"
              loading="lazy"
            />
            <PlayCircleFilled className="youtube-play-icon" />
          </div>

          <div className="link-preview-details">
            <strong>YouTube video</strong>
            <span>{hostname}</span>
          </div>
        </>
      ) : (
        <div className="link-preview-details">
          <LinkOutlined />
          <strong>{hostname}</strong>
          <span>{url}</span>
        </div>
      )}
    </a>
  );
};

export default LinkPreview;
