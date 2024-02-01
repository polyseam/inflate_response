import { resolve as resolvePath } from "https://deno.land/std@0.214.0/path/mod.ts";
const supportedCompressionFormats = ["deflate", "gzip", "deflate-raw"] as const;

type CompressionFormat = (typeof supportedCompressionFormats)[number];

export async function inflateResponse(
  response: Response,
  inflateDestination: string,
  compressionFormat: CompressionFormat = "gzip",
) {
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

  const inflatedFile = await Deno.open(resolvePath(inflateDestination), {
    create: true,
    write: true,
  });

  const decompressedStream = response.body.pipeThrough(decompressionStream);
  await decompressedStream.pipeTo(inflatedFile.writable);
}
