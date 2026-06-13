# World Visualization Asset Boundary

## Background

The world module needs to let writers see the world's locations, factions, rules, and time changes visually. A geographic map in particular is easily misread as a real GIS map, but novel writing needs "narratively meaningful relative space," not precise latitude/longitude or professional cartography.

## Decision

The world map uses a **0–100 relative coordinate system** to express the positions of major locations:

- A larger `x` means farther east.
- A larger `y` means farther south.
- `directionHint` expresses north, south, east, west, center, or a diagonal bearing.
- `regionType` expresses continent, country, region, city, landmark, border, route, or other.
- `edges` express adjacency, passage, isolation, or control between locations, optionally with a route type.

This data is used to draw the major locations and connectivity of the novel world; it makes no promise of real geographic scale, boundary area, or precise distance.

## Current Rule

World visualization data comes preferentially from the structured world handbook:

1. `locations` generate map nodes and carry terrain, risk, narrative role, and controlling faction.
2. `locationControls` may generate control or boundary relationships between locations.
3. If the structured world is insufficient, legacy `geography/background` text generates conservative relative coordinates from location names and bearing words.
4. The AI visualization prompt must output cleanable map coordinates, not just a list of locations.

Frontend rendering rules:

- When `x/y` exist, draw the world-map layout.
- When coordinates are missing, fall back to an auto layout so old data is still presentable.
- A map node shows the location name, bearing, terrain, and a risk hint.
- Routes may be distinguished by type: road, river, sea route, teleport, trade road, military road, border, etc.

## Failure Modes

- If locations are only laid out in a circle, the user mistakes the system for a relationship graph and cannot grasp bearing.
- If relative coordinates are treated as real geographic coordinates, a false sense of precision is created.
- Without structured locations and relying only on free-text extraction, the map can only be a sketch and cannot express complete region boundaries.
- If the prompt does not ask for coordinates, the LLM tends to return a list of location names and the frontend can only fall back to a relationship graph.

## Related Modules

- `shared/types/world.ts`
- `server/src/services/world/worldVisualization.ts`
- `server/src/services/world/worldVisualizationSchema.ts`
- `server/src/prompting/prompts/world/world.prompts.ts`
- `client/src/pages/worlds/components/WorldVisualizationBoard.tsx`
