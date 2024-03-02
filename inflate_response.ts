import { resolve as resolvePath } from "@std/path";
import { Untar } from "@std/archive/untar";
import { ensureFile } from "@std/fs/ensure_file";
import { ensureDir } from "@std/fs/ensure_dir";
import { copy } from "@std/io/copy";
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
    const untar = new Untar(inflatedTarFile);

    for await (const entry of untar) {
      if (entry.type === "directory") {
        await ensureDir(entry.fileName);
        continue;
      }
      await ensureDir(inflateDestination);
      await ensureFile(path.join(inflateDestination, entry.fileName));
      using file = await Deno.open(
        path.join(inflateDestination, entry.fileName),
        { write: true },
      );
      // <entry> is a reader.
      await copy(entry, file);
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
