( function( blocks, components, editor, i18n, element ) {

	const el = element.createElement;

	/* Blocks */
	const registerBlockType   	= wp.blocks.registerBlockType;

	const InspectorControls 	= wp.editor.InspectorControls;
	const ColorSettings			= wp.editor.PanelColorSettings;

	const TextControl 			= wp.components.TextControl;
	const RadioControl       	= wp.components.RadioControl;
	const SelectControl			= wp.components.SelectControl;
	const ToggleControl			= wp.components.ToggleControl;
	const RangeControl			= wp.components.RangeControl;
	const SVG 					= wp.components.SVG;
	const Path 					= wp.components.Path;

	const apiFetch 				= wp.apiFetch;

	/* Register Block */
	registerBlockType( 'getbowtied/mc-posts-slider', {
		title: i18n.__( 'Posts Slider', 'merchandiser-extender' ),
		icon: el( SVG, { xmlns:'http://www.w3.org/2000/svg', viewBox:'0 0 24 24' },
				el( Path, { d:'M15 7v9h-5V7h5m6-2h-3v13h3V5zm-4 0H8v13h9V5zM7 5H4v13h3V5z' } ) 
			),
		category: 'merchandiser',
		supports: {
			align: [ 'center', 'wide', 'full' ],
		},
		attributes: {
			/* posts source */
			queryPosts: {
				type: 'string',
				default: '',
			},
			queryPostsLast: {
				type: 'string',
				default: '',
			},
			/* loader */
			isLoading: {
				type: 'bool',
				default: false,
			},
			/* Display by category */
			categoriesIDs: {
				type: 'string',
				default: ',',
			},
			categoriesSavedIDs: {
				type: 'string',
				default: '',
			},
			/* First Load */
			firstLoad: {
				type: 'boolean',
				default: true
			},
			/* Number of Posts */
			number: {
				type: 'number',
				default: '12'
			},
			/* Arrows */
			arrows: {
				type: 'boolean',
				default: true
			},
			/* Bullets */
			bullets: {
				type: 'boolean',
				default: true
			},
			/* Orderby */
			orderby: {
				type: 'string',
				default: 'date_desc'
			},
			/* Font Color */
			fontColor: {
	        	type: 'string',
	        	default: '#000'
	        },
	        /* Background Color */
	        backgroundColor: {
	        	type: 'string',
	        	default: '#fff'
	        },
		},

		edit: function( props ) {

			var attributes = props.attributes;

			attributes.doneFirstLoad 		= attributes.doneFirstLoad || false;
			attributes.categoryOptions 		= attributes.categoryOptions || [];
			attributes.doneFirstPostsLoad 	= attributes.doneFirstPostsLoad || false;
			attributes.result 				= attributes.result || [];
			attributes.selectedSlide 		= attributes.selectedSlide || 0;

			//==============================================================================
			//	Helper functions
			//==============================================================================

			function _sortCategories( index, arr, newarr = [], level = 0) {
				for ( let i = 0; i < arr.length; i++ ) {
					if ( arr[i].parent == index) {
						arr[i].level = level;
						newarr.push(arr[i]);
						_sortCategories(arr[i].value, arr, newarr, level + 1 );
					}
				}

				return newarr;
			}

			function _verifyCatIDs( optionsIDs ) {

				let catArr = attributes.categoriesIDs;
				let categoriesIDs = attributes.categoriesIDs;

				if( catArr.substr(0,1) == ',' ) {
					catArr = catArr.substr(1);
				}
				if( catArr.substr(catArr.length - 1) == ',' ) {
					catArr = catArr.substring(0, catArr.length - 1);
				}

				if( catArr != ',' && catArr != '' ) {

					let newCatArr = catArr.split(',');
					let newArr = [];
					for (let i = 0; i < newCatArr.length; i++) {
						if( optionsIDs.indexOf(newCatArr[i]) == -1 ) {
							categoriesIDs = categoriesIDs.replace(',' + newCatArr[i].toString() + ',', ',');
						}
					}
				}

				if( attributes.categoriesIDs != categoriesIDs ) {
					props.setAttributes({ queryPosts: _buildQuery(categoriesIDs, attributes.number, attributes.orderby) });
					props.setAttributes({ queryPostsLast: _buildQuery(categoriesIDs, attributes.number, attributes.orderby) });
				}

				props.setAttributes({ categoriesIDs: categoriesIDs });
				props.setAttributes({ categoriesSavedIDs: categoriesIDs });
			}

			function _buildQuery( arr, nr, order ) {
				let query = '/wp/v2/posts?per_page=' + nr;

				if( arr.substr(0,1) == ',' ) {
					arr = arr.substr(1);
				}
				if( arr.substr(arr.length - 1) == ',' ) {
					arr = arr.substring(0, arr.length - 1);
				}

				if( arr != ',' && arr != '' ) {
					query = '/wp/v2/posts?categories=' + arr + '&per_page=' + nr;
				}

				switch (order) {
					case 'date_asc':
						query += '&orderby=date&order=asc';
						break;
					case 'date_desc':
						query += '&orderby=date&order=desc';
						break;
					case 'title_asc':
						query += '&orderby=title&order=asc';
						break;
					case 'title_desc':
						query += '&orderby=title&order=desc';
						break;
					default: 
						break;
				}

				query += '&lang=' + posts_grid_vars.language;

				return query;
			}

			function _isChecked( needle, haystack ) {
				let idx = haystack.indexOf(needle.toString());
				if ( idx > - 1) {
					return true;
				}
				return false;
			}

			function _categoryClassName(parent, value) {
				if ( parent == 0) {
					return 'parent parent-' + value;
				} else {
					return 'child child-' + parent;
				}
			}

			function _isLoadingText(){
				if ( attributes.isLoading  === false ) {
					return i18n.__( 'Update', 'merchandiser-extender' );
				} else {
					return i18n.__( 'Updating', 'merchandiser-extender' );
				}
			}

			function _isDonePossible() {
				return ( (attributes.queryPosts.length == 0) || (attributes.queryPosts === attributes.queryPostsLast) );
			}

			function _isLoading() {
				if ( attributes.isLoading  === true ) {
					return 'is-busy';
				} else {
					return '';
				}
			}

			//==============================================================================
			//	Show posts functions
			//==============================================================================

			function getPosts() {
				let query = attributes.queryPosts;
				props.setAttributes({ queryPostsLast: query});

				if (query != '') {
					apiFetch({ path: query }).then(function (posts) {
						props.setAttributes({ result: posts});
						props.setAttributes({ isLoading: false});
						props.setAttributes({ doneFirstPostsLoad: true});
						props.setAttributes({ selectedSlide: 0});
					});
				}
			}

			function renderResults() {
				if ( attributes.firstLoad === true ) {
					apiFetch({ path: '/wp/v2/posts?per_page=12&orderby=date&order=desc&lang=' + posts_grid_vars.language }).then(function (posts) {
						props.setAttributes({ result: posts });
						props.setAttributes({ firstLoad: false });
						let query = '/wp/v2/posts?per_page=12&orderby=date&order=desc&lang=' + posts_grid_vars.language;
						props.setAttributes({queryPosts: query});
						props.setAttributes({ queryPostsLast: query});
					});
				}

				let posts = attributes.result;
				let postElements = [];
				let sliderElements = [];
				let wrapper = [];
				let count = 0;
				let selectedSlide = 0;
				let slide_no = 0;

				function isSelectedSlide( idx ) {
					if ( attributes.selectedSlide == idx ) {
						return 'selected';
					}
					else return '';
				}

				if( posts.length > 0) {

					for ( let i = 0; i < posts.length; i++ ) {

						var months = [
							i18n.__( 'January', 	'merchandiser-extender' ),
							i18n.__( 'February', 	'merchandiser-extender' ),
							i18n.__( 'March', 		'merchandiser-extender' ),
							i18n.__( 'April', 		'merchandiser-extender' ),
							i18n.__( 'May', 		'merchandiser-extender' ),
							i18n.__( 'June', 		'merchandiser-extender' ),
							i18n.__( 'July', 		'merchandiser-extender' ),
							i18n.__( 'August', 		'merchandiser-extender' ),
							i18n.__( 'September', 	'merchandiser-extender' ),
							i18n.__( 'October', 	'merchandiser-extender' ),
							i18n.__( 'November', 	'merchandiser-extender' ),
							i18n.__( 'December', 	'merchandiser-extender' )
							];

						let date = new Date(posts[i]['date']);
						date = months[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();

						let img = '';
						let img_class = 'gbt_18_mc_editor_posts_slider_noimg';
						if ( posts[i]['fimg_url'] ) { img = posts[i]['fimg_url']; img_class = 'gbt_18_mc_editor_posts_slider_with_img'; } else { img_class = 'gbt_18_mc_editor_posts_slider_noimg'; img = ''; };

						sliderElements.push(
							el( "div", 
								{
									key: 		'gbt_18_mc_editor_posts_slider_item_' + posts[i].id, 
									className: 	'gbt_18_mc_editor_posts_slider_item'
								},
								el( "div", 
									{
										key: 		'gbt_18_mc_editor_posts_slider_item_img',
										className: 	'gbt_18_mc_editor_posts_slider_item_img ' + img_class,
										style: 		{ backgroundImage: 'url(' + img + ')' }
									}
								),
								el( "div", 
									{
										key: 		'gbt_18_mc_editor_posts_slider_item_text',
										className: 	'gbt_18_mc_editor_posts_slider_item_text'
									},
									el( "a", 
										{
											key: 		'gbt_18_mc_editor_posts_slider_item_link',
											className: 	'gbt_18_mc_editor_posts_slider_item_link'
										},
										el( "span", 
											{ 
												key: 		'gbt_18_mc_editor_posts_slider_item_link_wrapper',
												className: 	'gbt_18_mc_editor_posts_slider_item_link_wrapper',
												style: { backgroundColor: attributes.backgroundColor }
											},
											el( "h4", 
												{
													key: 		'gbt_18_mc_editor_posts_slider_item_title',
													className:  'gbt_18_mc_editor_posts_slider_item_title',
													dangerouslySetInnerHTML: { __html: posts[i]['title']['rendered'] },
													style: { color: attributes.fontColor }
												}
											),
											el( "span", 
												{
													key: 		'gbt_18_mc_editor_posts_slider_item_date',
													className:  'gbt_18_mc_editor_posts_slider_item_date',
													dangerouslySetInnerHTML: { __html: date },
													style: { color: attributes.fontColor }
												}
											)
										),
									),
								)
							)
						);

						count++;

						if( count % 2 == 0 && count != posts.length) {
							wrapper.push(
								el( "div", 
									{
										key: 		'gbt_18_mc_editor_posts_slider_slide', 
										className: 	'gbt_18_mc_editor_posts_slider_slide ' + isSelectedSlide(slide_no)
									},
									sliderElements
								)
							);
							postElements.push(wrapper);
							wrapper = [];
							sliderElements = [];
							slide_no++;
						}
					}

					if( sliderElements != [] ) {
						wrapper.push(
							el( "div", 
								{
									key: 		'gbt_18_mc_editor_posts_slider_slide_', 
									className: 	'gbt_18_mc_editor_posts_slider_slide ' + isSelectedSlide(slide_no)
								},
								sliderElements
							)
						);
						postElements.push(wrapper);
						wrapper = [];
						sliderElements = [];
						slide_no++;
					}
				} 

				if( postElements.length > 1 ) {
					postElements.push(
						attributes.arrows && el( 'button',
							{
								key: 'swiper-button-prev',
								className: 'swiper-button-prev dashicon dashicons-arrow-left-alt2',
								onClick: function onClick() {
									const idx = attributes.selectedSlide;
									if ( idx - 1 >= 0) {
										props.setAttributes({ selectedSlide: idx - 1});
									} else {
										props.setAttributes({ selectedSlide: slide_no - 1});
									}
								}
							},
						),
						attributes.arrows && el( 'button',
							{
								key: 'swiper-button-next',
								className: 'swiper-button-next dashicon dashicons-arrow-right-alt2',
								onClick: function onClick() {
									const idx = attributes.selectedSlide;
									if ( idx + 1 < slide_no ) {
										props.setAttributes({ selectedSlide: idx + 1});
									} else {
										props.setAttributes({ selectedSlide: 0 });
									}
								}
							},
						),
					);
				}
				
				return postElements;
			}

			function getBullets() {

				let bullets = [];
				let posts = attributes.result;

				if( posts.length > 0) {

					for ( let i = 0; i < posts.length / 2; i++ ) {

						bullets.push(
							el( 'div',
								{
									key: 'swiper-pagination-bullet_' + i,
									className: 'swiper-pagination-bullet swiper-pagination-bullet-active'
								}
							),
						);
					}
				}

				return bullets;
			}

			//==============================================================================
			//	Display Categories
			//==============================================================================

			function getCategories() {

				let categories_list = [];
				let options = [];
				let optionsIDs = [];
				let sorted = [];
			
				apiFetch({ path: '/wp/v2/categories?per_page=-1&lang=' + posts_grid_vars.language }).then(function (categories) {

				 	for( let i = 0; i < categories.length; i++) {
	        			options[i] = {'label': categories[i].name.replace(/&amp;/g, '&'), 'value': categories[i].id, 'parent': categories[i].parent, 'count': categories[i].count };
				 		optionsIDs[i] = categories[i].id.toString();
				 	}

				 	sorted = _sortCategories(0, options);
		        	props.setAttributes({categoryOptions: sorted });
		        	_verifyCatIDs(optionsIDs);
		        	props.setAttributes({ doneFirstLoad: true});
				});
			}

			function renderCategories( parent = 0, level = 0 ) {
				let categoryElements = [];
				let catArr = attributes.categoryOptions;
				if ( catArr.length > 0 )
				{
					for ( let i = 0; i < catArr.length; i++ ) {
						 if ( catArr[i].parent !=  parent ) { continue; };
						categoryElements.push(
							el(
								'li',
								{
									className: 'level-' + catArr[i].level,
								},
								el(
								'label',
									{
										className: _categoryClassName( catArr[i].parent, catArr[i].value ) + ' ' + catArr[i].level,
									},
									el(
									'input', 
										{
											type:  'checkbox',
											key:   'category-checkbox-' + catArr[i].value,
											value: catArr[i].value,
											'data-index': i,
											'data-parent': catArr[i].parent,
											checked: _isChecked(','+catArr[i].value+',', attributes.categoriesIDs),
											onChange: function onChange(evt){
												let newCategoriesSelected = attributes.categoriesIDs;
												let index = newCategoriesSelected.indexOf(',' + evt.target.value + ',');
												if (evt.target.checked === true) {
													if (index == -1) {
														newCategoriesSelected += evt.target.value + ',';
													}
												} else {
													if (index > -1) {
														newCategoriesSelected = newCategoriesSelected.replace(',' + evt.target.value + ',', ',');
													}
												}
												props.setAttributes({ categoriesIDs: newCategoriesSelected });
												props.setAttributes({ queryPosts: _buildQuery(newCategoriesSelected, attributes.number, attributes.orderby) });
											},
										}, 
									),
									catArr[i].label,
									el(
										'sup',
										{},
										catArr[i].count,
									),
								),
								renderCategories( catArr[i].value, level+1)
							),
						);
					} 
				}	
				if (categoryElements.length > 0 ) {
					let wrapper = el('ul', {className: 'level-' + level}, categoryElements);
					return wrapper;		
				} else {
					return;
				}
			}

			return [
				el(
					InspectorControls,
					{
						key: 'mc-posts-slider-inspector'
					},
					el(
						'div',
						{
							className: 'main-inspector-wrapper',
						},
						el( 'label', { className: 'components-base-control__label' }, i18n.__('Categories:', 'merchandiser-extender') ),
						el(
							'div',
							{
								className: 'category-result-wrapper',
							},
							attributes.categoryOptions.length < 1 && attributes.doneFirstLoad === false && getCategories(),
							renderCategories(),
						),
						el(
							SelectControl,
							{
								key: 'mc-posts-slider-order-by',
								options:
									[
										{ value: 'title_asc',   label: i18n.__( 'Alphabetical Ascending', 'merchandiser-extender' ) },
										{ value: 'title_desc',  label: i18n.__( 'Alphabetical Descending', 'merchandiser-extender' ) },
										{ value: 'date_asc',   	label: i18n.__( 'Date Ascending', 'merchandiser-extender' ) },
										{ value: 'date_desc',  	label: i18n.__( 'Date Descending', 'merchandiser-extender' ) },
									],
	              				label: i18n.__( 'Order By', 'merchandiser-extender' ),
	              				value: attributes.orderby,
	              				onChange: function( value ) {
	              					props.setAttributes( { orderby: value } );
	              					let newCategoriesSelected = attributes.categoriesIDs;
									props.setAttributes({ queryPosts: _buildQuery(newCategoriesSelected, attributes.number, value) });
								},
							}
						),
						el(
							RangeControl,
							{
								key: "mc-posts-slider-number",
								className: 'range-wrapper',
								value: attributes.number,
								allowReset: false,
								initialPosition: 12,
								min: 1,
								max: 20,
								label: i18n.__( 'Number of Posts', 'merchandiser-extender' ),
								onChange: function onChange(newNumber){
									props.setAttributes( { number: newNumber } );
									let newCategoriesSelected = attributes.categoriesIDs;
									props.setAttributes({ queryPosts: _buildQuery(newCategoriesSelected, newNumber, attributes.orderby) });
								},
							}
						),
						el(
							'button',
							{
								className: 'render-results components-button is-button is-default is-primary is-large ' + _isLoading(),
								disabled: _isDonePossible(),
								onClick: function onChange(e) {
									props.setAttributes({ isLoading: true });
									props.setAttributes({ categoriesSavedIDs: attributes.categoriesIDs });
									getPosts();
								},
							},
							_isLoadingText(),
						),
						el( 'hr', {} ),
						el(
							ToggleControl,
							{
								key: "mc-posts-slider-arrows",
								checked: attributes.arrows,
								label: i18n.__( 'Navigation Arrows', 'merchandiser-extender' ),
								onChange: function( newArrows ) {
									props.setAttributes( { arrows: newArrows } );
								},
							}
						),
						el(
							ToggleControl,
							{
								key: "mc-posts-slider-bullets",
								checked: attributes.bullets,
								label: i18n.__( 'Navigation Bullets', 'merchandiser-extender' ),
								onChange: function( newBullets ) {
									props.setAttributes( { bullets: newBullets } );
								},
							}
						),
						el(
							ColorSettings,
							{
								key: 'gbt_18_mc_editor_posts_slider_colors',
								initialOpen: false,
								title: i18n.__( 'Colors', 'merchandiser-extender' ),
								colorSettings: [
									{ 
										label: i18n.__( 'Text Color', 'merchandiser-extender' ),
										value: attributes.fontColor,
										onChange: function( newColor) {
											props.setAttributes( { fontColor: newColor } );
										},
									},
									{ 
										label: i18n.__( 'Background Color', 'merchandiser-extender' ),
										value: attributes.backgroundColor,
										onChange: function( newColor) {
											props.setAttributes( { backgroundColor: newColor } );
										}
									}
								]
							},
						),
					),
				),
				el( 'div',
					{
						key: 		'gbt_18_mc_editor_posts_slider',
						className: 	'gbt_18_mc_editor_posts_slider'	
					},
					el(
						'div',
						{
							key: 		'gbt_18_mc_editor_posts_slider_wrapper',
							className: 	'gbt_18_mc_editor_posts_slider_wrapper',
						},
						attributes.result.length < 1 && attributes.doneFirstPostsLoad === false && getPosts(),
						renderResults(),
						attributes.bullets && el( 'div',
							{
								key: 		'swiper-pagination-bullets',
								className: 	'quickview-pagination swiper-pagination-clickable swiper-pagination-bullets'
							},
							getBullets()
						),
					),
				),
			];
		},

		save: function(props) {
			return null;
		}
	});

} )(
	window.wp.blocks,
	window.wp.components,
	window.wp.editor,
	window.wp.i18n,
	window.wp.element
);