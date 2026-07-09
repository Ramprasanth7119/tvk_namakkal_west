'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import './analytics.css';
import { CONSTITUENCIES, ALL_AREAS } from '@/lib/constituencies';
import { TVK_LOGO } from '@/lib/brand';
import TvkAppFooter from '@/components/TvkAppFooter';
import TvkTopBar, { type TopBarLink } from '@/components/TvkTopBar';
import KpiCard from '@/components/analytics/KpiCard';
import ChartSkeleton, { KpiSkeletonGrid } from '@/components/analytics/ChartSkeleton';
import AnalyticsEmptyState from '@/components/analytics/AnalyticsEmptyState';
import { buildRadialMetrics } from '@/components/analytics/ResolutionRadialCharts';
import type { CategoryChartSlice } from '@/components/analytics/CategoryDoughnutChart';
import type { TrendChartPoint } from '@/components/analytics/MonthlyTrendChart';
import { useLanguage } from '@/components/LanguageProvider';
import { labelComplaintCategory } from '@/lib/complaintCategories';
import WhistleCursor, { useWhistleCursor } from '@/components/WhistleCursor';

const ConstituencyBarChart = dynamic(
  () => import('@/components/analytics/ConstituencyBarChart'),
  { loading: () => <ChartSkeleton variant="bar" />, ssr: false }
);
const CategoryDoughnutChart = dynamic(
  () => import('@/components/analytics/CategoryDoughnutChart'),
  { loading: () => <ChartSkeleton variant="donut" />, ssr: false }
);
const StatusDoughnutChart = dynamic(
  () => import('@/components/analytics/StatusDoughnutChart'),
  { loading: () => <ChartSkeleton variant="donut" />, ssr: false }
);
const MonthlyTrendChart = dynamic(
  () => import('@/components/analytics/MonthlyTrendChart'),
  { loading: () => <ChartSkeleton variant="area" />, ssr: false }
);
const ResolutionRadialCharts = dynamic(
  () => import('@/components/analytics/ResolutionRadialCharts'),
  { loading: () => <ChartSkeleton variant="radial" />, ssr: false }
);

const TAMIL_MONTHS = ['', 'ஜன', 'பிப்', 'மார்', 'ஏப்', 'மே', 'ஜூன்', 'ஜூலை', 'ஆக', 'செப்', 'அக்', 'நவ', 'டிச'];
const EN_MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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

const STATUS_KEYS = ["all", "ok", "warn", "pend"] as const;

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
  month: number;
  date: string;
  status: 'ok' | 'warn' | 'pend';
}

function genData(): Complaint[] {
  const rows: Complaint[] = [];
  let id = 1042;
  const areas = [...CONSTITUENCIES];
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
      month: m,
      date: `${String(day).padStart(2, '0')}/${String(m + 1).padStart(2, '0')}/26`,
      status,
    });
  }
  return rows;
}

function computeTopSectorFromItems(
  items: Complaint[],
  getSectorName: (key: string) => string,
  noneLabel: string
): string {
  if (!items.length) return noneLabel;
  const catCounts: Record<string, number> = {};
  items.forEach((item) => {
    const secName = getSectorName(item.sector);
    catCounts[secName] = (catCounts[secName] || 0) + 1;
  });
  let topCat = noneLabel;
  let maxCatCount = 0;
  Object.entries(catCounts).forEach(([cat, count]) => {
    if (count > maxCatCount) {
      topCat = cat;
      maxCatCount = count;
    }
  });
  return topCat;
}

const DATA = genData();

