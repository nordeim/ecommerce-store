import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";
const zai = await ZAI.create();
const OUT = "/home/z/my-project/ecommerce-store/docs/screenshots";
const expect = `A website HERO CAROUSEL banner at rest (desktop, full-width rounded photo — the photo's exact subject is NOT part of this check). The DOM-verified content: on the left, overlaid text — a small translucent white badge reading "Up to 40% Off", a large white headline "Spring Collection 2026", and an orange pill button. At the MID-LEFT and MID-RIGHT edges of the photo: two ROUND frosted-glass control buttons (full circles, semi-transparent whitish fill, white chevron arrows pointing left and right). Near the BOTTOM CENTER: THREE white dot indicators in a row — the FIRST is a wide elongated solid-white pill (~32px), the other two are small dimmer 8px dots. Check ONLY these controls and text; ignore the photo subject.`;
const b64 = readFileSync(`${OUT}/276-heronav-controls-resting.png`).toString("base64");
const res = await zai.chat.completions.createVision({
  messages: [{ role: "user", content: [
    { type: "text", text: `Does this screenshot match the following description? Answer with exactly PASS or FAIL, then one short sentence of justification.\n\nDESCRIPTION: ${expect}` },
    { type: "image_url", image_url: { url: `data:image/png;base64,${b64}` } },
  ]}],
});
console.log((res.choices[0]?.message?.content ?? "").trim().slice(0, 200));
