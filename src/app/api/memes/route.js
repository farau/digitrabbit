// app/api/memes/route.js
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const memesDir = path.join(process.cwd(), "public", "img", "memes");
    const files = fs.readdirSync(memesDir).filter((file) => file.endsWith(".webp"));

    return new Response(JSON.stringify(files), {
      status: 200,
      "Cache-Control": "public, max-age=7200, s-maxage=7200"
      //               ^^^^^^ tout le monde peut cacher
      //                     ^^^^^^^^^^^^ cache 2 heures vue navigateur
      //                                  ^^^^^^^^^^^^ cache 2 heures CDN
    });
  } catch (error) {
    console.error("Error during reading of meme files :", error);
    return new Response(JSON.stringify({ error: "Unable to read meme files." }), { status: 500 });
  }
}
