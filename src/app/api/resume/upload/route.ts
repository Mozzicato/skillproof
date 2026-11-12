import { NextResponse } from "next/server";
import { CvFileError, MAX_CV_BYTES, extractCvText } from "@/lib/cvfile";

export const runtime = "nodejs";

/** Reads the text out of an uploaded CV. The file itself is not stored. */
export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
  if (file.size > MAX_CV_BYTES) return NextResponse.json({ error: "That file is larger than 5 MB. Upload a smaller copy." }, { status: 413 });
  try {
    const text = await extractCvText(new Uint8Array(await file.arrayBuffer()), file.name);
    return NextResponse.json({ text });
  } catch (error) {
    const message = error instanceof CvFileError ? error.message : "We could not read that file. Try another format.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
