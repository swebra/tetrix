import { SceneGameArena } from "./SceneGameArena";

export class ControlsUI {
  constructor(scene: SceneGameArena, keys: Array<string>) {
    let y: number = 550;
    let index: number = 0;
    let controlInfo = [
      "Move Left",
      "Move Right",
      "Move Down",
      "Rotate CCW",
      "Rotate CW",
      "Trade Action",
    ];

    for (let key of keys) {
      scene.add.image(50, y, key).setScale(0.2);

      scene.add
        .text(70, y - 10, controlInfo[index++], {
          fontSize: `20px`,
          fontFamily: "VT323",
        })
        .setTint(0xffffff);

      y += 40;
    }
  }
}
