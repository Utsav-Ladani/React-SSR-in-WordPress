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
define('SERVER_BUILD_DIR', plugin_dir_path(__FILE__) . 'build');

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

function rip_render_page()
{
    $snippet_file = SERVER_BUILD_DIR . '/server.php';
?>
    <div class="wrap">
        <h1>React in PHP</h1>
        <div id="rip-root">
            <?php
            if (file_exists($snippet_file)) {
                require $snippet_file;
            } else {
                echo 'React content not found. Please run build.';
            }
            ?>
        </div>
    </div>
<?php
}
