import { createElement, useState } from "@wordpress/element";

function Heading() {
    return createElement("h1", null, "WordPress x React Integration");
}

function Description() {
    return createElement("p", null, "This is a simple React application rendered using PHP in SSR mode and hydrated on the client side using React.");
}

function Counter() {
    const [count, setCount] = useState(0);

    function handleClick() {
        setCount(count + 1);
    }

    return createElement(
        "button",
        {
            onClick: handleClick,
            className: "bg-blue-500 text-white px-4 py-2 rounded border-none hover:bg-blue-600 hover:cursor-pointer"
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
        createElement("h2", null, "Input Component"),
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

function ToDo(initialTodos) {
    const [todos, setTodos] = useState(initialTodos);
    const [newTodo, setNewTodo] = useState("");

    function handleSubmit(e) {
        e.preventDefault();

        if (newTodo.trim() === "") {
            return;
        }

        setTodos([...todos, { 'id': todos.length + 1, 'title': newTodo }]);
        setNewTodo("");
    }

    function handleChange(e) {
        setNewTodo(e.target.value);
    }

    return createElement(
        "form",
        { onSubmit: handleSubmit },
        createElement(
            "h2",
            null,
            "To-Do List"
        ),
        createElement(
            "input",
            {
                value: newTodo,
                onChange: handleChange,
                placeholder: "New todo",
                className: "border p-2 rounded mr-2"
            }
        ),
        createElement(
            "button",
            {
                className: "bg-blue-500 text-white px-4 py-2 rounded border-none hover:bg-blue-600 hover:cursor-pointer"
            },
            "Add Todo"
        ),
        createElement(
            "ul",
            { className: "mt-4 w-[200px]" },
            ...todos.map((todo) =>
                createElement("li", { key: todo.id, className: "bg-white py-1.5 px-2 rounded border border-gray-300 hover:scale-105 hover:cursor-pointer hover:border-blue-500" }, todo.title)
            )
        )
    );
}

export default function App(props) {
    return createElement(
        "div",
        {
            className: "py-4 px-2 space-y-4"
        },
        Heading(),
        Description(),
        Counter(),
        Input(),
        ToDo(props.todos),
    );
}