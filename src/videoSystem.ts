
export enum VideoSystemTypes{
    LIVE,
    PLAYLIST,
    NONE
  }
  
  export type VideoSystemConfig = {
    type:VideoSystemTypes,
    offType:VideoSystemTypes,
    liveLink?:string,
    playlist?:string[],
    offImage?:string,
    emission:number,
    volume:number
    noLoop?:boolean,
    id: number | string,
    isLive?: boolean,
    playlistEnabled?:boolean,
    refreshRate?:number
  }
  
  export class VideoSystem{
    refresh = 5
    timer = 0
    live = false
    playing = false
    started = false
    texture: VideoTexture
    material: Material
    data:VideoSystemConfig
    playlist?:VideoPlaylist
  
    constructor(data:VideoSystemConfig){
        this.data = data
        log('video system data is', this.data)

        if(data.refreshRate){
            this.refresh = data.refreshRate
        }
        
        this.texture = new VideoTexture(new VideoClip(""))
        this.material = new Material()
        if(this.data.offType == VideoSystemTypes.PLAYLIST){
            this.playlist = new VideoPlaylist(this, this.material, this.data.playlist!, this.data.noLoop ? this.data.noLoop : undefined) 
        }
    }
    
    update(dt:number){
        if(this.started){
            if(this.timer > 0){
                this.timer -= dt
            }
            else{
                this.timer = this.refresh
                try{
                  executeTask((async()=>{
                      log('trying to fetch video link')
                      let res = await fetch(this.data.liveLink!)
                          if(res.status < 400){
                            this.playing = false
                            log("Currently Live. -> ", this.data.liveLink!)
                            this.goOnline() 
                        }
                        else{
                         // log('not live')
                          this.goOffline()
                        }
                  }))
                }
                catch(e){
                       log("video no live")
                }
            }
        }
    }
  
    setVolume(vol:number){
        this.data.volume = vol
      //   this.texture.volume = vol
        this.playlist!.setVolume(vol)
    }
  
    startLive(){
        if(this.data.type != VideoSystemTypes.LIVE && !this.started){
            this.data.type = VideoSystemTypes.LIVE
            this.start()
        }
    }
  
    goOnline(){
      if(!this.live){
        //  log("Intializing live screen.")
        log('online')
          this.live = true;
          let liveFeed = new VideoClip(this.data.liveLink!);
  
          log('live feed is ', + this.data.liveLink!)
  
          if(this.data.offType == VideoSystemTypes.PLAYLIST){
            if(this.playlist!.playing){
              this.playlist!.reset()
          }
          }
  
          this.texture.playing = false
          this.texture = new VideoTexture(liveFeed);
          this.texture.playing = true
          this.texture.volume = this.data.volume;
  
          this.material.albedoTexture = this.texture;
          this.material.emissiveTexture = this.texture;
          this.material.emissiveIntensity = this.data.emission
          this.material.emissiveColor = Color3.White()
          this.material.roughness = 1
      }   
    }
  
  
    goOffline(){
      if(!this.playing) {
          this.live = false;
          this.playing = true
          this.texture.playing = false
  
          if(this.data.offType == VideoSystemTypes.PLAYLIST){
              log('video system is offline, we need to play the playlist')
            this.playlist!.start()
          }
          else{
            this.texture = new VideoTexture(new VideoClip(""))
            this.playing = false
          }
  
          this.texture.volume = this.data.volume;
          this.material.albedoTexture = this.texture;
          this.material.emissiveTexture = this.texture;
  
          this.texture.playing = true
          this.texture.loop = true
          log('offline')
      }
    }
  
    stop(){
  
      log('stopping video system')
      log(this.data.type)
  
      switch(this.data.type){
        case VideoSystemTypes.LIVE:
          this.texture.playing = false
          this.live = false
          this.playing = false
          this.started = false
          engine.removeSystem(this)
          break;
      }
  
      if(this.playlist){
          this.playlist.stop()
        }
      }
  
    start(vol?:number){
      log('starting live system')
        this.started = true
        if(vol){
            this.data.volume = vol
        }
        if(this.data.type == VideoSystemTypes.LIVE){
            engine.addSystem(this)
        }
        else{
            log('need to start video system')
            this.playlist!.setVolume(this.data.volume ? this.data.volume : 1)
            this.playlist!.start()
        }
    }
  
    off(){
        log('we are here, lets turn off')
        this.texture = new VideoTexture(new VideoClip(""))
        this.material.albedoTexture = this.texture
        this.material.emissiveTexture = this.texture
        // if(this.data.offType == Types.IMAGE){
        //     log('need to display an image')
        //     this.material.albedoTexture = new Texture(this.data.offImage ? this.data.offImage : "")
        //     this.material.emissiveTexture = new Texture(this.data.offImage ? this.data.offImage : "")
        // }
    }
  }
  
  class VideoPlaylist{
  
    index = -1
    timer = 0
    playing = false
  
    parentSystem:VideoSystem
    material: Material
    texture:VideoTexture
    links: any
    exists = false
    volume: number = 0
    noLoop = false
  
    constructor(system:VideoSystem, mat:Material, links:string[], noLoop?:boolean){
        this.parentSystem = system
        this.material = mat
        this.links = links
        this.volume = system.data.volume
        this.texture = new VideoTexture(new VideoClip(this.links[0]))
        this.texture.volume = this.volume
        if(noLoop){
            this.noLoop = noLoop
        }
    }
  
    update(dt:number){
        if(this.playing){
            if(this.timer > 0){
                this.timer -= dt
            }
            else{            
                log('checking for video')
                this.index++
                
                if(this.noLoop){
                    if(this.index == 0){
                        this.timer = 500
                        this.playVideo(this.index)
                    }
                    else{
                        log('don playing video, switch to off mode')
                        this.stop()
                        this.parentSystem.off()
                    }
                }
                else{
                    if(this.index >= this.links.length){
                        log('we have reached the end of the video playlist; restart')
                        this.index = 0
                    }
                    this.timer = 500
                    this.playVideo(this.index)
                }
            }
        }
    }
  
    setVolume(vol:number){
        this.volume = vol
        this.texture.volume = vol 
    }
  
    stop(){
        this.playing = false
        this.texture.playing = false
        this.parentSystem.playing = false
        engine.removeSystem(this)
    }
  
    reset(){
        this.stop()
        this.timer = 0
        this.index = -1
    }
  
    start(){
        this.reset()
        this.playing = true
        this.parentSystem.playing = true
        engine.addSystem(this)
  
  
        onVideoEvent.add((data) => {
          if(data.videoStatus == 4){
              this.timer = data.totalVideoLength
              onVideoEvent.clear()
          }
        })
    }
  
    playVideo(index: number){
        log("playing new video in playlist")
        this.texture.playing = false
        this.texture = new VideoTexture(new VideoClip(this.links[this.index]))
        this.material.albedoTexture = this.texture
        this.material.emissiveTexture = this.texture
  
        this.material.emissiveIntensity = this.parentSystem.data.emission
        this.material.emissiveColor = Color3.White()
        this.material.roughness = 1
        this.texture.playing = true
        this.texture.volume = this.volume
  
        onVideoEvent.add((data) => {
          if(data.videoStatus == 4){
              this.timer = data.totalVideoLength
              onVideoEvent.clear()
          }
        })
    }
  
  }