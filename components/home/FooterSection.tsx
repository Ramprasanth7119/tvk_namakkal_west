/**
 * Home footer (தொடர்பு / புகார்). Presentational; the parent passes the
 * complaint-modal opener. Markup is verbatim from app/page.tsx.
 */
import Image from 'next/image';
import { TVK_LOGO } from '@/lib/brand';
import { CONSTITUENCIES } from '@/lib/constituencies';

interface FooterSectionProps {
  onComplaintClick: () => void;
}

export default function FooterSection({ onComplaintClick }: FooterSectionProps) {
  return (
    <footer id="contact">
      <div className="fstripe"></div>
      <div className="f-word">தமிழக வெற்றிக் கழகம்</div>
      <div className="f-inner">
        <div className="f-brand">
          <a className="brand" href="#top">
            <Image src={TVK_LOGO} alt="TVK" width={36} height={36} style={{ objectFit: 'contain' }} />
            <span><small>TVK · Namakkal West</small><b style={{ color: 'var(--gold-3)' }}>தமிழக வெற்றிக் கழகம்</b></span>
          </a>
          <p>நாமக்கல் மேற்கு மாவட்டம் — கட்சி அலுவலக முகவரி, அலைபேசி எண் மற்றும் மின்னஞ்சல் இங்கே இணைக்கப்படும்.</p>
        </div>
        <div>
          <h4>விரைவு இணைப்புகள்</h4>
          <a href="#top">முகப்பு</a>
          <a href="#events">நிகழ்வுகள்</a>
          <a href="#complaint" onClick={(e) => { e.preventDefault(); onComplaintClick(); }}>குறைதீர் மனு</a>
          <a href="#plan">என் தெரு, என் திட்டம்</a>
          <a href="#join">இணையுங்கள்</a>
        </div>
        <div>
          <h4>தொடர்பு / புகார்</h4>
          {CONSTITUENCIES.map((c, idx) => (
            <a key={idx} href="#contact"> {c}</a>
          ))}
        </div>
      </div>
      <div className="f-bottom">© 2026 நாமக்கல் மேற்கு — தமிழக வெற்றிக் கழகம் · <b>பிறப்பொக்கும் எல்லா உயிர்க்கும்</b> ·
        Premium demo build</div>
    </footer>
  );
}
