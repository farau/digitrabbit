// app/api/memes/route.js
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const assetsDir = path.join(process.cwd(), "public", "img", "assets");
    const files = fs.readdirSync(assetsDir).filter((file) => file.endsWith(".webp"));

    return new Response(JSON.stringify(files), { status: 200 });
  } catch (error) {
    console.error("Error during reading of assets files :", error);
    return new Response(JSON.stringify({ error: "Unable to read assets files." }), { status: 500 });
  }
}
