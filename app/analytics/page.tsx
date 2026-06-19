'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import './analytics.css';

const CATEGORIES: Record<string, string[]> = {
  "மின்சாரம்": ["மின்கம்பம் பழுது", "அடிக்கடி மின்தடை", "தொங்கும் மின் கம்பிகள்", "பிற"],
  "சாலை": ["சாலை சேதம்", "புதிய சாலை தேவை", "வேகத்தடை தேவை", "பிற"],
  "குடிநீர்": ["குடிநீர் குழாய் உடைப்பு", "குடிநீர் வராமை", "அசுத்தமான குடிநீர்", "பிற"],
  "கழிவுநீர்": ["சாக்கடை அடைப்பு", "கழிவுநீர் தேக்கம்", "பிற"],
  "சுகாதாரம்": ["குப்பை அள்ளப்படவில்லை", "கொசு மருந்து தெளிக்க வேண்டும்", "பிற"],
  "போக்குவரத்து": ["பேருந்து வசதி குறைபாடு", "போக்குவரத்து நெரிசல்", "பிற"],
  "தெருவிளக்கு": ["தெருவிளக்கு எரியவில்லை", "புதிய தெருவிளக்கு கம்பம் தேவை", "பிற"],
  "கல்வி": ["பள்ளி கட்டிட பழுது", "பள்ளி கழிப்பறை வசதி", "பிற"],
  "மருத்துவம்": ["ஆரம்ப சுகாதார நிலையம்", "மருந்து தட்டுப்பாடு", "பிற"],
  "அரசு நலத்திட்டம்": ["முதியோர் உதவித்தொகை", "ரேஷன் கடை குறைபாடு", "பிற"],
  "வருவாய் துறை": ["பட்டா மாறுதல்", "சான்றிதழ் கோரிக்கை", "பிற"],
  "காவல்துறை": ["பாதுகாப்பு குறைபாடு", "புகார் மனு மீது நடவடிக்கை", "பிற"],
  "சுற்றுச்சூழல்": ["நீர்நிலை மாசுபடுதல்", "காற்று மாசுபடுதல்", "பிற"],
  "பிற": ["பிற குறைபாடுகள்"]
};

// Reference data matching the original page exactly
const AREAS = [
  "அனைத்தும்",
  "குமாரபாளையம்",
  "திருச்செங்கோடு",
  "பரமத்தி வேலூர்",
  "மல்லசமுத்திரம்",
  "சேந்தமங்கலம்",
  "ராசிபுரம்"
];

const SECTORS = [
  { key: "road", name: "சாலை & போக்குவரத்து", color: "#A00000" },
  { key: "water", name: "குடிநீர் வழங்கல்", color: "#1F7A8C" },
  { key: "power", name: "மின் வசதி", color: "#E08600" },
  { key: "light", name: "தெருவிளக்கு", color: "#C7A008" },
  { key: "drain", name: "கழிவுநீர் & துப்புரவு", color: "#5E8C3A" },
  { key: "health", name: "மக்கள் நலன் & சுகாதாரம்", color: "#B5322B" },
  { key: "edu", name: "கல்வி", color: "#7A5BA6" },
  { key: "civic", name: "பொது வசதிகள்", color: "#9A5B12" },
];

const SECMAP = Object.fromEntries(SECTORS.map(s => [s.key, s]));

const TITLES: Record<string, string[]> = {
  road: ["மெயின் ரோடு பள்ளம் — விபத்து அபாயம்", "பேருந்து நிறுத்தம் கூரை சேதம்", "சாலை மீள்தார் பூசுதல் தேவை", "இரு சக்கர வாகன பாலம் பழுது", "கிராம இணைப்புச் சாலை மண்சரிவு"],
  water: ["குடிநீர் குழாய் உடைப்பு", "வாரம் ஒருமுறை மட்டுமே நீர் வழங்கல்", "மேல்நிலை நீர்த்தொட்டி கசிவு", "கைபம்ப் பழுதடைந்துள்ளது", "குடிநீரில் கலர் மாற்றம்"],
  power: ["மின் கம்பம் சாய்ந்துள்ளது", "அடிக்கடி மின்தடை", "டிரான்ஸ்பார்மர் பழுது", "தொங்கும் மின் கம்பிகள் — ஆபத்து", "புதிய மின் இணைப்பு தாமதம்"],
  light: ["தெருவிளக்கு எரியவில்லை", "பேருந்து நிலையத்தில் விளக்கு தேவை", "விளக்குக் கம்பம் துருப்பிடித்தது", "பூங்காவில் இருட்டு — பாதுகாப்பு"],
  drain: ["சாக்கடை அடைப்பு — வழிந்தோடுகிறது", "குப்பை அள்ளப்படவில்லை", "கொசு ஒழிப்பு மருந்து தெளிப்பு தேவை", "திறந்த வெளி கழிவு — சுகாதாரக் கேடு"],
  health: ["ஆரம்ப சுகாதார நிலையம் மருந்து பற்றாக்குறை", "மொபைல் கிளினிக் தேவை", "குழந்தைகள் தடுப்பூசி முகாம் கோரிக்கை", "மருத்துவ ஆம்புலன்ஸ் தாமதம்"],
  edu: ["அரசுப் பள்ளி கூரை சேதம்", "பள்ளியில் கழிப்பறை வசதி இல்லை", "நூலகம் & படிப்பகம் தேவை", "இடைநிலை மாணவர் பேருந்து வசதி"],
  civic: ["பூங்கா பராமரிப்பு இல்லை", "பொதுக் கழிப்பிடம் சுத்தம் தேவை", "குளம் தூர்வாரம் கோரிக்கை", "மயானச் சாலை மேம்பாடு", "சந்தை கூடம் பழுது"],
};

const CITIZENS = ["முருகன்", "லட்சுமி", "கார்த்திக்", "அன்பரசி", "செல்வம்", "தமிழ்ச்செல்வி", "ராஜேஷ்", "கலைவாணி", "வடிவேல்", "பிரியா", "குமார்", "மீனா", "சிவா", "ஜோதி", "பாலா"];
const RESOLVERS = ["மாவட்டச் செயலாளர் அணி", "ஒன்றிய ஒருங்கிணைப்பாளர்", "வார்டுப் பொறுப்பாளர்", "இளைஞரணி குழு", "மாவட்ட நிர்வாகி"];
const MONTHS = ["ஜன", "பிப்", "மார்", "ஏப்", "மே", "ஜூன்"];
const STATUSES = [
  ["all", "அனைத்தும்"],
  ["ok", "தீர்க்கப்பட்டது"],
  ["warn", "நடவடிக்கையில்"],
  ["pend", "பதிவில்"]
];

// Deterministic seed-based mock data generator
let seed = 20260613;
function rnd() {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rnd() * arr.length)];
}

interface Complaint {
  id: string;
  sector: string;
  area: string;
  title: string;
  by: string;
  month: number;
  date: string;
  status: 'ok' | 'warn' | 'pend';
  resolver: string | null;
}

function genData(): Complaint[] {
  const rows: Complaint[] = [];
  let id = 1042;
  const areas = AREAS.slice(1);
  for (let i = 0; i < 78; i++) {
    const sec = pick(SECTORS).key;
    const area = pick(areas);
    const title = pick(TITLES[sec]);
    const m = Math.floor(rnd() * 6); // 0..5 (Jan..Jun)
    const day = 1 + Math.floor(rnd() * 27);
    const base = [0.82, 0.8, 0.74, 0.66, 0.55, 0.4][m];
    const r = rnd();
    const status = r < base ? "ok" : (r < base + 0.22 ? "warn" : "pend");
    rows.push({
      id: "NMK-" + (id++),
      sector: sec,
      area,
      title,
      by: pick(CITIZENS) + ", " + area.split(" ")[0],
      month: m,
      date: `${String(day).padStart(2, '0')}/${String(m + 1).padStart(2, '0')}/26`,
      status,
      resolver: status === "ok" ? pick(RESOLVERS) : null
    });
  }
  return rows;
}

const DATA = genData();

// Animated counter component
function AnimatedNumber({ value, dec = 0 }: { value: number; dec?: number }) {
  const [displayVal, setDisplayVal] = useState(0);

  useEffect(() => {
    let active = true;
    const start = performance.now();
    const duration = 900;
    const from = displayVal;

    const step = (now: number) => {
      if (!active) return;
      const progress = Math.max(0, Math.min(1, (now - start) / duration));
      const eased = 1 - Math.pow(1 - progress, 3); // easeOut
      setDisplayVal(from + (value - from) * eased);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setDisplayVal(value);
      }
    };

    requestAnimationFrame(step);
    return () => {
      active = false;
    };
  }, [value]);

  return <span>{displayVal.toFixed(dec)}</span>;
}

