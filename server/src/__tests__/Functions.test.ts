import Functions from "../functions/Functions";

const functions = new Functions();

describe("Functions.getIdByURL", () => {
  it("extracts ID from standard youtube.com URL", () => {
    expect(functions.getIdByURL("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("extracts ID from music.youtube.com URL", () => {
    expect(functions.getIdByURL("https://music.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("extracts ID from youtu.be short URL", () => {
    expect(functions.getIdByURL("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("extracts ID from URL with extra parameters", () => {
    expect(functions.getIdByURL("https://music.youtube.com/watch?v=dQw4w9WgXcQ&list=PLtest&si=abc")).toBe("dQw4w9WgXcQ");
  });

  it("returns null for invalid URL", () => {
    expect(functions.getIdByURL("https://example.com/video")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(functions.getIdByURL("")).toBeNull();
  });
});
