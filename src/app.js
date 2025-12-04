import { createElement, useState } from "@wordpress/element";

function Heading() {
    return createElement("h1", null, "WordPress x React Integration");
}

function Description() {
    return createElement("p", null, "This is a simple React application rendered using PHP in SSR mode and hydrated on the client side using React.");
}

function ToDo(initialTodos) {
    const [todos, setTodos] = useState(initialTodos);
    const [newTodo, setNewTodo] = useState("");

    function handleSubmit(e) {
        e.preventDefault();

        if (newTodo.trim() === "") {
            return;
        }

        setTodos([{ 'id': todos.length + 1, 'title': newTodo, 'isDone': false }, ...todos]);
        setNewTodo("");
    }

    function handleChange(e) {
        setNewTodo(e.target.value);
    }

    function handleToggle(id) {
        const updatedTodos = todos.map((t) => {
            if (t.id === id) {
                return { ...t, "isDone": t.isDone === true ? false : true };
            }
            return t;
        });
        setTodos(updatedTodos);
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
                placeholder: "Enter new todo",
                className: "border p-2 rounded mr-2 w-[300px]"
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
            { className: "mt-4 w-[400px] !space-y-2" },
            ...todos.map((todo) => ToDoItem(todo, handleToggle)
            )
        )
    );
}

function ToDoItem(todo, handleToggle) {
    function handleChange() {
        handleToggle(todo.id);
    }

    return createElement(
        "li",
        { key: todo.id },
        createElement(
            "label",
            {className: "flex gap-2 bg-white py-2 px-2 rounded border border-gray-300 transition-transform duration-200 ease-in-out hover:scale-105 hover:border-blue-500 hover:cursor-pointer"},
            createElement("span", { className: todo.isDone ? "size-4 block box-border rounded-full shrink-0 bg-blue-400" : "size-4 block box-border rounded-full shrink-0 border border-gray-300" }, ''),
            createElement("input", { type: "checkbox", className: "mr-2 hidden", value: todo.isDone, onChange: handleChange }),
            createElement("span", { className: todo.isDone ? "line-through" : "" }, todo.title)
        ),
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
        ToDo(props.todos),
    );
}