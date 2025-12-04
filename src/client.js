import { hydrateRoot } from "@wordpress/element";

import App from "./app";

import './style.scss';

const root = document.getElementById("wxr-root");

hydrateRoot(root, <App />);
