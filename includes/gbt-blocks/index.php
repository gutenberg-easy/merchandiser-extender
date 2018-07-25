<?php

// Shopkeeper Custom Gutenberg Blocks
 
add_filter( 'block_categories', function( $categories, $post ) {
	if ( $post->post_type !== 'post' && $post->post_type !== 'page' ) {
		return $categories;
	}
	return array_merge(
		array(
			array(
				'slug' => 'merchandiser',
				'title' => __( 'Merchandiser', 'gbt-blocks' ),
			),
		),
		$categories
	);
}, 10, 2 );

require_once 'latest_posts_grid/index.php';
require_once 'latest_posts_slider/index.php';
require_once 'banner/index.php';
require_once 'social-media-profiles/index.php';
// require_once 'slider/index.php';