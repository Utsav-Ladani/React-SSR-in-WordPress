<?php

/**
 * Plugin Name: React in PHP
 * Description: A simple plugin to load React in PHP.
 * Version: 1.0.0
 * Author: Utsav
 */

if (!defined('ABSPATH')) {
    exit;
}

define('SERVER_MODULES_DIR', plugin_dir_path(__FILE__) . 'php_modules');
define('SERVER_BUILD_DIR', plugin_dir_path(__FILE__) . 'build-server');
define('CLIENT_BUILD_DIR', plugin_dir_path(__FILE__) . 'build');
define('CLIENT_BUILD_URL', plugin_dir_url(__FILE__) . 'build');

function rip_register_menu()
{
    add_menu_page(
        'React in PHP',
        'React in PHP',
        'manage_options',
        'react-in-php',
        'rip_render_page',
        'dashicons-admin-generic',
        25
    );
}
add_action('admin_menu', 'rip_register_menu');

function rip_enqueue_scripts()
{
    $assets = require CLIENT_BUILD_DIR . '/client.asset.php';

    wp_enqueue_script(
        'react-in-php-client',
        CLIENT_BUILD_URL . '/client.js',
        $assets['dependencies'],
        $assets['version'],
        true
    );
}
add_action('admin_enqueue_scripts', 'rip_enqueue_scripts');

function rip_render_page()
{
    $snippet_file = SERVER_BUILD_DIR . '/server.php';

    echo '<div id="rip-root">';

    if (file_exists($snippet_file)) {
        require $snippet_file;
    } else {
        echo 'React content not found. Please run build.';
    }

    echo '</div>';
}
