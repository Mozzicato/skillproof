export const MAX_CV_BYTES = 5 * 1024 * 1024;
export const MAX_CV_CHARS = 30000;

export class CvFileError extends Error {}

type Kind = "pdf" | "docx" | "text";

/** Decides the file type from its first bytes, not its name, so a renamed file cannot pick the parser. */
export function sniff(bytes: Uint8Array, name: string): Kind | null {
  const head = String.fromCharCode(...bytes.slice(0, 5));
  if (head === "%PDF-") return "pdf";
  // DOCX is a zip archive; the old binary .doc format is not supported.
  if (bytes[0] === 0x50 && bytes[1] === 0x4b && /\.docx$/i.test(name)) return "docx";
  if (/\.(txt|md|text)$/i.test(name) && !bytes.slice(0, 2048).includes(0)) return "text";
  return null;
}

/** Collapses the layout whitespace extractors leave behind. */
export function tidy(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t ]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, MAX_CV_CHARS);
}

export async function extractCvText(bytes: Uint8Array, name: string): Promise<string> {
  if (bytes.byteLength > MAX_CV_BYTES) throw new CvFileError("That file is larger than 5 MB. Upload a smaller copy.");
  const kind = sniff(bytes, name);
  if (!kind) throw new CvFileError("Upload a PDF, a Word document (.docx) or a text file.");
  let text = "";
  try {
    if (kind === "pdf") {
      const { extractText, getDocumentProxy } = await import("unpdf");
      const pdf = await getDocumentProxy(bytes);
      text = (await extractText(pdf, { mergePages: true })).text;
    } else if (kind === "docx") {
      const mammoth = await import("mammoth");
      text = (await mammoth.extractRawText({ buffer: Buffer.from(bytes) })).value;
    } else {
      text = new TextDecoder("utf-8").decode(bytes);
    }
  } catch {
    throw new CvFileError("We could not read that file. If it is password protected, remove the password and try again.");
  }
  const clean = tidy(text);
  if (clean.length < 40) throw new CvFileError("We found almost no text in that file. If it is a scanned image, paste the text instead.");
  return clean;
}
