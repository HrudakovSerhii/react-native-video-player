import React, { Component } from 'react';
import {
	TouchableWithoutFeedback,
	TouchableHighlight,
	ImageBackground,
	PanResponder,
	StyleSheet,
	Animated,
	Easing,
	Image,
	View,
	Text
} from 'react-native';

import Video from 'react-native-video';
import _ from 'lodash';
import PropTypes from 'prop-types';

export default class VideoPlayer extends Component {
	static propTypes = {
		disableBack: PropTypes.bool,
		disableVolume: PropTypes.bool,
		disableFullscreen: PropTypes.bool,
		disableTimer: PropTypes.bool,
		disableSeekBar: PropTypes.bool,
		disablePlayPause: PropTypes.bool,
		style: PropTypes.object,
		seekColor: PropTypes.string,
		topControlStyle: PropTypes.object,
		topControlGroupStyle: PropTypes.object,
		bottomControlStyle: PropTypes.object,
		bottomControlGroupStyle: PropTypes.object,
		seekBarStyles: PropTypes.object,
		timerStyle: PropTypes.object,
		timerTextStyle: PropTypes.object,
		titleStyle: PropTypes.object,
		titleTextStyles: PropTypes.object,
		playPauseStyle: PropTypes.object,
		volumeStyles: PropTypes.object,
		fullscreenStyle: PropTypes.object,
		backStyles: PropTypes.object,
		videoStyle: PropTypes.object,
	};

	static defaultProps = {
		toggleResizeModeOnFullscreen:   true,
		playInBackground:               false,
		playWhenInactive:               false,
		showOnStart:                    true,
		resizeMode:                     'contain',
		paused:                         false,
		repeat:                         false,
		volume:                         1,
		muted:                          false,
		title:                          '',
		rate:                           1,
	};
	
	constructor( props ) {
		super( props );
		
		/**
		 * All of our values that are updated by the
		 * methods and listeners in this class
		 */
		this.state = {
			resizeMode: this.props.resizeMode,
			paused: this.props.paused,
			muted: this.props.muted,
			volume: this.props.volume,
			rate: this.props.rate,
			// Controls
			
			isFullscreen: this.props.resizeMode === 'cover' || false,
			showTimeRemaining: true,
			volumeTrackWidth: 0,
			lastScreenPress: 0,
			volumeFillWidth: 0,
			seekerFillWidth: 0,
			showControls: this.props.showOnStart,
			volumePosition: 0,
			seekerPosition: 0,
			volumeOffset: 0,
			seekerOffset: 0,
			seeking: false,
			loading: false,
			currentTime: 0,
			error: false,
			duration: 0,
		};
		
		/**
		 * Any options that can be set at init.
		 */
		this.opts = {
			playWhenInactive: this.props.playWhenInactive,
			playInBackground: this.props.playInBackground,
			repeat: this.props.repeat,
			title: this.props.title,
		};
		
		/**
		 * Our app listeners and associated methods
		 */
		this.events = {
			onError: this.props.onError || this._onError.bind( this ),
			onBack: this.props.onBack || this._onBack.bind( this ),
			onEnd: this.props.onEnd || this._onEnd.bind( this ),
			onScreenTouch: this._onScreenTouch.bind( this ),
			onEnterFullscreen: this.props.onEnterFullscreen,
			onExitFullscreen: this.props.onExitFullscreen,
			onLoadStart: this._onLoadStart.bind( this ),
			onProgress: this._onProgress.bind( this ),
			onLoad: this._onLoad.bind( this ),
			onPause: this.props.onPause,
			onPlay: this.props.onPlay,
		};
		
		/**
		 * Functions used throughout the application
		 */
		this.methods = {
			toggleFullscreen: this._toggleFullscreen.bind( this ),
			togglePlayPause: this._togglePlayPause.bind( this ),
			toggleControls: this._toggleControls.bind( this ),
			toggleTimer: this._toggleTimer.bind( this ),
		};
		
		/**
		 * Player information
		 */
		this.player = {
			controlTimeoutDelay: this.props.controlTimeout || 1500,
			volumePanResponder: PanResponder,
			seekPanResponder: PanResponder,
			controlTimeout: null,
			volumeWidth: 150,
			iconOffset: 0,
			seekWidth: 0,
			ref: Video,
		};
		
		/**
		 * Various animations
		 */
		const initialValue = this.props.showOnStart ? 1 : 0;

		this.animations = {
			bottomControl: {
				marginBottom: new Animated.Value( 0 ),
				opacity: new Animated.Value( initialValue ),
			},
			topControl: {
				marginTop: new Animated.Value( 0 ),
				opacity: new Animated.Value( initialValue ),
			},
			video: {
				opacity: new Animated.Value( 1 ),
			},
			loader: {
				rotate: new Animated.Value( 0 ),
				MAX_VALUE: 360,
			}
		};
		
		/**
		 * Various styles that be added... Will be modified
		 */
		// this.styles = {
		//     videoStyle: this.props.videoStyle || {},
		//     containerStyle: this.props.containerStyle || {}
		// };
		// const { videoStyle, containerStyle, topControlStyle, bottomControlStyle, topControlGroupStyle, bottomControlGroupStyle, titleStyles, volumeStyles, timerStyles, backStyles, seekbarStyles, playPauseStyle } = this.props;
	}
	
	
	
