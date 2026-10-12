import { expect, test, type Page } from "@playwright/test";

/** Opens the public storefront and waits until the primary store's real products render. */
async function primeiroCard(page: Page) {
  const erros: string[] = [];
  const falhasRede: string[] = [];
  page.on("pageerror", (error) => erros.push(String(error)));
  page.on("requestfailed", (request) => {
    falhasRede.push(
      `${request.method()} ${request.url()} -> ${request.failure()?.errorText ?? "falha desconhecida"}`,
    );
  });

  await page.goto("/", { waitUntil: "domcontentloaded" });
  const card = page.getByTestId("product-card").first();

  try {
    await expect(card).toBeVisible({ timeout: 25_000 });
  } catch (error) {
    const texto = await page.locator("body").innerText().catch(() => "");
    throw new Error(
      [
        error instanceof Error ? error.message : String(error),
        `URL: ${page.url()}`,
        `PAGEERRORS: ${erros.join(" | ") || "nenhum"}`,
        `REQUESTFAILED: ${falhasRede.join(" | ") || "nenhuma"}`,
        `BODY: ${texto.slice(0, 2000)}`,
      ].join("\n"),
    );
  }

  return card;
}

test.describe("Vitrine pública", () => {
  test("carrega produtos da organização principal no endereço raiz", async ({ page }) => {
    await primeiroCard(page);
    expect(await page.getByTestId("product-card").count()).toBeGreaterThan(0);
  });

  test("produto de loja administrada abre pelo slug da organização e do produto", async ({ page }) => {
    await page.goto("/loja/ki-vitrine/produto/agenda-pro", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1, name: "Agenda PRO" })).toBeVisible({ timeout: 25_000 });
    await expect(page).toHaveURL(/\/loja\/ki-vitrine\/produto\/agenda-pro$/);
    await expect(page.getByText(/Sistema de Agendamento inteligente/i)).toBeVisible();
  });

  test("página administrativa redireciona visitantes sem sessão para o login", async ({ page }) => {
    await page.goto("/admin", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/auth(?:\?.*)?$/);
    await expect(page.getByRole("heading", { name: "Painel Administrativo" })).toBeVisible();
  });
});

test.describe("Card da vitrine", () => {
  test("botão Detalhes abre o modal do produto (e nada mais)", async ({ page }) => {
    const card = await primeiroCard(page);
    const erros: string[] = [];
    page.on("pageerror", (error) => erros.push(String(error)));

    await card.getByTestId("card-detalhes").click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.locator("video, iframe")).toHaveCount(0);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    expect(erros).toEqual([]);
  });

  test("clique na imagem abre o modal de vídeo quando houver vídeo", async ({ page }) => {
    const card = await primeiroCard(page);
    const badge = card.getByTestId("card-video-badge");
    const temVideo = (await badge.count()) > 0;
    test.skip(!temVideo, "Produto sem vídeo configurado");

    await card.getByTestId("card-image").click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.locator("video, iframe")).toHaveCount(1);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("botão Comprar abre checkout externo em nova aba, sem abrir modal", async ({ page, context }) => {
    const card = await primeiroCard(page);
    const comprar = card.getByTestId("card-comprar");
    test.skip((await comprar.count()) === 0, "Produto sem botão comprar");

    const href = await comprar.getAttribute("href");
    expect(href).toMatch(/^https?:\/\//);
    await expect(comprar).toHaveAttribute("target", "_blank");

    const popupPromise = context.waitForEvent("page").catch(() => null);
    await comprar.click({ modifiers: ["Control"] });
    await popupPromise;
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("clique no título navega para a página do produto da própria loja", async ({ page }) => {
    const card = await primeiroCard(page);
    const titulo = card.getByRole("link", { name: /Abrir página de / }).first();
    const href = await titulo.getAttribute("href");
    expect(href).toMatch(/^\/loja\/ki-vitrine\/produto\//);
    await titulo.click();
    await expect(page).toHaveURL(/\/loja\/ki-vitrine\/produto\//);
  });

  test("abrir detalhes depois do vídeo não mantém o vídeo ativo", async ({ page }) => {
    const card = await primeiroCard(page);
    const badge = card.getByTestId("card-video-badge");
    if (await badge.count()) {
      await badge.evaluate((element) => (element as HTMLButtonElement).click());
      await expect(page.getByRole("dialog").locator("video, iframe")).toHaveCount(1);
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toHaveCount(0);
    }

    await card.getByTestId("card-detalhes").click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("dialog").locator("video, iframe")).toHaveCount(0);
  });
});
