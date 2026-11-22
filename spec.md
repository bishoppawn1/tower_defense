# Dead Current

Dead Current is a browser-based tower defense prototype. The player protects an outpost from waves of zombies, placing towers on the high ground beside a winding road with wide and narrow sections and spending supplies to build and upgrade defenses. The project runs as static files on GitHub Pages, with `index.html` as its entry point.

## Gameplay

- The player chooses one of three maps from the main menu and chooses when to begin each wave with the Start Wave button.
- Zombies enter from the left and move toward the outpost. Each zombie that reaches it damages the base. The game ends when base health reaches zero.
- Defeated zombies award supplies. Clearing a wave also grants a supply bonus. Each wave increases the number of enemies, and later waves introduce larger zombies and resistance to certain attacks. Insulated zombies are immune to lightning damage and stun. Armored zombies take reduced ballistic damage.
- Players can build during waves. Place a tower on clear high ground, then set a firing direction for sniper, shotgun, and rocket towers. Gun and lightning towers aim in all directions. Selecting a tower opens its two upgrade chains in a compact side panel and shows its firing coverage. Towers can be sold for 70% of supplies invested. The Cancel Placement button or Escape cancels placement, refunding a tower awaiting its firing direction.

## Towers

- Gun tower provides reliable single-target fire.
- Sniper tower attacks at long range and pierces a limited number of enemies.
- Shotgun tower fires a directional spread of pellets at short range.
- Rocket tower damages enemies in an area.
- Lightning tower chains between enemies and briefly stuns them.

- Barracks deploys soldiers onto nearby road during waves, with collision spacing between them. Soldiers fire low-damage ranged shots at nearby zombies, and nearby zombies chase soldiers and attack them in melee. Soldiers undeploy when the wave ends.
- Flamethrower burns enemies at short range.
- Cryo tower slows enemies with chilling rounds.
- Autocannon fires heavy shells.
- Toxic sprayer poisons enemies over time.

Each tower has two independent four-tier tower-specific upgrade chains, purchased in order. New zombie types are explained when first encountered. The design should allow more tower types later.

## Visual direction

The game uses simple pixel-art characters and structures. Each zombie or turret is drawn from a small number of blocky pixels, while the whole sprite rotates smoothly as it moves or aims. Zombies appear in different colors to distinguish enemy types. The desired horde movement should feel like a flowing swarm.

## Current implementation

`game.js` contains the canvas rendering, simulation, and controls. `style.css` styles the surrounding interface. Zombies enter through separate, unoccupied entrance lanes, choose between split routes, cross line-based checkpoints, and push apart when they collide. Gun, shotgun, sniper, and rocket rounds travel as projectiles and collide with zombies. Lightning uses an immediate effect. Further iteration can develop the flowing swarm behavior and balance.
