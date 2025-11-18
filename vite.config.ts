import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { cartographer } from "@replit/vite-plugin-cartographer";
import { devBanner } from "@replit/vite-plugin-dev-banner";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isReplit = process.env.REPL_ID !== undefined;
const isDevelopment = process.env.NODE_ENV !== "production";

export default defineConfig({
	plugins: [
		react(),
		runtimeErrorOverlay(),
		...(process.env.NODE_ENV !== "production" &&
		process.env.REPL_ID !== undefined
			? [
					await import("@replit/vite-plugin-cartographer").then((m) => m.cartographer()),
					await import("@replit/vite-plugin-dev-banner").then((m) => m.devBanner()),
				]
			: []),
	],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "src"),
			"@shared": path.resolve(__dirname, "src", "shared"),
			"@assets": path.resolve(__dirname, "attached_assets"),
		},
	},
	build: {
		outDir: "dist",
		emptyOutDir: true,
	},
	server: {
		host: "0.0.0.0",
        port: 5000,
        allowedHosts: true,
		proxy: {
			"/api": {
				target: process.env.VITE_API_URL || "https://suivi-backend.vercel.app" || "http://127.0.0.1:5000",
				changeOrigin: true,
      secure: false,
	  cookieDomainRewrite: "",
      cookiePathRewrite: "/",
      configure: (proxy) => {
        proxy.on("proxyReq", (proxyReq) => {
          proxyReq.setHeader("origin", process.env.VITE_API_URL || "https://suivi-backend.vercel.app" || "http://127.0.0.1:5000");
        });
      },
			},
		},
		fs: {
			strict: true,
			deny: ["**/.*"],
		},
	},
});


