import { createElement } from "@wordpress/element";

export function ToDoItem(todo, handleToggle) {
    const handleChange = () => {
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