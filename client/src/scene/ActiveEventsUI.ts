import { Scene } from "phaser";
import { BOARD_PX, TILE_SCALE } from "common/shared";

import { Socket } from "socket.io-client";
import { ToClientEvents, ToServerEvents } from "common/messages/activeEvents";

type SocketActiveEvents = Socket<ToClientEvents, ToServerEvents>;

export class ActiveEventsUI {
    private spectatorDecision!: Phaser.GameObjects.BitmapText;
    private socket: SocketActiveEvents;
    private resetText?: NodeJS.Timeout;

    constructor(scene: Scene, socket: SocketActiveEvents) {
        const startX = BOARD_PX - 101 * TILE_SCALE;
        const startY = BOARD_PX - 93 * TILE_SCALE;

        this.socket = socket;

        this.initListeners();

        this.spectatorDecision = scene.add.bitmapText(
            startX,
            startY,
            "brawl",
            "no active event"
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
                this.spectatorDecision.setText("no active event");
            }, 20000);
        });
    }
}