	/**
	 | -------------------------------------------------------
	 | Events
	 | -------------------------------------------------------
	 |
	 | These are the events that the <Video> component uses
	 | and can be overridden by assigning it as a prop.
	 | It is suggested that you override onEnd.
	 |
	 */
	
	/**
	 * When load starts we display a loading icon
	 * and show the controls.
	 */
	_onLoadStart() {
		// let state = this.state;
		// state.loading = true;
		this.loadAnimation();
		// this.setState( state ); // TODO: replaced, has to be checked
		this.setState({ loading: true });

		if ( typeof this.props.onLoadStart === 'function' ) {
			this.props.onLoadStart(...arguments);
		}
	}
	
	/**
	 * When load is finished we hide the load icon
	 * and hide the controls. We also set the
	 * video duration.
	 *
	 * @param {object} data The video meta data
	 */
	_onLoad( data = {} ) {
		// let state = this.state;
		
		// state.duration = data.duration;
		// state.loading = false;
		// this.setState( state ); // TODO: replaced, has to be checked
		const { showControls } = this.state;
		const { onLoad } = this.props;

		const duration = _.get(data, 'duration', 0);
		this.setState({ duration, loading: false });
		
		// if ( state.showControls ) {
		// 	this.setControlTimeout();
		// }
		if (showControls) {
			this.setControlTimeout();
		}
		
		// if ( typeof this.props.onLoad === 'function' ) {
		// 	this.props.onLoad(...arguments);
		// }
		if ( typeof onLoad === 'function' ) {
			onLoad(...arguments);
		}
	}
	
	/**
	 * For onprogress we fire listeners that
	 * update our seekBar and timer.
	 *
	 * @param {object} data The video meta data
	 */
	_onProgress( data = {} ) {
		// let state = this.state;
		// state.currentTime = data.currentTime;
		const { seeking } = this.state;
		const { onProgress } = this.props;
		const currentTime = _.get(data, 'currentTime', 0); // TODO: replaced, has to be checked
		
		// if ( ! state.seeking ) {
		// 	const position = this.calculateSeekerPosition();
		// 	this.setSeekerPosition(position);
		// }
		if ( !seeking ) {
			const position = this.calculateSeekerPosition();
			this.setSeekerPosition(position);
		}
		
		// if ( typeof this.props.onProgress === 'function' ) {
		// 	this.props.onProgress(...arguments);
		// }
		if ( typeof onProgress === 'function' ) {
			onProgress(...arguments);
		}
		
		// this.setState( state );
		this.setState({ currentTime });
	}
	
	/**
	 * It is suggested that you override this
	 * command so your app knows what to do.
	 * Either close the video or go to a
	 * new page.
	 */
	_onEnd() {}
	
	/**
	 * Set the error state to true which then
	 * changes our renderError function
	 *
	 * @param {object} err  Err obj returned from <Video> component
	 */
	_onError( err ) {
		// let state = this.state;
		// state.error = true;
		// state.loading = false;
		//
		// this.setState( state ); // TODO: replaced, has to be checked
		this.setState({ error: true, loading: false } );
	}
	
	/**
	 * This is a single and double tap listener
	 * when the user taps the screen anywhere.
	 * One tap toggles controls, two toggles
	 * fullscreen mode.
	 */
	_onScreenTouch() {
		// let state = this.state;
		// const time = new Date().getTime();
		// const delta =  time - state.lastScreenPress;
		//
		// if ( delta < 300 ) {
		// 	this.methods.toggleFullscreen();
		// }
		//
		// this.methods.toggleControls();
		// state.lastScreenPress = time;
		//
		// this.setState( state ); // TODO: rewrite, has to be checked
		const { lastScreenPress } = this.state;
		const { toggleFullscreen, toggleControls } = this.methods;

		const time = new Date().getTime();
		const delta =  time - lastScreenPress;

		if ( delta < 300 ) {
			toggleFullscreen();
		}

		toggleControls();

		this.setState({ lastScreenPress: time });
	}
	
	
	
