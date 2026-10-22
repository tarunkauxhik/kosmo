import type { MetadataRoute } from "next";
import { appConfig } from "@/lib/config";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: `${appConfig.name}: AI astrologers`,
        short_name: appConfig.name,
        description: appConfig.description,
        lang: "en-IN",
        start_url: "/dashboard",
        scope: "/",
        display: "standalone",
        background_color: appConfig.themeColor,
        theme_color: appConfig.themeColor,
        icons: [
            { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
            { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
            { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
        ],
    };
}
