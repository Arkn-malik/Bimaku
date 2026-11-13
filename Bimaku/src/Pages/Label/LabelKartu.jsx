import { useApp } from "../../Context/AppContext";
import { isiLabel } from "../../Utils/Referensi";

export default function LabelKartu({ a }) {
  const { referensi } = useApp();
  const l = isiLabel(a, referensi);
  return (
    <div className="lb-label lb-ex">
      <div className="lb-h">
        <h2>ARSIP DOKUMEN KEUANGAN</h2>
        <h3>{l.judul}</h3>
        <h3>TA {l.ta}</h3>
      </div>
      <div className="lb-box">
        <dl>
          {l.baris.map((r) => <div key={r.k}><dt>{r.k}</dt><dd>: {r.v}</dd></div>)}
        </dl>
      </div>
    </div>
  );
}
