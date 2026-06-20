import { TVK_LOGO } from "@/lib/brand";

type TvkAppFooterProps = {
  tagline?: string;
};

export default function TvkAppFooter({
  tagline = "மக்கள் குரல் மையம்",
}: TvkAppFooterProps) {
  return (
    <footer className="dfoot">
      <img src={TVK_LOGO} alt="" className="dfoot-whistle" aria-hidden="true" />
      <p>
        © 2026 நாமக்கல் மேற்கு — தமிழக வெற்றிக் கழகம் · <b>பிறப்பொக்கும் எல்லா உயிர்க்கும்</b>
      </p>
      <span className="demo">{tagline}</span>
    </footer>
  );
}
