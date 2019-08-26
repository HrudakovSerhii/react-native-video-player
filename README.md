# react-native-video-player
Video player based on `<Video>` component at [react-native-video](https://github.com/react-native-community/react-native-video). 

## Installation
Run `npm install --save react-native-video-player`
or `yarn add react-native-video-player`

No `link` required as this plugin use RN > 0.60

## Usage
The `<VideoPlayer>` component follows the API of the `<Video>` component at [react-native-video](https://github.com/react-native-community/react-native-video). It also takes a number of additional props which are outlined in the [API](#api) section.

For basic operation the `<VideoPlayer>` component requires a video source and a navigator property. The default back button functionality in the component relies on using the built-in `<Navigator>` functionality in React Native and pops the current scene off the stack. This can be overridden if desired, see the [API](#api) for more details.

```javascript
// At the top where our imports are...
import RNVideoPlayer from 'react-native-video-player';

// in the component's render() function
<RNVideoPlayer
    source={{ uri: 'https://vjs.zencdn.net/v/oceans.mp4' }}
    navigator={ this.props.navigator }
/>
```

To play a local file, use require syntax like so:

```js
<RNVideoPlayer source={ require('path/to/file') } />
```

## API
The `<RNVideoPlayer>` component can take a number of inputs to customize it as needed. They are outlined below:

### Props
You can pass any of the props that the `<Video />` component at [react-native-video](https://github.com/react-native-community/react-native-video) takes. Simply add them onto the `<RNVideoPlayer />` and it will pass them through to the `<Video />` component.

In addition, the `<RNVideoPlayer />` also takes these props:

| Prop                         | Type          | Default | Description                                                                                                                                                         |
| ---------------------------- | ------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| toggleResizeModeOnFullscreen | Boolean       | true    | If true, clicking the fullscreen button will toggle the `<Video />` component between cover/contain, set to false if you want to customize fullscreen behaviour     |
| controlTimeout               | Integer       | 15000   | Hide controls after X amount of time in milliseconds                                                                                                                |
| showOnStart                  | Boolean       | true    | Show or hide the controls on first render                                                                                                                           |
| navigator                    | Navigator     | null    | When using the default React Native navigator and do not override the `onBack` function, you'll need to pass the navigator to the VideoPlayer for it to function    |
| seekColor                    | String(#HEX)  | '#FFF'  | Fill/handle colour of the seekbar                                                                                                                                   |

### Style Props
You can use default styles that was used before (2.3.3) or specify your own styles for player controls:

| Prop                         | Type          | Default | Description                                                                                                                                                         |
| ---------------------------- | ------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| style                        | StyleSheet    | null    | React Native StyleSheet object that is appended to the video's parent `<View>`                                                                                      |
| videoStyle                   | StyleSheet    | null    | React Native StyleSheet object that is appended to the `<Video>` component                                                                                          |
| topControlStyle              | StyleSheet    | null    | React Native StyleSheet object that is appended to the `TopControls (Wrapper)` component                                                                                          |                                                                                                                       |

### Events
These are various events that you can hook into and fire functions on in the component:

| Callback           | Description                                                                        |
| ------------------ | ---------------------------------------------------------------------------------- |
| onEnterFullscreen  | Fired when the video enters fullscreen after the fullscreen button is pressed      |
| onExitFullscreen   | Fired when the video exits fullscreen after the fullscreen button is pressed       |
| onError            | Fired when an error is encountered when loading the video                          |
| onPause            | Fired when the video is paused after the play/pause button is pressed              |
| onPlay             | Fired when the video begins playing after the play/pause button is pressed         |
| onBack             | Function fired when back button is pressed, override if using custom navigation    |
| onEnd              | Fired when the video is complete                                                   |

### Controls
These are the various controls that you can turn on/off as needed. All of these props default to false, override them to disable any controls

| Control            | Description                                 |
| ------------------ | ------------------------------------------- |
| disableFullscreen  | Hide the fullscreen button                  |
| disablePlayPause   | Hide the play/pause toggle                  |
| disableSeekbar     | Hide the seekbar                            |
| disableVolume      | Hide the Volume control                     |
| disableTimer       | Hide the timer                              |
| disableBack        | Hide the back button                        |
