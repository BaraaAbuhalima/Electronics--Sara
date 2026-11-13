# VOLT — electronics for curious minds

A bilingual English/Arabic electronics storefront built with Next.js 16, React 19, TypeScript, Tailwind CSS 4, and Lucide. English is the default; Arabic switches the whole page to RTL with a locally hosted Tajawal font. Language and cart persist in your browser. Includes a landing page, searchable catalog, product detail dialogs, kits/bundles, stock-aware cart, and WhatsApp order links. No backend, database, accounts, or payment processing.

The catalog includes the CPU Lab Kit plus the stocked components from the September 2026 combined-kit inventory.

## Run the website

Install Node.js 20.9 or newer (Node 24 was used for development). Open a terminal in the `Electronics-Website` project folder:

```bash
npm ci
npm run dev
```

Open `http://localhost:3000` in your browser. Keep the terminal running. Stop with Ctrl+C. If creating a new lockfile intentionally, use `npm install` instead of `npm ci`. For a production build:

```bash
npm run build
npm start
```

Useful checks:

```bash
npm run validate:data
npm run typecheck
npm test
npm run test:e2e
```

The browser suite uses `/usr/bin/chromium` by default. Set `CHROMIUM_PATH` to your Chromium executable if different. For example, install Chromium with your operating system package manager. The suite starts a dev server if none is running. Unit tests need no browser.

## Project structure

```text
data/
  products.json       # Products, kits, bundles / المنتجات والأطقم والحزم
  categories.json     # Categories / الفئات
  store.json          # Store identity and contact / هوية المتجر والتواصل
  translations.json   # Interface translations / ترجمة الواجهة
public/
  images/products/    # Product images / صور المنتجات
  images/categories/  # Category images / صور الفئات
  fonts/              # Locally hosted fonts / الخطوط المحلية
src/
  app/                # Page, layout, responsive styles / الصفحة والتنسيق
  components/         # Storefront, dialog, image fallback / مكونات الواجهة
  services/           # Catalog, validation, cart and order logic / البيانات والسلة والتحقق
  types/              # TypeScript definitions / تعريفات البيانات
scripts/validate-data.ts
tests/                # Automated tests / الاختبارات
README.md
README_AR.md
package.json
package-lock.json
```

## Managing content without coding

JSON files are the single source of truth. Open them in a text editor such as VS Code. Products live in `data/products.json`, categories in `data/categories.json`, and store/contact information in `data/store.json`. Interface labels live in `data/translations.json`.

These files are read-only in the browser: there is no pretend admin editor. Save edits in your project files. During development, refresh after saving; Next.js may refresh automatically. On a production website you must rebuild and redeploy after editing JSON. Keep a backup or Git commit before editing.

### Add a product, step by step

1. Open `data/products.json`. It is one array surrounded by `[` and `]`.
2. Add a comma after the existing last object, then paste a new object before the closing `]`. Do not replace the whole array with a single object.
3. Give `id` a unique, stable value such as `my-motor-002`. Existing IDs must stay stable because kits and saved carts use them.
4. Choose `type`: `component`, `kit`, or `bundle`.
5. Fill `name.en` and `description.en` in English.
6. Fill `name.ar` and `description.ar` in Arabic.
7. Set `price`, optional `discountPrice`, and the same `currency` as `store.json` (initially `NIS`). Prices are numbers, without currency symbols.
8. Set a unique stock code in `sku` and a boolean `inStock`. Use `false` to disable purchase.
9. Choose an existing `categoryId` from `categories.json`.
10. Put images in `public/images/products/` and list their paths in `images`.
11. Add optional translated `specifications` as shown below.
12. Save, run `npm run validate:data`, and refresh the development website. Rebuild/redeploy for production.

The examples below reproduce existing sample products. To ADD rather than edit them, change their IDs and SKUs first. The example image files already exist.

### Example: 12V DC motor

```json
{
  "id": "motor-12v",
  "type": "component",
  "name": {
    "en": "12V DC Gear Motor",
    "ar": "محرك تيار مستمر مسنن 12 فولت"
  },
  "description": {
    "en": "Smooth, dependable motion for robotics and automation.",
    "ar": "حركة سلسة وموثوقة لمشاريع الروبوتات والأتمتة."
  },
  "price": 8.5,
  "currency": "USD",
  "sku": "VLT-MOTOR-12V",
  "categoryId": "motors",
  "images": ["/images/products/motor.svg"],
  "inStock": true,
  "specifications": [
    {
      "label": {
        "en": "Voltage",
        "ar": "الجهد"
      },
      "value": {
        "en": "12V",
        "ar": "12V"
      }
    },
    {
      "label": {
        "en": "Speed",
        "ar": "السرعة"
      },
      "value": {
        "en": "300 RPM",
        "ar": "300 RPM"
      }
    },
    {
      "label": {
        "en": "Torque",
        "ar": "عزم الدوران"
      },
      "value": {
        "en": "1.5 kg·cm",
        "ar": "1.5 kg·cm"
      }
    }
  ]
}
```

