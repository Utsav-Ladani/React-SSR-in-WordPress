<?php

$exports['render'] = function ($element) {
    global $props;

    echo call_user_func($element, $props);
};