	/**
	 | -------------------------------------------------------
	 | Methods
	 | -------------------------------------------------------
	 |
	 | These are all of our functions that interact with
	 | various parts of the class. Anything from
	 | calculating time remaining in a video
	 | to handling control operations.
	 |
	 */
	
	/**
	 * Set a timeout when the controls are shown
	 * that hides them after a length of time.
	 * Default is 15s
	 */
	setControlTimeout() {
		this.player.controlTimeout = setTimeout( ()=> {
			this._hideControls();
	}, this.player.controlTimeoutDelay );
	}
	
	/**
	 * Clear the hide controls timeout.
	 */
	clearControlTimeout() {
		clearTimeout( this.player.controlTimeout );
	}
	
	/**
	 * Reset the timer completely
	 */
	resetControlTimeout() {
		this.clearControlTimeout();
		this.setControlTimeout();
	}
	
	/**
	 * Animation to hide controls. We fade the
	 * display to 0 then move them off the
	 * screen so they're not interactable
	 */
	hideControlAnimation() {
		Animated.parallel([
			Animated.timing(
				this.animations.topControl.opacity,
				{ toValue: 0 }
			),
			Animated.timing(
				this.animations.topControl.marginTop,
				{ toValue: -100 }
			),
			Animated.timing(
				this.animations.bottomControl.opacity,
				{ toValue: 0 }
			),
			Animated.timing(
				this.animations.bottomControl.marginBottom,
				{ toValue: -100 }
			),
		]).start();
	}
	
	/**
	 * Animation to show controls...opposite of
	 * above...move onto the screen and then
	 * fade in.
	 */
	showControlAnimation() {
		Animated.parallel([
			Animated.timing(
				this.animations.topControl.opacity,
				{ toValue: 1 }
			),
			Animated.timing(
				this.animations.topControl.marginTop,
				{ toValue: 0 }
			),
			Animated.timing(
				this.animations.bottomControl.opacity,
				{ toValue: 1 }
			),
			Animated.timing(
				this.animations.bottomControl.marginBottom,
				{ toValue: 0 }
			),
		]).start();
	}
	
	/**
	 * Loop animation to spin loader icon. If not loading then stop loop.
	 */
	loadAnimation() {
		if ( this.state.loading ) {
			Animated.sequence([
				Animated.timing(
					this.animations.loader.rotate,
					{
						toValue: this.animations.loader.MAX_VALUE,
						duration: 1500,
						easing: Easing.linear,
					}
				),
				Animated.timing(
					this.animations.loader.rotate,
					{
						toValue: 0,
						duration: 0,
						easing: Easing.linear,
					}
				),
			]).start( this.loadAnimation.bind( this ) );
		}
	}
	
	/**
	 * Function to hide the controls. Sets our
	 * state then calls the animation.
	 */
	_hideControls() {
		if(this.mounted) {
			// let state = this.state;
			// state.showControls = false; // TODO: rewrite, has to be checked
			this.hideControlAnimation();

			this.setState({ showControls: false });
		}
	}
	
	/**
	 * Function to toggle controls based on
	 * current state.
	 */
	_toggleControls() {
		// let state = this.state;
		// state.showControls = ! state.showControls; // TODO: rewrite, has to be checked
		const { showControls } = this.state;

		// if ( state.showControls ) {
		if ( showControls ) {
			this.showControlAnimation();
			this.setControlTimeout();
		}
		else {
			this.hideControlAnimation();
			this.clearControlTimeout();
		}
		// this.setState(state);
		this.setState({ showControls: !showControls });
	}
	
	/**
	 * Toggle fullscreen changes resizeMode on
	 * the <Video> component then updates the
	 * isFullscreen state.
	 */
	_toggleFullscreen() {
		let state = this.state;
		
		state.isFullscreen = ! state.isFullscreen;
		
		if (this.props.toggleResizeModeOnFullscreen) {
			state.resizeMode = state.isFullscreen === true ? 'cover' : 'contain';
		}
		
		if (state.isFullscreen) {
			typeof this.events.onEnterFullscreen === 'function' && this.events.onEnterFullscreen();
		}
		else {
			typeof this.events.onExitFullscreen === 'function' && this.events.onExitFullscreen();
		}
		
		this.setState( state );
	}
	
