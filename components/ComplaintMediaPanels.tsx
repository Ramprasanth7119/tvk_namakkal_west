"use client";

import { useLanguage } from "@/components/LanguageProvider";
import {
  getComplaintAudio,
  getComplaintPhotos,
  getComplaintVideo,
} from "@/lib/complaintMedia";

type CitizenMediaProps = {
  complaint: Parameters<typeof getComplaintPhotos>[0];
  title?: string;
};

type SolutionEvidenceProps = {
  beforeImages?: string[];
  afterImages?: string[];
  videos?: string[];
  audios?: string[];
  workNotes?: string;
  title?: string;
};

function MediaEmpty({ label }: { label: string }) {
  return (
    <p style={{ fontSize: "0.85rem", color: "#999", fontStyle: "italic", margin: 0 }}>{label}</p>
  );
}

function PhotoGrid({ photos, altPrefix }: { photos: string[]; altPrefix: string }) {
  if (!photos.length) return null;
  return (
    <div className="complaint-media-grid">
      {photos.map((photo, idx) => (
        <a
          href={photo}
          target="_blank"
          rel="noopener noreferrer"
          key={`${altPrefix}-${idx}`}
          className="complaint-media-thumb"
        >
          <img src={photo} alt={`${altPrefix} ${idx + 1}`} loading="lazy" />
        </a>
      ))}
    </div>
  );
}

function VideoList({ videos }: { videos: string[] }) {
  if (!videos.length) return null;
  return (
    <div className="complaint-media-playback-list">
      {videos.map((vid, idx) => (
        <video
          key={`vid-${idx}`}
          src={vid}
          controls
          playsInline
          preload="metadata"
          className="complaint-media-video"
        />
      ))}
    </div>
  );
}

function AudioList({ audios }: { audios: string[] }) {
  if (!audios.length) return null;
  return (
    <div className="complaint-media-playback-list">
      {audios.map((audio, idx) => (
        <audio
          key={`aud-${idx}`}
          src={audio}
          controls
          preload="metadata"
          className="complaint-media-audio"
        />
      ))}
    </div>
  );
}

/** Citizen-submitted photos, video, and audio from the original complaint. */
export function CitizenMediaPanel({ complaint, title }: CitizenMediaProps) {
  const { t } = useLanguage();
  const photos = getComplaintPhotos(complaint);
  const video = getComplaintVideo(complaint);
  const audio = getComplaintAudio(complaint);

  if (!photos.length && !video && !audio) return null;

  return (
    <div className="complaint-media-panel">
      <h4 className="complaint-media-panel-title">
        {title || t("complaints.modal.media_sec")}
      </h4>
      <div className="complaint-media-row">
        <div className="complaint-media-cell">
          <span className="complaint-media-label">{t("complaints.modal.photos_sec")}</span>
          {photos.length > 0 ? (
            <PhotoGrid photos={photos} altPrefix="Photo" />
          ) : (
            <MediaEmpty label={t("complaints.modal.photos_none")} />
          )}
        </div>

        <div className="complaint-media-cell">
          <span className="complaint-media-label">{t("complaints.modal.video_sec")}</span>
          {video ? (
            <VideoList videos={[video]} />
          ) : (
            <MediaEmpty label={t("complaints.modal.video_none")} />
          )}
        </div>

        <div className="complaint-media-cell">
          <span className="complaint-media-label">{t("complaints.modal.audio_sec")}</span>
          {audio ? (
            <AudioList audios={[audio]} />
          ) : (
            <MediaEmpty label={t("complaints.modal.audio_none")} />
          )}
        </div>
      </div>
    </div>
  );
}

/** Field-officer solution evidence: before/after photos, videos, audio, notes. */
export function SolutionEvidencePanel({
  beforeImages = [],
  afterImages = [],
  videos = [],
  audios = [],
  workNotes,
  title,
}: SolutionEvidenceProps) {
  const { t } = useLanguage();
  const hasMedia =
    beforeImages.length > 0 ||
    afterImages.length > 0 ||
    videos.length > 0 ||
    audios.length > 0 ||
    Boolean(workNotes);

  if (!hasMedia) return null;

  return (
    <div className="complaint-media-panel">
      <h4 className="complaint-media-panel-title">
        {title || t("tasks.modal.submit_sec_title")}
      </h4>

      <div className="complaint-media-row complaint-media-row--two">
        <div className="complaint-media-cell">
          <span className="complaint-media-label">{t("tasks.modal.submitted_before")}</span>
          {beforeImages.length > 0 ? (
            <PhotoGrid photos={beforeImages} altPrefix="Before" />
          ) : (
            <MediaEmpty label={t("complaints.modal.photos_none")} />
          )}
        </div>

        <div className="complaint-media-cell">
          <span className="complaint-media-label">{t("tasks.modal.submitted_after")}</span>
          {afterImages.length > 0 ? (
            <PhotoGrid photos={afterImages} altPrefix="After" />
          ) : (
            <MediaEmpty label={t("complaints.modal.photos_none")} />
          )}
        </div>
      </div>

      {videos.length > 0 && (
        <div className="complaint-media-cell" style={{ marginTop: "1rem" }}>
          <span className="complaint-media-label">{t("tasks.modal.submitted_video")}</span>
          <VideoList videos={videos} />
        </div>
      )}

      {audios.length > 0 && (
        <div className="complaint-media-cell" style={{ marginTop: "1rem" }}>
          <span className="complaint-media-label">{t("tasks.modal.submitted_audio")}</span>
          <AudioList audios={audios} />
        </div>
      )}

      {workNotes && (
        <div className="complaint-media-notes">
          <span className="complaint-media-label">{t("tasks.modal.submitted_notes")}</span>
          <p>{workNotes}</p>
        </div>
      )}
    </div>
  );
}
