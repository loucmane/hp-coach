# Design directions in the real app — shell step

Open the signed-in app with `?dev=1`, or run the Vite development server. The
existing dev gate remembers the query opt-in for the browser session. A saved
direction alone never enables dev mode.

Use **⌘K / Ctrl+K**, search for **Riktning**, and choose Folio, Instrument, Spår,
Lager, Svep, Samtal, Raster or Ljuskägla. The same nine choices, including
**vanliga appen**, appear under **Designriktning** on `/mer`. The active choice
is marked there. Selecting on `/mer` preserves that page; return home to see
the chosen direction.

The preview fills the viewport and keeps a small bottom strip available:
**Riktning: <Name> · Byt · Vanliga appen**. **Byt** opens all nine choices;
Escape closes it. **Vanliga appen** immediately restores routed content.
The strip reserves its own space so it does not cover a direction's navigation
or answer controls. Command Palette remains available above the preview.

| App route | Direction screen |
| --- | --- |
| `/` | 1 — Idag |
| `/drill` (with any search parameters) | 2 — Läsfråga |
| Every other route, including `/mer` | Normal routed app |

The shell uses the real app's light/dark preference. Theme changes inside a
direction write back to `uiStore.mode`. Below the existing 768px viewport
breakpoint it uses the phone layout; reader and studio viewports use desktop.
The preview uses the available viewport directly, without the bake-off's zoom
or simulated device frame.

This step still uses the directions' fixtures. In particular, `/drill?section=ORD`
shows the fixture reading question, not a real ORD session. Direction clicks
keep their existing local behavior: moving from reading to feedback changes
the local screen, not the URL. A router navigation to another covered path
resets the local screen to the map above. Unsupported screens keep the
direction's own placeholder. Preview answers do not record real attempts.

The selected key (`a`–`h`, or `null` for the normal app) is stored as JSON in
localStorage at `hpc-design-direction`. It is device-local and never enters
server-synced preferences. Invalid storage falls back to the normal app;
unavailable storage still allows switching for the current page lifetime.

The root, palette and settings page have no runtime static dependency on the
direction registry. Only a dev-enabled selection on a covered signed-in route
renders the dynamically imported shell. The shell dynamically loads the registry,
which lazy-loads the chosen stage. A source guard checks the eager imports and
keeps the lightweight choice labels aligned with the registry.

While the shell chunk loads, a neutral loading view offers **Vanliga appen**.
The actual routed screen stays unmounted so an auto-start drill cannot start
a real session during preview loading. While a stage loads, the shell shows
a loading message and its exit controls. If either
import rejects or a direction throws during rendering, an outer error boundary
restores normal routed content with a dismissable notice. The notice also lets
the owner turn off the saved direction; choosing another direction or leaving
the covered route resets the boundary.

Step 2 will connect the shared data view model from `hpf-qr0p.7`, replace fixture
reads with real app data and actions, and map direction navigation into real
router destinations. This shell does not change the direction components or
the standalone bake-off.