	/**
	 * Toggle playing state on <Video> component
	 */
	_togglePlayPause() {
		let state = this.state;
		state.paused = !state.paused;
		
		if (state.paused) {
			typeof this.events.onPause === 'function' && this.events.onPause();
		}
		else {
			typeof this.events.onPlay === 'function' && this.events.onPlay();
		}
		
		this.setState( state );
	}
	
	/**
	 * Toggle between showing time remaining or
	 * video duration in the timer control
	 */
	_toggleTimer() {
		let state = this.state;
		state.showTimeRemaining = ! state.showTimeRemaining;
		this.setState( state );
	}
	
	/**
	 * The default 'onBack' function pops the navigator
	 * and as such the video player requires a
	 * navigator prop by default.
	 */
	_onBack() {
		if ( this.props.navigator && this.props.navigator.pop ) {
			this.props.navigator.pop();
		}
		else {
			console.warn( 'Warning: _onBack requires navigator property to function. Either modify the onBack prop or pass a navigator prop' );
		}
	}
	
	/**
	 * Calculate the time to show in the timer area
	 * based on if they want to see time remaining
	 * or duration. Formatted to look as 00:00.
	 */
	calculateTime() {
		if ( this.state.showTimeRemaining ) {
			const time = this.state.duration - this.state.currentTime;
			return `${ this.formatTime( time ) }`;
		}
		
		return this.formatTime( this.state.currentTime );
	}
	
	/**
	 * Format a time string as mm:ss
	 *
	 * @param {int} time time in milliseconds
	 * @return {string} formatted time string in mm:ss format
	 */
	formatTime( time = 0 ) {
		const symbol = this.state.showTimeRemaining ? '-' : '';
		time = Math.min(
			Math.max( time, 0 ),
			this.state.duration
		);
		
		const formattedMinutes = _.padStart( Math.floor( time / 60 ).toFixed( 0 ), 2, 0 );
		const formattedSeconds = _.padStart( Math.floor( time % 60 ).toFixed( 0 ), 2 , 0 );
		
		return `${ symbol }${ formattedMinutes }:${ formattedSeconds }`;
	}
	
	/**
	 * Set the position of the seekbar's components
	 * (both fill and handle) according to the
	 * position supplied.
	 *
	 * @param {number} position position in px of seeker handle}
	 */
	setSeekerPosition( position = 0 ) {
		let state = this.state;
		position = this.constrainToSeekerMinMax( position );
		
		state.seekerFillWidth = position;
		state.seekerPosition = position;
		
		if ( ! state.seeking ) {
			state.seekerOffset = position
		};
		
		this.setState( state );
	}
	
	/**
	 * Contrain the location of the seeker to the
	 * min/max value based on how big the
	 * seeker is.
	 *
	 * @param {number} val position of seeker handle in px
	 * @return {number} constrained position of seeker handle in px
	 */
	constrainToSeekerMinMax( val = 0 ) {
		if ( val <= 0 ) {
			return 0;
		}
		else if ( val >= this.player.seekerWidth ) {
			return this.player.seekerWidth;
		}
		return val;
	}
	
	/**
	 * Calculate the position that the seeker should be
	 * at along its track.
	 *
	 * @return {number} position of seeker handle in px based on currentTime
	 */
	calculateSeekerPosition() {
		const percent = this.state.currentTime / this.state.duration;
		return this.player.seekerWidth * percent;
	}
	
	/**
	 * Return the time that the video should be at
	 * based on where the seeker handle is.
	 *
	 * @return {number} time in ms based on seekerPosition.
	 */
	calculateTimeFromSeekerPosition() {
		const percent = this.state.seekerPosition / this.player.seekerWidth;
		return this.state.duration * percent;
	}
	
	/**
	 * Seek to a time in the video.
	 *
	 * @param {number} time time to seek to in ms
	 */
	seekTo( time = 0 ) {
		let state = this.state;
		state.currentTime = time;
		this.player.ref.seek( time );
		this.setState( state );
	}
	
	/**
	 * Set the position of the volume slider
	 *
	 * @param {number} position position of the volume handle in px
	 */
	setVolumePosition( position = 0 ) {
		let state = this.state;
		position = this.constrainToVolumeMinMax( position );
		state.volumePosition = position + this.player.iconOffset;
		state.volumeFillWidth = position;
		
		state.volumeTrackWidth = this.player.volumeWidth - state.volumeFillWidth;
		
		if ( state.volumeFillWidth < 0 ) {
			state.volumeFillWidth = 0;
		}
		
		if ( state.volumeTrackWidth > 150 ) {
			state.volumeTrackWidth = 150;
		}
		
		this.setState( state );
	}
	
