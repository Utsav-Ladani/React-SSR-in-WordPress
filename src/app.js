import { createElement } from "@wordpress/element";

function Heading() {
    return createElement("h1", null, "Heading");
}

function Description() {
    return createElement("p", null, "Description");
}

function Button() {
    return createElement("button", null, "Button");
}

export default function App() {
    return createElement(
        "div",
        null,
        Heading(),
        Description(),
        Button(),
    );
}