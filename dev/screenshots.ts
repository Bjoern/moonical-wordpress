// The screenshots for the WordPress directory (assets/screenshot-1.png to -4.png), from the local Docker
// test site with the pages in this folder (see README.md, "Screenshots"). Needs Chrome where it is on
// Windows; puppeteer-core comes from npm.
// deno run -A dev/screenshots.ts assets <id of the post "Sowing by the moon">
import puppeteer from "npm:puppeteer-core@23";

const [out, editorPost] = Deno.args;
const site = "http://localhost:8090";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  // the widget frames come from another site: in their own process the time zone below would not reach them
  args: ["--lang=en-GB", "--hide-scrollbars", "--disable-site-isolation-trials", "--disable-features=IsolateOrigins,site-per-process"],
});
const page = await browser.newPage();
await page.emulateTimezone("Europe/London");

/** Waits until every widget frame has drawn its widget. */
async function widgetsLoaded() {
  for (let i = 0; i < 40; i++) {
    const frames = page.frames().filter((f) => f.url().includes("/widget/"));
    const ready = await Promise.all(frames.map((f) => f.$(".mw").then((e) => !!e).catch(() => false)));
    if (frames.length && ready.every(Boolean)) break;
    await sleep(250);
  }
  await sleep(1200); // icons and fonts
}

// --- the widgets on the site: a crop around them on a soft background ---
await page.setViewport({ width: 1400, height: 1100, deviceScaleFactor: 1.5 });
for (const [n, name] of [[2, "shot-today"], [3, "shot-activity"], [4, "shot-phases"]]) {
  await page.goto(`${site}/?pagename=${name}`, { waitUntil: "networkidle0" });
  await page.addStyleTag({
    content: "body { background: #f4f2ec !important; } #wpadminbar, .wp-block-post-title { visibility: hidden; }" +
      " .shot { max-width: 1076px !important; margin-left: auto !important; margin-right: auto !important; }",
  });
  await widgetsLoaded();
  const r = await page.evaluate(() => {
    let l = Infinity, t = Infinity, ri = -Infinity, b = -Infinity;
    for (const f of document.querySelectorAll(".shot iframe")) {
      const x = f.getBoundingClientRect();
      l = Math.min(l, x.left); t = Math.min(t, x.top); ri = Math.max(ri, x.right); b = Math.max(b, x.bottom);
    }
    return { x: l + scrollX, y: t + scrollY, w: ri - l, h: b - t };
  });
  const pad = 36;
  await page.screenshot({ path: `${out}/screenshot-${n}.png`, clip: { x: r.x - pad, y: r.y - pad, width: r.w + 2 * pad, height: r.h + 2 * pad } });
  console.log(`screenshot-${n}.png`, Math.round(r.w + 2 * pad), "x", Math.round(r.h + 2 * pad));
}

// --- the block editor with the widget selected and its settings open ---
await page.setViewport({ width: 1280, height: 960, deviceScaleFactor: 1.5 });
await page.goto(`${site}/wp-login.php`, { waitUntil: "networkidle0" });
await page.type("#user_login", "admin");
await page.type("#user_pass", "moon-test-admin");
await Promise.all([page.waitForNavigation({ waitUntil: "networkidle0" }), page.click("#wp-submit")]);
await page.goto(`${site}/wp-admin/post.php?post=${editorPost}&action=edit`, { waitUntil: "networkidle0" });
await sleep(1500);
await page.keyboard.press("Escape"); // the welcome guide
await page.evaluate(() => {
  // deno-lint-ignore no-explicit-any
  const wp = (window as any).wp;
  const block = wp.data.select("core/block-editor").getBlocks().find((b: { name: string }) => b.name === "moonical/widget");
  wp.data.dispatch("core/preferences").set("core", "fixedToolbar", true); // the block toolbar in the top bar
  wp.data.dispatch("core/block-editor").selectBlock(block.clientId);
  wp.data.dispatch("core/interface").enableComplementaryArea("core", "edit-post/block");
});
await sleep(800);
await page.mouse.move(5, 950); // no hover outline
await widgetsLoaded();
await page.screenshot({ path: `${out}/screenshot-1.png` });
console.log("screenshot-1.png 1280 x 960");

await browser.close();