	/**
	 * Constrain the volume bar to the min/max of
	 * its track's width.
	 *
	 * @param {number} val position of the volume handle in px
	 * @return {number} constrained position of the volume handle in px
	 */
	constrainToVolumeMinMax( val = 0 ) {
		if ( val <= 0 ) {
			return 0;
		}
		else if ( val >= this.player.volumeWidth + 9 ) {
			return this.player.volumeWidth + 9;
		}
		return val;
	}
	
	/**
	 * Get the volume based on the position of the
	 * volume object.
	 *
	 * @return {number} volume level based on volume handle position
	 */
	calculateVolumeFromVolumePosition() {
		return this.state.volumePosition / this.player.volumeWidth;
	}
	
	/**
	 * Get the position of the volume handle based
	 * on the volume
	 *
	 * @return {number} volume handle position in px based on volume
	 */
	calculateVolumePositionFromVolume() {
		return this.player.volumeWidth * this.state.volume;
	}
	
	
	
	/**
	 | -------------------------------------------------------
	 | React Component functions
	 | -------------------------------------------------------
	 |
	 | Here we're initializing our listeners and getting
	 | the component ready using the built-in React
	 | Component methods
	 |
	 */
	
	/**
	 * Before mounting, init our seekbar and volume bar
	 * pan responders.
	 */
	componentWillMount() {
		this.initSeekPanResponder();
		this.initVolumePanResponder();
	}
	
	/**
	 * To allow basic playback management from the outside
	 * we have to handle possible props changes to state changes
	 */
	componentWillReceiveProps(nextProps) {
		if (this.state.paused !== nextProps.paused ) {
			this.setState({
				paused: nextProps.paused
			})
		}
	}
	
	/**
	 * Upon mounting, calculate the position of the volume
	 * bar based on the volume property supplied to it.
	 */
	componentDidMount() {
		const position = this.calculateVolumePositionFromVolume();
		let state = this.state;
		this.setVolumePosition( position );
		state.volumeOffset = position;
		this.mounted = true;
		
		this.setState( state );
	}
	
	/**
	 * When the component is about to unmount kill the
	 * timeout less it fire in the prev/next scene
	 */
	componentWillUnmount() {
		this.mounted = false;
		this.clearControlTimeout();
	}
	
	/**
	 * Get our seekbar responder going
	 */
	initSeekPanResponder() {
		this.player.seekPanResponder = PanResponder.create({
			
			// Ask to be the responder.
			onStartShouldSetPanResponder: ( evt, gestureState ) => true,
			onMoveShouldSetPanResponder: ( evt, gestureState ) => true,
			
			/**
			 * When we start the pan tell the machine that we're
			 * seeking. This stops it from updating the seekbar
			 * position in the onProgress listener.
			 */
			onPanResponderGrant: ( evt, gestureState ) => {
			let state = this.state;
			this.clearControlTimeout();
			state.seeking = true;
			this.setState( state );
		},
		
		/**
		 * When panning, update the seekbar position, duh.
		 */
		onPanResponderMove: ( evt, gestureState ) => {
			const position = this.state.seekerOffset + gestureState.dx;
			this.setSeekerPosition( position );
		},
		
		/**
		 * On release we update the time and seek to it in the video.
		 * If you seek to the end of the video we fire the
		 * onEnd callback
		 */
		onPanResponderRelease: ( evt, gestureState ) => {
			const time = this.calculateTimeFromSeekerPosition();
			let state = this.state;
			if ( time >= state.duration && ! state.loading ) {
				state.paused = true;
				this.events.onEnd();
			} else {
				this.seekTo( time );
				this.setControlTimeout();
				state.seeking = false;
			}
			this.setState( state );
		}
	});
	}
	
	/**
	 * Initialize the volume pan responder.
	 */
	initVolumePanResponder() {
		this.player.volumePanResponder = PanResponder.create({
			onStartShouldSetPanResponder: ( evt, gestureState ) => true,
			onMoveShouldSetPanResponder: ( evt, gestureState ) => true,
			onPanResponderGrant: ( evt, gestureState ) => {
			this.clearControlTimeout();
		},
		
		/**
		 * Update the volume as we change the position.
		 * If we go to 0 then turn on the mute prop
		 * to avoid that weird static-y sound.
		 */
		onPanResponderMove: ( evt, gestureState ) => {
			let state = this.state;
			const position = this.state.volumeOffset + gestureState.dx;
			
			this.setVolumePosition( position );
			state.volume = this.calculateVolumeFromVolumePosition();
			
			if ( state.volume <= 0 ) {
				state.muted = true;
			}
			else {
				state.muted = false;
			}
			
			this.setState( state );
		},
		
		/**
		 * Update the offset...
		 */
		onPanResponderRelease: ( evt, gestureState ) => {
			let state = this.state;
			state.volumeOffset = state.volumePosition;
			this.setControlTimeout();
			this.setState( state );
		}
	});
	}
	
	
	/**
	 | -------------------------------------------------------
	 | Rendering
	 | -------------------------------------------------------
	 |
	 | This section contains all of our render methods.
	 | In addition to the typical React render func
	 | we also have all the render methods for
	 | the controls.
	 |
	 */
	