### Example: Arduino Uno

```json
{
  "id": "arduino-uno",
  "type": "component",
  "name": {
    "en": "Arduino Uno R3",
    "ar": "أردوينو أونو R3"
  },
  "description": {
    "en": "The classic board for your next great idea.",
    "ar": "اللوحة الكلاسيكية لفكرتك الرائعة القادمة."
  },
  "price": 24.9,
  "currency": "USD",
  "sku": "VLT-ARDUINO-UNO",
  "categoryId": "microcontrollers",
  "images": ["/images/products/uno.jpg", "/images/products/uno.svg"],
  "inStock": true,
  "specifications": [
    {
      "label": {
        "en": "Microcontroller",
        "ar": "المتحكم"
      },
      "value": {
        "en": "ATmega328P",
        "ar": "ATmega328P"
      }
    },
    {
      "label": {
        "en": "Operating voltage",
        "ar": "جهد التشغيل"
      },
      "value": {
        "en": "5V",
        "ar": "5V"
      }
    },
    {
      "label": {
        "en": "Digital I/O pins",
        "ar": "منافذ الإدخال والإخراج الرقمية"
      },
      "value": {
        "en": "14",
        "ar": "14"
      }
    },
    {
      "label": {
        "en": "Analog inputs",
        "ar": "المداخل التناظرية"
      },
      "value": {
        "en": "6",
        "ar": "6"
      }
    },
    {
      "label": {
        "en": "Connectivity",
        "ar": "التوصيل"
      },
      "value": {
        "en": "USB-B",
        "ar": "USB-B"
      }
    }
  ],
  "discountPrice": 21.9
}
```

### Example: electronic sensor

```json
{
  "id": "ultrasonic",
  "type": "component",
  "name": {
    "en": "HC-SR04 Ultrasonic Sensor",
    "ar": "حساس مسافة بالموجات فوق الصوتية HC-SR04"
  },
  "description": {
    "en": "Measure distance with precision, from 2 to 400 cm.",
    "ar": "قياس دقيق للمسافات من 2 إلى 400 سم."
  },
  "price": 3.9,
  "currency": "USD",
  "sku": "VLT-ULTRASONIC",
  "categoryId": "sensors",
  "images": ["/images/products/sensor.svg"],
  "inStock": true,
  "specifications": [
    {
      "label": {
        "en": "Range",
        "ar": "المدى"
      },
      "value": {
        "en": "2–400 cm",
        "ar": "2–400 cm"
      }
    },
    {
      "label": {
        "en": "Voltage",
        "ar": "الجهد"
      },
      "value": {
        "en": "5V",
        "ar": "5V"
      }
    }
  ]
}
```

### Every product property

| Property         | Required?                 | What to enter                                                                                            |
| ---------------- | ------------------------- | -------------------------------------------------------------------------------------------------------- |
| `id`             | Yes                       | Unique, stable text ID.                                                                                  |
| `type`           | Yes                       | `component`, `kit`, or `bundle`.                                                                         |
| `name`           | Yes                       | Object with nonempty `en` and `ar` names.                                                                |
| `description`    | Yes                       | Object with nonempty `en` and `ar` descriptions; also used on the detail view.                           |
| `price`          | Yes                       | Nonnegative number, normally up to 2 decimal places.                                                     |
| `discountPrice`  | No                        | Number from zero to `price`, or `null`/omit for no sale.                                                 |
| `currency`       | Yes                       | Three-letter currency matching the store, such as `USD`. Use a currency supported by Intl.NumberFormat.  |
| `sku`            | Yes                       | Your inventory code.                                                                                     |
| `categoryId`     | Yes                       | An existing category ID.                                                                                 |
| `images`         | Yes                       | Array of one or more local image paths. The first is the main image; all are shown in detail thumbnails. |
| `inStock`        | Yes                       | Boolean availability flag; `false` displays out of stock and disables purchase.                         |
| `specifications` | No                        | Array of `{ "label": {"en":"…","ar":"…"}, "value": {"en":"…","ar":"…"} }` objects.                       |
| `featured`       | No                        | `true` shows in Featured; omit/`false` otherwise. Home shows the first 4 matching products.              |
| `newArrival`     | No                        | `true` shows in New arrivals.                                                                            |
| `bestSeller`     | No                        | `true` shows in Best sellers. The tab only exists if matching data exists.                               |
| `components`     | Required for kits/bundles | Array of existing `productId` references and positive whole-number quantities.                           |

