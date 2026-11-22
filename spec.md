# Dead Current

Dead Current is a browser-based tower defense prototype. The player protects an outpost from waves of zombies, placing towers on the high ground beside a winding road with wide and narrow sections and spending supplies to build and upgrade defenses. The project runs as static files on GitHub Pages, with `index.html` as its entry point.

## Gameplay

- The player chooses one of five maps from the main menu and chooses when to begin each wave with the Start Wave button.
- Zombies enter from the left and move toward the outpost. Each zombie that reaches it damages the base. The game ends when base health reaches zero.
- Defeated zombies award supplies. Clearing a wave also grants a supply bonus. The first three waves begin with fewer, slower, weaker zombies and ramp up gradually. Each wave increases the number of enemies, and later waves introduce larger zombies and resistance to certain attacks. Insulated zombies are immune to lightning and stun. Fireproof, frostproof, and hazmat zombies are immune to their matching attacks and effects. Armored zombies take reduced ballistic damage.
- Players can build during waves. Place a tower on clear high ground, using the green and red placement overlay to see valid locations, then set a firing direction for sniper, shotgun, and rocket towers. Gun and lightning towers aim in all directions. Selecting a tower opens its two upgrade chains in a compact side panel and shows its firing coverage. Towers can be sold for 70% of supplies invested. The Cancel Placement button or Escape cancels placement, refunding a tower awaiting its firing direction.

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

Each tower has two independent four-tier tower-specific upgrade chains, purchased in order. New zombie types are explained when first encountered. The design should allow more tower types later.

## Visual direction

Dead Current uses smooth, illustrated terrain and top-down units. Pine groves, contour lines, and sandy roads distinguish the high ground from the horde’s routes. Each defense has its own mechanical silhouette, shared between the armory, placement preview, and battlefield. Zombies reach ahead with both arms as they move. Body color identifies resistance, with additional helmet plating on armored zombies. The title screen shows the outpost lookout at dusk.

## Current implementation

`art.js` draws the landscape, terrain, units, and combat effects. Static artwork and unit poses are cached at high resolution. `game.js` handles the simulation, controls, and frame composition. `style.css` styles the surrounding interface. Zombies enter through separate, unoccupied entrance lanes, move under a shared forward pull, slide along the road boundaries, and push apart when they collide. A shared navigation field measures progress for soldier pursuit. Gun, shotgun, sniper, and rocket rounds travel as projectiles and collide with zombies. Lightning uses an immediate effect. Further iteration can develop the flowing swarm behavior and balance.
