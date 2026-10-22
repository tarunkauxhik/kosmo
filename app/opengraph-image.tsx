import { appConfig } from "@/lib/config";
import { ogContentType, ogImage, ogSize } from "@/lib/og";

export const alt = `${appConfig.name}: talk through your chart with an AI astrologer`;
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
    return ogImage({ title: "Talk through your chart with an AI astrologer", subtitle: appConfig.description });
}
