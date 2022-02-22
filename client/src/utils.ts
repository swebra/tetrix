/**
 * @param coords A `[row, column]` coordinate pair
 * @param maxCoord The upper bound coordinate value
 * @param ccRotations The number of clockwise rotations to perform
 * @returns The rotated coordinates
 */
export function rotateCoords(coords: [number, number], maxCoord: number, ccRotations: number): [number, number] {
    switch (ccRotations % 4) {
        case 1: // 90 degree clockwise
            return [maxCoord - coords[1], coords[0]];
        case 2: // 180 degree
            return [maxCoord - coords[0], maxCoord - coords[1]];
        case 3: // 90 degree counterclockwise
            return [coords[1], maxCoord - coords[0]];
        default: // 0 degree
            return [coords[0], coords[1]];
    }
}
