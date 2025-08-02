import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  console.log('setupVite: Starting Vite server setup...');
  
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  try {
    console.log('setupVite: Creating Vite server...');
    const vite = await createViteServer({
      ...viteConfig,
      configFile: false,
      customLogger: {
        ...viteLogger,
        error: (msg, options) => {
          console.error('Vite logger error:', msg);
          viteLogger.error(msg, options);
          // Don't exit on error - let it continue
        },
      },
      server: serverOptions,
      appType: "custom",
    });

    console.log('setupVite: Vite server created successfully');
    app.use(vite.middlewares);
    console.log('setupVite: Vite middlewares added');
    
    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;
      console.log('setupVite: Handling request for:', url);

      try {
        const clientTemplate = path.resolve(
          __dirname,
          "..",
          "client",
          "index.html",
        );

        console.log('setupVite: Reading template from:', clientTemplate);
        // always reload the index.html file from disk incase it changes
        let template = await fs.promises.readFile(clientTemplate, "utf-8");
        template = template.replace(
          `src="/src/main.tsx"`,
          `src="/src/main.tsx?v=${nanoid()}"`,
        );
        const page = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(page);
      } catch (e) {
        console.error('setupVite: Error handling request:', e);
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
    
    console.log('setupVite: Vite setup completed successfully');
  } catch (error) {
    console.error('setupVite: Failed to setup Vite:', error);
    throw error;
  }
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "../client/dist");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
