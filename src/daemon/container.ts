import fs from "node:fs";

let isContainerCache: boolean | null = null;

export function isInsideContainer(): boolean {
  if (isContainerCache !== null) {
    return isContainerCache;
  }

  try {
    // Standard Docker check
    if (fs.existsSync("/.dockerenv")) {
      isContainerCache = true;
      return true;
    }

    // Check cgroups for common container patterns
    const cgroup = fs.readFileSync("/proc/1/cgroup", "utf8");
    if (cgroup.includes("docker") || cgroup.includes("kubepods") || cgroup.includes("containerd")) {
      isContainerCache = true;
      return true;
    }
  } catch {
    // ignore
  }

  isContainerCache = false;
  return false;
}