export default function AnalyticsDashboard() {
  const { t, lang } = useLanguage();
  useWhistleCursor({ theme: "gold" });
  const [curArea, setCurArea] = useState("");
  const [curStatus, setCurStatus] = useState("all");
  const [curSearch, setCurSearch] = useState("");
  const [demoMode, setDemoMode] = useState(false);
  const [liveAnalytics, setLiveAnalytics] = useState<any>(null);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [isLiveLoading, setIsLiveLoading] = useState(false);
  const [managedDemoData, setManagedDemoData] = useState<Complaint[]>([]);
  const [isManagedDemoLoading, setIsManagedDemoLoading] = useState(false);
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  const MONTHS = useMemo(
    () => (lang === "ta" ? TAMIL_MONTHS.slice(1, 7) : EN_MONTHS.slice(1, 7)),
    [lang]
  );

  const STATUSES = useMemo(
    () =>
      STATUS_KEYS.map((key) => [
        key,
        key === "all" ? t("status.all") : t(`status.${key}`),
      ] as const),
    [t]
  );

  const sectorList = useMemo(
    () => [
      { key: "road", name: t("analytics.sector.road"), color: "#A00000" },
      { key: "water", name: t("analytics.sector.water"), color: "#1F7A8C" },
      { key: "power", name: t("analytics.sector.power"), color: "#E08600" },
      { key: "light", name: t("analytics.sector.light"), color: "#C7A008" },
      { key: "drain", name: t("analytics.sector.drain"), color: "#5E8C3A" },
      { key: "health", name: t("analytics.sector.health"), color: "#B5322B" },
      { key: "edu", name: t("analytics.sector.edu"), color: "#7A5BA6" },
      { key: "civic", name: t("analytics.sector.civic"), color: "#9A5B12" },
    ],
    [t]
  );

  const sectorMap = useMemo(
    () => Object.fromEntries(sectorList.map((s) => [s.key, s])),
    [sectorList]
  );

  const getSectorName = useCallback(
    (key: string) => sectorMap[key]?.name ?? t("analytics.sector.other"),
    [sectorMap, t]
  );

  const statusLabel = (status: Complaint["status"]) => {
    if (status === "ok") return t("status.ok");
    if (status === "warn") return t("analytics.in_progress");
    return t("analytics.status_registered");
  };

  // Memoize allowed areas based on user role
  const allowedAreas = useMemo(() => {
    if (sessionUser && sessionUser.role === "REPRESENTATIVE") {
      return ALL_AREAS.filter(a => a === sessionUser.constituency);
    }
    return ALL_AREAS;
  }, [sessionUser]);

  // Fetch current user session on mount
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setSessionUser(data.user);
            if (data.user.role === "REPRESENTATIVE") {
              // Default to live data scoped to their constituency; demo data is available via the toggle.
              setCurArea(data.user.constituency);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching session:", err);
      } finally {
        setIsSessionLoading(false);
      }
    };
    fetchSession();
  }, []);

  const liveConstituencyParam = useMemo(() => {
    if (sessionUser?.role === "REPRESENTATIVE" && sessionUser.constituency) {
      return sessionUser.constituency;
    }
    return curArea && curArea !== "" ? curArea : "";
  }, [sessionUser, curArea]);

  const refreshLiveAnalytics = async () => {
    setIsLiveLoading(true);
    try {
      const q = liveConstituencyParam
        ? `?constituency=${encodeURIComponent(liveConstituencyParam)}`
        : "";
      const res = await fetch(`/api/public/analytics${q}`);
        if (res.ok) {
          setLiveAnalytics(await res.json());
          setLiveError(null);
        } else {
          const body = await res.json().catch(() => ({}));
          setLiveAnalytics(null);
          setLiveError(
            typeof body.error === "string"
              ? body.error
              : t("analytics.error_fetch")
          );
        }
      } catch (err) {
        console.error("Error fetching live analytics:", err);
        setLiveAnalytics(null);
        setLiveError(t("analytics.db_error"));
    } finally {
      setIsLiveLoading(false);
    }
  };

  // Fetch live analytics from DB when demo mode is off
  useEffect(() => {
    if (demoMode || isSessionLoading) return;
    refreshLiveAnalytics();
  }, [demoMode, isSessionLoading, liveConstituencyParam]);

  // Complaint Popup Form State
  const [isComplaintOpen, setIsComplaintOpen] = useState(false);
  const [voterId, setVoterId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [voterVerified, setVoterVerified] = useState(false);
  const [verificationError, setVerificationError] = useState('');

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [gender, setGender] = useState('male');
  const [age, setAge] = useState('');
  const [address, setAddress] = useState('');
  const [constituency, setConstituency] = useState<string>(CONSTITUENCIES[0]);
  const [ward, setWard] = useState('');
  const [areaStreet, setAreaStreet] = useState('');
  const [category, setCategory] = useState(Object.keys(CATEGORIES)[0]);
  const [subcategory, setSubcategory] = useState(CATEGORIES[Object.keys(CATEGORIES)[0]][0]);
  const [description, setDescription] = useState('');
  const [emailHoneypot, setEmailHoneypot] = useState('');
  const [urgency, setUrgency] = useState('normal');

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
                  for (const constName of CONSTITUENCIES) {
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
      setVerificationError(t('api.voter_id_needed'));
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
        
        const matchedConstituency = CONSTITUENCIES.find(
          (c) => c.toLowerCase() === data.voter.Constituency.toLowerCase()
        );
        if (matchedConstituency) {
          setConstituency(matchedConstituency);
        }
      } else {
        setVerificationError(data.message || t('api.voter_not_found'));
      }
    } catch (err) {
      console.error(err);
      setVerificationError(t('login.error_conn'));
    } finally {
      setIsVerifying(false);
    }
  };

  // Geolocation lookup with Nominatim reverse geocoding to get real Tamil address!
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert(t('home.form.geo_unsupported'));
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
              for (const constName of CONSTITUENCIES) {
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
        alert(t('home.form.geo_error'));
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
      alert(t('home.form.camera_error'));
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
        alert(t('home.form.video_size_error'));
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
      alert(t('home.form.unverified_alert'));
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
        if (!demoMode) {
          await refreshLiveAnalytics();
        }
      } else {
        setSubmissionError(data.error || t('home.form.submit_success'));
      }
    } catch (err) {
      console.error(err);
      setSubmissionError(t('login.error_conn'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch managed demo data when in demo mode (authenticated users only)
  useEffect(() => {
    if (demoMode && sessionUser) {
      const fetchManagedDemo = async () => {
        setIsManagedDemoLoading(true);
        try {
          const constituency = sessionUser.role === "REPRESENTATIVE" ? sessionUser.constituency : (curArea !== "" ? curArea : "");
          const q = constituency ? `?constituency=${encodeURIComponent(constituency)}` : "";
          const res = await fetch(`/api/admin/demo${q}`);
          if (res.ok) {
            const raw = await res.json();
            const mapped: Complaint[] = raw.map((item: any) => ({
              id: item._id || `DEMO-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
              sector: item.sector || "civic",
              area: item.constituency || CONSTITUENCIES[0],
              title: item.title,
              month: typeof item.month === "number" ? item.month : 0,
              date: item.date || "01/01/26",
              status: (item.status as "ok" | "warn" | "pend") || "pend",
            }));
            setManagedDemoData(mapped);
          }
        } catch (err) {
          console.error("Error fetching managed demo data:", err);
        } finally {
          setIsManagedDemoLoading(false);
        }
      };
      fetchManagedDemo();
    } else if (!demoMode) {
      setManagedDemoData([]);
    }
  }, [demoMode, sessionUser, curArea]);

  const demoSourceData = useMemo((): Complaint[] => {
    if (sessionUser && managedDemoData.length > 0) {
      return managedDemoData;
    }
    if (sessionUser?.role === "REPRESENTATIVE" && sessionUser.constituency) {
      return DATA.filter((d) => d.area === sessionUser.constituency);
    }
    return DATA;
  }, [managedDemoData, sessionUser]);

  const activeData = useMemo((): Complaint[] => {
    if (!demoMode) {
      return (liveAnalytics?.records as Complaint[]) || [];
    }
    return demoSourceData;
  }, [demoMode, liveAnalytics, demoSourceData]);

  const areaFilteredData = useMemo((): Complaint[] => {
    if (sessionUser?.role === "REPRESENTATIVE" && sessionUser.constituency) {
      return activeData;
    }
    if (curArea === "") {
      return activeData;
    }
    return activeData.filter((d) => d.area === curArea);
  }, [curArea, activeData, sessionUser]);

  const filteredData = useMemo(() => {
    let d = areaFilteredData;
    if (curStatus !== 'all') {
      d = d.filter(x => x.status === curStatus);
    }
    if (curSearch) {
      const searchLower = curSearch.toLowerCase();
      d = d.filter(x => 
        (x.title + x.area + x.sector + x.id).toLowerCase().includes(searchLower) ||
        getSectorName(x.sector).toLowerCase().includes(searchLower)
      );
    }
    return d;
  }, [areaFilteredData, curStatus, curSearch, getSectorName]);

  // KPI Calculations
  const stats = useMemo(() => {
    if (!demoMode && liveAnalytics?.summary) {
      const s = liveAnalytics.summary;
      return {
        total: s.total,
        ok: s.resolved,
        warn: s.inProgress,
        pend: s.pending,
        rate: s.resolutionRate,
      };
    }
    const total = areaFilteredData.length;
    const ok = areaFilteredData.filter(x => x.status === 'ok').length;
    const warn = areaFilteredData.filter(x => x.status === 'warn').length;
    const pend = areaFilteredData.filter(x => x.status === 'pend').length;
    const rate = total ? Math.round(ok / total * 100) : 0;
    return { total, ok, warn, pend, rate };
  }, [areaFilteredData, demoMode, liveAnalytics]);

  const isDashboardLoading =
    isSessionLoading ||
    (!demoMode && isLiveLoading) ||
    (demoMode && !!sessionUser && isManagedDemoLoading);

  const isLiveDataUnavailable =
    !demoMode && !isLiveLoading && !isSessionLoading && !liveAnalytics && !!liveError;

  const categoryChartData = useMemo((): CategoryChartSlice[] => {
    return sectorList.map((s) => {
      const items = areaFilteredData.filter((x) => x.sector === s.key);
      return {
        key: s.key,
        name: s.name,
        value: items.length,
        resolved: items.filter((x) => x.status === 'ok').length,
        color: s.color,
      };
    });
  }, [areaFilteredData, sectorList]);

  const trendChartData = useMemo((): TrendChartPoint[] => {
    if (!demoMode && liveAnalytics?.monthlyTrends?.length) {
      return liveAnalytics.monthlyTrends.slice(-6).map(
        (item: { month: number; total: number; resolved: number }) => ({
          label: (lang === "ta" ? TAMIL_MONTHS[item.month] : EN_MONTHS[item.month]) || String(item.month),
          registered: item.total,
          resolved: item.resolved,
        })
      );
    }
    return MONTHS.map((label, i) => ({
      label,
      registered: areaFilteredData.filter((x) => x.month === i).length,
      resolved: areaFilteredData.filter((x) => x.month === i && x.status === 'ok').length,
    }));
  }, [areaFilteredData, demoMode, liveAnalytics, MONTHS, lang]);

  const radialMetrics = useMemo(() => buildRadialMetrics(stats, t), [stats, t]);

  // Dynamic Insights Generator
  const insights = useMemo(() => {
    const list: { title: string; desc: string; type: 'info' | 'success' | 'warning' }[] = [];
    
    // 1. Find category with most complaints in the selected area
    const catCounts: Record<string, number> = {};
    areaFilteredData.forEach(item => {
      const secName = getSectorName(item.sector);
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
        title: t('analytics.insight.top_cat_title').replace('{topCat}', topCat),
        desc: t('analytics.insight.top_cat_desc').replace('{topCat}', topCat).replace('{topCatCount}', String(topCatCount)),
        type: 'warning'
      });
    } else {
      list.push({
        title: t('analytics.insight.empty_title'),
        desc: t('analytics.insight.empty_desc'),
        type: 'info'
      });
    }

    // 2. Find constituency with highest resolution rate
    if (curArea === '') {
      const constStats = CONSTITUENCIES.map(c => {
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
          title: t('analytics.insight.best_area_title').replace('{bestConst}', t(bestConst)),
          desc: t('analytics.insight.best_area_desc').replace('{bestConst}', t(bestConst)).replace('{bestRate}', String(bestRate)),
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
          title: t('analytics.insight.worst_area_title').replace('{worstConst}', t(worstConst)),
          desc: t('analytics.insight.worst_area_desc').replace('{worstConst}', t(worstConst)).replace('{worstCount}', String(worstCount)),
          type: 'info'
        });
      }
    } else {
      const okCount = areaFilteredData.filter(x => x.status === 'ok').length;
      const rate = areaFilteredData.length ? Math.round((okCount / areaFilteredData.length) * 100) : 0;
      
      list.push({
        title: t('analytics.insight.area_rate_title').replace('{curArea}', t(curArea)).replace('{rate}', String(rate)),
        desc: t('analytics.insight.area_rate_desc').replace('{total}', String(areaFilteredData.length)).replace('{ok}', String(okCount)),
        type: 'success'
      });

      const sortedCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
      if (sortedCats.length > 1) {
        list.push({
          title: t('analytics.insight.second_cat_title').replace('{cat}', sortedCats[1][0]),
          desc: t('analytics.insight.second_cat_desc').replace('{cat}', sortedCats[1][0]).replace('{count}', String(sortedCats[1][1])),
          type: 'info'
        });
      } else {
        list.push({
          title: t('analytics.insight.quick_action_title'),
          desc: t('analytics.insight.quick_action_desc'),
          type: 'info'
        });
      }
    }

    return list;
  }, [areaFilteredData, activeData, curArea, t, getSectorName]);

  // Constituency Analytics Data
  const constituencyStats = useMemo((): Array<{ name: string; total: number; ok: number; warn: number; pend: number; rate: number; topCat: string }> => {
    const noneLabel = t("analytics.none");
    if (!demoMode && liveAnalytics?.constituencyStats) {
      const statsMap = Object.fromEntries(
        liveAnalytics.constituencyStats.map((c: any) => [c.constituency, c])
      );
      const allRecords = (liveAnalytics?.records as Complaint[]) || [];
      return CONSTITUENCIES.map((c) => {
        const found = statsMap[c];
        const items = allRecords.filter((d) => d.area === c);
        return {
          name: c,
          total: found?.total ?? 0,
          ok: found?.resolved ?? 0,
          warn: found?.inProgress ?? 0,
          pend: found?.pending ?? 0,
          rate: found?.rate ?? 0,
          topCat: computeTopSectorFromItems(items, getSectorName, noneLabel),
        };
      });
    }
    return CONSTITUENCIES.map(c => {
      const items = activeData.filter(d => d.area === c);
      const total = items.length;
      const ok = items.filter(d => d.status === 'ok').length;
      const warn = items.filter(d => d.status === 'warn').length;
      const pend = items.filter(d => d.status === 'pend').length;
      const rate = total ? Math.round((ok / total) * 100) : 0;
      const topCat = computeTopSectorFromItems(items, getSectorName, noneLabel);

      return {
        name: c,
        total,
        ok,
        warn,
        pend,
        rate,
        topCat
      };
    });
  }, [activeData, demoMode, liveAnalytics, t, getSectorName]);

  const constituencyChartData = useMemo(
    () =>
      constituencyStats.map((c) => ({
        name: t(c.name),
        shortName: t(c.name),
        total: c.total,
        ok: c.ok,
        warn: c.warn,
        pend: c.pend,
        rate: c.rate,
      })),
    [constituencyStats, t]
  );

  // Recent Activity Feed
  const recentActivities = useMemo(() => {
    return [...areaFilteredData]
      .sort((a, b) => b.id.localeCompare(a.id))
      .slice(0, 5);
  }, [areaFilteredData]);

  const topBarLinks = useMemo((): TopBarLink[] => {
    const links: TopBarLink[] = [
      { href: "/track", label: t("nav.track_short"), highlight: true },
    ];

    if (sessionUser?.role === "SUPER_ADMIN") {
      links.push({ href: "/admin", label: t("nav.admin_panel"), highlight: true });
    }

    if (sessionUser) {
      links.push({ href: "/complaints", label: t("nav.complaints_portal") });
    } else {
      links.push({ href: "/login?redirect=/analytics", label: t("nav.login") });
    }

    links.push({ href: "/", label: t("nav.home") });
    return links;
  }, [sessionUser, t]);

  return (
    <div className="analytics-body">
      <WhistleCursor />
      <TvkTopBar title={t("footer.tagline")} brandHref="#top" links={topBarLinks} />

      {/* PAGE HERO */}
      <section className="phero" id="top">
        <img className="ph-medal-whistle" src={TVK_LOGO} alt="" aria-hidden="true" />
        <div className="wrap flex flex-col items-start gap-4">
          <span className="ph-eyebrow">{t("analytics.hero.eyebrow")}</span>
          {sessionUser && (
            <div className="session-user-badge" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.15)',
              padding: '0.4rem 0.9rem',
              borderRadius: '2rem',
              color: '#FECB02',
              fontSize: '0.85rem',
              fontWeight: 700,
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
            }}>
              <span>👤</span>
              <span>
                {t("analytics.welcome_badge", {
                  username: sessionUser.username,
                  role:
                    sessionUser.role === "SUPER_ADMIN"
                      ? t("common.super_admin")
                      : `${t("common.representative")} - ${t(sessionUser.constituency)}`,
                })}
              </span>
            </div>
          )}
          <h1>{t("analytics.hero.title")}</h1>
          <p>{t("analytics.hero.desc")}</p>
          <span className="ph-live"><i></i> {demoMode ? t("analytics.demo_db_badge") : t("analytics.live_db_badge")}</span>
        </div>
      </section>

      {/* FILTER BAR */}
      <div className="filterbar">
        <div className="wrap">
          <div className="fb-row">
            {(!sessionUser || sessionUser.role !== "REPRESENTATIVE") && (
              <>
                <span className="fb-label">{t("analytics.area_label")}</span>
                <div className="area-chips" id="areaChips">
                  {allowedAreas.map((a, i) => (
                    <button
                      key={i}
                      className={`achip ${curArea === a ? 'active' : ''}`}
                      onClick={() => setCurArea(a)}
                    >
                      {t(a)}
                    </button>
                  ))}
                </div>
              </>
            )}
            <div className="fb-search">
              <div className="fb-search-input-wrapper">
                <svg viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.3-4.3" />
                </svg>
                <input
                  type="text"
                  id="search"
                  placeholder={t("analytics.search_placeholder")}
                  autoComplete="off"
                  value={curSearch}
                  onChange={(e) => setCurSearch(e.target.value)}
                />
              </div>
              <div className="fb-toggle-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0.75rem', background: demoMode ? 'rgba(254,203,2,0.12)' : 'rgba(0,0,0,0.04)', border: `1.5px solid ${demoMode ? '#FECB02' : 'var(--line)'}`, borderRadius: '2rem', transition: 'all 0.2s' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: demoMode ? '#A06800' : 'var(--ink-soft)', whiteSpace: 'nowrap' }}>
                  {demoMode ? t("analytics.demo_badge") : t("analytics.live_badge")}
                </span>
                <button
                  type="button"
                  onClick={() => setDemoMode(!demoMode)}
                  title={demoMode ? t("analytics.demo_banner") : t("analytics.live_banner")}
                  aria-pressed={demoMode}
                  style={{
                    position: 'relative', width: '40px', height: '22px', borderRadius: '11px',
                    background: demoMode ? '#FECB02' : '#ccc', border: 'none', cursor: 'pointer',
                    transition: 'background 0.25s', flexShrink: 0, padding: 0,
                  }}
                >
                  <span aria-hidden="true" style={{
                    position: 'absolute', top: '3px', left: demoMode ? '21px' : '3px',
                    width: '16px', height: '16px', borderRadius: '50%', background: '#fff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.25)', transition: 'left 0.25s',
                  }} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data mode status */}
      {!demoMode && isLiveLoading && (
        <div style={{ textAlign: 'center', padding: '0.5rem', fontSize: '0.82rem', color: 'var(--ink-soft)', background: 'rgba(63,143,74,0.08)' }}>
          {t("analytics.live_loading")}
        </div>
      )}
      {demoMode && sessionUser && isManagedDemoLoading && (
        <div style={{ textAlign: 'center', padding: '0.5rem', fontSize: '0.82rem', color: 'var(--ink-soft)', background: 'rgba(254,203,2,0.07)' }}>
          {t("analytics.demo_loading")}
        </div>
      )}
      {demoMode && sessionUser && !isManagedDemoLoading && managedDemoData.length === 0 && (
        <div style={{ textAlign: 'center', padding: '0.4rem', fontSize: '0.8rem', color: 'var(--ink-soft)', background: 'rgba(0,0,0,0.03)' }}>
           {t("analytics.demo_fallback")}
        </div>
      )}

      {/* KPIs & dashboard body */}
      <section className="section analytics-dashboard-section">
        <div className="wrap">
          {isLiveDataUnavailable ? (
            <AnalyticsEmptyState
              title={t("analytics.data_unavailable")}
              message={
                liveError ||
                t("analytics.live_fetch_error")
              }
              onRetry={refreshLiveAnalytics}
            />
          ) : (
            <>
          {isDashboardLoading ? (
            <KpiSkeletonGrid count={5} />
          ) : (
          <div className="kpi-grid" id="kpiGrid" role="list" aria-label={t("analytics.key_indicators")}>
            <KpiCard
              label={t("analytics.total_complaints")}
              value={stats.total}
              accent="var(--red)"
              accentBg="rgba(160,0,0,.1)"
              dataClabel={t("analytics.total_complaints")}
              icon={<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>}
            />
            <KpiCard
              label={t("status.ok")}
              value={stats.ok}
              accent="var(--ok)"
              accentBg="var(--ok-bg)"
              dataClabel={t("status.ok")}
              icon={<svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></svg>}
            />
            <KpiCard
              label={t("analytics.in_progress")}
              value={stats.warn}
              accent="var(--warn)"
              accentBg="var(--warn-bg)"
              dataClabel={t("analytics.in_progress")}
              icon={<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
            />
            <KpiCard
              label={t("analytics.status_registered")}
              value={stats.pend}
              accent="var(--pend)"
              accentBg="var(--pend-bg)"
              dataClabel={t("analytics.status_registered")}
              icon={<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>}
            />
            <KpiCard
              label={t("analytics.resolution_rate")}
              value={stats.rate}
              suffix="%"
              accent="var(--gold)"
              accentBg="rgba(254,203,2,.16)"
              dataClabel={t("analytics.resolution_rate")}
              icon={<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>}
            />
          </div>
          )}

          {/* DYNAMIC INSIGHTS */}
          <div className="insights-section">
            <h3 className="section-title">{t("analytics.key_insights_title")}</h3>
            <div className="insights-grid">
              {insights.map((ins, idx) => (
                <div key={idx} className={`insight-card ${ins.type}`} data-clabel={t("analytics.insights")}>
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

          {/* RESOLUTION PERFORMANCE */}
          <div className="card analytics-performance-card" data-clabel={t("analytics.resolution_performance")}>
            <div className="card-head">
              <div>
                <h3>{t("analytics.resolution_performance")}</h3>
                <div className="sub">{t("analytics.resolution_performance_sub")}</div>
              </div>
            </div>
            {isDashboardLoading ? (
              <ChartSkeleton variant="radial" />
            ) : (
              <ResolutionRadialCharts metrics={radialMetrics} />
            )}
          </div>

          {/* CHARTS */}
          <div className="charts analytics-charts-grid">
            <div className="card analytics-chart-card" data-clabel={t("analytics.category_complaints")}>
              <div className="card-head">
                <div>
                  <h3>{t("analytics.category_complaints")}</h3>
                  <div className="sub">{t("analytics.category_sub")}</div>
                </div>
                <span className="card-tag" id="sectorAreaTag">{curArea ? t(curArea) : t("அனைத்தும்")}</span>
              </div>
              {isDashboardLoading ? (
                <ChartSkeleton variant="donut" />
              ) : (
                <CategoryDoughnutChart data={categoryChartData} areaLabel={curArea ? t(curArea) : t("அனைத்தும்")} />
              )}
            </div>

            <div className="card analytics-chart-card" data-clabel={t("analytics.resolution_status")}>
              <div className="card-head">
                <div>
                  <h3>{t("analytics.resolution_status")}</h3>
                  <div className="sub">{t("analytics.status_sub")}</div>
                </div>
              </div>
              {isDashboardLoading ? (
                <ChartSkeleton variant="donut" />
              ) : (
                <StatusDoughnutChart ok={stats.ok} warn={stats.warn} pend={stats.pend} rate={stats.rate} />
              )}
            </div>
          </div>

          {/* TREND & ACTIVITY GRID */}
          <div className="trend-activity-grid">
            {/* TREND */}
            <div className="card trend-card" data-clabel={t("analytics.monthly_trend")}>
              <div className="card-head">
                <div>
                  <h3>{t("analytics.monthly_trend")}</h3>
                  <div className="sub">{t("analytics.trend_sub")}</div>
                </div>
              </div>
              {isDashboardLoading ? (
                <ChartSkeleton variant="area" />
              ) : (
                <MonthlyTrendChart data={trendChartData} />
              )}
            </div>

            {/* RECENT ACTIVITY FEED */}
            <div className="card activity-card" data-clabel={t("analytics.recent_activity")}>
              <div className="card-head">
                <div>
                  <h3>{t("analytics.recent_activity")}</h3>
                  <div className="sub">{t("analytics.recent_activity_sub")}</div>
                </div>
              </div>
              <div className="activity-timeline">
                {recentActivities.length === 0 ? (
                  <p className="no-activity">{t("analytics.no_recent_activity")}</p>
                ) : (
                  recentActivities.map((act, idx) => {
                    const s = sectorMap[act.sector];
                    return (
                      <div key={idx} className="timeline-item" data-clabel={t("analytics.activity")}>
                        <div className="timeline-badge" style={{ background: s?.color || 'var(--red)' }}></div>
                        <div className="timeline-content">
                          <div className="timeline-header">
                            <span className="timeline-id">{act.id}</span>
                            <span className="timeline-date">{act.date}</span>
                          </div>
                          <p className="timeline-title">{getSectorName(act.sector)}</p>
                          <div className="timeline-footer">
                            <span className="timeline-area"> {t(act.area)}</span>
                            <span className={`timeline-status ${act.status}`}>
                              {statusLabel(act.status)}
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
            <div className="card constituency-card analytics-chart-card" data-clabel={t("analytics.constituency_analysis")}>
              <div className="card-head">
                <div>
                  <h3>{t("analytics.constituency_analysis_title")}</h3>
                  <div className="sub">{t("analytics.constituency_analysis_sub")}</div>
                </div>
              </div>
              {isDashboardLoading ? (
                <ChartSkeleton variant="bar" />
              ) : (
                <ConstituencyBarChart data={constituencyChartData} />
              )}
              <div className="const-grid analytics-const-summary">
                {constituencyStats.map((c, idx) => (
                  <div key={idx} className="const-stat-card">
                    <div className="const-stat-header">
                      <h4>{t(c.name)}</h4>
                      <span className="const-rate-badge">{t("analytics.rate_badge", { rate: c.rate })}</span>
                    </div>
                    <div className="const-stat-body">
                      <div className="const-stat-row">
                        <span>{t("analytics.total_complaints")}:</span>
                        <strong>{c.total}</strong>
                      </div>
                      <div className="const-stat-row">
                        <span>{t("analytics.resolved_items")}:</span>
                        <strong style={{ color: 'var(--ok)' }}>{c.ok} ✓</strong>
                      </div>
                      <div className="const-stat-row">
                        <span>{t("analytics.top_sector_label")}</span>
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
              <h3>{t("analytics.complaint_stats")}</h3>
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
                    <th>{t("analytics.col_no")}</th>
                    <th>{t("analytics.col_sector")}</th>
                    <th>{t("analytics.col_category")}</th>
                    <th>{t("analytics.col_constituency")}</th>
                    <th>{t("analytics.col_date")}</th>
                    <th>{t("analytics.col_status")}</th>
                  </tr>
                </thead>
                <tbody id="tbody">
                  {!filteredData.length ? (
                    <tr><td colSpan={6} className="t-empty">{t("analytics.no_complaints_filter")}</td></tr>
                  ) : (
                    filteredData.slice(0, 40).map(x => {
                      const s = sectorMap[x.sector];
                      return (
                        <tr key={x.id}>
                          <td className="t-id">{x.id}</td>
                          <td>
                            <span className="t-sector">
                              <i style={{ background: s?.color || 'var(--red)' }}></i>
                              {getSectorName(x.sector)}
                            </span>
                          </td>
                          <td className="t-title">{labelComplaintCategory(x.title, t)}</td>
                          <td className="t-meta">{t(x.area)}</td>
                          <td className="t-meta">{x.date}</td>
                          <td>
                            <span className={`badge ${x.status}`}><i></i>{statusLabel(x.status)}</span>
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
                {t("analytics.showing_count", { count: filteredData.length })}
                {filteredData.length > 40 ? t("analytics.top40_suffix") : ""}
              </span>
              <span>{t("analytics.privacy_note")}</span>
            </div>
          </div>
            </>
          )}
        </div>
      </section>

      <TvkAppFooter tagline={demoMode ? t("analytics.demo_mode_label") : t("analytics.live_mode_label")} />

      {/* COMPLAINT POPUP MODAL MOVED TO HOME PAGE */}
    </div>
  );
}
