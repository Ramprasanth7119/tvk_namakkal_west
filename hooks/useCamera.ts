import { useState } from "react";

export function useCamera() {
  const [isCameraActive, setIsCameraActive] = useState(false);

  const startCamera = async (
    videoRef: React.RefObject<HTMLVideoElement | null>
  ) => {
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      alert("கேமராவை இயக்க முடியவில்லை. கோப்புகளை நேரடியாக பதிவேற்றவும்.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = (videoRef: React.RefObject<HTMLVideoElement | null>) => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = (
    videoRef: React.RefObject<HTMLVideoElement | null>,
    onPhotoCaptured: (base64Data: string) => void
  ) => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg");
      onPhotoCaptured(dataUrl);
    }
    stopCamera(videoRef);
  };

  return {
    isCameraActive,
    setIsCameraActive,
    startCamera,
    stopCamera,
    capturePhoto,
  };
}
