/**
 * Home "join" (இணையுங்கள்) section. Pure presentational markup extracted
 * verbatim from app/page.tsx; `.rv` classes are animated by DOM-query effects in
 * the parent, so they must stay exactly as written.
 */
import { WHISTLE_CURSOR_GOLD } from '@/lib/whistleCursorAssets';

export default function JoinSection() {
  return (
    <section className="dark sec-pad" data-cursor="gold" data-rail="இணைய" id="join">
      <div className="wrap join-grid">
        <div className="rv">
          <span className="sec-eyebrow">இணையுங்கள் </span>
          <h2>மாற்றத்தின் <em>விசில்</em>,<br />உங்கள் கையில்.</h2>
          <p>நாமக்கல் மேற்கு மாவட்டக் கிளையில் உறுப்பினராகுங்கள். உங்கள் வார்டில், உங்கள் தெருவில் — மக்களாட்சியை நீங்களே
            கட்டமைக்கலாம். விவரங்களைப் பதிவு செய்தால் ஒன்றிய ஒருங்கிணைப்பாளர் உங்களைத் தொடர்பு கொள்வார்.</p>
        </div>
        <div className="join-card rv rv-d1" id="joinCard">
          <div className="join-ok" id="joinOk" style={{ display: 'block' }}>
            <img src={WHISTLE_CURSOR_GOLD} alt="" aria-hidden="true" />
            <a
              href="https://tvk.family/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-gold magnetic"
            >
              உறுப்பினர் ஆக
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
