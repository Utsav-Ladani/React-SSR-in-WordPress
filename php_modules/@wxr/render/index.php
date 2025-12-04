<?php

function render($element)
{
    global $props;

    echo call_user_func($element, $props);
}
