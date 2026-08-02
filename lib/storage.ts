import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

export interface FileStorage {
  save(input: { data: Buffer; extension: string }): Promise<string>;
  remove(url: string): Promise<void>;
}

const ALLOWED_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp", "svg", "gif", "avif"]);

class LocalDiskStorage implements FileStorage {
  private dir = path.join(process.cwd(), "public", "uploads");

  async save({ data, extension }: { data: Buffer; extension: string }): Promise<string> {
    const ext = extension.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      throw new Error(`Unsupported file type: .${ext}`);
    }
    await mkdir(this.dir, { recursive: true });
    const name = `${crypto.randomBytes(10).toString("hex")}.${ext}`;
    await writeFile(path.join(this.dir, name), data);
    return `/uploads/${name}`;
  }

  async remove(url: string): Promise<void> {
    if (!url.startsWith("/uploads/")) return;
    const name = path.basename(url);
    await unlink(path.join(this.dir, name)).catch(() => {});
  }
}

export const storage: FileStorage = new LocalDiskStorage();
