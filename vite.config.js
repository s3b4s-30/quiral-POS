import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
    plugins: [react()],
    server: {
        host: true,
        port: 5173,
    },
    preview: {
        host: true,
        port: 4173,
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: function (id) {
                    if (id.includes("node_modules")) {
                        if (id.includes("react") || id.includes("react-dom")) {
                            return "vendor-react";
                        }
                        if (id.includes("@supabase")) {
                            return "vendor-supabase";
                        }
                        if (id.includes("lucide-react")) {
                            return "vendor-icons";
                        }
                        if (id.includes("lottie-web")) {
                            return "vendor-lottie";
                        }
                    }
                    if (id.includes("empty-box.json")) {
                        return "vendor-lottie";
                    }
                },
            },
        },
        chunkSizeWarningLimit: 600,
    },
});
