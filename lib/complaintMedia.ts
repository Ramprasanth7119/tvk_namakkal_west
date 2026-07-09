type ComplaintMediaSource = {
  photoUrls?: string[];
  videoUrls?: string[];
  audioUrls?: string[];
  mediaUrls?: {
    photos?: string[];
    video?: string;
    audio?: string;
  };
};

function isDisplayableUrl(url: unknown): url is string {
  return typeof url === "string" && (url.startsWith("http") || url.startsWith("data:"));
}

/** Resolve photo URLs from Cloudinary fields or legacy mediaUrls. */
export function getComplaintPhotos(complaint: ComplaintMediaSource | null | undefined): string[] {
  if (!complaint) return [];

  if (complaint.photoUrls?.length) {
    return complaint.photoUrls.filter(isDisplayableUrl);
  }

  if (complaint.mediaUrls?.photos?.length) {
    return complaint.mediaUrls.photos.filter(isDisplayableUrl);
  }

  return [];
}

/** Resolve video URL from Cloudinary fields or legacy mediaUrls. */
export function getComplaintVideo(complaint: ComplaintMediaSource | null | undefined): string | null {
  if (!complaint) return null;

  if (complaint.videoUrls?.length) {
    const url = complaint.videoUrls[0];
    return isDisplayableUrl(url) ? url : null;
  }

  const legacy = complaint.mediaUrls?.video;
  return isDisplayableUrl(legacy) ? legacy : null;
}

/** Resolve audio URL from Cloudinary fields or legacy mediaUrls. */
export function getComplaintAudio(complaint: ComplaintMediaSource | null | undefined): string | null {
  if (!complaint) return null;

  if (complaint.audioUrls?.length) {
    const url = complaint.audioUrls[0];
    return isDisplayableUrl(url) ? url : null;
  }

  const legacy = complaint.mediaUrls?.audio;
  return isDisplayableUrl(legacy) ? legacy : null;
}

/** Normalized media shape for API responses and UI. */
export function normalizeComplaintMedia(complaint: ComplaintMediaSource) {
  const photos = getComplaintPhotos(complaint);
  const video = getComplaintVideo(complaint);
  const audio = getComplaintAudio(complaint);
  return {
    photos,
    video,
    audio,
    mediaUrls: {
      photos,
      video: video || undefined,
      audio: audio || undefined,
    },
  };
}
