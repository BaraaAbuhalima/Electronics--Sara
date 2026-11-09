import fs from "node:fs";
import path from "node:path";
import { validateData } from "../src/services/validation";
try {
  const read = (name: string) =>
    JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", name), "utf8"));
  const products = read("products.json"),
    categories = read("categories.json"),
    store = read("store.json");
  const errors = validateData(products, categories, store);
  const images = [
    ...products.flatMap((p: { images?: string[] }) => p.images ?? []),
    ...categories.map((c: { image: string }) => c.image),
    store.logo,
  ];
  for (const image of images)
    if (
      typeof image === "string" &&
      !fs.existsSync(path.join(process.cwd(), "public", image))
    )
      errors.push(`Image file not found: ${image}`);
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exit(1);
  }
  console.log(
    `Validated ${products.length} products, ${categories.length} categories, store details, component references, and ${images.length} image paths.`,
  );
} catch (error) {
  console.error(
    "Data validation failed:",
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
}
