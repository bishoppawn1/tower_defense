# Dead Current

Dead Current is a browser-based tower defense prototype. The player protects an outpost from waves of zombies, placing towers on the high ground beside a winding road with wide and narrow sections and spending supplies to build and upgrade defenses. The project runs as static files on GitHub Pages, with `index.html` as its entry point.

## Gameplay

- The player chooses one of five maps from the main menu and chooses when to begin each wave with the Start Wave button.
- Zombies enter from the left and move toward the outpost. Each zombie that reaches it damages the base. The game ends when base health reaches zero.
- Defeated zombies award supplies. Clearing a wave also grants a supply bonus. The first three waves contain 14, 24, and 36 zombies. Wave four has 48, and each subsequent wave adds 12. Each arrival fills the available space across the entrance. The time to the next group scales with the number that fit. Enemy health is fixed by tier and body type. Tier 1 through 5 walkers have 16, 40, 90, 200, and 450 HP respectively. The five tiers enter on waves 1, 5, 10, 16, and 24. Higher tiers join the roster alongside earlier tiers. Tier changes do not affect speed or resistances. The outline identifies the tier in motion. Tier 2 grows one pale shoulder, tier 3 has two broad copper plates, tier 4 has long twin golden horns, and tier 5 has a crown of violet spines. The face and forward hands carry the body type’s colors. Hovering over an enemy shows its tier and current and maximum HP. All walkers and resistance variants share a base speed of 46 world units per second. Runners appear from wave three with speed 88 and 72% of the corresponding walker tier’s health. Runners can appear in all five tiers. Brutes appear from wave four, with one per 50 enemies rounded down and a minimum of one. They move at 30, have nine times walker health, deal triple melee damage and cost five base health on a breach. Insulated zombies are immune to lightning and stun. Fireproof, frostproof, and hazmat zombies are immune to their matching attacks and effects. Armored zombies absorb 85% of bullet damage unless the attack bypasses armor. Blastproof zombies join on wave 13 and ignore rockets, mortars, and pulse waves, including their secondary effects. Brutes also ignore pulse waves.
- Players can build during waves. Place a tower on clear high ground, using the green and red placement overlay to see valid locations, then set a firing direction for sniper, shotgun, and rocket towers. Gun and lightning towers aim in all directions. Selecting a tower opens its two upgrade chains in a compact side panel and shows its firing coverage. Towers can be sold for 70% of supplies invested. The Cancel Placement button or Escape cancels placement, refunding a tower awaiting its firing direction.

## Maps

| Map | World size | Routes | Terrain and defense |
| --- | --- | --- | --- |
| Clover Meadow | 820 × 480 | 1 | Open grassland with one central bend for a first defense. |
| Blackpine Hollow | 980 × 680 | 2 linked approaches | A creek crosses the pine ridge. A side trail drops into the southern hollow. |
| Redstone Quarry | 1180 × 570 | 3 linked approaches | Two ramps link haul roads across stepped excavation terraces. |
| Bellwether Ruins | 1415 × 902 | 4 linked approaches | Alleys crisscross the old market. Streets converge at the square and fork again through the eastern blocks. |
| Saltmarsh Delta | 1784 × 847 | 4 linked approaches | Three cross-causeways and timber crossings connect the tidal channels. Towers can deploy on pontoons over the pools. |

Each map fits the viewport. World dimensions change the distances zombies travel and the ground each tower covers. Ruined buildings, quarry pits, roads, and occupied footprints block placement. Open water supports pontoon-mounted defenses with the same spacing as land. The menu previews the road layout before deployment.

## Towers

- Gun tower provides reliable single-target fire.
- Sniper tower attacks at long range and pierces a limited number of enemies.
- Shotgun tower fires a directional spread of pellets at short range.
- Rocket tower damages enemies in an area.
- Lightning tower chains between enemies and briefly stuns them.

- Barracks deploys soldiers onto nearby road every three seconds during waves, with collision spacing between them. Its base squad cap is three, rising to five and seven with reinforcement upgrades. Soldiers fire low-damage ranged shots at nearby zombies, and zombies chase soldiers ahead of them along the road and attack them in melee. Soldiers undeploy when the wave ends.
- Flamethrower projects a continuous visible jet. Damage ticks resolve in contact order, stop at the current pierce limit, and leave susceptible targets burning.
- Cryo tower slows enemies with chilling rounds.
- Autocannon fires heavy shells.
- Toxic sprayer poisons enemies over time.
- Minigun fires rapid bullets.
- Mortar launches slow explosive shells.
- Pulse tower shoves susceptible enemies and rolls an 8% chance per enemy to stun for 0.25 seconds. The Repulsor field track raises the chance to 10%, 12%, then 15%, with a one-second stun at tier five. Each enemy gets three seconds of recovery between pulse control effects, shared across towers. Hits during recovery still deal damage. A successful stun allows the shove to carry the enemy backward.

Each tower has two independent five-tier upgrade chains, purchased in order. Tiers cost 25, 55, 180, 400, and 3,600 supplies. Early tiers are affordable improvements. Late tiers unlock special abilities or larger combat bonuses. Tier five is a powerful specialization for each track. Both can coexist. From placement, players can buy repeatable damage (+4%), fire rate (+3%), and range (+2%) upgrades. Each rank adds its percentage of that stat before tuning. Later track multipliers apply equally to early and late tuning purchases. The first rank costs 20 supplies, then each purchase raises the next price on that tower by 15 across all three stats. Barracks training affects rifle damage, rifle fire rate, and patrol radius. All purchases count toward resale. New zombie types are explained when first encountered. The design should allow more tower types later.

## Visual direction

Dead Current uses smooth, illustrated terrain and top-down units. Pine groves, contour lines, and sandy roads distinguish the high ground from the horde’s routes. Each defense has a fixed foundation and a separate rotating assembly. Track purchases change its visible equipment tier by tier. Both sets of equipment appear on a mixed build. The armory and tower inspector use the same artwork as the battlefield. Zombies use the early walker’s angular face, dark brow, pale eyes, torn shoulders, and two fixed forward-reaching arms, redrawn with smooth outlines. Runners have a lean silhouette, striped vest, and a fixed sprinting pose. Brutes have broad armored shoulders. Body color identifies resistance, with additional helmet plating on armored zombies. The title screen shows the outpost lookout at dusk.

## Current implementation

`maps.js` defines dimensions, roads, and landmarks. `upgrades.js` defines tower stats, tiers, and repeatable training. `waves.js` assembles the wave roster, chooses free entrance positions, and defines enemy body stats. `art.js` draws the landscape, terrain, units, and combat effects. Static artwork and unit poses are cached at high resolution. `game.js` handles the simulation, controls, and frame composition. `style.css` styles the surrounding interface. Zombies spawn at continuous positions across free gaps at the entrance. A constant eastward pull carries them across open road. Bodies slide along the banks and exchange momentum when they collide. The minimap, painted road, placement rules, and bank collisions share the same tapered geometry. Position and momentum determine which outlet a body enters at a fork. Zombies carry no route assignments or checkpoint targets. A shared navigation field measures progress for soldier pursuit. Gun, shotgun, sniper, and rocket rounds travel as projectiles and collide with zombies. Lightning uses an immediate effect. Further iteration can develop the flowing swarm behavior and balance.
