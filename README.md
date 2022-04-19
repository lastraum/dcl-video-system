
# dcl-video-system

This library makes it easier to switch on / off a live stream automatically and play a list of videos in a loop.

## Install

To use any of the helpers provided by this library:

1. Install it as an npm package. Run this command in your scene's project folder:

   ```
   npm install dcl-video-system
   ```

2. Add this line at the start of your game.ts file, or any other TypeScript files that require it:

   ```ts
   import * as vs from 'dcl-video-system'
   ```

## Usage

### Create the Video System
1. Create the video system passing in the configuration parameters:
```ts
let videoSystem = new vs.VideoSystem({
   emission: 1.2,
   type: vs.Types.LIVE,
   offType: vs.Types.PLAYLIST,
   liveLink: "https://streams.com/live/ets/livestream.m3u8",
   playList:[
     "https://player.vimeo.com/external/232323.m3u8?s=134343433434",
     "https://player.vimeo.com/external/11111.m3u8?s=1343434323434"]
})
```
2. To start the video system anywhere in your scene passing in an optional `volume` number
```ts
videoSystem.start(.1)
```
3. Add the `VideoSystem` material to your plane shapes
```ts
let ent = new Entity()
ent.addComponent(new PlaneShape())
ent.addComponent(videoSystem.mat)
ent.addComponent(new Transform({position: new Vector3(16,5,16), rotation:Quaternion.Euler(0,180,0), scale: new Vector3(16,9,1)}))
engine.addEntity(ent)
```


## Copyright info

This scene is protected with a standard Apache 2 licence. See the terms and conditions in the [LICENSE](/LICENSE) file.
