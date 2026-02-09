import arcjet, {shield, detectBot, slidingWindow} from "@arcjet/node";

if (!process.env.ARCJET_KEY) {
    if (process.env.NODE_ENV !== 'test') {
        throw new Error(
            "ARCJET_KEY environment variable is not set. Please set it to your Arcjet API key."
        );
    }
    // Fallback test key or no-op—ensure arcjet() receives valid input
    process.env.ARCJET_KEY = "test-key-do-not-use";
}

const aj = arcjet({
    key: process.env.ARCJET_KEY,
    rules: [
        shield({mode: "LIVE"}),
        detectBot({
            mode: "LIVE",
            allow: [
                "CATEGORY:SEARCH_ENGINE",
                "CATEGORY:PREVIEW",
            ],
        }),
        slidingWindow({
            mode: "LIVE",
            interval: '2s',
            max: 5
        }),
    ],
});

export default aj;