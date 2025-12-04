<?php

/**
 * Plugin Name: WordPress x React Integration
 * Description: A simple plugin to demonstrate server-side rendering of React components using PHP in WordPress admin.
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

function wxr_register_menu()
{
    add_menu_page(
        'React in PHP',
        'React in PHP',
        'manage_options',
        'wordpress-x-react',
        'wxr_render_page',
        'dashicons-art',
        25
    );
}
add_action('admin_menu', 'wxr_register_menu');

function wxr_enqueue_scripts()
{
    $assets = require CLIENT_BUILD_DIR . '/client.asset.php';

    wp_enqueue_script(
        'wordpress-x-react-client',
        CLIENT_BUILD_URL . '/client.js',
        $assets['dependencies'],
        $assets['version'],
        true
    );

    wp_enqueue_style(
        'wordpress-x-react-style',
        CLIENT_BUILD_URL . '/style-client.css',
        [],
        filemtime(CLIENT_BUILD_DIR . '/style-client.css')
    );
}
add_action('admin_enqueue_scripts', 'wxr_enqueue_scripts');

function wxr_render_page()
{
    $snippet_file = SERVER_BUILD_DIR . '/server.php';

    echo '<div id="wxr-root" class="tailwindcss">';

    if (file_exists($snippet_file)) {
        require $snippet_file;
    } else {
        echo 'React content not found. Please run build.';
    }

    echo '</div>';
}
