# Dead Current

Dead Current is a browser-based tower defense prototype. The player protects an outpost from waves of zombies, placing towers on the high ground beside a winding road with wide and narrow sections and spending supplies to build and upgrade defenses. The project runs as static files on GitHub Pages, with `index.html` as its entry point.

## Gameplay

- The player chooses one of five maps from the main menu and chooses when to begin each wave with the Start Wave button.
- Zombies enter from the left and move toward the outpost. Each zombie that reaches it damages the base. The game ends when base health reaches zero.
- Defeated zombies award supplies. Clearing a wave also grants a supply bonus. The first three waves begin with fewer, slower, weaker zombies and ramp up gradually. Each wave increases the number of enemies, and later waves introduce larger zombies and resistance to certain attacks. Insulated zombies are immune to lightning and stun. Fireproof, frostproof, and hazmat zombies are immune to their matching attacks and effects. Armored zombies take reduced ballistic damage.
- Players can build during waves. Place a tower on clear high ground, using the green and red placement overlay to see valid locations, then set a firing direction for sniper, shotgun, and rocket towers. Gun and lightning towers aim in all directions. Selecting a tower opens its two upgrade chains in a compact side panel and shows its firing coverage. Towers can be sold for 70% of supplies invested. The Cancel Placement button or Escape cancels placement, refunding a tower awaiting its firing direction.

## Maps

| Map | World size | Routes | Terrain and defense |
| --- | --- | --- | --- |
| Clover Meadow | 820 × 480 | 1 | Open grassland with one central bend for a first defense. |
| Blackpine Hollow | 980 × 680 | 2 | A short ridge trail and a longer southern road through pine forest. |
| Redstone Quarry | 1180 × 570 | 3 | Haul roads on different terraces, separated by excavation pits. |
| Bellwether Ruins | 1160 × 820 | 4 | Asphalt streets skirt collapsed buildings and vacant lots. |
| Saltmarsh Delta | 1450 × 750 | 4 | Two causeways fork a second time, then rejoin toward the levee. |

Each map fits the viewport. World dimensions change the distances zombies travel and the ground each tower covers. Ruined buildings, quarry pits, and marsh pools block tower placement. The menu previews the road layout before deployment.

## Towers

- Gun tower provides reliable single-target fire.
- Sniper tower attacks at long range and pierces a limited number of enemies.
- Shotgun tower fires a directional spread of pellets at short range.
- Rocket tower damages enemies in an area.
- Lightning tower chains between enemies and briefly stuns them.

- Barracks deploys soldiers onto nearby road every three seconds during waves, with collision spacing between them. Its base squad cap is three, rising to five and seven with reinforcement upgrades. Soldiers fire low-damage ranged shots at nearby zombies, and zombies chase soldiers ahead of them along the road and attack them in melee. Soldiers undeploy when the wave ends.
- Flamethrower burns enemies at short range.
- Cryo tower slows enemies with chilling rounds.
- Autocannon fires heavy shells.
- Toxic sprayer poisons enemies over time.
- Minigun fires rapid bullets.
- Mortar launches slow explosive shells.
- Pulse tower pushes nearby zombies away.

Each tower has two independent four-tier upgrade chains, purchased in order. Tiers cost 25, 55, 180, and 400 supplies. Early tiers are affordable improvements. Late tiers unlock special abilities or larger combat bonuses. Finishing both tracks unlocks repeatable damage (+4%), fire rate (+3%), and range (+2%) upgrades. Each rank adds its percentage of the fully upgraded stat. The first rank costs 20 supplies, then each purchase raises the next price on that tower by 15 across all three stats. Barracks training affects rifle damage, rifle fire rate, and patrol radius. All purchases count toward resale. New zombie types are explained when first encountered. The design should allow more tower types later.

## Visual direction

Dead Current uses smooth, illustrated terrain and top-down units. Pine groves, contour lines, and sandy roads distinguish the high ground from the horde’s routes. Each defense has its own mechanical silhouette, shared between the armory, placement preview, and battlefield. Zombies use the early walker’s angular face, dark brow, pale eyes, torn shoulders, and two narrow forward-reaching arms, redrawn with smooth outlines. Body color identifies resistance, with additional helmet plating on armored zombies. The title screen shows the outpost lookout at dusk.

## Current implementation

`maps.js` defines dimensions, roads, and landmarks. `upgrades.js` defines tower stats, tiers, and repeatable training. `art.js` draws the landscape, terrain, units, and combat effects. Static artwork and unit poses are cached at high resolution. `game.js` handles the simulation, controls, and frame composition. `style.css` styles the surrounding interface. Zombies enter through separate, unoccupied entrance lanes, split between branches and follow a forward current with room to spread across each road, slide along the road boundaries, and push apart when they collide. A shared navigation field measures progress for soldier pursuit. Gun, shotgun, sniper, and rocket rounds travel as projectiles and collide with zombies. Lightning uses an immediate effect. Further iteration can develop the flowing swarm behavior and balance.