	/**
	 * Standard render control function that handles
	 * everything except the sliders. Adds a
	 * consistent <TouchableHighlight>
	 * wrapper and styling.
	 */
	renderControl( children, callback, style = {} ) {
		return (
			<TouchableHighlight
		underlayColor="transparent"
		activeOpacity={ 0.3 }
		onPress={()=>{
			this.resetControlTimeout();
			callback();
		}}
		style={[
				styles.controls.control,
			style
	]}
	>
		{ children }
	</TouchableHighlight>
	);
	}
	
	/**
	 * Renders an empty control, used to disable a control without breaking the view layout.
	 */
	renderNullControl() {
		return (
			<View style={[ styles.controls.control ]} />
	);
	}
	
	/**
	 * Groups the top bar controls together in an animated
	 * view and spaces them out.
	 */
	renderTopControls() {
		const backControl = this.props.disableBack ? this.renderNullControl() : this.renderBack();
		const volumeControl = this.props.disableVolume ? this.renderNullControl() : this.renderVolume();
		const fullscreenControl = this.props.disableFullscreen ? this.renderNullControl() : this.renderFullscreen();
		const customTopControlStyle = this.props.topControlStyle || {};
		const customTopControlGroupStyle = this.props.topControlGroupStyle || {};
		
		return(
			<Animated.View style={[
				styles.controls.top,
			customTopControlStyle,
		{
			opacity: this.animations.topControl.opacity,
				marginTop: this.animations.topControl.marginTop,
		}
	]}>
	<ImageBackground
		source={ require( './assets/img/top-vignette.png' ) }
		style={[ styles.controls.column ]}
		imageStyle={[ styles.controls.vignette ]}>
			<View style={[ styles.controls.topControlGroup, customTopControlGroupStyle] }>
		{ backControl }
	<View style={ styles.controls.pullRight }>
			{ volumeControl }
		{ fullscreenControl }
	</View>
		</View>
		</ImageBackground>
		</Animated.View>
	);
	}
	
	/**
	 * Back button control
	 */
	renderBack() {
		const backStyles = [
			styles.controls.back,
			this.props.backStyles || {}
		];
		
		return this.renderControl(
			<Image
		source={ require( './assets/img/back.png' ) }
		style={ styles.controls.back }
		/>,
		this.events.onBack,
			backStyles
	);
	}
	
	/**
	 * Render the volume slider and attach the pan handlers
	 */
	renderVolume() {
		const volumeStyles = _.assign(styles.volume, this.props.volumeStyles || {});
		
		return (
			<View style={ volumeStyles.container }>
			<View style={[
				volumeStyles.fill,
		{ width: this.state.volumeFillWidth }
	]}/>
		<View style={[
				volumeStyles.track,
		{ width: this.state.volumeTrackWidth }
	]}/>
		<View
		style={[
				volumeStyles.handle,
		{ left: this.state.volumePosition }
	]}
		{ ...this.player.volumePanResponder.panHandlers }
	>
	<Image style={ volumeStyles.icon } source={ require( './assets/img/volume.png' ) } />
		</View>
		</View>
	);
	}
	
	/**
	 * Render fullscreen toggle and set icon based on the fullscreen state.
	 */
	renderFullscreen() {
		const fullscreenStyle = [
			styles.controls.fullscreen,
			this.props.fullscreenStyle || {},
		];
		
		const source = this.state.isFullscreen === true ? require( './assets/img/shrink.png' ) : require( './assets/img/expand.png' );
		
		return this.renderControl(
			<Image source={ source } />,
		this.methods.toggleFullscreen,
			fullscreenStyle
	);
	}
	
