import { useState } from "react";
import { CONSTITUENCIES } from "@/constants/constituencies";

export function useGeolocation() {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isIpLocating, setIsIpLocating] = useState(false);
  const [locationAttempts, setLocationAttempts] = useState(0);
  const [successLocationCount, setSuccessLocationCount] = useState(0);
  const [gpsMessage, setGpsMessage] = useState("");
  const [locationTimestamp, setLocationTimestamp] = useState<string>("");

  const handleGetLocation = (
    voterVerified: boolean,
    onAddressFetched: (addr: string) => void,
    onConstituencyFetched: (constName: string) => void
  ) => {
    if (!voterVerified) {
      setGpsMessage("முதலில் வாக்காளர் சரிபார்ப்பை முடிக்கவும்");
      return;
    }

    // Cache lookup
    if (successLocationCount >= 2) {
      setGpsMessage("முன்னர் பெறப்பட்ட இருப்பிடத் தகவல் பயன்படுத்தப்படுகிறது.");
      const cachedLat = localStorage.getItem("tvk_gps_lat");
      const cachedLon = localStorage.getItem("tvk_gps_lon");
      const cachedAddr = localStorage.getItem("tvk_gps_address");
      if (cachedLat && cachedLon) {
        setLatitude(Number(cachedLat));
        setLongitude(Number(cachedLon));
        if (cachedAddr) onAddressFetched(cachedAddr);
      }
      return;
    }

    if (locationAttempts >= 2) {
      setGpsMessage("அதிகப்படியான இருப்பிட முயற்சிகள் (அதிகபட்சம் 2 முறை).");
      return;
    }

    if (!navigator.geolocation) {
      alert("உங்கள் உலாவி இருப்பிட சேவையை ஆதரிக்கவில்லை.");
      return;
    }

    setIsLocating(true);
    setGpsMessage("");
    setLocationAttempts((prev) => prev + 1);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const timestamp = new Date().toISOString();

        setLatitude(lat);
        setLongitude(lon);
        setLocationTimestamp(timestamp);
        setSuccessLocationCount((prev) => prev + 1);

        localStorage.setItem("tvk_gps_lat", String(lat));
        localStorage.setItem("tvk_gps_lon", String(lon));
        localStorage.setItem("tvk_gps_timestamp", timestamp);

        try {
          const geocodeUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=ta,en`;
          const geoRes = await fetch(geocodeUrl, {
            headers: {
              "User-Agent": "TVK-Namakkal-West-Grievance-Platform",
            },
          });
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            if (geoData.display_name) {
              onAddressFetched(geoData.display_name);
              localStorage.setItem("tvk_gps_address", geoData.display_name);

              const addressLower = geoData.display_name.toLowerCase();
              for (const constName of CONSTITUENCIES) {
                if (addressLower.includes(constName.toLowerCase())) {
                  onConstituencyFetched(constName);
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
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setGpsMessage("இருப்பிட அனுமதி மறுக்கப்பட்டுள்ளது. தயவுசெய்து உலாவி அமைப்புகளில் அனுமதியை வழங்கவும்.");
        } else if (error.code === error.TIMEOUT) {
          setGpsMessage("இருப்பிடத்தை கண்டறிய முடியவில்லை. மீண்டும் முயற்சிக்கவும்.");
        } else {
          setGpsMessage("இருப்பிடத்தை கண்டறிய முடியவில்லை. மீண்டும் முயற்சிக்கவும்.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const fetchIpLocation = async (
    onAddressFetched: (addr: string) => void,
    onConstituencyFetched: (constName: string) => void
  ) => {
    setIsIpLocating(true);
    try {
      const res = await fetch("https://ipapi.co/json/");
      if (res.ok) {
        const data = await res.json();
        if (data.latitude && data.longitude) {
          const lat = data.latitude;
          const lon = data.longitude;
          setLatitude(lat);
          setLongitude(lon);

          const geocodeUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=ta,en`;
          const geoRes = await fetch(geocodeUrl, {
            headers: {
              "User-Agent": "TVK-Namakkal-West-Grievance-Platform",
            },
          });
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            if (geoData.display_name) {
              onAddressFetched(geoData.display_name);
              const addressLower = geoData.display_name.toLowerCase();
              for (const constName of CONSTITUENCIES) {
                if (addressLower.includes(constName.toLowerCase())) {
                  onConstituencyFetched(constName);
                  break;
                }
              }
            } else {
              onAddressFetched(`${data.city}, ${data.region}, India`);
            }
          } else {
            onAddressFetched(`${data.city}, ${data.region}, India`);
          }
        } else if (data.city && data.region) {
          onAddressFetched(`${data.city}, ${data.region}, India`);
        }
      }
    } catch (err) {
      console.error("Error fetching IP Geolocation:", err);
    } finally {
      setIsIpLocating(false);
    }
  };

  return {
    latitude,
    setLatitude,
    longitude,
    setLongitude,
    isLocating,
    setIsLocating,
    isIpLocating,
    setIsIpLocating,
    locationAttempts,
    setLocationAttempts,
    successLocationCount,
    setSuccessLocationCount,
    gpsMessage,
    setGpsMessage,
    locationTimestamp,
    setLocationTimestamp,
    handleGetLocation,
    fetchIpLocation,
  };
}
