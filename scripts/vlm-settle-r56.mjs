// Round-56 VLM settlement instrument for 292/294 (the r54/r55 discipline:
// when the VLM's ABSOLUTE judgment fails at a perceptual boundary, build
// the RELATIVE instrument). Two composites: (a) 293's opaque toast beside
// 292's mid-enter toast — the right box must read LIGHTER; (b) 293's
// opaque toast beside 294's mid-exit toast — the right box must read MUCH
// fainter. Built from the EXISTING captures (no re-run).
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync, writeFileSync } from "node:fs";
import { PNG } from "../node_modules/playwright-core/lib/utilsBundle.js";

const stitch = (aFile, bFile, outFile) => {
  const A = PNG.sync.read(readFileSync(aFile));
  const B = PNG.sync.read(readFileSync(bFile));
  const GAP = 24;
  const W = A.width + GAP + B.width;
  const H = Math.max(A.height, B.height);
  const out = new PNG({ width: W, height: H });
  // fill with the page background (251,250,249)
  for (let i = 0; i < out.data.length; i += 4) {
    out.data[i] = 251; out.data[i + 1] = 250; out.data[i + 2] = 249; out.data[i + 3] = 255;
  }
  PNG.bitblt(A, out, 0, 0, A.width, A.height, 0, 0);
  PNG.bitblt(B, out, 0, 0, B.width, B.height, A.width + GAP, 0);
  writeFileSync(outFile, PNG.sync.write(out));
  return { W, H };
};

const zai = await ZAI.create();

const ask = async (file, text) => {
  const b64 = readFileSync(file).toString("base64");
  const res = await zai.chat.completions.createVision({
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text },
          { type: "image_url", image_url: { url: `data:image/png;base64,${b64}` } },
        ],
      },
    ],
  });
  return (res.choices[0]?.message?.content ?? "").trim();
};

// composite A: opaque (293, LEFT) vs mid-enter (292, RIGHT)
const a = stitch(
  "docs/screenshots/293-toast-rest-corner-geometry.png",
  "docs/screenshots/292-toast-mid-enter-from-pose.png",
  "docs/screenshots/292b-toast-sidebyside-opaque-vs-midenter.png",
);
console.log(`composite A: ${a.W}x${a.H}`);
const ansA = await ask(
  "docs/screenshots/292b-toast-sidebyside-opaque-vs-midenter.png",
  `This image shows two close-ups of toast notifications side by side, separated by a small gap. Compare the DARKNESS of the two boxes. The LEFT box is a fully-appeared toast (near-black). The RIGHT box is the same toast caught mid-entrance. Answer with exactly PASS or FAIL, then one short sentence: PASS if the RIGHT box is clearly LIGHTER / grayer / dimmer than the LEFT box (a partway-appeared state), FAIL if the two boxes are the same darkness.`,
);
console.log(`${/^PASS/i.test(ansA) ? "PASS" : "FAIL"}  292b (side-by-side: opaque vs mid-enter)  —  ${ansA.slice(0, 170).replace(/\n/g, " ")}`);

// composite B: opaque (293, LEFT) vs mid-exit (294, RIGHT)
const b = stitch(
  "docs/screenshots/293-toast-rest-corner-geometry.png",
  "docs/screenshots/294-toast-mid-exit-fade.png",
  "docs/screenshots/294b-toast-sidebyside-opaque-vs-midexit.png",
);
console.log(`composite B: ${b.W}x${b.H}`);
const ansB = await ask(
  "docs/screenshots/294b-toast-sidebyside-opaque-vs-midexit.png",
  `This image shows two close-ups of toast notifications side by side, separated by a small gap. Compare the two boxes. The LEFT box is a fully-appeared toast (near-black). The RIGHT box is the same toast caught mid-exit (disappearing). Answer with exactly PASS or FAIL, then one short sentence: PASS if the RIGHT box is MUCH FAINTER than the LEFT box (a barely-visible ghost of a toast), FAIL if the two boxes are similarly dark and solid.`,
);
console.log(`${/^PASS/i.test(ansB) ? "PASS" : "FAIL"}  294b (side-by-side: opaque vs mid-exit)  —  ${ansB.slice(0, 170).replace(/\n/g, " ")}`);