	/**
	 * Render bottom control group and wrap it in a holder
	 */
	renderBottomControls() {
		const timerControl = this.props.disableTimer ? this.renderNullControl() : this.renderTimer();
		const seekbarControl = this.props.disableSeekBar ? this.renderNullControl() : this.renderSeekbar();
		const playPauseControl = this.props.disablePlayPause ? this.renderNullControl() : this.renderPlayPause();
		const customBottomControlStyle = this.props.bottomControlStyle || {};
		const customBottomControlGroupStyle = this.props.bottomControlGroupStyle || {};
		
		return(
			<Animated.View style={[
				styles.controls.bottom,
			customBottomControlStyle,
		{
			opacity: this.animations.bottomControl.opacity,
				marginBottom: this.animations.bottomControl.marginBottom,
		}
	]}>
	<View style={[
				styles.controls.row,
			styles.controls.bottomControlGroup,
			customBottomControlGroupStyle,
	]}>
		{ this.renderTitle() }
		{ playPauseControl }
		{ seekbarControl }
		{ timerControl }
	</View>
		</Animated.View>
	);
	}
	
	/**
	 * Render the seekbar and attach its handlers
	 */
	renderSeekbar() {
		const seekbarStyles = _.assign(styles.seekBar, this.props.seekBarStyles || {});
		
		return (
			<View style={ seekbarStyles.container }>
			<View
		style={ seekbarStyles.track }
		onLayout={ event => this.player.seekerWidth = event.nativeEvent.layout.width }
	>
	<View style={[
				seekbarStyles.fill,
		{
			width: this.state.seekerFillWidth,
				backgroundColor: this.props.seekColor || '#FFF'
		}
	]}/>
		</View>
		<View
		style={[
				seekbarStyles.handle,
		{ left: this.state.seekerPosition }
	]}
		{ ...this.player.seekPanResponder.panHandlers }
	>
	<View style={[
				seekbarStyles.circle,
		{ backgroundColor: this.props.seekColor || '#FFF' } ]}
		/>
		</View>
		</View>
	);
	}
	
	/**
	 * Render the play/pause button and show the respective icon
	 */
	renderPlayPause() {
		const playPauseStyle = _.assign(styles.controls.playPause, this.props.playPauseStyle || {});
		const source = this.state.paused === true ? require( './assets/img/play.png' ) : require( './assets/img/pause.png' );
		
		return this.renderControl(
			<Image source={ source } />,
		this.methods.togglePlayPause,
			playPauseStyle
	);
	}
	
	/**
	 * Render our title...if supplied.
	 */
	renderTitle() {
		if ( this.opts.title ) {
			return (
				<View style={[
					styles.controls.control,
				styles.controls.title,
				this.props.titleStyles,
		]}>
		<Text style={[
					styles.controls.text,
				styles.controls.titleText,
				this.props.titleTextStyles,
		]} numberOfLines={ 1 }>
				{ this.opts.title || '' }
				</Text>
				</View>
		);
		}
		
		return null;
	}
	
	/**
	 * Show our timer.
	 */
	renderTimer() {
		const timerStyle = [
			styles.controls.timer,
			this.props.timerStyle || {}
		];
		
		const timerTextStyle = [
			styles.controls.timerText,
			this.props.timerTextStyle || {}
		];
		
		return this.renderControl(
			<Text style={timerTextStyle}>
			{ this.calculateTime() }
			</Text>,
		this.methods.toggleTimer,
			timerStyle
	);
	}
	
	/**
	 * Show loading icon
	 */
	renderLoader() {
		if ( this.state.loading ) {
			return (
				<View style={ styles.loader.container }>
				<Animated.Image source={ require( './assets/img/loader-icon.png' ) } style={[
					styles.loader.icon,
			{ transform: [
				{ rotate: this.animations.loader.rotate.interpolate({
						inputRange: [ 0, 360 ],
						outputRange: [ '0deg', '360deg' ]
					})}
			]}
		]} />
			</View>
		);
		}
		return null;
	}
	
	renderError() {
		if ( this.state.error ) {
			return (
				<View style={ styles.error.container }>
				<Image source={ require( './assets/img/error-icon.png' ) } style={ styles.error.icon } />
			<Text style={ styles.error.text }>
				Video unavailable
			</Text>
			</View>
		);
		}
		return null;
	}
	
	/**
	 * Provide all of our options and render the whole component.
	 */
	render() {
		return (
			<TouchableWithoutFeedback
		onPress={ this.events.onScreenTouch }
		style={[ styles.player.container, this.props.style ]}
	>
	<View style={[ styles.player.container, this.props.style ]}>
	<Video
		{ ...this.props }
		ref={ videoPlayer => this.player.ref = videoPlayer }

		resizeMode={ this.state.resizeMode }
		volume={ this.state.volume }
		paused={ this.state.paused }
		muted={ this.state.muted }
		rate={ this.state.rate }

		onLoadStart={ this.events.onLoadStart }
		onProgress={ this.events.onProgress }
		onError={ this.events.onError }
		onLoad={ this.events.onLoad }
		onEnd={ this.events.onEnd }

		style={[ styles.player.video, this.props.videoStyle ]}
		source={ this.props.source }
		/>
		{ this.renderError() }
		{ this.renderTopControls() }
		{ this.renderLoader() }
		{ this.renderBottomControls() }
	</View>
		</TouchableWithoutFeedback>
	);
	}
}

