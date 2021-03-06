<?php

if ( ! class_exists( 'MCCustomCode' ) ) :

	/**
	 * MCCustomCode class.
	 *
	 * @since 1.3
	*/
	class MCCustomCode {

		/**
		 * The single instance of the class.
		 *
		 * @since 1.3
		 * @var MCCustomCode
		*/
		protected static $_instance = null;

		/**
		 * MCCustomCode constructor.
		 *
		 * @since 1.3
		*/
		public function __construct() {

			add_action('init', array( $this, 'import_options' ));

			$this->customizer_options();
		}

		/**
		 * Ensures only one instance of MCCustomCode is loaded or can be loaded.
		 *
		 * @since 1.3
		 *
		 * @return MCCustomCode
		*/
		public static function instance() {
			if ( is_null( self::$_instance ) ) {
				self::$_instance = new self();
			}
			return self::$_instance;
		}

		/**
		 * Imports custom code content stored as theme mods into the options WP table.
		 *
		 * @since 1.3
		 * @return void
		 */
		public function import_options() {

			if( !get_option( 'mc_custom_code_options_import', false ) ) {

				wp_update_custom_css_post( wp_get_custom_css() . ' ' . get_theme_mod( 'custom_css', '' ) );

				$custom_header_js_option = get_theme_mod( 'header_js', '' );
				update_option( 'mc_custom_code_header_js', $custom_header_js_option );

				$custom_footer_js_option = get_theme_mod( 'footer_js', '' );
				update_option( 'mc_custom_code_footer_js', $custom_footer_js_option );

				update_option( 'mc_custom_code_options_import', true );	
			}
		}

		/**
		 * Registers customizer options.
		 *
		 * @since 1.3
		 * @return void
		 */
		protected function customizer_options() {
			add_action( 'customize_register', array( $this, 'mc_custom_code_customizer' ) );
		}

		/**
		 * Creates customizer options.
		 *
		 * @since 1.3
		 * @return void
		 */
		public function mc_custom_code_customizer( $wp_customize ) {

			// Section
			$wp_customize->add_section( 'mc_custom_code', array(
		 		'title'       => esc_attr__( 'Additional JS', 'shopkeeper-extender' ),
		 		'priority'    => 201,
		 	) );

		 	$wp_customize->add_setting( 'mc_custom_code_header_js', array(
				'type'		 => 'option',
				'capability' => 'manage_options',
				'transport'  => 'refresh',
				'default' 	 => '',
			) );

			$wp_customize->add_control( 
				new WP_Customize_Code_Editor_Control(
					$wp_customize,
					'mc_custom_code_header_js',
					array( 
						'code_type' 	=> 'javascript',
						'label'       	=> esc_attr__( 'Header JavaScript Code', 'shopkeeper-extender' ),
						'section'     	=> 'mc_custom_code',
						'priority'    	=> 10,
					)
				)
			);

			$wp_customize->add_setting( 'mc_custom_code_footer_js', array(
				'type'		 => 'option',
				'capability' => 'manage_options',
				'transport'  => 'refresh',
				'default' 	 => '',
			) );

			$wp_customize->add_control( 
				new WP_Customize_Code_Editor_Control(
					$wp_customize,
					'mc_custom_code_footer_js',
					array( 
						'code_type' 	=> 'javascript',
						'label'       	=> esc_attr__( 'Footer JavaScript Code', 'shopkeeper-extender' ),
						'section'     	=> 'mc_custom_code',
						'priority'    	=> 10,
					)
				)
			);
		}
	}

endif;

$mc_custom_code = new MCCustomCode;