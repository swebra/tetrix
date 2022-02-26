import Phaser from "phaser";

import WebFontLoader from "webfontloader";

// https://blog.ourcade.co/posts/2020/phaser-3-google-fonts-webfontloader/
export class WebFontFile extends Phaser.Loader.File {
    fontNames: Array<string>;
    service: string;
    constructor(
        loader: Phaser.Loader.LoaderPlugin,
        fontNames: string | Array<string>,
        service = "google"
    ) {
        super(loader, {
            type: "webfont",
            key: fontNames.toString(),
        });

        this.fontNames = Array.isArray(fontNames) ? fontNames : [fontNames];
        this.service = service;
    }

    load() {
        const config: WebFontLoader.Config = {
            active: () => {
                this.loader.nextFile(this, true);
            },
            loading: () => {
                console.log("loading");
            },
            inactive: () => {
                this.loader.nextFile(this, false);
            },
        };

        switch (this.service) {
            case "google":
                config["google"] = {
                    families: this.fontNames,
                };
                break;

            default:
                throw new Error("Unsupported font service");
        }

        WebFontLoader.load(config);
    }
}
