import { hijackEffects } from "stop-runaway-react-effects";

if (process.env.NODE_ENV !== "production") {
  hijackEffects();
}

require("./index.app");