/**
 * This object houses our styles. There's player
 * specific styles and control specific ones.
 * And then there's volume/seeker styles.
 */
const styles = {
	player: StyleSheet.create({
		container: {
			backgroundColor: '#000',
			flex: 1,
			alignSelf: 'stretch',
			justifyContent: 'space-between',
		},
		video: {
			overflow: 'hidden',
			position: 'absolute',
			top: 0,
			right: 0,
			bottom: 0,
			left: 0,
		},
	}),
	error: StyleSheet.create({
		container: {
			backgroundColor: 'rgba( 0, 0, 0, 0.5 )',
			position: 'absolute',
			top: 0,
			right: 0,
			bottom: 0,
			left: 0,
			justifyContent: 'center',
			alignItems: 'center',
		},
		icon: {
			marginBottom: 16,
		},
		text: {
			backgroundColor: 'transparent',
			color: '#f27474'
		},
	}),
	loader: StyleSheet.create({
		container: {
			position: 'absolute',
			top: 0,
			right: 0,
			bottom: 0,
			left: 0,
			alignItems: 'center',
			justifyContent: 'center',
		},
	}),
	controls: StyleSheet.create({
		row: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			height: null,
			width: null,
		},
		column: {
			flexDirection: 'column',
			alignItems: 'center',
			justifyContent: 'space-between',
			height: null,
			width: null,
		},
		vignette: {
			resizeMode: 'stretch'
		},
		control: {
			padding: 16,
		},
		text: {
			backgroundColor: 'transparent',
			color: '#FFF',
			fontSize: 14,
			textAlign: 'center',
		},
		pullRight: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center',
		},
		top: {
			flex: 0,
			height: 48,
			backgroundColor: 'black',
		},
		bottom: {
			alignItems: 'stretch',
			flex: 2,
			justifyContent: 'flex-end',
		},
		topControlGroup: {
			alignSelf: 'stretch',
			alignItems: 'center',
			justifyContent: 'space-between',
			flexDirection: 'row',
			width: null,
			margin: 12,
			marginBottom: 18,
		},
		bottomControlGroup: {
			flex: 1,
			justifyContent: 'space-between',
			marginLeft: 12,
			marginRight: 12,
			marginBottom: 0,
		},
		volume: {
			flexDirection: 'row',
		},
		fullscreen: {
			flexDirection: 'row',
		},
		playPause: {
			position: 'relative',
			width: 80,
			zIndex: 0
		},
		title: {
			alignItems: 'center',
			flex: 0.6,
			flexDirection: 'column',
			padding: 0,
		},
		titleText: {
			textAlign: 'center',
		},
		timer: {
			flex: 1,
			maxWidth: 80,
		},
		timerText: {
			backgroundColor: 'transparent',
			color: '#FFF',
			fontSize: 11,
			textAlign: 'right',
		},
		back: {
		
		}
	}),
	volume: StyleSheet.create({
		container: {
			alignItems: 'center',
			justifyContent: 'flex-start',
			flexDirection: 'row',
			height: 1,
			marginLeft: 20,
			marginRight: 20,
			width: 150,
		},
		track: {
			backgroundColor: '#333',
			height: 1,
			marginLeft: 7,
		},
		fill: {
			backgroundColor: '#FFF',
			height: 1,
		},
		handle: {
			position: 'absolute',
			marginTop: -24,
			marginLeft: -24,
			padding: 16,
		},
		icon: {
			marginLeft:7
		}
	}),
	seekBar: StyleSheet.create({
		container: {
			alignSelf: 'stretch',
			height: 28,
			marginLeft: 20,
			marginRight: 20
		},
		track: {
			backgroundColor: '#333',
			height: 1,
			position: 'relative',
			top: 14,
			width: '100%'
		},
		fill: {
			backgroundColor: '#FFF',
			height: 1,
			width: '100%'
		},
		handle: {
			position: 'absolute',
			marginLeft: -7,
			height: 28,
			width: 28,
		},
		circle: {
			borderRadius: 12,
			position: 'relative',
			top: 8, left: 8,
			height: 12,
			width: 12,
		},
	})
};
