/**
 * Home "our principles" (நமது கொள்கை விளக்கங்கள்) section. Pure presentational
 * markup extracted verbatim from app/page.tsx; `.rv` classes are animated by
 * DOM-query effects in the parent, so they must stay exactly as written.
 */
export default function PrinciplesSection() {
  return (
    <section className="pr-sec sec-pad" data-cursor="maroon" data-rail="கொள்கை" id="principles">
      <div className="wrap">
        <div className="sec-head">
          <span className="sec-eyebrow">Our Principles</span>
          <h2>நமது கொள்கை<br />விளக்கங்கள்</h2>
        </div>
        <div className="pgrid">
          <div className="pcard rv">
            <div className="pemblem">⚖️</div>
            <div>
              <h3>சமூக நீதி</h3>
              <p>சாதி, மத பேதமின்றி அனைத்து மக்களுக்கும் சமமான வாய்ப்புகள் மற்றும் உரிமைகளை உறுதி செய்தல்.</p>
            </div>
          </div>
          <div className="pcard rv rv-d1">
            <div className="pemblem">🤝</div>
            <div>
              <h3>சமத்துவம்</h3>
              <p>"பிறப்பொக்கும் எல்லா உயிர்க்கும்" — பிறப்பின் அடிப்படையில் உயர்வு தாழ்வு இல்லாத சமுதாயம் அமைத்தல்.</p>
            </div>
          </div>
          <div className="pcard rv rv-d2">
            <div className="pemblem">💎</div>
            <div>
              <h3>ஊழலற்ற நிர்வாகம்</h3>
              <p>மக்களின் வரிப்பணம் மக்களுக்கே சென்றடைவதை உறுதி செய்யும் நேர்மையான அரசியல் பாதை.</p>
            </div>
          </div>
          <div className="pcard rv rv-d3">
            <div className="pemblem">🌱</div>
            <div>
              <h3>மனிதநேயம்</h3>
              <p>அதிகார அரசியலுக்கு மாற்றாக, எளிய மக்களின் துயர் துடைக்கும் மனிதநேய அரசியலை முன்னெடுத்தல்.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