export default function AnalyticsDashboard() {
  const [curArea, setCurArea] = useState("அனைத்தும்");
  const [curStatus, setCurStatus] = useState("all");
  const [curSearch, setCurSearch] = useState("");
  const [demoMode, setDemoMode] = useState(true);
  const [dbData, setDbData] = useState<Complaint[]>([]);

  // Whistle Cursor effect
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePtr = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
    let cursorOn = finePtr && !reduced;

    if (!cursorOn) return;

    const wcur = document.getElementById('wcur');
    const clabel = document.getElementById('clabel');
    if (!wcur || !clabel) return;

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let cx = mx;
    let cy = my;
    let pvx = 0;
    let rafId = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
    };

    const handleMouseOver = (e: MouseEvent) => {
      const hoverSel = 'a,button,input,select,textarea,.fchip,.uchip,.hot,.spot,.kpi,.insight-card,.const-stat-card,.timeline-item';
      const t = (e.target as HTMLElement).closest(hoverSel) as HTMLElement | null;
      document.body.classList.toggle('chover', !!t);
      if (t && clabel) {
        clabel.textContent = t.dataset.clabel || t.closest('[data-clabel]')?.getAttribute('data-clabel') || 'தொடு';
      }
    };

    const handleTouchStart = () => {
      cursorOn = false;
      document.body.classList.remove('cursor-on', 'chover');
      cancelAnimationFrame(rafId);
    };

    document.body.classList.add('cursor-on');
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseover', handleMouseOver);
    window.addEventListener('touchstart', handleTouchStart, { once: true, passive: true });

    const clampVal = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

    const loop = () => {
      if (cursorOn && wcur) {
        const ox = cx;
        cx += (mx - cx) * 0.18;
        cy += (my - cy) * 0.18;
        pvx = pvx * 0.85 + (cx - ox) * 0.15;
        wcur.style.transform = 'translate(' + cx + 'px,' + cy + 'px) rotate(' + clampVal(pvx * 2.4, -22, 22) + 'deg)';
      }
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      document.body.classList.remove('cursor-on', 'chover');
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseover', handleMouseOver);
      cancelAnimationFrame(rafId);
    };
  }, []);

  // Complaint Popup Form State
  const [isComplaintOpen, setIsComplaintOpen] = useState(false);
  const [voterId, setVoterId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [voterVerified, setVoterVerified] = useState(false);
  const [verificationError, setVerificationError] = useState('');

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [gender, setGender] = useState('ஆண்');
  const [age, setAge] = useState('');
  const [address, setAddress] = useState('');
  const [constituency, setConstituency] = useState(AREAS[1]); // Default to first constituency
  const [ward, setWard] = useState('');
  const [areaStreet, setAreaStreet] = useState('');
  const [category, setCategory] = useState(Object.keys(CATEGORIES)[0]);
  const [subcategory, setSubcategory] = useState(CATEGORIES[Object.keys(CATEGORIES)[0]][0]);
  const [description, setDescription] = useState('');
  const [emailHoneypot, setEmailHoneypot] = useState('');
  const [urgency, setUrgency] = useState('சாதாரண');

  // Media state - Support multiple photos!
  const [photos, setPhotos] = useState<string[]>([]);
  const [video, setVideo] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Geolocation state
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isIpLocating, setIsIpLocating] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Update subcategory list when category changes
  useEffect(() => {
    setSubcategory(CATEGORIES[category][0]);
  }, [category]);

  // Fetch IP Geolocation to auto-fill address automatically when modal opens
  useEffect(() => {
    if (isComplaintOpen && !voterVerified) {
      const fetchIpLocation = async () => {
        setIsIpLocating(true);
        try {
          const res = await fetch('https://ipapi.co/json/');
          if (res.ok) {
            const data = await res.json();
            if (data.latitude && data.longitude) {
              const lat = data.latitude;
              const lon = data.longitude;
              setLatitude(lat);
              setLongitude(lon);
              
              // Use Nominatim to reverse-geocode the IP coordinates to get a real address name!
              const geocodeUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=ta,en`;
              const geoRes = await fetch(geocodeUrl, {
                headers: {
                  'User-Agent': 'TVK-Namakkal-West-Grievance-Platform'
                }
              });
              if (geoRes.ok) {
                const geoData = await geoRes.json();
                if (geoData.display_name) {
                  setAddress(geoData.display_name);
                  
                  // Auto-detect constituency from address
                  const addressLower = geoData.display_name.toLowerCase();
                  for (const constName of AREAS.slice(1)) {
                    if (addressLower.includes(constName.toLowerCase())) {
                      setConstituency(constName);
                      break;
                    }
                  }
                }
              } else {
                setAddress(`${data.city}, ${data.region}, India`);
              }
            } else if (data.city && data.region) {
              setAddress(`${data.city}, ${data.region}, India`);
            }
          }
        } catch (err) {
          console.error("Error fetching IP Geolocation:", err);
        } finally {
          setIsIpLocating(false);
        }
      };
      fetchIpLocation();
    }
  }, [isComplaintOpen, voterVerified]);

  // Handle voter verification lookup
  const handleVerifyVoter = async () => {
    if (!voterId.trim()) {
      setVerificationError('வாக்காளர் அடையாள எண் தேவை');
      return;
    }

    setIsVerifying(true);
    setVerificationError('');
    setVoterVerified(false);

    try {
      const res = await fetch('/api/voter/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voterId: voterId.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.found) {
        setVoterVerified(true);
        setName(data.voter.VoterName);
        setMobile(data.voter.Mobile);
        setWard(String(data.voter.WardNo));
        setAddress(data.voter.Address);
        
        const matchedConstituency = AREAS.find(
          c => c.toLowerCase() === data.voter.Constituency.toLowerCase()
        );
        if (matchedConstituency) {
          setConstituency(matchedConstituency);
        }
      } else {
        setVerificationError(data.message || 'வாக்காளர் அடையாளம் கண்டறியப்படவில்லை');
      }
    } catch (err) {
      console.error(err);
      setVerificationError('சரிபார்ப்பதில் பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Geolocation lookup with Nominatim reverse geocoding to get real Tamil address!
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('உங்கள் உலாவி இருப்பிட சேவையை ஆதரிக்கவில்லை.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lon);

        try {
          // Fetch real Tamil address from OpenStreetMap Nominatim API
          const geocodeUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=ta,en`;
          const geoRes = await fetch(geocodeUrl, {
            headers: {
              'User-Agent': 'TVK-Namakkal-West-Grievance-Platform'
            }
          });
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            if (geoData.display_name) {
              setAddress(geoData.display_name);
              
              // Try to auto-detect and set constituency from the Tamil address!
              const addressLower = geoData.display_name.toLowerCase();
              for (const constName of AREAS.slice(1)) {
                if (addressLower.includes(constName.toLowerCase())) {
                  setConstituency(constName);
                  break;
                }
              }
            }
          }
        } catch (err) {
          console.error("Error reverse geocoding GPS coordinates:", err);
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error(error);
        alert('இருப்பிடத்தைப் பெறுவதில் தோல்வி. அனுமதி வழங்கப்பட்டுள்ளதா எனச் சரிபார்க்கவும்.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Camera capture methods
  const startCamera = async () => {
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error(err);
      alert('கேமராவை இயக்க முடியவில்லை.');
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const videoEl = videoRef.current;
      const canvasEl = canvasRef.current;
      const context = canvasEl.getContext('2d');

      if (context) {
        canvasEl.width = videoEl.videoWidth;
        canvasEl.height = videoEl.videoHeight;
        context.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);
        const dataUrl = canvasEl.toDataURL('image/jpeg', 0.7);
        setPhotos(prev => [...prev, dataUrl]); // Add to multiple photos array!
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // File uploads
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotos(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('வீடியோ கோப்பு அளவு 10MB ஐ விடக் குறைவாக இருக்க வேண்டும்.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit form
  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!voterVerified) {
      alert('வாக்காளர் அடையாளம் சரிபார்க்கப்பட வேண்டும்.');
      return;
    }

    setIsSubmitting(true);
    setSubmissionError('');

    const payload = {
      voterId: voterId.trim(),
      voterVerified,
      ward,
      constituency,
      citizenDetails: {
        name,
        mobile,
        aadhaar: aadhaar.trim() || undefined,
        gender,
        age: age ? parseInt(age, 10) : undefined,
        address,
        areaStreet,
      },
      complaintDetails: {
        category,
        subcategory,
        description,
        urgency,
      },
      mediaUrls: {
        photos: photos.length > 0 ? photos : undefined,
        video: video || undefined,
      },
      geolocation: latitude && longitude ? { latitude, longitude } : undefined,
      email_honeypot: emailHoneypot,
    };

    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setTrackingId(data.trackingId);
        // Refresh complaints list if demoMode is off
        if (!demoMode) {
          const freshRes = await fetch('/api/complaints');
          if (freshRes.ok) {
            const raw = await freshRes.json();
            const mapped: Complaint[] = raw.map((item: any) => {
              let sector = 'civic';
              const cat = item.complaintDetails?.category;
              if (cat === 'மின்சாரம்') sector = 'power';
              else if (cat === 'சாலை' || cat === 'போக்குவரத்து') sector = 'road';
              else if (cat === 'குடிநீர்') sector = 'water';
              else if (cat === 'கழிவுநீர்' || cat === 'சுகாதாரம்') sector = 'drain';
              else if (cat === 'தெருவிளக்கு') sector = 'light';
              else if (cat === 'கல்வி') sector = 'edu';
              else if (cat === 'மருத்துவம்' || cat === 'சுற்றுச்சூழல்') sector = 'health';

              const createdDate = new Date(item.createdAt || Date.now());
              const m = createdDate.getMonth() % 6;
              const day = createdDate.getDate();
              const yearShort = String(createdDate.getFullYear()).slice(-2);

              let status: 'ok' | 'warn' | 'pend' = 'pend';
              if (item.complaintDetails?.urgency === 'அதி அவசரம்') {
                status = 'warn';
              }

              return {
                id: item.trackingId || 'NMK-0000',
                sector,
                area: item.constituency || 'குமாரபாளையம்',
                title: `${item.complaintDetails?.subcategory || ''} — ${item.complaintDetails?.description || ''}`,
                by: `${item.citizenDetails?.name || ''}, ${item.citizenDetails?.areaStreet || ''}`,
                month: m,
                date: `${String(day).padStart(2, '0')}/${String(m + 1).padStart(2, '0')}/${yearShort}`,
                status,
                resolver: null,
              };
            });
            setDbData(mapped);
          }
        }
      } else {
        setSubmissionError(data.error || 'புகாரைச் சமர்ப்பிப்பதில் பிழை ஏற்பட்டது.');
      }
    } catch (err) {
      console.error(err);
      setSubmissionError('இணைப்புப் பிழை. மீண்டும் முயற்சிக்கவும்.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!demoMode) {
      const fetchDbData = async () => {
        try {
          const res = await fetch('/api/complaints');
          if (res.ok) {
            const raw = await res.json();
            const mapped: Complaint[] = raw.map((item: any) => {
              let sector = 'civic';
              const cat = item.complaintDetails?.category;
              if (cat === 'மின்சாரம்') sector = 'power';
              else if (cat === 'சாலை' || cat === 'போக்குவரத்து') sector = 'road';
              else if (cat === 'குடிநீர்') sector = 'water';
              else if (cat === 'கழிவுநீர்' || cat === 'சுகாதாரம்') sector = 'drain';
              else if (cat === 'தெருவிளக்கு') sector = 'light';
              else if (cat === 'கல்வி') sector = 'edu';
              else if (cat === 'மருத்துவம்' || cat === 'சுற்றுச்சூழல்') sector = 'health';

              const createdDate = new Date(item.createdAt || Date.now());
              const m = createdDate.getMonth() % 6; // Keep within 0..5
              const day = createdDate.getDate();
              const yearShort = String(createdDate.getFullYear()).slice(-2);

              let status: 'ok' | 'warn' | 'pend' = 'pend';
              if (item.complaintDetails?.urgency === 'அதி அவசரம்') {
                status = 'warn';
              }

              return {
                id: item.trackingId || 'NMK-0000',
                sector,
                area: item.constituency || 'குமாரபாளையம்',
                title: `${item.complaintDetails?.subcategory || ''} — ${item.complaintDetails?.description || ''}`,
                by: `${item.citizenDetails?.name || ''}, ${item.citizenDetails?.areaStreet || ''}`,
                month: m,
                date: `${String(day).padStart(2, '0')}/${String(m + 1).padStart(2, '0')}/${yearShort}`,
                status,
                resolver: null,
              };
            });
            setDbData(mapped);
          }
        } catch (err) {
          console.error("Error fetching db data:", err);
        }
      };
      fetchDbData();
    }
  }, [demoMode]);

  const activeData = useMemo(() => {
    return demoMode ? DATA : dbData;
  }, [demoMode, dbData]);

  // Filters computed in React
  const areaFilteredData = useMemo(() => {
    return curArea === "அனைத்தும்" ? activeData : activeData.filter(d => d.area === curArea);
  }, [curArea, activeData]);

  const filteredData = useMemo(() => {
    let d = areaFilteredData;
    if (curStatus !== 'all') {
      d = d.filter(x => x.status === curStatus);
    }
    if (curSearch) {
      const searchLower = curSearch.toLowerCase();
      d = d.filter(x => 
        (x.title + x.area + x.sector + x.id).toLowerCase().includes(searchLower) ||
        SECMAP[x.sector].name.toLowerCase().includes(searchLower)
      );
    }
    return d;
  }, [areaFilteredData, curStatus, curSearch]);

  // KPI Calculations
  const stats = useMemo(() => {
    const total = areaFilteredData.length;
    const ok = areaFilteredData.filter(x => x.status === 'ok').length;
    const warn = areaFilteredData.filter(x => x.status === 'warn').length;
    const pend = areaFilteredData.filter(x => x.status === 'pend').length;
    const rate = total ? Math.round(ok / total * 100) : 0;
    return { total, ok, warn, pend, rate };
  }, [areaFilteredData]);

  // Sector maximum calculation for bar chart scaling
  const maxSectorCount = useMemo(() => {
    const counts = SECTORS.map(s => areaFilteredData.filter(x => x.sector === s.key).length);
    return Math.max(1, ...counts);
  }, [areaFilteredData]);

  // Donut SVG circumference and calculation
  const C = 2 * Math.PI * 68;
  const donutValues = useMemo(() => {
    const { ok, warn, pend } = stats;
    const t = Math.max(1, ok + warn + pend);
    return {
      okDash: `${(ok / t) * C} ${C}`,
      okOffset: 0,
      warnDash: `${(warn / t) * C} ${C}`,
      warnOffset: -(ok / t) * C,
      pendDash: `${(pend / t) * C} ${C}`,
      pendOffset: -((ok + warn) / t) * C,
    };
  }, [stats, C]);

  // Trend SVG path calculations
  const W = 900;
  const H = 220;
  const pad = 30;
  const trendData = useMemo(() => {
    const sub = MONTHS.map((_, i) => areaFilteredData.filter(x => x.month === i).length);
    const res = MONTHS.map((_, i) => areaFilteredData.filter(x => x.month === i && x.status === 'ok').length);
    const max = Math.max(1, ...sub) * 1.15;
    const x = (i: number) => pad + i * ((W - 2 * pad) / (MONTHS.length - 1));
    const y = (v: number) => H - pad - (v / max) * (H - 2 * pad);
    const line = (arr: number[]) => arr.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
    const areaP = (arr: number[]) => `${line(arr)} L${x(arr.length - 1)} ${H - pad} L${x(0)} ${H - pad} Z`;
    
    return {
      sub,
      res,
      x,
      y,
      linePathSub: line(sub),
      linePathRes: line(res),
      areaPathSub: areaP(sub),
    };
  }, [areaFilteredData]);

  // Dynamic Insights Generator
  const insights = useMemo(() => {
    const list: { title: string; desc: string; type: 'info' | 'success' | 'warning' }[] = [];
    
    // 1. Find category with most complaints in the selected area
    const catCounts: Record<string, number> = {};
    areaFilteredData.forEach(item => {
      const secName = SECMAP[item.sector]?.name || 'பொது';
      catCounts[secName] = (catCounts[secName] || 0) + 1;
    });
    let topCat = '';
    let topCatCount = 0;
    Object.entries(catCounts).forEach(([cat, count]) => {
      if (count > topCatCount) {
        topCat = cat;
        topCatCount = count;
      }
    });

    if (topCat) {
      list.push({
        title: `${curArea === 'அனைத்தும்' ? 'ஒட்டுமொத்த' : curArea} பகுதியில் ${topCat} புகார்கள் அதிகம்`,
        desc: `இப்பகுதியில் பதிவான புகார்களில் ${topCat} துறை சார்ந்த புகார்கள் அதிகபட்சமாக ${topCatCount} பதிவாகியுள்ளன.`,
        type: 'warning'
      });
    } else {
      list.push({
        title: `புகார்கள் எதுவும் இல்லை`,
        desc: `தேர்ந்தெடுக்கப்பட்ட பகுதியில் தற்போது புகார்கள் எதுவும் பதிவாகவில்லை.`,
        type: 'info'
      });
    }

    // 2. Find constituency with highest resolution rate
    if (curArea === 'அனைத்தும்') {
      const constStats = AREAS.slice(1).map(c => {
        const items = activeData.filter(d => d.area === c);
        const total = items.length;
        const ok = items.filter(d => d.status === 'ok').length;
        const rate = total ? Math.round((ok / total) * 100) : 0;
        return { name: c, total, rate };
      }).filter(c => c.total > 0);

      let bestConst = '';
      let bestRate = -1;
      constStats.forEach(c => {
        if (c.rate > bestRate) {
          bestRate = c.rate;
          bestConst = c.name;
        }
      });

      if (bestConst) {
        list.push({
          title: `${bestConst} பகுதியில் தீர்வு விகிதம் உயர்வு`,
          desc: `இப்பகுதியில் பதிவான புகார்களில் ${bestRate}% புகார்கள் வெற்றிகரமாகத் தீர்க்கப்பட்டு முதலிடத்தில் உள்ளது.`,
          type: 'success'
        });
      }

      // 3. Find constituency with most complaints
      let worstConst = '';
      let worstCount = -1;
      constStats.forEach(c => {
        if (c.total > worstCount) {
          worstCount = c.total;
          worstConst = c.name;
        }
      });

      if (worstConst) {
        list.push({
          title: `${worstConst} பகுதியில் கூடுதல் கவனம் தேவை`,
          desc: `நாமக்கல் மேற்கு மாவட்டத்தில் அதிகபட்சமாக ${worstConst} பகுதியில் ${worstCount} புகார்கள் பதிவாகியுள்ளன.`,
          type: 'info'
        });
      }
    } else {
      const okCount = areaFilteredData.filter(x => x.status === 'ok').length;
      const rate = areaFilteredData.length ? Math.round((okCount / areaFilteredData.length) * 100) : 0;
      
      list.push({
        title: `${curArea} பகுதி தீர்வு விகிதம்: ${rate}%`,
        desc: `இப்பகுதியில் மொத்தம் பதிவான ${areaFilteredData.length} புகார்களில் ${okCount} புகார்கள் தற்போதைக்குத் தீர்க்கப்பட்டுள்ளன.`,
        type: 'success'
      });

      const sortedCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
      if (sortedCats.length > 1) {
        list.push({
          title: `அடுத்தபடியாக ${sortedCats[1][0]} புகார்கள் அதிகம்`,
          desc: `இப்பகுதியில் ${sortedCats[1][0]} துறை சார்ந்த புகார்கள் ${sortedCats[1][1]} பதிவாகி இரண்டாம் இடத்தில் உள்ளன.`,
          type: 'info'
        });
      } else {
        list.push({
          title: `விரைவான தீர்வு நடவடிக்கை`,
          desc: `நாமக்கல் மேற்கு தொகுதி நிர்வாகிகள் இப்பகுதிப் புகார்களை உடனுக்குடன் ஆய்வு செய்து வருகின்றனர்.`,
          type: 'info'
        });
      }
    }

    return list;
  }, [areaFilteredData, activeData, curArea]);

  // Constituency Analytics Data
  const constituencyStats = useMemo(() => {
    return AREAS.slice(1).map(c => {
      const items = activeData.filter(d => d.area === c);
      const total = items.length;
      const ok = items.filter(d => d.status === 'ok').length;
      const warn = items.filter(d => d.status === 'warn').length;
      const pend = items.filter(d => d.status === 'pend').length;
      const rate = total ? Math.round((ok / total) * 100) : 0;
      
      const catCounts: Record<string, number> = {};
      items.forEach(item => {
        const secName = SECMAP[item.sector]?.name || 'பொது';
        catCounts[secName] = (catCounts[secName] || 0) + 1;
      });
      let topCat = 'இல்லை';
      let maxCatCount = 0;
      Object.entries(catCounts).forEach(([cat, count]) => {
        if (count > maxCatCount) {
          topCat = cat;
          maxCatCount = count;
        }
      });

      return {
        name: c,
        total,
        ok,
        warn,
        pend,
        rate,
        topCat
      };
    }).sort((a, b) => b.rate - a.rate);
  }, [activeData]);

  // Recent Activity Feed
  const recentActivities = useMemo(() => {
    return [...areaFilteredData]
      .sort((a, b) => b.id.localeCompare(a.id))
      .slice(0, 5);
  }, [areaFilteredData]);

  return (
    <div className="analytics-body">
      {/* TOP BAR */}
      <header className="topbar">
        <div className="topbar-in">
          <a className="tb-brand" href="#top">
            <img src="/tvk-logo.png" alt="TVK" />
            <span>
              <small>TVK · Namakkal West</small>
              <b>மக்கள் குரல் மையம்</b>
            </span>
          </a>
          <div className="tb-actions">
            <a
              className="tb-back"
              href="#complaint"
              onClick={(e) => {
                e.preventDefault();
                setIsComplaintOpen(true);
              }}
            >
              குறைதீர் மனு
            </a>
            <a className="tb-back" href="/">
              <svg viewBox="0 0 24 24">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              முகப்புக்குத் திரும்பு
            </a>
          </div>
        </div>
      </header>

      {/* PAGE HERO */}
      <section className="phero" id="top">
        <img className="ph-medal" src="/tvk-logo.jpeg" alt="" />
        <div className="wrap">
          <span className="ph-eyebrow">மக்கள் புகார் & தீர்வு பகுப்பாய்வு</span>
          <h1>நாமக்கல் மேற்கு — மக்கள் குரல் முகப்புப்பலகை</h1>
          <p>ஒவ்வொரு ஒன்றியத்திலும் மக்கள் பதிவு செய்த புகார்கள், அவற்றின் துறை வாரியான பிரிவு, மற்றும் தமிழக வெற்றிக் கழகம் தீர்த்த பணிகள் — அனைத்தும் ஒரே இடத்தில்.</p>
          <span className="ph-live"><i></i> நேரடித் தரவு · கடைசி புதுப்பிப்பு இன்று</span>
        </div>
      </section>

      {/* FILTER BAR */}
      <div className="filterbar">
        <div className="wrap">
          <div className="fb-row">
            <span className="fb-label">பகுதி</span>
            <div className="area-chips" id="areaChips">
              {AREAS.map((a, i) => (
                <button
                  key={i}
                  className={`achip ${curArea === a ? 'active' : ''}`}
                  onClick={() => setCurArea(a)}
                >
                  {a}
                </button>
              ))}
            </div>
            <div className="fb-search">
              <div className="fb-search-input-wrapper">
                <svg viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.3-4.3" />
                </svg>
                <input
                  type="text"
                  id="search"
                  placeholder="புகாரைத் தேடு…"
                  autoComplete="off"
                  value={curSearch}
                  onChange={(e) => setCurSearch(e.target.value)}
                />
              </div>
              <div className="fb-toggle-wrapper">
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--m-800)', whiteSpace: 'nowrap' }}>டெமோ தரவு</span>
                <button
                  className={`achip ${demoMode ? 'active' : ''}`}
                  onClick={() => setDemoMode(!demoMode)}
                  style={{ padding: '0.35rem 0.9rem', fontSize: '0.8rem' }}
                >
                  {demoMode ? 'ஆன்' : 'ஆஃப்'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <section className="section">
        <div className="wrap">
          <div className="kpi-grid" id="kpiGrid">
            {/* Total complaints */}
            <div className="kpi" style={{ '--accent': 'var(--red)', '--accent-bg': 'rgba(160,0,0,.1)' } as React.CSSProperties} data-clabel="மொத்தப் புகார்கள்">
              <div className="kpi-ic">
                <svg viewBox="0 0 24 24">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <b><AnimatedNumber value={stats.total} /></b>
              <span>மொத்தப் புகார்கள்</span>
            </div>
            {/* Resolved */}
            <div className="kpi" style={{ '--accent': 'var(--ok)', '--accent-bg': 'var(--ok-bg)' } as React.CSSProperties} data-clabel="தீர்க்கப்பட்டது">
              <div className="kpi-ic">
                <svg viewBox="0 0 24 24">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <path d="M22 4L12 14.01l-3-3" />
                </svg>
              </div>
              <b><AnimatedNumber value={stats.ok} /></b>
              <span>தீர்க்கப்பட்டது</span>
            </div>
            {/* In Progress */}
            <div className="kpi" style={{ '--accent': 'var(--warn)', '--accent-bg': 'var(--warn-bg)' } as React.CSSProperties} data-clabel="நடவடிக்கையில்">
              <div className="kpi-ic">
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <b><AnimatedNumber value={stats.warn} /></b>
              <span>நடவடிக்கையில்</span>
            </div>
            {/* Registered */}
            <div className="kpi" style={{ '--accent': 'var(--pend)', '--accent-bg': 'var(--pend-bg)' } as React.CSSProperties} data-clabel="பதிவில்">
              <div className="kpi-ic">
                <svg viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <b><AnimatedNumber value={stats.pend} /></b>
              <span>பதிவில்</span>
            </div>
            {/* Resolution Rate */}
            <div className="kpi" style={{ '--accent': 'var(--gold)', '--accent-bg': 'rgba(254,203,2,.16)' } as React.CSSProperties} data-clabel="தீர்வு விகிதம்">
              <div className="kpi-ic">
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                  <line x1="9" y1="9" x2="9.01" y2="9" />
                  <line x1="15" y1="9" x2="15.01" y2="9" />
                </svg>
              </div>
              <b><AnimatedNumber value={stats.rate} /><small>%</small></b>
              <span>தீர்வு விகிதம்</span>
            </div>
          </div>

          {/* DYNAMIC INSIGHTS */}
          <div className="insights-section">
            <h3 className="section-title">முக்கிய நுண்ணறிவுகள் (Key Insights)</h3>
            <div className="insights-grid">
              {insights.map((ins, idx) => (
                <div key={idx} className={`insight-card ${ins.type}`} data-clabel="நுண்ணறிவு">
                  <div className="insight-icon">
                    {ins.type === 'success' && (
                      <svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
                    )}
                    {ins.type === 'warning' && (
                      <svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                    )}
                    {ins.type === 'info' && (
                      <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                    )}
                  </div>
                  <div className="insight-content">
                    <h4>{ins.title}</h4>
                    <p>{ins.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CHARTS */}
          <div className="charts">
            {/* Sector bars */}
            <div className="card" data-clabel="துறை வாரியான புகார்கள்">
              <div className="card-head">
                <div>
                  <h3>துறை வாரியான புகார்கள்</h3>
                  <div className="sub">மொத்தம் vs தீர்க்கப்பட்டது</div>
                </div>
                <span className="card-tag" id="sectorAreaTag">{curArea}</span>
              </div>
              <div className="sbars" id="sbars">
                {SECTORS.map((s) => {
                  const items = areaFilteredData.filter(x => x.sector === s.key);
                  const tot = items.length;
                  const resolvedCount = items.filter(x => x.status === 'ok').length;
                  
                  return (
                    <div className="sbar" key={s.key}>
                      <div className="sbar-name">
                        <span className="sbar-dot" style={{ background: s.color }}></span>
                        {s.name}
                      </div>
                      <div className="sbar-track">
                        <div className="sbar-fill" style={{ background: s.color, width: `${(tot / maxSectorCount) * 100}%` }}></div>
                        <div className="sbar-resolved" style={{ width: tot ? `${(resolvedCount / maxSectorCount) * 100}%` : '0%' }}></div>
                      </div>
                      <div className="sbar-val">{tot}<small> · {resolvedCount} ✓</small></div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Donut chart */}
            <div className="card" data-clabel="தீர்வு நிலை">
              <div className="card-head">
                <div>
                  <h3>தீர்வு நிலை</h3>
                  <div className="sub">மொத்தப் புகார்களின் நிலை</div>
                </div>
              </div>
              <div className="donut-wrap">
                <div className="donut">
                  <svg width="170" height="170" viewBox="0 0 170 170">
                    <circle cx="85" cy="85" r="68" fill="none" stroke="var(--cream-2)" strokeWidth="20" />
                    <circle
                      id="arcOk"
                      cx="85"
                      cy="85"
                      r="68"
                      fill="none"
                      stroke="var(--ok)"
                      strokeWidth="20"
                      strokeLinecap="round"
                      style={{
                        strokeDasharray: donutValues.okDash,
                        strokeDashoffset: donutValues.okOffset,
                        transition: 'stroke-dasharray 1s var(--ease), stroke-dashoffset 1s var(--ease)'
                      }}
                    />
                    <circle
                      id="arcWarn"
                      cx="85"
                      cy="85"
                      r="68"
                      fill="none"
                      stroke="var(--warn)"
                      strokeWidth="20"
                      strokeLinecap="round"
                      style={{
                        strokeDasharray: donutValues.warnDash,
                        strokeDashoffset: donutValues.warnOffset,
                        transition: 'stroke-dasharray 1s var(--ease), stroke-dashoffset 1s var(--ease)'
                      }}
                    />
                    <circle
                      id="arcPend"
                      cx="85"
                      cy="85"
                      r="68"
                      fill="none"
                      stroke="var(--pend)"
                      strokeWidth="20"
                      strokeLinecap="round"
                      style={{
                        strokeDasharray: donutValues.pendDash,
                        strokeDashoffset: donutValues.pendOffset,
                        transition: 'stroke-dasharray 1s var(--ease), stroke-dashoffset 1s var(--ease)'
                      }}
                    />
                  </svg>
                  <div className="donut-center">
                    <b id="donutPct"><AnimatedNumber value={stats.rate} />%</b>
                    <span>தீர்வு விகிதம்</span>
                  </div>
                </div>
                <div className="legend" id="donutLegend">
                  <div className="leg"><i style={{ background: 'var(--ok)' }}></i><span className="lname">தீர்க்கப்பட்டது</span><span className="lval">{stats.ok}</span></div>
                  <div className="leg"><i style={{ background: 'var(--warn)' }}></i><span className="lname">நடவடிக்கையில்</span><span className="lval">{stats.warn}</span></div>
                  <div className="leg"><i style={{ background: 'var(--pend)' }}></i><span className="lname">பதிவில்</span><span className="lval">{stats.pend}</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* TREND & ACTIVITY GRID */}
          <div className="trend-activity-grid">
            {/* TREND */}
            <div className="card trend-card" data-clabel="மாதவாரிப் போக்கு">
              <div className="card-head">
                <div>
                  <h3>மாதவாரிப் போக்கு</h3>
                  <div className="sub">பதிவான புகார்கள் மற்றும் தீர்க்கப்பட்டவை (6 மாதம்)</div>
                </div>
              </div>
              <div className="trend-legend">
                <span><i style={{ background: 'var(--red)' }}></i> பதிவானவை</span>
                <span><i style={{ background: 'var(--ok)' }}></i> தீர்க்கப்பட்டவை</span>
              </div>
              <div className="trend-wrap">
                <svg id="trendSvg" width="100%" height="220" viewBox="0 0 900 220" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="gsub" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#A00000" stopOpacity=".22"/>
                      <stop offset="1" stopColor="#A00000" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  {/* Grid Lines */}
                  {Array.from({ length: 4 }).map((_, g) => {
                    const yy = pad + g * ((H - 2 * pad) / 3);
                    return <line key={g} x1={pad} y1={yy} x2={W - pad} y2={yy} stroke="rgba(160,0,0,.1)" strokeWidth="1"/>;
                  })}
                  <path d={trendData.areaPathSub} fill="url(#gsub)"/>
                  <path d={trendData.linePathSub} fill="none" stroke="#A00000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d={trendData.linePathRes} fill="none" stroke="#3F8F4A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 0"/>
                  {/* Dots */}
                  {trendData.sub.map((v, i) => <circle key={`sub-${i}`} cx={trendData.x(i)} cy={trendData.y(v)} r="4" fill="#fff" stroke="#A00000" strokeWidth="2.5"/>)}
                  {trendData.res.map((v, i) => <circle key={`res-${i}`} cx={trendData.x(i)} cy={trendData.y(v)} r="4" fill="#fff" stroke="#3F8F4A" strokeWidth="2.5"/>)}
                  {/* Labels */}
                  {MONTHS.map((m, i) => <text key={`lbl-${i}`} x={trendData.x(i)} y={H - 8} fontSize="13" fill="#6B4F3C" textAnchor="middle" fontFamily="Hind Madurai">{m}</text>)}
                </svg>
              </div>
            </div>

            {/* RECENT ACTIVITY FEED */}
            <div className="card activity-card" data-clabel="சமீபத்திய செயல்பாடுகள்">
              <div className="card-head">
                <div>
                  <h3>சமீபத்திய செயல்பாடுகள் (Recent Activity)</h3>
                  <div className="sub">கடைசியாகப் பெறப்பட்ட புகார்களின் நேரலை காலவரிசை</div>
                </div>
              </div>
              <div className="activity-timeline">
                {recentActivities.length === 0 ? (
                  <p className="no-activity">சமீபத்திய செயல்பாடுகள் எதுவும் இல்லை.</p>
                ) : (
                  recentActivities.map((act, idx) => {
                    const s = SECMAP[act.sector];
                    return (
                      <div key={idx} className="timeline-item" data-clabel="செயல்பாடு">
                        <div className="timeline-badge" style={{ background: s?.color || 'var(--red)' }}></div>
                        <div className="timeline-content">
                          <div className="timeline-header">
                            <span className="timeline-id">{act.id}</span>
                            <span className="timeline-date">{act.date}</span>
                          </div>
                          <p className="timeline-title">{act.title}</p>
                          <div className="timeline-footer">
                            <span className="timeline-area">📍 {act.area}</span>
                            <span className={`timeline-status ${act.status}`}>
                              {act.status === 'ok' && 'தீர்க்கப்பட்டது ✓'}
                              {act.status === 'warn' && 'நடவடிக்கையில் ⏳'}
                              {act.status === 'pend' && 'பதிவில் 📝'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* CONSTITUENCY ANALYTICS */}
          <div className="constituency-analytics-section">
            <div className="card constituency-card" data-clabel="தொகுதி பகுப்பாய்வு">
              <div className="card-head">
                <div>
                  <h3>ஒன்றியங்கள் மற்றும் தொகுதிகள் பகுப்பாய்வு (Constituency Analysis)</h3>
                  <div className="sub">ஒவ்வொரு தொகுதியின் ஒட்டுமொத்த செயல்பாடு மற்றும் தீர்வு விகிதம்</div>
                </div>
              </div>
              <div className="const-grid">
                {constituencyStats.map((c, idx) => (
                  <div key={idx} className="const-stat-card">
                    <div className="const-stat-header">
                      <h4>{c.name}</h4>
                      <span className="const-rate-badge">{c.rate}% தீர்வு</span>
                    </div>
                    <div className="const-stat-body">
                      <div className="const-stat-row">
                        <span>மொத்தப் புகார்கள்:</span>
                        <strong>{c.total}</strong>
                      </div>
                      <div className="const-stat-row">
                        <span>தீர்க்கப்பட்டவை:</span>
                        <strong style={{ color: 'var(--ok)' }}>{c.ok} ✓</strong>
                      </div>
                      <div className="const-stat-row">
                        <span>அதிக புகார்கள் உள்ள துறை:</span>
                        <span className="const-top-cat">{c.topCat}</span>
                      </div>
                    </div>
                    <div className="const-progress-bar">
                      <div className="const-progress-fill" style={{ width: `${c.rate}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* TABLE */}
          <div className="card table-card">
            <div className="tc-head">
              <h3>புகார்கள் & வினவல்கள்</h3>
              <div className="tc-filters" id="statusFilters">
                {STATUSES.map(([key, name]) => (
                  <button
                    key={key}
                    className={`tfilt ${curStatus === key ? 'active' : ''}`}
                    onClick={() => setCurStatus(key)}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
            <div className="tbl-scroll">
              <table>
                <thead>
                  <tr>
                    <th>எண்</th>
                    <th>துறை</th>
                    <th>புகார்</th>
                    <th>பகுதி</th>
                    <th>தேதி</th>
                    <th>நிலை</th>
                  </tr>
                </thead>
                <tbody id="tbody">
                  {!filteredData.length ? (
                    <tr><td colSpan={6} className="t-empty">இந்தத் தேர்வுக்கு புகார்கள் இல்லை.</td></tr>
                  ) : (
                    filteredData.slice(0, 40).map(x => {
                      const s = SECMAP[x.sector];
                      return (
                        <tr key={x.id}>
                          <td className="t-id">{x.id}</td>
                          <td>
                            <span className="t-sector">
                              <i style={{ background: s.color }}></i>
                              {s.name}
                            </span>
                          </td>
                          <td className="t-title">
                            {x.title}
                            <small>
                              பதிவு: {x.by}
                              {x.resolver && (
                                <>
                                  {' · '}
                                  <span className="resolver">
                                    <svg viewBox="0 0 24 24" style={{ width: 13, height: 13, stroke: 'var(--ok)', fill: 'none', strokeWidth: 2.4 }}>
                                      <path d="M20 6L9 17l-5-5"/>
                                    </svg>
                                    {x.resolver}
                                  </span>
                                </>
                              )}
                            </small>
                          </td>
                          <td className="t-meta">{x.area}</td>
                          <td className="t-meta">{x.date}</td>
                          <td>
                            {x.status === 'ok' && <span className="badge ok"><i></i>தீர்க்கப்பட்டது</span>}
                            {x.status === 'warn' && <span className="badge warn"><i></i>நடவடிக்கையில்</span>}
                            {x.status === 'pend' && <span className="badge pend"><i></i>பதிவில்</span>}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="tbl-foot">
              <span id="tblCount">
                <b>{filteredData.length}</b> புகார்கள் காட்டப்படுகின்றன{filteredData.length > 40 ? ' (முதல் 40)' : ''}
              </span>
              <span>தீர்க்கப்பட்ட புகார்கள் <b>தமிழக வெற்றிக் கழகம்</b> நிர்வாகிகளால் களத்தில் தீர்க்கப்பட்டவை.</span>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="dfoot">
        © 2026 நாமக்கல் மேற்கு — தமிழக வெற்றிக் கழகம் · <b>பிறப்பொக்கும் எல்லா உயிர்க்கும்</b>
        <br />
        <span className="demo">Demo dashboard · மாதிரித் தரவு (sample data)</span>
      </footer>

      {/* COMPLAINT POPUP MODAL */}
      {isComplaintOpen && (
        <div className="modal-overlay" data-cursor="whistle" data-clabel="தொடு">
          <div className="modal-content">
            <button
              className="modal-close-btn"
              onClick={() => {
                setIsComplaintOpen(false);
                if (isCameraActive) stopCamera();
              }}
              aria-label="மூடு"
            >
              ✕
            </button>

            {trackingId ? (
              <div className="form-card success-card">
                <div className="success-icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <h2 style={{ color: 'var(--ok)', fontSize: '1.6rem', fontWeight: 800, marginBottom: '1rem' }}>
                  மனு வெற்றிகரமாகச் சமர்ப்பிக்கப்பட்டது!
                </h2>
                <p style={{ color: 'var(--ink-soft)', fontSize: '1rem', marginBottom: '1.25rem' }}>
                  உங்கள் மனுவின் கண்காணிப்பு எண் கீழே தரப்பட்டுள்ளது. இதைப் பயன்படுத்தி உங்கள் மனுவின் நிலையை அறிந்து கொள்ளலாம்.
                </p>
                <div className="tracking-id-box">{trackingId}</div>
                <button
                  className="verify-btn"
                  style={{ padding: '0.8rem 2rem', fontSize: '1rem', marginTop: '1.25rem', display: 'block', margin: '0 auto' }}
                  onClick={() => {
                    setTrackingId(null);
                    setVoterVerified(false);
                    setVoterId('');
                    setName('');
                    setMobile('');
                    setAadhaar('');
                    setAge('');
                    setAddress('');
                    setAreaStreet('');
                    setDescription('');
                    setPhotos([]);
                    setVideo(null);
                    setLatitude(null);
                    setLongitude(null);
                  }}
                >
                  புதிய மனுவைச் சமர்ப்பிக்க
                </button>
              </div>
            ) : (
              <div className="form-card">
                <div className="form-header">
                  <h1>பொதுமக்கள் குறைதீர் மனு</h1>
                  <p>உங்கள் குறைகளைத் தொகுதி வாரியாகப் பதிவு செய்து தீர்வு காணுங்கள்</p>
                </div>

                <form onSubmit={handleSubmitComplaint} autoComplete="off">
                  {/* Honeypot field for bot protection */}
                  <div style={{ display: 'none' }} aria-hidden="true">
                    <input
                      type="text"
                      name="email_honeypot"
                      value={emailHoneypot}
                      onChange={(e) => setEmailHoneypot(e.target.value)}
                      tabIndex={-1}
                      autoComplete="off"
                    />
                  </div>
                  {/* SECTION 1: VOTER VERIFICATION */}
                  <div className="form-section">
                    <div className="form-section-title">
                      <span>1. வாக்காளர் சரிபார்ப்பு</span>
                    </div>
                    <div className="input-group">
                      <label htmlFor="voterId">வாக்காளர் அடையாள எண் (Voter ID) *</label>
                      <div className="verify-box">
                        <input
                          id="voterId"
                          type="text"
                          placeholder="எ.கா. TN0010001"
                          value={voterId}
                          onChange={(e) => setVoterId(e.target.value)}
                          disabled={voterVerified}
                          required
                        />
                        {!voterVerified ? (
                          <button
                            type="button"
                            className="verify-btn"
                            onClick={handleVerifyVoter}
                            disabled={isVerifying}
                          >
                            {isVerifying ? 'சரிபார்க்கிறது...' : 'சரிபார்'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="verify-btn"
                            style={{ background: '#777' }}
                            onClick={() => {
                              setVoterVerified(false);
                              setName('');
                              setMobile('');
                              setWard('');
                              setAddress('');
                            }}
                          >
                            மாற்று
                          </button>
                        )}
                      </div>

                      {voterVerified && (
                        <div className="status-badge success">
                          <span>✅ வாக்காளர் அடையாளம் சரிபார்க்கப்பட்டது</span>
                        </div>
                      )}

                      {verificationError && (
                        <div className="status-badge error">
                          <span>❌ {verificationError}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SECTION 2: CITIZEN DETAILS */}
                  <div className="form-section">
                    <div className="form-section-title">
                      <span>2. பொதுமக்கள் விவரங்கள்</span>
                    </div>

                    <div className="input-row">
                      <div className="input-group">
                        <label htmlFor="name">பெயர் *</label>
                        <input
                          id="name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          readOnly={voterVerified}
                          required
                        />
                      </div>
                      <div className="input-group">
                        <label htmlFor="mobile">மொபைல் எண் *</label>
                        <input
                          id="mobile"
                          type="tel"
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value)}
                          readOnly={voterVerified}
                          required
                        />
                      </div>
                    </div>

                    <div className="input-row">
                      <div className="input-group">
                        <label htmlFor="aadhaar">ஆதார் எண் (விருப்பத்தேர்வு)</label>
                        <input
                          id="aadhaar"
                          type="text"
                          placeholder="XXXX XXXX XXXX"
                          value={aadhaar}
                          onChange={(e) => setAadhaar(e.target.value)}
                        />
                      </div>
                      <div className="input-row" style={{ gap: '1rem' }}>
                        <div className="input-group">
                          <label htmlFor="gender">பாலினம் *</label>
                          <select
                            id="gender"
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            required
                          >
                            <option value="ஆண்">ஆண்</option>
                            <option value="பெண்">பெண்</option>
                            <option value="இதர">இதர</option>
                          </select>
                        </div>
                        <div className="input-group">
                          <label htmlFor="age">வயது *</label>
                          <input
                            id="age"
                            type="number"
                            min="18"
                            max="120"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="input-group">
                      <label htmlFor="address">முகவரி *</label>
                      <textarea
                        id="address"
                        rows={3}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        readOnly={voterVerified}
                        placeholder={isIpLocating ? "இருப்பிட முகவரியைக் கண்டறிகிறது..." : "உங்கள் முகவரி"}
                        required
                      />
                    </div>
                  </div>

                  {/* SECTION 3: LOCATION DETAILS */}
                  <div className="form-section">
                    <div className="form-section-title">
                      <span>3. இருப்பிட விவரங்கள்</span>
                    </div>

                    <div className="input-row">
                      <div className="input-group">
                        <label htmlFor="constituency">தொகுதி *</label>
                        <select
                          id="constituency"
                          value={constituency}
                          onChange={(e) => setConstituency(e.target.value)}
                          disabled={voterVerified}
                          required
                        >
                          {AREAS.slice(1).map((c, i) => (
                            <option key={i} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div className="input-group">
                        <label htmlFor="ward">வார்டு எண் *</label>
                        <input
                          id="ward"
                          type="text"
                          value={ward}
                          onChange={(e) => setWard(e.target.value)}
                          readOnly={voterVerified}
                          required
                        />
                      </div>
                    </div>

                    <div className="input-group">
                      <label htmlFor="areaStreet">பகுதி / தெரு பெயர் *</label>
                      <input
                        id="areaStreet"
                        type="text"
                        placeholder="எ.கா. காந்தி நகர், மெயின் ரோடு"
                        value={areaStreet}
                        onChange={(e) => setAreaStreet(e.target.value)}
                        required
                      />
                    </div>

                    <div className="input-group">
                      <label>தற்போதைய இருப்பிடம் (GPS)</label>
                      <div className="geo-box">
                        <button
                          type="button"
                          className="geo-btn"
                          onClick={handleGetLocation}
                          disabled={isLocating}
                        >
                          <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, fill: 'none', stroke: 'currentColor', strokeWidth: 2 }}>
                            <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          {isLocating ? 'கண்டறிகிறது...' : 'இருப்பிடத்தை கண்டறி'}
                        </button>
                        {latitude && longitude && (
                          <span style={{ fontSize: '0.9rem', color: 'var(--ok)', fontWeight: 600, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span>📍 {latitude.toFixed(5)}, {longitude.toFixed(5)}</span>
                            {address && <span style={{ fontSize: '0.8rem', color: 'var(--ink)', fontWeight: 'normal' }}>{address}</span>}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* SECTION 4: COMPLAINT DETAILS */}
                  <div className="form-section">
                    <div className="form-section-title">
                      <span>4. குறைபாடு விவரங்கள்</span>
                    </div>

                    <div className="input-row">
                      <div className="input-group">
                        <label htmlFor="category">குறைபாடு வகை *</label>
                        <select
                          id="category"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          required
                        >
                          {Object.keys(CATEGORIES).map((cat, i) => (
                            <option key={i} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div className="input-group">
                        <label htmlFor="subcategory">குறைபாடு துணை வகை *</label>
                        <select
                          id="subcategory"
                          value={subcategory}
                          onChange={(e) => setSubcategory(e.target.value)}
                          required
                        >
                          {CATEGORIES[category].map((sub, i) => (
                            <option key={i} value={sub}>{sub}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="input-row">
                      <div className="input-group">
                        <label htmlFor="urgency">அவசர நிலை *</label>
                        <select
                          id="urgency"
                          value={urgency}
                          onChange={(e) => setUrgency(e.target.value)}
                          required
                        >
                          <option value="சாதாரண">சாதாரண</option>
                          <option value="முக்கியம்">முக்கியம்</option>
                          <option value="அதி அவசரம்">அதி அவசரம்</option>
                        </select>
                      </div>
                    </div>

                    <div className="input-group">
                      <label htmlFor="description">குறைபாடு விவரம் *</label>
                      <textarea
                        id="description"
                        rows={4}
                        placeholder="உங்கள் குறைபாட்டைப் பற்றி விரிவாக எழுதவும்..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* SECTION 5: CAMERA & MEDIA SUPPORT */}
                  <div className="form-section">
                    <div className="form-section-title">
                      <span>5. புகைப்படங்கள் & வீடியோக்கள்</span>
                    </div>

                    <div className="input-row">
                      {/* Photo Section */}
                      <div className="media-box">
                        <label style={{ marginBottom: '1rem' }}>புகைப்படங்கள் (Photos)</label>
                        {isCameraActive ? (
                          <div>
                            <video ref={videoRef} autoPlay playsInline className="camera-preview" />
                            <div className="media-actions">
                              <button type="button" className="media-btn" style={{ background: 'var(--ok)', color: '#fff' }} onClick={capturePhoto}>
                                படம் எடு
                              </button>
                              <button type="button" className="media-btn" onClick={stopCamera}>
                                நிறுத்து
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', marginBottom: '1rem' }}>
                              கேமரா மூலம் படம் எடுக்கவும் அல்லது கோப்புகளைப் பதிவேற்றவும் (பல புகைப்படங்கள் சேர்க்கலாம்)
                            </p>
                            <div className="media-actions">
                              <button type="button" className="media-btn" onClick={startCamera}>
                                📷 கேமரா
                              </button>
                              <button type="button" className="media-btn" onClick={() => fileInputRef.current?.click()}>
                                📁 பதிவேற்று
                              </button>
                            </div>
                            <input
                              type="file"
                              ref={fileInputRef}
                              accept="image/*"
                              multiple
                              style={{ display: 'none' }}
                              onChange={handlePhotoUpload}
                              title="புகைப்படம் பதிவேற்று"
                            />

                            {/* Multiple Photos Preview Grid */}
                            {photos.length > 0 && (
                              <div className="preview-grid">
                                {photos.map((p, idx) => (
                                  <div key={idx} className="preview-thumbnail-wrapper">
                                    <img src={p} alt={`Preview ${idx}`} className="preview-thumbnail" />
                                    <button
                                      type="button"
                                      className="remove-thumbnail-btn"
                                      onClick={() => setPhotos(prev => prev.filter((_, i) => i !== idx))}
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        <canvas ref={canvasRef} style={{ display: 'none' }} />
                      </div>

                      {/* Video Section */}
                      <div className="media-box">
                        <label style={{ marginBottom: '1rem' }}>வீடியோ (Video)</label>
                        {video ? (
                          <div>
                            <video src={video} controls className="preview-video" />
                            <div className="media-actions">
                              <button type="button" className="media-btn" onClick={() => setVideo(null)}>
                                நீக்கு
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', marginBottom: '1rem' }}>
                              குறுகிய வீடியோ பதிவேற்றவும் (அதிகபட்சம் 10MB)
                            </p>
                            <div className="media-actions">
                              <button type="button" className="media-btn" onClick={() => videoInputRef.current?.click()}>
                                📹 வீடியோ பதிவேற்று
                              </button>
                            </div>
                            <input
                              type="file"
                              ref={videoInputRef}
                              accept="video/mp4,video/quicktime"
                              style={{ display: 'none' }}
                              onChange={handleVideoUpload}
                              title="வீடியோ பதிவேற்று"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {submissionError && (
                    <div className="status-badge error" style={{ marginBottom: '1.5rem' }}>
                      <span>❌ {submissionError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="submit-btn"
                    disabled={isSubmitting || !voterVerified}
                  >
                    {isSubmitting ? 'சமர்ப்பிக்கப்படுகிறது...' : 'மனுவைச் சமர்ப்பி 🚩'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    
      {/* WHISTLE CURSOR */}
      <div className="wcur" id="wcur">
        <img className="wg" src="data:image/png;base64,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" alt="" />
        <img className="wm" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAANwAAACmCAYAAACx4+EmAAAixklEQVR42u2dedxew9nHvw+hERHLIWJtHIkoIryEopVaItROS+xrqZ1RO7EvJTnS2Eotee21lap9D0UQWl67TCwJEYbYBZH3j5nbM/c8Z7v35Znf55NPzn3OnDnnmZnfmWuuuRbw8PDw8PDw8PDw8PDw8PDw8PDw8PDw8PDw8PDw8PDw8PDw8PDwaDJ0+CbwaBSiIFxSKPl+FIR7AfsBfwW+BfYENk259X7gNKHkvz3hPDyRgnBZYFdgnDm1ObAJMAxY3pz7Cpi/So/8rVDyHk84j3Yn1nrABsDewELAU8DjwNkNfK1AKPmJJ5xHq5OrH/Aj8DXwR+C8KlWtgMAcfwZ8BywGHGZIPMXMhL2A1c3MmYVpwApCya894TyanVi9gCHAocDIGjxiNnAO8IBQ8rEy3/EU4OQcRd8BBgglf/CE82joGkso+a45vgv4bZUf8T1wBvCAmZk+EEq+UqNZtyfwMLBcStEHhZLDPeE8akmquYCjjVi2MNAP2KoKVU8yg3wScBsww5xfFnhWKCkb9PceLpQcGwVhfyOGJs14twklhSecRyWDbRhwrCHXQGtNVCmuB05qFIkqbJNL0VsNcThPKHm0J5xH0uBZAxgN/KYG1V8OPAnMFEr+o83abQXgQLQCJg5HCCXHesJ1X2INBc4ClgEGmdMfAEtUuJ56CPgv0Butup9arsKihdv2LTr3AF28J5Rc1hOuewyERYH/AxavUpUTACGUnORbN/aDtgJwbUKRbYSSd3jCte8A2Bz4Vxm3vmeUFpcDXwslH/GtWVK772TWp3H4l1ByS0+49uz4OTmKPQ1sKZT82LdY1dt/APBmwuXxQsm9POGq2+AbASPQmr0hwKvALULJq+rw7BHAvTmKbiGUvMvTo6Z98TzaiiUO5wNHV2vzvKMbNeqvgVvRZkPlYgfgVqHkj1V4n5nAgs7pnYHp6I3cnyCU9JJI7cfHncAaJCuoNhFKPuAJl9yA1wHbAvPV6BH3A8cIJf9T4nv1QdsMFnACsDswqECsKAh7oLWLNrYSSt7pqVHzcTMMuA5YKubyO0LJ/p5wxQ12hhnE9UQuMsSYUS2WtDaLgnBpoxxx8YFQcklPjZqPo1XR2szBMZfnKVfE7GiDhrkYOKDE2/YF1kJbIowHXgJ6oB0fLwRuQfturWfEvj1z1Dnb3PODUHJiDgXJFKFk6Ii8xwOjhZIPWWvMB+Me5sXMuo2v+9C+fF0+fEB/oeR3bU84Yy93OvlcNT4DLgPeBpRQ8u9lPrOvUHJGFIS3AttlFP8GbWO4KHAQ2q3lauv6nkLJ/00h5AVCyUMd8Xhn5xnPALsJJd/wtKjLmPsHsE3C5auFknu0JeGiIAyByRnFxgMXCyWfrbGsfw7wyxJv3dvWghonzidiyo0RSv7JeeY1CR+ZeZrJBaWNSTcAeDFFLzB3lkKto4X+2Dwzy8lCydMa9H5zSikvlOyIgnA14IWUYnGkm8vMnq6B8kCh5FueFnXp6zSDhZ2Fkje0LOGiINwauD2lyJHAZ0LJK5rgXQUwpgZVzwbWtDWiCQTfux57iB4QBeGK6H3bJPwsbn3X0eR/1A/A3AmXLxdK/qFJ33te4GNggWrWaytKzNbBZmYtOyRtVvSoev+ugla05e6vpiZcFIRXoAPTxGF/4FOh5M0t0DFzKrj9z2iH0V8453/lhoeLgnBttAlYAZcIJQ/01KhqX45AWyUd4VyaRvyeHcBlQsn9m5pwKYP0FrNGe6XFOmod4BqSXUOS8EXKDPmhULKf8xxX+fKCUPJ/PFUy++dYYCza3/BFYChaqzycrmEb7iU9XqaLr4SSvZuWcFEQvkanH1hbiUgVznagN2G3pNMcrGjrIOUZDwslN/LEChdBx8fcxpzaiK6mdeXgVUPQe9FBbE9IEys7mqQxljRTs4u20byZRfYRJLv9p2EW8LOEa7sLJa8xz1gBeD2mzJVCyX26CbGGoh1tDwaWRhs4VBMnAzcCb8VtAURBOAo41fzsEryoowkaKG5Tt20tKfIuuEvE+kLJx51B94xTZrt2CqEQBeFK6NAQCwKPUr3wE18BM4Fz0fu5w4WSt5YpzSih5KJNQ7gEEehMoeSJ3eBL/ACwcZwIaMSUg0qs8nfuwIiCcAbF3hGvCiVXauE2ewjYsApVPQE8C7whlPxrld9xNzqtim4TSm7fFIRL8Af7ZZwdYpsv2N2w4BsDn8fMUHnQZdM1CsIDgYtaSXqIgvAes2Y9mNIteWzMBv6NjhPzjlDytTq8+++Bm5pmDZcgUk0QSg7rpov544Ezayxi2l/dAo4TSp7TwL97A+AjtPfEfmgtbrkBk2YDV6E12ZPQYSe+buDfVpDcXhZKrtJown1NsS3a6ULJUXRjJFktGPOvLO3m9+j9oYed82vZtqQJNqgb1ioeigmO9LlQ8jvLZepGKg+ffj1wJfClWSO91YT9Weizu4WSmzeEcHGiDXCqUPKUFifLUPOlHgz0LdfELArC4Win1iTYSS/yYingeTojgk2h695S2f51RnGxDrAyOrpzf6ofO3MS2prmEaHk5y328eyyJdPRANYXMKhZXUuiIOyL3lvZHK2pqjauB6a50X/NAH45pvyjZhabVcM/ewGh5JcJ7bEIOkfAXGi/QVGGUicJ3wBvmNlvdDt4PVhj/X6h5Ii6Ey6GbE2ZQC8Kwj8ClzTo8dPQqaAGJlyfAKxvjku1eCgFF6ADx74EXFGDGesWoeTv23h5cAdWDgdXadKjAWR7slnI5jZOg7FUliLE/D9eKLlXFSxXknCI+VcOCmLvE0Y6GNYN47AMtY672AN31HhAj3M6r+FiZMJaMg2foTdXJwkl14yCcCG0+dkHQsl3oyDsU1hbGFF0XrSn95lo9f4gikOwTTPi6jIV/Bm701XrWE8UtIJvCiXPpZvDeIfsCSyJlbeurt4CURCeCxyV9vA6N8oeOdZjY4DH0IktHq/x+ywK/C+V5WZ7Ge0rWOugSVOMJLBwrdulBci1E9qYoA86bOLgpNnetTKpGeFiQsE1JNJUFIQ9zZpsz4yiXWKMNLBDV0Sr+PPsR30llOxdRfFyCPCK+UB2+5ANJnLXEWiF0Q/EmCCmYH+h5GX1Itw99qK+EbNbRjSvT4EdqxHYs4bvP8CIvpvU8bHzN2Ne7Dq1dy+0Q+82ZvYqZ20/AYjSEoJ01ODFi9Zt9SZbRgjxlvM+MKLw2TlmvGXM2nBaBY87TCg5rhuRbEe0o29fSgsY/JERK2cDW5cSir6jyn+AG0exbtGkjBj7MTBPzOX122HtYQIIzU4pcqVQcp+MXGiJaPdYl1EQngL8HBgA/CrnbY+aD9GL1XiHjir+MW4ko40LAU3r1Jhz6jGIoiDsYX9EjA/a+0bG7wN8W0uLCLMulVSWpDEO6woln2ojcm2PjvL2+4SPcBqOAXrWIgJcNQn3MZbpUb2+llEQbolOHu9+sQ4SSl5chfqT3GhKwSwz+94OnCuUfLcK7zUUnZykku2FC4DXqtFOTUKyUcAokgNPJWFjtFneDbV+x44q/aGuqFOT3Fo5Z7VJQsk1K6gzLVlftTANHY/yiErWlFEQ9kbHPikHO9djgNWw7/cCtgD6AeuW+PHbBZgolJxa7/euFuHqOrtFQXgVXVX9sfseOeraDa36Xb2B4+dU85F6u8z2OBg4lGSzsALeROf47iOU3LaFyBUasX1fI83kmdUvQ+9T9jPkuqMZ/pZqEc6eaVYvNYVTic+aTtd82CUHykkJGx6H79FWI6+izeGGGrFlB3Sy+nXQdodzm06+GBhXhmgDcJFQ8uAy2yYtEG3LBWOKgvAs4LgSbvknMBG4vVmju3VUoVFSjTWr3AFxe2vLCyVlCXUU7RG6syRwBzoc39Qqv/vSwCdoG8ObctzyU3CgEp9zONql5Qdgl3LJ2wBy9UPnZcsbQmEC8AhwfSslNOmosJFWozg2fs22AVyxtVRyR0H4JTB/zKUHgWOFkpPqOLiGA1ujtWc90baRSThBKHkWbQaTAWmYkTLyKKW+QTud3uiGB2wlVEo4O47kSULJM2rQMT1NY9u4Pe8aJMaAGqPg2Ugo+VgTDcA086z/CiVXawOSHU1nOIU82Bu4Ryg5vV0+NJW653xrHY+uVT+566k8ZEvwoJ6C3h+UzdYRJpzCIuYDNppizdsQQ8iR5ea3a6Cy4yS0ydTiOW+7HDhKKDmTNkSlM9ycWq7djOnNjaXObFEQvkhXK+6WMltKsQV9Rii5dpO/+zC0hUZenIoOKfcibY6OChrV1vINqXZjRUH4HLCGdeovQsnDM+7ZCx1gxsVSQsn3W1QMSxI1L2i2tUwUhBeSHXrharTGtO3JVW3C1Wx2i4JwIsUhqo8USkYZ9+wHXOqcXr4Zxccy2iPRl68Z7B+NGdUtCZfHoxVr41shCFBTEs4R9b4XSs5bxc57G21gmntQGZXyB87ptkpiYbzJP4y5VNX2L+O9XqFrSi2A89wgSR7lK03sdVW17fBKJZsbR/8QoeSF7dZRQskZURDGXZonCsLT6h3b04QViIsidkC1w4e3E+aqQh1/r2InzimRbBs4ZBvZjmQzf2tBpN7f/SgBJ0VB+G6dX8kl265CyQ5PtiqLlG7O7WqtIaIg/BYrJVMOsvVCJ5cvbGYfJZQc3aZkKwQ+2sJ2drQ+UJ+iA7FCTIbUGrxP3ayL/AxXHM7toip14H4U5z87NaP8uei0QgWyzWpXspkBfbGZPWyyLWsVWdg6fsLkb6gV2Y73ZKsv4eyFcLXEB1u7eH5a+HNjTnaUdWotoWTPbth3hWhfLwHvONdeqhHZ/kZx4pElPIVqL1JWdTsgCsKZWKlf0+o0X3V7cD0plFyvu3WatSn+qFByg7j1b0Eaqeb+Y60NHfwMV/uBIyjOs5yVc9km26RuSrb+hmxYZNssofi0lGvliP0FvO6p02KEMwPH9t3aO21jNArCxxyyrdkNyTYAbQ9KYc0bBeEawN3AZDPr3ObcdncNxP7bPHXqT7g9K3z2FEcxcFXKQDuNztj673VTsvVHe2wDLCGU/M4cPwe8JJQcYNpxe5xccab9Knn2atbPyULJ4z116kC4KAht270hVXyPf6Y8cxG0xXkBW3XTvip4MAdCyelREK5YWFMJJVd1yroa25NMKqxysa91/JSnTf1mODvX1REVfDFth8ppQsmtU4or63j9WoZvaGYIJXuZrYFPzKkH0VYdccqLuLDtL5sw6uXANkj+s6dN+SjVtMv2f3u6gufacSrWzRAl7XXb477LfiLg0gltths6KnAcXqVClyyh5P/51q/fDGeHTygrxJqj/CAjRqMtSo703ZXZtoui3V/epNje1S7zVol19vUt2zjCvVCFZ65vHS+e0tF21KWRrZYToEH4yHzEViB583t5406TF7bHxXm+ietLuE+s47+U8QW2Q58fJJSckVBuHJ0uH0+2UliBBs1swy0FSoeZ6QoWIXvG3HJLCdXboQS/861dX8JNrvBrt6ElSqa59dhBf8713ZRKtrHoPbKdLQXKR+b/ZUzeu0o0yvYm93jf4pWhVKXJSIswR5c4MHa0fn5TwiL9Dt9Nqe1zOHC41c4/zXRpM1MUhMNyRi2zI2wtBnjRvo4z3Airw04pdWxYx/OlEPNm6+clvotK+qgVtLiuUfGrMcUfzVntctbxUN/K9SXcfdbxoBLvtWOUbJpS7nfm/w+Ekgf6LspFtBFmZpto9uqmW9cKWV7ncffsTHDcLNjJLd/zrV1Hwgkl/2D9DEsYELaR8dVCyfsSyh1u/VzNd09uvIQ2CviT054hOqrxAlZE7MOsIvPnqNsOybedb+o6Es6xGC/FF2pL6zhtAX+sF1/KWse97xoFmJgjk4F9hZL2TFaq4bFtZbK6b+36ipTfW8elZDe1bfGeTSm3uDWI7vLdUxFmmXa8wjn/nkPMCzPIbFuWfOabtb6Eszej9zTpdvPATsJxesLsaWd5Odl3TdnruaFmPfdyzJptDvC6c/6gKAhXTalvIevnur6F67uGm+icWiDHAFjS+nl2iinXZtZzTvNdUxbZhmOimAklV3GuTUS71hQMmI9MkEDcPp/pW7ZxM5yLKTnK2HL/5JRyv/XdUTHuAh6MmdkuRGuJ7RnK3ps7JKPeI6y6NvDN3DjCjcj44u6BzgxawOcJ5YZZP+/13VIehJLzCiWHO227mVF8XO+Y0l2QIjq66GUde0OEBhIuK2/X+44i5OaEcmOsMpv5bqmaiLkZOsTCbKHkLs5azsWuKUS2/Re/9S1bX8LZCo2HM764D+QUJ2f5rqgJ7jb90MMiW8E0a0FHjN8pZ52L+WatL+GeLeELe4bb+QkY5Lui6rNbF5vKKAivQttGXiKU/FwoeY91S5YG8mHfqo0h3JsllD3BOl4mpVxh2+Ad3yVVIdtEtGmcTbbhGFcdx2TuSatMWrahqQlrbo9aEs51BM3wCL7dOs6T//sx3yWVQyi5tlBySed0If3y3M55e2ZbJ6Va203nI9/K9ZvhXBHww5RyNhlfTfga72H97O27pLbipVDyR/e8hdNTqrEtUnxcynoSTij5htOhWyYUXde65+sca8KbfJfUhmw4tq8m8SXAFzn7/HO/5m7cDAfFmsVbc3R8r4RL9kAY6LukJmTbwnHZmYHOMXeyULJPkvTh0VyEszNuzpNlgZAyw91nlTnDd0nVyFYIYXGqk+ZqKlq1v7NlQreCb7EmJ5xQ0o01Um7465m+G34iQ48oCGc669py6lkbnfBjsp36KwrC+9D5/XYQStphDguKlNkZVX/je6lxMxwU52nbOArCcuq7xxoQo7ox2VZFuz8tCEyqoJ6p6CC9bxbyDVgz3ibAlSkWP1nPHW3V92tPn/oT7hHn9+Fl1PF1CR3ermQ7HPhvYbYpN7qxSU28lCHVCtb5O82MN1AouY9zz3PWz7UyHmEvG7b19Kkz4YSSLkHGREE4ImEwLJpQje1G8k43JNsc4HwzIxWp7Uus5xF0CujDbFKZrKVbmPNvxTx7jTLHywxPn/rPcAD7O7/vjYLwROfLiVDy44T7bdFk+W5Itg/RSTkqVVycaAg7zqr/DLSv2/L2eYuIY0rMZNrD6s9zPH0aQDih5GXoTC42Ts/75Sz3i94OMATpJ5T8q0OGbcuo699OHaegTeuuFUpK63whSvPqbtChHEqTt6x6tvT0acwMh+uDlfA1z5P4fmp37owoCMcaMtxWYT2j0V4dTwsld7POX4Ex8UpIajl3RtV2TgIfwrBRhDP4MIOU3yYMjgHWz2u6Mdk+wYSwqyRhvREjj0R7BKxjnX8c2Duh/stzVv8z63htT58GEk4o2a/M++yF/C+6IdF2MbPawsBlFZJtlBEjL7E9AkxylF+ZGS+u/qVzPuJq63hzT5/S0aPK9U2hODS2PRgOF0qOzSN6Js2GbUa0hYBPrVODK9gO6ENnCLu97XzpURCeg45ZMtue8azr3wHz5HyUvS5fyNOnsSIlQsm0aMxp1+zF+ordgGzjDNnuBTY1ypNyyXaPIdv3wIIO2UYBx5gZr4crwpqZdZ4SHrey1df3ePo0foYDHeHp/JjzhwCHJtzzB+BKc/x+uze6UPLQlLYgCsJ9gN/YCo+YMlfRmfvtAlOnff0+tGXJSDu/nnEefdT8fFoouU5CjBOPViCcUHJsFITnl3ib7aJzNrBPN1WcfE5xrM/dEsq9T6eXxfoxYc7fQHtezG8bjUdBKI3IP9ud8QzOTHm3lVyR2MesbLBIaWHjhE7rnUBSW5zau5uSbY5FtgfjlBtREN5gyi0BrGlEUZdsnxiyDXLINseQ7bMEsgH8I+UV7fTQ//Vkax6REqHkQ1EQu2T7S8rspSgOid5diPYaxQ6d2wklkwb+SOB7oeS8MfUsTWfegI1tJ+EoCAvEe0kouapz3zlWv6XZstq+iuM9dZqIcKbzOmLWBv1TbumP8T6OgvBjYNkUH7pWJ1lv4AHgl9bpTZywgrFtmlDfsUYUB/itUPIhZ2YDOMGJL1nAMeb/aRmvbQcO+oWnTpMRzmAZirO1TEwZTF9as2KANo7t3WZE2xYd8Xgpc+p24JyYnA1569sPnd8b4BCh5IUxYirAWkLJZ2PuD0t43M51HDeecGXOclOjIDyPTr+540h3VB1Pp+bttTYi2iJGZP5JtDa5ucutbw3guaSZzzigPm1+LuDkhyuUWQ14wTp1ZAn9uo+nTnnoqNOAs0XLlYWSr+QpW4nVRROSbj2gb8r6LE8dK6ENxQsayiXsWCWmzKXAfkntZ5yEZ7jr5bS2Nu/+hPl5v1ByhKdOc4qUSaLJiSnXtwD+VRhgaeRsJbjW/M6AXgX42CVPwhotbS13B7AVMCnOODkKwrvoDG9+WYGYZGfPWSfPssCjOQl3QhrhhJJ3WWu5l+s1CzdgxlsFuB4YbE5tR7JavkC2Y2JiyRTCHUwwPy9xIisTBeENaA1nAQMdkX09iuNOujjPOvYRvppZpHTU1QVcm2FF4Wo3V26Xmc5oKC8Cdq+G6GxZlCSJkIW2fNrxHsglujuWKW0l5rfdDGe+4i/FXNo649a1MJk8DT5uYYKF6FgvW6FjQYK2HR3kBtQtsd516MwLcJtQcnvnel86Xab2tXN9R0F4tFX0gIxH2SZj73nKNOEMZ77iM4D5UortKpS8LqWOp+jcp/pKKNm7RQlnr5sgWUV/FjBRKHlHjjr/hg6d8CCwra2FNER7Hr318HSCh0BhdivyLMiSNvzs1rwzXJ7w2ddGQfiAk5XTxjA6ozvPHwXhgULJi1uwjXcya9abE4i2PXBL1kcwCsI/op0+9zSn4mwobXLvEBcOz9hhAjycg2ynxawjPZpphjMuIafmLF5kyR5T13A6s74A3C2UbAvHR7M2uoFOFf+NQsmdEsoWjJEBXhZKruJcj9D2q8+iPQf+k1DPlsA/kwib0Y/zdQc/xaaf4Ywj5WB0fMnXgd+VcPs2QCLhhJIPREF4I50atultQrbCh2QkcI+TKCMOBwGPuwPe5Gv4Ko+4Z9Ztf7ZOfZjxzFOdvvBka+QMZ8yUSg128wE62OsW1rnFU8TKLusIYEOh5CNNTKbtjTj8mFDy1ho+5zo6za2WE0q+naNcAZPtqMw52jxx9vWoA+GiIHweWN38vJKcLjWFr7DTmV8BKwolp6Y871C0p0HuAVNnkvVFe2+vHvf31lARk9oOCY6lSii5aEb9qaZjHnUUKaMgvNkZWL3yEs3CGDpt9+ZHq5s7Uu4fFwWhTbhpTUK0K1I+NpvU4HnP0RlXJHYv0+QoOI7ijW4beQyW77SOt/M0qR7mKrHDNzBrtGeAawuKjxz3Pe4Q6E90atvywrb9W9/s8TWSbI9YZDsAHVNkMXQwoI4kV5soCNcwxgDlYDV0BpvfJJBtBDpHQVKfnJ21XoyCcKylyJlcie2nR4UipSWiXAYMQAduvZqukZfjMFIo+fcoCHdEb2S/A7xZiggWBeGLdJpCNVzUMQP88Tx+e4495CyhZM8qvkdPQBqizEKbbQ1x188xeb9ber3c1oRzXD4AnhRKrme+9L/JWU1SgKECNhVK3pfxHnZYt6Zay8W867zoPbiTzKnd0Zvbb+S4t58h0XwZplc7AjfSNRalu37bJm1TPQrCg9G+egXEepZ71G8N5xocDy0j2lNWcKF7sz4CQsl5oyCcic6jtrx5hy6hAxpIstHo2CH22udUOzFixv1/B3YwP7/ARGNOedaR6E1sm2xnxYiSWRYsFzi/l/b0aOwMl0WuL4DVCokjLFKUii9M3ums93kI2DDm0jNCybXrRK5FgI3Qm877xRQ52Urrm1XXP9D7kgA3CSV3zNkfXUzknL7KIzX0ptg6aGcnQ6pHA2a4LNxlZ2lB5+7eoYx6FoiC8Hmh5P9kzHQbRUH4Np0GwQXsEzOgdjNrzeWAH4WS7xbWPkLJb40S4zvgB3PLGcBUoeRZJvfBEHSgnynAt8AiaE2r+0H5MzqF8o9xbjQpiqiHrVNLJPnFmfL2FkmX/TeHbD8v/K0ZeNFpW0+2FiCcu7juW0Fdq0dB+ENKOLfCwOgfM/PG7ecViD/FDEp7gKaR4cwc73q5UPIPZc6Ql1oz48Z28J+YssfTGTfyVaHkSjFl/pOjLdx7rsAKT+/33FpHpMR8eadTPUPX94SSy+ZQ5kTAutbpLlbwRimwHunbGLOMomIFYCyde4V305k4cgHgPKHk0VUQSZ9Ce1Rs4lrbREG4ItoiZxSd8SpfF0qumKBg+cA5PSkhJZX7/F96sjUn4WzrknriXqHkZjnebx+6pl06zM38acqeBvRBG/suB5wL9ConuGkUhJsD/dC2h4VoXE+gs9Vkzlwx9Z2F3rgumkWB4+KyyJq83hdZp3IZeFsKlwKOEkqO9pRoHsKdgk7yV00cB0wGbsood7pQclSOdyyoyF0otAnaYGDTBPG0I2c7LI1W8++Xo/iVeSNcmS2E6ei0VaAjK0/KuGdrdKi9AkrRhtoSywtZa2aPOhMuRay8CXicYrXyBOApOoOM5hJ1YtxxbPxTKLl1jnccSrG3eCm4BBiHdp4dhTa03hVtjPyzhHu+AYbbQYKiIOwdF5ou5Z3tvcxc4mqMwugJoeSvc9y3KPCRdaqp9zK7O+F2Qge+sTEb2BFtUznQfP0V2mxsYTMg5ytlJrGiT7mYIJQclvNdvybd47xS5J5NUt6xf0GRQ45YlcYd51LzEbCRORua+91gQlVZi3rUiHCm00IjBubBS1imWDjZXDKesxHxJmOZ+0pWHfsBuwDrV9BG/zJKmS/jPLZLbLtV0JrGwsfke+BWYA+h5HcJ9xxsZqQx1hrRxjJpnhZWPe+iI2GXLEZ7NJBwpvPsdEm5UG7nRkE4neLMLd8IJXuVWIc9k2Qhl2hW4rPXiZEMQMfoX8Yoo8YLJWeYD82hCTO8jUeFkhvkfIdX6JoPYHeh5DWeAi1AONOJwnx182ApoeT7FTyrSH1dihhl1XEzpXmjQ0YYgozn/YnieI7Vwv3AlkkzYo51d5cQDR4tQDirQzcAijZPDd4BDhJK3lWFZwzA8SywsLxj4ZJV1yLoPbXbc95yCzra8GAzS/ZCW5IcG1P3XBSnT64mugR4zbHe+8qLkG1GuHrBuKB8jHZYdZEZ7i3n1z8v0jSt1d6vPAl4SCj5VAl/1x/RGteyP0wetUHLpB0yQWx6m2hXN6OdPQu4MgrCgULJ40usdhDaKubHEsXNY8zAXgnt4XAbeg/t11Uk2xjjqFuNj8jKnmx+hqt0xosbWK+j/b5eq6BeO5RcvXG+UFKU+d59gP/EiPYlWbp4eMIlDTA71HccuiQoLKHuUmJrVooHgXOzsp+mvOvWCevRScABlW5leHjClbIO2yZP6PAcz5gLHXznErTvW6W4Xii5SxXeKy53w2dCyYX80PaEqyXpeqB9upJyT6fmMSjjWSfSae3RG+hp1oHvm98XosMpXIz2xn7DmFQNSssTV8I7uEFd7bWu10R6wtWNeCuhc8olITa5RYv9jbZfnI2y/fI8POFqKWYCfAr0y7t53AR/T5IXBNQxpISHJ1zaIN0DGJ9RbBZwB3qf67Ime/+sUPKZEZQ9POEaMXB7A8fT1akzDg8Ddwolx9b5HRcCTiM71zZo16cD2iUjrCdc+xLvDHTIgp7oDe+8eAcdin0icKxRTPxQ4bvshXaIzYtvgBHl2nV6eMI1AwEL0a/ew3FbKQN/QQfsOR7tAzgYvYXwK4u0P0fbgw7MWecE4DF0DoE3/FD1hGs3AsZ5JNQbJwDzVurY6uEJ12rkC4Hr0PaaS5McXqES3IYJge7XY55wHslkLKSL6o3e/N4XHVVrXnQqqZ7ovcCl0Ladn6Jjdn6C9kWb4VvRw8PDw8PDw8PDw8PDw6P58f8fDrju5gqFNAAAAABJRU5ErkJggg==" alt="" />
        <span className="waves"><span></span><span></span><span></span></span>
        <span className="clabel" id="clabel">தொடு</span>
      </div>
    </div>
  );
}
