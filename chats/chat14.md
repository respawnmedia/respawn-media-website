# Client Brands Update

_Started 2026-04-30 14:11 UTC_

---

## User

Atha Fragrances, Premium Wellness & Aromatherapy
Avias, Premium Kitchenware Brand
Bajoria Hospitality, Bespoke Catering & Hospitality
Chennai Grocers, Gourmet & Premium Grocery Retail
Chit Chaat Chai, Indian Street Food Cafe
Coconut, South Indian Restaurant
Kati Roll Shop, Quick Service Restaurant
Mantras, Pure Vegetarian Family Restaurant
Pakwan, Premium Family Restaurant
Saffron by Anu, Luxury Sweets & Gifting
Sree Mishti Bhog, Indian Sweets & Snacks
Suswani Bullion, Bullion & Jewelry
Tea Villa Cafe, Premium Cafe & Tea Lounge
Tissera, Artisanal Atelier for Men

Please update the “Brands that we have trusted” section by adding these client industries.

also please updatwe the instagram links

Atha Fragrances - https://www.instagram.com/athafragrances/

Avias - https://www.instagram.com/aviasindia/

Bajoria Hospitality - https://www.instagram.com/bajoriahospitality/

Chennai Grocers - https://www.instagram.com/chennaigrocers/

Chit Chaat Chai - https://www.instagram.com/chit.chaatchai/

Coconut - https://www.instagram.com/coconutlife.in/

Kati Roll Shop - https://www.instagram.com/thekatirollshop/

Mantras - https://www.instagram.com/mantraspureveg/

Pakwan - https://www.instagram.com/pakwanchennai/

Saffron by Anu - https://www.instagram.com/saffronbyanu/

Sree Mishti Bhog - https://www.instagram.com/sreemishtibhog/

Tea Villa Cafe - https://www.instagram.com/teavillacafechennai/

Tissera - https://www.instagram.com/tissera.in/

Tharun Kiron - https://www.instagram.com/tharunkironofficial/

## Assistant

I'll find the current website file and update the brands section.

_[tool: grep]_

_[tool: grep]_

_[tool: grep]_

I have enough info. Let me make a copy as v7 and update both the JSX source (lines 6633+) and the compiled JS (line 156+).

_[tool: copy_files]_

_[tool: read_file]_

Now I'll update the JSX source. Let me build the new client list with industries from the user and Instagram URLs:

_[tool: str_replace_edit]_

Now updating the compiled JS section (lines 156-258):

_[tool: str_replace_edit]_

_[tool: snip]_

Now let me check that the ClientChip renders the URL as a link (so Instagram links actually open):

_[tool: grep]_

Let me look at the ClientChip rendering to confirm the URL becomes an `<a>`:

_[tool: read_file]_

Good — the `<a href={client.url}>` already opens new tab and skips '#' links. Now let me ship it.

_[tool: done]_

Updated v7 — the "Brands That Have Trusted Us" section now uses the new industry descriptors and each chip links to the brand's Instagram (Ctrl VR, Spica, Suswani Bullion stay on `#` since no IG was provided). Tharun Kiron was already in the list and got the IG link too.

