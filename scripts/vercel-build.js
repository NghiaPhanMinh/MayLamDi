import { spawnSync } from "node:child_process";

const hasProductionDeployKey = Boolean(process.env.CONVEX_DEPLOY_KEY?.trim());

const env = {
  ...process.env,
  VITE_CONVEX_URL:
    process.env.VITE_CONVEX_URL || "https://reminiscent-narwhal-80.convex.cloud",
};

if (hasProductionDeployKey) {
  console.log("Deploying Convex backend schema and building frontend bundle…");
} else {
  console.log(
    "CONVEX_DEPLOY_KEY is unavailable; building frontend bundle with fallback VITE_CONVEX_URL.",
  );
}

const isWindows = process.platform === "win32";

const result = hasProductionDeployKey
  ? spawnSync(
      isWindows ? "npx.cmd" : "npx",
      [
        "convex",
        "deploy",
        "--cmd",
        "npm run build",
        "--cmd-url-env-var-name",
        "VITE_CONVEX_URL",
      ],
      { env, stdio: "inherit", shell: isWindows },
    )
  : spawnSync(isWindows ? "npm.cmd" : "npm", ["run", "build"], {
      env,
      stdio: "inherit",
      shell: isWindows,
    });

if (result.error) {
  console.error("Vercel build failed:", result.error);
  process.exit(1);
}

process.exit(result.status ?? 0);
