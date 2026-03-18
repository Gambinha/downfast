import { describe, it, expect } from "vitest";
import Functions from "../functions/Functions";

const functions = new Functions();

describe("Functions.getEmbedLink", () => {
  it("converts standard youtube.com URL to embed", () => {
    expect(functions.getEmbedLink("https://www.youtube.com/watch?v=dQw4w9WgXcQ"))
      .toBe("https://www.youtube.com/embed/dQw4w9WgXcQ");
  });

  it("converts music.youtube.com URL to standard embed", () => {
    expect(functions.getEmbedLink("https://music.youtube.com/watch?v=dQw4w9WgXcQ"))
      .toBe("https://www.youtube.com/embed/dQw4w9WgXcQ");
  });
});
