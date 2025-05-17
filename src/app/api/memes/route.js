// app/api/memes/route.js
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const memesDir = path.join(process.cwd(), "public", "img", "memes");
    const files = fs.readdirSync(memesDir).filter((file) => file.endsWith(".png"));

    return new Response(JSON.stringify(files), { status: 200 });
  } catch (error) {
    console.error("Error during reading of meme files :", error);
    return new Response(JSON.stringify({ error: "Unable to read meme files." }), { status: 500 });
  }
}
