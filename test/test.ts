import { inflateResponse } from "../mod.ts";
import { assertEquals } from "https://deno.land/std@0.214.0/assert/assert_equals.ts";
import { resolve as resolvePath } from "https://deno.land/std@0.214.0/path/mod.ts";

// correct content is "hello world"
const pathToCorrect = resolvePath("./test/output/correct.txt");
console.log("pathToCorrect", pathToCorrect);
const correctContents = Deno.readTextFileSync(pathToCorrect);

Deno.test(async function inflateGZipTest() {
  const pathToInput = resolvePath("./test/input/hello-world.gz");
  const response = await fetch(`file://${pathToInput}`);
  const inflateDestination = "./test/output/hello-world-gzip.txt";
  await inflateResponse(response, inflateDestination, "gzip");
  const inflatedContents = Deno.readTextFileSync(
    resolvePath(inflateDestination),
  );
  assertEquals(inflatedContents, correctContents);
  Deno.removeSync(resolvePath(inflateDestination));
});