### Edit or remove a product

Find its object by `id`, then edit it in place. To remove it, delete the complete object and the correct surrounding comma. First remove or replace references to it in all kits/bundles. Missing references display an unavailable label in the UI, and validation fails so you can fix them before deployment. Missing/deleted products and excess quantities are removed or clamped when a saved cart is restored.

## Add a kit

A kit is one purchasable product with its own price, availability, SKU, and image. Its contents reference individual `component` products already in the file. `quantity: 2` means two of that component are inside each kit; it does not create two cart lines. Package availability is managed independently. There is no server-side inventory reservation.

This complete sample already exists. It includes 1 CPU, 1 motherboard, 2 RAM modules, 1 CPU cooler, and 1 power supply. All five referenced IDs exist in the supplied catalog:

```json
{
  "id": "cpu-kit",
  "type": "kit",
  "name": {
    "en": "CPU Starter Kit",
    "ar": "طقم بناء حاسوب للمبتدئين"
  },
  "description": {
    "en": "A compatible AM4 foundation. Everything you need to start building a desktop.",
    "ar": "أساس متوافق بمقبس AM4. كل ما تحتاجه لتبدأ بناء حاسوب مكتبي."
  },
  "price": 349,
  "discountPrice": null,
  "currency": "USD",
  "sku": "VLT-CPU-KIT",
  "categoryId": "kits",
  "images": ["/images/products/cpu-kit.svg"],
  "inStock": true,
  "components": [
    {
      "productId": "cpu",
      "quantity": 1
    },
    {
      "productId": "motherboard",
      "quantity": 1
    },
    {
      "productId": "ram",
      "quantity": 2
    },
    {
      "productId": "cooler",
      "quantity": 1
    },
    {
      "productId": "psu",
      "quantity": 1
    }
  ]
}
```

Do not point kits to themselves or to other kits/bundles. `getKitComponents` resolves IDs dynamically; missing IDs never crash the component list. Use your own complete package photographs for real inventory.

## Add a discounted bundle

A bundle works like a kit but uses `type: "bundle"`. Set a regular `price` and a lower `discountPrice`; the latter is the price charged in the cart and WhatsApp message. It is one purchasable item. This example combines existing individual products:

```json
{
  "id": "robotics-bundle",
  "type": "bundle",
  "name": {
    "en": "Arduino Robotics Bundle",
    "ar": "حزمة روبوتات أردوينو"
  },
  "description": {
    "en": "Build something that moves. A carefully matched set for your first robot.",
    "ar": "اصنع شيئاً يتحرك. مجموعة متناسقة لبناء روبوتك الأول."
  },
  "price": 59,
  "discountPrice": 49,
  "currency": "USD",
  "sku": "VLT-ROBOTICS-BUNDLE",
  "categoryId": "kits",
  "images": ["/images/products/robotics-bundle.svg"],
  "inStock": true,
  "components": [
    {
      "productId": "arduino-uno",
      "quantity": 1
    },
    {
      "productId": "motor-12v",
      "quantity": 2
    },
    {
      "productId": "driver",
      "quantity": 1
    },
    {
      "productId": "ultrasonic",
      "quantity": 1
    },
    {
      "productId": "battery",
      "quantity": 1
    }
  ]
}
```

## Add a category

Open `data/categories.json` and add an object with a unique `id`, both names and descriptions, and a local image path. Then assign that ID to relevant products. Categories appear automatically in the landing cards and catalog filter. Initial IDs: `motors`, `microcontrollers`, `computing`, `sensors`, `components`, `kits`, `power`, `accessories`.

```json
{
  "id": "motors",
  "name": {
    "en": "Motors & Actuators",
    "ar": "المحركات والمشغلات"
  },
  "description": {
    "en": "Bring your ideas to life.",
    "ar": "حرّك أفكارك نحو الحياة."
  },
  "image": "/images/categories/motor.svg"
}
```

## Manage images

- Product images: `public/images/products/`. Category images: `public/images/categories/`. Logo: any local path under `public/images/`.
- Use simple lowercase filenames without spaces: `motor-12v-front.webp`.
- Supported formats: JPG/JPEG, PNG, WebP, AVIF, SVG. Recommended: 1000 × 800 pixels or a square 1000 × 1000 photograph on a plain light background.
- Write `/images/products/motor-12v-front.webp` in JSON. Do not include `public` in the URL. Filenames are case-sensitive on Linux.
- Example valid array: `["/images/products/uno.jpg", "/images/products/uno.svg"]`.
- Use relevant images you own or are licensed to use. Several supplied assets are custom component illustrations; Arduino/ESP32 photos and licenses are recorded in `public/images/ATTRIBUTION.md`. Replace illustrative sample imagery with exact stock photographs before selling.
- The UI uses consistent contained images and meaningful names as alt text. Unloadable images show a local electronics fallback rather than a broken icon. Validation checks local paths and file existence.

