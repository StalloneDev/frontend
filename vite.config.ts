import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
		proxy: {
			"/api": {
				target: "http://127.0.0.1:5000",
				changeOrigin: true,
      secure: false,
      configure: (proxy) => {
        proxy.on("proxyReq", (proxyReq) => {
          proxyReq.setHeader("origin", "http://127.0.0.1:5000");
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


