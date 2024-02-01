# inflate-response

This module leverages the
[Compression Streams API](https://deno.land/api?s=DecompressionStream) to
process an HTTP response which has been compressed with gzip or deflate, then
save it to disk.

## usage

```typescript
import { inflateResponse } from "https://deno.land/x/inflate_response/mod.ts";

const myGzippedContent = await fetch(
  "https://example.com/some-gzipped-content.txt.gz",
);

// this will save the uncompressed or "inflated" content to a file named `some-gzipped-content.txt`
await inflateResponse(myGzippedContent, "./some-gzipped-content.txt");
```
