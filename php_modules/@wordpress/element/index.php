<?php

const DISALLOWED_PROPS = ['onClick', 'onChange'];

function createElement($tag, $props, ...$children)
{
    // Build HTML attributes from props, excluding disallowed props
    $attrString = '';
    if (is_array($props) && $props !== null) {
        foreach ($props as $key => $value) {
            if (!in_array($key, DISALLOWED_PROPS)) {
                // Map className to class
                $attrKey = $key === 'className' ? 'class' : $key;
                $attrString .= ' ' . htmlspecialchars($attrKey) . '="' . htmlspecialchars($value) . '"';
            }
        }
    }
    
    return "<" . $tag . $attrString . ">" . implode("", $children) . "</" . $tag . ">";
}

function useState($initialValue)
{
    return [$initialValue, function (){}];
}
