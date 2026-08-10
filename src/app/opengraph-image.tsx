import { ImageResponse } from "next/og";

export const alt = "SHUZAM — Choose with insight.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0d1424",
          backgroundImage:
            "radial-gradient(circle at 22% 22%, rgba(182,243,28,0.22), transparent 55%), radial-gradient(circle at 82% 78%, rgba(47,184,196,0.18), transparent 55%)",
        }}
      >
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
          <path
            d="M 82 38 C 82 24 68 17 52 20 C 36 23 27 33 32 44 C 37 54 50 56 59 60 C 72 66 85 71 82 84 C 79 96 63 101 47 96"
            stroke="#B6F31C"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="82" cy="38" r="8.5" fill="#B6F31C" />
          <circle cx="32" cy="44" r="6" fill="#B6F31C" />
          <circle cx="59" cy="60" r="6.5" fill="#B6F31C" />
          <circle cx="82" cy="84" r="6" fill="#B6F31C" />
          <circle cx="47" cy="96" r="8.5" fill="#B6F31C" />
          <line x1="88" y1="30" x2="97" y2="20" stroke="#B6F31C" strokeWidth="4" strokeLinecap="round" />
          <circle cx="99" cy="17.5" r="3.8" fill="#B6F31C" />
        </svg>
        <div
          style={{
            marginTop: 32,
            fontSize: 84,
            fontWeight: 700,
            letterSpacing: "0.02em",
            color: "#f3f5fa",
            display: "flex",
          }}
        >
          SHUZAM
        </div>
        <div
          style={{
            marginTop: 12,
            fontSize: 32,
            color: "#8d97b3",
            display: "flex",
          }}
        >
          Choose with insight.
        </div>
      </div>
    ),
    { ...size },
  );
}
