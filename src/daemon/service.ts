import { isInsideContainer } from "./container.js";
import {
  installLaunchAgent,
  isLaunchAgentLoaded,
  readLaunchAgentProgramArguments,
  readLaunchAgentRuntime,
  restartLaunchAgent,
  stopLaunchAgent,
  uninstallLaunchAgent,
} from "./launchd.js";
import {
  installScheduledTask,
  isScheduledTaskInstalled,
  readScheduledTaskCommand,
  readScheduledTaskRuntime,
  restartScheduledTask,
  stopScheduledTask,
  uninstallScheduledTask,
} from "./schtasks.js";
import type { GatewayServiceRuntime } from "./service-runtime.js";
import type {
  GatewayServiceCommandConfig,
  GatewayServiceControlArgs,
  GatewayServiceEnv,
  GatewayServiceEnvArgs,
  GatewayServiceInstallArgs,
  GatewayServiceManageArgs,
} from "./service-types.js";
import {
  installSystemdService,
  isSystemdServiceEnabled,
  readSystemdServiceExecStart,
  readSystemdServiceRuntime,
  restartSystemdService,
  stopSystemdService,
  uninstallSystemdService,
} from "./systemd.js";
import { emitGatewayRestart } from "../infra/restart.js";

export type {
  GatewayServiceCommandConfig,
  GatewayServiceControlArgs,
  GatewayServiceEnv,
  GatewayServiceEnvArgs,
  GatewayServiceInstallArgs,
  GatewayServiceManageArgs,
} from "./service-types.js";

function ignoreInstallResult(
  install: (args: GatewayServiceInstallArgs) => Promise<unknown>,
): (args: GatewayServiceInstallArgs) => Promise<void> {
  return async (args) => {
    await install(args);
  };
}

export type GatewayService = {
  label: string;
  loadedText: string;
  notLoadedText: string;
  install: (args: GatewayServiceInstallArgs) => Promise<void>;
  uninstall: (args: GatewayServiceManageArgs) => Promise<void>;
  stop: (args: GatewayServiceControlArgs) => Promise<void>;
  restart: (args: GatewayServiceControlArgs) => Promise<void>;
  isLoaded: (args: GatewayServiceEnvArgs) => Promise<boolean>;
  readCommand: (env: GatewayServiceEnv) => Promise<GatewayServiceCommandConfig | null>;
  readRuntime: (env: GatewayServiceEnv) => Promise<GatewayServiceRuntime>;
};

const DockerGatewayService: GatewayService = {
  label: "Docker",
  loadedText: "running",
  notLoadedText: "not running",
  install: async () => {
    throw new Error("Install not supported inside container: use docker-compose instead.");
  },
  uninstall: async () => {
    throw new Error("Uninstall not supported inside container.");
  },
  stop: async (args) => {
    args.stdout.write("Stop not supported inside container: use 'docker stop' from host.\n");
  },
  restart: async (args) => {
    try {
      const { execSync } = await import("node:child_process");
      // Use -o (oldest) and -f (full command name) to target the daemon's title precisely.
      execSync("pkill -USR1 -o -f '^openclaw-gateway$'", { stdio: "ignore" });
      args.stdout.write("Sent SIGUSR1 to 'openclaw-gateway' for restart.\n");
    } catch (err) {
      // pkill returns non-zero if no process matches, which is fine if we're also the daemon.
      const emitted = emitGatewayRestart();
      if (emitted) {
        args.stdout.write("Signaled local process for restart.\n");
      } else {
        args.stdout.write("Gateway restart already in progress (or pkill failed).\n");
      }
    }
  },
  isLoaded: async () => true,
  readCommand: async () => ({
    programArguments: [process.execPath, ...process.execArgv, ...process.argv.slice(1)],
    environment: process.env as Record<string, string>,
  }),
  readRuntime: async () => ({ status: "running" }),
};

export function resolveGatewayService(): GatewayService {
  if (process.platform === "darwin") {
    return {
      label: "LaunchAgent",
      loadedText: "loaded",
      notLoadedText: "not loaded",
      install: ignoreInstallResult(installLaunchAgent),
      uninstall: uninstallLaunchAgent,
      stop: stopLaunchAgent,
      restart: restartLaunchAgent,
      isLoaded: isLaunchAgentLoaded,
      readCommand: readLaunchAgentProgramArguments,
      readRuntime: readLaunchAgentRuntime,
    };
  }

  if (process.platform === "linux") {
    if (isInsideContainer()) {
      return DockerGatewayService;
    }
    return {
      label: "systemd",
      loadedText: "enabled",
      notLoadedText: "disabled",
      install: ignoreInstallResult(installSystemdService),
      uninstall: uninstallSystemdService,
      stop: stopSystemdService,
      restart: restartSystemdService,
      isLoaded: isSystemdServiceEnabled,
      readCommand: readSystemdServiceExecStart,
      readRuntime: readSystemdServiceRuntime,
    };
  }

  if (process.platform === "win32") {
    return {
      label: "Scheduled Task",
      loadedText: "registered",
      notLoadedText: "missing",
      install: ignoreInstallResult(installScheduledTask),
      uninstall: uninstallScheduledTask,
      stop: stopScheduledTask,
      restart: restartScheduledTask,
      isLoaded: isScheduledTaskInstalled,
      readCommand: readScheduledTaskCommand,
      readRuntime: readScheduledTaskRuntime,
    };
  }

  throw new Error(`Gateway service install not supported on ${process.platform}`);
}
