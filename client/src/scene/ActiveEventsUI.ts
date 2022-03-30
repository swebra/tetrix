import { Scene } from "phaser";
import { TILE_SIZE, TILE_SCALE, BOARD_PX } from "common/shared";

import { Socket } from "socket.io-client";
import { ToClientEvents, ToServerEvents } from "common/messages/activeEvents";

type SocketActiveEvents = Socket<ToClientEvents, ToServerEvents>;

export class ActiveEventsUI {
    private spectatorDecision!: Phaser.GameObjects.BitmapText;
    private socket: SocketActiveEvents;
    private resetText?: NodeJS.Timeout;

    constructor(scene: Scene, socket: SocketActiveEvents) {
        const startX = 2 * TILE_SIZE + 7 * TILE_SCALE;
        const startY = BOARD_PX - 11 * TILE_SIZE;

        this.socket = socket;

        this.initListeners();

        scene.add.bitmapText(startX, startY, "brawl", "current event:");

        this.spectatorDecision = scene.add.bitmapText(
            startX,
            startY * 45,
            "brawl",
            "no active events"
        );
    }

    private initListeners() {
        this.socket.removeListener("decision");

        this.socket.on("decision", (votedDecision) => {
            if (this.resetText) {
                clearInterval(this.resetText);
            }

            this.spectatorDecision.setText(votedDecision);
            this.resetText = setTimeout(() => {
                this.spectatorDecision.setText("no active events");
            }, 20000);
        });
    }
}
