import { createElement, useState } from "@wordpress/element";

function Heading() {
    return createElement("h1", null, "WordPress x React Integration");
}

function Description() {
    return createElement("p", null, "This is a simple React application rendered using PHP in SSR mode and hydrated on the client side using React.");
}

function Button() {
    const [count, setCount] = useState(0);

    function handleClick() {
        setCount(count + 1);
    }

    return createElement(
        "button",
        {
            onClick: handleClick,
            className: "bg-blue-500 text-white px-4 py-2 rounded border-none"
        },
        "Count: " + count
    );
}

function Input() {
    const [value, setValue] = useState("");

    function handleChange(e) {
        setValue(e.target.value);
    }

    return createElement(
        "div",
        null,
        createElement(
            "input",
            {
                onChange: handleChange,
                placeholder: "Type something...",
                className: "border p-2 rounded"
            }),
        createElement("p", null, "Input value: " + value)
    );
}

export default function App() {
    return createElement(
        "div",
        {
            className: "py-4 px-2 space-y-4"
        },
        Heading(),
        Description(),
        Button(),
        Input(),
    );
}