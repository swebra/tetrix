/**
 * @param coords A `[row, column]` coordinate pair
 * @param size The grid size in which the coordinates exist
 * @param ccRotations The number of clockwise rotations to perform
 * @returns The rotated coordinates
 */
export function rotateCoords(coords: [number, number], size: number, ccRotations: number): [number, number] {
    let maxCoord = size - 1;
    switch (ccRotations % 4) {
        case 1: // 90 degree clockwise
            return [maxCoord - coords[1], coords[0]];
        case 2: // 180 degree
            return [maxCoord - coords[0], maxCoord - coords[1]];
        case 3: // 90 degree counterclockwise
            return [coords[1], maxCoord - coords[0]];
        default: // 0 degree
            return coords;
    }
}
