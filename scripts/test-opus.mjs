import opus from "@discordjs/opus";

try {
  // Try to instantiate to ensure the native bin works properly
  const _encoder = new opus.OpusEncoder(48000, 2);
  console.log("✅ @discordjs/opus native bindings loaded properly! Initialization successful.");
  process.exit(0);
} catch (e) {
  console.error("❌ Failed to initialized @discordjs/opus native bindings:");
  console.error(e);
  process.exit(1);
}
