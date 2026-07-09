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
  resourceType: "image" | "video" | "auto" = "image"
): Promise<string> {
  configureCloudinary();

  let result: { secure_url: string };
  const dataUrlMatch = base64Data.match(/^data:([^;,]+)(?:;[^,]*)?;base64,(.*)$/);

  if (dataUrlMatch) {
    const buffer = Buffer.from(dataUrlMatch[2], "base64");
    result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `tvk-west/${folder}`,
          resource_type: resourceType,
        },
        (error, uploadResult) => {
          if (error || !uploadResult) {
            reject(error || new Error("Cloudinary upload failed"));
            return;
          }
          resolve(uploadResult as { secure_url: string });
        }
      );
      stream.end(buffer);
    });
  } else {
    result = (await cloudinary.uploader.upload(base64Data, {
      folder: `tvk-west/${folder}`,
      resource_type: resourceType,
    })) as { secure_url: string };
  }

  return result.secure_url;
}

export async function uploadMediaListToCloudinary(
  items: string[],
  folder: string,
  resourceType: "image" | "video" | "auto" = "image"
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
