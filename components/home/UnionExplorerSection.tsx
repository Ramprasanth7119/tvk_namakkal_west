/**
 * Home "union explorer" (என் தெரு, என் திட்டம்) section. Presentational only:
 * the parent home page owns the `unions` data, the `selectedUnion`/count state,
 * and the animated `onPick` handler. Markup (incl. `.rv` reveal + element ids)
 * is verbatim so the parent's DOM-query animations keep working.
 */
interface UnionExplorerSectionProps {
  unions: (string | number)[][];
  selectedUnion: number;
  unionWards: number;
  unionBooths: number;
  unionVols: number;
  onPick: (index: number) => void;
}

export default function UnionExplorerSection({
  unions,
  selectedUnion,
  unionWards,
  unionBooths,
  unionVols,
  onPick,
}: UnionExplorerSectionProps) {
  return (
    <section className="dark sec-pad" data-cursor="gold" data-rail="என் தெரு" id="plan">
      <div className="wrap">
        <div className="sec-head center">
          <span className="sec-eyebrow">என் தெரு, என் திட்டம் </span>
          <h2>உங்கள் ஒன்றியத்தைத் தேர்வு செய்யுங்கள்</h2>
          <p>ஒன்றிய வாரியாக கள அமைப்பு, பூத் குழுக்கள் மற்றும் ஒருங்கிணைப்பாளர் விவரங்கள்.</p>
        </div>
        <div className="uchips" id="uchips">
          {unions.map((u, i) => (
            <button
              key={i}
              className={`uchip ${selectedUnion === i ? 'active' : ''}`}
              onClick={() => onPick(i)}
            >
              {u[0]}
            </button>
          ))}
        </div>
        <div className="upanel rv" id="upanel">
          <div className="ubox"><b id="uWards">{unionWards}</b><span>வார்டுகள் / ஊராட்சிகள்</span></div>
          <div className="ubox"><b id="uBooths">{unionBooths}</b><span>பூத் குழுக்கள்</span></div>
          <div className="ubox"><b id="uVols">{unionVols}</b><span>தொண்டர்கள்</span></div>
        </div>
        <p className="unote">* மாதிரித் தரவுகள் (Demo) — மாவட்ட நிர்வாகம் தரும் உண்மையான எண்ணிக்கைகள் இங்கே இணைக்கப்படும்.</p>
      </div>
    </section>
  );
}
