<?php

if ( ! defined( 'ABSPATH' ) ) exit; // Exit if accessed directly

//==============================================================================
//  Enqueue Editor Assets
//==============================================================================
add_action( 'enqueue_block_editor_assets', 'gbt_18_mc_slider_editor_assets' );
if ( ! function_exists( 'gbt_18_mc_slider_editor_assets' ) ) {
	function gbt_18_mc_slider_editor_assets() {

		wp_enqueue_script(
			'gbt_18_mc_slide_script',
			plugins_url( 'blocks/slide.js', __FILE__ ),
			array( 'wp-blocks', 'wp-i18n', 'wp-element' )
		);
		
		wp_enqueue_script(
			'gbt_18_mc_slider_script',
			plugins_url( 'blocks/slider.js', __FILE__ ),
			array( 'wp-blocks', 'wp-i18n', 'wp-element' )
		);

		wp_enqueue_style(
			'gbt_18_mc_slider_editor_styles',
			plugins_url( 'assets/css/backend/editor.css', __FILE__ ),
			array( 'wp-edit-blocks' )
		);
	}
}

//==============================================================================
//  Enqueue Frontend Assets
//==============================================================================
add_action( 'enqueue_block_assets', 'gbt_18_mc_slider_assets' );
if ( ! function_exists( 'gbt_18_mc_slider_assets' ) ) {
	function gbt_18_mc_slider_assets() {

		if( function_exists( 'mc_extender_vendor_scripts' ) ) {
			mc_extender_vendor_scripts();
		}

		wp_enqueue_style( 'merchandiser_swiper_style' );
		wp_enqueue_script( 'merchandiser_swiper_script' );
		
		wp_enqueue_style(
			'gbt_18_mc_slider_styles',
			plugins_url( 'assets/css/frontend/style.css', __FILE__ ),
			array()
		);

		wp_enqueue_script(
			'gbt_18_mc_slider_script',
			plugins_url( 'assets/js/slider.js', __FILE__ ),
			array( 'jquery' )
		);
	}
}