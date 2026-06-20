import { v2 as cloudinary } from "cloudinary";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

export function isCloudinaryConfigured(): boolean {
  return Boolean(cloudName && apiKey && apiSecret);
}

function configureCloudinary() {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured");
  }
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

export async function uploadBase64ToCloudinary(
  base64Data: string,
  folder: string,
  resourceType: "image" | "video" = "image"
): Promise<string> {
  configureCloudinary();

  const result = await cloudinary.uploader.upload(base64Data, {
    folder: `tvk-west/${folder}`,
    resource_type: resourceType,
  });

  return result.secure_url;
}

export async function uploadMediaListToCloudinary(
  items: string[],
  folder: string,
  resourceType: "image" | "video" = "image"
): Promise<string[]> {
  const urls: string[] = [];
  for (const item of items) {
    if (!item) continue;
    if (item.startsWith("http://") || item.startsWith("https://")) {
      urls.push(item);
      continue;
    }
    const url = await uploadBase64ToCloudinary(item, folder, resourceType);
    urls.push(url);
  }
  return urls;
}
