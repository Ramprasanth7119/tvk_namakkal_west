/**
 * Home "movement at a glance" stats band. Pure presentational markup extracted
 * verbatim from app/page.tsx. The count-up (`[data-count]`) and reveal (`.rv`)
 * animations are driven by DOM-query effects in the parent home page, so the
 * class names and data attributes here must stay exactly as the parent expects.
 */
export default function StatsSection() {
  return (
    <section className="stats sec-pad" data-cursor="maroon" data-rail="புள்ளிவிவரம்" id="stats" style={{ paddingBottom: 0 }}>
      <div className="wrap">
        <div className="sec-head">
          <span className="sec-eyebrow">இயக்கம் — ஒரு பார்வையில்</span>
          <h2>இரண்டே ஆண்டுகளில்,<br />ஒரு வரலாறு.</h2>
        </div>
      </div>
      <div className="wrap grid">
        <div className="stat rv"><b data-count="2024">0</b><span>கட்சி தொடக்கம் · பிப்ரவரி 2</span></div>
        <div className="stat rv rv-d1"><b><span className="num" data-count="1.5" data-dec="1">0</span><span
          className="unit">கோடி+</span></b><span>உறுப்பினர்கள் (2025)</span></div>
        <div className="stat rv rv-d2"><b data-count="234">0</b><span>தொகுதிகளில் களம்</span></div>
        <div className="stat rv rv-d3"><b data-count="2026">0</b><span>மக்கள் அளித்த ஆட்சி</span></div>
      </div>
    </section>
  );
}