## Update store information

Edit `data/store.json`:

- `name.en` / `name.ar`: store names; `logo`: local logo image path.
- `tagline`, `description`, `about`, `copyright`, `contactNote`: English/Arabic objects. `contactNote` is the visible contact note.
- `hero.eyebrow`, `hero.title`, `hero.description`: bilingual landing copy. Use `\n` inside the title string to add a line break.
- `whatsapp`: your international phone number as digits only, including country code; no plus, spaces, or punctuation. Leave `""` to disable WhatsApp links. Set it before accepting orders. Never use a random third party's number.
- `email`: your real email. The contact form opens a prefilled draft in the visitor's email app; it does not submit to a server or guarantee delivery.
- `socials`: array such as `[{"name":"Instagram","url":"https://www.instagram.com/your_store/"}]`, using your own real profile. Empty `[]` hides social links.
- `currency`: three-letter code. Change every product's `currency` to match. Prices are not converted automatically.

WhatsApp ordering includes localized product names, SKUs, quantities, unit prices, line totals, and total. The visitor reviews/sends the generated message themselves. Confirm shipping, stock, taxes if applicable, and final totals manually. There are no payment or shipping calculations in this version.

`hero.productIds` is an ordered array of product IDs for the main and floating hero images; `hero.kitProductId` selects the kit banner image. Missing products use the fallback image.

## Technical specifications

Specifications are an array because each item needs a translated label and translated value. Technical part numbers may be identical in both languages. There is no fixed list of attributes. Copy the `specifications` array from the motor or Arduino examples above. A CPU example:

```json
[
  {
    "label": {
      "en": "Cores",
      "ar": "الأنوية"
    },
    "value": {
      "en": "6",
      "ar": "6"
    }
  },
  {
    "label": {
      "en": "Threads",
      "ar": "المسارات"
    },
    "value": {
      "en": "12",
      "ar": "12"
    }
  },
  {
    "label": {
      "en": "Socket",
      "ar": "المقبس"
    },
    "value": {
      "en": "AM4",
      "ar": "AM4"
    }
  }
]
```

## Common mistakes and troubleshooting

| Problem                  | Fix                                                                                                  |
| ------------------------ | ---------------------------------------------------------------------------------------------------- |
| Missing comma            | Put a comma between objects and between properties.                                                  |
| Extra comma              | Remove the comma after the final property or final array entry. JSON does not allow trailing commas. |
| Missing quotes           | Use straight double quotes around keys and text. Numbers and booleans have no quotes.                |
| Duplicate IDs            | Give each product/category a unique ID. Keep referenced IDs stable.                                  |
| Invalid category         | Copy an exact existing `id` from `categories.json`.                                                  |
| Missing component        | Add the referenced individual product or correct/remove the `productId`.                             |
| Invalid quantity         | Use positive whole numbers in components; use `inStock` for product availability.                   |
| Incorrect price          | Use a nonnegative number and a discount no greater than the regular price.                           |
| Broken image             | Check spelling, upper/lower case, file existence and the `/images/` prefix.                          |
| Edits not visible        | Save the file; refresh in development. Rebuild and redeploy production.                              |
| Order button unavailable | Put your real international digits-only number in `store.json`.                                      |
| Email app did not open   | Copy the displayed email into your own email app. A configured mail client is required.              |

Run `npm run validate:data` after editing. It reports JSON syntax errors, IDs, required translations, types, category/component references, quantities, prices, specification shape, currency consistency, and image paths/files. `npm run build` runs this validation first. VS Code also underlines JSON syntax errors. Fix the first reported issue and run again. A warning in the UI indicates structurally invalid but parseable content; invalid JSON syntax must be fixed before the application can compile. Do not put comments into JSON.

## Architecture and future work

`src/services/catalog.ts` exposes `getAllProducts`, `getProductById`, `getProductsByCategory`, `getFeaturedProducts`, `getAllCategories`, `getKitComponents`, and `getStoreInfo`. Replace this data access layer with an API later. UI components do not contain product records or contact information. `src/services/cart.ts` normalizes stored carts and calculates totals using integer cents. `src/services/validation.ts` is shared by runtime and the build-time validator.

The current routes use stable URL fragments: `#products`, `#kits`, and `#product/PRODUCT_ID`, with dialogs for detail views. Extra product pages/SEO, dashboards, uploads, inventory, checkout, customer accounts, and backend order management can be added later; none are falsely simulated here. To add a language later, extend the `Language` type, translations, all localized data, language switcher, formatter, and font/direction configuration.

See [README_AR.md](README_AR.md) for the Arabic guide.
