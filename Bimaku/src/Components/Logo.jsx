import { useTampilan } from "../Utils/Tampilan";
import logoBawaan from "../Assets/logo.png";

export function Logo({ size = 40, className = "", polos = false }) {
  const { judul } = useTampilan();
  const pad = Math.round(size * 0.07);
  const gaya = polos
    ? { flex: "none", objectFit: "contain", filter: "drop-shadow(0 4px 8px rgba(15,107,107,.25))" }
    : { flex: "none", objectFit: "contain", boxSizing: "border-box", padding: pad, borderRadius: Math.round(size * 0.29), background: "#fff", filter: "drop-shadow(0 6px 12px rgba(15,107,107,.3))" };
  return <img src={logoBawaan} alt={"Logo " + judul} width={size} height={size} className={className} style={gaya} />;
}

export function Wordmark({ tone = "#0f6b6b", style }) {
  const { judul } = useTampilan();
  const [depan, ...sisa] = judul.split("-");
  return (
    <span style={{ fontWeight: 800, letterSpacing: "-.01em", ...style }}>
      <span style={{ color: tone }}>{depan}</span>{sisa.length ? "-" + sisa.join("-") : ""}
    </span>
  );
}
