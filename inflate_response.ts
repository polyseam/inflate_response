import { resolve as resolvePath } from "@std/path";
import { UntarStream } from "@std/tar/untar-stream";
import { ensureFile } from "@std/fs/ensure_file";
import { ensureDir } from "@std/fs/ensure_dir";
import * as path from "@std/path";

const supportedCompressionFormats = ["deflate", "gzip", "deflate-raw"] as const;

type CompressionFormat = (typeof supportedCompressionFormats)[number];

type InflateResponseOptions = {
  compressionFormat?: CompressionFormat;
  doUntar?: boolean;
};

export async function inflateResponse(
  response: Response,
  inflateDestination: string,
  options?: InflateResponseOptions,
) {
  const { compressionFormat = "gzip", doUntar = false } = options || {};

  if (!supportedCompressionFormats.includes(compressionFormat)) {
    throw new Error(`Unsupported compression format: "${compressionFormat}"`);
  }

  const decompressionStream = new DecompressionStream(compressionFormat);

  if (!response.body) {
    throw new Error("Response is not readable");
  }

  if (!response.ok) {
    throw new Error(
      `Response ${response.status} not ok: ${response.statusText}`,
    );
  }

  if (doUntar) { // multiple files in tarball
    const tarballPath = resolvePath(inflateDestination + ".tar");
    using inflatedTarball = await Deno.open(resolvePath(tarballPath), {
      create: true,
      write: true,
    });

    const decompressedStream = response.body.pipeThrough(decompressionStream);
    await decompressedStream.pipeTo(inflatedTarball.writable);

    using inflatedTarFile = await Deno.open(tarballPath, { read: true });
    const entries = inflatedTarFile.readable.pipeThrough(new UntarStream());

    for await (const entry of entries) {
      if (entry.readable === undefined) {
        await ensureDir(entry.path);
        continue;
      }
      await ensureDir(inflateDestination);
      await ensureFile(path.join(inflateDestination, entry.path));
      using file = await Deno.open(
        path.join(inflateDestination, entry.path),
        { write: true },
      );
      // <entry> is a reader.
      await entry.readable.pipeTo(file.writable);
    }
  } else { // single file
    using inflatedFile = await Deno.open(resolvePath(inflateDestination), {
      create: true,
      write: true,
    });

    const decompressedStream = response.body.pipeThrough(decompressionStream);
    await decompressedStream.pipeTo(inflatedFile.writable);
  }
}
