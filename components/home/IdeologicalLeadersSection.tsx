/**
 * Home "ideological leaders" (கொள்கை தலைவர்கள்) section. Pure presentational
 * markup extracted verbatim from app/page.tsx; `.rv`/`.spot` classes are animated
 * by DOM-query effects in the parent, so they must stay exactly as written.
 */
export default function IdeologicalLeadersSection() {
  return (
    <section className="dark sec-pad" data-cursor="gold" data-rail="முன்னோர்" id="leaders">
      <div className="wrap">
        <div className="sec-head center">
          <span className="sec-eyebrow">வழிகாட்டும் விளக்குகள்</span>
          <h2>கொள்கை தலைவர்கள்</h2>
          <p>சமூக நீதி, சமத்துவம், விடுதலை — இவ்வியக்கத்தின் வேர்கள் இவர்களின் வாழ்வில் ஊன்றியவை.</p>
        </div>
        <div className="lgrid">
          <div className="lcard spot rv">
            <div className="lphoto"><img src="https://www.tvknamakkaleast.com/assets/images/periar.jpg" alt="பெரியார்"
              data-fb="பெ" /></div>
            <h3>பெரியார்</h3>
            <p>மூடநம்பிக்கைகளை எதிர்த்து சமூக நீதியை நிலைநாட்டிய பகுத்தறிவு தந்தை.</p>
          </div>
          <div className="lcard spot rv rv-d1">
            <div className="lphoto"><img src="https://www.tvknamakkaleast.com/assets/images/ambedkar.jpeg" alt="அம்பேத்கர்"
              data-fb="அ" /></div>
            <h3>அம்பேத்கர்</h3>
            <p>இந்திய அரசியலமைப்பின் சிற்பி மற்றும் ஒடுக்கப்பட்ட மக்களின் விடிவெள்ளி.</p>
          </div>
          <div className="lcard spot rv rv-d2">
            <div className="lphoto"><img src="https://www.tvknamakkaleast.com/assets/images/kamarajar.jpeg" alt="காமராஜர்"
              data-fb="கா" /></div>
            <h3>காமராஜர்</h3>
            <p>இலவசக் கல்வி தந்து ஏழை எளியோரின் வாழ்வை உயர்த்திய கர்மவீரர்.</p>
          </div>
          <div className="lcard spot rv rv-d3">
            <div className="lphoto"><img src="https://www.tvknamakkaleast.com/assets/images/velu.jpg" alt="வேலு நாச்சியார்"
              data-fb="வே" /></div>
            <h3>வேலு நாச்சியார்</h3>
            <p>ஆங்கிலேய ஆதிக்கத்தை எதிர்த்துப் போரிட்ட முதல் தமிழ்ப்பெண் அரசி.</p>
          </div>
          <div className="lcard spot rv rv-d4">
            <div className="lphoto"><img src="https://www.tvknamakkaleast.com/assets/images/anjalai.jpeg" alt="அஞ்சலை அம்மாள்"
              data-fb="அ" /></div>
            <h3>அஞ்சலை அம்மாள்</h3>
            <p>தேச விடுதலைக்காகத் தன் வாழ்வை அர்ப்பணித்த தென்னாட்டு ஜான்சி ராணி.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
