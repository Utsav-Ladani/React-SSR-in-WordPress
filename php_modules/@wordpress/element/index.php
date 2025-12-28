<?php

$exports['createElement'] = function ($tag, $props, ...$children) {
    // Build HTML attributes from props, excluding disallowed props
    $attrString = '';
    if (is_array($props) && $props !== null) {
        foreach ($props as $key => $value) {
            if (!in_array($key, ['onClick', 'onChange', 'onSubmit', 'key'])) {
                // Map className to class
                $attrKey = $key === 'className' ? 'class' : $key;
                $attrString .= ' ' . htmlspecialchars($attrKey) . '="' . htmlspecialchars($value) . '"';
            }
        }
    }

    return "<" . $tag . $attrString . ">" . implode("", $children) . "</" . $tag . ">";
};

$exports['useState'] = function ($initialValue) {
    return [$initialValue, function () {}];
};
