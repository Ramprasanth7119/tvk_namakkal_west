/**
 * Home "leadership / org" (இயக்கத்தின் ஆளுமைகள்) section. Pure presentational
 * markup extracted verbatim from app/page.tsx; `.rv`/`.spot` classes are animated
 * by DOM-query effects in the parent, so they must stay exactly as written.
 */
export default function LeadershipSection() {
  return (
    <section className="sec-pad" data-cursor="maroon" data-rail="தலைமை" id="org">
      <div className="wrap">
        <div className="sec-head center">
          <span className="sec-eyebrow">Leadership</span>
          <h2>இயக்கத்தின் ஆளுமைகள்</h2>
          <p>மாநிலத் தலைமை முதல் மாவட்ட நிர்வாகம் வரை — ஒரே அணி, ஒரே இலக்கு.</p>
        </div>
        <div className="org-grid">
          <div className="ocard spot rv">
            <div className="ophoto"><span className="obadge">தலைமை</span>
              <img src="/vijaycm.jpg" alt="ஜோசப் விஜய் சந்திரசேகர்" data-fb="வி" width="100%" />
            </div>
            <div className="obody">
              <h3>சி. ஜோசப் விஜய்</h3><span>தலைவர், தமிழக வெற்றிக் கழகம் · தமிழ்நாடு முதலமைச்சர்</span>
            </div>
          </div>
          <div className="ocard spot rv rv-d1">
            <div className="ophoto"><span className="obadge">மாநிலம்</span>
              <img src="https://www.tvknamakkaleast.com/assets/images/anand.png" alt="புஸ்ஸி என். ஆனந்த்" data-fb="ஆ" />
            </div>
            <div className="obody">
              <h3>புஸ்ஸி என். ஆனந்த்</h3><span>பொதுச் செயலாளர், தமிழக வெற்றிக் கழகம்</span>
            </div>
          </div>
          <div className="ocard spot rv rv-d2">
            <div className="ophoto"><span className="obadge">மாவட்டம்</span>
              <img src="/sathish.jpeg" alt="மாவட்டச் செயலாளர்" data-fb="ந" />
            </div>
            <div className="obody">
              <h3>என். சதீஷ்</h3><span>மாவட்டச் செயலாளர், நாமக்கல் மேற்கு</span>
            </div>
          </div>
          {/* <div className="ocard spot rv rv-d3">
          <div className="ophoto"><span className="obadge">மாவட்டம்</span>
            <img src={undefined} alt="மாவட்ட துணைச் செயலாளர்" data-fb="ந" />
          </div>
          <div className="obody">
            <h3>[பெயர் சேர்க்கவும்]</h3><span>மாவட்ட துணைச் செயலாளர், நாமக்கல் மேற்கு</span>
          </div>
        </div> */}
        </div>
      </div>
    </section>
  );
}
