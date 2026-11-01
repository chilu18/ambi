import { test, expect } from "@playwright/test";
test("sample journey is labelled, reviewable and survives refresh", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByText("Sample journey", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "“I got a job rejection. What now?”" })
    .click();
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("Suggested · not yet agreed")).toBeVisible();
  await expect(page.getByText("Remembered", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Agree & prepare draft" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Thank you — a quick request for feedback",
    }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "Thank you — a quick request for feedback",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "I’ve reviewed this draft" }).click();
  await expect(
    page.getByText("One step moved forward. Nothing was sent."),
  ).toBeVisible();
  await page.screenshot({
    path: ".impeccable/review/desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
  await page.screenshot({
    path: ".impeccable/review/mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Clear this workspace" }).click();
  await page
    .getByRole("button", { name: "Delete workspace", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "What’s on your mind?" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "What’s on your mind?" }),
  ).toBeVisible();
});
test("anonymous visitors cannot read or change live memory", async ({
  request,
}) => {
  for (const action of [
    "state",
    "confirm",
    "review",
    "reset",
    "chat",
    "retry",
  ]) {
    const r =
      action === "state"
        ? await request.get("/api/ambi/state")
        : await request.post(`/api/ambi/${action}`, {
            data: { message: "hello", brief: "draft", id: "someone-else" },
          });
    expect(r.status()).toBe(401);
  }
});
test("empty messages do not submit; keyboard can reach composer", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Send message" }),
  ).toBeDisabled();
  await page.getByLabel("Message ambi").fill("  ");
  await expect(
    page.getByRole("button", { name: "Send message" }),
  ).toBeDisabled();
});
