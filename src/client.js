import { hydrateRoot } from "@wordpress/element";

import App from "./app";

import './style.scss';

const root = document.getElementById("wxr-root");

const props = root.dataset.props ? JSON.parse(root.dataset.props) : {};

hydrateRoot(root, <App {...props} />);
