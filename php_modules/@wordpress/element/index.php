<?php

function createElement($tag, $props, ...$children)
{
    $children = is_array($children) ? implode("", $children) : $children;

    return "<" . $tag . ">" . $children . "</" . $tag . ">";
}
