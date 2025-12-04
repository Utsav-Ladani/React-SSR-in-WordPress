import { hydrateRoot } from "@wordpress/element";

import App from "./app";

const root = document.getElementById("rip-root");

hydrateRoot(root, <App />);
