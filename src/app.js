import { createElement, useState } from "@wordpress/element";
import { ToDoItem } from "./components/todo-item.js";

function Heading() {
    return createElement("h1", null, "WordPress x React SSR Integration");
}

function Description() {
    return createElement("p", null, "This is a simple React application rendered using PHP in SSR mode and hydrated on the client side using React.");
}

function ToDo(initialTodos) {
    const [todos, setTodos] = useState(initialTodos);
    const [newTodo, setNewTodo] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();

        if (newTodo.trim() === "") {
            return;
        }

        setTodos([{ 'id': todos.length + 1, 'title': newTodo, 'isDone': false }, ...todos]);
        setNewTodo("");
    }

    const handleChange = (e) => {
        setNewTodo(e.target.value);
    }

    const handleToggle = (id) => {
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