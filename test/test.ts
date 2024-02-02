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

  await inflateResponse(response, inflateDestination, {
    compressionFormat: "gzip",
  });

  const inflatedContents = Deno.readTextFileSync(
    resolvePath(inflateDestination),
  );
  assertEquals(inflatedContents, correctContents);
  Deno.removeSync(resolvePath(inflateDestination));
});

// contents are "hello world a" and "hello world b"
// in "./hello-worlds/hello-world-a.txt" and "./hello-worlds/hello-world-b.txt"
Deno.test(async function inflateTarGZipTest() {
  const filesToCheck = [
    {
      name: "hello-world-a.txt",
      contents: "hello world a",
    },
    {
      name: "hello-world-b.txt",
      contents: "hello world b",
    },
  ];

  const pathToInput = resolvePath("./test/input/hello-worlds.tar.gz");
  const response = await fetch(`file://${pathToInput}`);
  const inflateDestination = "./test/output/hello-worlds";
  await inflateResponse(response, inflateDestination, {
    compressionFormat: "gzip",
    doUntar: true,
  });
  for (const dirEntry of Deno.readDirSync(inflateDestination)) {
    const fileIdx = filesToCheck.findIndex((fileToCheck) => {
      return fileToCheck.name === dirEntry.name;
    });
    assertEquals(
      filesToCheck[fileIdx].contents,
      Deno.readTextFileSync(
        resolvePath(`${inflateDestination}/${dirEntry.name}`),
      ),
    );
  }
  Deno.removeSync(resolvePath(inflateDestination), { recursive: true });
  Deno.removeSync(resolvePath(inflateDestination + ".tar"));
});
