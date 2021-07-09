## Summary

This module is designed to quickly and efficiently answer questions such as "How far can I move this turn? What enemies can I reach in the fewest actions? How can I best navigate difficult terrain?" I wrote it because I (not to mention the rest of my group) was tired of my pulling out Rulers, Blasts, and other helpers to figure out "Can I do _this_? Hmm, no, but maybe if I do it _this_ way ... nope, that doesn't work either. What about ..."

## Basic Usage

Click ![the button](https://media.githubusercontent.com/media/Nazrax/fvtt-combat-range-overlay/media/images/button.png) to toggle the Overlay on and off. Once the Overlay is enabled, it should Just Work™ with little to no interaction from you. By default, it assumes your weapon has a range of 5 feet; shift-click the button to change it for your currently selected token. Normally the overlay will reread your position at the end of your combat turn; control-click the button to force the Overlay to reposition. Display preferences are available in the module's Settings page.

## Understanding the Overlay

![legend](https://media.githubusercontent.com/media/Nazrax/fvtt-combat-range-overlay/media/images/legend.png)

The overlay in this image assumes a movement speed of 15ft/action and a weapon range of 10ft.

1. Tiles tinted blue can be reached in a single action.  
2. Tiles tinted yellow can be reached in 2 actions.  
3. Enemies circled in white can be attacked without moving.  
4. Enemies circled in blue can be attacked in a single move.  
5. Enemies circled in yellow can be attacked with 2 moves.  
6. Enemies circled in red require 3 or more movements to attack.  
7. All tokens (other than the selected token) in combat are annotated with their initiative order relative to the current token.  
8. The selected token is annotated with the currently selected weapon range.  

![single target](https://media.githubusercontent.com/media/Nazrax/fvtt-combat-range-overlay/media/images/one-target.png)

If a target is selected, tiles in your movement range _and_ in range of the target will be highlighted in white, and only tiles on the shortest path to the highlighted squares will remain tinted.  
If multiple targets are selected, only tiles in range of _all_ targeted enemies will be highlighted. If there's no way to hit all targeted enemies at once, the Overlay will display a warning and act as if no enemies are targeted.

## Use-cases

The Overlay is useful no matter what kind of character you're playing as:

### Melee

![](https://media.githubusercontent.com/media/Nazrax/fvtt-combat-range-overlay/media/images/obstructed-melee-initial.png)  
Suppose you're trying to decide between these two enemies.

![](https://media.githubusercontent.com/media/Nazrax/fvtt-combat-range-overlay/media/images/obstructed-melee-rulers.png)  
Both enemies are obstructed - one by difficult terrain, one by walls - so a straight ruler won't help you.

![](https://media.githubusercontent.com/media/Nazrax/fvtt-combat-range-overlay/media/images/obstructed-melee-rulers-with-waypoints.png)  
You'll need to use waypoints to get the true movement distances.

![](https://media.githubusercontent.com/media/Nazrax/fvtt-combat-range-overlay/media/images/obstructed-melee-overlay.png)  
Or you can use the Overlay to instantly see how many movement actions it'll take to attack each enemy.

### Archery

![](https://media.githubusercontent.com/media/Nazrax/fvtt-combat-range-overlay/media/images/archer-initial.png)  
You want to attack this enemy, and you'd like to get _just_ close enough to attack him without his being able to close the distance and attack you on his turn.

![](https://media.githubusercontent.com/media/Nazrax/fvtt-combat-range-overlay/media/images/archer-blast.png)  
You drop a Blast on his position and then move to a tile on the very edge of the Blast (of course, working with Blasts takes a lot of control palette switching, clicking, dragging, deleting ... it's kind of a pain).

![](https://media.githubusercontent.com/media/Nazrax/fvtt-combat-range-overlay/media/images/archer-overlay.png)  
Or you can use the Overlay to see where you can move to that's inside your attack range and move to the position that's nearest you.

### Magic

![](https://media.githubusercontent.com/media/Nazrax/fvtt-combat-range-overlay/media/images/electric-arc-initial.png)  
You want to cast Electric Arc (a 2 action, 2 target, 30ft range spell) on these two enemies. Where can you hit them both from? Are they close enough for you to hit them both? Can you reach a good spot in only one action so you'll have the two remaining actions to cast the spell?

![](https://media.githubusercontent.com/media/Nazrax/fvtt-combat-range-overlay/media/images/electric-arc-blasts.png)  
You could drop _two_ Blasts and then measure your distance to the overlapping tiles (with waypoints, of course - moving straight through that difficult terrain would be too much).

![](https://media.githubusercontent.com/media/Nazrax/fvtt-combat-range-overlay/media/images/electric-arc-overlay.png)  
Or you can use the Overlay to see where you can attack them both from and how far away the good spots are.

### Tactician

![](https://media.githubusercontent.com/media/Nazrax/fvtt-combat-range-overlay/media/images/tactician-initial.png)  
You're pretty sure you can kill any of these enemies on your turn, and you'd like to kill one that'll go before your teammate to reduce how many enemies there are to attack him (or you). Unfortunately, while the Combat Tracker shows initiative order it doesn't take positioning into account, and trying to figure out which entry in the Combat Tracker corresponds to combatant tokens can be a pain.

![](https://media.githubusercontent.com/media/Nazrax/fvtt-combat-range-overlay/media/images/tactician-overlay.png)  
Or you can use the Overlay to see who's close to you _and_ going before your teammate.
