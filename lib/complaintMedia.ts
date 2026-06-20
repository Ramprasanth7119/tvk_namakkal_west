type ComplaintMediaSource = {
  photoUrls?: string[];
  videoUrls?: string[];
  mediaUrls?: {
    photos?: string[];
    video?: string;
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

/** Normalized media shape for API responses and UI. */
export function normalizeComplaintMedia(complaint: ComplaintMediaSource) {
  const photos = getComplaintPhotos(complaint);
  const video = getComplaintVideo(complaint);
  return {
    photos,
    video,
    mediaUrls: { photos, video: video || undefined },
  };
}
